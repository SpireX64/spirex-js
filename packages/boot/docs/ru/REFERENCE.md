# Справочник по библиотеке
- [AppBoot](#appboot)
    - [Статические методы](#статические-методы---appboot--)
    - [Методы экземпляра](#методы-экземпляра---appboot--)
- [Типы](#типы)
- [Перечисления](#перечисления)

## AppBoot
### Статические методы <!--AppBoot-->

- [task(func, deps, optional)](#taskfunc-deps-optional---appboot--)
- [task(name, func, deps, optional)](#taskname-func-deps-optional---appboot--)

#### task(func, deps, optional) <!--AppBoot-->
Фабричный метод для создания задачи процесса инициализации.

`public static task(func, deps, optional): IBootTask`

| Параметр | Описание                                            | Тип                                                                                                               |
|----------|-----------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| func     | Функция задачи                                      | [TBootTaskFunction](#tboottaskfunction---type--)                                                                  |
| deps     | Список зависимостей                                 | ([TBootTaskDependency](#tboottaskdependency---type--) \| [IBootTask](#iboottask---type--))[] \| null \| undefined |
| optional | Не прерывать процесс инициализации в случае падения | boolean?                                                                                                          |

Возвращает: [IBootTask](#iboottask---type--)

Пример:
```ts
// Важная задача, без зависимостей, прерывает инициализацию в случае падения
const taskA = AppBoot.task(() => {
    // ..что-то делает..
});

// Опциональная задача, запускается после 'taskA'
const taskB = AppBoot.task(() => {}, [ taskA ], true);

// Опциональная задача, запускается после 'taskB', пропускается если 'taskB' упадет
const taskC = AppBoot.task(() => {}, [{ task: taskB, optional: true }], true);

// Важная задача с асинхронной функцией
const taskD = AppBoot.task(async () => {
    await someAsyncFunc();
});
```

#### task(name, func, deps, optional) <!--AppBoot-->
Фабричный метод с явным указанием имени задачи

`public static task(name func, deps, optional): IBootTask`

| Параметр | Описание                                            | Тип                                                                                                               |
|----------|-----------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| name     | Имя задачи                                          | string                                                                                                            |
| func     | Функция задачи                                      | [TBootTaskFunction](#tboottaskfunction---type--)                                                                  |
| deps     | Список зависимостей                                 | ([TBootTaskDependency](#tboottaskdependency---type--) \| [IBootTask](#iboottask---type--))[] \| null \| undefined |
| optional | Не прерывать процесс инициализации в случае падения | boolean?                                                                                                          |

Возвращает: [IBootTask](#iboottask---type--)

Пример:
```ts
const task = AppBoot.task('MyTask', () => {
    // ...что-то делает...
})
```

### Методы экземпляра <!--AppBoot-->

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
Добавляет задачу в процесс инициализации

`public add(task): AppBoot`

| Параметр | Описание                      | Тип                                                            |
|----------|-------------------------------|----------------------------------------------------------------|
| task     | Задача которую нужно добавить | [IBootTask](#iboottask---type--) \| false \| null \| undefined |

Возвращает: [AppBoot](#appboot) (себя)

Кидает ошибку:
- Когда процесс инициализации уже запущен

Пример:
```ts
const taskA = AppBoot.task(() => {});
const taskB = AppBoot.task(() => {});
const taskC = AppBoot.task(() => {});

const boot = new AppBoot()
    .add(taskA)
    .add(taskB)

// Условное добавление
const isDev = process.env.NODE_ENV === 'development'
if (isDev) boot.add(taskC)
// или
boot.add(isDev && taskC) // false - Не добавлять
// или
let taskD: IBootTask | undefined
if (isDev) taskD = AppBoot.task(() => {})
boot.add(taskD) // null | undefined - Не добавлять
```

#### add(tasks) <!--AppBoot-->
Добавляет множество задач в процесс инициализации

`public add(tasks): IBootTask`

| Параметр | Описание                          | Тип                                |
|----------|-----------------------------------|------------------------------------|
| tasks    | Задачи которые требуется добавить | [IBootTask](#iboottask---type--)[] |

Возвращает: [AppBoot](#appboot) (self)

Кидает ошибку:
- Когда процесс инициализации уже запущен

Пример:
```ts
const taskA = AppBoot.task(() => {});
const taskB = AppBoot.task(() => {});

// Добавляем задачи A и B в прощесс инициализации
const boot = new AppBoot().add([ taskA, taskB ]);
```

#### has(task) <!--AppBoot-->
Проверяет, была ли добавлена задача в процесс инициализации

`public has(task: IBootTask): boolean`

| Параметр | Описание           | Тип                              |
|----------|--------------------|----------------------------------|
| task     | Задача на проверку | [IBootTask](#iboottask---type--) |

Возвращает: `true`, если задача была добавлена в процесс

Пример:
```ts
const taskA = AppBoot.task(() => {});
const taskB = AppBoot.task(() => {});

const boot = new AppBoot().add(taskA);

boot.has(taskA) // true
boot.has(taskB) // false
```

#### isTaskReachable(task) <!--AppBoot-->
Проверяет, что все зависимости задачи были добавлены в процесс.

`public isTaskReachable(task): boolean`

| Параметр | Описание           | Тип                              |
|----------|--------------------|----------------------------------|
| task     | Задача на проверку | [IBootTask](#iboottask---type--) |

Возвращает: `true`, если все зависимости задачи добавлены в процесс.

Пример:
```ts
const taskA = AppBoot.task(() => {})
const taskB = AppBoot.task(() => {}, [ taskA ])
const taskC = AppBoot.task(() => {})
const taskD = AppBoot.task(() => {}, [ taskB, taskC ])

const boot = new AppBoot().add([ taskA, taskB, taskD ]) // Задачу C не добавляем

boot.isTaskReachable(taskB) // true: Задача A была добавлена в процесс
boot.isTaskReachable(taskD) // false: Задача C отсутствует в процесса
```

#### addEventListener('process', listener) <!--AppBoot-->
Добавляет слушатель событий процесса

`public addEventListener(type, listener): AppBoot`

| Параметр | Описание          | Тип                                                      |
|----------|-------------------|----------------------------------------------------------|
| type     | Тип события       | 'process'                                                |
| listener | Функция слушатель | [TProcessEventListener](#tprocesseventlistener---type--) |

Возвращает: [AppBoot](#appboot) (себя)

#### addEventListener('finish', listener) <!--AppBoot-->
Добавляет слушатель события завершения

`public addEventListener(type, listener): AppBoot`

| Параметр | Описание          | Тип                                                    |
|----------|-------------------|--------------------------------------------------------|
| type     | Тип события       | 'finish'                                               |
| listener | Функция слушатель | [TFinishEventListener](#tfinisheventlistener---type--) |

Возвращает: [AppBoot](#appboot) (себя)

#### removeEventListener('process', listener) <!--AppBoot-->
Отключает слушатель события процесса

`public removeEventListener(type, listener): AppBoot`

| Параметр | Описание          | Тип                                                      |
|----------|-------------------|----------------------------------------------------------|
| type     | Тип события       | 'process'                                                |
| listener | Функция слушатель | [TProcessEventListener](#tprocesseventlistener---type--) |

Возвращает: [AppBoot](#appboot) (себя)

#### removeEventListener('finish', listener) <!--AppBoot-->
Отключает слушатель события завершения

`public removeEventListener(type, listener): AppBoot`

| Параметр | Описание          | Тип                                                    |
|----------|-------------------|--------------------------------------------------------|
| type     | Тип события       | 'finish'                                               |
| listener | Функция слушатель | [TFinishEventListener](#tfinisheventlistener---type--) |

Возвращает: [AppBoot](#appboot) (себя)


#### runAsync() <!--AppBoot-->
Запускает процесс инициализации

`public async runAsync(): Promise<TAppBootResult>`

Возвращает: [TAppBootResult](#tappbootresult---type--)

Кидает ошибку:
- когда процесс инициализации уже был запущен
- когда одна из важных задач кинула ошибку
- если невозможно построить путь выполнения до важной задачи

#### dispose() <!--AppBoot-->
Очищает ресурсы, что используются во время процесса инициализации.
Используйте этот метод после того как процесс инициализации был завершен.
Это поможет сократить объем используемой памяти приложением после инициализации.

`public dispose(): void`

Кидает ошибку:
- при попытке освободить ресурсы, когда процесс запущен

Пример:
```ts
const taskA = AppBoot.task(() => {});
const taskB = AppBoot.task(() => {});

const boot = new AppBoot()
        .add([ taskA, taskB ]);

await boot.runAsync();

// Освобождаем ресурсы
boot.dispose();

```

## Типы
- [TBootTaskFunctionSync](#tboottaskfunctionsync---type--)
- [TBootTaskFunctionAsync](#tboottaskfunctionasync---type--)
- [TBootTaskFunction](#tboottaskfunction---type--)
- [IBootTask](#iboottask---type--)
- [TBootTaskDependency](#tboottaskdependency---type--)

### TBootTaskFunctionSync <!--Type-->
Синхронная функция задачи инициализации

`() => void`

### TBootTaskFunctionAsync <!--Type-->
Асинхронная функция задачи инициализации

`() => Promise<void>`

### TBootTaskFunction <!--Type-->
Функция задачи инициализации

[TBootTaskFunctionSync](#tboottaskfunctionsync---type--) |
[TBootTaskFunctionAsync](#tboottaskfunctionasync---type--)

### IBootTask <!--Type-->
Задача инициализации

| Поле      | Описание                                             | Тип                                                     |
|-----------|------------------------------------------------------|---------------------------------------------------------|
| name      | Имя задачи                                           | string                                                  |
| optional  | Не завершать процесс инициализации в случае падения  | boolean?                                                |
| dependsOn | Задачи, которые должны быть выполнены перед запуском | [TBootTaskDependency](#tboottaskdependency---type--)[]? |
| run       | Функция задачи                                       | [TBootTaskFunction](#tboottaskfunction---type--)        |

### TBootTaskDependency <!--Type-->
Зависимость задачи инициализации

| Поле     | Описание                        | Тип                              |
|----------|---------------------------------|----------------------------------|
| task     | Задача                          | [IBootTask](#iboottask---type--) |
| optional | Выполнение задачи необязательно | boolean?                         |

### TAppBootResult <!--Type-->
Результат выполнения инициализации

| Поле        | Описание                                                    | Тип                                |
|-------------|-------------------------------------------------------------|------------------------------------|
| success     | Список успешно выполненных задач                            | [IBootTask](#iboottask---type--)[] |
| failure     | Список задач завершивших выполнение с ошибкой               | [IBootTask](#iboottask---type--)[] |
| skipped     | Список пропущенных задач                                    | [IBootTask](#iboottask---type--)[] |
| unreachable | Список задач к которым не удалось построить путь выполнения | [IBootTask](#iboottask---type--)[] |


### TProcessEventData <!--Type-->
Данные события процесса

| Поле       | Описание                         | Тип                                                                                  |
|------------|----------------------------------|--------------------------------------------------------------------------------------|
| type       | Тип события                      | 'process'                                                                            |
| task       | Задача которая запустила событие | [IBootTask](#iboottask---type--)                                                     |
| completed  | Количество завершенных задач     | number                                                                               |
| total      | Общее количество задач           | number                                                                               |
| getStateOf | Провайдер состояния задач        | (task: [IBootTask](#iboottask---type--)) => [BootTaskState](#boottaskstate---enum--) |


### TProcessEventListener <!--Type-->
Функция-слушатель события процесса

(data: [TProcessEventData](#tprocesseventdata---type--)): void

### TFinishEventData <!--Type-->
Данные события завершения

| Поле   | Описание             | Тип                                        |
|--------|----------------------|--------------------------------------------|
| type   | Тип события          | 'finish'                                   |
| result | Результат выполнения | [TAppBootResult](#tappbootresult---type--) |


### TFinishEventListener <!--Type-->
Функция-слушатель события завершения

(data: [TFinishEventData](#tfinisheventdata---type--)): void

## Перечисления

### BootTaskState <!--Enum-->

| Значение | Описание                           |
|----------|------------------------------------|
| Unknown  | Задача не контролируется процессом |
| Idle     | Задача в очереди на выполнение     |
| Running  | Задача выполняется                 |
| Success  | Задача завершена успешно           |
| Failure  | Задача завершена с ошибкой         |
| Skipped  | Задача была пропущена              |
