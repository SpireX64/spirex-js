[◀ Создание и настройка процесса](./04-PROCESS.md) ● [Индекс](./README.md)

# Наследование процессов
Наследование позволяет создавать новые процессы на основе существующих.
Наследуемый процесс получает все задачи из родительского процесса, что упрощает создание сложных цепочек.

## 1. Создание наследуемого процесса
Чтобы процесс наследовал другой процесс, передайте родительский процесс в конструктор:

```ts
const taskA = Boot.task(() => console.log("Task A completed!"));
const processA = new Boot().add(taskA);

const taskB = Boot.task(() => console.log("Task B completed!"), [taskA]);
const processB = new Boot(processA).add(taskB);

await processB.runAsync();
// Task A completed!
// Task B completed!
```

## 2. Множественное наследование
Процесс может наследовать задачи сразу от нескольких родительских процессов:
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

## 3. Проверка наследования

Проверить, наследует ли процесс другой процесс, можно с помощью метода `isChildOf`:
```ts
processC.isChildOf(processA) // True
processC.isChildOf(processD) // False
```

## 4. Независимое выполнение процессов
По умолчанию процессы выполняются независимо:
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
Задача `taskA` запускалась во время выполнения обоих процессов.

## 5. Синхронизация процессов
Для синхронизации состояний задач между процессами используйте флаг `syncWithParents`:
```ts
await processA.runAsync();
// Task A completed!
await processB.runAsync({ syncWithParents: true });
// Task B completed!
```
Задачи, завершённые в родительском процессе, не будут повторно выполняться в дочернем процессе.

## 6. Перезапуск родительских задач
Если нужно перезапустить задачи, пропущенные или завершённые с ошибкой в родительском процессе,
используйте флаг `resetFailedTasks`:
```ts
await processB.runAsync({
    syncWithParents: true, 
    resetFailedTasks: true,
});
```

[◀ Создание и настройка процесса](./04-PROCESS.md) ● [Индекс](./README.md)
