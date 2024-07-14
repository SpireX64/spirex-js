// Package: @spirex/js-exception
// Copyright 2024 (c) Artem Sobolenkov
// https://github.com/spirex64/spirex-js

// @ts-nocheck
export function Exception(message, cause) {
    const error = Error.apply(this, [message, cause])

    let name = this.constructor?.name
    if (!name || name === 'Function' || name === 'Error') name = "Exception"

    this.name = name
    error.name = name

    // noinspection JSUnusedGlobalSymbols
    this.message = message
    // noinspection JSConstantReassignment
    this.cause = cause
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor)
    } else {
        Object.defineProperty(this, 'stack', {
            get() { return error.stack },
            configurable: true,
        })
    }
}
Exception.prototype = Error.prototype
Exception.notImplemented = () => new Exception('Not implemented')
