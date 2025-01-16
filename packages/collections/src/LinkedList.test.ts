import { LinkedList } from "./LinkedList";

describe("LinkedList", () => {
    test("Empty LinkedList", () => {
        // Act ---------
        const list = new LinkedList();

        // Assert ------
        expect(list.size).toBe(0);
        expect(list.isEmpty).toBeTruthy();
        expect(list.head).toBeUndefined();
        expect(list.tail).toBeUndefined();
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
