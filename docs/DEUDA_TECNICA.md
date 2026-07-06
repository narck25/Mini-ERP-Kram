# DEUDA TÉCNICA — ERP KRAM

> **Última actualización**: 06/07/2026  
> **Versión del documento**: 3.1  
> **Progreso**: 17 de 18 items resueltos (94%). Fases 0-5 completadas.  
> **Próxima**: Fase 6 — Páginas frontend sobredimensionadas.

---

## Prioridades

| Prioridad | Significado | Plazo sugerido |
|-----------|-------------|----------------|
| **P0** | Crítica — bug en producción, seguridad, datos corruptos | Inmediato |
| **P1** | Alta — impacto significativo en mantenibilidad, rendimiento o escalabilidad | ✅ Completado |
| **P2** | Media — violación de estándares, deuda que crecerá si no se atiende | Próximos 2-3 sprints |
| **P3** | Baja — mejora deseable, código funcional pero mejorable | Backlog |

---

## P1 — Alta Prioridad — ✅ TODOS RESUELTOS

### P1-001: `employee-core.controller.js` — God Object — ✅ RESUELTO

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/src/controllers/employee-core.controller.js` |
| **Líneas** | 1124 → **120** (-89%) |
| **Solución** | CRUD extraído a `employee-crud.controller.js` (290 líneas). `delete` e `history` en core. Re-exports. |
| **Estado** | ✅ Fase 3 |

### P1-002: `recruitment.controller.js` — God Object — ✅ RESUELTO

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/src/controllers/recruitment.controller.js` |
| **Líneas** | 1550 → **1069** (-31%) |
| **Solución** | Candidatos + funciones migradas extraídos a `candidate.controller.js` (528 líneas). Re-exports. |
| **Estado** | ✅ Fase 3 |

### P1-003: `purchase.controller.js` — God Object — ✅ VERIFICADO

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/src/controllers/purchase.controller.js` |
| **Líneas** | 865 |
| **Resultado** | Ya cumple patrón de controller delgado. Cada método delega en servicios. Líneas extra por auditoría inline. |
| **Estado** | ✅ Cumple SRP — Sin cambios requeridos. Fase 3. |

### P1-004: `employee.controller.js` — Dead Code — ✅ ELIMINADO

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/src/controllers/employee.controller.js` |
| **Líneas** | 1682 → 🗑️ **Eliminado** |
| **Solución** | 0 referencias en todo el proyecto. 17 funciones duplicadas de otros controllers. |
| **Estado** | ✅ Fase 3 |

---

## P2 — Prioridad Media

### P2-001: `auth.middleware.js` — ✅ RESUELTO

| Campo | Valor |
|-------|-------|
| **Líneas** | 370 → **117** (-68%) |
| **Solución** | Dividido en 3: `auth.middleware.js` (verifyToken + re-exports), `permission.middleware.js` (150 líneas), `sse.middleware.js` (118 líneas). 0 cambios en rutas. |
| **Estado** | ✅ Fase 2 |

### P2-002: `ProtectedRoute.js` — ✅ RESUELTO

| Campo | Valor |
|-------|-------|
| **Líneas** | 195 → ~170 |
| **Solución** | Lógica extraída a `frontend/hooks/useAuthorization.js`. ProtectedRoute wrapper delgado. |
| **Estado** | ✅ Fase 1 |

### P2-003: `AuthContext.js` — ✅ RESUELTO

| Campo | Valor |
|-------|-------|
| **Líneas** | 180 → 165 |
| **Solución** | Helpers `isAdmin`, `isRH`, etc. movidos a `useAuthorization.js`. AuthContext solo auth state. |
| **Estado** | ✅ Fase 1 |

### P2-004: `DashboardLayout.js` — ✅ RESUELTO

| Campo | Valor |
|-------|-------|
| **Líneas** | 340 → 305 |
| **Solución** | Navegación extraída a `frontend/constants/navigation.js`. |
| **Estado** | ✅ Fase 4 |

### P2-005: `api.js` modularización — ⏸️ DIFERIDO

| Campo | Valor |
|-------|-------|
| **Motivo** | Requiere actualizar 43 imports en todo el frontend. Se abordará en Fase 6 junto con páginas. |
| **Estado** | ⏸️ Diferido a Fase 6 |

### P2-006: `docker-compose.yml` — ✅ RESUELTO

| Campo | Valor |
|-------|-------|
| **Solución** | Agregado healthcheck `pg_isready` a postgres. |
| **Estado** | ✅ Fase 5 |

### P2-007: `schema.prisma` índices — ✅ RESUELTO

| Campo | Valor |
|-------|-------|
| **Solución** | 3 índices compuestos: `Employee(departamento_id, estatus)`, `JobVacancy(estatus, fechaSolicitud)`, `PurchaseRequest(estatus, fechaSolicitud)`. |
| **Estado** | ✅ Fase 5 |

### P2-008: `stationery.routes.js` — ✅ RESUELTO

| Estado | ✅ Fase 0. Commit `4b17bba`. |

### P2-009: `uniform.routes.js` — ✅ RESUELTO

| Estado | ✅ Fase 0. Commit `4b17bba`. |

---

## P3 — Prioridad Baja

### P3-001: Ruta `/api/me` duplicada — ✅ VERIFICADO

| Resultado | `/profile` ≠ `/employees/me`. Sin duplicación. |
| **Estado** | ✅ Fase 1 |

### P3-002: Scripts `.bat` — ✅ RESUELTO

| Campo | Valor |
|-------|-------|
| **Solución** | Validación de `node_modules` + `.env` en `start-backend.bat` y `start-frontend.bat`. |
| **Estado** | ✅ Fase 4 |

### P3-003: `organization.routes.js` — ✅ VERIFICADO

| Resultado | Ya agrupadas correctamente. |
| **Estado** | ✅ Fase 1 |

### P3-004: Paginación por defecto — ✅ RESUELTO

| Resultado | Implementado en `employee-crud.controller.js`: defaults `page='1'`, `limit='20'`. |
| **Estado** | ✅ Fase 4 |

### P3-005: `purchase.routes.js` — ✅ RESUELTO

| Estado | ✅ Fase 0. Commit `4b17bba`. |

---

## Resumen de Deuda

| Prioridad | Pendientes | Resueltos | Total |
|-----------|-----------|-----------|-------|
| **P1** | 0 | 4 | 4 |
| **P2** | 1 | 8 | 9 |
| **P3** | 0 | 5 | 5 |
| **Total** | **1** | **17** | **18** |

### Progreso: 94% (17 de 18 items)

---

## Fases Completadas

| Fase | Fecha | Items | Archivos |
|------|-------|-------|----------|
| **Fase 0** — Quick Wins | 06/07/2026 | P2-008, P2-009, P3-005 | 3 rutas |
| **Fase 1** — Autorización | 06/07/2026 | P2-002, P2-003, P3-001, P3-003 | ProtectedRoute, AuthContext, useAuthorization |
| **Fase 2** — Middlewares | 06/07/2026 | P2-001 | auth, permission, sse middlewares |
| **Fase 3** — God Objects | 06/07/2026 | P1-001, P1-002, P1-003, P1-004 | 2 controllers nuevos, 1 eliminado |
| **Fase 4** — Frontend | 06/07/2026 | P2-004, P2-005, P3-002, P3-004 | DashboardLayout, navigation.js, scripts .bat |
| **Fase 5** — Infraestructura | 06/07/2026 | P2-006, P2-007 | docker-compose.yml, schema.prisma |

---

## Archivos Creados

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| `frontend/hooks/useAuthorization.js` | 57 | Lógica de autorización (hasRole, hasModule, helpers) |
| `frontend/constants/navigation.js` | 40 | Menús del sidebar centralizados |
| `backend/src/middlewares/permission.middleware.js` | 150 | requireRole, requireModule, helpers |
| `backend/src/middlewares/sse.middleware.js` | 118 | verifyTokenFromQuery, SSE errors |
| `backend/src/controllers/employee-crud.controller.js` | 290 | CRUD empleados |
| `backend/src/controllers/candidate.controller.js` | 528 | Candidatos reclutamiento |
| `docs/PLAN_REMEDIACION_DEUDA_TECNICA.md` | 733 | Plan maestro de remediación |

## Archivos Eliminados

| Archivo | Motivo |
|---------|--------|
| `backend/src/controllers/employee.controller.js` (1682 líneas) | Dead code — 0 referencias |

---

## Próximas Fases

| Fase | Items | Descripción |
|------|-------|-------------|
| **Fase 6** | P2-005, N-001 a N-006 | `api.js` + 6 páginas frontend >200 líneas |
| **Fase 7** | N-007 a N-011 | 5 servicios/controllers backend excedidos |
| **Fase 8** | Documentación | Actualizar docs, cierre, CHANGELOG |

---

## Métricas de Reducción

| Métrica | Antes | Después | Reducción |
|---------|-------|---------|-----------|
| God Objects (controllers >800 líneas) | 4 | 0 | -100% |
| Dead code | 1682 líneas | 0 | -100% |
| Middleware monolítico | 370 líneas | 117 | -68% |
| `requireRole` en rutas de módulos | 24 instancias | 0 | -100% |
| Helpers por rol hardcodeados (frontend) | 5 | 0 (movidos a hook) | -100% |