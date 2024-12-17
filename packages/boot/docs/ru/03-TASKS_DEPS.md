[◀ Задачи процесса](./02-TASKS.md) ● [ИНДЕКС](./README.md) ● [Создание и настройка процесса ▶](./04-PROCESS.md)

# Зависимости задач

Зависимости определяют порядок выполнения задач.
Задача начинает выполнение только после завершения всех задач, от которых она зависит.
Это помогает настроить правильную последовательность операций.

## 1. Определение зависимостей
Чтобы задать зависимости, передайте массив задач как второй параметр фабрики `Boot.task`:
```ts
const taskA = Boot.task(() => { console.log("Task A completed!") })

const taskB = Boot.task(
    () => { console.log("Task B completed!") },
    [ taskA ], // Зависит от taskA
)
```

Задача может иметь несколько зависимостей:
```ts
const taskC = Boot.task(
    () => { console.log("Task B completed!")},
    [ taskA, taskB ], // Зависит от taskA и taskB
)
```

### Передача зависимостей через опции
Если необходимо указать дополнительные параметры задачи, зависимости можно передать через поле `deps` объекта настроек.

```ts
const taskC = Boot.task(
    () => { console.log("Task B completed!")},
    { deps: [ taskA, taskB ] }, // Зависит от taskA и taskB
)
```

## 2. Виды зависимостей

У задачи есть два вида зависимостей: строгая и слабая.

### Строгая зависимость
По умолчанию зависимости являются **строгими**. Задача выполнится, только если все её строгие зависимости завершились успешно.

```ts
const taskA = Boot.task(() => console.log("Task A completed!"));
const taskB = Boot.task(() => console.log("Task B completed!"), { deps: [taskA] });
```

#### Пропуск опциональных задач
Если у опциональной задачи есть строгие зависимости, которые завершились с ошибкой, такая задача будет пропущена.

### Слабая зависимость

Слабая зависимость позволяет задаче выполняться независимо от результата её зависимостей (успех, ошибка, пропуск).
Чтобы задать слабую зависимость, установите флаг `weak: true`:
```ts
const optionalTask = Boot.task(() => {
    throw Error("Optional task failed!");
}, { optional: true });

const criticalTask = Boot.task(() => {}, {
    name: 'Critical',
    deps: [
        // Слабая зависимость от "optionalTask"
        { task: optionalTask, weak: true },
    ],
})
```

#### Запрет строгой зависимости от опциональных задач
Важная задача не может строго зависеть от опциональной, так как опциональная задача может завершиться с ошибкой или быть пропущенной.
```ts
const optionalTask = Boot.task(() => {}, { name: "Optional", optional: true })

const criticalTask = Boot.task(() => {}, { name: 'Critical', deps: [ optionalTask ] })
// Boot[ERR_STRONG_DEPENDENCY_ON_OPTIONAL]:
// Important task "Critical" cannot have a strong dependency on optional task "Optional".
```

## 3. Доступ к состоянию задач

Во время выполнения задача может проверять состояние других задач через объект `process`.
Это полезно для управления логикой в зависимости от успеха или провала зависимостей:

```ts
const criticalTask = Boot.task(({ process }) => {
    // Проверяем состояние задачи
    const optionalTaskStatus = process.getTaskStatus(optionalTask);
    
    if (optionalTaskStatus === TaskStatus.Completed) {
        // Задача успешно завершилась
        console.log("When optional task completed")
    } else {
        // Задача завершилась с ошибкой или пропущена
        console.log("When optional task failed")
    }
}, [
    { task: optionalTask, weak: true },
])
```

Задачи могут иметь следующие состояния:
- **Unknown**: Задача создана, но не добавлена в процесс.
- **Idle**: Задача добавлена в процесс, но ещё не выполняется.
- **Waiting**: Задача ожидает выполнения зависимостей.
- **Running**: Задача находится в процессе выполнения.
- **Completed**: Задача успешно завершилась.
- **Fail**: Задача завершилась с ошибкой.
- **Skipped**: Задача была пропущена, так как одна из её зависимостей завершилась с ошибкой или была пропущена.

[◀ Задачи процесса](./02-TASKS.md) ● [ИНДЕКС](./README.md) ● [Создание и настройка процесса ▶](./04-PROCESS.md)
