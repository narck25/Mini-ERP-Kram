# Manual de Operaciones — ERP KRAM

> Tareas de operación diaria: migraciones, seed, respaldos y monitoreo.

## 1. Migraciones de base de datos

### Desarrollo
```bash
cd backend
npx prisma migrate dev --name <nombre>   # crea y aplica migración
```

### Producción
Las migraciones se aplican **automáticamente** al arrancar el contenedor (`npx prisma migrate deploy` en el `CMD` del Dockerfile).

Manual (si se requiere):
```bash
docker exec -it kram-backend npx prisma migrate deploy
```

### Migraciones fallidas
- En arranque se ejecuta `node scripts/resolve-migrations.js` para resolver migraciones con problemas.
- Ver `docs/TROUBLESHOOTING.md` para casos comunes.

## 2. Seed

| Comando | Uso |
|---|---|
| `npm run prisma:seed` | Seed de desarrollo (datos de ejemplo) |
| `npm run prisma:seed-prod` | Seed de producción (idempotente, solo crea lo que falta) |
| `npm run prisma:seed-reset` | Seed de producción con reset total |

### Reset desde la API (recomendado en Coolify)
```
POST /api/seed/reset   (Authorization: Bearer <token_admin>, body: {"confirm": true})
```
Solo ADMIN. Elimina todos los datos y recrea roles + admin (`admin@kram.com / password123`).

## 3. Respaldos (backup)

### Backup de PostgreSQL
```bash
docker exec kram-postgres pg_dump -U kramadmin -d kram_erp -F c -f /tmp/backup.dump
docker cp kram-postgres:/tmp/backup.dump ./backup-$(date +%F).dump
```

### Restauración
```bash
docker cp ./backup-2026-01-01.dump kram-postgres:/tmp/backup.dump
docker exec kram-postgres pg_restore -U kramadmin -d kram_erp --clean --if-exists /tmp/backup.dump
```

### Backup de archivos (uploads)
```bash
docker cp kram-backend:/app/uploads ./uploads-backup-$(date +%F)
```

### Frecuencia y retención recomendadas
- **Diaria** (incremental): `pg_dump` programado (cron del host o Coolify).
- **Semanal** (completa): dump + archivos `uploads`.
- **Mensual**: verificación de restauración en entorno de pruebas.
- **Retención**: 30 días de backups diarios, 6 meses de semanales.

## 4. Scheduler (cron)

El backend ejecuta `checkAndNotify()` todos los días a las **8:00 AM** (node-cron) para cumpleaños y aniversarios. Verificación manual: `POST /api/notifications/check-now`.

## 5. Monitoreo y logs

### Health check
```
GET /api/health → { status: 'OK', uptime, timestamp }
```
El contenedor backend tiene `HEALTHCHECK` con `curl -f http://localhost:3001/api/health`.

### Logs
```bash
docker logs -f kram-backend     # logs del backend
docker logs -f kram-frontend    # logs del frontend
docker logs -f kram-postgres    # logs de BD
```

### Puntos a vigilar
- Espacio en disco de `postgres_data` y `backend_uploads`.
- Errores en `docker logs` (migraciones, uploads, emails).
- Log de notificaciones: `GET /api/notifications/logs` (ADMIN/RH).

## 6. Tareas de mantenimiento

| Tarea | Frecuencia | Acción |
|---|---|---|
| Backup BD | Diaria | pg_dump |
| Backup uploads | Semanal | copiar volumen |
| Verificar restauración | Mensual | restaurar en staging |
| Revisar logs | Semanal | `docker logs` |
| Rotar contraseñas | Trimestral | `POST /api/users/:id/reset-password` |
| Actualizar dependencias | Trimestral | revisar `npm audit` |
