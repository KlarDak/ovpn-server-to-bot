#!/usr/bin/bash

set -a
source "$(dirname "$0")/../.env.server"
set +a

UUID="${common_name:-}"

if ! [[ "$UUID" =~ ^[a-fA-F0-9-]{36}$ ]]; then
    exit 1
fi


handle_connection() {
  DBUSER=$(sqlite3 -separator '|' "$DB_SERVER" "SELECT COALESCE(user_type, 'user'), COALESCE(status, 'unknown') FROM users WHERE uuid = '$UUID'")

  if [ -z "$DBUSER" ]; then
    exit 1;
  fi

  IFS='|' read -r USER_TYPE STATUS <<< "$DBUSER"

  if [ "$STATUS" = "banned" ]; then
    exit 2;
  fi

  CONNECTED_AT=$(date '+%Y-%m-%d %H:%M:%S')

  REAL_IP="${trusted_ip:-}"
  VIRTUAL_IP="${ifconfig_pool_remote_ip:-}"

  if [ -z "$REAL_IP" ]; then
      exit 3;
  fi

  if [ -z "$VIRTUAL_IP" ]; then
      exit 4;
  fi

  UPDATED=$(sqlite3 "$DB_SERVER" "
        UPDATE users
        SET
            status='active',
            realip='$REAL_IP',
            virtualip='$VIRTUAL_IP',
            connectedsince='$CONNECTED_AT'
        WHERE uuid='$UUID';

        SELECT changes();
    ")


  if [ "$UPDATED" -eq 1 ]; then
      exit 0
  else
      exit 5
  fi
}

handle_disconnection() {
  UPDATED=$(sqlite3 "$DB_SERVER" "UPDATE users SET status='inactive', realip=null, virtualip=null, connectedsince=null, bytes_received=bytes_received + '$bytes_received', bytes_sent=bytes_sent + '$bytes_sent' WHERE uuid='$UUID'; SELECT changes();")

  if [ "$UPDATED" -eq 1 ]; then
    exit 0
  else
    exit 6
  fi
}

case "$script_type" in

    client-connect)
        handle_connection
        ;;

    client-disconnect)
        handle_disconnection
        ;;

    *)
        exit 1
        ;;
esac