export type TNullable = null | undefined;
export type TFalsy = TNullable | false | 0;

export type TBootTaskSyncDelegate = () => void;
export type TBootTaskAsyncDelegate = () => Promise<void>;
export type TBootTaskDelegate = TBootTaskSyncDelegate | TBootTaskAsyncDelegate;

export type TBootTask = {
    delegate: TBootTaskDelegate;
};

export class Boot {
    // region: STATIC METHODS

    public static task(delegate: TBootTaskDelegate): TBootTask {
        return { delegate };
    }

    // endregion: STATIC METHODS

    // region: FIELDS

    private readonly _tasks: TBootTask[] = [];

    // endregion: FIELDS

    // region: PROPERTIES

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
