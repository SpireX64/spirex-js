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
}
