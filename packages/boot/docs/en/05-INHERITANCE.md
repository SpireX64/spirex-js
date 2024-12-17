[◀ Process](./04-PROCESS.md) ● [INDEX](./README.md)

# Process Inheritance
Inheritance allows you to create new processes based on existing ones.
The inherited process includes all tasks from its parent, simplifying the creation of complex task chains.

## 1. Creating an Inherited Process
To inherit tasks from another process, pass the parent process to the constructor:

```ts
const taskA = Boot.task(() => console.log("Task A completed!"));
const processA = new Boot().add(taskA);

const taskB = Boot.task(() => console.log("Task B completed!"), [taskA]);
const processB = new Boot(processA).add(taskB);

await processB.runAsync();
// Task A completed!
// Task B completed!
```

## 2. Multiple Inheritance
A process can inherit tasks from multiple parent processes:
```ts
const taskA = Boot.task(() => { console.log("Task A completed!") });
const processA = new Boot().add(taskA);

const taskB = Boot.task(() => { console.log("Task B completed!") });
const processB = new Boot().add(taskB);

const taskC = Boot.task(() => { console.log("Task C completed!") }, [ taskA, taskB ]);
const processC = new Boot([ processA, processB ]).add(taskC);

await processC.runAsync();
// Task A completed!
// Task B completed!
// Task C completed!
```

## 3. Verifying Inheritance
Use the `isChildOf` method to check if a process inherits another:
```ts
processC.isChildOf(processA) // True
processC.isChildOf(processD) // False
```

## 4. Independent Execution
By default, processes execute independently, even when tasks overlap:
```ts
const taskA = Boot.task(() => { console.log("Task A completed!") });
const processA = new Boot().add(taskA);

const taskB = Boot.task(() => { console.log("Task B completed!") }, [ taskA ]);
const processB = new Boot([ processA ]).add(taskB);

await processA.runAsync();
// Task A completed!
await processB.runAsync();
// Task A completed!
// Task B completed!
```
In this case, `taskA` runs twice—once for each process.

## 5. Synchronizing Processes
To synchronize task states across processes, use the `synchronizeWithParents` flag:
```ts
await processA.runAsync();
// Task A completed!
await processB.runAsync({ synchronizeWithParents: true });
// Task B completed!
```
In this example, `taskA is` not executed again in `processB` because it was already completed in `processA`.

## 6. Restarting Parent Tasks
To rerun tasks skipped or failed in a parent process, use the `resetFailedTasks` flag:
```ts
await processB.runAsync({
    synchronizeWithParents: true, 
    resetFailedTasks: true,
});
```

[◀ Process](./04-PROCESS.md) ● [INDEX](./README.md)
