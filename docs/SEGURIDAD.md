# Guía de Seguridad — ERP KRAM

> Resumen del modelo de seguridad implementado + recomendaciones operativas.

## 1. Autenticación

- **JWT** (`jsonwebtoken`) firmado con `JWT_SECRET`. Incluye `role` y `accessibleModules` en el payload.
- Expiración configurable (`JWT_EXPIRES_IN`, default `7d`).
- Sesiones persistidas en tabla `sessions`; el logout y el cambio de contraseña invalidan tokens.

## 2. Contraseñas

- Hash con **bcrypt** (salt rounds 10).
- Restablecimiento solo por ADMIN/RH (`POST /api/users/:id/reset-password`).
- Cambio propio de contraseña: `POST /api/auth/change-password`.

## 3. Modelo de autorización de 3 niveles

| Nivel | Mecanismo | Quién |
|---|---|---|
| **A — Acceso a módulos** | `accessibleModules` + bypass ADMIN/RH | Determina qué módulos ve |
| **B — Scoping de datos** | Filtros por empleado/departamento + bypass ADMIN/RH | Determina qué datos ve |
| **C — Operaciones críticas** | `requireRole(['ADMIN'])` | Solo ADMIN |

### Roles Estratégicos
- **ADMIN**: control técnico global (incluye Nivel C).
- **RH**: control operativo global (Niveles A y B, sin Nivel C).

> **Política**: ningún otro rol debe recibir privilegios equivalentes a ADMIN/RH sin autorización de Presidencia.

## 4. Protección de endpoints

- `requireModule('MODULO')`: protege endpoints de lectura/escritura por módulo.
- `requireRole([...])`: protege operaciones sensibles por rol.
- `requireRHOrAdmin()`: acciones de gestión de personal.
- Middleware `verifyToken` global en rutas protegidas.
- CORS restringido a orígenes explícitos (`CORS_ORIGIN`).

## 5. Regla de oro

**Nunca** usar `user.role === 'X'` para controlar acceso a módulos (excepto ADMIN/RH). Usar `user.accessibleModules?.includes('MODULO')`.

```js
// ✅ Correcto
if (user.role === 'ADMIN' || user.role === 'RH') {
  // bypass
} else if (user.accessibleModules?.includes('EMPLEADOS')) { ... }

// ❌ Incorrecto
if (['SISTEMAS','COMPRAS'].includes(user.role)) { ... }
```

## 6. Recomendaciones operativas

| Práctica | Detalle |
|---|---|
| `JWT_SECRET` robusto | Valor largo y aleatorio, fuera del control de versiones |
| Rotación de contraseñas | Trimestral para ADMIN/RH |
| Respaldo cifrado | Cifrar los dumps antes de almacenarlos fuera del host |
| Acceso mínimo | Asignar solo los módulos necesarios por usuario |
| Auditoría | Revisar `purchase_audit_logs` y logs del servidor |
| HTTPS | Forzar TLS en producción (Traefik/Coolify) |
| No exponer puertos | En producción no publicar puertos de BD/backend; solo frontend |

## 7. Respaldo y recuperación

Ver `docs/OPERACIONES.md` (sección de respaldos). Los backups deben probarse periódicamente restaurando en un entorno de staging.
