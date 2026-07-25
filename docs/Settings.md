# Настройка работы сервиса

Здесь описаны общие способы настройки сервиса для полноценной работы.

Всего существуют два способа настройки системы: автоматическая и ручная. В данном файле описаны оба способа.

## Автоматическая настройка

Файл ``dbinstaller.sh`` запускает автоматическую установку всех зависимостей самого сервиса, а также может установить как OpenVPN-сервер, так и Redis, и в том числе сам назначает все нужные права на директории и скрипты.

> **Важно:** перед запуском скрипта, убедитесь, что файл ``.env.server`` заполнен верно (по шаблону файла ``.env.server.temp``).

Подробное описание констант файла ``.env.server`` можете прочитать в [Constants.md](Constants.md#рабочие-константы-системы-генерации-конфиг-файлов-и-проверки-соединений).

**Порядок настройки:**

1. Перейдите в директорию ``scripts/``.
2. Сделайте файл ``dbinstaller.sh`` исполняемым:
```bash
sudo chmod +x dbinstaller.sh
```
3. Запустите файл:
```bash
sudo ./dbinstaller.sh
```
4. Выберите один из режимов установки: _«Полная установка»_, _«Настройка с уже установленным OpenVPN»_ или _«Настройка только Backend/API»_.
5. В случае выбора любого варианта, кроме _«Полная установка»_, нужно **вручную** внести изменения в ``.conf``-файл OpenVPN:

```text
script-security 2
client-connect /absolute/path/scripts/inconn.sh
client-disconnect /absolute/path/scripts/inconn.sh
```
6. После внесения, перезапустите сервер OpenVPN.

На этом настройка сервера будет завершена. Сервер готов к запуску.

## Ручная настройка

В случае ручной настройки, подразумевается вариант как полного отсутствия OpenVPN и его окружения, так и отсутствия только сервиса API. Здесь будут описаны оба варианта.

### Установка и настройка OpenVPN

Для начала произведите установку и настройку OpenVPN-сервера. 

> Настройка будет произведена без особых комментариев по поводу команд и конфиг-файла сервера.

```bash
# Обновление пакетов
sudo apt update && sudo apt upgrade -y

# Установка OpenVPN, Easy-RSA и iptables-persistent
sudo apt install -y openvpn easy-rsa iptables-persistent

# Создать директорию Easy-RSA
sudo make-cadir /etc/openvpn/easy-rsa

# Перейти в директорию Easy-RSA 
cd /etc/openvpn/easy-rsa

# Инициализировать PKI
sudo ./easyrsa init-pki

# Создать CA без пароля
sudo ./easyrsa --batch build-server-full server nopass

# Создать Diffie-Hellman
sudo ./easyrsa gen-dh

# Создать tls-crypt ключ
sudo openvpn --genkey secret ta.key

# Скопировать ключи и сертификаты в /etc/openvpn/
sudo mkdir -p /etc/openvpn/server

sudo cp pki/ca.crt /etc/openvpn/server/
sudo cp pki/issued/server.crt /etc/openvpn/server/
sudo cp pki/private/server.key /etc/openvpn/server/
sudo cp pki/dh.pem /etc/openvpn/server/
sudo cp ta.key /etc/openvpn/server/

# Создать CRL-файл
sudo ./easyrsa gen-crl

sudo cp pki/crl.pem /etc/openvpn/server/
sudo chmod 644 /etc/openvpn/server/crl.pem

# Включить IP forwarding
echo "net.ipv4.ip_forward=1" | sudo tee /etc/sysctl.d/99-openvpn.conf

# Применить sysctl
sudo sysctl -p /etc/sysctl.d/99-openvpn.conf

# Узнать основной сетевой интерфейс
ip route | awk '/default/ {print $5; exit}'

# Укажите сетевой интерфейс вместо [INTERFACE]
sudo iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o "[INTERFACE]" -j MASQUERADE

# Разрешить входящие UDP-подключения OpenVPN
sudo iptables -A INPUT -p udp --dport 1194 -j ACCEPT

# Разрешить forwarding
sudo iptables -A FORWARD -s 10.8.0.0/24 -j ACCEPT
sudo iptables -A FORWARD -d 10.8.0.0/24 -m state --state ESTABLISHED,RELATED -j ACCEPT

# Сохранить правила iptables
sudo netfilter-persistent save
```

### Настройка конфигурации OpenVPN

После установки и настройки OpenVPN, перейдите к созданию файла конфигурации OpenVPN для запуска сервера:

```bash
# Создать конфиг OpenVPN-сервера
sudo nano /etc/openvpn/server/server.conf
```
Вставьте в него следующее содержимое:

```text
port 1194
proto udp
dev tun
topology subnet
user nobody
group vpn
persist-key
persist-tun
keepalive 10 120
server 10.8.0.0 255.255.255.0
ifconfig-pool-persist ipp.txt
push "dhcp-option DNS 94.140.14.14"
push "dhcp-option DNS 94.140.15.15"
push "redirect-gateway def1 bypass-dhcp"
dh none
ecdh-curve prime256v1
tls-crypt ta.key
crl-verify crl.pem
ca ca.crt
cert server.crt
key server.key
auth SHA256
cipher AES-128-GCM
ncp-ciphers AES-128-GCM
tls-server
tls-version-min 1.2
tls-cipher TLS-ECDHE-ECDSA-WITH-AES-128-GCM-SHA256

management 127.0.0.1 7505

client-config-dir /etc/openvpn/server/ccd
status /var/log/openvpn/status.log
verb 3
```

### Подготовка к запуску OpenVPN и сам запуск

Перед запуском сервера, необходимо создать группу ``vpn``, если она ещё не была создана, и добавить пользователя ``nobody`` в эту группу:

```bash
# Создание группы vpn
sudo groupadd vpn

# Добавить nobody в группу vpn
sudo usermod -aG vpn nobody
```

> Создание группы и добавление в неё пользователя ``nobody`` необходимо для работы скриптов сервера API.

После этого, создайте директрию логов, если её ещё нет:

```bash
# Создать директорию логов, если её нет
sudo mkdir -p /var/log/openvpn
```

Теперь можно запустить сервер OpenVPN:

```bash
# Добавить OpenVPN в автозапуск
sudo systemctl enable openvpn-server@server

# Запустить OpenVPN
sudo systemctl start openvpn-server@server
```

Сервер установлен, настроен и запущен!

### Проверка работы сервера OpenVPN (необязательно)

Можете проверить работу сервера OpenVPN и доступность порта ``1194`` (или иного, указанного при настройке).

#### Проверка работы сервиса

```bash
# Проверить статус
sudo systemctl status openvpn-server@server
```

**Пример положительного результата:**

```text
...
Loaded: loaded (/etc/systemd/system/openvpn@.service; enabled; preset: enabled)
Active: active (running) since Sat 2026-07-18 18:13:58 UTC; 5 days ago
...
```

#### Проверка порта:
```bash
# Проверить, слушает ли UDP 1194
sudo ss -lunp | grep 1194
```

**Пример положительного результата:**

```bash
UNCONN 0  0  *:1194  *:*  users:(("openvpn",pid=713,fd=8))
```

### Установка Redis-сервера

Для работы сервера также необходим сервер ``Redis``. Он хранит в себе короткие ссылки для скачивания конфиг-файлов.

```bash
sudo apt install redis-server redis-tools
```

> ``redis-server`` - это сам Redis-сервер, а ``redis-tools`` - это ``redis-cli``, нужный для скриптов.

#### Запуск и автозапуск

После скачивания, установите автозапуск сервера и запустите его:

```bash
sudo systemctl enable redis-server
sudo systemctl restart redis-server
```

#### Проверка работы

```bash
redis-cli ping
```

**Ожидаемый ответ:**

```bash
PONG
```

### Настройка сервера

После настройки OpenVPN и Redis, можно перейти к настройке самого сервера API.

#### Установка NodeJS и окружения сервера API

Запустите установку ``NodeJS`` версии 22+ и пакетного менеджера ``npm``:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
sudo apt install -y nodejs
sudo apt install -y npm
```

> Устанавливать NodeJS необходимо именно через указанный ``curl``. Стандартный пакет в ``apt`` на момент создания инструкции версии 18+, но сервер **не поддерживает** данную версию.

Установите ``pm2``. Он поможет в автоматическом запуске и перезапуске API в случае сбоя или перезагрузки сервера:

```bash
npm install -g pm2
```

После всего перечисленного, установите зависимости сервера API:

```bash
npm install
```

Команда создаст директорию ``node_modules`` со всем необходимым содержимым.

Настройка ПО и загрузка окружения сервера завершена.

### Создание директорий и распределение прав доступа

Для взаимодействия OpenVPN с SQLite, необходимо предоставить определённые права доступа к директориям и файлам.

#### Создание директории 

Для начала, создайте директории для хранения пользовательских конфиг-файлов и файла базы данных. Не рекомендую хранить базу данных и конфиг-файлы в одной директории.


Пример создания директорий:
```bash
# Директория для хранения конфиг-файлов пользователей
mkdir users

# Директория для хранения базы данных пользователей
mkdir usersdb
```

#### Распределение прав доступа

Обязательно перераспределить права доступа к созданным шагом выше директориям. Для этого мы создавали группу ``vpn``и добавляли в неё пользователя ``nobody`` (см. [Подготовка к запуску OpenVPN и сам запуск](#подготовка-к-запуску-openvpn-и-сам-запуск)). 

Причиной тому служит то, каким пользователем будут исполняться скрипты подключения / отключения пользователя, а именно тем, от которого запущен процесс ``openvpn``.

> Скрипты для подключения / отключения пользователей будут внесены в конфиг-файл позже.

Выдайте права доступа к директориям ``users`` и ``usersdb`` группе ``vpn``: 

```bash
chown -R $USER:vpn users
chown -R $USER:vpn usersdb
```
где ``$USERS`` - имя вашего пользователя (или того, от которого будет запускаться процесс ``node``).

Измените права для директорий:

```bash
chmod -R 770 users
chmod -R 770 usersdb
```

### Исполняемые файлы и внесения изменений в server.conf

Сделайте все bash-скрипты из директории ``scripts`` исполняемыми:

```bash
sudo chmod +x *.sh
```

После этого внесите изменения в конец конфигурационного файла сервера ``OpenVPN``:

> По данной инструкции, он расположен в директории ``/etc/openvpn/server``.

```text
client-connect /absolute/path/scripts/inconn.sh
client-disconnect /absolute/path/scripts/inconn.sh
```

Перезагрузите сервер OpenVPN:

```bash
sudo systemctl restart openvpn@server
```

### Редактирование visudo

Так как скрипты создают конфиг-файлы пользователей в автоматическом режиме с генерацией ключей, система просит пароль при каждой генерации. Чтобы этого не происходило, нужно изменить файл ``sudoers``. Для этого сделайте следующее:

```bash
sudo visudo
```

Ближе к концу файла внесите следующую строку:

```bash
# User privilege specification
root    ALL=(ALL:ALL) ALL

# Members of the admin group may gain root privileges
%admin ALL=(ALL) ALL

# Allow members of group sudo to execute any command
%sudo   ALL=(ALL:ALL) ALL

# Важно: ВНОСИТЬ ПОСЛЕ ОСТАЛЬНЫХ ЗАПИСЕЙ 
root ALL=(ALL) NOPASSWD: /absolute/path/scripts/ovpn-ctrl.sh *

# Важно: ВНОСИТЬ ДО @includedir
@includedir /etc/sudoers.d
```

> Справка: файл ``ovpn-ctrl.sh`` - генератор и регенератор конфиг-файлов пользователей.

### Создание файла констант

Как было указано ранее, создайте 2 файла-констант окружения:
1. ``.env`` - файл с константами для работы самого API.
2. ``.env.server`` - файл с константами для работы систем работы со скриптами.

Файлы-шаблоны (``.env.temp`` и ``.env.server.temp``) уже имеют комментарии для заполнения, но в файле [Constants.md](Constants.md) они прописаны отдельно.

Для удобства, просто скопируйте или переименуйте шаблоны и заполните, согласно комментариям:

```bash
# Скопирует файлы (шаблоны останутся)
cp .env.temp .env
cp .env.server.temp .env.server

# Или

# Переименует шаблоны в рабочие варианты
mv .env.temp .env
mv .env.server.temp .env.server
```

### Компиляция Typescript-кода и запуск API

Настройка практически завершена! Осталось выполнить несколько задач:

1. Перейдите в корень API-сервера.
2. Скомпилируйте код ``ts`` в ``js``:
```bash
npm run build
```
3. После успешной компиляции, запустите сервер:
```bash
npm start
```
4. Если вы увидели в консоли сообщение вида ``Server running at...``, значит сервер запущен!

Для автоматического запуска в случае сбоя или ошибок сервера, запустите ``pm2``:

```bash
pm2 start dist/app.js --name ovpn-controller
pm2 save 
```

Далее, настройте автоперезапуск ``pm2``:

```bash
pm2 startup
pm2 save
```

**На этом настройка и запуск сервера окончательно завершены!**

## Тестирование системы

Система API почти вся покрыта тестами на базе ``Vitest``. Для тестирования, выполните команду:

```bash
npm test -- --run
```

Если вам необходима дополнительная информация о выполненных тестах (сколько строк, функций и веток условий было проверено), выполните следующее:

```bash
npm run test:coverage
```

### Непокрытые тестами участки API

Некоторые участки системы не были покрыты тестами, а именно:
1. ``doActionUser.ts`` - не покрыт тестами из-за работы с OpenVPN Management Interface.
2. ``filesUtil.ts`` - не проверены участки кода, связанные с вызовом файла ``ovpn-ctrl.sh``: создание / обновление / удаление конфиг-файла, обработка ошибок ``sudo``.
3. Не проверены некоторые возможные ошибки в файлах ``configsServices.ts`` и ``configUtil.ts``.

В будущих обновлениях большинство участков будут покрыты тестами.