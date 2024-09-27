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

    public add(task: TBootTask): Boot {
        if (!this._tasks.includes(task)) {
            this._tasks.push(task);
        }
        return this;
    }

    // endregion: PUBLIC METHODS
}
