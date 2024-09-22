// noinspection DuplicatedCode

import {
    AppBoot,
    BootTaskState,
    TFinishEventData,
    TFinishEventListener,
    TProcessEventData,
    TProcessEventListener,
} from "./AppBoot";

describe("AppBoot", () => {
    describe("Create task", () => {
        test("by function", () => {
            // Act -----------------
            const bootTask = AppBoot.task(() => {});

            // Assert --------------
            expect(bootTask).not.toBeNull();
            expect(bootTask.name).toBe("");
            expect(bootTask.optional).toBeFalsy();
            expect(bootTask.dependsOn).toBeUndefined();
        });

        test("by named function", () => {
            // Arrange -----------
            const myTaskFunc = () => {};

            // Act ---------------
            const bootTask = AppBoot.task(myTaskFunc);

            // Assert ------------
            expect(bootTask.run).toBe(myTaskFunc);
            expect(bootTask.name).toBe("myTaskFunc");
        });

        test("with dependencies", () => {
            // Arrange -------
            const parentTask = AppBoot.task(() => {});
            const task = AppBoot.task(() => {}, [parentTask]);

            expect(task.dependsOn).not.toBeUndefined();
            expect(
                task.dependsOn?.find((it) => it.task === parentTask),
            ).not.toBeFalsy();
        });

        test("with explicit name", () => {
            // Arrange ------------
            const expectedName = "MyBootTask";
            const func = () => {};

            // Act ----------------
            const bootTask = AppBoot.task(expectedName, func);

            // Assert -------------
            expect(bootTask.name).toBe(expectedName);
            expect(bootTask.optional).toBeFalsy();
            expect(bootTask.run).toBe(func);
        });

        test("with explicit name and dependencies", () => {
            // Arrange -------------
            const parentTask = AppBoot.task(() => {});
            const expectedName = "MyTask";
            const func = () => {};

            // Act -----------------
            const bootTask = AppBoot.task(expectedName, func, [parentTask]);

            // Assert --------------
            expect(bootTask.name).toBe(expectedName);
            expect(bootTask.run).toBe(func);
            expect(
                bootTask.dependsOn?.find((it) => it.task === parentTask),
            ).not.toBeFalsy();
        });

        test("optional", () => {
            // Arrange ---------
            const func = () => {};

            // Act ---------
            const task = AppBoot.task(func, null, true);

            // Assert ------
            expect(task.optional).toBeTruthy();
            expect(task.run).toBe(func);
            expect(task.dependsOn).toBeFalsy();
        });

        test("optional with name and dependencies", () => {
            // Arrange ----------
            const expectedName = "myOptionalTask";
            const parentTask = AppBoot.task(() => {});

            // Act --------------
            const task = AppBoot.task(
                expectedName,
                () => {},
                [parentTask],
                true,
            );

            // Assert -----------
            expect(task.name).toBe(expectedName);
            expect(
                task.dependsOn?.find((it) => it.task === parentTask),
            ).not.toBeFalsy();
        });
    });

    describe("Add tasks", () => {
        test("add.task.one", () => {
            // Arrange ------
            const task = AppBoot.task(() => {});
            const boot = new AppBoot();

            // Act ----------
            boot.add(task);

            // Assert -------
            expect(boot.has(task)).not.toBeFalsy();
            expect(boot.tasksCount).toBe(1);
        });

        test("add.task.many", () => {
            // Arrange -------
            const taskA = AppBoot.task("A", () => {});
            const taskB = AppBoot.task("B", () => {});
            const boot = new AppBoot();

            // Act -----------
            boot.add([taskA, taskB]);

            // Assert --------
            expect(boot.has(taskA));
            expect(boot.has(taskB));
            expect(boot.tasksCount).toBe(2);
        });

        test("add.task.nullable", () => {
            // Arrange -------
            const boot = new AppBoot();

            // Act -----------
            boot.add(null);

            // Assert --------
            expect(boot.tasksCount).toBe(0);
        });

        test("add.task.chain", () => {
            // Arrange --------
            const boot = new AppBoot();
            const taskA = AppBoot.task(() => {});
            const taskB = AppBoot.task(() => {}, [taskA]);
            const taskC = AppBoot.task(() => {}, [taskB]);

            // Act ------------
            boot.add([taskA, taskB, taskC]);

            // Assert ---------
            expect(boot.tasksCount).toBe(3);
            expect(boot.isTaskReachable(taskA)).toBeTruthy();
            expect(boot.isTaskReachable(taskB)).toBeTruthy();
            expect(boot.isTaskReachable(taskC)).toBeTruthy();
        });

        test("add.task.unreachable", () => {
            // Arrange -----------
            const taskA = AppBoot.task(() => {});
            const taskB = AppBoot.task(() => {}, [taskA]);
            const boot = new AppBoot();

            // Act ---------------
            boot.add(taskB);

            // Assert ------------
            expect(boot.has(taskA)).toBeFalsy();
            expect(boot.has(taskB)).toBeTruthy();
            expect(boot.isTaskReachable(taskB)).toBeFalsy();
        });

        test("add.after-start", async () => {
            // Arrange --------
            const boot = new AppBoot();
            const task = AppBoot.task(() => {});

            // Act ------------
            const promise = boot.runAsync();

            let error: Error | null = null;
            try {
                boot.add(task);
            } catch (e) {
                if (e instanceof Error) error = e;
            }
            await promise;

            // Assert ---------
            expect(error).not.toBeNull();
        });
    });

    describe("Boot process", () => {
        test("run.noTasks", async () => {
            // Arrange ------
            const boot = new AppBoot();

            // Act ----------
            const result = await boot.runAsync();

            // Assert -------
            expect(result).not.toBeFalsy();
            expect(result.success).toHaveLength(0);
            expect(result.failure).toHaveLength(0);
            expect(result.skipped).toHaveLength(0);
        });

        test("run.after-run", async () => {
            // Arrange ------
            const boot = new AppBoot();

            // Act ----------
            const promise = boot.runAsync();
            let error: Error | null = null;
            try {
                await boot.runAsync();
            } catch (e) {
                if (e instanceof Error) error = e;
            }
            await promise;

            // Assert -------
            expect(error).not.toBeNull();
        });

        test("run.success", async () => {
            // Arrange -------
            const boot = new AppBoot();

            const taskFunc = jest.fn();
            const task = AppBoot.task(taskFunc);
            boot.add(task);

            // Act -----------
            const result = await boot.runAsync();

            // Assert --------
            expect(taskFunc).toHaveBeenCalled();
            expect(result.success).toContain(task);
            expect(result.failure).toHaveLength(0);
            expect(result.skipped).toHaveLength(0);
        });

        test("run.importantTask.failure", async () => {
            // Arrange --------
            const boot = new AppBoot();

            const taskFunc = jest.fn(() => {
                throw Error();
            });
            const task = AppBoot.task(taskFunc);
            boot.add(task);

            // Act ------------
            let error: Error | null = null;
            try {
                await boot.runAsync();
            } catch (e) {
                if (e instanceof Error) error = e;
            }

            // Assert ---------
            expect(taskFunc).toHaveBeenCalled();
            expect(error).not.toBeNull();
            expect(error?.message).toContain(task.name);
        });

        test("run.importantTask.failure.notErrorType", async () => {
            // Arrange --------
            const boot = new AppBoot();

            const taskFunc = jest.fn(() => {
                throw "String error type";
            });
            const task = AppBoot.task(taskFunc);
            boot.add(task);

            // Act ------------
            let error: Error | null = null;
            try {
                await boot.runAsync();
            } catch (e) {
                if (e instanceof Error) error = e;
            }

            // Assert ---------
            expect(taskFunc).toHaveBeenCalled();
            expect(error).not.toBeNull();
            expect(error?.message).toContain(task.name);
        });

        test("run.optionalTask.failure", async () => {
            // Arrange --------
            const boot = new AppBoot();

            const taskFunc = jest.fn(() => {
                throw Error("Test error");
            });
            const task = AppBoot.task(taskFunc, null, true);
            boot.add(task);

            // Act ------------
            const result = await boot.runAsync();

            // Assert ---------
            expect(taskFunc).toHaveBeenCalled();
            expect(result.success).toHaveLength(0);
            expect(result.failure).toContain(task);
        });

        test("run.many", async () => {
            // Arrange -----------
            const boot = new AppBoot();

            const taskA = AppBoot.task("A", () => {});
            const taskB = AppBoot.task("B", () => {});
            boot.add([taskA, taskB]);

            // Act ---------------
            const result = await boot.runAsync();

            // Assert ------------
            expect(result.success).toContain(taskA);
            expect(result.success).toContain(taskB);
        });

        test("depend", async () => {
            // Arrange ----------
            const boot = new AppBoot();

            const seq: string[] = [];

            const taskA = AppBoot.task("A", () => {
                seq.push("A");
            });
            const taskB = AppBoot.task(
                "B",
                () => {
                    seq.push("B");
                },
                [taskA],
            );
            const taskC = AppBoot.task("C", () => {
                seq.push("C");
            });
            boot.add([taskA, taskB, taskC]);

            // Act ---------------
            const result = await boot.runAsync();

            // Arrange -----------
            expect(seq.join("")).toBe("ACB");
            expect(result.success).toContain(taskA);
            expect(result.success).toContain(taskB);
            expect(result.success).toContain(taskC);
        });

        test("depend.fail.strict", async () => {
            // Arrange ------------
            const boot = new AppBoot();

            const funcTaskA = jest.fn(() => {
                throw Error("Test Error");
            });
            const taskA = AppBoot.task("A", funcTaskA, null, true);

            const funcTaskB = jest.fn();
            const taskB = AppBoot.task("B", funcTaskB, [taskA]);

            boot.add([taskA, taskB]);

            // Act ----------------
            const result = await boot.runAsync();

            // Assert -------------
            expect(result.success).toHaveLength(0);
            expect(result.failure).toContain(taskA);
            expect(result.skipped).toContain(taskB);
        });

        test("depend.fail.optional", async () => {
            // Arrange -------------
            const boot = new AppBoot();

            const funcTaskA = jest.fn(() => {
                throw Error("Test Error");
            });
            const taskA = AppBoot.task("A", funcTaskA, null, true);

            const funcTaskB = jest.fn();
            const taskB = AppBoot.task("B", funcTaskB, [
                { task: taskA, optional: true },
            ]);

            boot.add([taskA, taskB]);

            // Act -----------------
            const result = await boot.runAsync();

            // Assert --------------
            expect(result.failure).toContain(taskA);
            expect(result.success).toContain(taskB);
            expect(result.skipped).toHaveLength(0);
        });

        test("deepDepend.skip", async () => {
            // Arrange -------
            const taskA = AppBoot.task(
                "A",
                () => {
                    throw Error("Test fail");
                },
                null,
                true,
            );
            const taskB = AppBoot.task("B", () => {}, [taskA], true);
            const deepTask = AppBoot.task("Deep", () => {}, [taskB], true);

            const boot = new AppBoot().add([taskA, taskB, deepTask]);

            // Act -----------
            const result = await boot.runAsync();

            // Assert --------
            expect(result.failure).toContain(taskA);
            expect(result.skipped).toContain(taskB);
            expect(result.skipped).toContain(deepTask);
        });

        test("deepDepend.skip.fail", async () => {
            // Arrange -----------

            // RUN
            const taskA = AppBoot.task("A", () => {});

            // FAILED
            const taskB = AppBoot.task(
                "B",
                () => {
                    throw Error("Test fail");
                },
                null,
                true,
            );

            // SKIP
            const taskC = AppBoot.task("C", () => {}, [taskA, taskB], true);

            // IDLE
            const taskD = AppBoot.task("D", () => {}, [taskA, taskC]);

            const boot = new AppBoot().add([taskA, taskB, taskC, taskD]);

            // Act ---------------
            await boot.runAsync();

            // Assert ------------
        });

        test("deepDepend.skip.important", async () => {
            // Arrange -------
            const taskA = AppBoot.task(
                "A",
                () => {
                    throw Error("Test fail");
                },
                null,
                true,
            );
            const taskB = AppBoot.task("B", () => {}, [taskA], true);
            const deepTask = AppBoot.task("Deep", () => {}, [taskB]);

            const boot = new AppBoot().add([taskA, taskB, deepTask]);

            // Act ----------
            let error: Error | null = null;
            try {
                await boot.runAsync();
            } catch (e) {
                if (e instanceof Error) error = e;
            }

            // Assert --------
            expect(error).not.toBeNull();
            expect(error?.message).toContain(deepTask.name);
        });

        test("run.depend.unreachable.important", async () => {
            // Arrange ---------
            const boot = new AppBoot();
            const taskA = AppBoot.task("A", () => {});
            const taskB = AppBoot.task("B", () => {}, [taskA]);
            boot.add(taskB);

            // Act -------------
            let error: Error | null = null;
            try {
                await boot.runAsync();
            } catch (e) {
                if (e instanceof Error) error = e;
            }

            // Assert ----------
            expect(error).not.toBeNull();
        });

        test("run.depend.unreachable.optional", async () => {
            // Arrange ---------
            const boot = new AppBoot();
            const taskA = AppBoot.task("A", () => {});
            const taskB = AppBoot.task("B", () => {}, [taskA], true);
            boot.add(taskB);

            // Act -------------
            const result = await boot.runAsync();

            // Assert ----------
            expect(result.success.length).toBe(0);
            expect(result.failure.length).toBe(0);
            expect(result.skipped.length).toBe(0);
            expect(result.unreachable.length).toBe(1);
        });

        test("listener.process", async () => {
            // Arrange ----------------
            const boot = new AppBoot();
            const taskA = AppBoot.task("A", () => {});
            const taskB = AppBoot.task("B", () => {});
            const taskC = AppBoot.task("C", () => {}, [taskA, taskB]);

            boot.add([taskA, taskB, taskC]);

            const processLog: TProcessEventData[] = [];
            const processListener = jest.fn(((process) => {
                processLog.push(process);
            }) as TProcessEventListener);
            boot.addEventListener("process", processListener);

            // Act --------------------
            await boot.runAsync();

            // Assert -----------------
            expect(processListener).toHaveBeenCalledTimes(boot.tasksCount);
            expect(processLog.length).toBe(boot.tasksCount);

            expect(processLog[0].completed).toBe(1);
            expect(processLog[0].total).toBe(boot.tasksCount);
            expect(processLog[0].task).toBe(taskA);

            expect(processLog[1].completed).toBe(2);
            expect(processLog[1].total).toBe(boot.tasksCount);
            expect(processLog[1].task).toBe(taskB);

            expect(processLog[2].completed).toBe(3);
            expect(processLog[2].total).toBe(boot.tasksCount);
            expect(processLog[2].task).toBe(taskC);
        });

        test("listener.process.checkState", async () => {
            // Arrange -----------
            const boot = new AppBoot();
            const taskA = AppBoot.task("A", () => {});
            const taskB = AppBoot.task(
                "B",
                () => {
                    throw Error("Test error");
                },
                [taskA],
                true,
            );
            const taskC = AppBoot.task("C", () => {}, [
                taskA,
                { task: taskB, optional: true },
            ]);

            boot.add([taskA, taskB, taskC]);

            const processLog: BootTaskState[][] = [];
            const processListener = jest.fn(((process) => {
                processLog.push([
                    process.getStateOf(taskA),
                    process.getStateOf(taskB),
                    process.getStateOf(taskC),
                ]);
            }) as TProcessEventListener);
            boot.addEventListener("process", processListener);

            // Act ---------------
            const result = await boot.runAsync();

            // Assert ------------
            expect(result.success.length).toBe(2);
            expect(result.failure.length).toBe(1);
            expect(result.skipped.length).toBe(0);

            expect(processLog.length).toBe(3);

            // A: Success, B & C: Idle (waiting for A)
            expect(processLog[0]).toStrictEqual([
                BootTaskState.Success,
                BootTaskState.Idle,
                BootTaskState.Idle,
            ]);

            // A: Success, B: Failure, C: Idle (waiting for C)
            expect(processLog[1]).toStrictEqual([
                BootTaskState.Success,
                BootTaskState.Failure,
                BootTaskState.Idle,
            ]);

            // A: Success, B: Failure, C: Success (B is optional)
            expect(processLog[2]).toStrictEqual([
                BootTaskState.Success,
                BootTaskState.Failure,
                BootTaskState.Success,
            ]);
        });

        test("listener.process.checkState.noTask", async () => {
            // Arrange -------------
            const boot = new AppBoot();
            const taskA = AppBoot.task("A", () => {});
            const taskB = AppBoot.task("B", () => {}, [taskA]);

            boot.add(taskA);

            let taskBState: BootTaskState | undefined;
            const processListener = jest.fn(((process) => {
                taskBState = process.getStateOf(taskB);
            }) as TProcessEventListener);
            boot.addEventListener("process", processListener);

            // Act -----------------
            await boot.runAsync();

            // Assert --------------
            expect(boot.tasksCount).toBe(1);
            expect(taskBState).toBe(BootTaskState.Unknown);
        });

        test("listener.process.remove", async () => {
            // Arrange ---------
            const boot = new AppBoot();
            const taskA = AppBoot.task("A", () => {});
            boot.add(taskA);

            const processListener = jest.fn();
            boot.addEventListener("process", processListener);

            // Act -------------
            boot.removeEventListener("process", processListener);
            await boot.runAsync();

            // Assert ----------
            expect(processListener).not.toHaveBeenCalled();
        });

        test("listener.finish", async () => {
            // Arrange --------
            const boot = new AppBoot();
            const taskA = AppBoot.task("A", () => {});
            const taskB = AppBoot.task("B", () => {}, [taskA]);
            boot.add([taskA, taskB]);

            let finishListenerData: TFinishEventData | undefined;
            const finishListener = jest.fn(((data) => {
                finishListenerData = data;
            }) as TFinishEventListener);
            boot.addEventListener("finish", finishListener);

            // Act ------------
            const result = await boot.runAsync();

            // Assert ---------
            expect(finishListenerData).not.toBeUndefined();
            expect(finishListenerData?.type).toBe("finish");
            expect(finishListenerData?.result).toBe(result);
        });

        test("listener.finish.remove", async () => {
            // Arrange --------
            const boot = new AppBoot();
            const taskA = AppBoot.task("A", () => {});
            boot.add(taskA);

            const finishListener = jest.fn();
            boot.addEventListener("finish", finishListener);

            // Act ------------
            boot.removeEventListener("finish", finishListener);
            await boot.runAsync();

            // Assert ---------
            expect(finishListener).not.toHaveBeenCalled();
        });

        test("dispose.beforeRun", () => {
            // Arrange ---------
            const boot = new AppBoot();

            // Assert -------------
            expect(() => boot.dispose()).not.toThrow();
            expect(boot.isDisposed).toBeTruthy();
        });

        test("dispose.twice", () => {
            // Arrange ---------
            const boot = new AppBoot();
            boot.dispose();

            // Assert ----------
            expect(() => boot.dispose()).not.toThrow();
            expect(boot.isDisposed).toBeTruthy();
        });

        test("dispose.whenRunning", async () => {
            // Arrange ---------
            const boot = new AppBoot();
            const promise = boot.runAsync();

            // Act -------------
            let error: Error | null = null;
            try {
                boot.dispose();
            } catch (e) {
                if (e instanceof Error) error = e;
            }

            const result = await promise;

            // Assert -----------
            expect(error).not.toBeNull();
            expect(result).not.toBeFalsy();
            expect(boot.isDisposed).toBeFalsy();
        });

        test("dispose.auto", async () => {
            // Arrange -----------
            const boot = new AppBoot();

            // Act ---------------
            await boot.runAsync({ disposeOnFinish: true });

            // Assert ------------
            expect(boot.isDisposed).toBeTruthy();
        });
    });

    test("Large graph", async () => {
        // [A] (B) (C) [D] <E>
        //  |   | \ | /  \ / \
        // <F> (G) [H]   [I] |
        //  | \ |   | \ /    |
        // [J] [K]  | [L]   [M]
        //        \ | /  \ /
        //         [N]   [O]

        // Arrange --------------
        const taskA = AppBoot.task("A", () => {});
        const taskB = AppBoot.task("B", () => {}, null, true);
        const taskC = AppBoot.task("C", () => {}, null, true);
        const taskD = AppBoot.task("D", () => {});
        const taskE = AppBoot.task(
            "E",
            () => {
                throw Error();
            },
            null,
            true,
        );
        const taskF = AppBoot.task(
            "F",
            () => {
                throw Error();
            },
            [taskA],
            true,
        );
        const taskG = AppBoot.task("G", () => {}, [taskB], true);
        const taskH = AppBoot.task("H", () => {}, [taskB, taskC, taskD]);
        const taskI = AppBoot.task("I", () => {}, [
            taskD,
            { task: taskE, optional: true },
        ]);
        const taskJ = AppBoot.task("J", () => {}, [taskF]);
        const taskK = AppBoot.task("K", () => {}, [
            { task: taskF, optional: true },
            taskG,
        ]);
        const taskL = AppBoot.task("L", () => {}, [taskH, taskI]);
        const taskM = AppBoot.task("M", () => {}, [taskE]);
        const taskN = AppBoot.task("N", () => {}, [taskK, taskH, taskL]);
        const taskO = AppBoot.task("O", () => {}, [taskL, taskM], true);

        const boot = new AppBoot()
            .add([taskI, taskJ, taskK, taskL])
            .add([taskE, taskF, taskG, taskH])
            .add([taskA, taskB, taskC, taskD])
            .add([taskM, taskN, taskO]);

        // Act ------------
        const result = await boot.runAsync();

        boot.dispose();

        // Assert ---------
        expect(result).not.toBeNull();

        // Success
        expect(result.success).toContain(taskA);
        expect(result.success).toContain(taskB);
        expect(result.success).toContain(taskC);
        expect(result.success).toContain(taskD);
        expect(result.success).toContain(taskG);
        expect(result.success).toContain(taskH);
        expect(result.success).toContain(taskI);
        expect(result.success).toContain(taskK);
        expect(result.success).toContain(taskL);
        expect(result.success).toContain(taskN);

        // Failure
        expect(result.failure).toContain(taskE);
        expect(result.failure).toContain(taskF);

        // Skipped
        expect(result.skipped).toContain(taskJ);
        expect(result.skipped).toContain(taskM);
        expect(result.skipped).toContain(taskO);
    });

    describe("Inheritance", () => {
        test("Inheritance of one process", () => {
            // Arrange -----------
            const parent = new AppBoot();

            const parentTask = AppBoot.task(() => {});
            parent.add(parentTask);

            // Act --------------
            const child = new AppBoot(parent);

            // Arrange ----------
            expect(child.isChildOf(parent)).toBeTruthy();
            expect(child.has(parentTask)).toBeTruthy();
        });

        test("Inheritance of many process", () => {
            // Arrange -----
            const parentA = new AppBoot();
            const parentTaskA = AppBoot.task(() => {});
            parentA.add(parentTaskA);

            const parentB = new AppBoot();
            const parentTaskB = AppBoot.task(() => {});
            parentB.add(parentTaskB);

            // Act ----------
            const child = new AppBoot(parentA, parentB);

            // Assert -------
            expect(child.isChildOf(parentA)).toBeTruthy();
            expect(child.has(parentTaskA)).toBeTruthy();

            expect(child.isChildOf(parentB)).toBeTruthy();
            expect(child.has(parentTaskB)).toBeTruthy();
        });

        test("Inheritance with disposed parent", () => {
            // Arrange ------
            const parent = new AppBoot();
            parent.dispose();

            // Act ----------
            let error: Error | null = null;
            try {
                new AppBoot(parent);
            } catch (e) {
                if (e instanceof Error) error = e;
            }

            // Assert -------
            expect(error).not.toBeNull();
        });

        test("Run parent's task", async () => {
            // Arrange -------
            const parentTaskFunc = jest.fn();

            const parentTask = AppBoot.task(parentTaskFunc);
            const parent = new AppBoot().add(parentTask);

            const childTaskFunc = jest.fn();
            const childTask = AppBoot.task(childTaskFunc, [parentTask]);

            // Act -----------
            const child = new AppBoot(parent).add(childTask);
            await child.runAsync();

            // Assert --------
            expect(parentTaskFunc).toHaveBeenCalledTimes(1);
            expect(childTaskFunc).toHaveBeenCalledTimes(1);
        });

        test("Tasks state inheritance from parent on create", async () => {
            // Arrange -------
            const parentTaskFunc = jest.fn();
            const parentTask = AppBoot.task(parentTaskFunc);
            const parent = new AppBoot().add(parentTask);

            const childTaskFunc = jest.fn();
            const childTask = AppBoot.task(childTaskFunc, [parentTask]);

            // Act -----------
            await parent.runAsync();
            parentTaskFunc.mockClear();

            const child = new AppBoot(parent).add(childTask);
            await child.runAsync();

            // Assert --------
            expect(parentTaskFunc).toHaveBeenCalledTimes(0); // Was not called by child
            expect(childTaskFunc).toHaveBeenCalledTimes(1);
        });

        test("Sync tasks states with parents", async () => {
            // Arrange -----------
            const parentTaskFunc = jest.fn();
            const parentTask = AppBoot.task(parentTaskFunc);
            const parent = new AppBoot().add(parentTask);

            const childTaskFunc = jest.fn();
            const childTask = AppBoot.task(childTaskFunc, [parentTask]);
            const child = new AppBoot(parent).add(childTask);

            // Act ----------------
            await parent.runAsync();
            parentTaskFunc.mockClear(); // Clear calls counter

            await child.runAsync({ syncWithParents: true });

            // Assert -------------
            expect(parentTaskFunc).toHaveBeenCalledTimes(0); // Was not called by child
            expect(childTaskFunc).toHaveBeenCalledTimes(1); // Called by child
        });

        test("Sync with disposed parent", async () => {
            // Arrange -----------
            const parentTaskFunc = jest.fn();
            const parentTask = AppBoot.task(parentTaskFunc);
            const parent = new AppBoot().add(parentTask);

            const childTaskFunc = jest.fn();
            const childTask = AppBoot.task(childTaskFunc, [parentTask]);
            const child = new AppBoot(parent).add(childTask);

            // Act ----------------
            await parent.runAsync({ disposeOnFinish: true });

            let error: Error | null = null;
            try {
                await child.runAsync({ syncWithParents: true });
            } catch (e) {
                if (e instanceof Error) error = e;
            }

            // Assert -------------
            expect(error).not.toBeNull();
        });

        test("Child will process parents tasks without sync", async () => {
            // Arrange -----------
            const parentTaskFunc = jest.fn();
            const parentTask = AppBoot.task(parentTaskFunc);
            const parent = new AppBoot().add(parentTask);

            const childTaskFunc = jest.fn();
            const childTask = AppBoot.task(childTaskFunc, [parentTask]);
            const child = new AppBoot(parent).add(childTask);

            // Act ----------------
            await parent.runAsync();
            await child.runAsync();

            // Assert -------------
            expect(parentTaskFunc).toHaveBeenCalledTimes(2); // Called by parent & child
            expect(childTaskFunc).toHaveBeenCalledTimes(1); // Called by child
        });
    });
});
