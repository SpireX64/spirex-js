// noinspection DuplicatedCode

import {
    Boot,
    BootError,
    BootStatus,
    DEFAULT_TASK_PRIORITY,
    hasDependency,
    TaskStatus,
} from "./Boot";

function catchError(func: () => unknown): Error | undefined {
    try {
        func();
    } catch (e) {
        if (e instanceof Error) return e;
    }
    return undefined;
}

async function catchErrorAsync(
    func: () => Promise<unknown>,
): Promise<Error | undefined> {
    try {
        await func();
    } catch (e) {
        if (e instanceof Error) return e;
    }
    return undefined;
}

const delayAsync = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay));

const noop = () => {};
const asyncNoop = async () => {};

const tasksPool = new Array(10000)
    .fill(null)
    .map((_, i) => Boot.task(noop, { name: `task_${i}` }))
    .map((it, i) => [
        it,
        Boot.task(noop, { name: `${i}_childOf_${it.name}`, deps: [it] }),
    ])
    .flat()
    .map((it, i) => [
        it,
        Boot.task(noop, { name: `${i}_childOf_${it.name}`, deps: [it] }),
    ])
    .flat()
    .reverse();

describe("Boot", () => {
    test("Playground", async () => {
        const boot = new Boot();
        // ----------
        for (let i = 0; i < tasksPool.length; i++) {
            const task = tasksPool[i];
            boot.add(task);
        }

        await boot.runAsync();
    });

    describe("A. Creating Tasks", () => {
        describe("A1. Create a task with delegate", () => {
            // GIVEN: Synchronous delegate.
            // WHEN: Pass sync delegate to the task factory.
            // THEN
            //   - Task was created.
            //   - Task has a delegate reference.
            //   - Task is immutable (sealed & frozen).
            test("A1.1. With sync delegate", () => {
                // Arrange -------
                const taskDelegate = noop;

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
            test("A1.2. With async delegate", () => {
                // Arrange --------
                const asyncDelegate = asyncNoop;

                // Act ------------
                const task = Boot.task(asyncDelegate);

                // Arrange --------
                expect(task.delegate).toBe(asyncDelegate);
                expect(Object.isSealed(task)).toBeTruthy();
                expect(Object.isFrozen(task)).toBeTruthy();
            });
        });

        describe("A2. Determining the name of a task", () => {
            // GIVEN: Delegate & expected task name.
            // WHEN: Create a task with a delegate
            //       and passing the task name in the factory options object.
            // THEN: The task was created with the specified name.
            test("A2.1. Create a task with name", () => {
                // Arrange ------
                const expectedName = "MyTask";

                // Act ----------
                const task = Boot.task(noop, { name: expectedName });

                // Assert --------
                expect(task.name).toBe(expectedName);
            });

            // GIVEN: Named function as delegate.
            // WHEN: Create a task with the given delegate.
            // THEN: The task was created with the delegate name.
            test("A2.2. Create a task with name from named function as delegate", () => {
                // Arrange ------
                function init() {}

                // Act -----------
                const task = Boot.task(init);

                // Assert --------
                expect(task.name).toBe(init.name);
            });
        });

        describe("A3. Determining the priority of a task", () => {
            // GIVEN: Delegate.
            // WHEN: Create task without a priority definition.
            // THEN: The task has a default priority.
            test("A3.1. Create a task with default priority", () => {
                // Act --------
                const task = Boot.task(noop);

                // Assert -----
                expect(task.priority).toBe(DEFAULT_TASK_PRIORITY);
            });

            // GIVEN: Delegate & valid number as priority
            // WHEN: Create a task with a priority definition.
            // THEN: The task has the specified priority.
            test("A3.2a. Create a task with a priority definition", () => {
                // Arrange --------
                const expectedPriority = 42;

                // Act ------------
                const task = Boot.task(noop, {
                    priority: expectedPriority,
                });

                // Assert ---------
                expect(task.priority).toBe(expectedPriority);
            });

            // GIVEN: Delegate & infinite priority value.
            // WHEN: Create a task with an infinite priority value.
            // THEN: The task has the specified priority.
            test("A3.2b Create a task with an infinite priority value", () => {
                // Arrange --------
                const expectedPriority = Infinity;

                // Act ------------
                const task = Boot.task(noop, {
                    priority: expectedPriority,
                });

                // Assert ----------
                expect(task.priority).toBe(expectedPriority);
            });

            // GIVEN: Delegate & NaN as priority
            // WHEN: Create a task with an NaN priority.
            // THEN: An error will be thrown.
            test("A3.2c. Creating a task with an invalid priority will throw an error", () => {
                // Arrange --------
                const invalidPriority = NaN;
                const taskName = "TestTask";

                // Act ------------
                let error: Error | null = null;
                try {
                    Boot.task(noop, {
                        priority: invalidPriority,
                        name: taskName,
                    });
                } catch (e) {
                    if (e instanceof Error) error = e;
                }

                // Assert ----------
                expect(error).not.toBeNull();
                expect(error?.message).toContain(
                    BootError.INVALID_TASK_PRIORITY,
                );
                expect(error?.message).toContain(taskName);
            });
        });

        describe("A4. Optional task flag", () => {
            // GIVEN: Delegate.
            // WHEN: Create a task without optional flag.
            // THEN: The important task will be created.
            test("A4.1. Create an important/default task", () => {
                // Act ------------
                const task = Boot.task(noop);

                // Assert --------
                expect(task.optional).toBeFalsy(); // is important
            });

            // GIVEN: Delegate.
            // WHEN: Create a task with optional flag.
            // THEN: The important task will be created.
            test("A4.2. Create a task with optional flag", () => {
                // Act ------------
                const task = Boot.task(noop, { optional: true });

                // Assert ---------
                expect(task.optional).toBeTruthy();
            });
        });

        describe("A5. Task's dependencies definition", () => {
            // WHEN: Create task without dependencies
            test("A5.1. Task have no dependencies by default", () => {
                // Act ----------
                const task = Boot.task(noop);

                // Assert -------
                expect(task.dependencies.length).toBe(0);
            });

            test("A5.2a. Add single dependency in params", () => {
                // Arrange --------------
                const taskD = Boot.task(noop);

                // Act ------------------
                const task = Boot.task(noop, [taskD]);

                // Assert ---------------
                expect(hasDependency(task, taskD)).toBeTruthy();
                expect(task.dependencies[0].task).toBe(taskD);
                expect(task.dependencies[0].weak).toBeFalsy();
                expect(Object.isFrozen(task.dependencies[0])).toBeTruthy();
            });

            test("A5.2b. Add many dependencies in params", () => {
                // Arrange ------------
                const taskA = Boot.task(noop);
                const taskB = Boot.task(noop);

                // Act ----------------
                const task = Boot.task(noop, [taskA, taskB]);

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

            test("A5.2c. Pass an empty array as dependencies in params", () => {
                // Act ----------------
                const task = Boot.task(noop, []);

                // Assert -------------
                expect(task.dependencies.length).toBe(0);
            });

            test("A5.3a. Add dependency in factory options", () => {
                // Arrange --------
                const taskD = Boot.task(noop);

                // Act -----------
                const task = Boot.task(noop, { deps: [taskD] });

                // Assert --------
                expect(hasDependency(task, taskD)).toBeTruthy();
                expect(task.dependencies[0].task).toBe(taskD);
            });

            test("A5.3b. Add many dependencies in params", () => {
                // Arrange ------------
                const taskA = Boot.task(noop);
                const taskB = Boot.task(noop);

                // Act ----------------
                const task = Boot.task(noop, {
                    deps: [taskA, taskB],
                });

                // Expect -------------
                expect(hasDependency(task, taskA)).toBeTruthy();
                expect(hasDependency(task, taskB)).toBeTruthy();
            });

            test("A5.3c. Pass an empty array as dependencies in factory options", () => {
                // Act ----------------
                const task = Boot.task(noop, { deps: [] });

                // Assert -------------
                expect(task.dependencies.length).toBe(0);
            });

            test("A5.4a. Add dependency with params wrapper", () => {
                // Arrange ------------
                const taskD = Boot.task(noop);

                // Act ----------------
                const task = Boot.task(noop, [{ task: taskD }]);

                // Assert -------------
                expect(hasDependency(task, taskD)).toBeTruthy();
                expect(task.dependencies[0].task).toBe(taskD);
                expect(task.dependencies[0].weak).toBeFalsy();
                expect(Object.isFrozen(task.dependencies[0])).toBeTruthy();
            });

            test("A5.4a. Add many dependencies with params wrappers", () => {
                // Arrange ------------
                const taskA = Boot.task(noop);
                const taskB = Boot.task(noop);

                // Act ----------------
                const task = Boot.task(noop, [
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

            test("A5.5. Mixed dependencies format", () => {
                // Arrange ---------
                const taskA = Boot.task(noop);
                const taskB = Boot.task(noop);

                // Act -------------
                const task = Boot.task(noop, [{ task: taskA }, taskB]);

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

        describe("A6. Weak dependency", () => {
            test("A6.1a. Strong dependency by default", () => {
                // Arrange --------
                const taskD = Boot.task(noop);

                // Act ------------
                const task = Boot.task(noop, [taskD]);

                // Assert ---------
                expect(hasDependency(task, taskD)).toBeTruthy();
                expect(task.dependencies[0].weak).toBeFalsy();
            });

            test("A6.1b. Mark a dependency as weak", () => {
                // Arrange ------
                const taskD = Boot.task(noop);

                // Act ----------
                const task = Boot.task(noop, [{ task: taskD, weak: true }]);

                // Assert -------
                expect(hasDependency(task, taskD)).toBeTruthy();
                expect(task.dependencies[0].weak).toBeTruthy();
            });

            test("A6.2a. An important task should not have a strong dependency on an optional task", () => {
                // Arrange ------
                const optionalTask = Boot.task(noop, {
                    optional: true,
                    name: "OptionalTask",
                });
                const importantTaskName = "ImportantTask";

                // Act ----------
                let error: Error | null = null;
                try {
                    Boot.task(noop, {
                        deps: [optionalTask],
                        name: importantTaskName,
                    });
                } catch (e) {
                    if (e instanceof Error) error = e;
                }

                // Assert -------
                expect(error).not.toBeNull();
                expect(error?.message).toContain(
                    BootError.STRONG_DEPENDENCY_ON_OPTIONAL,
                );
                expect(error?.message).toContain(importantTaskName);
                expect(error?.message).toContain(optionalTask.name);
            });

            test("A6.2b. An important task may have a weak dependency on an optional task", () => {
                // Arrange ------
                const optionalTask = Boot.task(noop, { optional: true });

                // Act ----------
                const importantTask = Boot.task(noop, [
                    { task: optionalTask, weak: true },
                ]);

                // Assert -------
                expect(hasDependency(importantTask, optionalTask)).toBeTruthy();
            });
        });
    });

    describe("B. Creating instance of boot process", () => {
        // WHEN: Create new boot instance without params
        // THEN
        //   - The boot instance was created
        //   - The boot instance is in "Idle" state
        //   - The boot instance have no boot tasks yet
        test("B1. Create new instance of 'Boot'", () => {
            // Act -----------
            const boot = new Boot();

            // Assert --------
            expect(boot).toBeInstanceOf(Boot);
            expect(boot.status).toBe(BootStatus.Idle);
            expect(boot.tasksCount).toBe(0);
        });
    });

    describe("C. Adding tasks to a process", () => {
        describe("C1. Adding a single task to a process", () => {
            test("C1.1 Add a single task", () => {
                // Arrange ------
                const boot = new Boot();
                const task = Boot.task(noop);

                // Act ----------
                boot.add(task);

                // Assert -------
                expect(boot.has(task)).toBeTruthy();
                expect(boot.tasksCount).toBe(1);
            });

            test("C1.2 Trying to add a task to a process when it has already been added before", () => {
                // Arrange ------
                const task = Boot.task(noop);
                const boot = new Boot().add(task);

                // Act ----------
                boot.add(task);

                // Assert -------
                expect(boot.has(task)).toBeTruthy();
                expect(boot.tasksCount).toBe(1);
            });

            test("C1.3. Adding tasks to a process using a call chain", () => {
                // Arrange -------
                const boot = new Boot();
                const taskA = Boot.task(noop);
                const taskB = Boot.task(noop);
                const taskC = Boot.task(noop);

                // Act -----------
                const bootRef = boot.add(taskA).add(taskB).add(taskC);

                // Assert --------
                expect(bootRef).toBe(boot);
                expect(boot.has(taskA)).toBeTruthy();
                expect(boot.has(taskB)).toBeTruthy();
                expect(boot.has(taskC)).toBeTruthy();
                expect(boot.tasksCount).toBe(3);
            });
        });

        describe("C2. Adding multiple tasks to a process", () => {
            test("C2.1. Adding multiple tasks to a process by array", () => {
                // Arrange --------
                const boot = new Boot();
                const taskA = Boot.task(noop);
                const taskB = Boot.task(noop);
                const taskC = Boot.task(noop);

                // Act ------------
                const bootRef = boot.add([taskA, taskB, taskC]);

                // Assert ---------
                expect(bootRef).toBe(boot);
                expect(boot.has(taskA)).toBeTruthy();
                expect(boot.has(taskB)).toBeTruthy();
                expect(boot.has(taskC)).toBeTruthy();
                expect(boot.tasksCount).toBe(3);
            });

            test("C2.2. Skipping tasks that have already been added", () => {
                // Arrange --------
                const taskA = Boot.task(noop);
                const taskB = Boot.task(noop);
                const boot = new Boot().add(taskA);

                // Act ------------
                boot.add([taskA, taskB, taskB]);

                // Assert ---------
                expect(boot.has(taskA)).toBeTruthy();
                expect(boot.has(taskB)).toBeTruthy();
                expect(boot.tasksCount).toBe(2);
            });
        });

        describe("C3. Using falsy-values when adding tasks", () => {
            test("C3.1. Pass falsy-value as param", () => {
                // Arrange --------
                const boot = new Boot();
                const task = Boot.task(noop);

                // Act ------------
                boot.add(false).add(null).add(undefined).add(task);

                // Assert ---------
                expect(boot.tasksCount).toBe(1);
                expect(boot.has(task)).toBeTruthy();
            });

            test("C3.2. Pass falsy-value in array", () => {
                // Arrange --------
                const boot = new Boot();
                const task = Boot.task(noop);

                // Act ------------
                boot.add([false, undefined, null, task]);

                // Assert ---------
                expect(boot.tasksCount).toBe(1);
                expect(boot.has(task)).toBeTruthy();
            });
        });

        describe("C4. Check is task in the process", () => {
            test("C4a. Task not added to process", () => {
                // Arrange ---------
                const boot = new Boot();
                const task = Boot.task(noop);

                // Act --------------
                const processHasTask = boot.has(task);

                // Assert ------------
                expect(processHasTask).toBeFalsy();
                expect(boot.getTaskStatus(task)).toBe(TaskStatus.Unknown);
            });

            test("C4b. Task added to process", () => {
                // Arrange ----------
                const task = Boot.task(noop);
                const boot = new Boot().add(task);

                // Act -------------
                const processHasTask = boot.has(task);

                // Assert ----------
                expect(processHasTask).toBeTruthy();
                expect(boot.getTaskStatus(task)).toBe(TaskStatus.Idle);
            });
        });

        test("C5. Attempt to add task after start process", async () => {
            // Arrange -----------
            const task = Boot.task(noop);
            const boot = new Boot();

            // Act ---------------
            const promise = boot.runAsync();
            const error = catchError(() => boot.add(task));
            await promise;

            // Assert ------------
            expect(error).not.toBeUndefined();
            expect(error?.message).toContain(BootError.TASK_ADDITION_DENIED);
            expect(error?.message).toContain(BootStatus.nameOf(boot.status));
        });
    });

    describe("D. Process execution", () => {
        // GIVEN
        //   - Boot process created
        //   - No task added
        // WHEN: Execute process
        // THEN
        //   - Process will be completed without awaiting
        //   - Process status is "Completed"
        test("D1. Execute process without tasks", () => {
            // Arrange -----------
            const boot = new Boot();

            // Act ---------------
            boot.runAsync();

            // Assert ------------
            expect(boot.status).toBe(BootStatus.Completed);
        });

        describe("D2. Execution sequence", () => {
            describe("D2.1. Execute process with independent tasks", () => {
                test("D2.1a. Run with one sync task", async () => {
                    // Arrange --------------
                    const syncDelegate = jest.fn();
                    const syncTask = Boot.task(syncDelegate);

                    const boot = new Boot().add(syncTask);

                    // Act ------------------
                    await boot.runAsync();

                    // Assert ---------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(boot.getTaskStatus(syncTask)).toBe(
                        TaskStatus.Completed,
                    );
                    expect(syncDelegate).toHaveBeenCalledTimes(1);
                });

                test("D2.1b. Run with one async task", async () => {
                    // Arrange --------------
                    const asyncDelegate = jest.fn(() => Promise.resolve());
                    const asyncTask = Boot.task(asyncDelegate);

                    const boot = new Boot().add(asyncTask);

                    // Act ------------------
                    await boot.runAsync();

                    // Assert ---------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(boot.getTaskStatus(asyncTask)).toBe(
                        TaskStatus.Completed,
                    );
                    expect(asyncDelegate).toHaveBeenCalledTimes(1);
                });

                test("D2.1c. Run with sync & async tasks", async () => {
                    // Arrange -------------
                    const syncDelegate = jest.fn();
                    const syncTask = Boot.task(syncDelegate);

                    const asyncDelegate = jest.fn(() => Promise.resolve());
                    const asyncTask = Boot.task(asyncDelegate);

                    const boot = new Boot().add(syncTask).add(asyncTask);

                    // Act -----------------
                    await boot.runAsync();

                    // Assert ---------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(boot.getTaskStatus(syncTask)).toBe(
                        TaskStatus.Completed,
                    );
                    expect(boot.getTaskStatus(asyncTask)).toBe(
                        TaskStatus.Completed,
                    );
                    expect(syncDelegate).toHaveBeenCalledTimes(1);
                    expect(asyncDelegate).toHaveBeenCalledTimes(1);
                });
            });

            test("D2.2. Default execution sequence", async () => {
                // Arrange -----------
                let sequence: string = "";

                const taskA = Boot.task(() => {
                    sequence += "A";
                });
                const taskB = Boot.task(async () => {
                    sequence += "B";
                });
                const taskC = Boot.task(() => {
                    sequence += "C";
                });
                const taskD = Boot.task(async () => {
                    sequence += "D";
                });

                const boot = new Boot().add([taskA, taskB, taskC, taskD]);
                const expectedSequence = "ABCD";

                // Act ---------------
                await boot.runAsync();

                // Assert ------------
                expect(sequence).toBe(expectedSequence);
                expect(boot.status).toBe(BootStatus.Completed);
                expect(boot.getTaskStatus(taskA)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskB)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskC)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskD)).toBe(TaskStatus.Completed);
            });

            test("D2.3. Execution sequence by priority", async () => {
                // Arrange -----------
                let sequence: string = "";

                const taskA = Boot.task(
                    () => {
                        sequence += "A";
                    },
                    { priority: -1 },
                );
                const taskB = Boot.task(
                    async () => {
                        sequence += "B";
                    },
                    { priority: 8 },
                );
                const taskC = Boot.task(
                    () => {
                        sequence += "C";
                    },
                    { priority: -4 },
                );
                const taskD = Boot.task(
                    async () => {
                        sequence += "D";
                    },
                    { priority: 2 },
                );

                const boot = new Boot().add([taskA, taskB, taskC, taskD]);
                const expectedSequence = "BDAC";

                // Act ---------------
                await boot.runAsync();

                // Assert ------------
                expect(sequence).toBe(expectedSequence);
                expect(boot.status).toBe(BootStatus.Completed);
                expect(boot.getTaskStatus(taskA)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskB)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskC)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskD)).toBe(TaskStatus.Completed);
            });
        });

        describe("D3. Task fail behaviour", () => {
            describe("D3.1. Required task throws error on fail", () => {
                test("D3.1a. Required sync task throws error", async () => {
                    // Arrange --------------
                    const expectedError = Error("Test Error");
                    const requiredTask = Boot.task(
                        () => {
                            throw expectedError;
                        },
                        { name: "MyImportantTask" },
                    );
                    const boot = new Boot().add(requiredTask);

                    // Act ------------------
                    let error: Error | undefined;
                    try {
                        await boot.runAsync();
                    } catch (e) {
                        if (e instanceof Error) error = e;
                    }

                    // Assert ---------------
                    expect(error).not.toBeUndefined();
                    expect(error?.message).toContain(
                        BootError.IMPORTANT_TASK_FAILED,
                    );
                    expect(error?.message).toContain(requiredTask.name);
                    expect(boot.status).toBe(BootStatus.Fail);
                    expect(boot.getTaskStatus(requiredTask)).toBe(
                        TaskStatus.Fail,
                    );
                    expect(boot.getTaskFailReason(requiredTask)).toBe(
                        expectedError,
                    );
                });

                test("D3.1b. Required async task throws error", async () => {
                    // Arrange --------------
                    const expectedError = Error("Test Error");
                    const requiredTask = Boot.task(async () => {
                        throw expectedError;
                    });
                    const boot = new Boot().add(requiredTask);

                    // Act ------------------
                    let error: Error | undefined;
                    try {
                        await boot.runAsync();
                    } catch (e) {
                        if (e instanceof Error) error = e;
                    }

                    // Assert ---------------
                    expect(error).not.toBeUndefined();
                    expect(error?.message).toContain(
                        BootError.IMPORTANT_TASK_FAILED,
                    );
                    expect(error?.message).toContain(requiredTask.name);
                    expect(boot.status).toBe(BootStatus.Fail);
                    expect(boot.getTaskStatus(requiredTask)).toBe(
                        TaskStatus.Fail,
                    );
                    expect(boot.getTaskFailReason(requiredTask)).toBe(
                        expectedError,
                    );
                });
            });

            describe("D3.2. Optional task fail without error", () => {
                test("D3.2a. Optional sync task fail without error", async () => {
                    // Arrange ----------------------
                    const expectedError = Error("Test Error");
                    const optionalTask = Boot.task(
                        () => {
                            throw expectedError;
                        },
                        { optional: true },
                    );
                    const boot = new Boot().add(optionalTask);

                    // Act -------------------------
                    await boot.runAsync();

                    // Assert ----------------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(boot.getTaskStatus(optionalTask)).toBe(
                        TaskStatus.Fail,
                    );
                    expect(boot.getTaskFailReason(optionalTask)).toBe(
                        expectedError,
                    );
                });

                test("D3.2b. Optional async task fail without error", async () => {
                    // Arrange ----------------------
                    const expectedError = Error("Test Error");
                    const optionalTask = Boot.task(
                        async () => {
                            throw expectedError;
                        },
                        { optional: true },
                    );
                    const boot = new Boot().add(optionalTask);

                    // Act -------------------------
                    await boot.runAsync();

                    // Assert ----------------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(boot.getTaskStatus(optionalTask)).toBe(
                        TaskStatus.Fail,
                    );
                    expect(boot.getTaskFailReason(optionalTask)).toBe(
                        expectedError,
                    );
                });
            });
        });

        describe("D4. Execution of important task with dependencies", () => {
            describe("D4.1. Important task dependency", () => {
                test("D4.1a. Strong dependency completed", async () => {
                    // Arrange ---------------
                    const dependencyTask = Boot.task(jest.fn());
                    const task = Boot.task(jest.fn(), [dependencyTask]);
                    const boot = new Boot().add(task).add(dependencyTask);

                    // Act -------------------
                    await boot.runAsync();

                    // Assert ----------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(dependencyTask.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Completed,
                    );
                    expect(task.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);
                });

                test("D4.1b. Weak dependency completed", async () => {
                    // Arrange ---------------
                    const dependencyTask = Boot.task(jest.fn());
                    const task = Boot.task(jest.fn(), [
                        { task: dependencyTask, weak: true },
                    ]);
                    const boot = new Boot().add(task).add(dependencyTask);

                    // Act -------------------
                    await boot.runAsync();

                    // Assert ----------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(dependencyTask.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Completed,
                    );
                    expect(task.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);
                });

                test("D4.1c. Strong dependency failed", async () => {
                    // Arrange ---------------
                    const expectedError = new Error("Test Error");
                    const dependencyTask = Boot.task(
                        jest.fn(() => {
                            throw expectedError;
                        }),
                        { name: "TaskWithError" },
                    );
                    const task = Boot.task(jest.fn(), [dependencyTask]);
                    const boot = new Boot().add(task).add(dependencyTask);

                    // Act -------------------
                    const processError = await catchErrorAsync(() =>
                        boot.runAsync(),
                    );

                    // Assert ----------------
                    expect(boot.status).toBe(BootStatus.Fail);
                    expect(processError).not.toBeUndefined();
                    expect(processError?.message).toContain(
                        BootError.IMPORTANT_TASK_FAILED,
                    );
                    expect(processError?.message).toContain(
                        dependencyTask.name,
                    );
                    expect(processError?.message).toContain(
                        expectedError.message,
                    );
                    expect(dependencyTask.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Fail,
                    );
                    expect(boot.getTaskFailReason(dependencyTask)).toBe(
                        expectedError,
                    );
                    expect(task.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Fail);
                });

                test("D4.1d. Weak dependency failed", async () => {
                    // Arrange ---------------
                    const expectedError = new Error("Test Error");
                    const dependencyTask = Boot.task(
                        jest.fn(() => {
                            throw expectedError;
                        }),
                    );
                    const task = Boot.task(jest.fn(), [
                        { task: dependencyTask, weak: true },
                    ]);
                    const boot = new Boot().add(task).add(dependencyTask);

                    // Act -------------------
                    const processError = await catchErrorAsync(() =>
                        boot.runAsync(),
                    );

                    // Assert ----------------
                    expect(boot.status).toBe(BootStatus.Fail);
                    expect(processError).not.toBeUndefined();
                    expect(processError?.message).toContain(
                        BootError.IMPORTANT_TASK_FAILED,
                    );
                    expect(processError?.message).toContain(
                        dependencyTask.name,
                    );
                    expect(processError?.message).toContain(
                        expectedError.message,
                    );
                    expect(dependencyTask.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Fail,
                    );
                    expect(boot.getTaskFailReason(dependencyTask)).toBe(
                        expectedError,
                    );
                    expect(task.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Fail);
                });

                test("D4.1e. Strong dependency not added", async () => {
                    // Arrange ---------------
                    const dependencyTask = Boot.task(jest.fn());
                    const task = Boot.task(jest.fn(), [dependencyTask]);
                    const boot = new Boot().add(task);

                    // Act -------------------
                    const processError = await catchErrorAsync(() =>
                        boot.runAsync(),
                    );

                    // Assert ----------------
                    expect(boot.status).toBe(BootStatus.Fail);
                    expect(processError).not.toBeUndefined();

                    expect(processError?.message).toContain(
                        BootError.NO_ROOT_TASKS,
                    );
                    expect(dependencyTask.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Unknown,
                    );
                    expect(task.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Fail);
                });

                test("D4.1f. Weak dependency not added", async () => {
                    // Arrange ---------------
                    const dependencyTask = Boot.task(jest.fn());
                    const task = Boot.task(jest.fn(), [
                        { task: dependencyTask, weak: true },
                    ]);
                    const boot = new Boot().add(task);

                    // Act -------------------
                    await boot.runAsync();

                    // Assert ----------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(dependencyTask.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Unknown,
                    );
                    expect(task.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);
                });
            });

            describe("D4.2. Optional task dependency", () => {
                test("D4.2a. Weak dependency completed", async () => {
                    // Arrange --------------
                    const optionalDependencyTask = Boot.task(jest.fn(), {
                        optional: true,
                    });
                    const task = Boot.task(jest.fn(), [
                        { task: optionalDependencyTask, weak: true },
                    ]);
                    const boot = new Boot()
                        .add(task)
                        .add(optionalDependencyTask);

                    // Act ------------------
                    await boot.runAsync();

                    // Assert ---------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(optionalDependencyTask.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(optionalDependencyTask)).toBe(
                        TaskStatus.Completed,
                    );
                    expect(task.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);
                });

                test("D4.2b. Weak dependency failed", async () => {
                    // Arrange --------------
                    const expectedError = Error("Test Error");
                    const optionalDependencyTask = Boot.task(
                        jest.fn(() => {
                            throw expectedError;
                        }),
                        { optional: true },
                    );
                    const task = Boot.task(jest.fn(), [
                        { task: optionalDependencyTask, weak: true },
                    ]);
                    const boot = new Boot()
                        .add(task)
                        .add(optionalDependencyTask);

                    // Act ------------------
                    await boot.runAsync();

                    // Assert ---------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(optionalDependencyTask.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(optionalDependencyTask)).toBe(
                        TaskStatus.Fail,
                    );
                    expect(boot.getTaskFailReason(optionalDependencyTask)).toBe(
                        expectedError,
                    );
                    expect(task.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);
                });

                test("D4.2c. Weak dependency skipped", async () => {
                    // Arrange ------------------
                    const notAddedTask = Boot.task(noop); // For "Skipped" status simulation
                    const optionalDependencyTask = Boot.task(jest.fn(), {
                        deps: [notAddedTask],
                        optional: true,
                    });
                    const task = Boot.task(jest.fn(), [
                        { task: optionalDependencyTask, weak: true },
                    ]);
                    const boot = new Boot()
                        .add(task)
                        .add(optionalDependencyTask);

                    // Act ------------------
                    await boot.runAsync();

                    // Assert ---------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(
                        optionalDependencyTask.delegate,
                    ).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(optionalDependencyTask)).toBe(
                        TaskStatus.Skipped,
                    );
                    expect(task.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);
                });

                test("D4.2d. Weak dependency not added", async () => {
                    // Arrange --------------
                    const optionalDependencyTask = Boot.task(jest.fn(), {
                        optional: true,
                    });
                    const task = Boot.task(jest.fn(), [
                        { task: optionalDependencyTask, weak: true },
                    ]);
                    const boot = new Boot().add(task);

                    // Act ------------------
                    await boot.runAsync();

                    // Assert ---------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(
                        optionalDependencyTask.delegate,
                    ).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(optionalDependencyTask)).toBe(
                        TaskStatus.Unknown,
                    );
                    expect(task.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);
                });
            });
        });

        describe("D5. Execution of optional task with dependencies", () => {
            describe("D5.1. Important task dependency", () => {
                test("D5.1a. Strong dependency completed", async () => {
                    // Arrange -------------
                    const dependencyTask = Boot.task(jest.fn());
                    const task = Boot.task(jest.fn(), {
                        deps: [dependencyTask],
                        optional: true,
                    });
                    const boot = new Boot().add(task).add(dependencyTask);

                    // Act -----------------
                    await boot.runAsync();

                    // Assert --------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(dependencyTask.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Completed,
                    );
                    expect(task.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);
                });

                test("D5.1b. Weak dependency completed", async () => {
                    // Arrange -------------
                    const dependencyTask = Boot.task(jest.fn());
                    const task = Boot.task(jest.fn(), {
                        deps: [{ task: dependencyTask, weak: true }],
                        optional: true,
                    });
                    const boot = new Boot().add(task).add(dependencyTask);

                    // Act -----------------
                    await boot.runAsync();

                    // Assert --------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(dependencyTask.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Completed,
                    );
                    expect(task.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);
                });

                test("D5.1c. Strong dependency failed", async () => {
                    // Arrange -------------
                    const expectedError = new Error("Test error");
                    const dependencyTask = Boot.task(
                        jest.fn(() => {
                            throw expectedError;
                        }),
                        { name: "MyErrorTask" },
                    );
                    const task = Boot.task(jest.fn(), {
                        deps: [dependencyTask],
                        optional: true,
                    });
                    const boot = new Boot().add(task).add(dependencyTask);

                    // Act -----------------
                    const processError = await catchErrorAsync(() =>
                        boot.runAsync(),
                    );

                    // Assert --------------
                    expect(boot.status).toBe(BootStatus.Fail);
                    expect(processError).not.toBeUndefined();
                    expect(processError?.message).toContain(
                        BootError.IMPORTANT_TASK_FAILED,
                    );
                    expect(processError?.message).toContain(
                        dependencyTask.name,
                    );
                    expect(processError?.message).toContain(
                        expectedError.message,
                    );
                    expect(dependencyTask.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Fail,
                    );
                    expect(boot.getTaskFailReason(dependencyTask)).toBe(
                        expectedError,
                    );
                    expect(task.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Skipped);
                });

                test("D5.1d. Weak dependency failed", async () => {
                    // Arrange -------------
                    const expectedError = new Error("Test error");
                    const dependencyTask = Boot.task(
                        jest.fn(() => {
                            throw expectedError;
                        }),
                        { name: "MyErrorTask" },
                    );
                    const task = Boot.task(jest.fn(), {
                        deps: [{ task: dependencyTask, weak: true }],
                        optional: true,
                    });
                    const boot = new Boot().add(task).add(dependencyTask);

                    // Act -----------------
                    const processError = await catchErrorAsync(() =>
                        boot.runAsync(),
                    );

                    // Assert --------------
                    expect(boot.status).toBe(BootStatus.Fail);
                    expect(processError).not.toBeUndefined();
                    expect(processError?.message).toContain(
                        BootError.IMPORTANT_TASK_FAILED,
                    );
                    expect(processError?.message).toContain(
                        dependencyTask.name,
                    );
                    expect(processError?.message).toContain(
                        expectedError.message,
                    );
                    expect(dependencyTask.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Fail,
                    );
                    expect(boot.getTaskFailReason(dependencyTask)).toBe(
                        expectedError,
                    );
                    expect(task.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Skipped);
                });

                test("D5.1e. Strong dependency not added", async () => {
                    // Arrange --------------
                    const dependencyTask = Boot.task(jest.fn());
                    const task = Boot.task(jest.fn(), {
                        optional: true,
                        deps: [dependencyTask],
                    });
                    const boot = new Boot().add(task);

                    // Act ------------------
                    await boot.runAsync();

                    // Assert ---------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(dependencyTask.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Unknown,
                    );
                    expect(task.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Skipped);
                });

                test("D5.1f. Weak dependency not added", async () => {
                    // Arrange --------------
                    const dependencyTask = Boot.task(jest.fn());
                    const task = Boot.task(jest.fn(), {
                        optional: true,
                        deps: [{ task: dependencyTask, weak: true }],
                    });
                    const boot = new Boot().add(task);

                    // Act ------------------
                    await boot.runAsync();

                    // Assert ---------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(dependencyTask.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Unknown,
                    );
                    expect(task.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);
                });
            });

            describe("D5.2. Optional task dependency", () => {
                test("D5.2a. Strong dependency completed", async () => {
                    // Arrange --------------
                    const dependencyTask = Boot.task(jest.fn(), {
                        optional: true,
                    });
                    const task = Boot.task(jest.fn(), {
                        optional: true,
                        deps: [dependencyTask],
                    });
                    const boot = new Boot().add(task).add(dependencyTask);

                    // Act -----------------
                    await boot.runAsync();

                    // Assert --------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(dependencyTask.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Completed,
                    );
                    expect(task.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);
                });

                test("D5.2b. Weak dependency completed", async () => {
                    // Arrange --------------
                    const dependencyTask = Boot.task(jest.fn(), {
                        optional: true,
                    });
                    const task = Boot.task(jest.fn(), {
                        optional: true,
                        deps: [{ task: dependencyTask, weak: true }],
                    });
                    const boot = new Boot().add(task).add(dependencyTask);

                    // Act -----------------
                    await boot.runAsync();

                    // Assert --------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(dependencyTask.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Completed,
                    );
                    expect(task.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);
                });

                test("D5.2c. Strong dependency failed", async () => {
                    // Arrange --------------
                    const expectedError = new Error("Test error");
                    const dependencyTask = Boot.task(
                        jest.fn(() => {
                            throw expectedError;
                        }),
                        {
                            optional: true,
                        },
                    );
                    const task = Boot.task(jest.fn(), {
                        optional: true,
                        deps: [dependencyTask],
                    });
                    const boot = new Boot().add(task).add(dependencyTask);

                    // Act -----------------
                    await boot.runAsync();

                    // Assert --------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(dependencyTask.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Fail,
                    );
                    expect(boot.getTaskFailReason(dependencyTask)).toBe(
                        expectedError,
                    );
                    expect(task.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Skipped);
                });

                test("D5.2d. Weak dependency failed", async () => {
                    // Arrange --------------
                    const expectedError = new Error("Test error");
                    const dependencyTask = Boot.task(
                        jest.fn(() => {
                            throw expectedError;
                        }),
                        {
                            optional: true,
                        },
                    );
                    const task = Boot.task(jest.fn(), {
                        optional: true,
                        deps: [{ task: dependencyTask, weak: true }],
                    });
                    const boot = new Boot().add(task).add(dependencyTask);

                    // Act -----------------
                    await boot.runAsync();

                    // Assert --------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(dependencyTask.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Fail,
                    );
                    expect(boot.getTaskFailReason(dependencyTask)).toBe(
                        expectedError,
                    );
                    expect(task.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);
                });

                test("D5.2e. Strong dependency skipped", async () => {
                    // Arrange --------------
                    const notAddedTask = Boot.task(noop); // For "Skipped" status simulation
                    const dependencyTask = Boot.task(jest.fn(), {
                        deps: [notAddedTask],
                        optional: true,
                    });
                    const task = Boot.task(jest.fn(), {
                        optional: true,
                        deps: [dependencyTask],
                    });
                    const boot = new Boot().add(task).add(dependencyTask);

                    // Act -----------------
                    await boot.runAsync();

                    // Assert --------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(dependencyTask.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Skipped,
                    );
                    expect(task.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Skipped);
                });

                test("D5.2f. Weak dependency skipped", async () => {
                    // Arrange --------------
                    const notAddedTask = Boot.task(noop); // For "Skipped" status simulation
                    const dependencyTask = Boot.task(jest.fn(), {
                        deps: [notAddedTask],
                        optional: true,
                    });
                    const task = Boot.task(jest.fn(), {
                        optional: true,
                        deps: [{ task: dependencyTask, weak: true }],
                    });
                    const boot = new Boot().add(task).add(dependencyTask);

                    // Act -----------------
                    await boot.runAsync();

                    // Assert --------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(dependencyTask.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Skipped,
                    );
                    expect(task.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);
                });

                test("D5.2g. Strong dependency not added", async () => {
                    // Arrange --------------
                    const dependencyTask = Boot.task(jest.fn(), {
                        optional: true,
                    });
                    const task = Boot.task(jest.fn(), {
                        optional: true,
                        deps: [dependencyTask],
                    });
                    const boot = new Boot().add(task);

                    // Act -----------------
                    await boot.runAsync();

                    // Assert --------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(dependencyTask.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Unknown,
                    );
                    expect(task.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Skipped);
                });

                test("D5.2h. Weak dependency not added", async () => {
                    // Arrange --------------
                    const dependencyTask = Boot.task(jest.fn(), {
                        optional: true,
                    });
                    const task = Boot.task(jest.fn(), {
                        optional: true,
                        deps: [{ task: dependencyTask, weak: true }],
                    });
                    const boot = new Boot().add(task);

                    // Act -----------------
                    await boot.runAsync();

                    // Assert --------------
                    expect(boot.status).toBe(BootStatus.Completed);
                    expect(dependencyTask.delegate).not.toHaveBeenCalled();
                    expect(boot.getTaskStatus(dependencyTask)).toBe(
                        TaskStatus.Unknown,
                    );
                    expect(task.delegate).toHaveBeenCalled();
                    expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);
                });
            });
        });

        describe("D6. Tasks graph execution", () => {
            test("D6.1. Deep tasks graph execution", async () => {
                // Tasks Graph:
                //     A ---- C ---- D ---- F
                //     B --/     \-- E --/

                // Arrange -------------
                const taskA = Boot.task(jest.fn(), { name: "A" });
                const taskB = Boot.task(jest.fn(), { name: "B" });
                const taskC = Boot.task(jest.fn(), {
                    name: "C",
                    deps: [taskA, taskB],
                });
                const taskD = Boot.task(jest.fn(), {
                    name: "D",
                    deps: [taskC],
                });
                const taskE = Boot.task(jest.fn(), {
                    name: "E",
                    deps: [taskC],
                });
                const taskF = Boot.task(jest.fn(), {
                    name: "F",
                    deps: [taskD, taskE],
                });

                const boot = new Boot().add([
                    taskA,
                    taskB,
                    taskC,
                    taskD,
                    taskE,
                    taskF,
                ]);

                // Act -----------------
                await boot.runAsync();

                // Assert --------------
                expect(boot.status).toBe(BootStatus.Completed);
                expect(boot.getTaskStatus(taskA)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskB)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskC)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskD)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskE)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskF)).toBe(TaskStatus.Completed);
            });

            test("D6.2. Deep tasks execution with priority", async () => {
                // Tasks Graph:
                //     A ---- B(2)
                //        \-- C(1) ---- E
                //        \-- D(3) --/

                // Arrange -----
                let executionSequence = "";
                const taskA = Boot.task(
                    () => {
                        executionSequence += "A";
                    },
                    { name: "A" },
                );
                const taskB = Boot.task(
                    () => {
                        executionSequence += "B";
                    },
                    { name: "B", priority: 2, deps: [taskA] },
                );
                const taskC = Boot.task(
                    () => {
                        executionSequence += "C";
                    },
                    { name: "C", priority: 1, deps: [taskA] },
                );
                const taskD = Boot.task(
                    () => {
                        executionSequence += "D";
                    },
                    { name: "D", priority: 3, deps: [taskA] },
                );
                const taskE = Boot.task(
                    () => {
                        executionSequence += "E";
                    },
                    { name: "E" },
                );

                const boot = new Boot().add([
                    taskA,
                    taskB,
                    taskC,
                    taskD,
                    taskE,
                ]);

                // Act ---------
                await boot.runAsync();

                // Assert ------
                expect(boot.status).toBe(BootStatus.Completed);
                expect(executionSequence).toBe("ADBCE");
                expect(boot.getTaskStatus(taskA)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskB)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskC)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskD)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskE)).toBe(TaskStatus.Completed);
            });

            test("D6.3. Deep tasks execution with skipped tasks", async () => {
                // Arrange ------
                const taskA = Boot.task(noop, { name: "A" });
                const taskB = Boot.task(
                    () => {
                        throw Error();
                    },
                    { name: "B", optional: true },
                );
                const taskC = Boot.task(noop, {
                    name: "C",
                    deps: [taskA, { task: taskB, weak: true }],
                });
                const taskD = Boot.task(noop, {
                    name: "D",
                    optional: true,
                    deps: [taskB],
                });
                const taskE = Boot.task(noop, {
                    name: "E",
                    optional: true,
                    deps: [taskC, { task: taskD, weak: true }],
                });

                const boot = new Boot().add([
                    taskA,
                    taskB,
                    taskC,
                    taskD,
                    taskE,
                ]);

                // Act ----------
                await boot.runAsync();

                // Assert -------
                expect(boot.status).toBe(BootStatus.Completed);
                expect(boot.getTaskStatus(taskA)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskB)).toBe(TaskStatus.Fail);
                expect(boot.getTaskStatus(taskC)).toBe(TaskStatus.Completed);
                expect(boot.getTaskStatus(taskD)).toBe(TaskStatus.Skipped);
                expect(boot.getTaskStatus(taskE)).toBe(TaskStatus.Completed);
            });
        });

        test("D7. Start process when it's already running", async () => {
            // Arrange -------------
            const boot = new Boot();
            const promise = boot.runAsync();

            // Act -----------------
            const error = await catchErrorAsync(() => boot.runAsync());
            await promise;

            // Assert --------------
            expect(error).not.toBeUndefined();
            expect(error?.message).toContain(BootError.ALREADY_STARTED);
            expect(error?.message).toContain(BootStatus.nameOf(boot.status));
            expect(boot.status).toBe(BootStatus.Completed);
        });

        describe("D8. Process cancellation with abort controller", () => {
            test("D8.1. Cancel process with abort controller", async () => {
                // Arrange --------
                const expectedReason = "Test Cancel";
                const task = Boot.task(() => delayAsync(0)); // microtask simulation
                const boot = new Boot().add(task);
                const abortController = new AbortController();

                // Act ------------
                const promise = boot.runAsync({
                    abortSignal: abortController.signal,
                });

                abortController.abort(expectedReason);
                let processError = await catchErrorAsync(() => promise);
                // Assert ---------
                expect(boot.status).toBe(BootStatus.Cancelled);
                expect(processError).not.toBeUndefined();
                expect(processError?.message).toContain(
                    BootError.PROCESS_ABORTED,
                );
                expect(processError?.message).toContain(expectedReason);
            });

            test("D8.2. Handle abort signal in task", async () => {
                // Arrange --------
                let abortSignalHandled = false;
                const abortController = new AbortController();
                const task = Boot.task(async ({ abortSignal }) => {
                    await delayAsync(0); // microtask simulation
                    if (abortSignal?.aborted) {
                        abortSignalHandled = true;
                        return;
                    }
                });

                const boot = new Boot().add(task);

                // Act ------------
                const promise = catchErrorAsync(() =>
                    boot.runAsync({
                        abortSignal: abortController.signal,
                    }),
                );
                abortController.abort();
                await promise;

                // Assert ---------
                expect(boot.status).toBe(BootStatus.Cancelled);
                expect(abortSignalHandled).toBeTruthy();
            });

            test("D8.3. Throw error by task on abort signal", async () => {
                // Arrange ----------
                const expectedError = new Error("TestError");
                const task = Boot.task(async ({ abortSignal }) => {
                    await delayAsync(0); // microtask simulation
                    if (abortSignal?.aborted) {
                        throw expectedError;
                    }
                });
                const abortController = new AbortController();
                const boot = new Boot().add(task);

                // Act --------------
                const promise = boot.runAsync({
                    abortSignal: abortController.signal,
                });
                abortController.abort();
                await catchErrorAsync(() => promise);

                // Assert -----------
                expect(boot.status).toBe(BootStatus.Fail);
                expect(boot.getTaskStatus(task)).toBe(TaskStatus.Fail);
                expect(boot.getTaskFailReason(task)).toBe(expectedError);
            });
        });
    });

    describe("E. Boot process inheritance", () => {
        test("E1. Simple inheritance", async () => {
            // Arrange ---------------
            const task = Boot.task(jest.fn());
            const bootA = new Boot().add(task);

            const bootB = new Boot(bootA);

            // Act -------------------
            await bootB.runAsync();

            // Assert ----------------
            expect(bootB.isChildOf(bootA)).toBeTruthy();
            expect(bootB.has(task)).toBeTruthy();
            expect(task.delegate).toHaveBeenCalledTimes(1);
            expect(bootB.getTaskStatus(task)).toBe(TaskStatus.Completed);
            expect(bootA.getTaskStatus(task)).toBe(TaskStatus.Idle); // Parent's state map is not affected
        });

        test("E2. Multi inheritance", async () => {
            // Arrange --------
            const taskA = Boot.task(jest.fn());
            const bootA = new Boot().add(taskA);

            const taskB = Boot.task(jest.fn());
            const bootB = new Boot().add(taskB);

            const task = Boot.task(jest.fn());
            const boot = new Boot(bootA, bootB).add(task);

            // Act ------------
            await boot.runAsync();

            // Assert ---------
            expect(boot.isChildOf(bootA)).toBeTruthy();
            expect(boot.isChildOf(bootB)).toBeTruthy();
            expect(boot.has(taskA)).toBeTruthy();
            expect(boot.has(taskB)).toBeTruthy();
            expect(boot.has(task)).toBeTruthy();

            expect(taskA.delegate).toHaveBeenCalledTimes(1);
            expect(boot.getTaskStatus(taskA)).toBe(TaskStatus.Completed);
            expect(taskB.delegate).toHaveBeenCalledTimes(1);
            expect(boot.getTaskStatus(taskB)).toBe(TaskStatus.Completed);
            expect(task.delegate).toHaveBeenCalledTimes(1);
            expect(boot.getTaskStatus(task)).toBe(TaskStatus.Completed);

            // Parent's state map is not affected
            expect(bootA.getTaskStatus(taskA)).toBe(TaskStatus.Idle);
            expect(bootA.getTaskStatus(taskB)).toBe(TaskStatus.Unknown);
            expect(bootA.getTaskStatus(task)).toBe(TaskStatus.Unknown);

            expect(bootB.getTaskStatus(taskA)).toBe(TaskStatus.Unknown);
            expect(bootB.getTaskStatus(taskB)).toBe(TaskStatus.Idle);
            expect(bootB.getTaskStatus(task)).toBe(TaskStatus.Unknown);
        });

        test("E3. Inheritance with task dependencies", async () => {
            // Arrange ----------------
            const taskA = Boot.task(noop);
            const taskB = Boot.task(noop, [taskA]);

            const bootA = new Boot().add(taskA);
            const bootB = new Boot(bootA).add(taskB);

            // Act -----------------
            await bootB.runAsync();

            // Assert -------------
            expect(bootB.isChildOf(bootA)).toBeTruthy();
            expect(bootB.status).toBe(BootStatus.Completed);
            expect(bootB.getTaskStatus(taskA)).toBe(TaskStatus.Completed);
            expect(bootB.getTaskStatus(taskB)).toBe(TaskStatus.Completed);
        });

        describe("E4. Inheritance with the tasks state map synchronization", () => {
            test("E4.1. Running processes without synchronization", async () => {
                // Arrange -------------
                const taskA = Boot.task(jest.fn());
                const bootA = new Boot().add(taskA);

                const taskB = Boot.task(jest.fn(), [taskA]);
                const bootB = new Boot(bootA).add(taskB);

                // Act -----------------
                await bootA.runAsync();
                await bootB.runAsync();

                // Assert --------------
                expect(bootA.status).toBe(BootStatus.Completed);
                expect(bootB.status).toBe(BootStatus.Completed);

                expect(taskA.delegate).toHaveBeenCalledTimes(2); // once per boot process
                expect(taskB.delegate).toHaveBeenCalledTimes(1);
            });

            test("E4.2. Running processes with synchronization", async () => {
                // Arrange -------------
                const taskA = Boot.task(
                    jest.fn(() => {
                        throw Error();
                    }),
                    { name: "TaskA", optional: true },
                );
                const bootA = new Boot().add(taskA);

                const taskB = Boot.task(jest.fn(), {
                    name: "TaskB",
                    deps: [{ task: taskA, weak: true }],
                });
                const bootB = new Boot(bootA).add(taskB);

                // Act -----------------
                await bootA.runAsync();
                await bootB.runAsync({ synchronizeWithParents: true });

                // Assert --------------
                expect(bootA.status).toBe(BootStatus.Completed);
                expect(bootB.status).toBe(BootStatus.Completed);

                expect(bootB.getTaskStatus(taskA)).toBe(TaskStatus.Fail);
                expect(bootB.getTaskStatus(taskB)).toBe(TaskStatus.Completed);

                expect(taskA.delegate).toHaveBeenCalledTimes(1);
                expect(taskB.delegate).toHaveBeenCalledTimes(1);
            });

            test("E4.3. Re-run failed & skipped tasks", async () => {
                // Arrange -------
                const task1 = Boot.task(jest.fn());
                const task2 = Boot.task(jest.fn(), {
                    optional: true,
                    deps: [task1],
                });

                const bootA = new Boot().add(task2);

                const bootB = new Boot(bootA).add(task1);

                // Act -----------
                await bootA.runAsync();
                await bootB.runAsync({
                    synchronizeWithParents: true,
                    resetFailedTasks: true,
                });

                // Assert --------
                expect(bootA.getTaskStatus(task2)).toBe(TaskStatus.Skipped);
                expect(bootB.getTaskStatus(task1)).toBe(TaskStatus.Completed);
                expect(bootB.getTaskStatus(task2)).toBe(TaskStatus.Completed);

                expect(task1.delegate).toHaveBeenCalledTimes(1);
                expect(task2.delegate).toHaveBeenCalledTimes(1);
            });
        });
    });
});
