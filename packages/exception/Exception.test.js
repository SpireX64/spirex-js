const { Exception } = require('./Exception')

class CustomException extends Exception {
    constructor(message) { super(message) }
}

describe('Exception', function () {
    test('Exception behavior check', () => {
        const message = 'Exception Message'
        const exception = new Exception(message)

        expect(exception).toBeInstanceOf(Error)
        expect(exception).toBeInstanceOf(Exception)
        expect(exception.name).toBe('Exception')
        expect(exception.message).toBe(message)
        expect(exception.stack).not.toBeFalsy()
    })

    test('Cause error', () => {
        const message = "ExceptionMessage"
        const error = new Error()

        const exception = new Exception(message, error)

        expect(exception.message).toBe(message)
        expect(exception.stack).not.toBeFalsy()
        expect(exception.cause).toBeInstanceOf(Error)
        expect(exception.cause).toBe(error)
    })

    test('Cause exception', () => {
        const message = "Exception"
        const cause = new Exception( "Origin")

        const exception = new Exception("Exception", cause)

        expect(exception.message).toBe(message)
        expect(exception.stack).not.toBeFalsy()
        expect(exception.cause).toBeInstanceOf(Exception)
        expect(exception.cause).toBe(cause)
    })

    test('Custom exception', () => {
        const message = "Custom"
        const exception = new CustomException(message)

        expect(exception).toBeInstanceOf(Error)
        expect(exception).toBeInstanceOf(Exception)
        expect(exception.name).toBe('CustomException')
        expect(exception.message).toBe(message)
        expect(exception.stack).not.toBeFalsy()
    })
});
