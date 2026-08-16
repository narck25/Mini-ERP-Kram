# Manual de Despliegue — ERP KRAM

> Cómo desplegar el ERP en local y en producción (Coolify).

## 1. Arquitectura de despliegue

```mermaid
flowchart LR
    DNS[erp.kramhub.site] -->|HTTPS| TRAEFIK[Traefik / Coolify]
    TRAEFIK --> FE[frontend :3000]
    TRAEFIK --> BE[backend :3001]
    BE --> DB[(postgres :5432)]
```

- **Frontend**: sirve la UI y hace proxy (rewrites) de `/api` al backend.
- **Backend**: API + archivos estáticos (`/uploads`) + scheduler.
- **PostgreSQL**: volumen persistente `postgres_data`.

## 2. Requisitos

- Docker + Docker Compose (o Coolify).
- Variables de entorno (ver tabla).
- Dominios: `erp.kramhub.site` (front), `apierp.kramhub.site` (back).

## 3. Despliegue local con Docker

```bash
# 1. Configurar variables
cp backend/.env.example backend/.env   # editar DATABASE_URL, JWT_SECRET

# 2. Levantar todo
docker-compose -f docker-compose.prod.yml up -d --build
```

Esto construye backend y frontend y levanta PostgreSQL.

## 4. Despliegue en producción (Coolify)

1. Crear un servicio por imagen (`backend/`, `frontend/`) usando sus Dockerfiles.
2. Configurar las variables de entorno en Coolify (ver tabla).
3. Pasar `BUILD_DATE` con un valor único en cada deploy para invalidar la caché de Docker.
4. Enrutar dominios vía Traefik (Coolify lo hace automático):
   - `erp.kramhub.site` → frontend
   - `apierp.kramhub.site` → backend
5. El backend ejecuta en su arranque (`CMD` del Dockerfile):
   - `node scripts/resolve-migrations.js` (resuelve migraciones fallidas)
   - `npx prisma migrate deploy` (aplica migraciones pendientes)
   - `node src/index.js`

> **Migraciones**: se aplican automáticamente en cada arranque. No se requiere paso manual.

## 5. Variables de entorno (backend)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión PostgreSQL | `postgresql://user:pass@postgres:5432/kram_erp` |
| `JWT_SECRET` | Secreto para firmar JWT | valor largo y aleatorio |
| `JWT_EXPIRES_IN` | Expiración del token | `7d` |
| `PORT` | Puerto del backend | `3001` |
| `NODE_ENV` | Entorno | `production` |
| `CORS_ORIGIN` | Orígenes permitidos (coma) | `https://erp.kramhub.site` |
| `BASE_URL` | URL pública del backend | `https://apierp.kramhub.site` |
| `TRUST_PROXY` | Nivel de trust proxy | `1` |
| `SERVICE_FQDN_FRONTEND` | FQDN del frontend | `erp.kramhub.site` |
| `SERVICE_FQDN_BACKEND` | FQDN del backend | `apierp.kramhub.site` |
| `RESEND_API_KEY` | API key de Resend | `re_...` |
| `RESEND_FROM_EMAIL` | Remitente de emails | `noreply@pid.kramhub.site` |
| `UPLOAD_DIR` | Directorio de uploads (opcional) | `/app/uploads` |

**Frontend**: `NEXT_PUBLIC_API_URL` (por defecto `http://backend:3001` en Docker), `NEXT_PUBLIC_ALLOWED_ORIGIN`.

## 6. Volúmenes y persistencia

| Volumen | Contenido | Riesgo si se pierde |
|---|---|---|
| `postgres_data` | Base de datos | Pérdida total de datos |
| `backend_uploads` | CVs, documentos, fotos, cotizaciones | Archivos adjuntos |

> Ambos volúmenes deben persistir entre deploys. Ver `docs/OPERACIONES.md` para respaldos.

## 7. CI/CD

- `.github/workflows/backend-ci.yml`: instala dependencias, genera Prisma, ejecuta tests del backend.
- `.github/workflows/frontend-ci.yml`: build de Next.js + lint.
- El deploy final lo orquesta Coolify (o Docker Compose manual).

## 8. Verificación post-deploy

1. `GET https://apierp.kramhub.site/api/health` → `{ status: 'OK' }`.
2. El frontend carga en `https://erp.kramhub.site`.
3. Login con una cuenta válida.
4. Verificar subida de archivos (foto de empleado, CV).
5. Verificar emails (notificaciones) si aplica.
