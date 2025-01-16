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
});
