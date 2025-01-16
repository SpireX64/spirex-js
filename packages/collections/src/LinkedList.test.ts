import { LinkedList } from "./LinkedList";

describe("LinkedList", () => {
    describe("Creating LinkedList", () => {
        test("Constructor", () => {
            // Act ---------
            const list = new LinkedList();

            // Assert ------
            expect(list.size).toBe(0);
            expect(list.isEmpty).toBeTruthy();
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

            expect(head).toBe(expectedValue);
        });

        test("Get tail value", () => {
            // Arrange ---------
            const expectedValue = 42;
            const list = LinkedList.from([55, 88, expectedValue]);

            // Act -------------
            const head = list.head;

            expect(head).toBe(expectedValue);
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
});
