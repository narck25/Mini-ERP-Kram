# Guía de Troubleshooting — ERP KRAM

> Errores comunes y soluciones.

## 1. Login / autenticación

| Síntoma | Causa probable | Solución |
|---|---|---|
| "Credenciales inválidas" | Contraseña incorrecta / usuario inactivo | Verificar usuario y contraseña; revisar `isActive` |
| Token expirado | `JWT_EXPIRES_IN` alcanzado | Volver a iniciar sesión |
| 401 en todo | Token no enviado | Enviar header `Authorization: Bearer <token>` |
| 403 "Solo ADMIN..." | Rol insuficiente | Verificar rol/módulos del usuario |

## 2. Migraciones Prisma

| Síntoma | Solución |
|---|---|
| "migration X failed" | El arranque ejecuta `scripts/resolve-migrations.js`; revisar logs. Si persiste, resolver el SQL manualmente |
| Tabla/columna no existe | `npx prisma generate` y `npx prisma migrate dev` |
| Drift del schema | `npx prisma migrate status` para diagnosticar |

## 3. Build del frontend

| Síntoma | Solución |
|---|---|
| Error de tipos al compilar | Revisar `frontend/build_output.txt` y corregir tipos |
| `next build` falla por memoria | Aumentar RAM del contenedor (768M+ recomendado) |
| Lockfile incompatible | Docker instala `npm@11` para resolver `lockfileVersion 3` |
| Error con sharp/nativos | Docker instala `python3 make g++` antes del build |

## 4. CORS

| Síntoma | Solución |
|---|---|
| "blocked by CORS policy" | Agregar el origen a `CORS_ORIGIN` (separado por coma) en el backend |

El backend permite por defecto `http://localhost:3000`, `http://localhost:3002` y los dominios de producción.

## 5. Subida de archivos (uploads)

| Síntoma | Solución |
|---|---|
| 413 "excede el tamaño máximo" | Límite 10 MB; reducir archivo o ajustar `express.json({limit})` y Multer |
| Error al guardar archivo | Verificar permisos del volumen `backend_uploads` (777) y que existan los subdirectorios |
| Archivo no aparece | Verificar que `UPLOAD_DIR` apunte al volumen persistente |

## 6. Docker

| Síntoma | Solución |
|---|---|
| Contenedor reinicia en loop | `docker logs kram-backend`; suele ser error de migración o DB no lista |
| BD no responde | Esperar a que el healthcheck de postgres (`pg_isready`) esté OK; el backend usa `depends_on: service_healthy` |
| Caché de build no invalida | Pasar `BUILD_DATE` con valor único en cada deploy |

## 7. Prisma Client

| Síntoma | Solución |
|---|---|
| "Prisma Client not generated" | `npx prisma generate` (el Dockerfile lo verifica y falla explícitamente) |
| "Environment variable DATABASE_URL not found" | Configurar `DATABASE_URL` en `.env` o en el contenedor |

## 8. Notificaciones / emails

| Síntoma | Solución |
|---|---|
| No llegan emails | Verificar `RESEND_API_KEY` y `RESEND_FROM_EMAIL` |
| Revisar envíos | `GET /api/notifications/logs` (ADMIN/RH) |

## 9. SSE (comentarios en tiempo real)

| Síntoma | Solución |
|---|---|
| Stream no conecta | `EventSource` no soporta headers; el token debe ir como `?token=<jwt>` (verifyTokenFromQuery) |

## 10. Verificación rápida

```bash
# Backend saludable
curl -f http://localhost:3001/api/health

# Logs en vivo
docker logs -f kram-backend

# Estado de migraciones
docker exec -it kram-backend npx prisma migrate status
```
