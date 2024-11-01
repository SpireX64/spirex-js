// noinspection DuplicatedCode

import {
    Boot,
    BootState,
    type TFalsy,
    DEFAULT_TASK_PRIORITY,
    hasDependency,
} from "./Boot";

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

        describe("A3. Determining the name of a task", () => {
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

        describe("A5. Optional task flag", () => {
            // GIVEN: Delegate.
            // WHEN: Create a task without optional flag.
            // THEN: The important task will be created.
            test("A5.1. Create an important/default task", () => {
                // Act ------------
                const task = Boot.task(() => {});

                // Assert --------
                expect(task.optional).toBeFalsy(); // is important
            });

            // GIVEN: Delegate.
            // WHEN: Create a task with optional flag.
            // THEN: The important task will be created.
            test("A5.2. Create a task with optional flag", () => {
                // Act ------------
                const task = Boot.task(() => {}, { optional: true });

                // Assert ---------
                expect(task.optional).toBeTruthy();
            });
        });

        describe("A6. Task's dependencies definition", () => {
            // WHEN: Create task without dependencies
            test("A6.0. Task have no dependencies by default", () => {
                // Act ----------
                const task = Boot.task(() => {});

                // Assert -------
                expect(task.dependencies.length).toBe(0);
            });

            test("A6.1a. Add single dependency in params", () => {
                // Arrange --------------
                const taskD = Boot.task(() => {});

                // Act ------------------
                const task = Boot.task(() => {}, [taskD]);

                // Assert ---------------
                expect(hasDependency(task, taskD)).toBeTruthy();
                expect(task.dependencies[0].task).toBe(taskD);
                expect(task.dependencies[0].weak).toBeFalsy();
                expect(Object.isFrozen(task.dependencies[0])).toBeTruthy();
            });

            test("A6.1b. Add many dependencies in params", () => {
                // Arrange ------------
                const taskA = Boot.task(() => {});
                const taskB = Boot.task(() => {});

                // Act ----------------
                const task = Boot.task(() => {}, [taskA, taskB]);

                // Expect -------------
                expect(hasDependency(task, taskA)).toBeTruthy();
                expect(task.dependencies[0].task).toBe(taskA);
                expect(task.dependencies[0].weak).toBeFalsy();
                expect(Object.isFrozen(task.dependencies[0])).toBeTruthy();

                expect(hasDependency(task, taskB)).toBeTruthy();
                expect(task.dependencies[1].task).toBe(taskB);
                expect(task.dependencies[1].weak).toBeFalsy();
                expect(Object.isFrozen(task.dependencies[1])).toBeTruthy();
            });

            test("A6.1c. Pass an empty array as dependencies in params", () => {
                // Act ----------------
                const task = Boot.task(() => {}, []);

                // Assert -------------
                expect(task.dependencies.length).toBe(0);
            });

            test("A6.2a. Add dependency in factory options", () => {
                // Arrange --------
                const taskD = Boot.task(() => {});

                // Act -----------
                const task = Boot.task(() => {}, { deps: [taskD] });

                // Assert --------
                expect(hasDependency(task, taskD)).toBeTruthy();
                expect(task.dependencies[0].task).toBe(taskD);
            });

            test("A6.2b. Add many dependencies in params", () => {
                // Arrange ------------
                const taskA = Boot.task(() => {});
                const taskB = Boot.task(() => {});

                // Act ----------------
                const task = Boot.task(() => {}, {
                    deps: [taskA, taskB],
                });

                // Expect -------------
                expect(hasDependency(task, taskA)).toBeTruthy();
                expect(hasDependency(task, taskB)).toBeTruthy();
            });

            test("A6.2c. Pass an empty array as dependencies in factory options", () => {
                // Act ----------------
                const task = Boot.task(() => {}, { deps: [] });

                // Assert -------------
                expect(task.dependencies.length).toBe(0);
            });

            test("A6.3a. Add dependency with params wrapper", () => {
                // Arrange ------------
                const taskD = Boot.task(() => {});

                // Act ----------------
                const task = Boot.task(() => {}, [{ task: taskD }]);

                // Assert -------------
                expect(hasDependency(task, taskD)).toBeTruthy();
                expect(task.dependencies[0].task).toBe(taskD);
                expect(task.dependencies[0].weak).toBeFalsy();
                expect(Object.isFrozen(task.dependencies[0])).toBeTruthy();
            });

            test("A6.3a. Add many dependencies with params wrappers", () => {
                // Arrange ------------
                const taskA = Boot.task(() => {});
                const taskB = Boot.task(() => {});

                // Act ----------------
                const task = Boot.task(() => {}, [
                    { task: taskA },
                    { task: taskB },
                ]);

                // Assert -------------
                expect(hasDependency(task, taskA)).toBeTruthy();
                expect(task.dependencies[0].task).toBe(taskA);
                expect(task.dependencies[0].weak).toBeFalsy();
                expect(Object.isFrozen(task.dependencies[0])).toBeTruthy();

                expect(hasDependency(task, taskB)).toBeTruthy();
                expect(task.dependencies[1].task).toBe(taskB);
                expect(task.dependencies[1].weak).toBeFalsy();
                expect(Object.isFrozen(task.dependencies[1])).toBeTruthy();
            });

            test("A6.4. Mixed dependencies format", () => {
                // Arrange ---------
                const taskA = Boot.task(() => {});
                const taskB = Boot.task(() => {});

                // Act -------------
                const task = Boot.task(() => {}, [{ task: taskA }, taskB]);

                // Assert ----------
                expect(hasDependency(task, taskA)).toBeTruthy();
                expect(task.dependencies[0].task).toBe(taskA);
                expect(task.dependencies[0].weak).toBeFalsy();
                expect(Object.isFrozen(task.dependencies[0])).toBeTruthy();

                expect(hasDependency(task, taskB)).toBeTruthy();
                expect(task.dependencies[1].task).toBe(taskB);
                expect(task.dependencies[1].weak).toBeFalsy();
                expect(Object.isFrozen(task.dependencies[1])).toBeTruthy();
            });
        });
    });

    describe("B. Creating instance of boot process", () => {
        // WHEN: Create new boot instance without params
        // THEN
        //   - The boot instance was created
        //   - The boot instance is in "Idle" state
        //   - The boot instance have no boot tasks yet
        test("Create new instance of 'Boot'", () => {
            // Act -----------
            const boot = new Boot();

            // Assert --------
            expect(boot).toBeInstanceOf(Boot);
            expect(boot.state).toBe(BootState.Idle);
            expect(boot.tasksCount).toBe(0);
        });
    });
});
