import { LinkedList } from "./LinkedList";

describe("LinkedList", () => {
    describe("Creating LinkedList", () => {
        test("Constructor", () => {
            // Act ---------
            const list = new LinkedList();

            // Assert ------
            expect(list.size).toBe(0);
            expect(list.isEmpty).toBeTruthy();
            expect(list.headNode).toBeUndefined();
            expect(list.tailNode).toBeUndefined();
            expect(list.head).toBeUndefined();
            expect(list.tail).toBeUndefined();
        });

        test("From iterable", () => {
            // Act ----------
            const list = LinkedList.from([1, 2, 3]);

            // Assert -------
            expect(list.isEmpty).toBeFalsy();
            expect(list.size).toBe(3);
            expect(list.head).toBe(1);
            expect(list.tail).toBe(3);
        });

        test("Of values", () => {
            // Act ----------
            const list = LinkedList.of(1, 2, 3);

            // Assert -------
            expect(list.isEmpty).toBeFalsy();
            expect(list.size).toBe(3);
            expect(list.head).toBe(1);
            expect(list.tail).toBe(3);
        });
    });

    describe("Get values", () => {
        test("Get head value", () => {
            // Arrange ---------
            const expectedValue = 42;
            const list = LinkedList.from([expectedValue, 55, 88]);

            // Act -------------
            const head = list.head;

            // Assert ----------
            expect(head).toBe(expectedValue);
        });

        test("Get tail value", () => {
            // Arrange ---------
            const expectedValue = 42;
            const list = LinkedList.from([55, 88, expectedValue]);

            // Act -------------
            const head = list.tail;

            // Assert ----------
            expect(head).toBe(expectedValue);
        });

        test("Get head node", () => {
            // Arrange ---------
            const expectedValue = 1;
            const expectedNextValue = 2;
            const list = LinkedList.from([
                expectedValue,
                expectedNextValue,
                42,
            ]);

            // Act -------------
            const headNode = list.headNode;

            // Assert ----------
            expect(headNode).not.toBeUndefined();
            expect(headNode?.value).toBe(expectedValue);
            expect(headNode?.prev).toBeNull();
            expect(headNode?.next).not.toBeNull();
            expect(headNode?.next?.value).toBe(expectedNextValue);
            expect(headNode).not.toBe(list.headNode);
        });

        test("Get tail node", () => {
            // Arrange ---------
            const expectedValue = 1;
            const expectedPrevValue = 2;
            const list = LinkedList.from([
                42,
                expectedPrevValue,
                expectedValue,
            ]);

            // Act -------------
            const tailNode = list.tailNode;

            // Assert ----------
            expect(tailNode).not.toBeUndefined();
            expect(tailNode?.value).toBe(expectedValue);
            expect(tailNode?.next).toBeNull();
            expect(tailNode?.prev).not.toBeNull();
            expect(tailNode?.prev?.value).toBe(expectedPrevValue);
            expect(tailNode).not.toBe(list.tailNode);
        });
    });

    describe("Inserting items", () => {
        describe("Insert to head", () => {
            test("Insert first item to head", () => {
                // Arrange -------
                const expectedValue = 42;
                const list = new LinkedList<number>();

                // Act -----------
                list.insertHead(expectedValue);

                // Assert -------
                expect(list.isEmpty).toBeFalsy();
                expect(list.size).toBe(1);
                expect(list.head).toBe(expectedValue);
                expect(list.tail).toBe(expectedValue);
            });

            test("Insert second item to head", () => {
                // Arrange -------
                const expectedHeadValue = "head";
                const expectedTailValue = "tail";

                const list = new LinkedList<string>();
                list.insertTail(expectedTailValue);

                // Act -----------
                list.insertHead(expectedHeadValue);

                // Assert -------
                expect(list.size).toBe(2);
                expect(list.head).toBe(expectedHeadValue);
                expect(list.tail).toBe(expectedTailValue);
            });
        });

        describe("Insert to tail", () => {
            test("Insert first item to tail", () => {
                // Arrange -------
                const expectedValue = 42;
                const list = new LinkedList<number>();

                // Act -----------
                list.insertTail(expectedValue);

                // Assert -------
                expect(list.isEmpty).toBeFalsy();
                expect(list.size).toBe(1);
                expect(list.head).toBe(expectedValue);
                expect(list.tail).toBe(expectedValue);
            });

            test("Insert second item to tail", () => {
                // Arrange -------
                const expectedHeadValue = "head";
                const expectedTailValue = "tail";

                const list = new LinkedList<string>();
                list.insertHead(expectedHeadValue);

                // Act -----------
                list.insertTail(expectedTailValue);

                // Assert -------
                expect(list.size).toBe(2);
                expect(list.head).toBe(expectedHeadValue);
                expect(list.tail).toBe(expectedTailValue);
            });
        });
    });

    describe("Removing items", () => {
        describe("Remove from head", () => {
            test("Remove empty head", () => {
                // Arrange -----
                const list = new LinkedList();

                // Act ----------
                const value = list.removeHead();

                // Assert -------
                expect(value).toBeUndefined();
                expect(list.head).toBeUndefined();
                expect(list.size).toBe(0);
            });

            test("Remove last from head", () => {
                // Arrange -----
                const expectedValue = 42;
                const list = LinkedList.of(expectedValue);

                // Act ----------
                const value = list.removeHead();

                // Assert -------
                expect(value).toBe(expectedValue);
                expect(list.isEmpty).toBeTruthy();
                expect(list.size).toBe(0);
                expect(list.headNode).toBeUndefined();
                expect(list.tailNode).toBeUndefined();
            });

            test("Remove head value", () => {
                // Arrange --------
                const expectedValue = 42;
                const expectedNextHeadValue = 37;
                const list = LinkedList.of(
                    expectedValue,
                    expectedNextHeadValue,
                    123,
                );

                // Act ------------
                const value = list.removeHead();

                // Assert ---------
                expect(value).toBe(expectedValue);
                expect(list.size).toBe(2);
                expect(list.head).toBe(expectedNextHeadValue);
                expect(list.headNode?.prev).toBeFalsy();
            });
        });

        describe("Remove from tail", () => {
            test("Remove empty tail", () => {
                // Arrange -----
                const list = new LinkedList();

                // Act ----------
                const value = list.removeTail();

                // Assert -------
                expect(value).toBeUndefined();
                expect(list.tail).toBeUndefined();
                expect(list.size).toBe(0);
            });

            test("Remove last from tail", () => {
                // Arrange -----
                const expectedValue = 42;
                const list = LinkedList.of(expectedValue);

                // Act ----------
                const value = list.removeTail();

                // Assert -------
                expect(value).toBe(expectedValue);
                expect(list.isEmpty).toBeTruthy();
                expect(list.size).toBe(0);
                expect(list.tailNode).toBeUndefined();
                expect(list.headNode).toBeUndefined();
            });

            test("Remove tail value", () => {
                // Arrange --------
                const expectedValue = 42;
                const expectedNextTailValue = 37;
                const list = LinkedList.of(
                    123,
                    expectedNextTailValue,
                    expectedValue,
                );

                // Act ------------
                const value = list.removeTail();

                // Assert ---------
                expect(value).toBe(expectedValue);
                expect(list.tail).toBe(expectedNextTailValue);
                expect(list.tailNode?.next).toBeFalsy();
                expect(list.size).toBe(2);
            });
        });
    });

    describe("Searching", () => {
        describe("Check list has value", () => {
            test("Includes value", () => {
                // Arrange ----
                const list = LinkedList.of(12, 23, 34);

                // Act --------
                const hasValue = list.has(23);

                // Assert -----
                expect(hasValue).toBeTruthy();
            });

            test("Not includes value", () => {
                // Arrange ----
                const list = LinkedList.of(12, 34);

                // Act --------
                const hasValue = list.has(23);

                // Assert -----
                expect(hasValue).toBeFalsy();
            });
        });
    });
});
