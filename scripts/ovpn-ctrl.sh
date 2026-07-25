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
TLS="$OVPN_SERVER/tls-crypt.key"

CERT="$OVPN_SERVER/easy-rsa/pki/issued/$USER.crt"
KEY="$OVPN_SERVER/easy-rsa/pki/private/$USER.key"
REQS="$OVPN_SERVER/easy-rsa/pki/reqs/$USER.req" # FOR CHECK AND CLEAR
OUT="$CONFIGS_DIR/$USER.ovpn"

is_valid_ipv4() {
    local ip="$1"
    local octet
    local -a octets

    IFS='.' read -r -a octets <<< "$ip"
    [ "${#octets[@]}" -eq 4 ] || return 1

    for octet in "${octets[@]}"; do
        [[ "$octet" =~ ^[0-9]+$ ]] || return 1
        ((10#$octet >= 0 && 10#$octet <= 255)) || return 1
    done
}

detect_public_ipv4() {
    local service
    local detected_ip

    command -v curl >/dev/null 2>&1 || return 1

    for service in \
        "https://api.ipify.org" \
        "https://ifconfig.me/ip" \
        "https://icanhazip.com"; do
        detected_ip="$(curl -4fsS --connect-timeout 3 --max-time 5 "$service" 2>/dev/null)"
        detected_ip="${detected_ip//[[:space:]]/}"

        if is_valid_ipv4 "$detected_ip"; then
            printf '%s\n' "$detected_ip"
            return 0
        fi
    done

    return 1
}

resolve_server_host() {
    if [ -n "${OVPN_PUBLIC_HOST:-}" ]; then
        if [[ ! "$OVPN_PUBLIC_HOST" =~ ^[a-zA-Z0-9.-]+$ ]]; then
            echo "Invalid OVPN_PUBLIC_HOST value" >&2
            return 1
        fi

        printf '%s\n' "$OVPN_PUBLIC_HOST"
        return 0
    fi

    detect_public_ipv4
}

SERVER_HOST=""
if [ "$ACTION" = "create" ] || [ "$ACTION" = "update" ]; then
    SERVER_HOST="$(resolve_server_host)" || {
        echo "Unable to determine public server IPv4. Set OVPN_PUBLIC_HOST in .env.server." >&2
        exit 5
    }
fi

cd "${OVPN_SERVER}/easy-rsa"

if [ "$ACTION" = "create" ]; then
    if [ -f "$REQS" ]; then
        exit 3;
    fi

    ./easyrsa --batch build-client-full $USER nopass
    ./easyrsa gen-crl
    cp pki/crl.pem $OVPN_SERVER

    sed \
    -e "s|{SERVER_HOST}|$SERVER_HOST|g" \
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
    -e "s|{SERVER_HOST}|$SERVER_HOST|g" \
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
# 5 - Public server address not found
