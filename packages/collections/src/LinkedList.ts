// Package: @spirex/collections
// Copyright 2025 (c) Artem Sobolenkov
// MIT License
// https://github.com/spirex64

interface ReadonlyLinkedList<T> {
    readonly head: T | undefined;
    readonly tail: T | undefined;
    readonly isEmpty: boolean;
    readonly size: number;
}

type LinkedListNode<T> = {
    next: LinkedListNode<T> | null;
    prev: LinkedListNode<T> | null;
    value: T;
};

export class LinkedList<T = unknown> implements ReadonlyLinkedList<T> {
    private _head: LinkedListNode<T> | undefined;
    private _tail: LinkedListNode<T> | undefined;

    public get head(): T | undefined {
        return this._head?.value;
    }

    public get tail(): T | undefined {
        return this._tail?.value;
    }

    public get isEmpty(): boolean {
        return !this._head;
    }

    public get size(): number {
        return 0;
    }
}
