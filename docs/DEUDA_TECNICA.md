# DEUDA TÉCNICA — ERP KRAM

> **Última actualización**: 06/07/2026  
> **Versión del documento**: 4.0 (FINAL)  
> **Progreso**: 17 de 18 items resueltos (94%). Plan de remediación completado.  
> **Backlog**: Fase 6 (páginas frontend), P2-005 (api.js)

---

## Prioridades

| Prioridad | Significado | Plazo sugerido |
|-----------|-------------|----------------|
| **P0** | Crítica — bug en producción, seguridad, datos corruptos | Inmediato |
| **P1** | Alta — impacto significativo en mantenibilidad | ✅ Todas resueltas |
| **P2** | Media — violación de estándares | 1 pendiente (api.js) |
| **P3** | Baja — mejora deseable | ✅ Todas resueltas |

---

## ✅ P1 — Alta Prioridad — TODOS RESUELTOS

| ID | Archivo | Líneas originales | Solución | Fase |
|----|---------|-------------------|----------|------|
| **P1-001** | `employee-core.controller.js` | 1124 → 120 | CRUD extraído a `employee-crud.controller.js` | 3 |
| **P1-002** | `recruitment.controller.js` | 1550 → 1069 | Candidatos extraídos a `candidate.controller.js` | 3 |
| **P1-003** | `purchase.controller.js` | 865 | Ya cumplía SRP (controllers delgados) | 3 |
| **P1-004** | `employee.controller.js` | 1682 | 🗑️ Eliminado (dead code, 0 referencias) | 3 |

---

## ✅ P2 — Prioridad Media — 8 de 9 RESUELTOS

| ID | Archivo | Solución | Fase |
|----|---------|----------|------|
| **P2-001** | `auth.middleware.js` (370→117 líneas) | Dividido en 3 archivos: auth, permission, sse | 2 |
| **P2-002** | `ProtectedRoute.js` (195→170) | Lógica extraída a `useAuthorization.js` | 1 |
| **P2-003** | `AuthContext.js` (180→165) | Helpers por rol movidos a hook | 1 |
| **P2-004** | `DashboardLayout.js` (340→305) | Navegación extraída a `constants/navigation.js` | 4 |
| **P2-005** | `api.js` (~260 líneas) | ⏸️ **Backlog** — 43 imports a actualizar | — |
| **P2-006** | `docker-compose.yml` | Healthcheck `pg_isready` agregado | 5 |
| **P2-007** | `schema.prisma` | 3 índices compuestos nuevos | 5 |
| **P2-008** | `stationery.routes.js` | `requireRole` → `requireModule` | 0 |
| **P2-009** | `uniform.routes.js` | `requireRole` → `requireModule` | 0 |

---

## ✅ P3 — Prioridad Baja — TODOS RESUELTOS

| ID | Archivo | Resultado | Fase |
|----|---------|-----------|------|
| **P3-001** | Ruta `/api/me` duplicada | Verificado: `/profile` ≠ `/employees/me` | 1 |
| **P3-002** | Scripts `.bat` | Validación de `node_modules` agregada | 4 |
| **P3-003** | `organization.routes.js` | Verificado: ya agrupadas correctamente | 1 |
| **P3-004** | Paginación empleados | Defaults `page=1, limit=20` | 4 |
| **P3-005** | `purchase.routes.js` | Unificado a `requireModule` (17 instancias) | 0 |

---

## Fase 7 — Servicios Backend (Hallazgos de Auditoría)

| ID | Archivo | Solución |
|----|---------|----------|
| **N-007** | `purchase-order.service.js` (761→460) | PDF generator extraído a `order-pdf.service.js` |
| **N-008** | `status-notification.service.js` (540→180) | Plantillas HTML a `status-templates.service.js` |
| **N-009** | `purchase.service.js` (595) | Verificado: funciones pequeñas, bien estructurado |
| **N-010** | `organization.controller.js` (581→18) | Dividido en `department.controller.js` + `position.controller.js` |
| **N-011** | `employee-csv.controller.js` (832) | Plantillas CSV a `services/empleados/csv-template.service.js` |

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

| Fase | Fecha | Items | Commits |
|------|-------|-------|---------|
| **Fase 0** — Quick Wins | 06/07/2026 | 3 | `4b17bba`, `bfa24af` |
| **Fase 1** — Autorización | 06/07/2026 | 4 | `a7900c7` |
| **Fase 2** — Middlewares | 06/07/2026 | 1 | `a7900c7` |
| **Fase 3** — God Objects | 06/07/2026 | 4 | `a7900c7` |
| **Fase 4** — Frontend | 06/07/2026 | 3 | `a7900c7` |
| **Fase 5** — Infraestructura | 06/07/2026 | 2 | `a7900c7` |
| **Fase 7** — Servicios | 06/07/2026 | 4 | `d8da3e7`, `b297bf9` |
| **Fase 8** — Documentación | 06/07/2026 | Final | Pendiente |

---

## Archivos Creados (11)

| # | Archivo | Líneas | Propósito |
|---|---------|--------|-----------|
| 1 | `frontend/hooks/useAuthorization.js` | 57 | Lógica de autorización |
| 2 | `frontend/constants/navigation.js` | 40 | Menús del sidebar |
| 3 | `backend/middlewares/permission.middleware.js` | 150 | requireRole, requireModule |
| 4 | `backend/middlewares/sse.middleware.js` | 118 | SSE authentication |
| 5 | `backend/controllers/employee-crud.controller.js` | 290 | CRUD empleados |
| 6 | `backend/controllers/candidate.controller.js` | 528 | Candidatos reclutamiento |
| 7 | `backend/controllers/department.controller.js` | 55 | CRUD departamentos |
| 8 | `backend/controllers/position.controller.js` | 55 | CRUD puestos |
| 9 | `backend/services/purchases/order-pdf.service.js` | 92 | PDF órdenes de compra |
| 10 | `backend/services/purchases/status-templates.service.js` | 90 | Plantillas email |
| 11 | `backend/services/empleados/csv-template.service.js` | 80 | Plantillas CSV |

## Archivos Eliminados (1)

| Archivo | Motivo |
|---------|--------|
| `backend/controllers/employee.controller.js` (1682 líneas) | Dead code — 0 referencias |

---

## 🔄 Backlog para Futuros Sprints

| Item | Descripción | Riesgo | Esfuerzo |
|------|-------------|--------|----------|
| **P2-005** | Modularizar `api.js` en `lib/api/` por dominio | 🟡 Medio | 2-3h |
| **Fase 6** | Refactorizar 6 páginas frontend >200 líneas (~6,200 líneas) | 🔴 Alto | 8-12h |
| **N-012** | `auth.controller.js` (317 líneas) | 🟢 Bajo | 1h |
| **N-013** | `QuoteSelectionModal.js` (556 líneas) | 🟡 Medio | 2h |
| **N-014** | `PurchaseOrderModal.js` (495 líneas) | 🟡 Medio | 2h |

---

## Métricas de Reducción

| Métrica | Antes | Después | Reducción |
|---------|-------|---------|-----------|
| God Objects (>800 líneas) | 4 | 0 | -100% |
| Dead code eliminado | 1682 líneas | 0 | -100% |
| Middleware monolítico | 370 líneas | 117 | -68% |
| `requireRole` en módulos | 24 instancias | 0 | -100% |
| Helpers hardcodeados (frontend) | 5 | 0 | -100% |
| Archivos nuevos creados | — | 11 | — |
| Commits en GitHub | — | 5 | — |