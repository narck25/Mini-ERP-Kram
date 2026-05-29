#!/bin/sh
# ============================================================
# docker-entrypoint.sh
# Script de entrada para el contenedor Docker del backend.
# Se ejecuta como root para arreglar permisos de uploads,
# luego cambia a nodeuser para ejecutar la aplicación.
# ============================================================

set -e

echo "🔧 docker-entrypoint.sh: Arreglando permisos de /app/uploads..."

# Arreglar permisos del directorio de uploads (root puede hacerlo)
chmod -R 777 /app/uploads 2>/dev/null || true

echo "✅ Permisos de uploads configurados"

# Ejecutar migraciones y seed como root (necesita acceso a node_modules)
echo "🔧 Ejecutando migraciones Prisma..."
node scripts/resolve-migrations.js
npx prisma migrate deploy
node prisma/seed.js

echo "🔧 Cambiando a usuario nodeuser..."

# Cambiar a usuario no-root y ejecutar la aplicación
exec su-exec nodeuser "$@"
