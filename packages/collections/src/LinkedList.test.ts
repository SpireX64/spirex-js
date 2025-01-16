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

    describe("Adding items", () => {
        test("Add first item to head", () => {
            // Arrange -------
            const expectedValue = 42;
            const list = new LinkedList<number>();

            // Act -----------
            list.pushHead(expectedValue);

            // Assert -------
            expect(list.isEmpty).toBeFalsy();
            expect(list.size).toBe(1);
            expect(list.head).toBe(expectedValue);
            expect(list.tail).toBe(expectedValue);
        });

        test("Add first item to tail", () => {
            // Arrange -------
            const expectedValue = 42;
            const list = new LinkedList<number>();

            // Act -----------
            list.pushTail(expectedValue);

            // Assert -------
            expect(list.isEmpty).toBeFalsy();
            expect(list.size).toBe(1);
            expect(list.head).toBe(expectedValue);
            expect(list.tail).toBe(expectedValue);
        });

        test("Add second item to head", () => {
            // Arrange -------
            const expectedHeadValue = "head";
            const expectedTailValue = "tail";

            const list = new LinkedList<string>();
            list.pushTail(expectedTailValue);

            // Act -----------
            list.pushHead(expectedHeadValue);

            // Assert -------
            expect(list.size).toBe(2);
            expect(list.head).toBe(expectedHeadValue);
            expect(list.tail).toBe(expectedTailValue);
        });

        test("Add second item to tail", () => {
            // Arrange -------
            const expectedHeadValue = "head";
            const expectedTailValue = "tail";

            const list = new LinkedList<string>();
            list.pushHead(expectedHeadValue);

            // Act -----------
            list.pushTail(expectedTailValue);

            // Assert -------
            expect(list.size).toBe(2);
            expect(list.head).toBe(expectedHeadValue);
            expect(list.tail).toBe(expectedTailValue);
        });
    });

    describe("Removing items", () => {
        describe("Pop from head", () => {
            test("Pop empty head", () => {
                // Arrange -----
                const list = new LinkedList();

                // Act ----------
                const value = list.popHead();

                // Assert -------
                expect(value).toBeUndefined();
                expect(list.head).toBeUndefined();
            });

            test("Pop last from head", () => {
                // Arrange -----
                const expectedValue = 42;
                const list = LinkedList.of(expectedValue);

                // Act ----------
                const value = list.popHead();

                // Assert -------
                expect(value).toBe(expectedValue);
                expect(list.isEmpty).toBeTruthy();
                expect(list.size).toBe(0);
                expect(list.headNode).toBeUndefined();
                expect(list.tailNode).toBeUndefined();
            });

            test("Pop head value", () => {
                // Arrange --------
                const expectedValue = 42;
                const expectedNextHeadValue = 37;
                const list = LinkedList.of(
                    expectedValue,
                    expectedNextHeadValue,
                );

                // Act ------------
                const value = list.popHead();

                // Assert ---------
                expect(value).toBe(expectedValue);
                expect(list.head).toBe(expectedNextHeadValue);
            });
        });
    });
});
