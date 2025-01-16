// Package: @spirex/collections
// Copyright 2025 (c) Artem Sobolenkov
// MIT License
// https://github.com/spirex64

export type LinkedListNode<T> = {
    list: ReadonlyLinkedList<T>;
    next: LinkedListNode<T> | null;
    prev: LinkedListNode<T> | null;
    value: T;
};

export interface ReadonlyLinkedList<T> {
    readonly head: T | undefined;
    readonly tail: T | undefined;
    readonly headNode: LinkedListNode<T> | undefined;
    readonly tailNode: LinkedListNode<T> | undefined;
    readonly isEmpty: boolean;
    readonly size: number;
}

function makeNode<T>(list: ReadonlyLinkedList<T>, value: T): LinkedListNode<T> {
    return {
        list,
        value,
        next: null,
        prev: null,
    };
}

export type LinkedListPredicate<T> = (
    value: T,
    node: LinkedListNode<T>,
    list: ReadonlyLinkedList<T>,
) => boolean;

export class LinkedList<T = unknown> implements ReadonlyLinkedList<T> {
    public static from<T>(iterable: Iterable<T>): LinkedList<T> {
        const list = new LinkedList<T>();
        const iter = iterable[Symbol.iterator]();
        let cursor;
        while (!(cursor = iter.next()).done) list.insertTail(cursor.value);
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

    public get headNode(): Readonly<LinkedListNode<T>> | undefined {
        return this._head ? this._head : void 0;
    }

    public get tail(): T | undefined {
        return this._tail?.value;
    }

    public get tailNode(): Readonly<LinkedListNode<T>> | undefined {
        return this._tail ? this._tail : void 0;
    }

    public get isEmpty(): boolean {
        return !this._head;
    }

    public get size(): number {
        return this._size;
    }

    public has(value: T): boolean {
        return !!this.findFirst((it) => it === value);
    }

    public findFirst(
        predicate: LinkedListPredicate<T>,
    ): Readonly<LinkedListNode<T>> | null {
        let cursor: LinkedListNode<T> | null | undefined = this._head;
        while (cursor) {
            if (predicate(cursor.value, cursor, this)) return cursor;
            cursor = cursor.next;
        }
        return null;
    }

    public insertHead(item: T): void {
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

    public removeHead(): T | undefined {
        if (!this._head) return void 0;
        const value = this._head.value;
        if (!this._head.next || this._tail === this._head) {
            this._head = this._tail = void 0;
        } else {
            this._head = this._head.next;
            this._head.prev = null;
        }
        this._size -= 1;
        return value;
    }

    public insertTail(item: T): void {
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

    public removeTail(): T | undefined {
        if (!this._tail) return void 0;
        const value = this._tail.value;
        if (!this._tail.prev || this._head === this._tail) {
            this._tail = this._head = void 0;
        } else {
            this._tail = this._tail.prev;
            this._tail.next = null;
        }
        this._size -= 1;
        return value;
    }
}
