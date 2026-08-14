# Despliegue del ERP KRAM

> **Documento de Deployment**
> *Generado: 24/06/2026*
> *Última actualización: 24/06/2026*
> *Versión: 1.0*

---

## 1. ARQUITECTURA DE DESPLIEGUE

### 1.1 Diagrama de Componentes

```
                    Internet
                       │
                  ┌────┴────┐
                  │ Traefik │  (Reverse Proxy / SSL)
                  └────┬────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
    ┌─────┴─────┐ ┌───┴────┐ ┌────┴─────┐
    │  Frontend │ │ Backend │ │PostgreSQL│
    │ Next.js   │ │ Express │ │  15-alp. │
    │ :3000     │ │ :3001   │ │ :5432    │
    └───────────┘ └───┬────┘ └──────────┘
                      │
                 ┌────┴────┐
                 │ Uploads │
                 │ (volumen)│
                 └─────────┘
```

### 1.2 Stack Tecnológico

| Componente | Tecnología | Versión | Puerto |
|------------|-----------|---------|--------|
| **Frontend** | Next.js (App Router) | 14+ | 3000 |
| **Backend** | Node.js + Express | 20-slim | 3001 |
| **Base de datos** | PostgreSQL | 15-alpine | 5432 |
| **Proxy inverso** | Traefik | Última estable | 80/443 |
| **Orquestación** | Docker Compose | 3.8 | — |
| **Plataforma** | Coolify | Última | — |
| **Email** | Resend API | — | — |

### 1.3 Dominios

| Servicio | Dominio | Proxy |
|----------|---------|-------|
| Frontend | `https://erp.kramhub.site` | Traefik → :3000 |
| Backend | `https://apierp.kramhub.site` | Traefik → :3001 |
| Base de datos | `postgres:5432` (interno) | Solo red interna Docker |

---

## 2. ENTORNOS

### 2.1 Desarrollo (Local)

**Propósito:** Desarrollo y pruebas locales.

**Requisitos:**
- Node.js 20+
- PostgreSQL 15 (local o Docker)
- npm 11+

**Inicio rápido:**

```bash
# 1. Iniciar base de datos (Docker)
docker compose up -d postgres

# 2. Configurar backend
cd backend
cp .env.example .env
# Editar .env con valores locales
npm install
npx prisma migrate dev
npm run dev

# 3. Configurar frontend (otra terminal)
cd frontend
npm install
npm run dev
```

**Archivos de inicio:**
- `start-backend.bat` — Inicia backend en Windows
- `start-frontend.bat` — Inicia frontend en Windows

### 2.2 Producción (Coolify)

**Propósito:** Entorno productivo con Docker + Coolify + Traefik.

**Características:**
- Contenedores Docker orquestados con `docker-compose.prod.yml`
- Proxy inverso Traefik con SSL automático (Let's Encrypt)
- Volúmenes persistentes para base de datos y uploads
- Health checks en todos los servicios
- Límites de recursos (CPU/memoria) por contenedor

---

## 3. FLUJO DE DESPLIEGUE

### 3.1 Proceso Paso a Paso

```
1. Git pull (obtener últimos cambios)
       │
2. Verificar cambios en schema.prisma
       │
3. Build de imágenes Docker
       │
4. Ejecutar prisma migrate deploy
       │
5. Reiniciar servicios
       │
6. Validar health checks
       │
7. Pruebas post-deploy
```

### 3.2 Comandos de Despliegue

```bash
# 1. Obtener últimos cambios
git pull origin main

# 2. Construir imágenes
docker compose -f docker-compose.prod.yml build

# 3. Iniciar servicios (o actualizar)
docker compose -f docker-compose.prod.yml up -d

# 4. Verificar logs
docker compose -f docker-compose.prod.yml logs -f

# 5. Verificar health checks
docker compose -f docker-compose.prod.yml ps
```

### 3.3 Despliegue en Coolify

Coolify automatiza el proceso de build y deploy. El flujo típico es:

1. **Push a GitHub** → Coolify detecta el cambio
2. **Coolify clona el repositorio**
3. **Build de imágenes** usando los Dockerfiles
4. **Deploy** con `docker-compose.prod.yml`
5. **Health checks** — Coolify espera a que los servicios respondan
6. **Traefik** actualiza las rutas automáticamente

> **Nota:** Coolify NO pasa las variables de entorno del servicio al `docker-compose.yml` automáticamente. Las variables deben configurarse manualmente en la UI de Coolify.

---

## 4. CHECKLIST PREDEPLOY

Antes de iniciar un despliegue, verificar:

| # | Verificación | Detalle |
|---|-------------|---------|
| ✓ | **Cambios en schema.prisma** | Si hay cambios, generar migración local y verificar que `prisma migrate deploy` funcionará |
| ✓ | **Migraciones generadas** | Ejecutar `npx prisma migrate dev` localmente y commitear la migración |
| ✓ | **Build local** | Verificar que `npm run build` funciona en frontend y backend |
| ✓ | **Variables de entorno** | Confirmar que las variables en Coolify están actualizadas |
| ✓ | **Backup de BD** | Realizar backup antes del despliegue (ver sección 9) |
| ✓ | **Seed de producción** | Si es deploy inicial, configurar `SEED_RESET=true` |
| ✓ | **Dockerfiles** | Verificar que los Dockerfiles no tengan errores de sintaxis |
| ✓ | **Puertos** | Confirmar que no hay conflictos de puertos en el host |
| ✓ | **Volúmenes** | Verificar que los volúmenes persistentes existen |
| ✓ | **Health checks** | Confirmar que los health checks están configurados |
| ✓ | **Notificar a usuarios** | Si hay downtime esperado, notificar con anticipación |

---

## 5. CHECKLIST POSTDEPLOY

Después del despliegue, validar:

| # | Verificación | Detalle |
|---|-------------|---------|
| ✓ | **Health check backend** | `curl https://apierp.kramhub.site/api/health` debe responder 200 |
| ✓ | **Health check frontend** | `curl -I https://erp.kramhub.site` debe responder 200 |
| ✓ | **Login** | Probar login con usuario ADMIN |
| ✓ | **Migraciones** | Verificar en logs que `prisma migrate deploy` se ejecutó sin errores |
| ✓ | **Uploads** | Verificar que los archivos se suben correctamente |
| ✓ | **Email** | Verificar que las notificaciones por email funcionan |
| ✓ | **Permisos** | Verificar que los módulos y accesos funcionan |
| ✓ | **Consola del navegador** | Revisar errores en F12 |
| ✓ | **Logs del servidor** | Revisar `docker compose logs` en busca de errores |
| ✓ | **Rendimiento** | Verificar tiempos de carga aceptables |

---

## 6. ROLLBACK

### 6.1 Procedimiento de Rollback

Si el despliegue falla o introduce errores críticos:

```bash
# 1. Identificar la versión anterior estable
docker images

# 2. Revertir a versión anterior
docker compose -f docker-compose.prod.yml down
# Restaurar docker-compose.prod.yml anterior si es necesario
git checkout HEAD~1 -- docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d

# 3. Revertir migraciones de Prisma (si es necesario)
# NOTA: Prisma no soporta rollback automático de migraciones.
# Si la migración nueva causó problemas:
#   Opción A: Crear una migración de reversión manual
#   Opción B: Restaurar backup de BD (ver sección 9)
#   Opción C: Usar prisma migrate resolve --rolled-back

# 4. Verificar que los servicios se recuperaron
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=50
```

### 6.2 Cuándo hacer Rollback

| Situación | Acción |
|-----------|--------|
| Error 500 en endpoints críticos | Rollback inmediato |
| Login no funciona | Rollback inmediato |
| Migración fallida con pérdida de datos | Rollback + restaurar backup |
| Rendimiento degradado > 50% | Evaluar rollback |
| Bug no crítico en módulo no esencial | Corrección en caliente, sin rollback |

---

## 7. MIGRACIONES SEGURAS

### 7.1 Reglas de Oro

1. **Nunca ejecutar `prisma migrate dev` en producción.** Usar siempre `prisma migrate deploy`.
2. **Siempre generar y probar migraciones localmente** antes de desplegar.
3. **No eliminar columnas** sin verificar que ningún código las referencia.
4. **No renombrar tablas o columnas** sin autorización explícita (rompe el frontend).
5. **Las migraciones deben ser idempotentes** — Ejecutarlas múltiples veces no debe causar errores.

### 7.2 Flujo de Migración Segura

```bash
# 1. Local: Hacer cambios en schema.prisma
# 2. Local: Generar migración
npx prisma migrate dev --name descripcion_del_cambio

# 3. Local: Verificar que la migración funciona
npx prisma migrate deploy

# 4. Commitear: schema.prisma + migración generada
git add backend/prisma/
git commit -m "feat: agregar campo X a modelo Y"

# 5. Producción: El CMD del backend ejecuta automáticamente:
#    node scripts/resolve-migrations.js
#    npx prisma migrate deploy
```

### 7.3 Resolución de Migraciones Fallidas

El backend incluye un script `scripts/resolve-migrations.js` que se ejecuta al iniciar el contenedor. Este script:

1. Verifica si hay migraciones pendientes
2. Intenta resolver migraciones fallidas automáticamente
3. Si no puede resolver, registra el error y continúa

**Si una migración falla en producción:**

```bash
# Opción 1: Resolver manualmente
docker exec -it kram-backend npx prisma migrate resolve --rolled-back "nombre_de_migracion"

# Opción 2: Forzar aplicar migración (si es segura)
docker exec -it kram-backend npx prisma migrate resolve --applied "nombre_de_migracion"

# Opción 3: Restaurar backup y corregir
# Ver sección 9 - Backup de base de datos
```

---

## 8. RIESGOS FRECUENTES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Migración fallida en producción | Media | Alto | Script de resolución automática + backup previo |
| Variables de entorno incorrectas | Media | Alto | Checklist predeploy + .env.example documentado |
| Puerto ocupado en el host | Baja | Medio | Verificar puertos en checklist predeploy |
| Volumen de BD corrupto | Baja | Crítico | Backups automáticos diarios |
| SSL caducado (Traefik) | Baja | Alto | Traefik renueva automáticamente con Let's Encrypt |
| Memoria insuficiente en contenedor | Media | Medio | Límites de recursos configurados en docker-compose.prod.yml |
| Coolify no actualiza variables de entorno | Media | Alto | Verificar variables en UI de Coolify antes de deploy |
| Seed de producción ejecutado múltiples veces | Baja | Medio | Seed diseñado como idempotente (no duplica datos) |

---

## 9. VARIABLES DE ENTORNO

### 9.1 Backend

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://user:pass@postgres:5432/kram_erp` | ✅ |
| `JWT_SECRET` | Secreto para firmar tokens JWT | `clave-segura-de-32-caracteres` | ✅ |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | `7d` | ✅ |
| `PORT` | Puerto del servidor Express | `3001` | ✅ |
| `NODE_ENV` | Entorno de ejecución | `production` | ✅ |
| `CORS_ORIGIN` | Orígenes permitidos (separados por coma) | `https://erp.kramhub.site` | ✅ |
| `BASE_URL` | URL base del backend (para enlaces en emails) | `https://apierp.kramhub.site` | ✅ |
| `TRUST_PROXY` | Nivel de confianza del proxy inverso | `1` | ✅ |
| `SERVICE_FQDN_FRONTEND` | FQDN del frontend (Coolify) | `erp.kramhub.site` | ⚠️ |
| `SERVICE_FQDN_BACKEND` | FQDN del backend (Coolify) | `apierp.kramhub.site` | ⚠️ |
| `RESEND_API_KEY` | API Key de Resend para emails | `re_...` | ⚠️ |
| `RESEND_FROM_EMAIL` | Email remitente para notificaciones | `noreply@pid.kramhub.site` | ⚠️ |
| `SEED_RESET` | Forzar reset de BD en inicio (solo deploy inicial) | `false` | ⚠️ |

### 9.2 Frontend

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `NEXT_PUBLIC_API_URL` | URL del backend (desde el navegador) | `https://apierp.kramhub.site` | ✅ |
| `NEXT_PUBLIC_ALLOWED_ORIGIN` | Origen permitido para CORS | `erp.kramhub.site` | ⚠️ |
| `NEXT_TELEMETRY_DISABLED` | Deshabilitar telemetría de Next.js | `1` | ⚠️ |

### 9.3 Base de Datos

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `DB_USER` | Usuario de PostgreSQL | `kramadmin` | ✅ |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `krampassword123` | ✅ |
| `DB_NAME` | Nombre de la base de datos | `kram_erp` | ✅ |

---

## 10. BACKUP DE BASE DE DATOS

### 10.1 Backup Manual

```bash
# Backup completo
docker exec -t kram-postgres pg_dump -U kramadmin kram_erp > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup comprimido
docker exec -t kram-postgres pg_dump -U kramadmin kram_erp | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restaurar backup
cat backup_20260624_120000.sql | docker exec -i kram-postgres psql -U kramadmin kram_erp

# Restaurar backup comprimido
gunzip -c backup_20260624_120000.sql.gz | docker exec -i kram-postgres psql -U kramadmin kram_erp
```

### 10.2 Backup Automático (Recomendado)

Configurar un cron job en el servidor para backups automáticos:

```bash
# /etc/cron.d/kram-backup
# Backup diario a las 3:00 AM
0 3 * * * root docker exec -t kram-postgres pg_dump -U kramadmin kram_erp | gzip > /backups/kram_$(date +\%Y\%m\%d).sql.gz && find /backups -name "kram_*.sql.gz" -mtime +30 -delete
```

### 10.3 Política de Retención

| Tipo | Frecuencia | Retención |
|------|------------|-----------|
| Backup diario | Cada 24h | 30 días |
| Backup semanal | Cada domingo | 3 meses |
| Backup mensual | 1ro de cada mes | 12 meses |
| Backup pre-deploy | Antes de cada despliegue | Hasta próximo deploy exitoso |

### 10.4 Verificación de Backups

```bash
# Verificar que el backup no está corrupto
head -5 backup_20260624.sql
# Debe comenzar con: -- PostgreSQL database dump

# Verificar tamaño mínimo esperado (> 1MB para BD con datos)
ls -lh backup_20260624.sql.gz

# Probar restauración en entorno de staging (si existe)
# cat backup.sql | docker exec -i kram-postgres-staging psql -U kramadmin kram_erp_staging
```

---

## 11. REFERENCIAS

| Documento | Propósito |
|-----------|-----------|
| `docker-compose.yml` | Composición Docker para desarrollo local |
| `docker-compose.prod.yml` | Composición Docker para producción (Coolify) |
| `backend/Dockerfile` | Dockerfile del backend (multi-stage) |
| `frontend/Dockerfile` | Dockerfile del frontend (multi-stage) |
| `backend/.env.example` | Plantilla de variables de entorno del backend |
| `backend/scripts/resolve-migrations.js` | Script de resolución automática de migraciones |
| `docs/TESTING.md` | Estrategia de pruebas y checklist post-deploy |
| `.clinerules` | Reglas maestras del sistema |

---

*Fin del documento — Despliegue del ERP KRAM*
