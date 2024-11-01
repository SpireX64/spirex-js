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
    Done,
}

enum BootTaskState {
    Idle,
}

/** @internal */
type TBootTaskNode = {
    task: TBootTask;
    state: BootTaskState;
    awaiting: TBootTaskNode[];
    children: TBootTaskNode[];
};

const ERR_BOOT_STARTED = "Boot process already started";
const ERR_PRIORITY_NOT_A_NUMBER = "Priority must be a number";

export const DEFAULT_TASK_PRIORITY: number = 0;

function isPromise(obj: any): obj is Promise<any> {
    return obj != null && typeof obj === "object" && "then" in obj;
}
export function hasDependency(task: TBootTask, dependency: TBootTask): boolean {
    return task.dependencies.some((it) => it.task === dependency);
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

        return Object.freeze({
            delegate,
            priority,
            optional: Boolean(options?.optional),
            name: options?.name || delegate.name,
            dependencies:
                dependencies?.map((it) =>
                    Object.freeze("task" in it ? it : { task: it }),
                ) ?? [],
        });
    }

    // endregion: STATIC METHODS

    // region: FIELDS

    /** @internal */
    private _state: BootState = BootState.Idle;
    /** @internal */
    private _nodes: TBootTaskNode[] = [];
    /** @internal */
    private _unreachableNodes: TBootTaskNode[] = [];

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

    // endregion: PUBLIC METHODS

    // region: PRIVATE METHODS

    /** @internal */
    private addTaskToProcess(task: TBootTask): void {
        const isExists = this._nodes.find((it) => it.task === task) != null;
        if (isExists) return;

        const node: TBootTaskNode = {
            task,
            state: BootTaskState.Idle,
            awaiting: [],
            children: [],
        };

        if (this.resolveNodeDependencies(node)) {
            this._nodes.push(node);
        } else {
            this._unreachableNodes.push(node);
        }

        this.updateNodeChildren(node);
    }

    /** @internal */
    private resolveNodeDependencies(node: TBootTaskNode): boolean {
        let isResolved = true;
        const deps = node.task.dependencies;
        for (let i = 0; i < deps.length; i++) {
            const dependencyTask = deps[i];

            let dependencyNode: TBootTaskNode | TNullable;
            dependencyNode = this._nodes.find(
                (it) => it.task === dependencyTask.task,
            );

            if (!dependencyNode)
                dependencyNode = this._unreachableNodes.find(
                    (it) => it.task === dependencyTask.task,
                );

            if (dependencyNode) {
                node.awaiting.push(dependencyNode);
                dependencyNode.children.push(node);
            } else {
                isResolved = false;
            }
        }
        return isResolved;
    }

    /** @internal */
    private updateNodeChildren(node: TBootTaskNode): void {
        let isAnyChildResolved = false;
        for (let i = 0; i < this._unreachableNodes.length; i++) {
            const unreachableNode = this._unreachableNodes[i];

            const matched = unreachableNode.task.dependencies.some(
                (it) => it.task === node.task,
            );
            if (!matched) continue;

            unreachableNode.awaiting.push(node);
            node.children.push(unreachableNode);

            const allDependenciesResolved =
                unreachableNode.awaiting.length ===
                unreachableNode.task.dependencies.length;

            if (!allDependenciesResolved) continue;

            delete this._unreachableNodes[i];
            this._nodes.push(unreachableNode);
            isAnyChildResolved = true;
        }

        if (isAnyChildResolved)
            this._unreachableNodes = this._unreachableNodes.filter(Boolean);
    }
    // endregion: PRIVATE METHODS
}
