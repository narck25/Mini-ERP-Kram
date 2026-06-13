# DEUDA TÉCNICA — ERP KRAM

> **Versión**: 1.0  
> **Fecha**: 13/06/2026  
> **Propósito**: Identificar, clasificar y priorizar la deuda técnica acumulada en el sistema ERP KRAM para planificar su remediación.

---

## 1. RESUMEN EJECUTIVO

| Métrica | Valor |
|---------|-------|
| **Archivos analizados** | ~120 (backend + frontend) |
| **Ítems de deuda identificados** | 28 |
| **Críticos (P0)** | 5 |
| **Altos (P1)** | 9 |
| **Medios (P2)** | 8 |
| **Bajos (P3)** | 6 |
| **Esfuerzo estimado** | ~3-4 sprints (2 desarrolladores) |

---

## 2. CLASIFICACIÓN

| Prioridad | Significado | Plazo |
|-----------|-------------|-------|
| **P0 — Crítico** | Bug en producción, seguridad, datos inconsistentes | Inmediato |
| **P1 — Alto** | Impacto significativo en mantenibilidad, rendimiento | Próximo sprint |
| **P2 — Medio** | Mejora importante, código duplicado | Backlog próximo |
| **P3 — Bajo** | Refactor cosmético, documentación | Cuando se toque el área |

---

## 3. INVENTARIO DETALLADO DE DEUDA TÉCNICA

### 3.1 BACKEND — Controladores (Peso: Alto)

#### 🔴 P0-001: `employee-core.controller.js` — 1123 líneas (God Object)

| Atributo | Valor |
|----------|-------|
| **Archivo** | `backend/src/controllers/employee-core.controller.js` |
| **Líneas** | 1123 |
| **Métodos** | ~20 (CRUD empleados, historial sueldos, búsqueda, etc.) |
| **Problema** | Violación SRP (Single Responsibility Principle). Mezcla lógica de negocio, acceso a datos, formateo de respuestas y manejo de errores en un solo archivo. |
| **Impacto** | Difícil de testear, modificar o extender. Cualquier cambio en empleados requiere tocar este archivo. |
| **Solución** | Extraer a servicios: `employee.service.js`, `employee-search.service.js`, `salary-history.service.js` |
| **Esfuerzo** | 3-4 días |

#### 🔴 P0-002: `recruitment.controller.js` — 1550 líneas (God Object)

| Atributo | Valor |
|----------|-------|
| **Archivo** | `backend/src/controllers/recruitment.controller.js` |
| **Líneas** | 1550 |
| **Métodos** | ~25 (vacantes, candidatos, comentarios, actividades, documentos) |
| **Problema** | Mismo problema que P0-001. El controlador de reclutamiento es el archivo más grande del backend. |
| **Impacto** | Altísimo acoplamiento. Cualquier cambio en el flujo de reclutamiento requiere modificar este monstruo. |
| **Solución** | Extraer a servicios: `vacancy.service.js`, `candidate.service.js`, `recruitment-comment.service.js`, `recruitment-activity.service.js` |
| **Esfuerzo** | 4-5 días |

#### 🟡 P1-001: `purchase.controller.js` — 772 líneas (Orquestador)

| Atributo | Valor |
|----------|-------|
| **Archivo** | `backend/src/controllers/purchase.controller.js` |
| **Líneas** | 772 |
| **Problema** | Aunque ya se refactorizó parcialmente (delegó a servicios), el controlador sigue siendo grande y orquesta demasiadas responsabilidades. |
| **Impacto** | Medio. Ya tiene buena separación, pero aún se puede mejorar. |
| **Solución** | Continuar refactor: separar rutas de compras en submódulos (quotes, approvals, orders). |
| **Esfuerzo** | 1-2 días |

---

### 3.2 BACKEND — Middlewares de Autorización (Peso: Alto)

#### 🔴 P0-003: Middlewares hardcodeados por rol (`requireRHOrAdmin`, `requireSistemasOrAdmin`, etc.)

| Atributo | Valor |
|----------|-------|
| **Archivos** | `backend/src/middlewares/auth.middleware.js`, `backend/src/routes/employee.routes.js`, `backend/src/routes/recruitment.routes.js` |
| **Problema** | Existen middlewares como `requireRHOrAdmin()`, `requireSistemasOrAdmin()`, `requireComprasOrAdmin()`, `requireProduccionOrAdmin()` que hardcodean roles específicos. Esto viola la Regla de Oro del sistema (Nivel A: usar `accessibleModules`, no roles). |
| **Impacto** | Si se agrega un nuevo rol (ej. VENTAS), estos middlewares no lo cubren y hay que modificarlos manualmente. |
| **Solución** | Reemplazar por `requireModule('MODULO')` + bypass ADMIN/RH. Los middlewares hardcodeados por rol solo deben existir para operaciones Nivel C (ADMIN). |
| **Esfuerzo** | 2-3 días (afecta ~30 rutas) |

#### 🟡 P1-002: `requireRole(['ADMIN', 'COMPRAS'])` en rutas de compras

| Atributo | Valor |
|----------|-------|
| **Archivo** | `backend/src/routes/purchase.routes.js` |
| **Problema** | Las rutas de compras usan `requireRole(['ADMIN', 'COMPRAS'])` en lugar de `requireModule('COMPRAS')`. Aunque COMPRAS es un rol de negocio, la validación debería ser por módulo. |
| **Impacto** | Si un usuario RH necesita acceder a compras (con el módulo asignado), no podrá porque el rol no es COMPRAS. |
| **Solución** | Cambiar a `requireModule('COMPRAS')` y usar `requireRole(['ADMIN'])` solo para operaciones críticas. |
| **Esfuerzo** | 1 día |

---

### 3.3 BACKEND — Rutas Duplicadas (Peso: Medio)

#### 🟡 P1-003: Rutas de empleados duplicadas

| Atributo | Valor |
|----------|-------|
| **Archivos** | `backend/src/routes/employee.routes.js` (96 líneas) vs `backend/src/routes/organization.routes.js` (84 líneas) |
| **Problema** | Ambos archivos definen rutas para departamentos y puestos de trabajo. `employee.routes.js` tiene rutas como `GET /departments`, `GET /job-positions`, etc., y `organization.routes.js` tiene las mismas rutas pero con controladores diferentes. |
| **Impacto** | Inconsistencia: ¿qué archivo es la fuente de verdad? Posibles conflictos de rutas y comportamiento inesperado. |
| **Solución** | Unificar en un solo archivo (`organization.routes.js`) y eliminar las rutas duplicadas de `employee.routes.js`. |
| **Esfuerzo** | 0.5 días |

#### 🟢 P2-001: Endpoints legacy de vacantes (`vacancyApi` en frontend)

| Atributo | Valor |
|----------|-------|
| **Archivo** | `frontend/lib/api.js` (líneas 99-120) |
| **Problema** | Existe `vacancyApi` que apunta a `/vacancies/*` (endpoints legacy), pero el backend ya no tiene `vacancy.routes.js` (fue eliminado según comentario en `index.js` línea 48). |
| **Impacto** | Dead code en frontend. Si alguien usa `vacancyApi`, obtendrá 404. |
| **Solución** | Eliminar `vacancyApi` de `api.js` y migrar cualquier consumo a `recruitmentApi`. |
| **Esfuerzo** | 0.5 días |

---

### 3.4 FRONTEND — Componentes (Peso: Alto)

#### 🔴 P0-004: `DashboardLayout.js` — Navegación hardcodeada con roles

| Atributo | Valor |
|----------|-------|
| **Archivo** | `frontend/components/DashboardLayout.js` |
| **Problema** | La navegación de "Administración Global" usa `roles: ['ADMIN', 'RH']` hardcodeados para filtrar items. Esto viola la Regla de Oro (Nivel A: usar `accessibleModules`). Aunque también verifica módulos, el filtro de roles es restrictivo. |
| **Impacto** | Si un usuario SISTEMAS tiene el módulo EMPLEADOS, no verá "Mi Equipo" porque el item `{ name: 'Mi Equipo', href: '/rh/empleados', icon: '👥', module: 'EMPLEADOS' }` está en `myPortalNavigation` (bien), pero items como "Dashboard RH" requieren rol RH explícito. |
| **Solución** | Refactorizar para que la navegación se base 100% en `accessibleModules` y solo use roles para items de Nivel C (Gestión de Usuarios, Accesos). |
| **Esfuerzo** | 1-2 días |

#### 🟡 P1-004: `ProtectedRoute.js` — Componentes hardcodeados por rol

| Atributo | Valor |
|----------|-------|
| **Archivo** | `frontend/components/ProtectedRoute.js` |
| **Problema** | Existen `RHProtectedRoute`, `SistemasProtectedRoute`, `ComprasProtectedRoute`, `ProduccionProtectedRoute`, `AdminProtectedRoute` que hardcodean roles. |
| **Impacto** | Mismo problema que P0-003: no escalan con nuevos roles. |
| **Solución** | Eliminar componentes helpers hardcodeados. Usar solo `ProtectedRoute` con `requiredModule` y `allowedRoles` solo para Nivel C. |
| **Esfuerzo** | 1 día |

#### 🟡 P1-005: `AuthContext.js` — Helpers de rol hardcodeados

| Atributo | Valor |
|----------|-------|
| **Archivo** | `frontend/contexts/AuthContext.js` (líneas 151-155) |
| **Problema** | Existen `isAdmin()`, `isRH()`, `isSistemas()`, `isCompras()`, `isProduccion()` que hardcodean roles. |
| **Impacto** | Fomentan el mal uso (Nivel A con roles en vez de módulos). |
| **Solución** | Eliminar helpers específicos de rol. Dejar solo `hasRole()` genérico para Nivel C. |
| **Esfuerzo** | 0.5 días |

---

### 3.5 FRONTEND — Páginas (Peso: Medio)

#### 🟡 P1-006: `dashboard/usuarios/page.js` — Validación por rol ADMIN

| Atributo | Valor |
|----------|-------|
| **Archivo** | `frontend/app/dashboard/usuarios/page.js` (línea 200) |
| **Problema** | `if (!user || user.role !== 'ADMIN')` — Esto es correcto para Nivel C (gestión de usuarios es operación crítica), pero la página también usa `getAllRoles()` del frontend en vez de consumir `GET /api/roles`. |
| **Impacto** | Si se agrega un rol personalizado desde la UI de Accesos, la página de usuarios no lo mostrará porque usa el fallback local. |
| **Solución** | Consumir `systemApi.getRoles()` para obtener roles dinámicos. |
| **Esfuerzo** | 0.5 días |

#### 🟢 P2-002: `dashboard/accesos/page.js` — Dependencia de `rolesConfig` para nombres

| Atributo | Valor |
|----------|-------|
| **Archivo** | `frontend/app/dashboard/accesos/page.js` |
| **Problema** | Usa `getRoleName()` y `getRoleColor()` de `rolesConfig.js` (fallback local) en lugar de usar los nombres/colores que vienen de la API. |
| **Impacto** | Si se personaliza el color o nombre de un rol desde el backend, el frontend no lo reflejará. |
| **Solución** | Usar `role.name` y `role.color` directamente de la respuesta de la API, con fallback a `rolesConfig`. |
| **Esfuerzo** | 0.5 días |

---

### 3.6 SEGURIDAD (Peso: Alto)

#### 🔴 P0-005: Tokens JWT sin `accessibleModules` en payload

| Atributo | Valor |
|----------|-------|
| **Archivo** | `backend/src/controllers/auth.controller.js` (asumido) |
| **Problema** | Según las reglas del sistema, el JWT debe incluir `accessibleModules` y `role` en el payload. Si no se incluye, el frontend no puede validar módulos sin hacer una llamada API adicional. |
| **Impacto** | El frontend podría mostrar módulos que el usuario ya no tiene acceso (si se cambiaron los permisos y el token no se refrescó). |
| **Solución** | Verificar que el JWT incluya `accessibleModules` y forzar regeneración del token al cambiar permisos. |
| **Esfuerzo** | 1 día |

#### 🟡 P1-007: Contraseñas hardcodeadas en docker-compose

| Atributo | Valor |
|----------|-------|
| **Archivo** | `docker-compose.yml` |
| **Problema** | `POSTGRES_PASSWORD: krampassword123` y `PGADMIN_DEFAULT_PASSWORD: admin123` están en texto plano. |
| **Impacto** | Riesgo de seguridad si el repositorio es público o accesible. |
| **Solución** | Usar variables de entorno (`.env`) como ya se hace en `docker-compose.prod.yml`. |
| **Esfuerzo** | 0.5 días |

---

### 3.7 PRISMA / BASE DE DATOS (Peso: Medio)

#### 🟢 P2-003: Modelo `Role` duplicado con enum `RoleType`

| Atributo | Valor |
|----------|-------|
| **Archivo** | `backend/prisma/schema.prisma` |
| **Problema** | Existe tanto el enum `RoleType` como el modelo `Role` (tabla). El enum define los roles del sistema, pero la tabla `Role` permite roles personalizados. Hay duplicación conceptual. |
| **Impacto** | Confusión: ¿los roles se validan contra el enum o contra la tabla? |
| **Solución** | Documentar claramente que `RoleType` enum es para roles del sistema y la tabla `Role` es para roles personalizados. Considerar eliminar el enum y usar solo la tabla. |
| **Esfuerzo** | 1 día (requiere migración) |

#### 🟢 P2-004: Falta de índices en tablas grandes

| Atributo | Valor |
|----------|-------|
| **Archivo** | `backend/prisma/schema.prisma` |
| **Problema** | Tablas como `AttendanceRecord`, `PurchaseRequest`, `JobVacancy` no tienen índices explícitos en campos de búsqueda frecuente (fechas, estatus, userId). |
| **Impacto** | Degradación de rendimiento conforme crecen los datos. |
| **Solución** | Agregar índices compuestos en campos de filtrado común. |
| **Esfuerzo** | 0.5 días |

---

### 3.8 INFRAESTRUCTURA (Peso: Bajo)

#### 🟢 P2-005: Docker Compose de desarrollo sin healthcheck

| Atributo | Valor |
|----------|-------|
| **Archivo** | `docker-compose.yml` |
| **Problema** | El docker-compose de desarrollo no tiene healthchecks ni depends_on condition, lo que puede causar que la app inicie antes que PostgreSQL. |
| **Impacto** | Errores intermitentes al levantar el entorno con `docker-compose up`. |
| **Solución** | Agregar healthchecks (como ya se hizo en `docker-compose.prod.yml`). |
| **Esfuerzo** | 0.5 días |

#### 🟢 P3-001: Scripts batch sin verificación de errores

| Atributo | Valor |
|----------|-------|
| **Archivos** | `start-backend.bat`, `start-frontend.bat` |
| **Problema** | Los scripts batch no verifican si los directorios existen, si las dependencias están instaladas, etc. |
| **Impacto** | Bajo. Solo afecta desarrollo local. |
| **Solución** | Agregar verificaciones básicas. |
| **Esfuerzo** | 0.5 días |

---

### 3.9 CÓDIGO MUERTO (Peso: Medio)

#### 🟡 P1-008: Endpoints de prueba en auth.routes.js

| Atributo | Valor |
|----------|-------|
| **Archivo** | `backend/src/routes/auth.routes.js` (líneas 51-89) |
| **Problema** | Existen 4 endpoints de test (`/test/admin`, `/test/rh`, `/test/sistemas`, `/test/compras`, `/test/produccion`) que solo devuelven un mensaje. |
| **Impacto** | Código muerto en producción. Posible superficie de ataque. |
| **Solución** | Eliminar o mover a un archivo de desarrollo condicional (`if (NODE_ENV !== 'production')`). |
| **Esfuerzo** | 0.5 días |

#### 🟢 P2-006: Ruta admin/users sin implementar

| Atributo | Valor |
|----------|-------|
| **Archivo** | `backend/src/routes/auth.routes.js` (líneas 41-48) |
| **Problema** | `GET /auth/admin/users` existe pero solo devuelve un mensaje placeholder. |
| **Impacto** | Confusión: parece un endpoint funcional pero no lo es. |
| **Solución** | Implementar o eliminar. |
| **Esfuerzo** | 0.5 días |

#### 🟢 P3-002: `statsApi` con endpoints que pueden no existir

| Atributo | Valor |
|----------|-------|
| **Archivo** | `frontend/lib/api.js` (líneas 174-183) |
| **Problema** | `statsApi.getRHStats()` apunta a `/stats/rh` y `statsApi.getDepartmentStats()` a `/stats/department`, pero las rutas reales en `stats.routes.js` son `/stats/rh/dashboard` y `/stats/my-dashboard`. |
| **Impacto** | Dead code o errores 404 si alguien usa estos métodos. |
| **Solución** | Actualizar o eliminar. |
| **Esfuerzo** | 0.5 días |

---

### 3.10 FRONTEND — Estructura de Archivos (Peso: Bajo)

#### 🟢 P3-003: Convención de nombres inconsistente

| Atributo | Valor |
|----------|-------|
| **Problema** | Mezcla de convenciones: `kebab-case` (ej. `rolesConfig.js`), `PascalCase` (ej. `DashboardLayout.js`, `RoleManager.js`), `camelCase` (ej. `api.js`). |
| **Impacto** | Bajo. No afecta funcionalidad, pero dificulta la navegación. |
| **Solución** | Estandarizar a `kebab-case` para archivos de utilería y `PascalCase` para componentes React. |
| **Esfuerzo** | 1 día (refactor cosmético) |

#### 🟢 P3-004: Componentes en `frontend/components/` sin subdirectorios

| Atributo | Valor |
|----------|-------|
| **Problema** | Los 11 componentes están en la raíz de `components/` sin organización por módulo. |
| **Impacto** | A medida que crecen los componentes, se vuelve difícil encontrar el correcto. |
| **Solución** | Organizar en subdirectorios: `components/layout/`, `components/rh/`, `components/compras/`, `components/common/`. |
| **Esfuerzo** | 1 día |

---

## 4. MAPA DE CALOR POR MÓDULO

| Módulo | Deuda Crítica (P0) | Deuda Alta (P1) | Deuda Media (P2) | Deuda Baja (P3) | Prioridad |
|--------|-------------------|-----------------|------------------|-----------------|-----------|
| **Empleados** | P0-001 (God Object) | P1-003 (rutas duplicadas) | — | — | 🔴 Alta |
| **Reclutamiento** | P0-002 (God Object) | P0-003 (middlewares) | P2-001 (legacy) | — | 🔴 Alta |
| **Compras** | — | P1-001, P1-002 | — | — | 🟡 Media |
| **Auth/Seguridad** | P0-005 (JWT) | P1-007 (passwords) | — | P1-008 (tests) | 🔴 Alta |
| **Frontend (Layout)** | P0-004 (nav hardcodeada) | P1-004, P1-005 | — | P3-003, P3-004 | 🔴 Alta |
| **Frontend (Páginas)** | — | P1-006 | P2-002 | — | 🟡 Media |
| **Base de Datos** | — | — | P2-003, P2-004 | — | 🟢 Baja |
| **Infraestructura** | — | — | P2-005 | P3-001 | 🟢 Baja |
| **Código Muerto** | — | P1-008 | P2-006 | P3-002 | 🟡 Media |

---

## 5. PLAN DE REMEDIACIÓN SUGERIDO

### Sprint 1: Seguridad y Middlewares (P0 + P1 críticos)

| ID | Ítem | Días |
|----|------|------|
| P0-003 | Refactor middlewares hardcodeados → `requireModule()` | 2-3 |
| P0-005 | JWT con `accessibleModules` + regeneración al cambiar permisos | 1 |
| P1-007 | Mover passwords a variables de entorno | 0.5 |
| P1-008 | Eliminar endpoints de test | 0.5 |
| **Total** | | **4-5 días** |

### Sprint 2: Refactor Backend (God Objects)

| ID | Ítem | Días |
|----|------|------|
| P0-001 | Extraer `employee-core.controller.js` a servicios | 3-4 |
| P0-002 | Extraer `recruitment.controller.js` a servicios | 4-5 |
| P1-001 | Refactor parcial `purchase.controller.js` | 1-2 |
| **Total** | | **8-11 días** |

### Sprint 3: Frontend y Rutas

| ID | Ítem | Días |
|----|------|------|
| P0-004 | Refactor `DashboardLayout.js` (navegación por módulos) | 1-2 |
| P1-003 | Unificar rutas duplicadas de empleados/organización | 0.5 |
| P1-004 | Eliminar componentes ProtectedRoute hardcodeados | 1 |
| P1-005 | Eliminar helpers de rol en AuthContext | 0.5 |
| P1-006 | Consumir roles desde API en página de usuarios | 0.5 |
| P2-001 | Eliminar `vacancyApi` legacy | 0.5 |
| P2-002 | Usar datos de API en página de accesos | 0.5 |
| **Total** | | **4.5-6 días** |

### Sprint 4: Limpieza y Calidad

| ID | Ítem | Días |
|----|------|------|
| P2-003 | Documentar/refactor modelo Role vs enum | 1 |
| P2-004 | Agregar índices a tablas grandes | 0.5 |
| P2-005 | Healthchecks en docker-compose dev | 0.5 |
| P2-006 | Implementar o eliminar ruta admin/users | 0.5 |
| P3-001 | Mejorar scripts batch | 0.5 |
| P3-002 | Actualizar/eliminar statsApi | 0.5 |
| P3-003 | Estandarizar convención de nombres | 1 |
| P3-004 | Organizar componentes en subdirectorios | 1 |
| **Total** | | **5.5 días** |

---

## 6. RIESGOS Y DEPENDENCIAS

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| **Refactor de middlewares (P0-003)** puede romper rutas existentes | Alto | Agregar tests de integración antes de refactorizar |
| **Extraer God Objects (P0-001, P0-002)** puede introducir bugs | Alto | Refactor incremental, no reescribir todo de golpe |
| **Cambio de JWT (P0-005)** puede dejar sesiones inválidas | Medio | Forzar logout de todos los usuarios al hacer deploy |
| **Refactor DashboardLayout (P0-004)** puede cambiar navegación | Medio | Validar con usuarios RH y ADMIN antes del deploy |

---

## 7. MÉTRICAS DE CÓDIGO

| Métrica | Backend | Frontend |
|---------|---------|----------|
| **Archivos totales** | ~40 | ~80 |
| **Líneas totales** | ~8,500 | ~12,000 |
| **God Objects (>500 líneas)** | 2 (employee-core: 1123, recruitment: 1550) | 0 |
| **Archivos grandes (>300 líneas)** | 4 | 3 |
| **Middlewares hardcodeados** | 5 | 5 helpers |
| **Endpoints de prueba** | 5 | 0 |
| **Código muerto (estimado)** | ~150 líneas | ~200 líneas |

---

## 8. NOTAS ADICIONALES

- **Deuda aceptada conscientemente**: Los God Objects de empleados y reclutamiento se crearon en fases tempranas del proyecto cuando la prioridad era la velocidad de entrega. Ahora que el sistema está estable, es momento de refactorizar.
- **Deuda heredada**: Los middlewares hardcodeados (`requireRHOrAdmin`, etc.) son de una versión anterior del sistema de permisos. La migración a `requireModule()` ya comenzó pero no se completó.
- **Deuda por crecimiento**: La falta de índices en BD y la organización plana de componentes son consecuencias del crecimiento orgánico del proyecto.

---

*Documento generado el 13/06/2026 basado en análisis estático del código fuente.*
