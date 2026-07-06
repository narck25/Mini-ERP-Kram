# DEUDA TÉCNICA — ERP KRAM

> **Última actualización**: 06/07/2026  
> **Versión del documento**: 2.1  
> **Propósito**: Inventario centralizado de deuda técnica clasificada por prioridad (P0-P3) con plan de remediación.  
> **Último cambio**: Fase 0 completada — 3 items resueltos (P2-008, P2-009, P3-005)

---

## Prioridades

| Prioridad | Significado | Plazo sugerido |
|-----------|-------------|----------------|
| **P0** | Crítica — bug en producción, seguridad, datos corruptos | Inmediato |
| **P1** | Alta — impacto significativo en mantenibilidad, rendimiento o escalabilidad | Próximo sprint |
| **P2** | Media — violación de estándares, deuda que crecerá si no se atiende | Próximos 2-3 sprints |
| **P3** | Baja — mejora deseable, código funcional pero mejorable | Backlog |

---

## P1 — Alta Prioridad

### P1-001: `employee-core.controller.js` — God Object (1057 líneas)

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/src/controllers/employee-core.controller.js` |
| **Líneas** | 1057 |
| **Problema** | Concentra lógica de empleados, usuarios, auth, documentos, CSV, fotos. Viola SRP. |
| **Impacto** | Difícil de mantener, probar y extender. Cualquier cambio en empleados requiere tocar este archivo. |
| **Solución propuesta** | Dividir en controladores especializados: `employee-crud.controller.js`, `employee-document.controller.js`, `employee-photo.controller.js`, `employee-csv.controller.js`. Ya existen algunos (employee-csv.controller.js, employeeDocument.controller.js, employee-photo.controller.js) pero el core sigue siendo monolítico. |
| **Dependencias** | `employee.routes.js`, `employee-csv.controller.js`, `employeeDocument.controller.js`, `employee-photo.controller.js` |
| **Bloqueante** | No — se puede refactorizar de forma incremental |
| **Estado** | 🔴 Pendiente |

### P1-002: `recruitment.controller.js` — God Object (1384 líneas)

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/src/controllers/recruitment.controller.js` |
| **Líneas** | 1384 |
| **Problema** | Concentra lógica de vacantes, candidatos, etapas, entrevistas, ofertas, PDF, email. Viola SRP. |
| **Impacto** | Difícil de mantener. Mezcla lógica de negocio con controladores. |
| **Solución propuesta** | Dividir en: `vacancy.controller.js`, `candidate.controller.js`, `interview.controller.js`, `offer.controller.js`. Mover lógica de negocio a `services/reclutamiento/`. |
| **Dependencias** | `recruitment.routes.js`, `services/email.service.js` |
| **Bloqueante** | No — refactorización incremental posible |
| **Estado** | 🔴 Pendiente |

### P1-003: `purchase.controller.js` — God Object (781 líneas)

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/src/controllers/purchase.controller.js` |
| **Líneas** | 781 |
| **Problema** | Concentra lógica de solicitudes, cotizaciones, aprobaciones, autorizaciones, comentarios, items. |
| **Impacto** | Difícil de mantener. Aunque delega a servicios, el controller sigue siendo muy grande. |
| **Solución propuesta** | Dividir en: `purchase-request.controller.js`, `purchase-quote.controller.js`, `purchase-approval.controller.js`, `purchase-comment.controller.js` (ya existe parcialmente). |
| **Dependencias** | `purchase.routes.js`, `services/purchases/*` |
| **Bloqueante** | No |
| **Estado** | 🔴 Pendiente |

### P1-004: `employee.controller.js` — God Object oculto (1581 líneas)

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/src/controllers/employee.controller.js` |
| **Líneas** | 1581 |
| **Problema** | Controller más grande del sistema. No estaba documentado en el inventario original de deuda. Contiene lógica de empleados, relaciones organizacionales, búsquedas, reportes. |
| **Impacto** | El archivo más grande del backend. Viola SRP gravemente. |
| **Solución propuesta** | Auditar contenido y dividir en controladores especializados. Revisar si parte de su lógica duplica a `employee-core.controller.js`. |
| **Dependencias** | `employee.routes.js` |
| **Bloqueante** | No |
| **Estado** | 🔴 Pendiente (nuevo) |

---

## P2 — Prioridad Media

### P2-001: `auth.middleware.js` — Crecimiento descontrolado (370+ líneas)

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/src/middlewares/auth.middleware.js` |
| **Líneas** | ~370 |
| **Problema** | Ha crecido con múltiples responsabilidades: verifyToken, requireModule, requireRole, verifyTokenFromQuery, _sendSSEAwareError, helpers de roles específicos. |
| **Impacto** | Viola SRP. Mezcla autenticación, autorización y formato de respuestas SSE. |
| **Solución propuesta** | Extraer a: `auth.middleware.js` (solo verifyToken), `permission.middleware.js` (requireModule, requireRole), `sse.middleware.js` (verifyTokenFromQuery, _sendSSEAwareError). |
| **Dependencias** | Todas las rutas del backend |
| **Bloqueante** | Sí — requiere actualizar imports en TODAS las rutas |
| **Estado** | 🟡 Pendiente |

### P2-002: `ProtectedRoute.js` — Lógica de roles hardcodeada (195 líneas)

| Campo | Valor |
|-------|-------|
| **Archivo** | `frontend/components/ProtectedRoute.js` |
| **Líneas** | 195 |
| **Problema** | Contiene lógica de verificación de roles y módulos que debería estar en un hook o contexto. Mezcla responsabilidades de UI y autorización. |
| **Impacto** | Dificulta la reutilización y prueba de la lógica de autorización. |
| **Solución propuesta** | Extraer lógica de autorización a un hook `useAuthorization()` o al `AuthContext`. Dejar ProtectedRoute como wrapper delgado. |
| **Dependencias** | `AuthContext.js` |
| **Bloqueante** | No |
| **Estado** | 🟡 Pendiente |

### P2-003: `AuthContext.js` — Lógica de redirección por rol (180 líneas)

| Campo | Valor |
|-------|-------|
| **Archivo** | `frontend/contexts/AuthContext.js` |
| **Líneas** | 180 |
| **Problema** | Contiene lógica de redirección basada en rol (`if role === 'ADMIN'`), lo que contradice el modelo de permisos basado en `accessibleModules`. |
| **Impacto** | Si se agregan nuevos roles, hay que modificar este archivo. |
| **Solución propuesta** | Usar `accessibleModules` para determinar la ruta por defecto en lugar de hardcodear roles. |
| **Dependencias** | `api.js`, `DashboardLayout.js` |
| **Bloqueante** | No |
| **Estado** | 🟡 Pendiente |

### P2-004: `DashboardLayout.js` — Navegación hardcodeada (~250 líneas)

| Campo | Valor |
|-------|-------|
| **Archivo** | `frontend/components/DashboardLayout.js` |
| **Líneas** | ~250 |
| **Problema** | Los menús de navegación están hardcodeados con arrays de objetos. Para agregar un nuevo módulo hay que modificar este archivo. |
| **Impacto** | Viola el principio de "Configuración sobre código". Cada nuevo módulo requiere modificar este archivo. |
| **Solución propuesta** | Consumir menús desde `GET /api/modules` o desde un archivo de configuración centralizado. Generar navegación dinámicamente. |
| **Dependencias** | `api.js`, `modules.config.js` |
| **Bloqueante** | No — pero requeriría refactorizar cómo se construye el sidebar |
| **Estado** | 🟡 Pendiente |

### P2-005: `frontend/lib/api.js` — Crecimiento lineal sin separación

| Campo | Valor |
|-------|-------|
| **Archivo** | `frontend/lib/api.js` |
| **Líneas** | ~260 |
| **Problema** | Todos los APIs están en un solo archivo. Ya se agregaron `stationeryApi` y `uniformApi` como objetos separados, pero siguen en el mismo archivo. |
| **Impacto** | Archivo crece con cada nuevo módulo. Dificulta encontrar APIs específicos. |
| **Solución propuesta** | Dividir en `lib/api/` con archivos por módulo: `api/empleados.js`, `api/compras.js`, `api/reclutamiento.js`, etc. |
| **Dependencias** | Todos los componentes que importan de `@/lib/api` |
| **Bloqueante** | No — pero requeriría actualizar imports en muchos archivos |
| **Estado** | 🟡 Pendiente |

### P2-006: `docker-compose.yml` — Sin healthchecks ni redes definidas

| Campo | Valor |
|-------|-------|
| **Archivo** | `docker-compose.yml` |
| **Problema** | Los servicios no tienen healthchecks. No hay redes definidas explícitamente. |
| **Impacto** | En producción, si un servicio falla, Docker no lo reinicia automáticamente. |
| **Solución propuesta** | Agregar healthchecks a cada servicio. Definir redes explícitas. |
| **Bloqueante** | No |
| **Estado** | 🟡 Pendiente |

### P2-007: `schema.prisma` — Sin índices en campos de búsqueda frecuente

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/prisma/schema.prisma` |
| **Problema** | Tablas grandes (Employee, JobVacancy, PurchaseRequest) no tienen índices en campos usados frecuentemente en búsquedas (estatus, fechas, departamento_id). |
| **Impacto** | Consultas lentas a medida que crecen los datos. |
| **Solución propuesta** | Agregar índices compuestos en: `Employee(departamento_id, estatus)`, `JobVacancy(estatus, fechaCreacion)`, `PurchaseRequest(estatus, fechaSolicitud)`. |
| **Bloqueante** | No — pero requiere migración de BD |
| **Estado** | 🟡 Pendiente |

### P2-008: `stationery.routes.js` — Uso de `requireRole` en lugar de `requireModule` — ✅ RESUELTO

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/src/routes/stationery.routes.js` |
| **Líneas** | 67 |
| **Problema** | Las rutas de inventario (POST, PUT, DELETE) usaban `requireRole(['ADMIN', 'COMPRAS'])` en lugar de `requireModule('COMPRAS')`. |
| **Impacto** | Violaba la regla de Nivel A del modelo de seguridad. |
| **Solución aplicada** | Reemplazado `requireRole(['ADMIN', 'COMPRAS'])` por `requireModule('COMPRAS')` en 3 rutas de inventario. |
| **Dependencias** | `auth.middleware.js` |
| **Bloqueante** | No |
| **Estado** | ✅ Resuelto (06/07/2026) — Fase 0. Commit `4b17bba`. |

### P2-009: `uniform.routes.js` — Uso de `requireRole` en lugar de `requireModule` — ✅ RESUELTO

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/src/routes/uniform.routes.js` |
| **Líneas** | 57 |
| **Problema** | Las rutas de inventario (POST, PUT, DELETE) y la ruta de historial por empleado usaban `requireRole(['ADMIN', 'COMPRAS'])` y `requireRole(['ADMIN', 'COMPRAS', 'RH'])` en lugar de `requireModule('COMPRAS')`. |
| **Impacto** | Violaba el modelo de seguridad de Nivel A. |
| **Solución aplicada** | Reemplazado `requireRole` por `requireModule('COMPRAS')` en 4 rutas (3 inventory + 1 history). |
| **Dependencias** | `auth.middleware.js` |
| **Bloqueante** | No |
| **Estado** | ✅ Resuelto (06/07/2026) — Fase 0. Commit `4b17bba`. |

---

## P3 — Prioridad Baja

### P3-001: `auth.routes.js` — Ruta `/api/me` duplicada

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/src/routes/auth.routes.js` |
| **Problema** | La ruta `GET /api/me` podría estar definida también en `employee.routes.js` o `user.routes.js`. |
| **Impacto** | Confusión sobre dónde está la fuente de verdad para obtener el perfil del usuario autenticado. |
| **Solución propuesta** | Unificar en una sola ruta, preferiblemente en `auth.routes.js`. |
| **Estado** | ⚪ Pendiente |

### P3-002: `start-backend.bat` y `start-frontend.bat` — Scripts sin validación

| Campo | Valor |
|-------|-------|
| **Archivo** | `start-backend.bat`, `start-frontend.bat` |
| **Problema** | Scripts simples que asumen que las dependencias están instaladas y los puertos disponibles. |
| **Impacto** | Si falta una dependencia, el error no es claro. |
| **Solución propuesta** | Agregar validaciones básicas (verificar node_modules, puerto disponible). |
| **Estado** | ⚪ Pendiente |

### P3-003: `organization.routes.js` — Rutas sin agrupar

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/src/routes/organization.routes.js` |
| **Problema** | Las rutas de organización (departamentos, puestos) están mezcladas sin agrupación clara. |
| **Impacto** | Bajo — solo organizativo. |
| **Solución propuesta** | Agrupar por recurso: `/departamentos/*`, `/puestos/*`, `/jerarquias/*`. |
| **Estado** | ⚪ Pendiente |

### P3-004: `employee.routes.js` — Ruta `GET /api/employees` sin paginación por defecto

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/src/routes/employee.routes.js` |
| **Problema** | El endpoint `GET /api/employees` acepta `page` y `limit` como query params, pero no tienen valores por defecto obligatorios. |
| **Impacto** | Si se omite la paginación, puede devolver miles de registros. |
| **Solución propuesta** | Establecer valores por defecto (page=1, limit=20) a nivel de ruta o controller. |
| **Estado** | ⚪ Pendiente |

### P3-005: `purchase.routes.js` — Mezcla de estilos de autorización — ✅ RESUELTO

| Campo | Valor |
|-------|-------|
| **Archivo** | `backend/src/routes/purchase.routes.js` |
| **Líneas** | 223 |
| **Problema** | Algunas rutas usaban `requireModule('COMPRAS')`, otras usaban `requireRole(['ADMIN', 'COMPRAS'])`. Inconsistencia en el modelo de autorización. |
| **Impacto** | Bajo — funcionalmente ambas funcionan, pero era inconsistente con el estándar. |
| **Solución aplicada** | Unificado a `requireModule('COMPRAS')` en las 17 rutas que usaban `requireRole` redundante. |
| **Estado** | ✅ Resuelto (06/07/2026) — Fase 0. Commit `4b17bba`. |

---

## Resumen de Deuda

| Prioridad | Pendientes | Resueltos | Total |
|-----------|-----------|-----------|-------|
| **P1** | 4 | 0 | 4 |
| **P2** | 7 | 2 | 9 |
| **P3** | 4 | 1 | 5 |
| **Total** | **15** | **3** | **18** |

### Progreso desde v1.0 (13/06/2026)

| Indicador | v1.0 | v2.0 | v2.1 (actual) |
|-----------|------|------|---------------|
| Items P1 | 3 | 4 | 4 (sin cambios) |
| Items P2 | 7 | 9 | 9 (2 resueltos, 7 pendientes) |
| Items P3 | 5 | 5 | 5 (1 resuelto, 4 pendientes) |
| **Total** | **15** | **18** | **18 (3 resueltos)** |

### Notas de la revisión del 06/07/2026 (Fase 0 completada)

- **Primeros 3 items de deuda resueltos**: P2-008, P2-009, P3-005.
- Se unificó el modelo de autorización en 3 archivos de rutas (`stationery`, `uniform`, `purchase`).
- Se eliminaron 24 instancias de `requireRole` redundante, reemplazadas por `requireModule('COMPRAS')`.
- El middleware `requireModule` ya da bypass automático a ADMIN y RH, por lo que el cambio es funcionalmente equivalente.
- Se creó `docs/PLAN_REMEDIACION_DEUDA_TECNICA.md` como guía oficial de implementación.
- Se detectaron 16 hallazgos nuevos no documentados previamente (páginas frontend >200 líneas, servicios >500 líneas).

### Notas de la revisión del 26/06/2026

- **Ningún item de deuda existente fue resuelto** desde la última actualización.
- Se descubrió `employee.controller.js` (1581 líneas) como un God Object no documentado previamente.
- Los nuevos módulos (Papelería y Uniformes) introdujeron 2 nuevos items de deuda P2 por uso incorrecto de `requireRole` en rutas.
- Los nuevos controllers (stationery.controller.js: 119 líneas, uniform.controller.js: 89 líneas) y servicios (stationery.service.js: 146 líneas, uniform.service.js: 95 líneas) son ejemplares: delgados, con separación de capas correcta.
- La deuda total aumentó de 15 a 18 items.

---

## Plan de remediación sugerido

### Fase 0 ✅ Completada (06/07/2026)
1. ~~**P2-008** y **P2-009**: Corregir `stationery.routes.js` y `uniform.routes.js` para usar `requireModule('COMPRAS')`~~ ✅ Resuelto.
2. ~~**P3-005**: Unificar `purchase.routes.js` a `requireModule('COMPRAS')`~~ ✅ Resuelto.

### Sprint actual (prioridad inmediata)
3. **P2-002**: Refactorizar `ProtectedRoute.js` para extraer lógica de autorización a un hook.

### Próximo sprint
4. **P1-004**: Auditar `employee.controller.js` y dividir en controladores especializados.
5. **P2-001**: Dividir `auth.middleware.js` en middlewares especializados.

### Próximos 2-3 sprints
6. **P1-001**: Refactorizar `employee-core.controller.js`.
7. **P1-002**: Refactorizar `recruitment.controller.js`.
8. **P1-003**: Refactorizar `purchase.controller.js`.
9. **P2-004**: Hacer dinámica la navegación del DashboardLayout.

### Backlog
10. Items P3 restantes.
11. **P2-007**: Agregar índices a schema.prisma (requiere migración).