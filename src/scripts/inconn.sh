#!/usr/bin/bash

UUID="$common_name"
ADDRESS="/srv/ovpn-server-to-bot/userdb/userdb.db"

IS_BANNED=$(sqlite3 "$ADDRESS" "SELECT status FROM users WHERE uuid = '$UUID' LIMIT 1;")

if [ "$IS_BANNED" = "banned" ]; then
  exit 1;
else
  exit 0;
fi;