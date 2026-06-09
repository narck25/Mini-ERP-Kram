# ============================================================
# STAGE 1: Builder - Instalar dependencias y generar Prisma
# ============================================================
# ARG BUILD_DATE para invalidar caché de Docker en Coolify
ARG BUILD_DATE
FROM node:20-slim AS builder

# Instalar OpenSSL para Prisma PostgreSQL connection
RUN apt-get update -qq && \
    apt-get install -y -qq openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar package files y Prisma schema
COPY package*.json ./
COPY prisma ./prisma

# Instalar dependencias (postinstall ejecutará prisma generate)
# NOTA: Usamos npm install en vez de npm ci porque el lockfile
# fue generado con npm 11 (lockfileVersion 3) y en Docker
# puede haber incompatibilidades menores de versión.
RUN npm cache clean --force && \
    npm install --no-audit --no-fund

# Verificar que Prisma Client se generó correctamente
RUN test -d node_modules/.prisma/client || (echo "ERROR: Prisma Client no generado" && exit 1)

# Copiar código fuente y scripts
COPY src ./src
COPY scripts ./scripts

# ============================================================
# STAGE 2: Runner - Solo lo necesario para producción
# ============================================================
FROM node:20-slim AS runner

# Instalar OpenSSL para Prisma y curl para healthcheck
RUN apt-get update -qq && \
    apt-get install -y -qq openssl ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

# Copiar desde builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/prisma ./prisma

# Crear directorios de uploads con permisos 777
# NOTA: Se ejecuta como root para que el volumen persistente funcione
RUN mkdir -p /app/uploads/cvs \
             /app/uploads/employee-documents \
             /app/uploads/psych-tests \
             /app/uploads/purchase-quotes \
             /app/uploads/temp \
             /app/uploads/photos && \
    chmod -R 777 /app/uploads

# Variables de entorno para Resend (notificaciones por email)
# Se pueden sobreescribir en Coolify
ENV RESEND_API_KEY=""
ENV RESEND_FROM_EMAIL="noreply@pid.kramhub.site"

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Comando de inicio: resolver migraciones fallidas, migraciones, seed de producción y servidor
# Si SEED_RESET=true, el seed limpiará toda la BD antes de recrear roles y admin
CMD echo "🔧 SEED_RESET=${SEED_RESET:-false}" && \
    node scripts/resolve-migrations.js && \
    npx prisma migrate deploy && \
    echo "🌱 Ejecutando seed de producción..." && \
    node prisma/seed-prod.js && \
    echo "🚀 Iniciando servidor..." && \
    node src/index.js
