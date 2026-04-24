#!/bin/sh

echo "⏳ Esperando a PostgreSQL..."

while ! nc -z db 5432; do
  sleep 1
done

echo "✅ PostgreSQL listo!"

cd /app
python manage.py migrate
python manage.py collectstatic --noinput

echo "🚀 Iniciando Gunicorn..."

gunicorn agendly.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120 --log-level info
