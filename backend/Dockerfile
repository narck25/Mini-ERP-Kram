# ============================================================
# STAGE 1: Builder - Instalar dependencias y generar Prisma
# ============================================================
FROM node:18-alpine AS builder

# Instalar OpenSSL para Prisma PostgreSQL connection
RUN apk add --no-cache openssl

WORKDIR /app

# Copiar package files y Prisma schema
COPY package*.json ./
COPY prisma ./prisma

# Instalar dependencias (postinstall ejecutará prisma generate)
# NOTA: --only=production=false es obsoleto en npm 9+, usar --include=dev
RUN npm ci --include=dev --no-audit --no-fund

# Copiar código fuente
COPY src ./src

# ============================================================
# STAGE 2: Runner - Solo lo necesario para producción
# ============================================================
FROM node:18-alpine AS runner

# Instalar OpenSSL para Prisma y curl para healthcheck
RUN apk add --no-cache openssl curl

WORKDIR /app

ENV NODE_ENV=production

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeuser

# Copiar desde builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

# Crear directorios de uploads
RUN mkdir -p uploads/cvs uploads/employee-documents uploads/psych-tests uploads/purchase-quotes uploads/temp uploads/photos

# Establecer permisos
RUN chown -R nodeuser:nodejs /app

# Usar usuario no-root
USER nodeuser

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Comando de inicio: migraciones, seed y servidor
CMD npx prisma migrate deploy && node prisma/seed.js && node src/index.js
