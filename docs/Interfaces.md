# Интерфейсы

В директории `src/interfaces` расположены TypeScript-интерфейсы, описывающие ответы API, JWT, пользовательские конфигурации, активные подключения и параметры обновления.

> Интерфейсы используются только во время разработки и компиляции TypeScript. Они не проверяют данные во время выполнения приложения.

## `IResponseArray.ts`

### `IResponseConfig`

Стандартная структура ответа сервисов и HTTP API.

```ts
interface IResponseConfig {
  code: number;
  message: string;
  data?: any;
}
```

| Поле | Тип | Описание |
|:--|:--|:--|
| `code` | `number` | HTTP-код ответа |
| `message` | `string` | Машиночитаемый идентификатор результата |
| `data` | `any`, необязательно | Полезная нагрузка ответа |

Пример:

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

## `ITokenAuth.ts`

### `ITokenConfig`

Описывает полезную нагрузку JWT.

```ts
interface ITokenConfig {
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  role: "admin" | "bot" | "site" | "user";
  uuid?: string;
}
```

| Поле | Описание |
|:--|:--|
| `sub` | Идентификатор отправителя токена |
| `aud` | Индекс сервера-получателя |
| `iat` | Время создания в секундах Unix |
| `exp` | Время окончания действия в секундах Unix |
| `role` | Роль и уровень доступа |
| `uuid` | Необязательный UUID пользователя |

Допустимые роли:

| Роль | Назначение |
|:--|:--|
| `admin` | Полный административный доступ |
| `bot` | Операции, выполняемые управляющим ботом |
| `site` | Доступ веб-интерфейса, включая авторизованное скачивание |
| `user` | Пользовательский уровень доступа |

## `IUserConfig.ts`

### `IUserConfig`

Описывает данные конфигурации пользователя, получаемые из SQLite.

```ts
interface IUserConfig {
  uuid: string;
  version: number;
  user_type: string;
  created_at: string;
  expired_time: string;
  status: "active" | "inactive" | "banned";
}
```

| Поле | Описание |
|:--|:--|
| `uuid` | UUID конфигурационного файла и Common Name сертификата |
| `version` | Версия конфигурации |
| `user_type` | Тип пользователя |
| `created_at` | Дата создания |
| `expired_time` | Дата окончания действия |
| `status` | Текущее состояние пользователя |

Статусы:

- `active` — пользователь подключён или разрешён системой;
- `inactive` — пользователь не подключён;
- `banned` — подключение запрещено.

## `IConnectedUser.ts`

### `IConnectedUser`

Описывает пользователя в списке активных VPN-подключений.

```ts
interface IConnectedUser {
  uuid: string;
  user_type: string;
  created_at: string;
  expired_time: string | null;
  status: string;
  reaip: string;
  virtualip: string;
  connectedsince: string;
  bytes_received: number;
  bytes_sent: number;
}
```

| Поле | Описание |
|:--|:--|
| `uuid` | Common Name подключённого клиента |
| `user_type` | Тип пользователя |
| `created_at` | Дата создания конфигурации |
| `expired_time` | Дата окончания действия или `null` |
| `status` | Состояние пользователя |
| `reaip` | Реальный IP-адрес клиента |
| `virtualip` | Выданный OpenVPN виртуальный IP |
| `connectedsince` | Дата и время подключения |
| `bytes_received` | Количество принятых байт |
| `bytes_sent` | Количество отправленных байт |

> В текущем интерфейсе поле реального IP называется `reaip`. Данные SQLite и API используют имя `realip`, поэтому название интерфейса следует синхронизировать с ними.

## `IUpdateConfigUtil.ts`

### `IUpdateConfigUtil`

Описывает набор полей для частичного обновления записи пользователя.

```ts
interface IUpdateConfigUtil {
  time?: number;
  user_type?: string;
  status?: string;
}
```

| Поле | Описание |
|:--|:--|
| `time` | Новое время действия в секундах |
| `user_type` | Новый тип пользователя |
| `status` | Новый статус пользователя |

Все поля необязательны на уровне TypeScript, однако `configFiles.update()` отклоняет пустой объект и неизвестные значения статуса.

## Связи интерфейсов

```text
ITokenConfig
  → middleware авторизации

IUpdateConfigUtil
  → configFiles.update()

IUserConfig
  → configFiles.get()
  → IResponseConfig

IConnectedUser[]
  → getConnectedClients()
  → IResponseConfig
```
