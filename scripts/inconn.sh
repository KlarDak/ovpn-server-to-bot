#!/usr/bin/bash

set -a
source "$(dirname "$0")/../.env.server"
set +a

UUID="$common_name"

IS_BANNED=$(sqlite3 "$DB_SERVER" "SELECT status FROM users WHERE uuid = '$UUID' LIMIT 1;")

if [ "$IS_BANNED" = "banned" ]; then
  exit 1;
else
  exit 0;
fi;