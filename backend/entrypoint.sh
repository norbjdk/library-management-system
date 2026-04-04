#!/bin/sh
set -eu

db_name="${POSTGRES_DB:-${DB_NAME:-projekt_db}}"
db_user="${POSTGRES_USER:-${DB_USER:-projekt_user}}"
db_host="${DB_HOST:-db}"
db_port="${DB_PORT:-5432}"

echo "Waiting for database..."
until pg_isready -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" >/dev/null 2>&1; do
  sleep 1
done

echo "Applying migrations..."
python manage.py migrate --noinput

echo "Starting Django development server..."
exec python manage.py runserver 0.0.0.0:8000
