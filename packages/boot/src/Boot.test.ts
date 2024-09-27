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

    describe("Creating instance of boot process", () => {
        test("Create new instance of 'Boot'", () => {
            // Act -----------
            const boot = new Boot();

            // Assert --------
            expect(boot).toBeInstanceOf(Boot);
        });
    });
});
