[◀ Установка библиотеки в проект](./01-INSTALL.md) ● [Индекс](./README.md) ● [Зависимости задач ▶](./03-TASKS_DEPS.md)

# Задачи процесса

Задача - этап процесса инициализации, который может быть:

- Синхронным - выполняются мгновенно без ожиданий.
- Асинхронным - требует ожидания завершения, например при работе с API.

Задачи добавляются в процесс и выполняются в определенном порядке, который можно настроить через зависимости и приоритеты.

## 1. Создание задачи
Для создания задачи используется фабрика `Boot.task`. Она принимает:

- Функцию-делегат - Логика задачи, которая будет выполнена в рамках задачи.
- Опции (необязательно) - Дополнительная конфигурации задачи.

Пример простой задачи:
```ts
import { Boot } from '@spirex/js-boot'

const task = Boot.task(() => {
    console.log("Hello from task");
})
```

Асинхронная задача позволяет обрабатывать операции, требующие ожидания, например запросы на сервер:

```ts
const asyncTask = Boot.task(async () => {
    await fetch("https:/example.com");
    console.log("Hello from async task");
});
```
Созданная задача неизменяемая. Это необходимо для избежания ошибок при выполнении процесса.

## 2. Именование задач
Для простоты процесса отладки задач, можно задать имя в опциях фабрики.
Имя задачи отображается в ошибках процесса, а так же его видно при работе с дебаггером.
```ts
const myTask = Boot.task(() => {
    console.log("Hello from MyTask")
}, { name: 'MyTask' })
```

Если имя не указано, используется имя переданной функции:
```ts
function printHello() { console.log("Hello!") }
const myTask = Boot.task(printHello);

console.log(myTask.name) // Выводит: "printHello"
```

## 3. Важные и опциональные задачи
Задачи могут быть двух видов: важные и опциональные.  По умолчанию все задачи считаются важными.

Ошибка в важной задачи приводит к завершению процесса.
```ts
const badTask = Boot.task(() => { throw Error("Critical error!") }, { name: "badTask" });
const boot = new Boot().add(badTask);
boot.runAsync()
    .catch(err => console.error(err))
    // Error: Boot[ERR_IMPORTANT_TASK_FAILED]:
    // Important task "banTask" failed during execution. Reason: Critical error!
```

Чтобы задача не останавливала весь процесс при ошибке, ее можно сделать опциональной.
Для создания опциональной задачи, нужно явно указать фабрике, что это опциональная задача:

```ts
const myOptionalTask = Boot.task(
    () => { throw Error("Failure!") },
    { optional: true }, // Это опциональная задача
)
```

## 4. Приоритет задач
Задачам можно указать приоритет выполнения для задач, при одинаковых условиях (например, все зависимости выполнились).

Значение приоритета - любое число (по умолчанию `0`). Задачи с высоким приоритетом выполняются раньше.
```ts
const lightTask = Boot.task(() => { console.log("Light task completed!") }, { name: "light", priority: 10 })

const toughTask = Boot.task(async () => {
    // Симуляция сложной операции
    await Promise(resolve => setTimeout(resolve, 500));
    console.log("Tough task completed!")
}, { name: "tough" })
```
Чем выше значение приоритета, тем раньше задача будет запущена. По умолчанию у всех задач приоритет 0 (ноль).

```ts
const boot = new Boot().add([ toughTask, lightTask ])
await boot.runAsync();
// Light task completed!
// Tough task completed!
```

## 5. Добавление в процесс и запуск
Для выполнения задач нужно добавить их в процесс с помощью метода `add`:
```ts
const boot = new Boot();
boot.add([task, asyncTask, myOptionalTask]);
```

После добавления задач можно запустить процесс с помощью метода `runAsync`.
Он возвращает `Promise` для ожидания завершения всех задач.
```ts
boot.runAsync()
    .then(() => console.log("Boot process completed successfully"))
    .catch(err => console.error("Boot process failed:", err));
```

## 6. Запуск задач вне процесса
Для тестирования, можно запустить задачу без процесса, вызвав ее делегат:
```ts
const myTask = Boot.task(() => { console.log("Hello!") });

myTask.delegate({}); // Запуск задачи вне процесса
```

[◀ Установка библиотеки в проект](./01-INSTALL.md) ● [Индекс](./README.md) ● [Зависимости задач ▶](./03-TASKS_DEPS.md)
