# Расширения

В директории `src/extensions` расположены расширения стандартных объектов Express и Node.js. Они добавляют единый способ формирования HTTP-ответов и журналирования внутренних ошибок.

> Актуально для версии `2.1`. Файл расширения импортируется один раз при создании Express-приложения.

## `responseGenerator.ts`

Файл расширяет:

- `Express.Response` методом `sendServerJson`;
- глобальный объект `console` методом `serverError`.

Для объявления новых методов используется расширение глобальных TypeScript-интерфейсов через `declare global`.

## `Response.sendServerJson`

Сигнатура:

```ts
sendServerJson(
  inputData: IResponseConfig | number,
  message?: string,
  data?: any
): this
```

Метод поддерживает два способа вызова.

### Передача готового ответа

```ts
res.sendServerJson({
  code: 200,
  message: "USER_CONFIG_RETRIEVED",
  data: user
});
```

В этом случае HTTP-статус берётся из `inputData.code`, а объект передаётся клиенту без дополнительного преобразования.

### Формирование ответа из параметров

```ts
res.sendServerJson(
  404,
  "CONFIG_FILE_NOT_FOUND",
  { uuid }
);
```

Метод вызывает `responseGenerator(code, message, data)` и возвращает:

```json
{
  "code": 404,
  "message": "CONFIG_FILE_NOT_FOUND",
  "data": {
    "uuid": "430a8e06-d9b6-11f0-a8db-38f3ab6d0b91"
  }
}
```

Если аргументы имеют неизвестный формат или числовой код передан без строки `message`, сервер журналирует ошибку и отвечает:

```json
{
  "code": 500,
  "message": "RESPONSE_GENERATION_FAILED",
  "data": null
}
```

## `console.serverError`

Сигнатура:

```ts
console.serverError(module: string, error: any): void
```

Формирует единообразную запись внутренней ошибки:

```text
An error has occurred in module <module> at <ISO date>. Error: <error>
```

Пример:

```ts
try {
  await operation();
} catch (error) {
  console.serverError("configsServices", error);
}
```

Параметры:

| Параметр | Описание |
|:--|:--|
| `module` | Название модуля, в котором произошла ошибка |
| `error` | Объект ошибки или другое диагностическое значение |

В текущей реализации сообщения передаются в стандартный `console.error`. Постоянное файловое или централизованное хранение логов этим расширением не выполняется.

## Подключение расширения

Расширение подключается в `createApp.ts`:

```ts
import "./extensions/responseGenerator.js";
```

После импорта методы доступны во всех роутерах без дополнительного создания экземпляров:

```ts
return res.sendServerJson(200, "SERVER_IS_WORKING");
```

Расширение должно быть импортировано до обработки первого HTTP-запроса, иначе методы `sendServerJson` и `serverError` не будут добавлены в runtime-объекты.
