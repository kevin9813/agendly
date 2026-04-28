#!/bin/bash

# Script para limpiar completamente los contenedores de Podman y reiniciar
# Uso: ./clean-and-rebuild.sh [dev|prod]

MODE=${1:-dev}

echo "🧹 Limpiando contenedores y volúmenes de Podman..."

# Detener todos los contenedores del proyecto
podman compose -f podman-compose.${MODE}.yml down -v 2>/dev/null
podman compose -f podman-compose.yml down -v 2>/dev/null

# Eliminar contenedores específicos por si acaso
podman rm -f db db_dev web web_dev frontend frontend_dev frontend-public frontend-public_dev 2>/dev/null

# Limpiar redes
podman network prune -f 2>/dev/null

echo "✅ Limpieza completada"
echo "🚀 Reiniciando con modo: $MODE"

if [ "$MODE" = "dev" ]; then
    echo "📝 Usando podman-compose.dev.yml (desarrollo con hot reload)"
    podman compose -f podman-compose.dev.yml up --build
    podman exec -it web_dev python manage.py makemigrations core
    podman exec -it web_dev python manage.py migrate
    podman restart web_dev
else
    echo "📝 Usando podman-compose.yml (producción)"
    podman compose -f podman-compose.yml up --build
fi
