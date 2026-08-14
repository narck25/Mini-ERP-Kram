# MATRIZ DE PERMISOS — ERP KRAM

> **Documento generado:** 13/06/2026
> **Última actualización:** 13/06/2026
> **Versión:** 1.1 — Roles Estratégicos
> **Propósito:** Documentar el estado actual del modelo de autorización del sistema.
> **Restricción:** Este documento NO propone cambios. Solo describe el estado actual del código fuente.

---

## 1. Introducción

El sistema ERP KRAM implementa un modelo de autorización de **tres niveles** (Tiered Access Control), definido principalmente en `backend/src/middlewares/auth.middleware.js` y aplicado en todas las rutas del backend.

### Nivel A — Control de Acceso a Módulos (`requireModule`)

Verifica que el módulo requerido esté presente en `req.user.accessibleModules[]`. Es la primera barrera de seguridad para acceder a cualquier funcionalidad del sistema.

- **Mecanismo:** `AuthMiddleware.requireModule('NOMBRE_MODULO')`
- **Datos:** El array `accessibleModules` se carga desde la base de datos (campo `User.accessibleModules`) y se incluye en el payload del JWT.
- **Frontend:** El sidebar (`DashboardLayout.js`) filtra las opciones de navegación usando `user.accessibleModules?.includes(item.module)`.
- **Frontend:** El componente `ProtectedRoute.js` puede validar `requiredModule` para proteger rutas completas.

### Nivel B — Restricciones de Negocio (Scoping / Ownership)

Aplicadas dentro de los controladores o servicios, después de pasar el Nivel A. Determinan QUÉ datos puede ver o modificar un usuario dentro de un módulo.

- **Mecanismo:** Lógica de negocio inline en controladores (ej: filtrar por `solicitanteId`, verificar propiedad de vacante, etc.)
- **Ejemplos:**
  - Compras: `GET /api/purchases/my` filtra por `solicitanteId = employee.id`
  - Reclutamiento: Votación de candidatos solo del solicitante de la vacante
  - Empleados: Scoping jerárquico (jefe ve empleados de su departamento)

### Nivel C — Roles Administrativos Especiales (`requireRole`)

Restringe operaciones sensibles a roles específicos del sistema.

- **Mecanismo:** `AuthMiddleware.requireRole(['ADMIN'])` o `AuthMiddleware.requireRHOrAdmin()`
- **Uso:** Exclusivamente para operaciones que modifican la configuración del sistema, gestionan usuarios, o ejecutan acciones destructivas.
- **Roles Estratégicos con bypass total:** `ADMIN` (control técnico global) y `RH` (control operativo global autorizado por Dirección General) tienen acceso completo a módulos y datos.
- **Política de seguridad:** Ningún otro rol deberá recibir privilegios equivalentes a ADMIN o RH sin autorización expresa de Presidencia.

---

## 2. Inventario de Roles

### 2.1 Roles del Sistema (SYSTEM_ROLES)

Definidos en `backend/src/routes/roles.routes.js` (líneas 15-22) como el enum `RoleType` del sistema.

| Rol | Nombre | Descripción | Color | Icono | Fuente |
|-----|--------|-------------|-------|-------|--------|
| `EMPLEADO_BASICO` | Empleado | Acceso básico al sistema | `bg-gray-100 text-gray-800` | 👤 | SYSTEM_ROLES |
| `ADMIN` | Administrador | Administrador del sistema — control técnico global | `bg-purple-100 text-purple-800` | 👑 | SYSTEM_ROLES |
| `RH` | Recursos Humanos | Gestión de personal y reclutamiento — control operativo global autorizado por Dirección General | `bg-blue-100 text-blue-800` | 👥 | SYSTEM_ROLES |
| `SISTEMAS` | Sistemas | Soporte técnico y sistemas | `bg-green-100 text-green-800` | 💻 | SYSTEM_ROLES |
| `COMPRAS` | Compras | Gestión de compras y proveedores | `bg-yellow-100 text-yellow-800` | 🛒 | SYSTEM_ROLES |
| `PRODUCCION` | Producción | Gestión de producción | `bg-red-100 text-red-800` | 🏭 | SYSTEM_ROLES |

### 2.2 Roles Fallback (ROLE_FALLBACK_CONFIG)

Definidos en `frontend/lib/rolesConfig.js` (líneas 19-62). Coinciden exactamente con SYSTEM_ROLES en id, nombre, color, icono y descripción. Se usan como fallback visual cuando la API `GET /api/roles` no está disponible.

| Rol | Nombre | Descripción | Color | Icono | Fuente |
|-----|--------|-------------|-------|-------|--------|
| `ADMIN` | Administrador | Administrador del sistema — control técnico global | `bg-purple-100 text-purple-800` | 👑 | ROLE_FALLBACK_CONFIG |
| `RH` | Recursos Humanos | Gestión de personal y reclutamiento — control operativo global autorizado por Dirección General | `bg-blue-100 text-blue-800` | 👥 | ROLE_FALLBACK_CONFIG |
| `SISTEMAS` | Sistemas | Soporte técnico y sistemas | `bg-green-100 text-green-800` | 💻 | ROLE_FALLBACK_CONFIG |
| `COMPRAS` | Compras | Gestión de compras y proveedores | `bg-yellow-100 text-yellow-800` | 🛒 | ROLE_FALLBACK_CONFIG |
| `PRODUCCION` | Producción | Gestión de producción | `bg-red-100 text-red-800` | 🏭 | ROLE_FALLBACK_CONFIG |
| `EMPLEADO_BASICO` | Empleado | Acceso básico al sistema | `bg-gray-100 text-gray-800` | 👤 | ROLE_FALLBACK_CONFIG |

### 2.3 Roles Personalizados

Definidos en la tabla `Role` de la base de datos (modelo Prisma). Se crean vía `POST /api/roles` (solo ADMIN). No hay roles personalizados predefinidos; se crean dinámicamente.

| Rol | Nombre | Descripción | Color | Icono | Fuente |
|-----|--------|-------------|-------|-------|--------|
| *(dinámico)* | *(definido por usuario)* | *(definido por usuario)* | *(definido por usuario)* | *(definido por usuario)* | Roles personalizados |

> **Nota:** Los roles personalizados se almacenan en la tabla `Role` con `isCustom: true`. No tienen presets de módulos asociados.

---

## 3. Inventario de Módulos

Definidos en `backend/src/config/modules.config.js`. El módulo `DASHBOARD` es implícito (no está en la configuración pero se agrega automáticamente en todas las validaciones).

| Módulo | Label | Enabled | Descripción |
|--------|-------|---------|-------------|
| `EMPLEADOS` | Empleados | ✅ `true` | Gestión de empleados y expedientes |
| `RECLUTAMIENTO` | Reclutamiento | ✅ `true` | Gestión de vacantes y candidatos |
| `VACACIONES` | Vacaciones | ❌ `false` | Solicitud y aprobación de vacaciones |
| `INCIDENCIAS` | Incidencias | ✅ `true` | Reporte y seguimiento de incidencias |
| `CONFIGURACION` | Configuración | ✅ `true` | Configuración del sistema |
| `REPORTES` | Reportes | ❌ `false` | Generación de reportes y estadísticas |
| `COMPRAS` | Compras | ✅ `true` | Gestión de compras |
| `DASHBOARD` | Dashboard | ✅ *(implícito)* | Panel principal (siempre activo) |

**Módulos habilitados: 6** (5 en `modules.config.js` + `DASHBOARD` implícito). VACACIONES y REPORTES deshabilitados (sin implementación).

---

## 4. Presets de Módulos por Rol

Definidos en `backend/src/config/roles.config.js`. Determinan qué módulos tiene cada rol por defecto.

| Rol | Módulos incluidos |
|-----|-------------------|
| `ADMIN` | `DASHBOARD`, `EMPLEADOS`, `RECLUTAMIENTO`, `INCIDENCIAS`, `CONFIGURACION`, `COMPRAS` |
| `RH` | `DASHBOARD`, `EMPLEADOS`, `RECLUTAMIENTO`, `INCIDENCIAS` |
| `SISTEMAS` | `DASHBOARD`, `CONFIGURACION` |
| `COMPRAS` | `DASHBOARD`, `COMPRAS` |
| `PRODUCCION` | `DASHBOARD` |
| `EMPLEADO_BASICO` | `DASHBOARD` |

**Total de presets: 6** (uno por cada rol del sistema)

---

## 5. Matriz Global de Acceso

Construida a partir de los presets definidos en `roles.config.js`.

| Módulo | EMPLEADO_BASICO | PRODUCCION | COMPRAS | SISTEMAS | RH | ADMIN |
|--------|:---------------:|:----------:|:-------:|:--------:|:--:|:-----:|
| `DASHBOARD` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `EMPLEADOS` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `RECLUTAMIENTO` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `INCIDENCIAS` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `CONFIGURACION` | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `COMPRAS` | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |

> **Leyenda:** ✅ = incluido en preset / ❌ = no incluido
>
> **Nota importante:** Los presets son valores por defecto. Los módulos de cada usuario pueden personalizarse desde la UI de Gestión de Accesos (ADMIN/RH). El array `accessibleModules` se almacena por usuario en la base de datos.

---

## 6. Rutas Protegidas por Módulo

Endpoints protegidos con `requireModule('NOMBRE_MODULO')`. Analizados de todos los archivos en `backend/src/routes/*.js`.

### 6.1 Módulo: `EMPLEADOS`

| Endpoint | Método | Módulo requerido |
|----------|--------|------------------|
| `/api/employees` | GET | `EMPLEADOS` |
| `/api/employee/:employeeId/documents` | GET | `EMPLEADOS` |
| `/api/employee-documents/allowed-types` | GET | `EMPLEADOS` |
| `/api/employee-documents/:documentId/download` | GET | `EMPLEADOS` |
| `/api/stats/rh/dashboard` | GET | `EMPLEADOS` |
| `/api/stats/my-dashboard` | GET | `EMPLEADOS` |
| `/api/departments` | GET | `EMPLEADOS` |
| `/api/departments/:id` | GET | `EMPLEADOS` |
| `/api/departments` | POST | `EMPLEADOS` |
| `/api/departments/:id` | PUT | `EMPLEADOS` |
| `/api/departments/:id` | DELETE | `EMPLEADOS` |
| `/api/job-positions` | GET | `EMPLEADOS` |
| `/api/job-positions/:id` | GET | `EMPLEADOS` |
| `/api/job-positions` | POST | `EMPLEADOS` |
| `/api/job-positions/:id` | PUT | `EMPLEADOS` |
| `/api/job-positions/:id` | DELETE | `EMPLEADOS` |
| `/api/departments/:departmentId/job-positions` | GET | `EMPLEADOS` |
| `/api/organization/stats` | GET | `EMPLEADOS` |

### 6.2 Módulo: `RECLUTAMIENTO`

| Endpoint | Método | Módulo requerido |
|----------|--------|------------------|
| `/api/recruitment/vacancies` | POST | `RECLUTAMIENTO` |
| `/api/recruitment/my-vacancies` | GET | `RECLUTAMIENTO` |
| `/api/recruitment/vacancies/:id/technical-profile` | PUT | `RECLUTAMIENTO` |
| `/api/recruitment/vacancies/:id/activities` | POST | `RECLUTAMIENTO` |
| `/api/recruitment/vacancies` | GET | `RECLUTAMIENTO` |
| `/api/recruitment/vacancies/stats` | GET | `RECLUTAMIENTO` |
| `/api/recruitment/vacancies/:id` | GET | `RECLUTAMIENTO` |
| `/api/recruitment/vacancies/:id/comments` | POST | `RECLUTAMIENTO` |
| `/api/recruitment/candidates/:candidate_id/vote` | PUT | `RECLUTAMIENTO` |
| `/api/recruitment/candidates/:candidate_id/select` | PUT | `RECLUTAMIENTO` |
| `/api/recruitment/candidates/:candidate_id/cv` | GET | `RECLUTAMIENTO` |
| `/api/recruitment/activities/:activityId` | PUT | `RECLUTAMIENTO` |
| `/api/recruitment/vacancies/:id/cancel` | PUT | `RECLUTAMIENTO` |

### 6.3 Módulo: `INCIDENCIAS`

| Endpoint | Método | Módulo requerido |
|----------|--------|------------------|
| `/api/incidencias/upload` | POST | `INCIDENCIAS` |
| `/api/incidencias/` | GET | `INCIDENCIAS` |

### 6.4 Módulo: `CONFIGURACION`

| Endpoint | Método | Módulo requerido |
|----------|--------|------------------|
| `/api/stats/system` | GET | `CONFIGURACION` |

### 6.5 Módulo: `COMPRAS`

| Endpoint | Método | Módulo requerido |
|----------|--------|------------------|
| `/api/purchases` | POST | `COMPRAS` |
| `/api/purchases/my` | GET | `COMPRAS` |
| `/api/purchases` | GET | `COMPRAS` |
| `/api/purchases/details/:id` | GET | `COMPRAS` |
| `/api/purchases/:id/quotes` | POST | `COMPRAS` |
| `/api/purchases/:id/select-quote` | POST | `COMPRAS` |
| `/api/purchases/:id/authorize` | POST | `COMPRAS` |
| `/api/purchases/:id/deliver` | POST | `COMPRAS` |
| `/api/purchases/:id/potential-approvers` | GET | `COMPRAS` |
| `/api/purchases/:id/assign-approvers` | POST | `COMPRAS` |
| `/api/purchases/:id/send-authorization` | POST | `COMPRAS` |
| `/api/purchases/:id/cancel` | POST | `COMPRAS` |
| `/api/purchases/:id/quotes/:quoteId/upload` | POST | `COMPRAS` |
| `/api/purchases/:id/quotes/upload-with-file` | POST | `COMPRAS` |
| `/api/purchases/:id/upload-quote-file` | POST | `COMPRAS` |
| `/api/purchases/:id/quotes/:quoteId/amount` | PUT | `COMPRAS` |
| `/api/purchases/:id/comparison` | GET | `COMPRAS` |
| `/api/purchases/:id/purchase-order` | GET | `COMPRAS` |
| `/api/purchases/:id/purchase-order` | POST | `COMPRAS` |
| `/api/purchase-orders` | GET | `COMPRAS` |
| `/api/purchases/:id/regenerate-order` | POST | `COMPRAS` |
| `/api/purchases/:id/audit` | GET | `COMPRAS` |
| `/api/purchases/:id/comments/stream` | GET | `COMPRAS` |
| `/api/purchases/:id/comments` | GET | `COMPRAS` |
| `/api/purchases/:id/comments` | POST | `COMPRAS` |

### 6.6 Resumen de Rutas por Módulo

| Módulo | Cantidad de endpoints |
|--------|:---------------------:|
| `EMPLEADOS` | 18 |
| `RECLUTAMIENTO` | 13 |
| `INCIDENCIAS` | 2 |
| `CONFIGURACION` | 1 |
| `COMPRAS` | 25 |
| **Total** | **59** |

> **Nota:** No se encontraron rutas protegidas con `requireModule` para los módulos `VACACIONES`, `REPORTES` ni `DASHBOARD`.

---

## 7. Rutas Protegidas por Rol

Endpoints protegidos con `requireRole()`, `requireRHOrAdmin()`, `requireAdmin()`, `requireComprasOrAdmin()`, `requireSistemasOrAdmin()`, `requireProduccionOrAdmin()`, o middleware inline basado en rol.

### 7.1 `requireRole(['ADMIN'])` — Solo ADMIN

| Endpoint | Método | Restricción |
|----------|--------|-------------|
| `/api/auth/admin/users` | GET | `requireAdmin()` |
| `/api/auth/test/admin` | GET | `requireAdmin()` |
| `/api/users/` | GET | `requireRole(['ADMIN'])` (router.use) |
| `/api/users/stats` | GET | `requireRole(['ADMIN'])` (router.use) |
| `/api/users/:id` | GET | `requireRole(['ADMIN'])` (router.use) |
| `/api/users/` | POST | `requireRole(['ADMIN'])` (router.use) |
| `/api/users/:id` | PUT | `requireRole(['ADMIN'])` (router.use) |
| `/api/users/:id` | DELETE | `requireRole(['ADMIN'])` (router.use) |
| `/api/roles` | POST | `requireRole(['ADMIN'])` |
| `/api/roles/:id` | PUT | `requireRole(['ADMIN'])` |
| `/api/roles/:id` | DELETE | `requireRole(['ADMIN'])` |
| `/api/seed/reset` | POST | `requireRole(['ADMIN'])` |

### 7.2 `requireRole(['ADMIN', 'RH'])` — ADMIN o RH

| Endpoint | Método | Restricción |
|----------|--------|-------------|
| `/api/auth/test/rh` | GET | `requireRHOrAdmin()` |
| `/api/permissions/users` | GET | `requireRole(['ADMIN', 'RH'])` |
| `/api/permissions/modules` | GET | `requireRole(['ADMIN', 'RH'])` |
| `/api/permissions/users/:id` | PUT | `requireRole(['ADMIN', 'RH'])` |
| `/api/users/:id/reset-password` | POST | `requireRole(['ADMIN', 'RH'])` |
| `/api/employees/template` | GET | `requireRHOrAdmin()` |
| `/api/employees/import` | POST | `requireRHOrAdmin()` |
| `/api/employees/export` | GET | `requireRHOrAdmin()` |
| `/api/employees/stats` | GET | `requireRHOrAdmin()` |
| `/api/employees` | POST | `requireRHOrAdmin()` |
| `/api/employees/:id` | GET | `requireRHOrAdmin()` |
| `/api/employees/:id` | PUT | `requireRHOrAdmin()` |
| `/api/employees/:id` | DELETE | `requireRHOrAdmin()` |
| `/api/employees/:id/permanent` | DELETE | `requireRHOrAdmin()` |
| `/api/employees/:id/salary-history` | GET | `requireRHOrAdmin()` |
| `/api/employees/:id/photo` | POST | `requireRHOrAdmin()` |
| `/api/departments` | POST | `requireRHOrAdmin()` |
| `/api/departments/:id` | PUT | `requireRHOrAdmin()` |
| `/api/departments/:id` | DELETE | `requireRHOrAdmin()` |
| `/api/job-positions` | POST | `requireRHOrAdmin()` |
| `/api/job-positions/:id` | PUT | `requireRHOrAdmin()` |
| `/api/job-positions/:id` | DELETE | `requireRHOrAdmin()` |
| `/api/employee/:employeeId/documents` | POST | `requireRHOrAdmin()` |
| `/api/employee-documents/:documentId` | DELETE | `requireRHOrAdmin()` |
| `/api/recruitment/vacancies/:id/approve` | PUT | `requireRHOrAdmin()` |
| `/api/recruitment/vacancies/:id/close` | PUT | `requireRHOrAdmin()` |
| `/api/recruitment/vacancies/direct` | POST | `requireRHOrAdmin()` |
| `/api/recruitment/vacancies/:vacancy_id/candidates` | POST | `requireRHOrAdmin()` |
| `/api/recruitment/candidates/:candidate_id/observations` | PUT | `requireRHOrAdmin()` |
| `/api/recruitment/candidates/:candidate_id/documents` | PUT | `requireRHOrAdmin()` |
| `/api/recruitment/vacancies/:id` | DELETE | `requireRHOrAdmin()` |

### 7.3 `requireRole(['ADMIN', 'COMPRAS'])` — ADMIN o COMPRAS

| Endpoint | Método | Restricción |
|----------|--------|-------------|
| `/api/auth/test/compras` | GET | `requireComprasOrAdmin()` |
| `/api/purchases` | GET | `requireRole(['ADMIN', 'COMPRAS'])` |
| `/api/purchases/:id/quotes` | POST | `requireRole(['ADMIN', 'COMPRAS'])` |
| `/api/purchases/:id/select-quote` | POST | `requireRole(['ADMIN', 'COMPRAS'])` |
| `/api/purchases/:id/authorize` | POST | `requireRole(['ADMIN', 'COMPRAS'])` |
| `/api/purchases/:id/potential-approvers` | GET | `requireRole(['ADMIN', 'COMPRAS'])` |
| `/api/purchases/:id/assign-approvers` | POST | `requireRole(['ADMIN', 'COMPRAS'])` |
| `/api/purchases/:id/send-authorization` | POST | `requireRole(['ADMIN', 'COMPRAS'])` |
| `/api/purchases/:id/quotes/:quoteId/upload` | POST | `requireRole(['ADMIN', 'COMPRAS'])` |
| `/api/purchases/:id/quotes/upload-with-file` | POST | `requireRole(['ADMIN', 'COMPRAS'])` |
| `/api/purchases/:id/upload-quote-file` | POST | `requireRole(['ADMIN', 'COMPRAS'])` |
| `/api/purchases/:id/quotes/:quoteId/amount` | PUT | `requireRole(['ADMIN', 'COMPRAS'])` |
| `/api/purchases/:id/purchase-order` | POST | `requireRole(['ADMIN', 'COMPRAS'])` |
| `/api/purchase-orders` | GET | `requireRole(['ADMIN', 'COMPRAS'])` |
| `/api/purchases/:id/regenerate-order` | POST | `requireRole(['ADMIN', 'COMPRAS'])` |
| `/api/purchases/:id/audit` | GET | `requireRole(['ADMIN', 'COMPRAS'])` |

### 7.4 `requireRole(['ADMIN', 'SISTEMAS'])` — ADMIN o SISTEMAS

| Endpoint | Método | Restricción |
|----------|--------|-------------|
| `/api/auth/test/sistemas` | GET | `requireSistemasOrAdmin()` |

### 7.5 `requireRole(['ADMIN', 'PRODUCCION'])` — ADMIN o PRODUCCION

| Endpoint | Método | Restricción |
|----------|--------|-------------|
| `/api/auth/test/produccion` | GET | `requireProduccionOrAdmin()` |

### 7.6 Middleware Inline por Rol (Notificaciones)

| Endpoint | Método | Restricción |
|----------|--------|-------------|
| `/api/notifications/check-now` | POST | `requireAdminOrRH` (inline: `req.user.role === 'ADMIN' \|\| req.user.role === 'RH'`) |
| `/api/notifications/logs` | GET | `requireAdminOrRH` (inline: `req.user.role === 'ADMIN' \|\| req.user.role === 'RH'`) |

### 7.7 Resumen de Rutas por Restricción

| Restricción | Cantidad de endpoints |
|-------------|:---------------------:|
| `requireRole(['ADMIN'])` | 12 |
| `requireRole(['ADMIN', 'RH'])` / `requireRHOrAdmin()` | 31 |
| `requireRole(['ADMIN', 'COMPRAS'])` / `requireComprasOrAdmin()` | 16 |
| `requireRole(['ADMIN', 'SISTEMAS'])` / `requireSistemasOrAdmin()` | 1 |
| `requireRole(['ADMIN', 'PRODUCCION'])` / `requireProduccionOrAdmin()` | 1 |
| Middleware inline (ADMIN/RH) | 2 |
| **Total** | **63** |

---

## 8. Jerarquía de Autorización

La siguiente jerarquía representa los **privilegios administrativos** observados en el código (middlewares y controladores). No necesariamente refleja la jerarquía organizacional de la empresa.

```
ADMIN (control técnico global — acceso total al sistema)
├── RH (control operativo global autorizado por Dirección General)
├── SISTEMAS (acceso a CONFIGURACION + REPORTES)
├── COMPRAS (acceso a COMPRAS + REPORTES)
├── PRODUCCION (acceso solo a REPORTES)
└── EMPLEADO_BASICO (solo DASHBOARD)
```

### Roles Estratégicos

El ERP KRAM reconoce dos **Roles Estratégicos** con bypass global, cada uno con responsabilidades distintas:

| Rol | Tipo | Responsabilidad | Ámbito |
|-----|------|----------------|--------|
| **ADMIN** | Control técnico global | Administración del sistema, configuración técnica, operaciones críticas (Nivel C) | Todo el sistema |
| **RH** | Control operativo global autorizado por Dirección General | Gestión de personal, reclutamiento, configuración de accesos, supervisión operativa | Todos los módulos y datos |

**Fundamento organizacional:** El rol RH representa la mano derecha operativa de Presidencia dentro de Comercializadora KRAM. Por decisión explícita de Dirección General, RH posee acceso global al sistema, al mismo nivel funcional que ADMIN, aunque con responsabilidades distintas.

> ⚠️ **Política de seguridad:** Ningún otro rol deberá recibir privilegios equivalentes a ADMIN o RH sin autorización expresa de Presidencia.

### Observaciones sobre la jerarquía:

1. **ADMIN** tiene acceso completo a todos los módulos y operaciones críticas del sistema (control técnico global).
2. **RH** tiene bypass total en scoping de datos (ve todos los empleados) y puede gestionar permisos de módulos (control operativo global autorizado por Dirección General).
3. **SISTEMAS, COMPRAS, PRODUCCION** son roles departamentales con acceso limitado a módulos específicos.
4. **EMPLEADO_BASICO** es el rol con menos privilegios (solo Dashboard).
5. La jerarquía NO es transitiva: un rol no hereda automáticamente los permisos de los roles superiores. Cada rol tiene sus propios módulos asignados explícitamente.

---

## 9. Flujos con Autorización Multinivel

### 9.1 Módulo de Compras

El módulo de Compras es el que más niveles de autorización combina.

**Nivel A — Control de acceso al módulo:**
- Todos los endpoints de compras requieren `requireModule('COMPRAS')`.
- El sidebar muestra "Mis Compras" solo si el usuario tiene el módulo `COMPRAS`.
- El sidebar muestra "Gestión de Compras" solo si el usuario tiene `COMPRAS` y es `ADMIN` o `COMPRAS`.

**Nivel B — Restricciones de negocio:**
- `GET /api/purchases/my`: Filtra por `solicitanteId = employee.id` (solo las solicitudes del usuario autenticado).
- `POST /api/purchases/:id/cancel`: Verifica que el solicitante sea el dueño de la solicitud.
- `POST /api/purchases/:id/deliver`: Verifica que la solicitud esté en estado `APROBADO`.
- `POST /api/purchases/:id/comments`: Verifica que el usuario tenga acceso a la solicitud.

**Nivel C — Roles administrativos:**
- `GET /api/purchases` (todas las solicitudes): Requiere `requireRole(['ADMIN', 'COMPRAS'])`.
- `POST /api/purchases/:id/quotes` (subir cotizaciones): Requiere `requireRole(['ADMIN', 'COMPRAS'])`.
- `POST /api/purchases/:id/authorize` (autorizar): Requiere `requireRole(['ADMIN', 'COMPRAS'])`.
- `POST /api/purchases/:id/purchase-order` (generar orden): Requiere `requireRole(['ADMIN', 'COMPRAS'])`.
- `GET /api/purchases/:id/audit` (auditoría): Requiere `requireRole(['ADMIN', 'COMPRAS'])`.

### 9.2 Módulo de Reclutamiento

**Nivel A — Control de acceso al módulo:**
- La mayoría de los endpoints requieren `requireModule('RECLUTAMIENTO')`.
- El sidebar muestra "Mis Vacantes" solo si el usuario tiene el módulo `RECLUTAMIENTO`.
- El sidebar muestra "Reclutamiento RH" solo si el usuario tiene `RECLUTAMIENTO` y es `ADMIN` o `RH`.

**Nivel B — Restricciones de negocio:**
- `GET /api/recruitment/my-vacancies`: Filtra por `solicitanteId = employee.id` (solo las vacantes del usuario).
- `PUT /api/recruitment/candidates/:candidate_id/vote`: Verifica que el candidato pertenezca a una vacante del solicitante.
- `PUT /api/recruitment/candidates/:candidate_id/select`: Verifica que el candidato pertenezca a una vacante del solicitante.
- `PUT /api/recruitment/vacancies/:id/cancel`: Verifica que el solicitante sea el dueño de la vacante.

**Nivel C — Roles administrativos:**
- `PUT /api/recruitment/vacancies/:id/approve` (aprobar vacante): Requiere `requireRHOrAdmin()`.
- `PUT /api/recruitment/vacancies/:id/close` (cerrar vacante): Requiere `requireRHOrAdmin()`.
- `POST /api/recruitment/vacancies/direct` (fast-track): Requiere `requireRHOrAdmin()`.
- `POST /api/recruitment/vacancies/:vacancy_id/candidates` (registrar candidato): Requiere `requireRHOrAdmin()`.
- `DELETE /api/recruitment/vacancies/:id` (eliminar vacante): Requiere `requireRHOrAdmin()`.

### 9.3 Módulo de Usuarios

**Nivel A — Control de acceso al módulo:**
- La página de Gestión de Usuarios está protegida por `CONFIGURACION` en el sidebar.
- El componente `ProtectedRoute` envuelve la página.

**Nivel B — Restricciones de negocio:**
- `DELETE /api/users/:id`: No permite auto-eliminación (verifica `existingUser.id !== req.user.id`).
- `PUT /api/users/:id`: Verifica duplicados de nombre/email antes de actualizar.

**Nivel C — Roles administrativos:**
- Todos los endpoints de `/api/users` (excepto reset-password) requieren `requireRole(['ADMIN'])` vía `router.use()`.
- `POST /api/users/:id/reset-password`: Requiere `requireRole(['ADMIN', 'RH'])`.
- La página de Gestión de Usuarios solo es visible para `ADMIN` (validación inline: `user.role !== 'ADMIN'`).

### 9.4 Módulo de Accesos

**Nivel A — Control de acceso al módulo:**
- La página de Gestión de Accesos está protegida por `CONFIGURACION` en el sidebar.
- Los módulos se cargan desde `systemApi.getModules()`.

**Nivel B — Restricciones de negocio:**
- No aplica (es un panel de administración de permisos).

**Nivel C — Roles administrativos:**
- `GET /api/permissions/users`: Requiere `requireRole(['ADMIN', 'RH'])`.
- `GET /api/permissions/modules`: Requiere `requireRole(['ADMIN', 'RH'])`.
- `PUT /api/permissions/users/:id`: Requiere `requireRole(['ADMIN', 'RH'])`.
- La página valida inline: `user.role === 'ADMIN' || user.role === 'RH'`.
- El componente `RoleManager` solo se muestra si `user.role === 'ADMIN'`.

---

## 10. Riesgos Detectados

Los siguientes riesgos son observables en el código actual. **No se proponen cambios**, solo se documentan.

### 10.1 Rutas Protegidas Solo por Rol (sin Nivel A)

Algunos endpoints están protegidos únicamente por `requireRole()` o `requireRHOrAdmin()`, sin verificar primero el módulo correspondiente (Nivel A):

| Endpoint | Protección actual | Módulo no verificado |
|----------|-------------------|---------------------|
| `POST /api/employees` | `requireRHOrAdmin()` | `EMPLEADOS` |
| `PUT /api/employees/:id` | `requireRHOrAdmin()` | `EMPLEADOS` |
| `DELETE /api/employees/:id` | `requireRHOrAdmin()` | `EMPLEADOS` |
| `POST /api/departments` | `requireRHOrAdmin()` | `EMPLEADOS` |
| `POST /api/job-positions` | `requireRHOrAdmin()` | `EMPLEADOS` |
| `POST /api/recruitment/vacancies/direct` | `requireRHOrAdmin()` | `RECLUTAMIENTO` |
| `PUT /api/recruitment/vacancies/:id/approve` | `requireRHOrAdmin()` | `RECLUTAMIENTO` |
| `PUT /api/recruitment/vacancies/:id/close` | `requireRHOrAdmin()` | `RECLUTAMIENTO` |
| `DELETE /api/recruitment/vacancies/:id` | `requireRHOrAdmin()` | `RECLUTAMIENTO` |

> **Observación:** Aunque ADMIN y RH tienen bypass total de módulos, otros roles con `requireRHOrAdmin()` no pueden acceder porque no son ADMIN ni RH. Sin embargo, la falta de `requireModule()` significa que la protección depende exclusivamente del rol, no de los módulos asignados.

### 10.2 Uso Mixto de `requireRole` y `requireModule` en Compras

En el módulo de Compras, algunos endpoints combinan ambos middlewares:

```js
// Ejemplo: requireModule + requireRole
router.get('/purchases',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  ...
);
```

Mientras que otros solo usan `requireModule`:

```js
// Ejemplo: solo requireModule
router.post('/purchases/:id/deliver',
  AuthMiddleware.requireModule('COMPRAS'),
  PurchaseController.markAsDelivered
);
```

Esta inconsistencia significa que algunos endpoints de compras son accesibles para cualquier usuario con el módulo `COMPRAS` (incluyendo roles no administrativos como un empleado básico que tenga el módulo asignado), mientras que otros requieren explícitamente ser ADMIN o COMPRAS.

### 10.3 Roles Fallback en Frontend

El archivo `frontend/lib/rolesConfig.js` contiene una configuración de roles (`ROLE_FALLBACK_CONFIG`) que duplica la información de `SYSTEM_ROLES` del backend. Aunque está documentado como "fallback visual", su existencia introduce un riesgo de desincronización:

- Si se agrega un nuevo rol en el backend (`SYSTEM_ROLES` en `roles.routes.js`), también debe agregarse manualmente en `ROLE_FALLBACK_CONFIG` para que el fallback funcione correctamente.
- Si no se actualiza, el frontend mostrará "Sin rol" para roles nuevos cuando la API no esté disponible.

### 10.4 Endpoints de Prueba en Producción

Los siguientes endpoints en `auth.routes.js` son de prueba y no tienen validación de negocio:

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/auth/test/admin` | GET | Prueba de acceso ADMIN |
| `/api/auth/test/rh` | GET | Prueba de acceso RH |
| `/api/auth/test/sistemas` | GET | Prueba de acceso SISTEMAS |
| `/api/auth/test/compras` | GET | Prueba de acceso COMPRAS |
| `/api/auth/test/produccion` | GET | Prueba de acceso PRODUCCION |

> **Observación:** Estos endpoints exponen información del usuario (`req.user`) y no tienen un propósito funcional en producción.

### 10.5 Módulos sin Rutas Protegidas

Los siguientes módulos existen en la configuración pero **no tienen ningún endpoint protegido** con `requireModule`:

| Módulo | Estado |
|--------|--------|
| `VACACIONES` | Sin rutas protegidas |
| `REPORTES` | Sin rutas protegidas |

> **Observación:** El módulo `VACACIONES` no tiene rutas backend asociadas. El módulo `REPORTES` tampoco tiene endpoints dedicados, aunque aparece en los presets de varios roles.

### 10.6 Validación de Acceso por Rol en Frontend (DashboardLayout)

El sidebar de `DashboardLayout.js` utiliza una combinación de `accessibleModules` (Nivel A) y `roles` (Nivel C) para filtrar la navegación de "Administración Global":

```js
const adminNavigation = [
  { name: 'Organización', href: '/dashboard/organizacion', icon: '🏢', module: 'EMPLEADOS', roles: ['ADMIN'] },
  { name: 'Gestión de Accesos', href: '/dashboard/accesos', icon: '🔐', module: 'CONFIGURACION', roles: ['ADMIN'] },
  { name: 'Gestión de Usuarios', href: '/dashboard/usuarios', icon: '👤', module: 'CONFIGURACION', roles: ['ADMIN'] },
];
```

Esto significa que aunque un usuario tenga el módulo `EMPLEADOS` o `CONFIGURACION`, no verá estas opciones en el menú a menos que tenga el rol específico. Esto es correcto para Nivel C, pero podría confundir si se espera que el módulo baste para acceder.

### 10.7 Protección de Página de Usuarios Solo por Rol

La página `frontend/app/dashboard/usuarios/page.js` valida el acceso exclusivamente por rol:

```js
if (!user || user.role !== 'ADMIN') {
  return (<DashboardLayout><div>Acceso denegado</div></DashboardLayout>);
}
```

No utiliza `ProtectedRoute` con `requiredModule` ni verifica `accessibleModules`. Esto significa que la protección depende únicamente del rol, no de los módulos asignados.

---

## 11. Resumen Ejecutivo

### 11.1 Tabla de Métricas

| Categoría | Cantidad |
|-----------|:--------:|
| Roles del sistema (SYSTEM_ROLES) | 6 |
| Roles en fallback frontend (ROLE_FALLBACK_CONFIG) | 6 |
| Roles personalizados (dinámicos) | 0 (predefinidos) |
| Módulos en `modules.config.js` | 7 |
| Módulos totales (incluyendo DASHBOARD implícito) | 8 |
| Presets de módulos por rol | 6 |
| Endpoints protegidos por módulo (`requireModule`) | 59 |
| Endpoints protegidos por rol (`requireRole`) | 63 |
| Endpoints de prueba (auth/test/*) | 5 |
| Archivos de rutas analizados | 13 |
| Módulos sin rutas protegidas | 2 (VACACIONES, REPORTES) |

### 11.2 Conclusión

El modelo de autorización del ERP KRAM implementa correctamente la **estrategia de 3 niveles** definida en `.clinerules`:

1. **Nivel A (Módulos):** 59 endpoints protegidos con `requireModule()`, distribuidos en 5 de los 7 módulos configurados.
2. **Nivel B (Scoping):** Implementado en los controladores de Compras y Reclutamiento, con filtros por `solicitanteId` y verificación de propiedad.
3. **Nivel C (Roles):** 63 endpoints protegidos con `requireRole()` en sus variantes, con ADMIN (control técnico global) y RH (control operativo global autorizado por Dirección General) como Roles Estratégicos con bypass total.

**Fortalezas observadas:**
- Separación clara entre control de acceso a módulos y restricciones por rol.
- Uso consistente de `accessibleModules` como mecanismo principal de autorización.
- Bypass total para ADMIN y RH implementado correctamente.
- Presets de módulos por rol centralizados en `roles.config.js`.

**Áreas de atención documentadas:**
- 9 endpoints protegidos solo por rol sin verificación de módulo.
- 2 módulos (VACACIONES, REPORTES) sin rutas backend protegidas.
- 5 endpoints de prueba que exponen datos del usuario.
- Dependencia de `ROLE_FALLBACK_CONFIG` en frontend que requiere mantenimiento manual.
- Inconsistencia en Compras: algunos endpoints combinan `requireModule` + `requireRole`, otros solo `requireModule`.

> **Nota final:** Este documento es una fotografía del estado actual del sistema. No propone cambios ni correcciones. Cualquier modificación al modelo de permisos debe evaluarse considerando los riesgos aquí documentados.


