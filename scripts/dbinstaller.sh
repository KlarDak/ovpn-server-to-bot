#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_SERVER_FILE="$PROJECT_DIR/.env.server"
ENV_APP_FILE="$PROJECT_DIR/.env"
OPENVPN_UNIT=""

log() {
    printf '[*] %s\n' "$1"
}

die() {
    printf '[!] %s\n' "$1" >&2
    exit 1
}

on_error() {
    local exit_code=$?
    printf '[!] Ошибка на строке %s. Установка прервана (код %s).\n' "$1" "$exit_code" >&2
    exit "$exit_code"
}

trap 'on_error "$LINENO"' ERR

require_root() {
    [[ "${EUID:-$(id -u)}" -eq 0 ]] || die "Скрипт должен быть запущен от root."
}

load_environment() {
    [[ -f "$ENV_SERVER_FILE" ]] || die "Не найден $ENV_SERVER_FILE. Создайте его по шаблону .env.server.temp."

    set -a
    # shellcheck disable=SC1090
    source "$ENV_SERVER_FILE"
    set +a

    SERVER="${SERVER:-$PROJECT_DIR}"
    export SERVER
}

require_variables() {
    local variable
    for variable in "$@"; do
        [[ -n "${!variable:-}" ]] || die "Переменная $variable не заполнена в $ENV_SERVER_FILE."
    done
}

validate_common_settings() {
    id "$SERVERUSER" >/dev/null 2>&1 || die "Пользователь $SERVERUSER не существует."
}

validate_backend_settings() {
    require_variables SERVER CONFIGS_DIR USERDB_DIR
    [[ -d "$SERVER" ]] || die "Директория проекта не существует: $SERVER"
    [[ -f "$SERVER/package.json" ]] || die "В $SERVER не найден package.json."
}

install_packages() {
    log "Обновление списка пакетов..."
    apt-get update

    log "Установка Node.js 22..."
    if ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'Number(process.versions.node.split(\".\")[0])')" -lt 22 ]]; then
        command -v curl >/dev/null 2>&1 || apt-get install -y curl ca-certificates
        curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    fi

    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        nodejs \
        redis-server \
        redis-tools \
        sudo \
        sqlite3
}

prepare_directories() {
    log "Подготовка пользователей, групп и директорий..."

    getent group vpn >/dev/null || groupadd --system vpn
    usermod -aG vpn "$SERVERUSER"

    mkdir -p "$CONFIGS_DIR" "$USERDB_DIR"
    chown -R "$SERVERUSER:vpn" "$CONFIGS_DIR" "$USERDB_DIR"
    chmod 0770 "$CONFIGS_DIR" "$USERDB_DIR"

    find "$SCRIPT_DIR" -maxdepth 1 -type f -name '*.sh' -exec chmod 0750 {} +
}

prepare_database_directory() {
    getent group vpn >/dev/null || groupadd --system vpn
    usermod -aG vpn "$SERVERUSER"
    mkdir -p "$USERDB_DIR"
    chown -R "$SERVERUSER:vpn" "$USERDB_DIR"
    chmod 0770 "$USERDB_DIR"
}

install_openvpn() {
    require_variables OVPN_SERVER

    log "Установка OpenVPN, Easy-RSA и firewall-компонентов..."
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        openvpn \
        easy-rsa \
        iptables-persistent

    mkdir -p "$OVPN_SERVER" "$OVPN_SERVER/ccd" /var/log/openvpn

    if [[ ! -d "$OVPN_SERVER/easy-rsa" ]]; then
        make-cadir "$OVPN_SERVER/easy-rsa"
    fi

    pushd "$OVPN_SERVER/easy-rsa" >/dev/null

    if [[ ! -d pki ]]; then
        ./easyrsa init-pki
    fi

    if [[ ! -f pki/ca.crt ]]; then
        EASYRSA_BATCH=1 ./easyrsa build-ca nopass
    fi

    if [[ ! -f pki/issued/server.crt || ! -f pki/private/server.key ]]; then
        EASYRSA_BATCH=1 ./easyrsa build-server-full server nopass
    fi

    ./easyrsa gen-crl

    if [[ ! -f tls-crypt.key ]]; then
        openvpn --genkey secret tls-crypt.key
    fi

    install -m 0644 pki/ca.crt "$OVPN_SERVER/ca.crt"
    install -m 0644 pki/issued/server.crt "$OVPN_SERVER/server.crt"
    install -m 0600 pki/private/server.key "$OVPN_SERVER/server.key"
    install -m 0644 pki/crl.pem "$OVPN_SERVER/crl.pem"
    install -m 0600 tls-crypt.key "$OVPN_SERVER/tls-crypt.key"

    popd >/dev/null

    cat > "$OVPN_SERVER/server.conf" <<EOF
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
ifconfig-pool-persist $OVPN_SERVER/ipp.txt
push "dhcp-option DNS 94.140.14.14"
push "dhcp-option DNS 94.140.15.15"
push "redirect-gateway def1 bypass-dhcp"
dh none
ecdh-curve prime256v1
tls-crypt $OVPN_SERVER/tls-crypt.key
crl-verify $OVPN_SERVER/crl.pem
ca $OVPN_SERVER/ca.crt
cert $OVPN_SERVER/server.crt
key $OVPN_SERVER/server.key
auth SHA256
cipher AES-128-GCM
data-ciphers AES-256-GCM:AES-128-GCM
tls-server
tls-version-min 1.2
management 127.0.0.1 7505
script-security 2
client-connect $SCRIPT_DIR/inconn.sh
client-disconnect $SCRIPT_DIR/inconn.sh
client-config-dir $OVPN_SERVER/ccd
status /var/log/openvpn/status.log
verb 3
EOF

    chmod 0640 "$OVPN_SERVER/server.conf"
    chown -R root:vpn "$OVPN_SERVER"
    chmod 0750 "$OVPN_SERVER" "$OVPN_SERVER/ccd"

    configure_openvpn_environment
    configure_network
    detect_openvpn_unit

    systemctl daemon-reload
    systemctl enable "$OPENVPN_UNIT"
    systemctl restart "$OPENVPN_UNIT"
    systemctl is-active --quiet "$OPENVPN_UNIT" || die "OpenVPN не запустился. Проверьте: systemctl status $OPENVPN_UNIT"
}

configure_existing_openvpn() {
    require_variables OVPN_SERVER
    [[ -f "$OVPN_SERVER/server.conf" ]] || die "Не найден OpenVPN-конфиг: $OVPN_SERVER/server.conf"

    log "Подключение API hooks к существующей конфигурации OpenVPN..."

    grep -qE '^[[:space:]]*script-security[[:space:]]+2([[:space:]]|$)' "$OVPN_SERVER/server.conf" ||
        printf '\nscript-security 2\n' >> "$OVPN_SERVER/server.conf"
    grep -qF "client-connect $SCRIPT_DIR/inconn.sh" "$OVPN_SERVER/server.conf" ||
        printf 'client-connect %s/inconn.sh\n' "$SCRIPT_DIR" >> "$OVPN_SERVER/server.conf"
    grep -qF "client-disconnect $SCRIPT_DIR/inconn.sh" "$OVPN_SERVER/server.conf" ||
        printf 'client-disconnect %s/inconn.sh\n' "$SCRIPT_DIR" >> "$OVPN_SERVER/server.conf"
    grep -qE '^[[:space:]]*management[[:space:]]+' "$OVPN_SERVER/server.conf" ||
        printf 'management 127.0.0.1 7505\n' >> "$OVPN_SERVER/server.conf"

    configure_openvpn_environment
    detect_openvpn_unit
    systemctl daemon-reload
    systemctl restart "$OPENVPN_UNIT"
    systemctl is-active --quiet "$OPENVPN_UNIT" || die "OpenVPN не запустился после подключения hooks."
}

configure_openvpn_environment() {
    detect_openvpn_unit
    local override_dir="/etc/systemd/system/${OPENVPN_UNIT}.d"

    mkdir -p "$override_dir"
    cat > "$override_dir/override.conf" <<EOF
[Service]
EnvironmentFile=$ENV_SERVER_FILE
EOF
}

detect_openvpn_unit() {
    if systemctl list-unit-files 'openvpn-server@.service' --no-legend 2>/dev/null | grep -q 'openvpn-server@.service'; then
        OPENVPN_UNIT="openvpn-server@server.service"
    elif systemctl list-unit-files 'openvpn@.service' --no-legend 2>/dev/null | grep -q 'openvpn@.service'; then
        OPENVPN_UNIT="openvpn@server.service"
    else
        die "Не найден systemd unit OpenVPN (openvpn-server@.service или openvpn@.service)."
    fi
}

configure_network() {
    log "Настройка IP forwarding и firewall..."

    printf 'net.ipv4.ip_forward=1\n' > /etc/sysctl.d/99-openvpn.conf
    sysctl --system >/dev/null

    local default_interface
    default_interface="$(ip route show default | awk 'NR == 1 {print $5}')"
    [[ -n "$default_interface" ]] || die "Не удалось определить основной сетевой интерфейс."

    iptables -t nat -C POSTROUTING -s 10.8.0.0/24 -o "$default_interface" -j MASQUERADE 2>/dev/null ||
        iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o "$default_interface" -j MASQUERADE
    iptables -C INPUT -p udp --dport 1194 -j ACCEPT 2>/dev/null ||
        iptables -A INPUT -p udp --dport 1194 -j ACCEPT
    iptables -C FORWARD -s 10.8.0.0/24 -j ACCEPT 2>/dev/null ||
        iptables -A FORWARD -s 10.8.0.0/24 -j ACCEPT
    iptables -C FORWARD -d 10.8.0.0/24 -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT 2>/dev/null ||
        iptables -A FORWARD -d 10.8.0.0/24 -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

    netfilter-persistent save
}

create_database() {
    log "Создание и обновление SQLite-схемы..."

    command -v sqlite3 >/dev/null 2>&1 || {
        apt-get update
        apt-get install -y sqlite3
    }

    mkdir -p "$USERDB_DIR"
    sqlite3 "$USERDB_DIR/userdb.db" <<'SQL'
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    user_type TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expired_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'inactive',
    realip TEXT NULL,
    virtualip TEXT NULL,
    connectedsince DATETIME NULL,
    bytes_received INTEGER NOT NULL DEFAULT 0,
    bytes_sent INTEGER NOT NULL DEFAULT 0
);
SQL

    chown "$SERVERUSER:vpn" "$USERDB_DIR/userdb.db"
    chmod 0660 "$USERDB_DIR/userdb.db"
}

build_backend() {
    [[ -f "$ENV_APP_FILE" ]] || die "Не найден $ENV_APP_FILE. Создайте его по шаблону .env.temp."

    log "Установка Node.js-зависимостей и сборка backend..."
    pushd "$SERVER" >/dev/null
    npm ci
    npm run build
    popd >/dev/null
}

configure_backend_service() {
    local node_binary
    node_binary="$(command -v node)"

    log "Настройка ограниченного sudo-доступа к OpenVPN-контроллеру..."
    printf '%s ALL=(root) NOPASSWD: %s\n' "$SERVERUSER" "$SCRIPT_DIR/ovpn-ctrl.sh" \
        > /etc/sudoers.d/ovpn-server-to-bot
    chmod 0440 /etc/sudoers.d/ovpn-server-to-bot
    visudo -cf /etc/sudoers.d/ovpn-server-to-bot >/dev/null ||
        die "Не удалось проверить sudoers-правило для backend."

    log "Создание systemd-сервиса backend..."
    cat > /etc/systemd/system/ovpn-server-to-bot.service <<EOF
[Unit]
Description=OpenVPN Server Controller API
After=network-online.target redis-server.service
Wants=network-online.target

[Service]
Type=simple
User=$SERVERUSER
Group=vpn
WorkingDirectory=$SERVER
EnvironmentFile=$ENV_APP_FILE
ExecStart=$node_binary $SERVER/dist/app.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

    chown "$SERVERUSER:vpn" "$ENV_APP_FILE"
    chmod 0640 "$ENV_APP_FILE"

    systemctl daemon-reload
    systemctl enable --now redis-server
    systemctl enable ovpn-server-to-bot.service
    systemctl restart ovpn-server-to-bot.service
    systemctl is-active --quiet ovpn-server-to-bot.service ||
        die "Backend не запустился. Проверьте: systemctl status ovpn-server-to-bot.service"
}

install_backend() {
    install_packages
    prepare_directories
    create_database
    build_backend
    configure_backend_service
}

choose_mode() {
    printf '\nВыберите режим установки:\n'
    select MODE in \
        "Полная установка (OpenVPN + Backend/API)" \
        "Backend/API с уже установленным OpenVPN" \
        "Только Backend/API (без изменения OpenVPN)" \
        "Только SQLite база данных" \
        "Выход"; do
        case "$REPLY" in
            1|2|3|4|5) return ;;
            *) printf 'Неверный пункт. Выберите число от 1 до 5.\n' ;;
        esac
    done
}

main() {
    require_root
    load_environment

    read -r -p "От имени какого пользователя будет работать API: " SERVERUSER
    [[ -n "$SERVERUSER" ]] || die "Имя пользователя не может быть пустым."
    export SERVERUSER

    validate_common_settings
    choose_mode

    case "$REPLY" in
        1)
            validate_backend_settings
            install_backend
            install_openvpn
            ;;
        2)
            validate_backend_settings
            install_backend
            configure_existing_openvpn
            ;;
        3)
            validate_backend_settings
            install_backend
            ;;
        4)
            require_variables USERDB_DIR
            prepare_database_directory
            create_database
            ;;
        5)
            log "Установка отменена."
            exit 0
            ;;
    esac

    log "Установка завершена успешно."
}

main "$@"
