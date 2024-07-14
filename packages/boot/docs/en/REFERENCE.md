# Library reference
- [AppBoot](#appboot)
  - [Static methods](#static-methods---appboot--)
  - [Instance methods](#instance-methods---appboot--)
- [Types](#types)
- [Enums](#enums)

## AppBoot
### Static methods <!--AppBoot-->

- [task(func, deps, optional)](#taskfunc-deps-optional---appboot--)
- [task(name, func, deps, optional)](#taskname-func-deps-optional---appboot--)

#### task(func, deps, optional) <!--AppBoot-->
Factory method of boot task.

`public static task(func, deps, optional): IBootTask`

| Parameter | Description                                                      | Type                                                                                                              |
|-----------|------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| func      | Task function                                                    | [TBootTaskFunction](#tboottaskfunction---type--)                                                                  |
| deps      | List of dependencies                                             | ([TBootTaskDependency](#tboottaskdependency---type--) \| [IBootTask](#iboottask---type--))[] \| null \| undefined |
| optional  | Does not terminate the initialization process in case of failure | boolean?                                                                                                          |

Returns: [IBootTask](#iboottask---type--)

Example:
```ts
// Important task, no dependencies, throws on fail
const taskA = AppBoot.task(() => {
    // Do something..
});

// Optional task, runs after 'taskA'
const taskB = AppBoot.task(() => {}, [ taskA ], true);

// Optional task, runs after 'taskB', skip if 'taskB' fail
const taskC = AppBoot.task(() => {}, [{ task: taskB, optional: true }], true);

// Important task with async function
const taskD = AppBoot.task(async () => {
    await someAsyncFunc();
});
```

#### task(name, func, deps, optional) <!--AppBoot-->
Factory method of boot task with explicit name.

`public static task(name func, deps, optional): IBootTask`

| Parameter | Description                                                      | Type                                                                                                              |
|-----------|------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| name      | Task name                                                        | string                                                                                                            |
| func      | Task function                                                    | [TBootTaskFunction](#tboottaskfunction---type--)                                                                  |
| deps      | List of dependencies                                             | ([TBootTaskDependency](#tboottaskdependency---type--) \| [IBootTask](#iboottask---type--))[] \| null \| undefined |
| optional  | Does not terminate the initialization process in case of failure | boolean?                                                                                                          |

Returns: [IBootTask](#iboottask---type--)

Example:
```ts
const task = AppBoot.task('MyTask', () => {
    // do_smth
})
```

### Instance methods <!--AppBoot-->

- [add(task)](#addtask---appboot--)
- [add(tasks)](#addtasks---appboot--)
- [has(task)](#hastask---appboot--)
- [isTaskReachable(task)](#istaskreachabletask---appboot--)
- [addEventListener('process', listener)](#addeventlistenerprocess-listener---appboot--)
- [addEventListener('finish', listener)](#addeventlistenerfinish-listener---appboot--)
- [removeEventListener('process', listener)](#removeeventlistenerprocess-listener---appboot--)
- [removeEventListener('finish', listener)](#removeeventlistenerfinish-listener---appboot--)
- [runAsync()](#runasync---appboot--)
- [dispose()](#dispose---appboot--)

#### add(task) <!--AppBoot-->
Adds task to boot process

`public add(task): AppBoot`

| Parameter | Description           | Type                                                           |
|-----------|-----------------------|----------------------------------------------------------------|
| task      | Task reference to add | [IBootTask](#iboottask---type--) \| false \| null \| undefined |

Returns: [AppBoot](#appboot) (self)

Throws:
- when process already started

Example:
```ts
const taskA = AppBoot.task(() => {});
const taskB = AppBoot.task(() => {});
const taskC = AppBoot.task(() => {});

const boot = new AppBoot()
    .add(taskA)
    .add(taskB)

// Conditional adding
const isDev = process.env.NODE_ENV === 'development'
if (isDev) boot.add(taskC)
// or
boot.add(isDev && taskC) // false - don't add
// or
let taskD: IBootTask | undefined
if (isDev) taskD = AppBoot.task(() => {})
boot.add(taskD) // null | undefined - don't add
```

#### add(tasks) <!--AppBoot-->
Adds list of tasks to boot process

`public add(tasks): IBootTask`

| Parameter | Description          | Type                               |
|-----------|----------------------|------------------------------------|
| tasks     | List of tasks to add | [IBootTask](#iboottask---type--)[] |

Returns: [AppBoot](#appboot) (self)

Throws:
- when process already started

Example:
```ts
const taskA = AppBoot.task(() => {});
const taskB = AppBoot.task(() => {});

// Adds tasks A and B to process
const boot = new AppBoot().add([ taskA, taskB ]);
```

#### has(task) <!--AppBoot-->
Checks if a task has been added to the process

`public has(task: IBootTask): boolean`

| Parameter | Description   | Type                             |
|-----------|---------------|----------------------------------|
| task      | Task to check | [IBootTask](#iboottask---type--) |

Returns: `true`, when task was added to process

Example:
```ts
const taskA = AppBoot.task(() => {});
const taskB = AppBoot.task(() => {});

const boot = new AppBoot().add(taskA);

boot.has(taskA) // true
boot.has(taskB) // false
```

#### isTaskReachable(task) <!--AppBoot-->
Checks if all task dependencies have been added to the process.

`public isTaskReachable(task): boolean`

| Parameter | Description   | Type                             |
|-----------|---------------|----------------------------------|
| task      | Task to check | [IBootTask](#iboottask---type--) |

Returns: `true`, when all dependencies have been added.

Example:
```ts
const taskA = AppBoot.task(() => {})
const taskB = AppBoot.task(() => {}, [ taskA ])
const taskC = AppBoot.task(() => {})
const taskD = AppBoot.task(() => {}, [ taskB, taskC ])

const boot = new AppBoot().add([ taskA, taskB, taskD ]) // C task not added

boot.isTaskReachable(taskB) // true: A has been added
boot.isTaskReachable(taskD) // false: C task is missing in process
```

#### addEventListener('process', listener) <!--AppBoot-->
Add a process event listener

`public addEventListener(type, listener): AppBoot`

| Parameter | Description       | Type                                                     |
|-----------|-------------------|----------------------------------------------------------|
| type      | Event type        | 'process'                                                |
| listener  | Function listener | [TProcessEventListener](#tprocesseventlistener---type--) |

Returns: [AppBoot](#appboot) (self)

#### addEventListener('finish', listener) <!--AppBoot-->
Add a finish event listener

`public addEventListener(type, listener): AppBoot`

| Parameter | Description       | Type                                                   |
|-----------|-------------------|--------------------------------------------------------|
| type      | Event type        | 'finish'                                               |
| listener  | Function listener | [TFinishEventListener](#tfinisheventlistener---type--) |

Returns: [AppBoot](#appboot) (self)

#### removeEventListener('process', listener) <!--AppBoot-->
Remove a process event listener

`public removeEventListener(type, listener): AppBoot`

| Parameter | Description       | Type                                                     |
|-----------|-------------------|----------------------------------------------------------|
| type      | Event type        | 'process'                                                |
| listener  | Function listener | [TProcessEventListener](#tprocesseventlistener---type--) |

Returns: [AppBoot](#appboot) (self)

#### removeEventListener('finish', listener) <!--AppBoot-->
Remove a finish event listener

`public removeEventListener(type, listener): AppBoot`

| Parameter | Description       | Type                                                   |
|-----------|-------------------|--------------------------------------------------------|
| type      | Event type        | 'finish'                                               |
| listener  | Function listener | [TFinishEventListener](#tfinisheventlistener---type--) |

Returns: [AppBoot](#appboot) (self)


#### runAsync() <!--AppBoot-->
Starts the initialization process

`public async runAsync(): Promise<TAppBootResult>`

Returns: [TAppBootResult](#tappbootresult---type--)

Throws:
- when trying to start a process when it is already running
- when one of the important tasks ends with an error
- if not possible to construct the path to perform important task (unreachable)

#### dispose() <!--AppBoot-->
Cleans up resources used by a process.
Use this method after the process has completed to reduce the application's memory consumption.

`public dispose(): void`

Throws:
- when trying to free resources while it's running

Example:
```ts
const taskA = AppBoot.task(() => {});
const taskB = AppBoot.task(() => {});

const boot = new AppBoot()
        .add([ taskA, taskB ]);

await boot.runAsync();

// Cleans up AppBoot's resources
boot.dispose();

```

## Types
- [TBootTaskFunctionSync](#tboottaskfunctionsync---type--)
- [TBootTaskFunctionAsync](#tboottaskfunctionasync---type--)
- [TBootTaskFunction](#tboottaskfunction---type--)
- [IBootTask](#iboottask---type--)
- [TBootTaskDependency](#tboottaskdependency---type--)

### TBootTaskFunctionSync <!--Type-->
Asynchronous boot task's function

`() => void`

### TBootTaskFunctionAsync <!--Type-->
Synchronous boot task's function

`() => Promise<void>`

### TBootTaskFunction <!--Type-->
Boot task's function

[TBootTaskFunctionSync](#tboottaskfunctionsync---type--) |
[TBootTaskFunctionAsync](#tboottaskfunctionasync---type--)

### IBootTask <!--Type-->
Boot task definition type

| Field     | Description                                                      | Type                                                    |
|-----------|------------------------------------------------------------------|---------------------------------------------------------|
| name      | Task name                                                        | string                                                  |
| optional  | Does not terminate the initialization process in case of failure | boolean?                                                |
| dependsOn | Tasks that must be completed before this task runs               | [TBootTaskDependency](#tboottaskdependency---type--)[]? |
| run       | Task function                                                    | [TBootTaskFunction](#tboottaskfunction---type--)        |

### TBootTaskDependency <!--Type-->
Boot task's dependency

| Field    | Description                         | Type                             |
|----------|-------------------------------------|----------------------------------|
| task     | Task reference                      | [IBootTask](#iboottask---type--) |
| optional | Completion the task is not required | boolean?                         |

### TAppBootResult <!--Type-->
Boot process result

| Field       | Description                                                 | Type                               |
|-------------|-------------------------------------------------------------|------------------------------------|
| success     | List of successfully completed tasks                        | [IBootTask](#iboottask---type--)[] |
| failure     | List of completed tasks with an error                       | [IBootTask](#iboottask---type--)[] |
| skipped     | List of skipped tasks                                       | [IBootTask](#iboottask---type--)[] |
| unreachable | List of tasks that were not included in the execution graph | [IBootTask](#iboottask---type--)[] |


### TProcessEventData <!--Type-->
Data of process event

| Field      | Description                       | Type                                                                                 |
|------------|-----------------------------------|--------------------------------------------------------------------------------------|
| type       | Event type                        | 'process'                                                                            |
| task       | The task that triggered the event | [IBootTask](#iboottask---type--)                                                     |
| completed  | Count of completed tasks          | number                                                                               |
| total      | Count of total tasks              | number                                                                               |
| getStateOf | Task's state provider             | (task: [IBootTask](#iboottask---type--)) => [BootTaskState](#boottaskstate---enum--) |


### TProcessEventListener <!--Type-->
Process event listener function

(data: [TProcessEventData](#tprocesseventdata---type--)): void

### TFinishEventData <!--Type-->
Data of finish event

| Field  | Description    | Type                                       |
|--------|----------------|--------------------------------------------|
| type   | Event type     | 'finish'                                   |
| result | Process result | [TAppBootResult](#tappbootresult---type--) |


### TFinishEventListener <!--Type-->
Process event listener function

(data: [TFinishEventData](#tfinisheventdata---type--)): void

## Enums

### BootTaskState <!--Enum-->

| Value   | Description                             |
|---------|-----------------------------------------|
| Unknown | The task is not controlled by a process |
| Idle    | Task in queue to be executed            |
| Running | Task in progress                        |
| Success | Task completed successfully             |
| Failure | Task completed with error               |
| Skipped | Task was skipped                        |
