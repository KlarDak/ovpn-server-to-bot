# Утилиты

В директории `src/utils` расположены вспомогательные модули для работы с окружением, JWT, SQLite, Redis, файлами OpenVPN, короткими ссылками, проверкой входных данных и стандартными ответами API.

> Актуально для версии `2.1`. Утилиты не зависят от HTTP-роутов и используются сервисами и middleware приложения.

## `configUtil.ts`

Класс `configFiles` предоставляет высокоуровневые операции над таблицей `users` в SQLite.

| Метод | Назначение | Результат |
|:--|:--|:--|
| `create(uuid, type, time)` | Создаёт запись и вычисляет дату окончания действия | `Promise<boolean>` |
| `get(uuid)` | Возвращает запись пользователя | `Promise<IUserConfig \| false>` |
| `path(uuid)` | Возвращает путь к устаревшему JSON-представлению пользователя | `string` |
| `update(uuid, argsUpdate)` | Обновляет переданные поля | `Promise<boolean>` |
| `delete(uuid)` | Удаляет запись | `Promise<boolean>` |
| `isExists()` | Проверяет доступность SQLite | `Promise<boolean>` |

При создании `created_at` устанавливается в текущее время, а `expired_time` вычисляется как текущее время плюс `time` секунд.

> Метод `path()` сохранён для совместимости со старой файловой реализацией и в текущем рабочем коде не вызывается.

## `envUtil.ts`

Загружает `.env` через `dotenv` и предоставляет функции для получения параметров приложения.

| Функция | Используемые переменные |
|:--|:--|
| `serverProps()` | `HOSTNAME`, `PORT` |
| `keyStats()` | `SECRET_KEY` |
| `allowedIps()` | `ALLOWED_IPS` |
| `pathDirs()` | `CONFIG_DIR`, `LOG_DIR`, `USERS_DIR`, `USER_DB` |
| `subIndex()` | `SUB_INDEX` |
| `redisPaths()` | `REDIS_HOSTNAME`, `REDIS_PORT` |
| `configPath()` | `CONFIG_SCRIPT` |
| `actionPath()` | `ACTION_SCRIPT` |
| `vpnManagementPaths()` | `VPN_MANAGEMENT_HOSTNAME`, `VPN_MANAGEMENT_PORT` |
| `noSQLiteMode()` | `NO_SQL` |
| `noRedisMode()` | `NO_REDIS` |

`ALLOWED_IPS` передаётся строкой с разделителем `|`:

```env
ALLOWED_IPS=127.0.0.1|::1|192.168.1.10
```

Булевы значения принимают `true`, `false`, `1`, `0` или пустое значение. Неизвестное значение вызывает ошибку конфигурации.

## `filesUtil.ts`

Работает с `.ovpn`-файлами и запускает внешний скрипт управления сертификатами.

| Функция | Назначение |
|:--|:--|
| `isFileExist(configName)` | Проверяет наличие `<CONFIG_DIR>/<uuid>.ovpn` |
| `getFile(configName)` | Возвращает полный путь к `.ovpn` |
| `createFile(uuid)` | Запускает `CONFIG_SCRIPT create <uuid>` через `sudo` |
| `updateFile(uuid)` | Запускает `CONFIG_SCRIPT update <uuid>` через `sudo` |
| `deleteFile(uuid)` | Запускает действие удаления через `sudo` |
| `isDirExists()` | Проверяет существование `CONFIG_DIR` |

Функции запуска скрипта возвращают `true` при успешном завершении и `false` при ошибке.

## `jwtUtil.ts`

Отвечает за создание, извлечение и проверку JWT.

| Функция | Назначение |
|:--|:--|
| `encodeToken(sub, role)` | Создаёт подписанный JWT |
| `payloadGenerator(sub, role)` | Формирует полезную нагрузку токена |
| `getAuthToken(authHeader)` | Извлекает токен из `Bearer <token>` |
| `decryptToken(token)` | Проверяет подпись и срок действия |
| `decodeToken(token)` | Извлекает и дополнительно проверяет payload |

Формат payload:

```json
{
  "sub": "controller",
  "aud": "ksd_nl_01",
  "iat": 1784916000,
  "exp": 1784916012,
  "role": "admin"
}
```

Токен действует 12 секунд. Короткий срок жизни выбран намеренно для выполнения единичных запросов.

## `redisUtil.ts`

Класс `RedisUtil` является обёрткой над Redis-клиентом.

```ts
new RedisUtil(hostname: string, port: number)
```

| Метод | Назначение | Ошибка |
|:--|:--|:--|
| `connect()` | Открывает соединение | `false` |
| `ping()` | Проверяет доступность Redis | `false` |
| `get(key)` | Получает строковое значение | `null` |
| `set(key, value, ttl?)` | Записывает значение с необязательным TTL | `false` |
| `del(key)` | Удаляет ключ | `0` |
| `exists(key)` | Проверяет существование ключа | `false` |
| `disconnect()` | Закрывает соединение | `false` |

Тайм-аут соединения составляет 3 секунды, автоматическое переподключение отключено.

## `resgenUtil.ts`

Формирует стандартный объект ответа сервера:

```ts
responseGenerator(
  code: number,
  message: string,
  data?: any
): IResponseConfig
```

Пример:

```json
{
  "code": 200,
  "message": "USER_CONFIG_RETRIEVED",
  "data": {}
}
```

Если данные не переданы, поле `data` получает значение `null`.

## `slinkUtil.ts`

Создаёт и обрабатывает одноразовые короткие ссылки на конфигурационные файлы.

| Функция | Назначение |
|:--|:--|
| `encodeLink(uuid, time)` | Создаёт Redis-ключ `sl:<shortlink>` с TTL |
| `decodeLink(shortlink)` | Получает UUID и удаляет использованный ключ |
| `generateSymbol(length)` | Генерирует буквенно-цифровую строку |

По умолчанию `generateSymbol` создаёт строку длиной 8 символов. Для ссылок сервис конфигураций использует переданное время действия.

> Ссылка является одноразовой: `decodeLink` удаляет Redis-ключ сразу после чтения.

## `sqliteUtil.ts`

Класс `SQLiteClient` предоставляет Promise-интерфейс над пакетом `sqlite3`.

```ts
new SQLiteClient(dbFile: string)
```

Низкоуровневые методы:

| Метод | Назначение |
|:--|:--|
| `run(sql, params)` | Выполняет запрос и возвращает `lastID` и `changes` |
| `get(sql, params)` | Получает одну строку |
| `all(sql, params)` | Получает массив строк |
| `close()` | Закрывает базу |

CRUD-методы:

| Метод | SQL-операция |
|:--|:--|
| `create(table, data)` | `INSERT` |
| `read(table, where, params)` | `SELECT` |
| `update(table, data, where, params)` | `UPDATE` |
| `delete(table, where, params)` | `DELETE` |

Значения передаются через параметры SQLite. Названия таблиц, полей и выражение `where` должны поступать только из доверенного кода.

## `verifyUtil.ts`

Содержит проверки входных данных.

| Функция | Проверка |
|:--|:--|
| `verifyUuidFormat(uuid)` | Формат UUID |
| `verifyPayloadKeys(payload)` | Обязательные поля и допустимая роль JWT |
| `verifyRequiredFields(obj, fields)` | Наличие указанных полей объекта |
| `verifyShortLink(shortlink)` | Формат короткой ссылки |

Ошибочные данные приводят к `false`; функции не формируют HTTP-ответ самостоятельно.
