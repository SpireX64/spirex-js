[◀ Task Dependencies](./03-TASKS_DEPS.md) ● [INDEX](./README.md) ● [Наследование процессов ▶](./05-INHERITANCE.md)

# Creating and Configuring a Process
A process in `@spirex/js-boot` manages the execution of tasks, ensuring they run in the correct order,
track their states, and handle completion, errors, or interruptions.

## 1. Creating a Process
Use the `Boot` class to create a process:
```ts
import { Boot } from '@spirex/js-boot'

const process = new Boot();
```

## 2. Adding Tasks to the Process
Tasks are added using the `add` method. Duplicate tasks cannot be added to a process:
```ts
const taskA = Boot.task(() => console.log("Task A executed"));
const process = new Boot().add(taskA);
```

Tasks cannot be added after the process has started:
```ts
const myTask = Boot.task(() => {})
const boot = new Boot()
boot.runAsync()

boot.add(myTask)
// Boot[ERR_TASK_ADDITION_DENIED]:
// Tasks cannot be added after the boot process has started. Current status: Running.
```

### Multiple Task Addition
The `add` method returns the process instance, enabling tasks to be added in a chain:
```ts
const taskA = Boot.task(() => {});
const taskB = Boot.task(() => {});

const process = new Boot().add(taskA).add(taskB);
```

You can add multiple tasks by passing an array:
```ts
const process = new Boot().add([ taskA, taskB ]);
```

### Conditional Task Addition
Falsy-values (`null`, `undefined`, `false`) are ignored, enabling conditional task additions:
```ts
const DEV = process.env.NODE_ENV === 'development'

const boot = new Boot()
    .add(DEV && taskA)
    .add(taskB);
```

Falsy values are also ignored when adding tasks in an array:
```ts
const DEV = process.env.NODE_ENV === 'development'
const boot = new Boot().add([
    DEV && taskA,
    taskB,
]);
```

This behavior makes it easier to dynamically construct task lists without additional filtering logic.

### Modular Task Definitions
Task lists can be extracted into constants or functions for improved modularity and flexibility:

```ts
function coreModules(): readonly TBootTask[] {
    return [ taskA, taskB, taskC ];
}

const boot = new Boot().add(coreModules());
```
This approach keeps your codebase clean and modular while dynamically adapting task inclusion.

## 3. Checking Tasks in the Process
### Verifying Task Inclusion
Use the `has` method to verify if a task is in the process:
```ts
const taskA = Boot.task(() => {});
const taskB = Boot.task(() => {});
const boot = new Boot().add(taskA);

boot.has(taskA); // True
boot.has(taskB); // False
```

You can check task inclusion using the process object within a task delegate:
```ts
const taskA = Boot.task(() => {})
const taskB = Boot.task(({ process }) => {
    if (process.has(taskA)) {
        console.log("Task A is in the process.");
    }
})
```

### Checking Task State in the Process
The `getTaskStatus` method allows you to check a task's current state within the process:
```ts
const status = boot.getTaskStatus(task);
console.log(status); // Completed, Running, etc.
```

Tasks can have the following states:
- **Unknown:** Task is created but not added to the process.
- **Idle:** Task is added to the process but not yet running.
- **Waiting:** Task is waiting for dependencies to complete.
- **Running:** Task is currently executing.
- **Completed:** Task finished successfully.
- **Fail:** Task failed.
- **Skipped:** Task was skipped because a dependency failed or was skipped.

### Retrieving Failure Reasons
If a task fails, use `getTaskFailReason` to retrieve the error. If the task succeeded, the method will return `null`:

```ts
const error: Error | null = boot.getTaskFailReason(myTask);
if (error) {
    console.log("Task failed:", error)
}
```

## 4. Process States
Retrieve the current process state through the `status` property:
```ts
const boot = new Boot();
boot.status // Current process state
```
Possible states:
- **Idle:** Ready to accept tasks.
- **Running:** Tasks are being executed.
- **Finalizing:** Final tasks are completing.
- **Completed:** Process finished successfully.
- **Fail:** Process terminated due to errors.
- **Cancelled:** Process was aborted.

## 5. Running the Process
Use `runAsync` to execute the process. This method returns a Promise:
```ts
const taskA = Boot.task(() => {});
const taskB = Boot.task(() => {});
const boot = new Boot().add([ taskA, taskB ]);

await boot.runAsync(); // Запускаем процесс и ожидаем его завершение
```

Failures in critical tasks will stop the process:
```ts
boot.runAsync()
    .catch((err) => console.error("Process failed:", err));
```

## 6. Aborting the Process
The process can be aborted by providing an `AbortSignal` in the `runAsync` options.
```ts
const abortController = new AbortController();
boot.runAsync({ abortSignal: abortController.signal })
```

The process throws an error, indicating that the process was canceled.
```ts
const abortController = new AbortController();
const processPromise = boot.runAsync({ abortSignal: abortController.signal });

abortController.abort();
await processPromise;
// Boot[ERR_PROCESS_ABORTED]:
// The boot process was aborted. Reason: AbortError
```

### Task Reaction to `AbortSignal`
Tasks receive the `AbortSignal` in their delegate, enabling them to react accordingly:
```ts
const task = Boot.task(({ abortSignal }) => {
    if (abortSignal?.aborted) {
        console.warn("Task was aborted");
        return;
    }
    console.log("Task completed!");
});
```
When the process receives an abort signal,
tasks respect the signal and handle the situation gracefully based on their logic.

[◀ Зависимости задач](./03-TASKS_DEPS.md) ● [Индекс](./README.md) ● [Наследование процессов ▶](./05-INHERITANCE.md)
