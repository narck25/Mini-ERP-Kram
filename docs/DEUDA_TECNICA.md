# Deuda Técnica y Mejoras

Inventario de deuda técnica y mejoras pendientes, priorizadas por impacto.

## P1 — Alta prioridad (✅ RESUELTO — 2026-08-17)

| # | Deuda | Detalle | Resolución |
|---|-------|---------|------------|
| 1 | ✅ Sin rate limiting en login | `POST /api/auth/login` no limitaba intentos (riesgo de fuerza bruta). | `express-rate-limit` — login 10/15min, register 5/h (`rate-limit.middleware.js`). |
| 2 | ✅ Módulos `VACACIONES` y `REPORTES` | Sin implementación. | Implementados: vacaciones (saldo por antigüedad LFT + flujo jefe→RH + notificaciones email) y reportes (5 reportes + export Excel). |

## P2 — Media prioridad

| # | Deuda | Detalle | Acción sugerida |
|---|-------|---------|-----------------|
| 3 | Duplicación `nombre` / `nombres` | El modelo `Employee` tiene ambos campos (migración legacy `add_nombre_column_back`). | Unificar en un solo campo y migrar datos. |
| 4 | Controladores duplicados | `organization.controller.js` (nuevo) y `employee-org.controller.js` (legacy) tienen endpoints solapados. | Consolidar en un único controlador. |
| 5 | `SYSTEM_ROLES` duplicado | Los roles de sistema viven en `roles.routes.js` y en el enum `RoleType` de `schema.prisma`. | Centralizar en una sola fuente de verdad. |
| 6 | Edición de empleado duplicada | `EmployeeForm` (modal) y la edición por secciones de `rh/empleados/[id]` duplican lógica. | Unificar en un solo mecanismo. |
| 7 | Cuentas `baja.<rfc>@kram.mx` acumuladas | Al dar de baja se renombra el correo a un placeholder; se acumulan con el tiempo. | Definir política de limpieza periódica o reutilizar la cuenta. |

## P3 — Baja prioridad

| # | Deuda | Detalle | Acción sugerida |
|---|-------|---------|-----------------|
| 8 | `exhaustive-deps` suprimidos | ~20 efectos "fetch al montar" usan `eslint-disable` en vez de `useCallback`. | Refactorizar (requiere reordenar funciones por TDZ). |
| 9 | `getAllRoles()` estático | `rolesConfig.js` mantiene un fallback estático de roles (fuente de verdad debería ser la API). | Migrar todos los consumidores a `systemApi.getRoles()`. |
| 10 | Cobertura de pruebas parcial | Algunos controllers no tienen pruebas unitarias (attendance, etc.). | Agregar pruebas unitarias. |
| 11 | Seed de producción manual | El seed está comentado en el `CMD` del Dockerfile (se ejecuta manualmente). | Definir política de seed. |

## Mejoras ya aplicadas (histórico reciente)

- ✅ Seguridad: **RH ya no puede escalar a ADMIN** (validación de rol en `permission.controller.js`).
- ✅ **Roles dinámicos** en Gestión de Usuarios.
- ✅ **Guard anti auto-bloqueo** y confirmación de preset en Gestión de Accesos.
- ✅ **Baja con motivo** y liberación de correo institucional.
- ✅ Documentación reorganizada (manuales + flujos con Mermaid).
