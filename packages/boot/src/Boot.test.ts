import { Boot } from "./Boot";

describe("Boot", () => {
    describe("Creating Tasks", () => {
        test("Create simple task", () => {
            // Arrange -------
            const taskDelegate = jest.fn();

            // Act -----------
            const task = Boot.task(taskDelegate);

            // Assert --------
            expect(task).not.toBeNull();
            expect(task.delegate).toBe(taskDelegate);
        });
    });
});
