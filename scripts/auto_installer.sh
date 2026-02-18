#!/usr/bin/bash

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit
fi

if [ $1 = "install" ]; then
  apt update && apt upgrade -y
  apt install openvpn easy-rsa -y
  
  make-cadir /etc/openvpn/easy-rsa
  cd /etc/openvpn/easy-rsa
  
  # Инициализация PKI и генерация сертификатов
  ./easyrsa init-pki
  echo -ne "\n\n\n\n\n\n\n\n" | ./easyrsa build-ca nopass
  echo -ne "\n\n\n\n\n\n\n\n" | ./easyrsa gen-req server nopass
  echo "yes" | ./easyrsa sign-req server server
  
  # Генерация Diffie-Hellman параметров и TLS-auth ключа
  ./easyrsa gen-dh
  openvpn --genkey --secret ta.key
fi

if [ $1 = "config" ]; then

    if [$2 = "auto"]; then
        IPADDRESS="10.8.0.0"
    else
        IPADDRESS=$2
    fi

    if [ -z "$IPADDRESS" ]; then
        echo "IP address not provided and could not be automatically detected. Please provide an IP address as an argument."
        exit 1
    fi

    if [$3 = "auto"]; then
        PORT=1194
    else
        PORT=$3
    fi

    if [$4 = "auto"]; then
        PROTOCOL="udp"
    else
        PROTOCOL=$4
    fi

    if [$5 = "auto"]; then
        DIRS='/etc/openvpn/'
    else 
        DIRS=$5
    fi
  cat > /etc/openvpn/server.conf <<EOL
# Порт и протокол
port $PORT
proto $PROTOCOL

# Сеть для VPN-клиентов
dev tun
server $IPADDRESS 255.255.255.0

# Путь к ключам и сертификатам сервера
ca $DIRS/easy-rsa/pki/ca.crt
cert $DIRS/pki/issued/server.crt
key $DIRS/pki/private/server.key
dh $DIRS/pki/dh.pem

# TLS-auth (опционально, повышает защиту)
tls-auth $DIRS/ta.key 0

# Сетевая маршрутизация
push "redirect-gateway def1 bypass-dhcp"
push "dhcp-option DNS 8.8.8.8"
push "dhcp-option DNS 8.8.4.4"

# Лог и статус
status /var/log/openvpn-status.log
log-append /var/log/openvpn.log
verb 3

# Management interface
management 127.0.0.1 7505

# Управление через скрипты
script-security 2
client-connect /srv/ovpn-server-to-bot/src/scripts/inconn.sh

# Безопасность
user nobody
group nogroup
persist-key
persist-tun
keepalive 10 120
cipher AES-256-CBC
auth SHA256
EOL
fi