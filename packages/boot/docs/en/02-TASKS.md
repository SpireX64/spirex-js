[◀ Installing library](./01-INSTALL.md) ● [INDEX](./README.md) ● [Task dependencies ▶](./03-TASKS_DEPS.md)

# Process Tasks

A task is a step in the initialization process. It can be:
- **Synchronous:** Executes immediately without waiting.
- **Asynchronous:** Requires waiting for completion, like working with an API.

Tasks are added to the process and executed in a specific order, which can be configured through dependencies and priorities.

Задачи добавляются в процесс и выполняются в определенном порядке, который можно настроить через зависимости и приоритеты.

## 1. Creating a Task
Task creation uses the `Boot.task` factory, which accepts:
- **Delegate function**: The logic of the task that will be executed.
- **Options (optional)**: Additional configuration for the task.

Example of a simple task:
```ts
import { Boot } from '@spirex/js-boot'

const task = Boot.task(() => {
    console.log("Hello from task");
})
```

Async task example:
```ts
const asyncTask = Boot.task(async () => {
    await fetch("https:/example.com");
    console.log("Hello from async task");
});
```
The created task is immutable, which ensures safe execution in the process.

## 2. Naming Tasks
To make debugging easier, you can provide a name for the task using the options in the factory.
The task's name will be shown in process errors and visible when using the debugger.
```ts
const myTask = Boot.task(() => {
    console.log("Hello from MyTask")
}, { name: 'MyTask' })
```

If no name is provided, the function's name will be used:
```ts
function printHello() { console.log("Hello!") }
const myTask = Boot.task(printHello);

console.log(myTask.name) // Outputs: "printHello"
```

## 3. Important and Optional Tasks
Tasks can be either **important** (default) or **optional**. If an important task fails, the entire process will stop.

Example of a failing important task:
```ts
const badTask = Boot.task(() => { throw Error("Critical error!") }, { name: "badTask" });
const boot = new Boot().add(badTask);
boot.runAsync()
    .catch(err => console.error(err))
    // Error: Boot[ERR_IMPORTANT_TASK_FAILED]:
    // Important task "banTask" failed during execution. Reason: Critical error!
```

To prevent the task from stopping the entire process on failure, mark it as **optional**:
```ts
const myOptionalTask = Boot.task(
    () => { throw Error("Failure!") },
    { optional: true }, // It's optional task
)
```

## 4. Tasks Priority
Tasks can be given a **priority**, determining their execution order when other conditions (such as dependencies) are met.

Priority is a numeric value (default: 0), with higher values meaning higher priority.
```ts
const lightTask = Boot.task(() => { console.log("Light task completed!") }, { name: "light", priority: 10 })

const toughTask = Boot.task(async () => {
    // Симуляция сложной операции
    await Promise(resolve => setTimeout(resolve, 500));
    console.log("Tough task completed!")
}, { name: "tough" })
```
Tasks with higher priority (like `lightTask`) will be executed first.

## 5. Adding Tasks to the Process and Running It
Tasks are added to the process using the `add` method:
```ts
const boot = new Boot();
boot.add([task, asyncTask, myOptionalTask]);
```

Once the tasks are added, run the process with `runAsync`:
```ts
boot.runAsync()
    .then(() => console.log("Boot process completed successfully"))
    .catch(err => console.error("Boot process failed:", err));
```

## 6. Running Tasks Outside the Process
For **testing** purposes, tasks can be executed independently by calling their delegate:
```ts
const myTask = Boot.task(() => { console.log("Hello!") });

myTask.delegate({}); // Running the task outside the process
```

[◀ Installing library](./01-INSTALL.md) ● [INDEX](./README.md) ● [Task dependencies ▶](./03-TASKS_DEPS.md)
