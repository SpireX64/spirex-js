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
    list: ReadonlyLinkedList<T>;
    next: LinkedListNode<T> | null;
    prev: LinkedListNode<T> | null;
    value: T;
};

export class LinkedList<T = unknown> implements ReadonlyLinkedList<T> {
    private _head: LinkedListNode<T> | undefined;
    private _tail: LinkedListNode<T> | undefined;
    private _size: number = 0;

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
        return this._size;
    }

    public pushHead(item: T): void {
        this._head = this._tail = {
            list: this,
            next: null,
            prev: null,
            value: item,
        };
        this._size = 1;
    }

    public pushTail(item: T): void {
        this._tail = this._head = {
            list: this,
            next: null,
            prev: null,
            value: item,
        };
        this._size = 1;
    }
}
