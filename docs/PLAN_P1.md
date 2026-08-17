# Plan de Remediación P1 — ERP KRAM

> Fecha: 2026-08-17 · Estado: **COMPLETADO** (todas las fases)
> Fuente: `docs/DEUDA_TECNICA.md`

Plan de implementación de la deuda técnica de **prioridad P1**.

---

## P1-1 · Rate limiting en login 🔐

**Problema**: `POST /api/auth/login` no limita intentos (riesgo de fuerza bruta).

**Solución**: `express-rate-limit` en el endpoint de login (y registro).

| Paso | Detalle |
|---|---|
| 1 | `npm install express-rate-limit` |
| 2 | Crear `backend/src/middlewares/rate-limit.middleware.js` |
| 3 | `loginLimiter`: 10 intentos / 15 min / IP · `skipSuccessfulRequests: true` · `standardHeaders: 'draft-7'` · `skip` si `NODE_ENV=test` |
| 4 | `registerLimiter`: 5 solicitudes / 1 h / IP |
| 5 | Aplicar en `auth.routes.js` (antes de la validación) |
| 6 | Validar `TRUST_PROXY` en producción (Coolify) |
| 7 | Test: 429 tras exceder intentos |

**Riesgo**: si `TRUST_PROXY` no está bien configurado, se bloquea por IP del proxy. Mitigación: validar en staging.

---

## P1-2 · Módulos VACACIONES y REPORTES 🚧

### Decisión
Implementar **ambos módulos completos** siguiendo la checklist de 13 pasos (`.clinerules` §6.4).

> ✅ `VACACIONES` y `REPORTES` ya existen en el enum `ModuleType` de `schema.prisma` y en `modules.config.js` (`enabled: false`). **No requiere migración de enum**, solo activar.

### Paso 0 — Configuración compartida
- `modules.config.js`: `VACACIONES.enabled = true` · `REPORTES.enabled = true`.
- `roles.config.js`:
  - `ADMIN`: +VACACIONES +REPORTES
  - `RH`: +VACACIONES +REPORTES
  - `SISTEMAS / COMPRAS / PRODUCCION / EMPLEADO_BASICO`: +VACACIONES

### 🏖️ VACACIONES

**Modelo** (`schema.prisma`):
- `enum VacationStatus { PENDIENTE APROBADA RECHAZADA CANCELADA }`
- `model VacationRequest` (`vacation_requests`): `id, employeeId, fechaInicio, fechaFin, motivo?, estatus, aprobadoPorId?, aprobadoAt?, comentarioAprobacion?, createdAt, updatedAt`.
- ⚠️ Sin campo `totalDias` (calculado en frontend).

**Backend**: `services/vacaciones/vacation.service.js` → `controllers/vacation.controller.js` → `routes/vacation.routes.js` → registrar en `index.js`.

| Método | Ruta | Permiso |
|---|---|---|
| POST | `/vacations` | module VACACIONES |
| GET | `/vacations/my` | module VACACIONES |
| GET | `/vacations` | module VACACIONES (scoping) |
| GET | `/vacations/:id` | module VACACIONES |
| POST | `/vacations/:id/approve` | RH/ADMIN |
| POST | `/vacations/:id/reject` | RH/ADMIN |
| POST | `/vacations/:id/cancel` | module VACACIONES |

**Frontend**: `lib/api/vacations.js` · `app/vacaciones/mis-solicitudes/page.js` · `app/rh/vacaciones/page.js` · ítems en `navigation.js` · `<ProtectedRoute requiredModule="VACACIONES">`.

### 📊 REPORTES

**Sin tablas nuevas** (solo lecturas + export con `xlsx`).

**Backend**: `services/reportes/report.service.js` → `controllers/report.controller.js` → `routes/report.routes.js` → registrar en `index.js`.

| Reporte | Ruta base | Export |
|---|---|---|
| Empleados | `/reports/empleados` | `/export` (xlsx) |
| Compras | `/reports/compras` | `/export` |
| Inventario | `/reports/inventario` | `/export` |
| Asistencia | `/reports/asistencia` | `/export` |
| Vacaciones | `/reports/vacaciones` | `/export` |

**Frontend**: `lib/api/reports.js` · `app/dashboard/reportes/page.js` · ítem en `navigation.js` · `<ProtectedRoute requiredModule="REPORTES">`.

---

## ✅ Decisiones de alcance confirmadas

1. **Vacaciones — saldo**: **CON saldo** reutilizando `factores_integracion` (LFT) vía `salaryCalculator`. `diasDisponibles = días por antigüedad − días usados (solicitudes APROBADAS) en el periodo de aniversario laboral vigente`. Expuesto en `GET /vacations/balance` y validado en `create`.
2. **Vacaciones — aprobador**: **RH/ADMIN** aprueba (jefe directo como mejora futura).
3. **Reportes — alcance**: 5 reportes v1 (Empleados, Compras, Inventario, Asistencia, Vacaciones). Preset **solo ADMIN/RH**.
4. **Reportes — persistencia**: sin tablas nuevas; generación on-demand + export Excel.

---

## 📅 Secuencia de fases

| Fase | Contenido | Resultado verificable |
|---|---|---|
| **0** | P1-1 rate limiter + config (enabled/presets) | Login bloquea tras 10 intentos; módulos visibles en `/api/modules` |
| **1** | VACACIONES backend (schema→migración→service→controller→routes→index) | CRUD + aprobación por API |
| **2** | VACACIONES frontend | UI autoservicio + gestión RH |
| **3** | REPORTES backend | 5 reportes + export por API |
| **4** | REPORTES frontend | Página de reportes con filtros/export |
| **5** | Tests + docs | Suite verde, docs sincronizados |

---

## 📝 Checklist de verificación (al terminar)

- [ ] Sin código duplicado (se reutilizaron patrones de `stats.routes.js` y `services/purchases/`).
- [ ] Controllers delgados (sin Prisma ni lógica de negocio).
- [ ] `requireModule('VACACIONES' | 'REPORTES')` en rutas; bypass ADMIN/RH automático.
- [ ] Scoping Nivel B en `vacation.service.list()`.
- [ ] `accessibleModules` en frontend (no roles hardcodeados, salvo ADMIN/RH).
- [ ] Documentación actualizada (`MODELO_DATOS`, `API`, `MATRIZ_DE_PERMISOS`, `flujos/`, `modules/`).
- [ ] Ítems P1 tildados como resueltos en `DEUDA_TECNICA.md`.
