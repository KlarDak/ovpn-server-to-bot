#!/usr/bin/env bash

ACTION=$1
UUID=$2
USERDB=$3
FEEDBACK_FILE=$4

if [ ! -n ACTION ] && [ ! -n UUID ]; then
  exit 1;
fi

if [ ACTION = "kick" ]; then
  echo "client-kill $UUID" | nc 127.0.0.1 7505
  sqlite3 $USERDB "UPDATE users SET status = inactive WHERE uuid = '$UUID';" &
  exit 0;
fi

if [ ACTION = "ban" ]; then
  echo "client-kill $UUID" | nc 127.0.0.1 7505
  sqlite3 $USERDB "UPDATE users SET status = banned WHERE uuid = '$UUID';" &
  node $FEEDBACK_FILE $ACTION $UUID
  exit 0;
fi

if [ ACTION = "pardon" ]; then
    sqlite3 $USERDB "UPDATE users SET status = inactive WHERE uuid = '$UUID';" &
    node $FEEDBACK_FILE $ACTION $UUID
    exit 0;
fi