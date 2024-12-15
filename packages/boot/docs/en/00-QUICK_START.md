[INDEX](./README.md) ● [Installing library ▶](./01-INSTALL.md)

# Quick Start
This guide will help you quickly integrate and start using the `@spirex/js-boot` library in your projects.

## 1. Installing
Install @spirex/js-boot using any package manager:
```shell
# Using npm
> npm i @spirex/js-boot

# Using yarn
> yarn add @spirex/js-boot
```

## 2. Import the `Boot` Class
All operations are handled by the Boot class. Start by importing it:
```ts
import { Boot } from "@spirex/js-boot";
```

## 3. Define Tasks
Tasks are the building blocks of the boot process. Use the `Boot.task` factory to create them.

### Synchronous Task
Executes immediately without waiting for any asynchronous operations:
```ts
const taskA = Boot.task(() => {
    console.log("Task A completed!");
});
```
### Asynchronous Task
Waits for the completion of asynchronous operations:
```ts
const taskB = Boot.task(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Async task B completed!");
});
```

### Optional Task
Optional tasks do not interrupt the boot process if they fail:
```ts
const optionalTaskC = Boot.task(() => {
    throw Error("Optional task failed");
}, { optional: true })
```

### Task with Dependencies
Tasks can depend on others and will only execute after their dependencies are completed:
```ts
const taskD = Boot.task(() => {
    console.log("Task D depends on tasks A and B")
}, { deps: [ taskA, taskB ] });
```

## 4. Create a Boot Process and Add Tasks
Create a process and add tasks to it:
```ts
const boot = new Boot();
boot.add([ taskA, taskB, optionalTaskC, taskD]);
```

## 5. Run the Boot Process
Start the process using `runAsync`. The method is asynchronous, so you should await its completion:
```ts
boot.runAsync()
    .then(() => console.log("Boot process completed successfully!"))
    .catch(err => console.error("Boot process failed:", err))
```

## Full Example
```ts
import { Boot } from "@spirex/js-boot";

// Define tasks
const taskA = Boot.task(() => {
    console.log("Task A completed!");
});

const taskB = Boot.task(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Async task B completed!");
});

const optionalTaskC = Boot.task(() => {
    throw Error("Optional task failed");
}, { optional: true });

const taskD = Boot.task(() => {
    console.log("Task D depends on tasks A and B");
}, { deps: [taskA, taskB] });

// Create a boot process and add tasks
const boot = new Boot().add([taskA, taskB, optionalTaskC, taskD]);

// Run the process
boot.runAsync()
    .then(() => console.log("Boot process completed successfully!"))
    .catch((err) => console.error("Boot process failed:", err));

```

[INDEX](./README.md) ● [Installing library ▶](./01-INSTALL.md)
