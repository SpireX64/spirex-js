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

function makeNode<T>(list: ReadonlyLinkedList<T>, value: T): LinkedListNode<T> {
    return {
        list,
        value,
        next: null,
        prev: null,
    };
}

export class LinkedList<T = unknown> implements ReadonlyLinkedList<T> {
    public static from<T>(iterable: Iterable<T>): LinkedList<T> {
        const list = new LinkedList<T>();
        const iter = iterable[Symbol.iterator]();
        let cursor;
        while (!(cursor = iter.next()).done) list.pushTail(cursor.value);
        return list;
    }

    public static of<T>(...values: readonly T[]): LinkedList<T> {
        return LinkedList.from(values);
    }

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
        const pHead = this._head;
        this._head = makeNode(this, item);
        if (pHead) {
            this._head.next = pHead;
            pHead.prev = this._head;
        } else {
            this._tail = this._head;
        }
        this._size += 1;
    }

    public pushTail(item: T): void {
        const pTail = this._tail;
        this._tail = makeNode(this, item);
        if (pTail) {
            this._tail.prev = pTail;
            pTail.next = this._tail;
        } else {
            this._head = this._tail;
        }
        this._size += 1;
    }
}
