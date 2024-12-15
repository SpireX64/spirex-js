[Индекс](./README.md) ● [01 - Установка библиотеки в проект ▶](./01-INSTALL.md)

# Быстрый старт
Этот небольшой гайд поможет быстро подключить и начать использовать библиотеку `@spirex/js-boot` в свои проекты.

## 1. Установка библиотеки
Установить библиотеку `@spirex/js-boot` можно с помощью любого менеджера пакетов. Например, с помощью NPM:
```shell
> npm i @spirex/js-boot
```
или с помощью Yarn:
```shell
> yarn add @spirex/js-boot
```

## 2. Импорт класса`Boot`
Все операции в библиотеке выполняются с помощью класса `Boot`, поэтому начнем с его импортирования:
```ts
import { Boot } from "@spirex/js-boot";
```

## 3. Определение задач
Задачи определяют этапы выполнения процесса. Задачи создаются с помощью фабрики `Boot.task`.

### Синхронная задача
Задача выполняется сразу, без ожидания асинхронных операций.
```ts
const taskA = Boot.task(() => {
    console.log("Task A completed!");
});
```
### Асинхронная задача
Задача, которая может ожидать завершения других асинхронных операций.
```ts

// Создание асинхронной задачи
const taskB = Boot.task(async () => {
   // Симуляция асинхронной операции
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log("Async task B completed!");
});
```

### Опциональная задача
Задачи могут быть важными или опциональными. Опциональные задачи не прерывают весь процесс в случае ошибки.
```ts
const optionalTaskC = Boot.task(() => {
    throw Error("Optional task failed");
}, { optional: true })
```

### Задача с зависимостями
Вы можете указать зависимости, чтобы задача начала выполнение только после их завершения:
```ts
const taskD = Boot.task(() => {
    console.log("Task D depends on tasks A and B")
}, { deps: [ taskA, taskB ] });
```

## 4. Создание процесса и добавление задач
Создайте процесс с помощью класса `Boot` и добавьте в него задачи:
```ts
const boot = new Boot();
boot.add([ taskA, taskB, optionalTaskC, taskD]);
```

## 5. Запуск процесса.
Процесс запускается с помощью метода `runAsync`. Он выполняется асинхронно, поэтому требует ожидание.
```ts
boot.runAsync()
    .then(() => console.log("Boot process completed successfully!"))
    .catch(err => console.error("Boot process failed:", err))
```

## Полный пример
```ts
import { Boot } from "@spirex/js-boot";

// Определение задач
const taskA = Boot.task(() => { 
    console.log("Task A completed!")
});

const taskB = Boot.task(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Async task B completed!");
});

const optionalTaskC = Boot.task(() => {
    throw Error("Optional task failed");
}, { optional: true })

const taskD = Boot.task(() => {
    console.log("Task D depends on tasks A and B")
}, [ taskA, taskB ]);

// Создание процесса
const boot = new Boot().add([ taskA, taskB, optionalTaskC, taskD ])

// Запуск процесса
boot.runAsync()
    .then(() => console.log("Boot process completed successfully!"))
    .catch(err => console.error("Boot process failed:", err))
```

[Индекс](./README.md) ● [01 - Установка библиотеки в проект ▶](./01-INSTALL.md)
