#!/bin/bash

set -a
source "$(dirname "$0")/../.env.server"
set +a

sqlite3 "$DB_SERVER" "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid TEXT NOT NULL, user_type TEXT NOT NULL, created_at TEXT NOT NULL, expired_time TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'inactive', realip TEXT NULL, virtualip TEXT NULL, connectedsince DATETIME NULL, bytes_received INTEGER NOT NULL DEFAULT 0, bytes_sent INTEGER NOT NULL DEFAULT 0)