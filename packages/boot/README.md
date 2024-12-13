# SpireX's JS Application Bootstrapper
[![GitHub License](https://img.shields.io/github/license/spirex64/spirex-js?style=for-the-badge)](https://github.com/SpireX64/spirex-js/blob/main/packages/boot/LICENSE)
[![npm version](https://img.shields.io/npm/v/@spirex/js-boot.svg?style=for-the-badge)](https://www.npmjs.com/package/@spirex/js-boot)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

[**CHANGE LOG**](https://github.com/SpireX64/spirex-js/blob/main/packages/boot/CHANGELOG.md) ●
[**DOCUMENTATION**](https://github.com/SpireX64/spirex-js/blob/main/packages/boot/docs/en/README.md) ●
[**REFERENCE**](https://github.com/SpireX64/spirex-js/blob/main/packages/boot/docs/en/REFERENCE.md)

## Description

This small library helps solve the problem of
initializing JavaScript applications.
It can be used in any JS project.

The library provides an initializer class that allows you
to break the initialization process into multiple stages
and execute them depending on their interdependencies with other stages.

If any stage of the initialization is paused due to an asynchronous task,
the initializer does not wait for its completion but proceeds to the next stage,
provided that the tasks related to this stage have been completed.


## Installing

You can get the latest release and the type definitions
using your preferred package manager:
```shell
$ npm install @spirex/js-boot
# OR
$ yarn add @spirex/js-boot
# OR
$ bun i @spirex/js-boot
```


## Usage
### 1. Import the initializer class
Almost all operations are performed using the AppBoot class.
Therefore, it needs to be imported into all files
where initialization tasks are defined.

```ts
import { Boot } from "@spirex/js-boot";
```


### 2. Create initialization tasks
The `Boot.task()` method is used to create initialization tasks.
It accepts a function containing the executable code for the task.
The function can be synchronous or asynchronous.
The task name is optional, but helps with logging tasks to the console.

After the function, you can pass an array of dependencies.
This ensures that the task will start execution
as soon as all dependencies are completed.

```ts
const taskA = Boot.task(async () => {
    console.log('Run task A');
    await someAsyncFunction();
});

const taskB = Boot.task(() => {
    console.log('Run task B');
}, [taskA]); // Depends on 'A'
```


### 3. Create the initializer and add tasks
Tasks are added to the created initializer using the `add(..)` method.
You can add tasks one by one or multiple at once as an array.

```ts
const boot = new Boot()
    .add([taskA, taskB]);
```


### 4. Run the Initialization
Once the initializer is created and all necessary tasks
for the application are added, you can start the initialization process.
The `runAsync()` method will return a Promise
that resolves when all tasks are completed.

```ts
await boot.runAsync();
console.log('Done!');
```

By default, all tasks are mandatory. Therefore, if any task fails,
the initialization process will be aborted, and an exception will be thrown.
