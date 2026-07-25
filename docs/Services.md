# Сервисы

В директории `src/services` расположена бизнес-логика системы. Сервисы связывают HTTP-роуты с утилитами работы с OpenVPN, SQLite, Redis и конфигурационными файлами.

> Актуально для версии `2.1`. Сервисы не формируют HTTP-ответ напрямую: они возвращают данные или объект `IResponseConfig`, который затем передаётся роутером клиенту.

## Сервис конфигурационных файлов

Файл `configsServices.ts` отвечает за полный жизненный цикл конфигурации пользователя: получение, создание, полное или частичное обновление и удаление.

Сервис использует:

- `configFiles` — работа с данными пользователя в SQLite;
- `createFile`, `updateFile`, `deleteFile` — запуск скрипта управления OpenVPN;
- `isFileExist` — проверка существования `.ovpn`-файла;
- `encodeLink` — создание короткой ссылки в Redis;
- `responseGenerator` — формирование стандартного ответа API.

### Получение конфигурации

```ts
getUserConfig(uuid: string): Promise<IResponseConfig>
```

Проверяет наличие `.ovpn`-файла и получает связанную запись пользователя из SQLite.

| Результат | Сообщение |
|:--:|:--|
| `200` | `USER_CONFIG_RETRIEVED` |
| `404` | `CONFIG_FILE_NOT_FOUND` |

### Создание конфигурации

```ts
postUserConfig(
  uuid: string,
  type: string,
  time: number
): Promise<IResponseConfig>
```

Последовательно:

1. Проверяет обязательные параметры.
2. Проверяет отсутствие существующего `.ovpn`-файла.
3. Запускает создание сертификата и файла через `createFile`.
4. Создаёт запись пользователя в SQLite.
5. Создаёт одноразовую короткую ссылку в Redis.

При успешном выполнении возвращает UUID и короткую ссылку:

```json
{
  "code": 200,
  "message": "USER_CONFIGURATION_CREATED",
  "data": {
    "uuid": "430a8e06-d9b6-11f0-a8db-38f3ab6d0b91",
    "link": "6SM0Yj"
  }
}
```

### Полное обновление конфигурации

```ts
putUserConfig(
  uuid: string,
  type: string,
  time: number
): Promise<IResponseConfig>
```

Требует одновременно передать новый тип и время действия. Перегенерирует `.ovpn`-файл, обновляет запись SQLite и создаёт новую короткую ссылку.

### Частичное обновление конфигурации

```ts
patchUserConfig(
  uuid: string,
  time?: number,
  type?: string
): Promise<IResponseConfig>
```

Позволяет передать хотя бы одно из значений: `time` или `type`. Файл OpenVPN при этом не перегенерируется.

### Удаление конфигурации

```ts
deleteUserConfig(uuid: string): Promise<IResponseConfig>
```

Запускает удаление конфигурационного файла и сертификата, после чего удаляет запись пользователя из SQLite.

## Сервис управления подключениями

Файл `doActionUser.ts` работает с активными VPN-подключениями и OpenVPN Management Interface.

Адрес интерфейса получается из переменных:

```env
VPN_MANAGEMENT_HOSTNAME=127.0.0.1
VPN_MANAGEMENT_PORT=7505
```

### Отправка команды OpenVPN

```ts
sendCommand(command: string): Promise<string>
```

Внутренняя функция. Создаёт TCP-соединение с Management Interface, отправляет команду, затем команду `quit` и возвращает полный текст ответа OpenVPN.

### Получение активных пользователей

```ts
getConnectedClients(): Promise<IConnectedUser[]>
```

Получает из SQLite пользователей со статусом `active`:

```sql
SELECT
  uuid,
  user_type,
  realip,
  virtualip,
  connectedsince,
  bytes_received,
  bytes_sent
FROM users
WHERE status = 'active';
```

Функция возвращает массив подключённых пользователей. Ошибка открытия базы или выполнения запроса передаётся вызывающему роутеру.

### Отключение пользователя

```ts
kickUser(uuid: string): Promise<void>
```

Передаёт OpenVPN команду:

```text
kill <uuid>
```

UUID должен совпадать с `common_name` активного клиентского сертификата. После выполнения команды OpenVPN вызывает `client-disconnect`, а скрипт `inconn.sh` обновляет состояние пользователя в SQLite.

## Последовательность работы

При создании конфигурации:

```text
Router
  → configsServices
  → ovpn-ctrl.sh
  → SQLite
  → Redis
  → IResponseConfig
```

При отключении пользователя:

```text
Router
  → doActionUser
  → OpenVPN Management Interface
  → client-disconnect
  → inconn.sh
  → SQLite
```
