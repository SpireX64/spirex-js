import { Signal } from "./Signal";

describe("Signal", () => {
    test("New instance", () => {
        // Act --------
        const signal = new Signal();

        // Assert -----
        expect(signal.listenersCount).toBe(0);
        expect(signal.state).toBeNull();
    });

    test("Emit & Listen signal", () => {
        // Arrange --------
        const expectedValues = [11, 42];
        const signal = new Signal<number>();

        const listener = jest.fn();

        // Act -------------
        signal.on(listener);
        signal.emit(expectedValues[0]);
        signal.emit(expectedValues[1]);

        // Assert ----------
        expect(signal.listenersCount).toBe(1);
        expect(listener).toHaveBeenNthCalledWith(1, expectedValues[0]);
        expect(listener).toHaveBeenNthCalledWith(2, expectedValues[1]);
        expect(signal.state).toBeNull();
    });

    test("Listen signal once", () => {
        // Arrange ---------
        const values = [11, 42];
        const signal = new Signal<number>();

        const listener = jest.fn();

        // Act -------------
        signal.once(listener);
        signal.emit(values[0]);
        signal.emit(values[1]);

        // Assert ----------
        expect(signal.listenersCount).toBe(0);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(values[0]);
    });

    test("Add many listeners", () => {
        // Arrange ----------
        const expectedValue = 1;
        const signal = new Signal<number>();

        const listenerA = jest.fn();
        const listenerB = jest.fn();

        // Act -------------
        signal.on(listenerA);
        signal.on(listenerB);
        signal.emit(expectedValue);

        // Assert -----------
        expect(signal.listenersCount).toBe(2);
        expect(listenerA).toHaveBeenCalledTimes(1);
        expect(listenerA).toHaveBeenCalledWith(expectedValue);
        expect(listenerB).toHaveBeenCalledTimes(1);
        expect(listenerB).toHaveBeenCalledWith(expectedValue);
    });

    test("Add listener twice", () => {
        // Arrange ---------
        const expectedValue = 11;
        const signal = new Signal<number>();

        const listener = jest.fn();
        signal.on(listener);

        // Act -----------
        signal.on(listener);
        signal.emit(expectedValue);

        // Expect --------
        expect(signal.listenersCount).toBe(1);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expectedValue);
    });

    test("Remove listener", () => {
        // Arrange ------
        const expectedValue = 42;
        const signal = new Signal<number>();

        const listenerA = jest.fn();
        const listenerB = jest.fn();
        signal.on(listenerB);

        // Act ---------
        signal.off(listenerA);
        signal.emit(expectedValue);

        // Assert -----
        expect(signal.listenersCount).toBe(1);
        expect(listenerA).not.toHaveBeenCalled();
        expect(listenerB).toHaveBeenCalledWith(expectedValue);
    });

    test("Remove all listeners", () => {
        // Arrange ------
        const expectedValue = 42;
        const signal = new Signal<number>();

        const listenerA = jest.fn();
        signal.on(listenerA);
        const listenerB = jest.fn();
        signal.on(listenerB);

        // Act ---------
        signal.off("*");
        signal.emit(expectedValue);

        // Assert -----
        expect(signal.listenersCount).toBe(0);
        expect(listenerA).not.toHaveBeenCalled();
        expect(listenerB).not.toHaveBeenCalled();
    });

    test("Disposable object", () => {
        // Arrange -----------
        const signal = new Signal();
        const listener = jest.fn();

        // Act ---------------
        const disposable = signal.on(listener);

        // Assert ------------
        expect(disposable).not.toBeUndefined();
        expect(disposable.signal).toBe(signal);
    });

    test("Dispose listener", () => {
        // Arrange -----
        const expectedValues = [11, 42];
        const signal = new Signal<number>();

        const listener = jest.fn();
        const disposable = signal.on(listener);

        // Act -------
        signal.emit(expectedValues[0]);
        disposable.dispose();
        signal.emit(expectedValues[1]);

        // Assert ---------
        expect(signal.listenersCount).toBe(0);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expectedValues[0]);
        expect(disposable.signal).toBeUndefined();
    });

    test("Dispose 'once' listener", () => {
        // Arrange -----
        const expectedValue = 42;
        const signal = new Signal<number>();

        const listener = jest.fn();
        const disposable = signal.once(listener);

        // Act -------
        disposable.dispose();
        signal.emit(expectedValue);

        // Assert ---------
        expect(signal.listenersCount).toBe(0);
        expect(listener).not.toHaveBeenCalled();
        expect(disposable.signal).toBeUndefined();
    });

    test("Dispose listener twice", () => {
        // Arrange ----------
        const signal = new Signal();
        const listener = jest.fn();
        const disposable = signal.on(listener);

        // Act --------------
        disposable.dispose();
        disposable.dispose();

        // Assert -----------
        expect(signal.listenersCount).toBe(0);
        expect(disposable.signal).toBeUndefined();
    });

    test("Dispose 'once' listener twice", () => {
        // Arrange ----------
        const signal = new Signal();
        const listener = jest.fn();
        const disposable = signal.once(listener);

        // Act --------------
        disposable.dispose();
        disposable.dispose();

        // Assert -----------
        expect(signal.listenersCount).toBe(0);
        expect(disposable.signal).toBeUndefined();
    });

    test("New instance with initial state", () => {
        // Arrange -----------
        const expectedState = 42;

        // Act ---------------
        const signal = new Signal<number>(expectedState);

        // Assert ------------
        expect(signal.state).toBe(expectedState);
    });

    test("Emit new state", () => {
        // Arrange ----------
        const expectedState = 42;
        const signal = new Signal<number>(0);

        // Act --------------
        signal.emit(expectedState, true);

        // Assert ----------
        expect(signal.state).toBe(expectedState);
    });

    test("Receive state on listen", () => {
        // Arrange ----------
        const expectedValue = 42;
        const signal = new Signal<number>(expectedValue);
        const listener = jest.fn();

        // Act --------------
        signal.on(listener);

        // Assert -----------
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expectedValue);
    });

    test("Do not receive state on listen once", () => {
        // Arrange ----------
        const expectedValue = 42;
        const signal = new Signal<number>(expectedValue);
        const listener = jest.fn();

        // Act --------------
        signal.once(listener);

        // Assert -----------
        expect(listener).not.toHaveBeenCalled();
    });

    test("Receive last state on listen", () => {
        // Arrange --------
        const expectedValue = 42;
        const signal = new Signal<number>(11);
        const listener = jest.fn();

        // Act ------------
        signal.emit(expectedValue, true);
        signal.on(listener);

        // Assert ---------
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expectedValue);
    });
});
