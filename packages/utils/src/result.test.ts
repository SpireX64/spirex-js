// Package: @spirex/js-boot
// Copyright 2024 (c) Artem Sobolenkov
// https://github.com/spirex64

import { Result } from "./result";

describe("Result", () => {
    test("Make OK result", () => {
        const expectedValue = "value";
        const result = Result.ok(expectedValue);

        expect(result.isOk).toBeTruthy();
    });

    test("Make ERROR result", () => {
        const expectedError = new Error();
        const result = Result.err(expectedError);

        expect(result.isOk).toBeFalsy();
    });

    test("Unwrap OK result", () => {
        const expectedValue = 123;
        const result = Result.ok(expectedValue);

        expect(result.unwrap()).toBe(expectedValue);
    });

    test("Unwrap ERROR result", () => {
        const expectedError = new Error();
        const result = Result.err(expectedError);

        expect(() => result.unwrap()).toThrow(expectedError);
        expect(result.error).toBe(expectedError);
    });

    test("Catch OK", () => {
        const expectedValue = "value";
        const func = jest.fn(() => expectedValue);

        const result = Result.catch(func);

        expect(result.isOk).toBeTruthy();
        expect(result.unwrap()).toBe(expectedValue);
    });

    test("Catch ERROR result", () => {
        const expectedError = new Error();
        const func = () => {
            throw expectedError;
        };

        const result = Result.catch(func);

        expect(result.isOk).toBeFalsy();
        expect(() => result.unwrap()).toThrow(expectedError);
        expect(result.error).toBe(expectedError);
    });

    test("Catch with params", () => {
        const valueA = 12;
        const valueB = 30;
        const expectedValue = valueA + valueB;

        const sum = jest.fn((a: number, b: number) => a + b);
        const result = Result.catch(sum, valueA, valueB);

        expect(result.isOk).toBeTruthy();
        expect(result.unwrap()).toBe(expectedValue);
    });

    test("Catch non-error instance", () => {
        const func = () => {
            throw "error";
        };
        expect(() => Result.catch(func)).toThrow();
    });

    test("Catch async OK result", async () => {
        const expectedValue = "value";

        const result = await Result.catchAsync(Promise.resolve(expectedValue));

        expect(result.isOk).toBeTruthy();
        expect(result.unwrap()).toBe(expectedValue);
    });

    test("Catch async ERROR result", async () => {
        const expectedError = new Error();
        const result = await Result.catchAsync(Promise.reject(expectedError));

        expect(result.isOk).toBeFalsy();
        expect(() => result.unwrap()).toThrow(expectedError);
        expect(result.error).toBe(expectedError);
    });

    test("Call func if value OK", () => {
        const expectedValue = "value";
        const result = Result.ok(expectedValue);

        const handleResult = jest.fn(() => {});
        result.ifOk(handleResult);

        expect(handleResult).toHaveBeenCalledWith(expectedValue);
    });

    test("Call func if value OK and return value", () => {
        const expectedValue = "value";
        const prefix = "ok";
        const result = Result.ok(expectedValue);

        const handleResult = jest.fn((value) => prefix + value);
        const returnedValue = result.ifOk(handleResult);

        expect(handleResult).toHaveBeenCalledWith(expectedValue);
        expect(returnedValue).toBe(prefix + expectedValue);
    });

    test("Dont call func if error", () => {
        const result = Result.err(new Error());

        const handleResult = jest.fn(() => {});
        result.ifOk(handleResult);
    });

    test("Get default value from handler if error", () => {
        const expectedValue = "fail";
        const result = Result.err(new Error());

        const handleResult = jest.fn(() => "ok");
        const value = result.ifOk(handleResult) ?? expectedValue;

        expect(value).toBe(expectedValue);
    });
});
