#!/usr/bin/env bash

OVPN_DIR="/etc/openvpn"
BACKUPS_DIR="/home/vpnserver"
DIRS=(
"$OVPN_DIR/ca.crt"
"$OVPN_DIR/dh.pem"
"$OVPN_DIR/server.conf"
"$OVPN_DIR/server.crt"
"$OVPN_DIR/server.key"
"$OVPN_DIR/ta.key"
"$OVPN_DIR/easy-rsa/ta.key"
"$OVPN_DIR/easy-rsa/vars"
"$OVPN_DIR/easy-rsa/pki"
"$OVPN_DIR/easy-rsa/openssl-easyrsa.cnf"
)

echo "Создание резервной копии..."
tar -czvf "$BACKUPS_DIR/vpn_backups.tar.gz" "${DIRS[@]}"
echo "Резервная копия создана..."
