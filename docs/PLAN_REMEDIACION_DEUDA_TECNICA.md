# PLAN DE REMEDIACIÓN DE DEUDA TÉCNICA — ERP KRAM

> **Versión**: 1.0  
> **Fecha de creación**: 06/07/2026  
> **Propósito**: Guía oficial de implementación para resolver toda la deuda técnica del ERP KRAM.  
> **Público objetivo**: Desarrolladores y agentes de IA que ejecutarán las tareas.  
> **Documento fuente**: `docs/DEUDA_TECNICA.md` (v2.0, 26/06/2026)  
> **Total de items de deuda**: 18 (4 P1 + 9 P2 + 5 P3) + 7 hallazgos nuevos

---

## 1. RESUMEN EJECUTIVO

### 1.1 Estado Actual del Proyecto

El ERP KRAM es un sistema de gestión empresarial con arquitectura **monolito modular** compuesto por:

| Componente | Tecnología | Estado |
|------------|-----------|--------|
| **Backend** | Node.js + Express + Prisma ORM | Funcional, con deuda estructural |
| **Frontend** | Next.js (App Router) + React + Tailwind CSS | Funcional, con deuda en componentes |
| **Base de datos** | PostgreSQL 15 | Funcional, sin índices óptimos |
| **Infraestructura** | Docker + Docker Compose | Parcialmente configurada |

### 1.2 Nivel de Deuda Técnica

| Indicador | Valor |
|-----------|-------|
| **Items totales documentados** | 18 |
| **Items P1 (Alta prioridad)** | 4 — God Objects en controllers |
| **Items P2 (Media prioridad)** | 9 — Middlewares, componentes, rutas, infraestructura |
| **Items P3 (Baja prioridad)** | 5 — Duplicaciones, scripts, organización |
| **Hallazgos nuevos (esta auditoría)** | 7 — Páginas frontend sobredimensionadas, servicios excedidos |
| **Líneas de código totales** | ~35,000+ (back + front) |
| **Archivo más grande** | `employee.controller.js` — 1682 líneas |
| **Controller más grande** | `recruitment.controller.js` — 1551 líneas |

### 1.3 Principales Riesgos

| Riesgo | Severidad | Descripción |
|--------|-----------|-------------|
| **Fragilidad en controllers** | 🔴 Alto | 4 controllers con >800 líneas. Cada cambio en empleados/reclutamiento/compras puede romper funcionalidad no relacionada. |
| **Inconsistencia en autorización** | 🟡 Medio | Múltiples archivos de rutas mezclan `requireRole` y `requireModule`, violando el modelo de seguridad de 3 niveles. |
| **Crecimiento sin control** | 🟡 Medio | Páginas frontend de hasta 1776 líneas. Servicios que exceden el límite recomendado de 500 líneas. |
| **Obsolescencia de documentación** | 🟡 Medio | El documento DEUDA_TECNICA.md tiene conteos de líneas desactualizados (varios archivos crecieron desde la última medición). |
| **Deuda acumulada** | 🟡 Medio | Ningún item de deuda ha sido resuelto desde la primera versión del documento (13/06/2026). |
| **Sin healthchecks en dev** | 🟢 Bajo | `docker-compose.yml` de desarrollo no tiene healthchecks (el de producción sí). |

---

## 2. OBJETIVOS

### 2.1 Objetivo General

Reducir la deuda técnica del ERP KRAM a un nivel aceptable, aplicando principios SOLID, SRP, DRY y KISS, sin romper funcionalidad existente.

### 2.2 Objetivos Específicos

1. **Eliminar los 4 God Objects** del backend dividiendo controllers monolíticos en especializados.
2. **Unificar el modelo de autorización** en todas las rutas, usando exclusivamente `requireModule()` para Nivel A.
3. **Refactorizar el middleware de autenticación** separando responsabilidades (auth, permisos, SSE).
4. **Resolver violaciones de límites** en servicios y páginas frontend que exceden los umbrales recomendados.
5. **Optimizar la infraestructura** con healthchecks, índices de BD y scripts robustos.
6. **Actualizar la documentación** para reflejar el estado real del sistema.

---

## 3. PRINCIPIOS DE TRABAJO

### 3.1 Principios Fundamentales

| Principio | Aplicación |
|-----------|-----------|
| **Refactorización incremental** | Cada cambio debe ser pequeño, testeable y reversible. No reescribir archivos completos de una vez. |
| **No romper funcionalidad** | Antes y después de cada cambio, verificar que el sistema compile y funcione. |
| **Compatibilidad hacia atrás** | Las rutas y APIs deben mantener sus contratos. No cambiar nombres de endpoints. |
| **SOLID** | Cada archivo debe tener una sola razón para cambiar (SRP). |
| **DRY** | No duplicar lógica. Si existe un servicio/componente/hook, reutilizarlo. |
| **KISS** | La solución más simple es la correcta. No sobre-ingeniería. |
| **Controllers delgados** | El controller solo orquesta: valida request → llama servicio → devuelve respuesta. |
| **Servicios especializados** | Cada servicio maneja un dominio específico. |
| **Hooks reutilizables** | La lógica de estado y autorización va en hooks, no en componentes. |

### 3.2 Ciclo de Refactorización

```
1. ANALIZAR → Leer archivo, entender sus dependencias, imports y consumidores
2. PLANEAR  → Definir qué se va a extraer y a dónde
3. EJECUTAR → Mover código incrementalmente, actualizar imports
4. VERIFICAR → Levantar backend y frontend, probar funcionalidad
5. COMMIT   → Solo después de verificar que todo funciona
```

---

## 4. REGLAS OBLIGATORIAS

### 4.1 Antes de Cualquier Modificación

Antes de tocar cualquier archivo, se DEBE:

1. **Analizar dependencias**: Buscar todos los archivos que importan el módulo a modificar.
2. **Buscar referencias**: Usar `grep` o búsqueda en el IDE para encontrar todos los usos.
3. **Buscar imports**: Identificar qué otros archivos se romperán si se cambia la estructura.
4. **Explicar el plan**: Para cambios grandes (>50 líneas movidas), documentar el plan en un comentario o en el mensaje del commit.
5. **Hacer backup mental**: Entender qué rutas/flujos se verán afectados.

```bash
# Ejemplo de verificación de dependencias antes de modificar un archivo
grep -r "employeeCoreController" backend/src/ --include="*.js"
grep -r "require('./employee-core.controller')" backend/src/ --include="*.js"
grep -r "from.*employee-core" backend/src/ --include="*.js"
```

### 4.2 Checklist Pre-Modificación

- [ ] Se identificaron todos los archivos que importan este módulo
- [ ] Se identificaron todas las rutas que usan este controller
- [ ] Se identificaron todos los componentes que usan este servicio/hook
- [ ] Se entendió el flujo completo de la funcionalidad
- [ ] Se preparó un plan de extracción/refactorización
- [ ] Se identificaron los tests existentes (si los hay)

---

## 5. REGLA OBLIGATORIA ANTES DE GIT

> ⚠️ **ESTA REGLA ES INAPELABLE. NO HAY EXCEPCIONES.**

**NUNCA** ejecutar:

```bash
git add
git commit
git push
```

sin antes completar TODOS los siguientes pasos:

### 5.1 Secuencia de Verificación Pre-Commit

```
Paso 1: Levantar backend
  cd backend && npm run dev
  Verificar en consola: "Server running on port 3001"
  Verificar que no haya errores de compilación

Paso 2: Levantar frontend
  cd frontend && npm run dev
  Verificar en consola: "ready started server on http://localhost:3000"
  Verificar que no haya errores de compilación

Paso 3: Verificar compilación
  El backend debe iniciar sin errores
  El frontend debe compilar sin errores
  No debe haber warnings nuevos (solo los preexistentes)

Paso 4: Probar la funcionalidad modificada
  Navegar a la(s) página(s) afectada(s)
  Ejecutar el flujo completo (crear, leer, actualizar, eliminar)
  Verificar que los permisos funcionan correctamente

Paso 5: Revisar consola
  Backend: sin errores 500, sin excepciones no capturadas
  Frontend: sin errores en consola del navegador
  Red: todas las llamadas API responden 200/201 (salvo las esperadas 403/404)

Paso 6: Confirmar ausencia de errores
  Ningún test falla (si existen tests)
  Ninguna funcionalidad preexistente se rompió
  La UI se ve igual que antes (salvo cambios intencionales)

Solo entonces:
  git add <archivos específicos>
  git commit -m "mensaje descriptivo"
  git push
```

### 5.2 Formato del Mensaje de Commit

```
<tipo>(<alcance>): <descripción breve>

<descripción detallada de lo que se hizo>

Refs: <item de deuda relacionado>
Verificado: <qué se probó>
```

Ejemplo:
```
refactor(controllers): dividir employee-core.controller.js en especializados

Extraído employee-crud.controller.js y employee-document.controller.js
del God Object employee-core.controller.js (1124 → ~400 líneas).

Refs: P1-001
Verificado: CRUD empleados, documentos, fotos, CSV import/export
```

---

## 6. PLAN DE IMPLEMENTACIÓN

### 6.1 Visión General de Fases

| Fase | Nombre | Items | Prioridad | Esfuerzo estimado | Riesgo |
|------|--------|-------|-----------|-------------------|--------|
| **Fase 0** | Correcciones rápidas (Quick Wins) | 3 | P2 | 1-2 horas | 🟢 Bajo |
| **Fase 1** | Estabilización de autorización | 4 | P2/P3 | 4-6 horas | 🟡 Medio |
| **Fase 2** | Refactorización de middlewares | 1 | P2 | 3-4 horas | 🔴 Alto |
| **Fase 3** | Refactorización de God Objects (P1) | 4 | P1 | 12-16 horas | 🔴 Alto |
| **Fase 4** | Frontend — Componentes y navegación | 5 | P2/P3 | 8-12 horas | 🟡 Medio |
| **Fase 5** | Infraestructura y base de datos | 3 | P2/P3 | 2-3 horas | 🟢 Bajo |
| **Fase 6** | Páginas frontend sobredimensionadas | 6 | P2 (nuevo) | 8-12 horas | 🟡 Medio |
| **Fase 7** | Servicios backend excedidos | 3 | P2 (nuevo) | 4-6 horas | 🟡 Medio |
| **Fase 8** | Documentación y cierre | 2 | P3 | 2-3 horas | 🟢 Bajo |

### 6.2 Fase 0 — Correcciones Rápidas (Quick Wins)

**Objetivo**: Resolver items de bajo riesgo que generan un impacto inmediato en la consistencia del código.

| ID | Item | Archivo(s) | Acción | Riesgo |
|----|------|-----------|--------|--------|
| **P2-008** | `stationery.routes.js` usa `requireRole` | `backend/src/routes/stationery.routes.js` | Reemplazar `requireRole(['ADMIN', 'COMPRAS'])` por `requireModule('COMPRAS')` en líneas 32, 38, 43 | 🟢 Muy bajo |
| **P2-009** | `uniform.routes.js` usa `requireRole` | `backend/src/routes/uniform.routes.js` | Reemplazar `requireRole(['ADMIN', 'COMPRAS'])` por `requireModule('COMPRAS')` en líneas 15, 21, 27, 53 | 🟢 Muy bajo |
| **P3-005** | `purchase.routes.js` mezcla estilos | `backend/src/routes/purchase.routes.js` | Unificar a `requireModule('COMPRAS')` eliminando `requireRole` redundante en líneas 42, 55, 62, 69 | 🟢 Muy bajo |

**Dependencias**: Ninguna.  
**Criterio de aceptación**: Las 3 rutas usan exclusivamente `requireModule('COMPRAS')` para control de acceso. El middleware `requireModule` ya da bypass a ADMIN.

### 6.3 Fase 1 — Estabilización de Autorización

**Objetivo**: Unificar el modelo de autorización en frontend y backend.

| ID | Item | Archivo(s) | Acción | Riesgo |
|----|------|-----------|--------|--------|
| **P2-002** | `ProtectedRoute.js` lógica mezclada | `frontend/components/ProtectedRoute.js` | Extraer lógica `hasAccess()` a `frontend/hooks/useAuthorization.js`. ProtectedRoute se vuelve wrapper delgado. | 🟡 Medio |
| **P2-003** | `AuthContext.js` redirección por rol | `frontend/contexts/AuthContext.js` | Eliminar helpers por rol (`isAdmin`, `isRH`, `isSistemas`, `isCompras`, `isProduccion`) que no se usen. Mantener `hasRole` solo para bypass ADMIN/RH. | 🟡 Medio |
| **P3-001** | Ruta `/api/me` potencialmente duplicada | `backend/src/routes/auth.routes.js`, `employee.routes.js` | Verificar si `GET /employees/me` y `GET /profile` son funcionalmente equivalentes. Si no, documentar la diferencia. Si sí, unificar. | 🟢 Bajo |
| **P3-003** | `organization.routes.js` sin agrupar | `backend/src/routes/organization.routes.js` | Reorganizar comentarios y agrupar por recurso (departamentos, puestos). Sin cambios funcionales. | 🟢 Bajo |

**Dependencias**: Fase 0 completada.  
**Criterio de aceptación**: 
- Existe `useAuthorization` hook con funciones `canAccessModule(module)` y `canAccessRoute(module)`.
- `ProtectedRoute` tiene <50 líneas de lógica propia.
- `AuthContext` no exporta funciones helper por rol que no sean estrictamente necesarias.

### 6.4 Fase 2 — Refactorización de Middlewares

**Objetivo**: Dividir el middleware monolítico en módulos especializados.

| ID | Item | Archivo(s) | Acción | Riesgo |
|----|------|-----------|--------|--------|
| **P2-001** | `auth.middleware.js` (370 líneas) | `backend/src/middlewares/auth.middleware.js` | Dividir en 3 archivos: `auth.middleware.js` (verifyToken), `permission.middleware.js` (requireModule, requireRole), `sse.middleware.js` (verifyTokenFromQuery, _sendSSEAwareError). Actualizar imports en TODAS las rutas. | 🔴 Alto |

**Plan detallado**:

```
auth.middleware.js (existente, reducido)
  → verifyToken()
  → Funciones helper de rol (requireRHOrAdmin, etc.)
  → ~150 líneas

permission.middleware.js (nuevo)
  → requireModule(moduleName)
  → requireRole(roles)
  → requireAdmin()
  → ~100 líneas

sse.middleware.js (nuevo)
  → verifyTokenFromQuery()
  → _sendSSEAwareError()
  → ~50 líneas
```

**Archivos que requieren actualización de imports** (16 archivos de rutas):
- `attendance.routes.js`
- `auth.routes.js`
- `employee.routes.js`
- `employeeDocument.routes.js`
- `notifications.routes.js`
- `organization.routes.js`
- `permission.routes.js`
- `purchase-public.routes.js`
- `purchase.routes.js`
- `recruitment.routes.js`
- `roles.routes.js`
- `seed.routes.js`
- `stationery.routes.js`
- `stats.routes.js`
- `uniform.routes.js`
- `user.routes.js`

**Dependencias**: Fase 1 completada (para tener el modelo de autorización unificado).  
**Criterio de aceptación**: 
- `auth.middleware.js` < 200 líneas.
- Todos los imports actualizados.
- Backend compila y todas las rutas protegidas funcionan.
- Los tests existentes pasan.

### 6.5 Fase 3 — Refactorización de God Objects (P1)

**Objetivo**: Dividir los 4 controllers monolíticos en controladores especializados.

#### 6.5.1 P1-004: `employee.controller.js` — 1682 líneas

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 1 | Auditoría completa del archivo | Identificar todas las funciones y su responsabilidad |
| 2 | Determinar solapamiento con `employee-core.controller.js` | Evitar duplicar lógica ya existente |
| 3 | Extraer funciones no solapadas a nuevos controllers | `employee-report.controller.js`, `employee-search.controller.js` |
| 4 | Eliminar código duplicado | Si `employee-core` ya tiene la función, usar esa |
| 5 | Actualizar `employee.routes.js` | Apuntar a los controllers correctos |

#### 6.5.2 P1-001: `employee-core.controller.js` — 1124 líneas

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 1 | Extraer funciones CRUD básicas | `employee-crud.controller.js` (~200 líneas) |
| 2 | Mover funciones de usuario | A `user.controller.js` existente si aplica |
| 3 | Mover lógica de negocio a servicios | `services/empleados/employee.service.js` |
| 4 | Reducir `employee-core.controller.js` | ~300 líneas (solo orquestación) |

#### 6.5.3 P1-002: `recruitment.controller.js` — 1551 líneas

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 1 | Extraer controlador de vacantes | `vacancy.controller.js` (~400 líneas) |
| 2 | Extraer controlador de candidatos | `candidate.controller.js` (~300 líneas) |
| 3 | Extraer controlador de entrevistas | `interview.controller.js` (~200 líneas) |
| 4 | Mover lógica de negocio a servicios | `services/reclutamiento/vacancy.service.js`, `candidate.service.js` |
| 5 | Eliminar `recruitment.controller.js` | Reemplazado por controladores especializados |
| 6 | Actualizar `recruitment.routes.js` | Apuntar a los nuevos controllers |

#### 6.5.4 P1-003: `purchase.controller.js` — 865 líneas

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 1 | Extraer `purchase-request.controller.js` | Manejo de solicitudes (CRUD) |
| 2 | Extraer `purchase-quote.controller.js` | Manejo de cotizaciones |
| 3 | Extraer `purchase-approval.controller.js` | Manejo de aprobaciones |
| 4 | Reducir `purchase.controller.js` | Solo orquestación o eliminarlo |
| 5 | Actualizar `purchase.routes.js` | Apuntar a los controllers especializados |

**Dependencias**: Fase 2 completada (middlewares ya refactorizados).  
**Criterio de aceptación**: 
- Ningún controller > 300 líneas.
- Cada controller tiene una responsabilidad clara.
- Las rutas funcionan exactamente igual que antes.
- No hay pérdida de funcionalidad.

### 6.6 Fase 4 — Frontend: Componentes y Navegación

**Objetivo**: Resolver deuda en componentes React y hacer la navegación dinámica.

| ID | Item | Archivo(s) | Acción | Riesgo |
|----|------|-----------|--------|--------|
| **P2-004** | `DashboardLayout.js` — Navegación hardcodeada | `frontend/components/DashboardLayout.js` | Extraer arrays `myPortalNavigation` y `adminNavigation` a `frontend/constants/navigation.js`. Evaluar consumir desde API `/api/modules` en el futuro. | 🟡 Medio |
| **P2-005** | `api.js` — Crecimiento lineal | `frontend/lib/api.js` | Dividir en `frontend/lib/api/` con archivos: `employees.js`, `compras.js`, `recruitment.js`, `auth.js`, `system.js`, `stationery.js`, `uniform.js`. Crear `index.js` que re-exporte todo para compatibilidad. | 🟡 Medio |
| **P3-002** | Scripts sin validación | `start-backend.bat`, `start-frontend.bat` | Agregar validación de `node_modules`, puerto disponible, y mensajes de error claros. | 🟢 Bajo |
| **P3-004** | `GET /api/employees` sin paginación por defecto | `backend/src/routes/employee.routes.js`, `employee-core.controller.js` | Agregar `page=1&limit=20` como defaults en el controller. | 🟢 Bajo |

**Dependencias**: Fase 3 completada.  
**Criterio de aceptación**:
- `DashboardLayout.js` < 200 líneas (la navegación se genera desde constantes externas).
- `api.js` dividido en módulos, con `index.js` manteniendo compatibilidad.
- `start-backend.bat` muestra mensaje claro si falta `node_modules`.
- `GET /api/employees` sin query params devuelve máximo 20 resultados.

### 6.7 Fase 5 — Infraestructura y Base de Datos

**Objetivo**: Mejorar la configuración de Docker y optimizar la base de datos.

| ID | Item | Archivo(s) | Acción | Riesgo |
|----|------|-----------|--------|--------|
| **P2-006** | `docker-compose.yml` sin healthchecks | `docker-compose.yml` | Agregar healthchecks al servicio `postgres` (back y front en dev no requieren healthcheck, se ejecutan con npm). | 🟢 Bajo |
| **P2-007** | `schema.prisma` sin índices óptimos | `backend/prisma/schema.prisma` | Agregar `@@index([departamento_id, estatus])` en Employee, `@@index([estatus, fechaSolicitud])` en JobVacancy, `@@index([estatus, fechaSolicitud])` en PurchaseRequest. Generar migración. | 🟡 Medio |

**Nota sobre P2-006**: El `docker-compose.prod.yml` ya tiene healthchecks para postgres. El `docker-compose.yml` de desarrollo ya tiene redes definidas (`kram-network`). La deuda real es solo agregar healthcheck a postgres en dev.

**Dependencias**: Ninguna. Puede ejecutarse en paralelo con otras fases.  
**Criterio de aceptación**:
- `docker-compose.yml` tiene healthcheck para postgres.
- `schema.prisma` tiene los índices propuestos.
- La migración se genera y aplica sin errores.
- `prisma migrate dev` completa exitosamente.

### 6.8 Fase 6 — Páginas Frontend Sobredimensionadas

> ⚠️ **Hallazgos de esta auditoría** — No documentados en DEUDA_TECNICA.md original.

**Objetivo**: Reducir páginas que exceden el límite recomendado de 200 líneas.

| ID (nuevo) | Archivo | Líneas | Acción propuesta |
|-------------|---------|--------|-----------------|
| **N-001** | `app/dashboard/compras/[id]/page.js` | 1776 | Dividir en tabs/subcomponentes: `PurchaseDetailTabs.js`, `QuoteSection.js`, `ApprovalSection.js`, `OrderSection.js`. La página principal solo orquesta tabs. |
| **N-002** | `app/rh/empleados/[id]/page.js` | 1357 | Extraer secciones a componentes: `EmployeeInfoCard.js`, `EmployeeDocumentsTab.js`, `EmployeeHistoryTab.js`, `EmployeeSalaryTab.js`. |
| **N-003** | `app/reclutamiento/vacantes/[id]/CandidatesTab.js` | 835 | Dividir en: `CandidateCard.js`, `CandidateVotingSection.js`, `CandidateDocumentsSection.js`. |
| **N-004** | `app/reclutamiento/solicitar-vacante/page.js` | 800 | Extraer `VacancyFormSteps.js` como componente con pasos (Step 1: Básico, Step 2: Requisitos, Step 3: Confirmación). |
| **N-005** | `app/rh/reclutamiento/crear-vacante/page.js` | 770 | Extraer lógica compartida con `solicitar-vacante/page.js` a un hook `useVacancyForm.js`. |
| **N-006** | `app/dashboard/organizacion/page.js` | 684 | Dividir en `DepartmentTree.js`, `PositionTable.js`, `HierarchyChart.js`. |

**Dependencias**: Fase 4 completada (api.js ya está modularizado).  
**Criterio de aceptación**: 
- Cada página ≤ 200 líneas.
- Componentes extraídos ≤ 300 líneas.
- Se reutiliza lógica entre páginas similares (ej. formulario de vacante).

### 6.9 Fase 7 — Servicios Backend Excedidos

> ⚠️ **Hallazgos de esta auditoría** — No documentados en DEUDA_TECNICA.md original.

**Objetivo**: Reducir servicios que exceden el límite recomendado de 500 líneas.

| ID (nuevo) | Archivo | Líneas | Acción propuesta |
|-------------|---------|--------|-----------------|
| **N-007** | `services/purchases/purchase-order.service.js` | 761 | Dividir en: `order-create.service.js`, `order-status.service.js`, `order-pdf.service.js`. |
| **N-008** | `services/purchases/status-notification.service.js` | 540 | Extraer notificaciones por tipo de evento a funciones helper separadas. |
| **N-009** | `services/purchases/purchase.service.js` | 595 | Extraer `purchase-validation.service.js` con lógica de validación de solicitudes. |
| **N-010** | `controllers/organization.controller.js` | 581 | Dividir en `department.controller.js`, `position.controller.js`, `hierarchy.controller.js`. |
| **N-011** | `controllers/employee-csv.controller.js` | 832 | Extraer lógica de mapeo CSV a `services/empleados/csv-mapper.service.js`. El controller solo debe orquestar. |

**Dependencias**: Fase 3 completada (controllers ya refactorizados).  
**Criterio de aceptación**:
- Cada servicio ≤ 500 líneas.
- Cada servicio tiene una responsabilidad clara.
- Los tests existentes pasan.

### 6.10 Fase 8 — Documentación y Cierre

**Objetivo**: Actualizar toda la documentación para reflejar el estado final del sistema.

| Acción | Archivo(s) |
|--------|-----------|
| Actualizar `DEUDA_TECNICA.md` | Marcar items como resueltos, actualizar conteos de líneas |
| Actualizar `ARQUITECTURA_KRAM.md` | Reflejar nueva estructura de controllers, middlewares, servicios |
| Actualizar `MATRIZ_DE_PERMISOS.md` | Reflejar unificación de autorización |
| Actualizar `.clinerules` | Si algún principio cambió durante la remediación |
| Crear `CHANGELOG.md` | Registrar todos los cambios de esta remediación |

**Dependencias**: Todas las fases anteriores completadas.  
**Criterio de aceptación**: 
- `DEUDA_TECNICA.md` muestra 0 items pendientes (o los que queden como backlog).
- La documentación refleja fielmente el estado del código.

---

## 7. CRONOGRAMA SUGERIDO

### 7.1 Orden Recomendado

```
Semana 1: Fase 0 + Fase 1 (Quick Wins + Autorización)
  Día 1-2: P2-008, P2-009, P3-005 (correcciones de rutas)
  Día 3-4: P2-002, P2-003 (ProtectedRoute, AuthContext)
  Día 5: P3-001, P3-003 (verificación de rutas duplicadas, organización)

Semana 2: Fase 2 + Inicio Fase 3 (Middlewares + God Objects)
  Día 1-3: P2-001 (dividir auth.middleware.js) ← EL MÁS RIESGOSO
  Día 4-5: P1-004 (auditar employee.controller.js)

Semana 3: Fase 3 (God Objects)
  Día 1-2: P1-001 (employee-core.controller.js)
  Día 3-5: P1-002 (recruitment.controller.js)

Semana 4: Fase 3 + Fase 4 (God Objects + Frontend)
  Día 1-2: P1-003 (purchase.controller.js)
  Día 3-5: P2-004, P2-005, P3-002 (DashboardLayout, api.js, scripts)

Semana 5: Fase 5 + Fase 6 (Infraestructura + Páginas grandes)
  Día 1-2: P2-006, P2-007 (docker-compose, índices BD)
  Día 3-5: N-001, N-002, N-003 (páginas más grandes)

Semana 6: Fase 6 + Fase 7 (Páginas + Servicios)
  Día 1-3: N-004, N-005, N-006 (resto de páginas)
  Día 4-5: N-007, N-008, N-009, N-010, N-011 (servicios)

Semana 7: Fase 8 (Documentación)
  Día 1-3: Actualizar toda la documentación
  Día 4-5: Pruebas de regresión completas
```

### 7.2 Justificación del Orden

1. **Quick Wins primero** (Fase 0): Generan confianza, son cambios pequeños y seguros, y unifican el modelo de autorización.
2. **Autorización antes que middlewares** (Fase 1 → Fase 2): Tener el modelo de permisos unificado facilita refactorizar los middlewares.
3. **Middlewares antes que God Objects** (Fase 2 → Fase 3): Los controllers dependen del middleware. Refactorizar middleware primero evita retrabajo.
4. **Backend antes que frontend** (Fases 0-3 → Fases 4-6): El frontend consume las APIs del backend. Estabilizar backend primero.
5. **Infraestructura en paralelo** (Fase 5): No tiene dependencias con otras fases, puede adelantarse.
6. **Documentación al final** (Fase 8): Refleja el estado final después de todos los cambios.

---

## 8. RIESGOS

### 8.1 Matriz de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| **Romper imports en 16 rutas al dividir middleware** | Alta | Alto | Script de búsqueda y reemplazo. Probar ruta por ruta. |
| **Romper funcionalidad de empleados al dividir controller** | Alta | Alto | Tests manuales de cada endpoint después de cada extracción. |
| **Perder lógica de negocio al mover código** | Media | Alto | Code review de cada commit. No eliminar código original hasta verificar. |
| **Romper flujo de reclutamiento** | Media | Alto | El flujo de vacantes es el más complejo. Probar el ciclo completo: crear → aprobar → buscar → seleccionar → cerrar. |
| **Inconsistencia en permisos tras refactorización** | Media | Medio | Probar con usuarios de diferentes roles (ADMIN, RH, COMPRAS, EMPLEADO_BASICO). |
| **Páginas frontend rotas por cambios en API** | Baja | Medio | Si no se cambian los nombres de endpoints, el riesgo es bajo. |
| **Migración de BD fallida** | Baja | Alto | Ejecutar `prisma migrate dev` en entorno local primero. Hacer backup. |

### 8.2 Plan de Rollback

Para cada cambio, mantener la capacidad de revertir:

1. **Commits atómicos**: Un commit por cada extracción/refactorización.
2. **Ramas por fase**: Trabajar en `fix/deuda-tecnica-fase-N` para cada fase.
3. **No hacer squash**: Mantener el historial granular para revertir cambios específicos.
4. **Backup de BD**: Antes de Fase 5 (migraciones), hacer `pg_dump`.

---

## 9. CRITERIOS DE ACEPTACIÓN

### 9.1 Por Fase

| Fase | Criterio |
|------|---------|
| **Fase 0** | Las 3 rutas usan `requireModule` sin `requireRole` redundante. PEQUEÑO_CAMBIO ejecutado. |
| **Fase 1** | `useAuthorization` hook creado y usado. `AuthContext` simplificado. |
| **Fase 2** | 3 middlewares independientes. 16 rutas con imports actualizados. Backend compila. |
| **Fase 3** | 4 God Objects divididos. Ningún controller > 300 líneas. APIs funcionan igual. |
| **Fase 4** | `DashboardLayout` extrae navegación de constantes. `api.js` modularizado. Scripts validan. |
| **Fase 5** | Healthcheck en docker-compose. Índices en BD. Migración aplicada. |
| **Fase 6** | Ninguna página > 200 líneas. Componentes extraídos funcionan. |
| **Fase 7** | Ningún servicio > 500 líneas. Servicios con responsabilidad única. |
| **Fase 8** | Documentación actualizada. DEUDA_TECNICA.md refleja estado real. |

### 9.2 Criterio Global

El proyecto cumple con todos los principios del `.clinerules`:
- ✅ Controllers delgados (≤300 líneas)
- ✅ Servicios especializados (≤500 líneas)
- ✅ Páginas delgadas (≤200 líneas)
- ✅ Componentes React (≤300 líneas)
- ✅ `requireModule` para control de acceso (Nivel A)
- ✅ Separación de capas (routes → controllers → services)
- ✅ Sin hardcodeo de roles en frontend (excepto ADMIN/RH para bypass)
- ✅ Documentación sincronizada con el código

---

## 10. DEFINICIÓN DE TERMINADO (Definition of Done)

Cada tarea de este plan se considera **terminada** solo cuando:

### 10.1 Checklist Individual por Tarea

- [ ] Código compilando sin errores (backend + frontend)
- [ ] Pruebas locales exitosas (levantar ambos servicios)
- [ ] Funcionalidad modificada validada manualmente
- [ ] No se introdujeron nuevos warnings en consola
- [ ] Los imports están actualizados en todos los archivos dependientes
- [ ] El código sigue los patrones del `.clinerules`
- [ ] No hay código muerto (dead code) remanente
- [ ] Los mensajes de commit son descriptivos y referencian el item de deuda
- [ ] Se verificó con al menos 2 roles diferentes (ej. ADMIN y EMPLEADO_BASICO)

### 10.2 Checklist por Fase

- [ ] Todos los items de la fase completados individualmente
- [ ] Prueba de regresión: flujos principales del ERP funcionan
- [ ] No hay regresiones en funcionalidad no relacionada
- [ ] La documentación de la fase está actualizada
- [ ] Code review completado (o auto-review si no hay otro desarrollador)

### 10.3 Checklist Global (al finalizar todas las fases)

- [ ] Backend compila e inicia sin errores
- [ ] Frontend compila e inicia sin errores
- [ ] Login funciona con todos los roles
- [ ] Dashboard carga para todos los roles
- [ ] Módulo Empleados: CRUD completo funciona
- [ ] Módulo Reclutamiento: ciclo completo vacante funciona
- [ ] Módulo Compras: ciclo completo solicitud funciona
- [ ] Módulo Papelería: solicitud y entrega funcionan
- [ ] Módulo Uniformes: entrega e historial funcionan
- [ ] Gestión de Accesos: asignar/quitar módulos funciona
- [ ] `DEUDA_TECNICA.md` actualizado con estado final
- [ ] `docs/` actualizado con nueva estructura

---

## 11. MÉTRICAS

### 11.1 Métricas de Progreso

| Métrica | Valor inicial | Meta | Unidad |
|---------|-------------|------|--------|
| Items P1 resueltos | 0 / 4 | 4 / 4 | items |
| Items P2 resueltos | 0 / 9 | 9 / 9 | items |
| Items P3 resueltos | 0 / 5 | 5 / 5 | items |
| Hallazgos nuevos resueltos | 0 / 7 | 7 / 7 | items |
| Controllers > 300 líneas | 7 | 0 | archivos |
| Servicios > 500 líneas | 3 | 0 | archivos |
| Páginas > 200 líneas | 12+ | 0 | archivos |
| Componentes > 300 líneas | 7+ | 0 | archivos |
| Middlewares monolíticos | 1 | 0 | archivos |
| Rutas con `requireRole` para módulos | 3 | 0 | archivos |

### 11.2 Métricas de Calidad

| Métrica | Objetivo |
|---------|---------|
| Cobertura de pruebas (si existen) | No reducir la cobertura existente |
| Tiempo de compilación backend | Sin incremento significativo |
| Tiempo de compilación frontend | Sin incremento significativo |
| Errores en consola (nuevos) | 0 |
| Warnings en consola (nuevos) | 0 |
| Regresiones funcionales | 0 |

### 11.3 Dashboard de Avance

```
Progreso total: [████████████████░░░░░░░░░░░░] 0/25 items (0%)

Fase 0: [░░░░░░░░░░░░░░░░░░░░] 0/3  Quick Wins
Fase 1: [░░░░░░░░░░░░░░░░░░░░] 0/4  Autorización
Fase 2: [░░░░░░░░░░░░░░░░░░░░] 0/1  Middlewares
Fase 3: [░░░░░░░░░░░░░░░░░░░░] 0/4  God Objects
Fase 4: [░░░░░░░░░░░░░░░░░░░░] 0/4  Frontend Componentes
Fase 5: [░░░░░░░░░░░░░░░░░░░░] 0/2  Infraestructura
Fase 6: [░░░░░░░░░░░░░░░░░░░░] 0/6  Páginas Frontend
Fase 7: [░░░░░░░░░░░░░░░░░░░░] 0/5  Servicios Backend
Fase 8: [░░░░░░░░░░░░░░░░░░░░] 0/2  Documentación
```

---

## 12. PRÓXIMAS FASES

### 12.1 Después de la Remediación

Una vez completadas todas las fases de este plan:

1. **Establecer política de no-regresión**: Ningún controller nuevo > 300 líneas, ningún servicio > 500 líneas.
2. **Integrar linter con límites**: Configurar ESLint con reglas de complejidad (max-lines, max-depth, complexity).
3. **Implementar CI/CD**: Agregar GitHub Actions que verifiquen compilación en cada PR.
4. **Plan de testing**: Implementar tests unitarios para servicios críticos y tests E2E para flujos principales.
5. **Monitoreo continuo**: Revisar `DEUDA_TECNICA.md` mensualmente para detectar nueva deuda temprano.

### 12.2 Mejora Continua

```
[Mensual] Revisión de métricas:
  - Controllers > 300 líneas: ¿hay nuevos?
  - Servicios > 500 líneas: ¿hay nuevos?
  - Páginas > 200 líneas: ¿hay nuevas?

[Trimestral] Auditoría de arquitectura:
  - ¿Se sigue respetando la separación de capas?
  - ¿Hay nuevos hardcodeos de roles?
  - ¿La documentación sigue sincronizada?

[Semestral] Revisión mayor:
  - Actualizar DEUDA_TECNICA.md
  - Evaluar nuevas tecnologías/patrones
  - Planificar siguiente ciclo de remediación
```

---

## 13. OBSERVACIONES DE LA AUDITORÍA

### 13.1 Discrepancias Detectadas

Durante la verificación del código para generar este plan, se detectaron las siguientes diferencias entre `DEUDA_TECNICA.md` y el código real:

| Item | DEUDA_TECNICA.md | Código real | Diferencia |
|------|-----------------|-------------|------------|
| P1-001 (`employee-core.controller.js`) | 1057 líneas | **1124 líneas** | +67 líneas (creció) |
| P1-002 (`recruitment.controller.js`) | 1384 líneas | **1551 líneas** | +167 líneas (creció) |
| P1-003 (`purchase.controller.js`) | 781 líneas | **865 líneas** | +84 líneas (creció) |
| P1-004 (`employee.controller.js`) | 1581 líneas | **1682 líneas** | +101 líneas (creció) |
| P2-004 (`DashboardLayout.js`) | ~250 líneas | **340 líneas** | +90 líneas (creció) |
| P2-006 (`docker-compose.yml`) | Sin healthchecks ni redes | **Redes definidas** (`kram-network`). Sin healthchecks en postgres. | Parcialmente resuelto. Prod tiene healthchecks. |

### 13.2 Hallazgos No Documentados

Estos items NO estaban en `DEUDA_TECNICA.md` y se descubrieron durante esta auditoría:

| ID | Archivo | Líneas | Problema | Prioridad sugerida |
|----|---------|--------|----------|-------------------|
| N-001 | `app/dashboard/compras/[id]/page.js` | 1776 | Página más grande del frontend | P2 |
| N-002 | `app/rh/empleados/[id]/page.js` | 1357 | Segunda página más grande | P2 |
| N-003 | `app/reclutamiento/vacantes/[id]/CandidatesTab.js` | 835 | Componente sobredimensionado | P2 |
| N-004 | `app/reclutamiento/solicitar-vacante/page.js` | 800 | Página de formulario enorme | P2 |
| N-005 | `app/rh/reclutamiento/crear-vacante/page.js` | 770 | Posible duplicación con N-004 | P2 |
| N-006 | `app/dashboard/organizacion/page.js` | 684 | Página de organización extensa | P2 |
| N-007 | `services/purchases/purchase-order.service.js` | 761 | Servicio excede límite de 500 líneas | P2 |
| N-008 | `services/purchases/status-notification.service.js` | 540 | Servicio excede límite de 500 líneas | P2 |
| N-009 | `services/purchases/purchase.service.js` | 595 | Servicio excede límite de 500 líneas | P2 |
| N-010 | `controllers/organization.controller.js` | 581 | Controller excede límite de 300 líneas | P2 |
| N-011 | `controllers/employee-csv.controller.js` | 832 | Controller excede límite de 300 líneas | P2 |
| N-012 | `controllers/auth.controller.js` | 317 | Ligeramente sobre el límite de 300 | P3 |
| N-013 | `components/QuoteSelectionModal.js` | 556 | Componente React excede 300 líneas | P2 |
| N-014 | `components/PurchaseOrderModal.js` | 495 | Componente React excede 300 líneas | P2 |
| N-015 | `components/PurchaseComments.js` | 488 | Componente React excede 300 líneas | P2 |
| N-016 | `components/EmployeeForm.js` | 485 | Componente React excede 300 líneas | P2 |

### 13.3 Notas Positivas

- Los controladores y servicios nuevos (`stationery`, `uniform`) son ejemplares: delgados, bien separados.
- La estructura de servicios `purchases/` sigue el patrón correcto de especialización.
- El proyecto ya tiene `docker-compose.prod.yml` con healthchecks, lo que muestra madurez en infraestructura.
- El modelo de seguridad de 3 niveles está bien implementado en la mayoría de las rutas.
- La documentación (`docs/`) es extensa y está bien organizada.

---

## 14. REFERENCIAS

| Documento | Ubicación |
|-----------|-----------|
| Reglas maestras del ERP | `.clinerules` |
| Arquitectura general | `docs/ARQUITECTURA_KRAM.md` |
| Matriz de permisos | `docs/MATRIZ_DE_PERMISOS.md` |
| Flujos de negocio | `docs/FLUJOS_DE_NEGOCIO.md` |
| Estándares de código | `docs/STANDARDS.md` |
| Guía de nuevos módulos | `docs/GUIA_NUEVO_MODULO.md` |
| Inventario de deuda | `docs/DEUDA_TECNICA.md` |
| **Plan de remediación** | **`docs/PLAN_REMEDIACION_DEUDA_TECNICA.md` (este documento)** |

---

> **Próximo paso**: Esperar autorización para comenzar la implementación por la Fase 0.