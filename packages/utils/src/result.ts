// Package: @spirex/js-boot
// Copyright 2024 (c) Artem Sobolenkov
// https://github.com/spirex64

export class Result<TValue, TError extends Error> {
    public static ok<TValue, TError extends Error>(value: TValue) {
        return new Result<TValue, TError>(value, undefined);
    }

    public static err<TValue, TError extends Error>(error: TError) {
        return new Result<TValue, TError>(undefined, error);
    }

    public static catch<TValue, TError extends Error, TArgs extends any[] = []>(
        func: (...args: TArgs) => TValue,
        ...args: TArgs
    ): Result<ReturnType<typeof func>, TError> {
        try {
            const result = func(...args);
            // @ts-ignore
            return Result.ok<ReturnType<TFunc>, TError>(result);
        } catch (e) {
            if (e instanceof Error) {
                // @ts-ignore
                return Result.err<ReturnType<TFunc>, TError>(e);
            }

            // Catch only 'Error' types
            throw e;
        }
    }

    public static async catchAsync<TValue, TError extends Error>(
        promise: Promise<TValue>,
    ): Promise<Result<TValue, TError>> {
        try {
            let value = await promise;
            return Result.ok<TValue, TError>(value);
        } catch (err) {
            return Result.err<TValue, TError>(err as TError);
        }
    }

    private readonly _value: TValue;

    private readonly _error: TError | undefined;

    private constructor(value: TValue | undefined, error: TError | undefined) {
        this._value = value!;
        this._error = error;
    }

    public get isOk(): boolean {
        return !this._error;
    }

    public get error(): TError | undefined {
        return this._error;
    }

    public ifOk<TReturn>(
        delegate: (value: TValue) => TReturn,
    ): TReturn extends void ? void : TReturn | undefined {
        if (this.isOk) {
            // @ts-ignore
            return delegate(this._value);
        }
        // @ts-ignore
        return undefined;
    }

    public unwrap(): TValue {
        if (this.isOk) return this._value;
        throw this._error;
    }
}
