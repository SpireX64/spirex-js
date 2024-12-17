[◀ Process Tasks](./02-TASKS.md) ● [INDEX](./README.md) ● [Process ▶](./04-PROCESS.md)

# Task Dependencies

Task dependencies define the execution order, ensuring a task only runs after its dependencies have completed.
This helps to maintain a proper sequence of operations.

## 1. Defining Dependencies

To specify dependencies, pass an array of tasks as the second parameter to `Boot.task`:

```ts
const taskA = Boot.task(() => { console.log("Task A completed!") })

const taskB = Boot.task(
    () => { console.log("Task B completed!") },
    [ taskA ], // Depends on taskA
)
```

A task can have multiple dependencies:
```ts
const taskC = Boot.task(
    () => { console.log("Task B completed!") },
    [ taskA, taskB ], // Depends on taskA and taskB
)
```

### Using Options
If additional task settings are needed, dependencies can be passed through the deps field in the options object:

```ts
const taskC = Boot.task(
    () => { console.log("Task B completed!")},
    { deps: [ taskA, taskB ] }, // Depends on taskA and taskB
)
```

## 2. Dependency Types

### Strict Dependencies
By default, dependencies are strict. A task will only run if all its strict dependencies have completed successfully:

```ts
const taskA = Boot.task(() => console.log("Task A completed!"));
const taskB = Boot.task(() => console.log("Task B completed!"), { deps: [taskA] });
```

If an optional task has strict dependencies that fail, it will be skipped.

### Weak Dependencies

Weak dependencies allow tasks to execute regardless of the outcome of their dependencies (success, failure, or skip). Use the `weak: true` flag to define a weak dependency:
```ts
const optionalTask = Boot.task(() => {
    throw Error("Optional task failed!");
}, { optional: true });

const criticalTask = Boot.task(() => {}, {
    name: 'Critical',
    deps: [
        // Weak dependency on "optionalTask"
        { task: optionalTask, weak: true },
    ],
})
```

#### No Strict Dependencies on Optional Tasks
Critical tasks cannot have strict dependencies on optional tasks because optional tasks might fail or be skipped:

```ts
const optionalTask = Boot.task(() => {}, { name: "Optional", optional: true })

const criticalTask = Boot.task(() => {}, { name: 'Critical', deps: [ optionalTask ] })
// Boot[ERR_STRONG_DEPENDENCY_ON_OPTIONAL]:
// Important task "Critical" cannot have a strong dependency on optional task "Optional".
```

## 3. Accessing Task States

During execution, a task can check the state of other tasks via the `process` object.
This is useful for handling logic based on dependency success or failure:

```ts
const criticalTask = Boot.task(({ process }) => {
    // Check task state
    const optionalTaskStatus = process.getTaskStatus(optionalTask);
    
    if (optionalTaskStatus === TaskStatus.Completed) {
        // Task completed
        console.log("When optional task completed")
    } else {
        // Task failed or skipped
        console.log("When optional task failed")
    }
}, [
    { task: optionalTask, weak: true },
])
```

**Task States:**
- Unknown: Task is created but not added to the process.
- Idle: Task is added to the process but not yet running.
- Waiting: Task is waiting for dependencies to complete.
- Running: Task is currently executing.
- Completed: Task completed successfully.
- Fail: Task failed.
- Skipped: Task was skipped due to dependency issues.

[◀ Process Tasks](./02-TASKS.md) ● [INDEX](./README.md) ● [Process ▶](./04-PROCESS.md)
