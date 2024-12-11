/** A union type representing either `null` or `undefined` */
export type TNullable = null | undefined;

/**
 * A union type representing values interpreted as `false` in boolean contexts.
 * These include `null`, `undefined`, `false`, and `0`.
 */
export type TFalsy = TNullable | false | 0;

export type TBootTaskDelegateParams = {
    abortSignal?: AbortSignal;
};

/**
 * A delegate function representing a synchronous boot task.
 * This function performs an operation without returning a Promise.
 */
export type TBootTaskSyncDelegate = (params: TBootTaskDelegateParams) => void;

/**
 * A delegate function representing an asynchronous boot task.
 * This function returns a Promise, signaling when the task is complete.
 */
export type TBootTaskAsyncDelegate = (
    params: TBootTaskDelegateParams,
) => Promise<void>;

/** A union of synchronous and asynchronous boot task delegate functions. */
export type TBootTaskDelegate = TBootTaskSyncDelegate | TBootTaskAsyncDelegate;

/** Represents a boot task with its metadata and dependencies. */
export type TBootTask = {
    /** A unique name identifying the task. */
    name: string;
    /** Indicates whether the task is optional (can be skipped on failure). */
    optional: boolean;
    /** Priority of the task, where higher numbers indicate higher priority. */
    priority: number;
    /** The function to execute for the task (sync or async). */
    delegate: TBootTaskDelegate;
    /** A list of dependencies required for this task. */
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

export type TBootProcessOptions = {
    abortSignal?: AbortSignal;
};

/**
 * Representing the possible states of the boot process.
 * @enum {number}
 */
export enum BootStatus {
    /** The boot process is idle and not currently running. */
    Idle,
    /** The boot process is currently running. */
    Running,
    /** Waiting last tasks to be completed */
    Finalizing,
    /** The boot process has completed. */
    Completed,
    /** The boot process execution failed */
    Fail,
    /** The boot process execution cancelled with abort signal */
    Cancelled,
}

export enum TaskStatus {
    Unknown,
    Idle,
    Waiting,
    Running,
    Completed,
    Fail,
    Skipped,
}

/** @internal */
type TTaskState = {
    /** Current task state */
    status: TaskStatus;
    /** Other tasks that will be queued after the current one is completed */
    awaiters: TBootTask[];
    /** Reason of task failure */
    failReason?: Error;
};

const ERR_BOOT_STARTED = "Boot process already started";
const ERR_ADD_TASK_AFTER_START = "Attempt to add tasks after process started";
const ERR_PRIORITY_NOT_A_NUMBER = "Priority must be a number";
const ERR_STRONG_DEPENDENCY_OPTIONAL_TASK =
    "An important task should not have a strong dependency on an optional task.";
const ERR_IMPORTANT_TASK_FAIL = "Important task fail";
const ERR_IMPORTANT_TASK_SKIPPED = "Important task skipped";
const ERR_PROCESS_CANCELLED = "Process was cancelled";

export const DEFAULT_TASK_PRIORITY: number = 0;

function isPromise(obj: any): obj is Promise<unknown> {
    return obj != null && typeof obj === "object" && "then" in obj;
}

export function hasDependency(task: TBootTask, dependency: TBootTask): boolean {
    return task.dependencies.some((it) => it.task === dependency);
}

function comparePriority(lhv: TBootTask, rhv: TBootTask): number {
    return lhv.priority - rhv.priority;
}

export class Boot {
    // region: STATIC METHODS

    /**
     * Creates a boot task with optional configuration options.
     * @param delegate - The delegate function to be executed by task,
     *                   which can be synchronous or asynchronous.
     * @param options - Optional task configuration, including task dependencies.
     * @returns The created boot task.
     *
     * @throws {Error} if the priority is not a correct number.
     * @throws {Error} if important task has a strong dependency on an optional task
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
     *
     * @throws {Error} if important task has a strong dependency on an optional task
     */
    public static task(
        delegate: TBootTaskDelegate,
        dependencies?: readonly TBootTaskDependencyUnion[] | TNullable,
    ): TBootTask;

    /** @internal */
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

    /**
     * Current status of boot process.
     * @internal
     */
    private _status: BootStatus = BootStatus.Idle;

    /**
     * Set of tasks added to the boot process.
     * @internal
     */
    private readonly _tasksSet = new Set<TBootTask>();

    /**
     * Map of task states.
     * @internal
     */
    private readonly _tasksStateMap = new Map<TBootTask, TTaskState>();

    /** Queue of tasks that waiting to be processed */
    private _awaitersQueue: TBootTask[] = [];

    /** Global execution promise */
    private _processPromise?: Promise<unknown>;

    /** Process promise resolve delegate */
    private _processResolve?: () => void;

    /** Process promise reject delegate */
    private _processReject?: (reason: Error) => void;

    /** Abort signal */
    private _abortSignal?: AbortSignal;

    // endregion: FIELDS

    // region: PROPERTIES

    /** Retrieves the number of process tasks. */
    public get tasksCount(): number {
        return this._tasksSet.size;
    }

    /**
     * Gets the current state of the boot process.
     * @see BootStatus
     */
    public get status(): BootStatus {
        return this._status;
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

    /** @internal */
    public add(
        taskOrTasks: TBootTask | readonly (TBootTask | TFalsy)[] | TFalsy,
    ): Boot {
        if (this._status !== BootStatus.Idle) {
            throw new Error(ERR_ADD_TASK_AFTER_START);
        }
        if (taskOrTasks) {
            if (Array.isArray(taskOrTasks)) {
                taskOrTasks.forEach((task) => this.add(task));
            } else {
                this.addTaskToProcess(taskOrTasks as TBootTask);
            }
        }
        return this;
    }

    /** Check is task added to the process */
    public has(task: TBootTask): boolean {
        return this._tasksSet.has(task);
    }

    /** Retrieves currect status of given task */
    public getTaskStatus(task: TBootTask): TaskStatus {
        const state = this._tasksStateMap.get(task);
        return state?.status ?? TaskStatus.Unknown;
    }

    /**
     * Retrieves the failure reason of a given task.
     * If the task did not fail, this method returns `null`.
     *
     * @param task - The task for which to retrieve the failure reason.
     * @returns The error that caused the task to fail, or `null` if the task did not fail.
     */
    public getTaskFailReason(task: TBootTask): Error | null {
        return this._tasksStateMap.get(task)?.failReason ?? null;
    }

    /**
     * Executes all registered tasks in the correct order based on their dependencies.
     * @returns A promise that resolves when the boot process is complete or rejects on failure.
     *
     * @throws {Error} If process already started
     */
    public async runAsync(options?: TBootProcessOptions): Promise<void> {
        if (this._status !== BootStatus.Idle) throw new Error(ERR_BOOT_STARTED);

        const rootTasks = this.findRootTasksAndLinkAwaiters();
        if (rootTasks.length === 0) return this.handleEmptyRootState();

        const promise = this.createPromise();
        this._status = BootStatus.Running;
        this._abortSignal = options?.abortSignal;
        this.processTasks(rootTasks);

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

    /**
     * Identifies root tasks (tasks without unresolved dependencies) and links awaiters for each task.
     *
     * Root tasks are determined based on the presence and type of dependencies.
     * Tasks with only weak dependencies may also be considered as roots under certain conditions.
     *
     * @returns {readonly TBootTask[]} An array of tasks that ready to be executed.
     *
     * @internal
     */
    private findRootTasksAndLinkAwaiters(): readonly TBootTask[] {
        const roots: TBootTask[] = [];
        const maybeRoots: TBootTask[] = [];
        this._tasksSet.forEach((task) => {
            let isRoot = true;
            let mayBeRoot = true;

            // No dependencies -> Root
            // Not added weak dependency -> Root
            // Has only weak dependencies -> Maybe Root

            if (task.dependencies.length > 0) {
                for (const dependency of task.dependencies) {
                    const dependencyState = this._tasksStateMap.get(
                        dependency.task,
                    );

                    if (!dependency.weak || !dependency.task.optional)
                        mayBeRoot = false;

                    if (dependencyState) {
                        dependencyState.awaiters.push(task);
                        isRoot = false;
                    } else if (!dependency.weak) {
                        if (task.optional) {
                            const state = this._tasksStateMap.get(task)!;
                            state.status = TaskStatus.Skipped;
                        }
                        isRoot = false;
                        // TROUBLE
                    }
                }
            }
            if (isRoot) roots.push(task);
            else if (mayBeRoot) maybeRoots.push(task);
        });

        // Check possible roots
        maybeRoots.forEach((task) => {
            let isRoot = true;
            for (const dependency of task.dependencies) {
                if (
                    this.getTaskStatus(dependency.task) !== TaskStatus.Skipped
                ) {
                    isRoot = false;
                    break;
                }
            }
            if (isRoot) roots.push(task);
        });

        return roots.sort(comparePriority);
    }

    /**
     * Processes a list of tasks by executing their delegate functions and updating their states.
     *
     * If a task fails and is critical, the boot process terminates with an error.
     *
     * @param tasks - The tasks to process.
     *
     * @internal
     */
    private processTasks(tasks: readonly TBootTask[]): void {
        if (this.status !== BootStatus.Running) return;
        const taskPromises = tasks.map(async (task) => {
            const taskState = this._tasksStateMap.get(task)!;

            // Отправляем ожидающие задачи в очередь
            this.prepareAwaiters(taskState.awaiters);

            taskState.status = TaskStatus.Running;
            try {
                // Запускаем делегат задачи.
                const mayBePromise = task.delegate({
                    abortSignal: this._abortSignal,
                });

                // Если делегат возвращает Promise, ждем его завершения.
                if (isPromise(mayBePromise)) await mayBePromise;
                taskState.status = TaskStatus.Completed;
            } catch (error) {
                taskState.status = TaskStatus.Fail;
                taskState.failReason = error as Error;
                if (!task.optional) {
                    this.fail(ERR_IMPORTANT_TASK_FAIL);
                    return;
                }
            }

            if (this._abortSignal?.aborted) {
                this.cancelProcess();
                return;
            }

            this.runAwaiters();
        });

        // Обновляем основной Promise процесса
        this.updateProcessPromise(taskPromises);
    }

    /** @internal */
    private prepareAwaiters(tasks: readonly TBootTask[]): void {
        tasks.forEach((task) => {
            const state = this._tasksStateMap.get(task)!;
            state.status = TaskStatus.Waiting;
            if (!this._awaitersQueue.includes(task))
                this._awaitersQueue.push(task);
        });
    }

    /** @internal */
    private runAwaiters(): void {
        if (this._awaitersQueue.length === 0) {
            this.finalize();
            return;
        }

        const tasksToProcess: TBootTask[] = [];
        const newAwaitersQueue: TBootTask[] = [];

        // Проверяем задачи в очереди
        for (let task of this._awaitersQueue) {
            let skip = false;
            let canBeProcessed = true;
            for (let dependency of task.dependencies) {
                const dependencyState = this._tasksStateMap.get(
                    dependency.task,
                );

                if (dependency.weak) {
                    if (
                        dependencyState &&
                        dependencyState.status !== TaskStatus.Completed &&
                        dependencyState.status !== TaskStatus.Fail &&
                        dependencyState.status !== TaskStatus.Skipped
                    ) {
                        canBeProcessed = false;
                    }
                } else {
                    // 1. Если нет состояния зависимости, значит задача не добавлена в процесс.
                    // 2. Зависимая задача завершилась с ошибкой или была пропущена.
                    // И если это сильная зависимость, то задачу невозможно выполнить. Она будет пропущена.
                    if (
                        !dependencyState ||
                        dependencyState.status === TaskStatus.Fail ||
                        dependencyState.status === TaskStatus.Skipped
                    ) {
                        skip = true;
                        canBeProcessed = false;
                        break;
                    }

                    if (dependencyState?.status !== TaskStatus.Completed) {
                        canBeProcessed = false;
                        break;
                    }
                }
            }

            const state = this._tasksStateMap.get(task)!;
            if (canBeProcessed) {
                // Можно брать в работу
                tasksToProcess.push(task);
            } else if (skip) {
                // Задача не может быть выполнена
                if (task.optional) {
                    state.status = TaskStatus.Skipped;
                } else {
                    state.status = TaskStatus.Fail;
                    this.fail(ERR_IMPORTANT_TASK_SKIPPED);
                }
            } else newAwaitersQueue.push(task);
        }

        // Обновляем очередь ожидающих
        this._awaitersQueue = newAwaitersQueue;

        if (tasksToProcess.length > 0) {
            this.processTasks(tasksToProcess.sort(comparePriority));
        } else if (this._awaitersQueue.length === 0) {
            this.finalize();
        }
    }

    /** @internal */
    private updateProcessPromise(tasksPromises: Promise<unknown>[]): void {
        if (this._processPromise) tasksPromises.push(this._processPromise);
        this._processPromise = Promise.all(tasksPromises);
    }

    /** @internal */
    private async finalize(): Promise<void> {
        if (this._status !== BootStatus.Running) return;

        // Начинаем ожидание последних задач
        this._status = BootStatus.Finalizing;
        await this._processPromise;

        // Во время выполнения последних задач, процесс может завершиться ошибкой
        if (this._status !== BootStatus.Finalizing) return;

        this._status = BootStatus.Completed;
        this._processResolve?.();
    }

    /** @internal */
    private disposeAwaitersQueue(reason: Error): void {
        if (this._awaitersQueue.length <= 0) return;
        this._awaitersQueue.forEach((task) => {
            const state = this._tasksStateMap.get(task)!;
            state.status = task.optional ? TaskStatus.Skipped : TaskStatus.Fail;
            state.failReason = reason;
        });
        this._awaitersQueue.length = 0;
    }

    /**
     * Marks the boot process as failed and updates the status of all pending tasks.
     *
     * All critical tasks in the awaiters queue are marked as failed, while optional tasks are skipped.
     *
     * @param err - The error message to associate with the failure.
     *
     * @internal
     */
    private fail(err: string): void {
        const error = Error(err);
        this._status = BootStatus.Fail;
        this.disposeAwaitersQueue(error);
        this._processReject?.(error);
    }

    /** @internal */
    private cancelProcess(): void {
        if (this._status === BootStatus.Cancelled) return;
        const error = this._abortSignal?.reason ?? Error(ERR_PROCESS_CANCELLED);
        this._status = BootStatus.Cancelled;
        this.disposeAwaitersQueue(error);
        this._processReject?.(error);
    }

    /** @internal */
    private handleEmptyRootState(): Promise<void> {
        let hasSkippedImportantTasks = false;
        if (this._tasksSet.size > 0) {
            this._tasksSet.forEach((task) => {
                const state = this._tasksStateMap.get(task)!;
                if (task.optional) {
                    state.status = TaskStatus.Skipped;
                } else {
                    hasSkippedImportantTasks = true;
                    state.status = TaskStatus.Fail;
                }
            });
        }
        if (hasSkippedImportantTasks) {
            this._status = BootStatus.Fail;
            return Promise.reject(Error(ERR_IMPORTANT_TASK_SKIPPED));
        } else {
            this._status = BootStatus.Completed;
            return Promise.resolve();
        }
    }
    // endregion: PRIVATE METHODS
}
