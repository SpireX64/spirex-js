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
    name: string;
    delegate: TBootTaskDelegate;
    dependencies: readonly TBootTask[];
};

export type TBootTaskOptions = {
    name?: string;
    dependencies?: readonly TBootTask[];
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
    Done,
}

export type TBootResult = {
    success: readonly TBootTask[];
    failure: readonly TBootTask[];
};

enum BootTaskState {
    Idle,
    Running,
    Success,
    Failure,
    Skipped,
}

type TBootTaskNode = {
    task: TBootTask;
    state: BootTaskState;
};

const ERR_BOOT_STARTED = "Boot process already started";

function isPromise(obj: any): obj is Promise<any> {
    return obj != null && typeof obj === "object" && "then" in obj;
}

export class Boot {
    // region: STATIC METHODS

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
        dependencies?: readonly TBootTask[] | TNullable,
    ): TBootTask;

    public static task(
        delegate: TBootTaskDelegate,
        optionsOrDependencies?:
            | TBootTaskOptions
            | readonly TBootTask[]
            | TNullable,
    ): TBootTask {
        let dependencies: readonly TBootTask[] | TNullable;
        let options: TBootTaskOptions | TNullable;
        if (optionsOrDependencies) {
            if (Array.isArray(optionsOrDependencies)) {
                dependencies = optionsOrDependencies;
            } else {
                options = optionsOrDependencies as TBootTaskOptions;
                dependencies = options.dependencies;
            }
        }

        return Object.freeze({
            delegate,
            name: options?.name || delegate.name,
            dependencies: dependencies ?? [],
        });
    }

    // endregion: STATIC METHODS

    // region: FIELDS

    /** @internal */
    private _state: BootState = BootState.Idle;
    /** @internal */
    private _nodes: TBootTaskNode[] = [];

    // endregion: FIELDS

    // region: PROPERTIES

    /** Retrieves the number of process tasks. */
    public get tasksCount(): number {
        return this._nodes.length;
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

    public async runAsync(): Promise<TBootResult> {
        if (this._state !== BootState.Idle) {
            throw new Error(ERR_BOOT_STARTED);
        }
        this._state = BootState.Running;
        const tasksPromises = this._nodes.map(async (node) => {
            node.state = BootTaskState.Running;
            try {
                const taskReturnValue = node.task.delegate();
                if (isPromise(taskReturnValue)) {
                    await taskReturnValue;
                }
                node.state = BootTaskState.Success;
            } catch (err) {
                node.state = BootTaskState.Failure;
            }
        });
        await Promise.all(tasksPromises);
        this._state = BootState.Done;
        return {
            success: this._nodes
                .filter((node) => node.state === BootTaskState.Success)
                .map((it) => it.task),
            failure: this._nodes
                .filter((node) => node.state === BootTaskState.Failure)
                .map((it) => it.task),
        };
    }

    // endregion: PUBLIC METHODS

    // region: PRIVATE METHODS

    /** @internal */
    private addTaskToProcess(task: TBootTask): void {
        const isExists = this._nodes.find((it) => it.task === task) != null;
        if (isExists) return;

        const node: TBootTaskNode = {
            state: BootTaskState.Idle,
            task,
        };
        this._nodes.push(node);
    }

    // endregion: PRIVATE METHODS
}
