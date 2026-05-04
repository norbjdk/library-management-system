#!/bin/sh
set -eu

db_name="${POSTGRES_DB:-${DB_NAME:-projekt_db}}"
db_user="${POSTGRES_USER:-${DB_USER:-projekt_user}}"
db_password="${POSTGRES_PASSWORD:-${DB_PASSWORD:-projekt_password}}"
db_host="${DB_HOST:-db}"
db_port="${DB_PORT:-5432}"
seed_file="${SEED_DATA_FILE:-/seed/data.sql}"

until pg_isready -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" >/dev/null 2>&1; do
  sleep 1
done

python manage.py migrate --noinput

if [ -f "$seed_file" ]; then
  user_count="$(PGPASSWORD="$db_password" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -tAc "SELECT COUNT(*) FROM users;")"
  if [ "$user_count" = "0" ]; then
    PGPASSWORD="$db_password" psql -v ON_ERROR_STOP=1 -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -f "$seed_file"
  fi
fi

exec python manage.py runserver 0.0.0.0:8000
