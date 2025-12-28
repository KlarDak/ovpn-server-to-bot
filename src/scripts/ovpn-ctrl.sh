#!/bin/bash

# exec 2>/dev/null

cd /etc/openvpn/easy-rsa
CLIENTS_DIR="/home/vpnserver/tests"

ACTION=$1
USER=$2

if [ -z "$USER" ] || [ -z "$ACTION" ]; then 
    exit 1;
fi

if [[ ! "$USER" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    exit 1;
fi

CA="/etc/openvpn/easy-rsa/pki/ca.crt"
TLS="/etc/openvpn/ta.key"

CERT="/etc/openvpn/easy-rsa/pki/issued/$USER.crt"
KEY="/etc/openvpn/easy-rsa/pki/private/$USER.key"
REQS="/etc/openvpn/easy-rsa/pki/reqs/$USER.req" # FOR CHECK AND CLEAR

OUT="$CLIENTS_DIR/$USER.ovpn"
TEMPLATE="/etc/openvpn/client/test.conf"

if [ "$ACTION" = "create" ]; then 
    if [ -f "$REQS" ]; then
        exit 1;
    fi

    ./easyrsa build-client-full $USER nopass
    
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
    "$TEMPLATE" > "$OUT"

    if [ ! -f "$OUT" ]; then
        exit 1;
    fi
fi

if [ "$ACTION" = "revoke" ]; then
    if [ ! -f "$REQS" ]; then
        exit 1;
    fi

    rm $CERT $KEY $REQS

    exit 0;
fi
