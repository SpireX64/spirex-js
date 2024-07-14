// Package: @spirex/js-event-emitter
// Copyright 2024 (c) Artem Sobolenkov
// https://github.com/spirex64

export type EventListenerDisposable<Event> = {
    readonly event: Event;
    readonly dispose: () => void;
}

type AnyEvent = '*';
const ANY_EVENT_KEY: AnyEvent = '*';

export type EventListenerFunction<EventsMap extends object, EventKey extends AnyEvent | keyof EventsMap> =
    (eventArgs: EventKey extends keyof EventsMap ? EventsMap[EventKey] : EventsMap[keyof EventsMap], event: EventKey) => Promise<void> | void

export class EventEmitter<T extends object = Record<string, unknown>> {
    private readonly _listenersMap = new Map<keyof T | AnyEvent, Set<EventListenerFunction<T, any>>>();
    private _state: Map<keyof T, unknown> | null = null;

    public any(listener: EventListenerFunction<T, keyof T>): EventListenerDisposable<AnyEvent> {
        return this.add(ANY_EVENT_KEY, listener);
    }

    public on(event: keyof T, listener: EventListenerFunction<T, typeof event>): EventListenerDisposable<typeof event> {
        this.add(event, listener);
        const state = this._state?.get(event);
        if (state) listener(state as any, event);
        return this.add(event, listener);
    }

    public once(event: keyof T, listener: EventListenerFunction<T, typeof event>): EventListenerDisposable<typeof event> {
        const wrappedListener: EventListenerFunction<T, typeof event> = (eventArgs, event) => {
            // @ts-ignore
            this.off(event, wrappedListener);
            listener(eventArgs, event);
        }
        return this.add(event, wrappedListener);
    }

    public off(event: AnyEvent | keyof T, listener?: EventListenerFunction<T, typeof event>): void {
        if (listener) {
            const listeners = this._listenersMap.get(event)
            if (listeners?.delete(listener) && listeners.size === 0)
                this._listenersMap.delete(event);
        } else if (event === ANY_EVENT_KEY) this._listenersMap.clear();
        else this._listenersMap.delete(event);
    }

    public emit<Key extends keyof T>(event: Key, data: T[Key], preserve: boolean = false): void {
        this._listenersMap.get(event)?.forEach(it => it(data as any, event))
        if (event !== ANY_EVENT_KEY)
            this._listenersMap.get(ANY_EVENT_KEY)?.forEach(it => it(data as any, event))
        if (preserve) {
            if (!this._state) this._state = new Map()
            this._state.set(event, data);
        }
    }

    private add<TKey extends (keyof T) | AnyEvent>(event: TKey, listener: EventListenerFunction<T, any>): EventListenerDisposable<TKey> {
        if (this._listenersMap.has(event)) this._listenersMap.get(event)?.add(listener)
        else this._listenersMap.set(event, new Set<EventListenerFunction<T, any>>().add(listener))
        return {event, dispose: () => this.off(event, listener)}
    }
}
