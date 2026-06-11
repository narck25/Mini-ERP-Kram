# ============================================================
# STAGE 1: Builder - Instalar dependencias y construir
# ============================================================
# ARG BUILD_DATE para invalidar caché de Docker en Coolify
ARG BUILD_DATE
FROM node:20-slim AS builder

# Instalar herramientas necesarias para compilación nativa (sharp, etc.)
RUN apt-get update -qq && \
    apt-get install -y -qq \
      python3 \
      make \
      g++ \
      && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar solo package.json y package-lock.json primero (caching)
COPY package*.json ./

# Actualizar npm a la versión 11 para compatibilidad con lockfileVersion 3
# (el lockfile fue generado con npm 11 y npm 10.x de node:20-slim no lo resuelve bien)
RUN npm install -g npm@11

# Instalar TODAS las dependencias (incluyendo devDependencies para build)
RUN npm install --include=dev --no-audit --no-fund

# Copiar el resto del código fuente
COPY . .

# Variables de entorno para el build
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Deshabilitar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Build de producción
# NOTA: Se ejecuta directamente para que Coolify/BuildKit capture el error real
RUN npm run build

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
