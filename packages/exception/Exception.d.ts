/** An exception class that allows inheritance for defining its own exception types. */
export declare class Exception extends Error {
    /**
     * Shortcut for creating a 'Not implemented' exception
     * @return Exception
     */
    public static notImplemented(): Exception;

    /** Indicates the specific original cause of the exception. */
    public readonly cause?: Error | Exception;

    /**
     * Exception class constructor
     * @param message - A human-readable description of the exception.
     * @param cause - the specific original cause of the exception.
     */
    public constructor(message: string, cause?: Error | Exception);
}
