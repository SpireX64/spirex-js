/** A union type representing either `null` or `undefined` */
export type TNullable = null | undefined;

/**
 * A union type representing values interpreted as `false` in boolean contexts.
 * These include `null`, `undefined`, `false`, and `0`.
 */
export type TFalsy = TNullable | false | 0;

/**
 * A delegate function representing a synchronous boot task.
 * This function performs an operation without returning a Promise.
 */
export type TBootTaskSyncDelegate = () => void;

/**
 * A delegate function representing an asynchronous boot task.
 * This function returns a Promise, signaling when the task is complete.
 */
export type TBootTaskAsyncDelegate = () => Promise<void>;

/** A union of synchronous and asynchronous boot task delegate functions. */
export type TBootTaskDelegate = TBootTaskSyncDelegate | TBootTaskAsyncDelegate;

export type TBootTask = {
    optional: boolean;
    priority: number;
    name: string;
    delegate: TBootTaskDelegate;
    dependencies: readonly TBootTaskDependency[];
};

export type TBootTaskDependency = {
    task: TBootTask;
    weak?: boolean;
};

export type TBootTaskDependencyUnion = TBootTask | TBootTaskDependency;

export type TBootTaskOptions = {
    priority?: number;
    optional?: boolean;
    name?: string;
    deps?: readonly TBootTaskDependencyUnion[];
};

/**
 * Representing the possible states of the boot process.
 * @enum {number}
 */
export enum BootState {
    /** The boot process is idle and not currently running. */
    Idle,
    /** The boot process is currently running. */
    Running,
    /** The boot process has completed. */
    Completed,
}

export enum TaskStatus {
    Unknown,
    Idle,
    Running,
    Completed,
    Fail,
}

/** @internal */
type TTaskState = {
    /** Current task state */
    status: TaskStatus;
    /** Other tasks that will be queued after the current one is completed */
    awaiters: TBootTask[];
};

const ERR_BOOT_STARTED = "Boot process already started";
const ERR_PRIORITY_NOT_A_NUMBER = "Priority must be a number";
const ERR_STRONG_DEPENDENCY_OPTIONAL_TASK =
    "An important task should not have a strong dependency on an optional task.";

export const DEFAULT_TASK_PRIORITY: number = 0;

function isPromise(obj: any): obj is Promise<any> {
    return obj != null && typeof obj === "object" && "then" in obj;
}
export function hasDependency(task: TBootTask, dependency: TBootTask): boolean {
    return task.dependencies.some((it) => it.task === dependency);
}

export class Boot {
    // region: STATIC METHODS
    private _processPromise?: Promise<unknown>;
    private _processResolve?: () => void;
    private _processReject?: () => void;

    /**
     * Creates a boot task with optional configuration options.
     * @param delegate - The delegate function to be executed by task,
     *                   which can be synchronous or asynchronous.
     * @param options - Optional task configuration, including task dependencies.
     * @returns The created boot task.
     */
    public static task(
        delegate: TBootTaskDelegate,
        options?: TBootTaskOptions | TNullable,
    ): TBootTask;

    /**
     * Creates a boot task with an optional list of dependencies.
     * @param delegate - The delegate function to be executed by task,
     *                   which can be synchronous or asynchronous.
     * @param dependencies - An optional list of tasks that this task depends on.
     * @returns The created boot task.
     */
    public static task(
        delegate: TBootTaskDelegate,
        dependencies?: readonly TBootTaskDependencyUnion[] | TNullable,
    ): TBootTask;

    public static task(
        delegate: TBootTaskDelegate,
        optionsOrDependencies?:
            | TBootTaskOptions
            | readonly TBootTaskDependencyUnion[]
            | TNullable,
    ): TBootTask {
        let dependencies: readonly TBootTaskDependencyUnion[] | TNullable;
        let options: TBootTaskOptions | TNullable;
        if (optionsOrDependencies) {
            if (Array.isArray(optionsOrDependencies)) {
                dependencies = optionsOrDependencies;
            } else {
                options = optionsOrDependencies as TBootTaskOptions;
                dependencies = options.deps;
            }
        }

        const priority = options?.priority ?? DEFAULT_TASK_PRIORITY;
        if (isNaN(priority)) throw new Error(ERR_PRIORITY_NOT_A_NUMBER);

        const optional = Boolean(options?.optional);
        return Object.freeze({
            delegate,
            priority,
            optional,
            name: options?.name || delegate.name,
            dependencies:
                dependencies?.map((it) => {
                    const dep = Object.freeze("task" in it ? it : { task: it });
                    if (!optional && dep.task.optional && !dep.weak)
                        throw new Error(ERR_STRONG_DEPENDENCY_OPTIONAL_TASK);
                    return dep;
                }) ?? [],
        });
    }

    // endregion: STATIC METHODS

    // region: FIELDS

    /** @internal */
    private _state: BootState = BootState.Idle;

    private _tasksSet = new Set<TBootTask>();

    private _tasksStateMap = new Map<TBootTask, TTaskState>();

    // endregion: FIELDS

    // region: PROPERTIES

    /** Retrieves the number of process tasks. */
    public get tasksCount(): number {
        return this._tasksSet.size;
    }

    /**
     * Gets the current state of the boot process.
     * @see BootState
     */
    public get state(): BootState {
        return this._state;
    }

    // endregion: PROPERTIES

    // region: PUBLIC METHODS

    /**
     * Adds a single task to the boot process.
     *
     * If the provided value is {@link TFalsy}, it will be ignored.
     * @param task - A boot task to be added, or a falsy value to be ignored.
     * @returns The current instance of the boot process for method chaining.
     */
    public add(task: TBootTask | TFalsy): Boot;

    /**
     * Adds an array of tasks to the boot process.
     *
     * Each task in the array can be either a boot task or a falsy value. Falsy values will be ignored.
     * @param tasks - An array of boot tasks or falsy values.
     * @returns The current instance of the boot process for method chaining.
     */
    public add(tasks: readonly (TBootTask | TFalsy)[]): Boot;

    public add(
        taskOrTasks: TBootTask | readonly (TBootTask | TFalsy)[] | TFalsy,
    ): Boot {
        if (taskOrTasks) {
            if (Array.isArray(taskOrTasks)) {
                taskOrTasks.forEach((task) => this.add(task));
            } else {
                this.addTaskToProcess(taskOrTasks as TBootTask);
            }
        }
        return this;
    }

    public has(task: TBootTask): boolean {
        return this._tasksSet.has(task);
    }

    public getTaskStatus(task: TBootTask): TaskStatus {
        const state = this._tasksStateMap.get(task);
        return state?.status ?? TaskStatus.Unknown;
    }

    public async runAsync() {
        const rootTasks = this.findRootTasksAndBindAwaiters();

        if (rootTasks.length === 0) {
            this._state = BootState.Completed;
            return Promise.resolve();
        }

        const promise = this.createPromise();
        this._state = BootState.Running;
        this.processTasks(rootTasks);

        await this._processPromise;

        this._processResolve?.();
        this._state = BootState.Completed;
        return promise;
    }

    // endregion: PUBLIC METHODS

    // region: PRIVATE METHODS

    /** @internal */
    private addTaskToProcess(task: TBootTask): void {
        this._tasksSet.add(task);
        this._tasksStateMap.set(task, {
            status: TaskStatus.Idle,
            awaiters: [],
        });
    }

    /** @internal */
    private createPromise(): Promise<void> {
        return new Promise((resolve, reject) => {
            this._processResolve = resolve;
            this._processReject = reject;
        });
    }

    /** @internal */
    private findRootTasksAndBindAwaiters(): readonly TBootTask[] {
        const roots: TBootTask[] = [];
        this._tasksSet.forEach((task) => {
            if (task.dependencies.length === 0) roots.push(task);
            else
                for (const dependency of task.dependencies) {
                    const dependencyState = this._tasksStateMap.get(
                        dependency.task,
                    );
                    if (dependencyState) dependencyState.awaiters.push(task);
                }
        });
        return roots;
    }

    /** @internal */
    private processTasks(tasks: readonly TBootTask[]): void {
        const taskPromises = tasks.map(async (task) => {
            const taskState = this._tasksStateMap.get(task)!;
            taskState.status = TaskStatus.Running;
            try {
                const mayBePromise = task.delegate();
                if (isPromise(task)) await mayBePromise;
                taskState.status = TaskStatus.Completed;
            } catch (error) {
                taskState.status = TaskStatus.Fail;
            }
        });

        this.updateProcessPromise(taskPromises);
    }

    private updateProcessPromise(tasksPromises: Promise<unknown>[]): void {
        if (this._processPromise) tasksPromises.push(this._processPromise);
        this._processPromise = Promise.all(tasksPromises);
    }

    // endregion: PRIVATE METHODS
}
