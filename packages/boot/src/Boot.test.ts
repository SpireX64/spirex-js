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

    describe("Adding tasks to boot process", () => {
        // GIVEN:
        //  - One task is created
        //  - Process is created
        // WHEN: Add task to process
        // THEN: The task has been added to the process
        test("Adding one task to boot process", () => {
            // Arrange -----------
            const task = Boot.task(() => {});
            const boot = new Boot();

            // Act ---------------
            const bootRef = boot.add(task);

            // Assert ------------
            expect(bootRef).toBe(boot);
            expect(boot.tasksCount).toBe(1);
        });

        // GIVEN
        //  - Two tasks are created
        //  - Process is created
        // WHEN: Add tasks to process
        // THEN: Both tasks have been added to the process.
        test("Adding multiple tasks to boot process", () => {
            // Arrange -----------
            const task1 = Boot.task(() => {});
            const task2 = Boot.task(() => {});
            const boot = new Boot();

            // Act ---------------
            const bootRef = boot.add(task1).add(task2);

            // Assert ------------
            expect(bootRef).toBe(boot);
            expect(boot.tasksCount).toBe(2);
        });

        // GIVEN:
        //  - One task is created
        //  - Process is created
        // WHEN: Add task to process 2 times
        // THEN: The task is added to the process only once
        test("Adding same task twice to boot process", () => {
            // Arrange -----------
            const task = Boot.task(() => {});
            const boot = new Boot().add(task);

            // Act ---------------
            boot.add(task);

            // Assert ------------
            expect(boot.tasksCount).toBe(1);
        });
    });
});
