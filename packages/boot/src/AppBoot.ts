// Package: @spirex/js-boot
// Copyright 2024 (c) Artem Sobolenkov
// https://github.com/spirex64

// region: Types definitions

/** Asynchronous boot task's function  */
export type TBootTaskFunctionSync = () => void;

/** Synchronous boot task's function */
export type TBootTaskFunctionAsync = () => Promise<void>;

/** Boot task's function */
export type TBootTaskFunction = TBootTaskFunctionSync | TBootTaskFunctionAsync;

/** Nullable union type */
export type TNullable = null | undefined;

/** Boot task definition type */
export interface IBootTask {
    /** Task name */
    readonly name: string;
    /** Does not terminate the initialization process in case of failure */
    readonly optional?: boolean;
    /** Tasks that must be completed before this task runs */
    readonly dependsOn?: readonly TBootTaskDependency[] | undefined;
    /** Task function */
    readonly run: TBootTaskFunction;
}

/** Running process options */
export type TRunningOptions = {
    /** Auto-dispose on process finish */
    disposeOnFinish?: boolean;

    /** Sync tasks statuses with parents */
    syncWithParents?: boolean;
};

export type TBootTaskDependency = {
    /** Task reference */
    readonly task: IBootTask;

    /** Completion the task is optional */
    readonly optional?: boolean;
};

/** Data of process event */
export type TProcessEventData = Readonly<{
    /** Event type */
    type: "process";
    /** The task that triggered the event */
    task: IBootTask;
    /** Count of completed tasks */
    completed: number;
    /** Count of total tasks */
    total: number;
    /** Task's state provider */
    getStateOf: (task: IBootTask) => BootTaskState;
}>;

/** Process event listener function */
export type TProcessEventListener = (data: TProcessEventData) => void;

/** Data of finish event */
export type TFinishEventData = Readonly<{
    /** Event type */
    type: "finish";
    /** Boot result */
    result: TAppBootResult;
}>;

/** Process event listener function */
export type TFinishEventListener = (data: TFinishEventData) => void;

/** Boot process result */
export type TAppBootResult = Readonly<{
    /** List of successfully completed tasks */
    success: readonly IBootTask[];
    /** List of completed tasks with an error */
    failure: readonly IBootTask[];
    /** List of skipped tasks */
    skipped: readonly IBootTask[];
    /** List of tasks that were not included in the execution graph */
    unreachable: readonly IBootTask[];
}>;

export enum BootTaskState {
    /** The task is not controlled by a process */
    Unknown = "Unknown",
    /** Task in queue to be executed */
    Idle = "Idle",
    /** Task in progress */
    Running = "Running",
    /** Task completed successfully */
    Success = "Success",
    /** Task completed with error */
    Failure = "Failure",
    /** Task was skipped */
    Skipped = "Skipped",
}

export namespace BootTaskState {
    export function isCompleted(state: BootTaskState) {
        return (
            state === BootTaskState.Success ||
            state === BootTaskState.Failure ||
            state === BootTaskState.Skipped
        );
    }
}

/** Task node in the boot graph */
type TBootGraphNode = {
    /** Task reference */
    task: IBootTask;
    /** Tasks that must be completed before this task runs */
    depends: TBootGraphNode[];
    /** Tasks that depend on the completion of this task */
    children: TBootGraphNode[];
    /** Current task state */
    state: BootTaskState;
};

/** Object for tracking dependent tasks */
type TBootGraphNodeAwaiter = {
    /** The target task */
    readonly node: TBootGraphNode;
    /** List of dependent tasks */
    wait: TBootGraphNode[];
};

enum AppBootStatus {
    /** Waiting for process to start */
    Idle = 0,
    /** In progress */
    Running = 1,
    /** Waiting for the process to complete */
    Finalizing = 2,
    /** Process completed successfully */
    Done = 3,
    /** Process crashed on important task */
    Failed = 4,
    /** Used resources have been freed */
    Disposed,
}

// endregion: Types definitions

// region: Error messages

const ERR_BOOT_STARTED = "Boot process already started";
const ERR_ADD_TASKS_AFTER_START =
    "Attempt to add task after start boot process";
const ERR_HAS_IMPORTANT_UNREACHABLE_TASK =
    "Attempt to add task after start boot process";
const ERR_DISPOSE_WHILE_RUNNING = "Attempt to dispose the initializer while it's running"
const ERR_PARENT_WAS_DISPOSED = "Parent was disposed."

// endregion: Error messages

export class AppBoot {
    // region: Task factory

    /**
     * Factory method of boot task
     * @param func - task function
     * @param deps - list of dependencies
     * @param optional - Does not terminate the initialization process in case of failure
     * @returns new task object
     */
    public static task(
        func: TBootTaskFunction,
        deps?: readonly (TBootTaskDependency | IBootTask)[] | null | undefined,
        optional?: boolean,
    ): IBootTask;

    /**
     * Factory method of boot task with explicit name
     * @param name - Name of task
     * @param func - Task function
     * @param deps - List of dependencies
     * @param optional - Does not terminate the initialization process in case of failure
     * @returns new task object
     */
    public static task(
        name: string,
        func: TBootTaskFunction,
        deps?: readonly (TBootTaskDependency | IBootTask)[] | null | undefined,
        optional?: boolean,
    ): IBootTask;

    public static task(
        nameOrFunc: string | TBootTaskFunction,
        funcOrDeps?:
            | TBootTaskFunction
            | readonly (TBootTaskDependency | IBootTask)[]
            | TNullable,
        depsOrOptional?:
            | readonly (TBootTaskDependency | IBootTask)[]
            | boolean
            | TNullable,
        optional?: boolean,
    ): IBootTask {
        let name: string;
        let func: TBootTaskFunction;
        let dependencies: readonly (TBootTaskDependency | IBootTask)[];
        let isOptional: boolean;

        if (typeof nameOrFunc === "string") {
            name = nameOrFunc;
            func = funcOrDeps as TBootTaskFunction;
            dependencies = Array.isArray(depsOrOptional) ? depsOrOptional : [];
            isOptional = Boolean(optional);
        } else {
            name = nameOrFunc.name;
            func = nameOrFunc;
            dependencies = funcOrDeps as typeof dependencies;
            isOptional = Boolean(depsOrOptional || optional);
        }

        const dependsOn = dependencies?.map((it) =>
            "run" in it ? ({ task: it } as TBootTaskDependency) : it,
        );

        return { name, run: func, dependsOn, optional: isOptional };
    }

    // endregion: Task factory

    // region: Fields

    private _processEventListeners = new Set<TProcessEventListener>();
    private _finishEventListeners = new Set<TFinishEventListener>();

    private _promiseResolve: ((result: TAppBootResult) => void) | null = null;
    private _promiseReject: ((error: Error) => void) | null = null;

    /** List of all nodes of execution graph */
    private _nodes: TBootGraphNode[] = [];
    /** List of nodes not included in the execution graph */
    private _unreachableNodes: (TBootGraphNode | TNullable)[] = [];

    /** Current status of the process */
    private _status: AppBootStatus = AppBootStatus.Idle;
    /** Link to active promise */
    private _activeProcessPromise: Promise<any> | null = null;

    /** List of tasks waiting to run */
    private _awaiters: TBootGraphNodeAwaiter[] = [];
    /** List of task nodes that have completed their execution */
    private _completedNodes: TBootGraphNode[] = [];
    /** List of parents */
    private readonly _parents: AppBoot[] | null = null;
    /** Running options */
    private _runningOptions: TRunningOptions | TNullable = null;

    // endregion: Fields

    // region: Properties

    /** Total count of tasks added to the process */
    public get tasksCount(): number {
        return this._nodes.length + this._unreachableNodes.length;
    }

    public get isDisposed(): boolean {
        return this._status === AppBootStatus.Disposed;
    }

    // endregion: Properties

    public constructor(...parents: AppBoot[]) {
        if (parents.length > 0) {
            this._parents = parents;
            this._nodes = parents.flatMap((parent) =>
                this.copyParentNodes(parent._nodes),
            );
            this._completedNodes = this._nodes.filter((it) =>
                BootTaskState.isCompleted(it.state),
            );
        }
    }

    // region: Public methods

    /**
     * Checks current instance is child of another process
     * @param other - another process reference
     * @returns true, when this instance is child of other process
     */
    public isChildOf(other: AppBoot): boolean {
        return this._parents?.includes(other) === true;
    }

    /**
     * Adds task to boot process
     * @param task - boot task object
     */
    public add(task: IBootTask | false | null | undefined): AppBoot;

    /**
     * Adds list of tasks to boot process
     * @param tasks - list of boot tasks
     * @throws Error when process already started
     */
    public add(tasks: readonly IBootTask[] | false | null | undefined): AppBoot;
    public add(
        oneOrManyTasks:
            | IBootTask
            | readonly IBootTask[]
            | false
            | null
            | undefined,
    ): AppBoot {
        if (this._status !== AppBootStatus.Idle)
            throw Error(ERR_ADD_TASKS_AFTER_START);

        if (!!oneOrManyTasks) {
            if (Array.isArray(oneOrManyTasks))
                oneOrManyTasks.forEach((task) => this.addTaskToGraph(task));
            else this.addTaskToGraph(oneOrManyTasks as IBootTask);
        }
        return this;
    }

    /** Checks if a task has been added to the process */
    public has(task: IBootTask): boolean {
        return (
            this._nodes.some((it) => it.task === task) ||
            this._unreachableNodes.some((it) => it!.task === task)
        );
    }

    /** Checks if all {@link task} dependencies have been added to the process. */
    public isTaskReachable(task: IBootTask): boolean {
        return this._nodes.some((it) => it.task === task);
    }

    /** Add a process event listener */
    public addEventListener(
        type: "process",
        listener: TProcessEventListener,
    ): AppBoot;

    /** Add a finish event listener */
    public addEventListener(
        type: "finish",
        listener: TFinishEventListener,
    ): AppBoot;

    public addEventListener(
        type: "process" | "finish",
        listener: TProcessEventListener | TFinishEventListener,
    ): AppBoot {
        if (type === "process")
            this._processEventListeners.add(listener as TProcessEventListener);
        else if (type === "finish")
            this._finishEventListeners.add(listener as TFinishEventListener);
        return this;
    }

    /** Remove a process event listener */
    public removeEventListener(
        type: "process",
        listener: TProcessEventListener,
    ): AppBoot;

    /** Remove a finish event listener */
    public removeEventListener(
        type: "finish",
        listener: TFinishEventListener,
    ): AppBoot;

    public removeEventListener(
        type: "process" | "finish",
        listener: TProcessEventListener | TFinishEventListener,
    ): AppBoot {
        if (type === "process")
            this._processEventListeners.delete(
                listener as TProcessEventListener,
            );
        if (type === "finish")
            this._finishEventListeners.delete(listener as TFinishEventListener);
        return this;
    }

    /**
     * Starts the initialization process
     * @throws Error when trying to start a process when it is already running
     * @throws Error when one of the important tasks ends with an error
     * @throws Error if not possible to construct the path to perform important task
     * @returns the result of executing tasks
     */
    public runAsync(options?: TRunningOptions): Promise<TAppBootResult> {
        if (this._status !== AppBootStatus.Idle)
            return Promise.reject(Error(ERR_BOOT_STARTED));

        this.validateImportantUnreachableTasks();

        this._runningOptions = options;
        this._status = AppBootStatus.Running;
        const promise = this.createPromiseResolver();

        if (this._runningOptions?.syncWithParents)
            this.syncTasksStatusesWithParents();

        const rootTaskNodes = this._nodes.filter(
            (node) => node.depends.length === 0,
        );
        this.runTasks(rootTaskNodes);
        return promise;
    }

    /**
     * Cleans up resources used by a process.
     * Use this method after the process has completed to reduce the application's memory consumption.
     * @throws Error when trying to free resources while it's running
     */
    public dispose(): void {
        if (this._status === AppBootStatus.Disposed) return;
        if (
            this._status === AppBootStatus.Running ||
            this._status === AppBootStatus.Finalizing
        )
            throw Error(ERR_DISPOSE_WHILE_RUNNING);

        // After this line, it's not possible to use an initializer.
        this._status = AppBootStatus.Disposed;

        this._processEventListeners.clear();
        // @ts-ignore
        delete this._processEventListeners;
        this._finishEventListeners.clear();
        // @ts-ignore
        delete this._finishEventListeners;
        // @ts-ignore
        delete this._awaiters;
        // @ts-ignore
        delete this._nodes;
        // @ts-ignore
        delete this._unreachableNodes;
        // @ts-ignore
        delete this._completedNodes;
        this._activeProcessPromise = null;
        this._promiseResolve = null;
        this._promiseReject = null;
    }

    // endregion: Public methods

    // region: Private methods

    private validateParentsState(): void {
        this._parents?.forEach((parent) => {
            if (parent.isDisposed) throw Error(ERR_PARENT_WAS_DISPOSED);
        });
    }

    private syncTasksStatusesWithParents() {
        if (!this._parents?.length) return;

        this.validateParentsState();

        this._parents
            .flatMap((parent) => this.copyParentNodes(parent._nodes))
            .forEach((parentNode) => {
                const node = this._nodes.find(
                    (it) => it.task === parentNode.task,
                );
                if (node) node.state = parentNode.state;
            });
    }

    private copyParentNodes(
        parentNodes: readonly (TBootGraphNode | TNullable)[],
    ) {
        return parentNodes.reduce<TBootGraphNode[]>((nodes, node) => {
            if (node)
                nodes.push({
                    ...node,
                    children: Array.from(node.children),
                });
            return nodes;
        }, []);
    }

    private validateImportantUnreachableTasks(): void {
        const tasks = this._unreachableNodes
            .filter((it) => !it!.task.optional)
            .map((it) => it!.task);
        if (tasks.length === 0) return;

        throw Error(
            `${ERR_HAS_IMPORTANT_UNREACHABLE_TASK} (${tasks.map((it) => it.name).join(", ")})`,
        );
    }

    private emitProcessEvent(task: IBootTask): void {
        this._processEventListeners.forEach((listener) => {
            listener({
                type: "process",
                task,
                completed: this._completedNodes.length,
                total: this._nodes.length,
                getStateOf: (task) => this.getTaskState(task),
            });
        });
    }

    private getTaskState(task: IBootTask): BootTaskState {
        return (
            this._nodes.find((node) => node.task === task)?.state ??
            BootTaskState.Unknown
        );
    }

    private createPromiseResolver(): Promise<TAppBootResult> {
        return new Promise((resolve, reject) => {
            this._promiseResolve = resolve;
            this._promiseReject = reject;
        });
    }

    private resolveNodeDependencies(node: TBootGraphNode): boolean {
        let isUnreachable = false;
        const { task } = node;
        const dependencies = task.dependsOn ?? [];
        for (let i = 0; i < dependencies.length; i++) {
            const dependencyTask = dependencies[i];

            // Search in graph
            let dependencyNode: TBootGraphNode | TNullable = this._nodes.find(
                (it) => it!.task === dependencyTask.task,
            );

            if (!dependencyNode) {
                // Search in unreachable tasks list
                dependencyNode = this._unreachableNodes.find(
                    (it) => it!.task === dependencyTask.task,
                );
            }

            if (dependencyNode) {
                node.depends.push(dependencyNode);
                dependencyNode.children.push(node);
            } else {
                isUnreachable = true;
            }
        }
        return isUnreachable;
    }

    private resolveNodeChildren(node: TBootGraphNode) {
        let someChildResolved = false;
        for (let i = this._unreachableNodes.length - 1; i >= 0; --i) {
            let unreachableNode = this._unreachableNodes[i];
            // NOTE: An unreachable node cannot be undefined here, but we are doing a check for type-safe
            // istanbul ignore next
            if (!unreachableNode) continue;

            const dependencyMatch = unreachableNode.task.dependsOn?.some(
                (it) => it.task === node.task,
            );
            if (!dependencyMatch) continue;

            unreachableNode.depends.push(node);
            node.children.push(unreachableNode);

            const pathResolved =
                unreachableNode.depends.length ===
                    unreachableNode.task.dependsOn?.length ?? 0;
            if (pathResolved) {
                this._nodes.push(unreachableNode);
                this._unreachableNodes[i] = undefined;
                someChildResolved = true;
            }
        }
        if (someChildResolved)
            this._unreachableNodes = this._unreachableNodes.filter(Boolean);
    }

    private addTaskToGraph(task: IBootTask): void {
        Object.freeze(task);
        const node: TBootGraphNode = {
            task,
            state: BootTaskState.Idle,
            depends: [],
            children: [],
        };

        if (this.resolveNodeDependencies(node))
            this._unreachableNodes.push(node);
        else this._nodes.push(node);

        this.resolveNodeChildren(node);
    }

    private prepareAwaiters(nodes: readonly TBootGraphNode[]): void {
        for (let i = 0; i < nodes.length; ++i) {
            const node = nodes[i];
            if (this._awaiters.find((it) => it.node === node)) continue;

            if (this._completedNodes.length > 0) {
                const skip = node.task.dependsOn?.some((depTask) => {
                    const state = this.getTaskState(depTask.task);
                    return (
                        state === BootTaskState.Skipped ||
                        state === BootTaskState.Failure
                    );
                });

                if (skip) {
                    // istanbul ignore next
                    if (!node.task.optional) {
                        this.fail(
                            `Mandatory task ${node.task.name} was skipped`,
                        );
                        return;
                    }
                    node.state = BootTaskState.Skipped;
                    this._completedNodes.push(node);
                    continue;
                }
            }

            this._awaiters.push({ node, wait: [...node.depends] });
        }
    }

    private processAwaiters(): void {
        if (this._status !== AppBootStatus.Running) return;

        const nodesToRun: TBootGraphNode[] = [];
        const updatedAwaitersList: TBootGraphNodeAwaiter[] = [];

        for (let i = 0; i < this._awaiters.length; ++i) {
            const awaiter = this._awaiters[i];
            const keepWaiting: TBootGraphNode[] = [];
            let skip = false;
            for (let depIndex = 0; depIndex < awaiter.wait.length; ++depIndex) {
                const dependency = awaiter.wait[depIndex];
                if (dependency.state === BootTaskState.Success) continue;
                if (
                    dependency.state === BootTaskState.Failure ||
                    dependency.state === BootTaskState.Skipped
                ) {
                    const taskDependency = awaiter.node.task.dependsOn?.find(
                        (it) => it.task === dependency.task,
                    );
                    if (taskDependency && !taskDependency.optional) {
                        skip = true;
                        break;
                    }
                } else {
                    keepWaiting.push(dependency);
                }
            }

            if (skip) {
                awaiter.node.state = BootTaskState.Skipped;
                this._completedNodes.push(awaiter.node);
            } else if (keepWaiting.length === 0) {
                nodesToRun.push(awaiter.node);
            } else {
                awaiter.wait = keepWaiting;
                updatedAwaitersList.push(awaiter);
            }
        }

        this._awaiters = updatedAwaitersList;
        if (nodesToRun.length > 0) {
            this.runTasks(nodesToRun);
        } else if (this._awaiters.length === 0) {
            for (let i = 0; i < this._nodes.length; i++) {
                const node = this._nodes[i];
                if (node.state !== BootTaskState.Idle) continue;

                const skip =
                    node.task.optional &&
                    node.task.dependsOn?.some((depTask) => {
                        const state = this.getTaskState(depTask.task);
                        return (
                            state === BootTaskState.Skipped ||
                            state === BootTaskState.Failure
                        );
                    });

                if (skip) {
                    node.state = BootTaskState.Skipped;
                    this._completedNodes.push(node);
                } else {
                    this.fail(`Mandatory task "${node.task.name}" was skipped`);
                    return;
                }
            }
            // NOTE: Handled by common promise
            // noinspection JSIgnoredPromiseFromCall
            this.finish();
        }
    }

    private async finish(): Promise<void> {
        // istanbul ignore next
        if (this._status !== AppBootStatus.Running) {
            /* It's impossible case, but check for state safety */
            return;
        }
        this._status = AppBootStatus.Finalizing;
        await this._activeProcessPromise;

        this._status = AppBootStatus.Done;
        const result: TAppBootResult = {
            success: this._completedNodes
                .filter((it) => it.state === BootTaskState.Success)
                .map((it) => it.task),
            failure: this._completedNodes
                .filter((it) => it.state === BootTaskState.Failure)
                .map((it) => it.task),
            skipped: this._completedNodes
                .filter((it) => it.state === BootTaskState.Skipped)
                .map((it) => it.task),
            unreachable: this._unreachableNodes.map((it) => it!.task),
        };

        this._finishEventListeners.forEach((listener) =>
            listener({
                type: "finish",
                result,
            }),
        );

        // NOTE: Promise isn't null after run
        // istanbul ignore next
        this._promiseResolve?.(result);

        // Auto-dispose after process finish
        if (this._runningOptions?.disposeOnFinish) this.dispose();
    }

    private fail(message: string, cause?: Error): void {
        this._status = AppBootStatus.Failed;

        // Mark uncompleted tasks as skipped
        this._nodes.forEach((it) => {
            if (
                it.state !== BootTaskState.Idle &&
                it.state !== BootTaskState.Running
            )
                return;
            it.state = BootTaskState.Skipped;
            this._completedNodes.push(it);
        });
        // NOTE: Promise isn't null after run
        // istanbul ignore next
        this._promiseReject?.(
            Error(cause ? `${message} (cause: ${cause.message})` : message),
        );
    }

    private runTasks(nodes: readonly TBootGraphNode[]): void {
        if (nodes.length === 0) {
            // NOTE: Handled by common promise
            // noinspection JSIgnoredPromiseFromCall
            this.finish();
            return;
        }

        const promises = nodes.map(async (node) => {
            this.prepareAwaiters(node.children);
            if (!BootTaskState.isCompleted(node.state)) {
                node.state = BootTaskState.Running;
                try {
                    await node.task.run();
                    node.state = BootTaskState.Success;
                    this._completedNodes.push(node);
                    this.emitProcessEvent(node.task);
                } catch (err) {
                    node.state = BootTaskState.Failure;
                    if (node.task.optional) {
                        this._completedNodes.push(node);
                        this.emitProcessEvent(node.task);
                    } else {
                        this.fail(
                            `The important task "${node.task.name}" was failed`,
                            err instanceof Error ? err : Error(String(err)),
                        );
                        return;
                    }
                }
            }
            this.processAwaiters();
        });

        // Don't forget to await previous tasks
        if (this._activeProcessPromise)
            promises.push(this._activeProcessPromise);

        this._activeProcessPromise = Promise.all(promises);
    }

    // endregion: Private methods
}
