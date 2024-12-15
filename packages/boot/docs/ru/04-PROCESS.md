[◀ Зависимости задач](./03-TASKS_DEPS.md) ● [Индекс](./README.md) ● [Наследование процессов ▶](./05-INHERITANCE.md)

# Создание и настройка процесса
Процесс — это механизм, управляющий выполнением задач в определённом порядке,
отслеживающий их состояния и завершающий выполнение в случае успеха, ошибки или прерывания.

## 1. Создание процесса
Процесс создаётся с помощью класса `Boot`:
```ts
import { Boot } from '@spirex/js-boot'

const process = new Boot();
```

## 2. Добавление задач в процесс
Добавление задач выполняется с помощью метода `add`. Одна задача не может быть добавлена в процесс дважды.
```ts
const taskA = Boot.task(() => console.log("Task A executed"));
const process = new Boot().add(taskA);
```

При попытке добавить новые задачи после запуска процесса, он кинет ошибку:
```ts
const myTask = Boot.task(() => {})
const boot = new Boot()
boot.runAsync()

boot.add(myTask)
// Boot[ERR_TASK_ADDITION_DENIED]:
// Tasks cannot be added after the boot process has started. Current status: Running.
```

### Добавление нескольких задач
Метод `add` возвращает ссылку на процесс, позволяя добавлять задачи цепочкой вызовов.
```ts
const taskA = Boot.task(() => {});
const taskB = Boot.task(() => {});

const process = new Boot().add(taskA).add(taskB);
```

Можно добавить сразу несколько задач, передав массив.
```ts
const process = new Boot().add([ taskA, taskB ]);
```

### Условное добавление задач
Метод `add` принимает falsy-значения (`null`, `undefined`, `false`), позволяя гибко добавлять задачи:
```ts
const DEV = process.env.NODE_ENV === 'development'

const boot = new Boot()
    .add(DEV && taskA)
    .add(taskB);
```

Это работает и с задачами в массиве:
```ts
const DEV = process.env.NODE_ENV === 'development'
const boot = new Boot().add([
    DEV && taskA,
    taskB,
]);
```

### Модульность
Вынесите задачи в отдельную константу или функцию для удобства.
Это поможет сохранять архитектуру чистой и создавать меньше зависимостей между файлами.

```ts
function coreModules(): readonly TBootTask[] {
    return [ taskA, taskB, taskC ];
}

const boot = new Boot().add(coreModules());
```
## 3. Проверка задач в процессе
### Проверка, добавлена ли задача в процесс
Метод `has` позволяет проверить, входит ли задача в процесс:
```ts
const taskA = Boot.task(() => {});
const taskB = Boot.task(() => {});
const boot = new Boot().add(taskA);

boot.has(taskA); // True
boot.has(taskB); // False
```

Через объект `process` можно узнать, добавлена ли задача из делегата задачи:
```ts
const taskA = Boot.task(() => {})
const taskB = Boot.task(({ process }) => {
    if (process.has(taskA)) {
        // Если `taskA` есть в процессе
    } else {
        // Если `taskA` не добавлен в процесс
    }
})
```

### Проверка состояния задачи
Метод getTaskStatus позволяет получить состояние задачи:
```ts
const status = boot.getTaskStatus(task);
console.log(status); // Completed, Running, etc.
```

Задачи могут иметь следующие состояния:
- **Unknown**: Задача не добавлена в процесс.
- **Idle**: Задача добавлена в процесс, но не выполняется.
- **Waiting**: Задача ожидает выполнения зависимостей;
- **Running**: Задача выполняется;
- **Completed**: Задача завершилась успешно;
- **Fail**: Задача завершилась с ошибкой;
- **Skipped**: Задача пропущена из-за ошибки в зависимости.

### Получение причины ошибки
Если задача завершилась с ошибкой, можно получить объект ошибки с помощью метода `getTaskFailReason`.
Когда ошибки нет, то метод вернет `null`.
```ts
const error: Error | null = boot.getTaskFailReason(myTask);
if (error) {
    console.log("Task failed:", error)
}
```

## 4. Получение состояния процесса

У процесса есть состояние, которое может меняться во время выполнения.
Состояния процесса можно узнать через свойство `status`:
```ts
const boot = new Boot();

boot.status // Состояние процесса
```
Процесс может иметь следующие состояния:
- **Idle** - Процесс принимает задачи и готовится к запуску
- **Running** - Процесс выполняется
- **Finalizing** - Процесс выполняет последние задачи и готовится к завершению
- **Completed** - Процесс успешно выполнен
- **Fail** - Процесс завершился с ошибкой
- **Cancelled** - Процесс был прерван

## 5. Запуск процесса
Метод `runAsync` запускает процесс и ожидает выполнения всех задач:
```ts
const taskA = Boot.task(() => {});
const taskB = Boot.task(() => {});
const boot = new Boot().add([ taskA, taskB ]);

await boot.runAsync(); // Запускаем процесс и ожидаем его завершение
```

Если обязательная задача завершится с ошибкой, выполнение процесса завершится и метод `runAsync` завершится ошибкой.
```ts
boot.runAsync()
    .catch((err) => console.error("Process failed:", err));
```

## 6. Прерывание процесса
Процесс поддерживает прерывание с помощью AbortSignal.
Для этого нужно передать ссылку на AbortSignal в опции метода `runAsync`:
```ts
const abortController = new AbortController();
boot.runAsync({ abortSignal: abortController.signal })
```

Когда процесс прерывается, то он завершается и кидает ошибку.
```ts
const abortController = new AbortController();
const processPromise = boot.runAsync({ abortSignal: abortController.signal });

abortController.abort();
await processPromise;
// Boot[ERR_PROCESS_ABORTED]:
// The boot process was aborted. Reason: AbortError
```

### Реакция задач на `AbortSignal`
Задачи могут реагировать на `AbortSignal`. Его можно получить из поля объекта `abortSignal`, который процесс передает задаче.
Если при запуске процесса не был передан `abortSignal`, то он будет `undefined`.

```ts
const task = Boot.task(({ abortSignal }) => {
    if (abortSignal?.aborted) {
        console.warn("Task was aborted");
        return;
    }
    console.log("Task completed!");
});
```

[◀ Зависимости задач](./03-TASKS_DEPS.md) ● [Индекс](./README.md) ● [Наследование процессов ▶](./05-INHERITANCE.md)
