# ============================================================
# STAGE 1: Builder - Instalar dependencias y construir
# ============================================================
# ARG BUILD_DATE para invalidar caché de Docker en Coolify
ARG BUILD_DATE
FROM node:20-alpine AS builder

# Instalar herramientas necesarias para sharp en Alpine
RUN apk add --no-cache --virtual .gyp \
  python3 \
  make \
  g++ \
  vips-dev \
  && rm -rf /var/cache/apk/*

WORKDIR /app

# Copiar solo package.json y package-lock.json primero (caching)
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para build)
# NOTA: Usamos npm install en vez de npm ci porque el lockfile
# fue generado con npm 11 (lockfileVersion 3) y en Docker
# puede haber incompatibilidades menores de versión.
RUN npm cache clean --force && \
    npm install --include=dev --no-audit --no-fund

# Copiar el resto del código fuente
COPY . .

# Variables de entorno para el build
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Deshabilitar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Build de producción
RUN npm run build 2>&1 || (echo "❌ BUILD FAILED - see logs above" && exit 1)

# ============================================================
# STAGE 2: Runner - Solo lo necesario para producción
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Variables de entorno
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar solo lo necesario desde builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.js ./

# Copiar .next y node_modules (con sharp ya compilado)
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Establecer permisos correctos (solo archivos de la app, no node_modules)
RUN chown -R nextjs:nodejs /app/.next /app/public /app/package*.json /app/next.config.js

# Usar usuario no-root
USER nextjs

# Puerto de la aplicación
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Iniciar Next.js en modo producción
CMD ["npm", "start"]
