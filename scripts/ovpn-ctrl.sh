#!/bin/bash

set -a
source "$(dirname "$0")/../.env.server"
set +a

if [ "$EUID" -ne 0 ]; then
    echo "Run as root";
    exit 1;
fi;

ACTION=$1
USER=$2

if [ -z "$USER" ] || [ -z "$ACTION" ]; then
    exit 1;
fi

if [[ ! "$USER" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    exit 2;
fi

CA="$OVPN_SERVER/ca.crt"
TLS="$OVPN_SERVER/ta.key"

CERT="$OVPN_SERVER/easy-rsa/pki/issued/$USER.crt"
KEY="$OVPN_SERVER/easy-rsa/pki/private/$USER.key"
REQS="$OVPN_SERVER/easy-rsa/pki/reqs/$USER.req" # FOR CHECK AND CLEAR
OUT="$CONFIGS_DIR/$USER.ovpn"

cd "${OVPN_SERVER}/easy-rsa"

if [ "$ACTION" = "create" ]; then
    if [ -f "$REQS" ]; then
        exit 3;
    fi

    ./easyrsa --batch build-client-full $USER nopass
    ./easyrsa gen-crl
    cp pki/crl.pem $OVPN_SERVER

    sed \
    -e "/^{CA_CERT}$/{
        r $CA
        d
    }" \
    -e "/^{CLIENT_CERT}$/{
        r $CERT
        d
    }" \
    -e "/^{CLIENT_KEY}$/{
        r $KEY
        d
    }" \
    -e "/^{TLS_KEY}$/{
        r $TLS
        d
    }" \
    "$TEMP_FILE" > "$OUT"

    if [ ! -f "$OUT" ]; then
        exit 4;
    fi
fi

if [ "$ACTION" = "update" ]; then
    if [ ! -f "$REQS" ]; then
        exit 3;
    fi

    rm "$OUT"

    sed \
    -e "/^{CA_CERT}$/{
        r $CA
        d
    }" \
    -e "/^{CLIENT_CERT}$/{
        r $CERT
        d
    }" \
    -e "/^{CLIENT_KEY}$/{
        r $KEY
        d
    }" \
    -e "/^{TLS_KEY}$/{
        r $TLS
        d
    }" \
    "$TEMP_FILE" > "$OUT"

    if [ ! -f "$OUT" ]; then
        exit 4;
    fi
fi

if [ "$ACTION" = "revoke" ]; then
    if [ ! -f "$REQS" ]; then
        exit 3;
    fi

    rm "$OUT";
    cd "${OVPN_SERVER}/easy-rsa/";

    IS_BANNED=$(sqlite3 "$DB_SERVER" "SELECT status FROM users WHERE uuid = '$USER' LIMIT 1;");

    ./easyrsa --batch revoke $USER
    ./easyrsa gen-crl
    cp -f pki/crl.pem "$OVPN_SERVER"

    exit 0;
fi

# 0 - Success
# 1 - Error with arguments
# 2 - Error with uuid argument
# 3 - File not found
# 4 - File not created
