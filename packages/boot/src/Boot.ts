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
    delegate: TBootTaskDelegate;
};

export class Boot {
    // region: STATIC METHODS

    /**
     * Creates a boot task with the provided delegate function.
     * @param delegate - The delegate function to be executed by task,
     *                   which can be synchronous or asynchronous.
     * @returns The created boot task
     */
    public static task(delegate: TBootTaskDelegate): TBootTask {
        return { delegate };
    }

    // endregion: STATIC METHODS

    // region: FIELDS

    private readonly _tasks: TBootTask[] = [];

    // endregion: FIELDS

    // region: PROPERTIES

    /** Retrieves the number of process tasks. */
    public get tasksCount(): number {
        return this._tasks.length;
    }

    // endregion: PROPERTIES

    // region: PUBLIC METHODS

    public add(task: TBootTask | TFalsy): Boot;
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

    private addTaskToProcess(task: TBootTask): void {
        if (!this._tasks.includes(task)) {
            this._tasks.push(task);
        }
    }

    // endregion: PRIVATE METHODS
}
