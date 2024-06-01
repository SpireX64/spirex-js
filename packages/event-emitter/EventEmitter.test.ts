import {EventEmitter} from "./EventEmitter";

describe('EventEmitter', function () {
    test('Emit event to single listener', () => {
        // Arrange -------
        const expectedValue = 42
        const emitter = new EventEmitter<{ value: number }>()

        const listener = jest.fn()
        emitter.on('value', listener);

        // Act ------------
        emitter.emit('value', expectedValue);

        // Assert ---------
        expect(listener).toHaveBeenCalledWith(expectedValue, 'value')
    })

    test('Emit event to many listeners', () => {
        // Arrange --------
        const expectedValue = 42
        const emitter = new EventEmitter<{ value: number }>();

        const listenerA = jest.fn()
        emitter.on('value', listenerA)
        const listenerB = jest.fn()
        emitter.on('value', listenerB)

        // Act ------------
        emitter.emit('value', expectedValue)

        // Assert ---------
        expect(listenerA).toHaveBeenCalledWith(expectedValue, 'value')
        expect(listenerB).toHaveBeenCalledWith(expectedValue, 'value')
    })

    test('Broadcast listener', () => {
        // Arrange ----------
        const valueA = 42;
        const valueB = 'Hello';

        const emitter = new EventEmitter<{ a: number, b: string }>();

        const listener = jest.fn();
        emitter.any(listener)

        // Act ---------------
        emitter.emit('a', valueA)
        emitter.emit('b', valueB)

        // Assert ------------
        expect(listener).toHaveBeenNthCalledWith(1, valueA, 'a')
        expect(listener).toHaveBeenNthCalledWith(2, valueB, 'b')
    })

    test('Dispose listener', () => {
        // Arrange ---------
        const valueA = 123;
        const valueB = 543;

        const emitter = new EventEmitter<{ value: number }>();

        const listener = jest.fn();
        emitter.on('value', listener)

        // Act -------------
        emitter.emit("value", valueA);
        emitter.off('value', listener);
        emitter.emit('value', valueB);

        // Assert ----------
        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).not.toHaveBeenCalledWith(valueB)
    })

    test('Dispose broadcast listener', () => {
        // Arrange ---------
        const valueA = 123;
        const valueB = 543;

        const emitter = new EventEmitter<{ value: number }>();

        const listener = jest.fn();
        emitter.any(listener)

        // Act -------------
        emitter.emit("value", valueA);
        emitter.off('*', listener);
        emitter.emit('value', valueB);

        // Assert ----------
        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).not.toHaveBeenCalledWith(valueB)
    })

    test('Dispose broadcast listener by disposable', () => {
        // Arrange ---------
        const valueA = 123;
        const valueB = 543;

        const emitter = new EventEmitter<{ value: number }>();

        const listener = jest.fn();
        const disposable = emitter.any(listener)

        // Act -------------
        emitter.emit("value", valueA);
        disposable.dispose();
        emitter.emit('value', valueB);

        // Assert ----------
        expect(disposable).not.toBeFalsy();
        expect(disposable.event).toBe('*')

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).not.toHaveBeenCalledWith(valueB)
    })

    test('Dispose listener by disposable', () => {
        // Arrange ---------
        const valueA = 123;
        const valueB = 543;

        const emitter = new EventEmitter<{ value: number }>();

        const listener = jest.fn();
        const disposable = emitter.on('value', listener)

        // Act -------------
        emitter.emit("value", valueA);
        disposable.dispose();
        emitter.emit('value', valueB);

        // Assert ----------
        expect(disposable).not.toBeFalsy();
        expect(disposable.event).toBe('value')

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).not.toHaveBeenCalledWith(valueB)
    })

    test('One-time listener', () => {
        // Arrange ---------
        const valueA = 123;
        const valueB = 543;

        const emitter = new EventEmitter<{ value: number }>();

        const listener = jest.fn();
        const disposable = emitter.once('value', listener)

        // Act -------------
        emitter.emit("value", valueA);
        emitter.emit('value', valueB);

        // Assert ----------
        expect(disposable).not.toBeFalsy();
        expect(disposable.event).toBe('value')

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).not.toHaveBeenCalledWith(valueB)
    })

    test('Dispose all listeners of event', () => {
        // Arrange --------------
        const valueA = 12;
        const valueB = 43;

        const emitter = new EventEmitter<{ value: number }>();

        const listenerA = jest.fn()
        emitter.on('value', listenerA)
        const listenerB = jest.fn()
        emitter.on('value', listenerB)

        // Act -------------------
        emitter.emit('value', valueA)
        emitter.off('value')
        emitter.emit('value', valueB)

        // Assert -------------
        expect(listenerA).toHaveBeenCalledTimes(1)
        expect(listenerA).not.toHaveBeenCalledWith(valueB)

        expect(listenerB).toHaveBeenCalledTimes(1)
        expect(listenerB).not.toHaveBeenCalledWith(valueB)
    })
});
