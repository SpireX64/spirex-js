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
    });
});
