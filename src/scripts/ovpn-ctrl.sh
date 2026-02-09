#!/bin/bash

# exec 2>/dev/null

cd /etc/openvpn/easy-rsa
CLIENTS_DIR=$3

ACTION=$1
USER=$2

if [ -z "$USER" ] || [ -z "$ACTION" ]; then 
    exit 1;
fi

if [[ ! "$USER" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    exit 2;
fi

CA="/etc/openvpn/easy-rsa/pki/ca.crt"
TLS="/etc/openvpn/ta.key"

CERT="/etc/openvpn/easy-rsa/pki/issued/$USER.crt"
KEY="/etc/openvpn/easy-rsa/pki/private/$USER.key"
REQS="/etc/openvpn/easy-rsa/pki/reqs/$USER.req" # FOR CHECK AND CLEAR

OUT="$CLIENTS_DIR/$USER.ovpn"
TEMPLATE="/etc/openvpn/client/test.conf"

create() {
    if [ -f "$REQS" ]; then
        exit 3;
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
        exit 4;
    fi
}

delete() {
    if [ ! -f "$REQS" ]; then
        exit 3;
    fi

    rm $CERT $KEY $REQS

    exit 0;
}

if [ "$ACTION" = "create" ]; then 
    exit create
fi

if [ "$ACTION" = "delete" ]; then
    exit delete
fi

if [ "$ACTION" = "update" ]; then 
    delete
    exit create
fi

# 0 - Success
# 1 - Error with arguments
# 2 - Error with uuid argument
# 3 - File not found
# 4 - File not created