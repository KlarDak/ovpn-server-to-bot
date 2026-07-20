#!/bin/bash

set -a
source "$(dirname "$0")/../.env.server"
set +a

if [ "$EUID" -ne 0 ]; then
    echo "Скрипт должен быть запущен от root"
    exit 1
fi

set_server() {
    echo "[*] Настройка внутренней системы..."

    chmod +x *.sh

    if ! getent group vpn >/dev/null; then
        groupadd vpn
    fi
    usermod -aG vpn nobody
    mkdir -p "$CONFIGS_DIR"
    mkdir -p "$USERDB_DIR"

    chown -R $SERVERUSER:vpn "$CONFIGS_DIR"
    chown -R $SERVERUSER:vpn "$USERDB_DIR"

    chmod -R 770 "$CONFIGS_DIR"
    chmod -R 770 "$USERDB_DIR"
}

install_server() {
    echo "[*] Настройка OpenVPN..."
    apt update
    apt install -y openvpn easy-rsa

    make-cadir "$OVPN_SERVER/easy-rsa"
    cd "$OVPN_SERVER"/easy-rsa

    ./easyrsa init-pki
    ./easyrsa --batch build-ca nopass
    ./easyrsa --batch build-server-full server nopass
    ./easyrsa gen-dh
    openvpn --genkey secret ta.key

    cp pki/ca.crt "$OVPN_SERVER"
    cp pki/issued/server.crt "$OVPN_SERVER"
    cp pki/private/server.key "$OVPN_SERVER"
    cp pki/db.pem "$OVPN_SERVER"
    cp ta.key "$OVPN_SERVER"

    cat > "$OVPN_SERVER/server.conf" << EOL
    port 1194
proto udp
dev tun
# dev tap
topology subnet
user nobody
group vpn
persist-key
persist-tun
keepalive 10 120
# topology subnet
server 10.8.0.0 255.255.255.0
# server-bridge 10.0.0.1 255.255.255.0 10.0.0.50 10.0.0.100
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

client-connect "$SERVER"/scripts/inconn.sh
client-disconnect "$SERVER"/scripts/inconn.sh
client-config-dir "$OVPN_SERVER"/ccd
status /var/log/openvpn/status.log
verb 3
EOL;

echo "net.ipv4.ip_forward=1" > /etc/sysctl.d/99-openvpn.conf

sysctl -p /etc/sysctl.d/99-openvpn.conf

DEFAULT_INTERFACE=$(ip route | awk '/default/ {print $5; exit}')

iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o "$DEFAULT_INTERFACE" -j MASQUERADE

iptables -A INPUT -p udp --dport 1194 -j ACCEPT 

apt install iptables-persistent
iptables-persistent save

systemctl enable openvpn@server
systemctl restart openvpn@server
}

create_apps() {
    echo "[*] Установка окружения сервера..."

    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt install -y nodejs
    apt install -y sqlite3 redis npm
    npm install -g pm2

    systemctl enable redis-server
    systemctl restart redis-server
}

set_all_settings() {
    echo "[*] Настройка базы данных..."

    sqlite3 "$USERDB_DIR/userdb.db" "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid TEXT UNIQUE NOT NULL, user_type TEXT NOT NULL, created_at TEXT NOT NULL, expired_time TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'inactive', realip TEXT NULL, virtualip TEXT NULL, connectedsince DATETIME NULL, bytes_received INTEGER NOT NULL DEFAULT 0, bytes_sent INTEGER NOT NULL DEFAULT 0);"
    chown $SERVERUSER:vpn "$USERDB_DIR/userdb.db"

    cd "$SERVER"

    npm run build
}

echo "Скрипт запущен!"

echo "Для запуска скрипта необходимо заполнить файлы .env и .env.server по шаблонам из файлов .env.temp и .env.server.temp соответственно."

read -p "От какого имени пользователя будет работать система: " SERVERUSER
echo

select MODE in \
    "Полная установка (OpenVPN + Easy-RSA + Backend)" \
    "Настройка с уже установленным OpenVPN" \
    "Настройка только Backend/API"; do

    case $REPLY in

        1)
            echo "Выбрана полная установка"
            FULL_INSTALL=true
            break
            ;;

        2)
            echo "Выбрана настройка OpenVPN окружения"
            OPENVPN_ONLY=true
            break
            ;;

        3)
            echo "Выбрана установка Backend"
            BACKEND_ONLY=true
            break
            ;;

        *)
            echo "Неверный пункт"
            ;;
    esac
done

if [ "$FULL_INSTALL" = true ]; then
    set_server
    install_server
    create_apps
    set_all_settings
fi


if [ "$OPENVPN_ONLY" = true ]; then
    set_server
    create_apps
    set_all_settings
fi


if [ "$BACKEND_ONLY" = true ]; then
    set_server
    set_all_settings
fi

echo "Настройка сервера полностью завершена!"

exit 0