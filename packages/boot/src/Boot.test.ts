import { Boot, BootState, type TFalsy } from "./Boot";

describe("Boot", () => {
    describe("Creating Tasks", () => {
        test("Create a simple task without dependencies", () => {
            // Arrange -------
            const taskDelegate = () => {};

            // Act -----------
            const task = Boot.task(taskDelegate);

            // Assert --------
            expect(task).not.toBeNull();
            expect(task.delegate).toBe(taskDelegate);
            expect(task.dependencies).toHaveLength(0);
        });

        test("Create a task with async delegate", () => {
            // Arrange --------
            const asyncDelegate = async () => {};

            // Act ------------
            const task = Boot.task(asyncDelegate);

            // Arrange --------
            expect(task.delegate).toBe(asyncDelegate);
        });

        test("Create a simple task with dependencies as param", () => {
            // Arrange ------
            const taskA = Boot.task(() => {});
            const taskB = Boot.task(() => {});

            // Act ----------
            const task = Boot.task(() => {}, [taskA, taskB]);

            // Assert ------
            expect(task.dependencies).toContain(taskA);
            expect(task.dependencies).toContain(taskB);
        });

        test("Create a simple task with dependencies in options", () => {
            // Arrange ------
            const taskA = Boot.task(() => {});
            const taskB = Boot.task(() => {});

            // Act ----------
            const task = Boot.task(() => {}, {
                dependencies: [taskA, taskB],
            });

            // Assert ------
            expect(task.dependencies).toContain(taskA);
            expect(task.dependencies).toContain(taskB);
        });

        test("Create a task with name", () => {
            // Arrange ------
            const expectedName = "MyTask";

            // Act ----------
            const task = Boot.task(() => {}, { name: expectedName });

            // Assert --------
            expect(task.name).toBe(expectedName);
        });

        test("Create a task with name from delegate function", () => {
            // Arrange ------
            function init() {}

            // Act -----------
            const task = Boot.task(init);

            // Assert --------
            expect(task.name).toBe(init.name);
        });
    });

    describe("Creating instance of boot process", () => {
        test("Create new instance of 'Boot'", () => {
            // Act -----------
            const boot = new Boot();

            // Assert --------
            expect(boot).toBeInstanceOf(Boot);
            expect(boot.state).toBe(BootState.Idle);
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

        // GIVEN
        //  - Two tasks are created
        //  - Process is created
        // WHEN: Add tasks to process in list
        // THEN: Both tasks have been added to the process.
        test("Adding multiple tasks in list to boot process", () => {
            // Arrange -----------
            const task1 = Boot.task(() => {});
            const task2 = Boot.task(() => {});
            const boot = new Boot();

            // Act ---------------
            boot.add([task1, task2]);

            // Assert ------------
            expect(boot.tasksCount).toBe(2);
        });

        // GIVEN: Process is created
        // WHEN: Trying to add falsy-value to process
        // THEN: Falsy-value was ignored
        test.each([null, undefined, false, 0] as TFalsy[])(
            "Trying to add falsy (%s) to boot process",
            (falsy) => {
                // Arrange -----------
                const boot = new Boot();

                // Act ---------------
                boot.add(falsy);

                // Assert ------------
                expect(boot.tasksCount).toBe(0);
            },
        );

        // GIVEN
        //  - Process is created
        //  - One task is created
        // WHEN: Trying to add falsy-value with task in list to process
        // THEN
        //  - Falsy-value was ignored
        //  - The task was added to process
        test.each([null, undefined, false, 0] as TFalsy[])(
            "Trying to add falsy (%s) in list to boot process",
            (falsy) => {
                // Arrange -----------
                const task = Boot.task(() => {});
                const boot = new Boot();

                // Act --------------
                boot.add([falsy, task]);

                // Assert -----------
                expect(boot.tasksCount).toBe(1);
            },
        );
    });

    describe("Process execution", () => {
        test("Running empty boot process", async () => {
            // Arrange -------------
            const boot = new Boot();

            // Act -----------------
            const result = await boot.runAsync();

            // Assert --------------
            expect(result).toBeTruthy();
            expect(boot.state).toBe(BootState.Done);
        });

        test("Running boot process twice", async () => {
            // Arrange -------------
            const boot = new Boot();
            const promise = boot.runAsync();

            // Act -----------------
            let error: Error | null = null;
            try {
                await boot.runAsync();
            } catch (e) {
                if (e instanceof Error) error = e;
            }
            await promise;

            // Assert --------------
            expect(error).not.toBeNull();
            expect(boot.state).toBe(BootState.Done);
        });

        test("Running boot process with one a sync task", async () => {
            // Arrange -------------
            const syncTask = Boot.task(jest.fn());
            const boot = new Boot().add(syncTask);

            // Act -----------------
            await boot.runAsync();

            // Assert --------------
            expect(syncTask.delegate).toHaveBeenCalled();
        });

        test("Running boot process with a couple of sync tasks", async () => {
            // Arrange -------------
            const syncTaskA = Boot.task(jest.fn());
            const syncTaskB = Boot.task(jest.fn());
            const boot = new Boot().add([syncTaskA, syncTaskB]);

            // Act -----------------
            await boot.runAsync();

            // Assert --------------
            expect(syncTaskA.delegate).toHaveBeenCalled();
            expect(syncTaskB.delegate).toHaveBeenCalled();
        });

        test("Running boot process with one a async task", async () => {
            // Arrange -------------
            const syncTask = Boot.task(jest.fn(async () => {}));
            const boot = new Boot().add(syncTask);

            // Act -----------------
            await boot.runAsync();

            // Assert --------------
            expect(syncTask.delegate).toHaveBeenCalled();
        });

        test("Running boot process with a couple of async tasks", async () => {
            // Arrange -------------
            const syncTaskA = Boot.task(jest.fn(async () => {}));
            const syncTaskB = Boot.task(jest.fn(async () => {}));
            const boot = new Boot().add([syncTaskA, syncTaskB]);

            // Act -----------------
            await boot.runAsync();

            // Assert --------------
            expect(syncTaskA.delegate).toHaveBeenCalled();
            expect(syncTaskB.delegate).toHaveBeenCalled();
        });
    });
});
