export type TSignalListenerFunction<T> = (signalArgs: T) => void;

export interface ISignal<T> {
    on(listener: TSignalListenerFunction<T>): TSignalListenerDisposable<T>;
    once(listener: TSignalListenerFunction<T>): TSignalListenerDisposable<T>;
    off(listener: TSignalListenerFunction<T>): void;
}

export type TSignalListenerDisposable<T> = Readonly<{
    signal: ISignal<T>;
    dispose: () => boolean;
}>;

export class SignalSource<T> implements ISignal<T> {
    private _state: T | null = null;
    private readonly _listeners = new Set<TSignalListenerFunction<T>>();

    private constructor(initialValue: T | null = null) {
        if (initialValue != null) {
            this._state = initialValue;
        }
    }

    public on(
        listener: TSignalListenerFunction<T>,
    ): TSignalListenerDisposable<T> {
        this._listeners.add(listener);
        if (this._state !== null) listener(this._state);
        return {
            signal: this,
            dispose: () => this.off(listener),
        };
    }

    public once(
        listener: TSignalListenerFunction<T>,
    ): TSignalListenerDisposable<T> {
        const wrapperListener = (args: T) => {
            this.off(listener);
            listener(args);
        };
        this._listeners.add(wrapperListener);
        return {
            signal: this,
            dispose: () => this.off(listener),
        };
    }

    public off(listener: "*"): boolean;
    public off(listener: TSignalListenerFunction<T>): boolean;
    public off(listener: TSignalListenerFunction<T> | "*"): boolean {
        if (listener === "*") {
            this._listeners.clear();
            return true;
        }
        return this._listeners.delete(listener);
    }

    public emit(value: T, preserve: boolean = false): void {
        this._listeners.forEach((listener) => listener(value));
        if (preserve) this._state = value;
    }
}
