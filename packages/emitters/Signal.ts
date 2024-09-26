import type { IListenerDisposable } from "./ListenerDisposable";

export type TSignalListenerFunction<T> = (signalArgs: T) => void;

export interface ISignal<T> {
    on(listener: TSignalListenerFunction<T>): ISignalListenerDisposable<T>;
    once(listener: TSignalListenerFunction<T>): ISignalListenerDisposable<T>;
    off(listener: TSignalListenerFunction<T>): void;
}

export interface ISignalListenerDisposable<T> extends IListenerDisposable {
    signal?: ISignal<T>;
}

export class Signal<T = unknown> implements ISignal<T> {
    private _state: T | null = null;
    private readonly _listeners = new Set<TSignalListenerFunction<T>>();

    public constructor(initialValue: T | null = null) {
        if (initialValue != null) this._state = initialValue;
    }

    public get listenersCount(): number {
        return this._listeners.size;
    }

    public get state(): T | null {
        return this._state;
    }

    public on(
        listener: TSignalListenerFunction<T>,
    ): ISignalListenerDisposable<T> {
        this._listeners.add(listener);
        if (this._state !== null) listener(this._state);
        return {
            signal: this,
            dispose() {
                this.signal?.off(listener);
                delete this.signal;
            },
        };
    }

    public once(
        listener: TSignalListenerFunction<T>,
    ): ISignalListenerDisposable<T> {
        let disposable: ISignalListenerDisposable<T>;
        const wrapperListener = (args: T) => {
            disposable.dispose();
            listener(args);
        };
        disposable = {
            signal: this,
            dispose() {
                this.signal?.off(wrapperListener);
                delete this.signal;
            },
        };
        this._listeners.add(wrapperListener);
        return disposable;
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
