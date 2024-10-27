import { Boot, BootState, type TFalsy, DEFAULT_TASK_PRIORITY } from "./Boot";

describe("Boot", () => {
    describe("A. Creating Tasks", () => {
        // GIVEN: Synchronous delegate.
        // WHEN: Pass sync delegate to the task factory.
        // THEN
        //   - Task was created.
        //   - Task has a delegate reference.
        //   - Task is immutable (sealed & frozen).
        test("A1. Create a task with sync delegate", () => {
            // Arrange -------
            const taskDelegate = () => {};

            // Act -----------
            const task = Boot.task(taskDelegate);

            // Assert --------
            expect(task).not.toBeNull();
            expect(task.delegate).toBe(taskDelegate);
            expect(Object.isSealed(task)).toBeTruthy();
            expect(Object.isFrozen(task)).toBeTruthy();
        });

        // GIVEN: Asynchronous delegate.
        // WHEN: Pass sync delegate to the task factory.
        // THEN
        //   - Task was created.
        //   - Task has a delegate reference.
        //   - Task is immutable (sealed & frozen).
        test("A2. Create a task with async delegate", () => {
            // Arrange --------
            const asyncDelegate = async () => {};

            // Act ------------
            const task = Boot.task(asyncDelegate);

            // Arrange --------
            expect(task.delegate).toBe(asyncDelegate);
            expect(Object.isSealed(task)).toBeTruthy();
            expect(Object.isFrozen(task)).toBeTruthy();
        });

        // GIVEN: Delegate & expected task name.
        // WHEN: Create a task with a delegate
        //       and passing the task name in the factory options object.
        // THEN: The task was created with the specified name.
        test("A3.1. Create a task with name", () => {
            // Arrange ------
            const expectedName = "MyTask";

            // Act ----------
            const task = Boot.task(() => {}, { name: expectedName });

            // Assert --------
            expect(task.name).toBe(expectedName);
        });

        // GIVEN: Named function as delegate.
        // WHEN: Create a task with the given delegate.
        // THEN: The task was created with the delegate name.
        test("A3.2. Create a task with name from named function as delegate", () => {
            // Arrange ------
            function init() {}

            // Act -----------
            const task = Boot.task(init);

            // Assert --------
            expect(task.name).toBe(init.name);
        });

        describe("A4. Determining the priority of a task", () => {
            // GIVEN: Delegate.
            // WHEN: Create task without a priority definition.
            // THEN: The task has a default priority.
            test("A4.1. Create a task with default priority", () => {
                // Act --------
                const task = Boot.task(() => {});

                // Assert -----
                expect(task.priority).toBe(DEFAULT_TASK_PRIORITY);
            });

            // GIVEN: Delegate & valid number as priority
            // WHEN: Create a task with a priority definition.
            // THEN: The task has the specified priority.
            test("A4.2a. Create a task with a priority definition", () => {
                // Arrange --------
                const expectedPriority = 42;

                // Act ------------
                const task = Boot.task(() => {}, {
                    priority: expectedPriority,
                });

                // Assert ---------
                expect(task.priority).toBe(expectedPriority);
            });

            // GIVEN: Delegate & infinite priority value.
            // WHEN: Create a task with an infinite priority value.
            // THEN: The task has the specified priority.
            test("A4.2b Create a task with an infinite priority value", () => {
                // Arrange --------
                const expectedPriority = Infinity;

                // Act ------------
                const task = Boot.task(() => {}, {
                    priority: expectedPriority,
                });

                // Assert ----------
                expect(task.priority).toBe(expectedPriority);
            });

            // GIVEN: Delegate & NaN as priority
            // WHEN: Create a task with an NaN priority.
            // THEN: An error will be thrown.
            test("A4.2c. Creating a task with an invalid priority will throw an error", () => {
                // Arrange --------
                const invalidPriority = NaN;

                // Act ------------
                let error: Error | null = null;
                try {
                    Boot.task(() => {}, { priority: invalidPriority });
                } catch (e) {
                    if (e instanceof Error) error = e;
                }

                // Assert ----------
                expect(error).not.toBeNull();
            });
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
            const queue: string[] = [];
            const syncTaskA = Boot.task(
                jest.fn(() => {
                    queue.push("A");
                }),
            );
            const syncTaskB = Boot.task(
                jest.fn(() => {
                    queue.push("B");
                }),
            );
            const boot = new Boot().add([syncTaskA, syncTaskB]);

            // Act -----------------
            await boot.runAsync();

            // Assert --------------
            expect(syncTaskA.delegate).toHaveBeenCalled();
            expect(syncTaskB.delegate).toHaveBeenCalled();

            expect(queue.join("")).toBe("AB");
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
            const queue: string[] = [];
            const syncTaskA = Boot.task(
                jest.fn(async () => {
                    queue.push("A");
                }),
            );
            const syncTaskB = Boot.task(
                jest.fn(async () => {
                    queue.push("B");
                }),
            );
            const boot = new Boot().add([syncTaskA, syncTaskB]);

            // Act -----------------
            await boot.runAsync();

            // Assert --------------
            expect(syncTaskA.delegate).toHaveBeenCalled();
            expect(syncTaskB.delegate).toHaveBeenCalled();

            expect(queue.join("")).toBe("AB");
        });
    });

    describe("Process result", () => {
        test("Task has success result", async () => {
            // Arrange ---------
            const task = Boot.task(() => {});
            const boot = new Boot().add(task);

            // Act -------------
            const result = await boot.runAsync();

            // Assert ----------
            expect(result.success).toContain(task);
        });

        test("Task has fail result", async () => {
            const task = Boot.task(() => {
                throw Error("test");
            });
            const boot = new Boot().add(task);

            // Act -------------
            const result = await boot.runAsync();

            // Assert ----------
            expect(result.failure).toContain(task);
        });
    });
});
