# 🗂️ ERP KRAM — Guía Completa de Accesos y Permisos

> Documento consolidado: roles, módulos, **quién puede ver qué** y **qué acceso requiere** cada funcionalidad del proyecto.
> Última actualización: 16/08/2026

---

## 1. Resumen del Proyecto

**ERP KRAM** es un ERP para Comercializadora KRAM:
- **Backend**: Node.js + Express + Prisma ORM. Arquitectura en 3 capas: `routes → controllers → services`.
- **Frontend**: Next.js (App Router) + React + Tailwind CSS.
- **Seguridad**: JWT + modelo de permisos de 3 niveles.

Áreas funcionales: Empleados, Reclutamiento, Vacaciones, Incidencias, Incapacidades, Compras (órdenes, papelería, uniformes, inventario), Reportes y Configuración (usuarios, roles, permisos).

---

## 2. Roles del Sistema

Los roles definen la **identidad organizacional**. **NO** definen qué módulos puede ver (eso lo hacen los `accessibleModules`), salvo los **Roles Estratégicos** (ADMIN y RH) con bypass global.

| Rol | Nombre | Tipo | Descripción |
|-----|--------|------|-------------|
| `ADMIN` | Administrador 👑 | **Estratégico** | Control técnico global. Ve y hace TODO. Único con acceso a operaciones críticas (Nivel C). |
| `RH` | Recursos Humanos 👥 | **Estratégico** | Control operativo global (autorizado por Dirección General). Ve y hace TODO, EXCEPTO operaciones críticas que requieren `ADMIN`. |
| `SISTEMAS` | Jefe de Sistemas 💻 | Departamental | Soporte técnico. Acceso por módulos. |
| `COMPRAS` | Jefe de Compras 🛒 | Departamental | Compras y proveedores. |
| `PRODUCCION` | Jefe de Producción 🏭 | Departamental | Producción. |
| `EMPLEADO_BASICO` | Empleado 👤 | Base | Acceso básico / autoservicio. |
| *(personalizados)* | Roles custom | — | Creados desde "Permisos y Roles" (solo ADMIN). |

---

## 3. Módulos del Sistema

Fuente de verdad: `backend/src/config/modules.config.js` (7 módulos) + `DASHBOARD` (implícito, siempre activo).

| Key | Label | Descripción | Estado |
|-----|-------|-------------|--------|
| `DASHBOARD` | Dashboard | Panel principal / Mi Espacio (implícito, siempre activo) | ✅ |
| `EMPLEADOS` | Empleados | Empleados, expedientes, departamentos, puestos, organización | ✅ |
| `RECLUTAMIENTO` | Reclutamiento | Vacantes y candidatos | ✅ |
| `VACACIONES` | Vacaciones | Solicitud y aprobación de vacaciones | ✅ |
| `INCIDENCIAS` | Incidencias | Asistencia / incidencias (checador ZKTeco) | ✅ |
| `CONFIGURACION` | Configuración | Usuarios, roles, permisos, seed | ✅ |
| `REPORTES` | Reportes | 5 reportes con exportación a Excel | ✅ |
| `COMPRAS` | Compras | Órdenes de compra, papelería, uniformes, inventario | ✅ |

> **Nota:** "Incapacidades" **no** es un módulo independiente; es una funcionalidad protegida por rol (`ADMIN`/`RH`) dentro del área de Empleados.

---

## 4. Modelo de Permisos (3 Niveles)

| Nivel | Mecanismo | Cuándo usarlo | Bypass |
|-------|-----------|---------------|--------|
| **A — Acceso a módulos** | Backend: `requireModule('MODULO')`. Frontend: `accessibleModules` + `<ProtectedRoute requiredModule>` | Ocultar menús, proteger rutas y endpoints de lectura/escritura | ADMIN y RH |
| **B — Scoping de datos** | Lógica de negocio (empleado asociado, departamento, jerarquía) | Determinar QUÉ datos ve cada usuario | ADMIN y RH |
| **C — Operaciones críticas** | `requireRole(['ADMIN'])` o `requireRole(['ADMIN','RH'])` | Cambiar permisos, eliminar usuarios, resetear BD, gestionar incapacidades | **Sin bypass** |

**Regla de oro:** NUNCA usar `user.role === 'X'` para ocultar/mostrar módulos o bloquear rutas, salvo que sea ADMIN/RH. SIEMPRE usar `accessibleModules`.

**Implementación clave** (`backend/src/middlewares/permission.middleware.js`):
- `requireModule()` → ADMIN y RH pasan automáticamente; el resto debe tener el módulo en `accessibleModules`.
- `requireRole([...])` → solo pasan los roles listados (sin bypass).

---

## 5. Presets de Módulos por Rol

Fuente de verdad: `backend/src/config/roles.config.js`.

| Rol | Módulos por defecto |
|-----|---------------------|
| `ADMIN` | DASHBOARD, EMPLEADOS, RECLUTAMIENTO, INCIDENCIAS, CONFIGURACION, COMPRAS, VACACIONES, REPORTES |
| `RH` | DASHBOARD, EMPLEADOS, RECLUTAMIENTO, INCIDENCIAS, VACACIONES, REPORTES |
| `SISTEMAS` | DASHBOARD, CONFIGURACION, VACACIONES |
| `COMPRAS` | DASHBOARD, COMPRAS, VACACIONES |
| `PRODUCCION` | DASHBOARD, VACACIONES |
| `EMPLEADO_BASICO` | DASHBOARD, VACACIONES |

---

## 6. Acceso Detallado por Área (Backend)

Leyenda de acceso:
- 🔓 **Público** = sin token.
- 🔐 **Autenticado** = `verifyToken` (cualquier usuario con sesión activa).
- 🧩 **Módulo `X`** = `requireModule('X')` (ADMIN/RH bypass).
- 👑 **ADMIN** = `requireRole(['ADMIN'])`.
- 👥 **RH/ADMIN** = `requireRole(['ADMIN','RH'])`.

### 6.1 Autenticación (`/api/auth`)
| Endpoint | Método | Acceso |
|---|---|---|
| `/auth/register` | POST | 🔓 Público (con rate-limit) |
| `/auth/login` | POST | 🔓 Público (con rate-limit) |
| `/auth/profile` | GET/PUT | 🔐 Autenticado |
| `/auth/logout` | POST | 🔐 Autenticado |
| `/auth/change-password` | POST | 🔐 Autenticado |
| `/auth/admin/users` | GET | 👑 ADMIN (placeholder) |
| `/auth/test/*` | GET | Rutas de prueba por rol (admin/rh/sistemas/compras/produccion) |

### 6.2 Empleados (`/api`)
| Endpoint | Método | Acceso |
|---|---|---|
| `/employees` | GET | 🧩 EMPLEADOS |
| `/employees/me` | GET | 🔐 Autenticado (el propio empleado) |
| `/employees/stats` | GET | 👥 RH/ADMIN |
| `/employees` | POST | 👥 RH/ADMIN |
| `/employees/:id` | GET/PUT/DELETE | 👥 RH/ADMIN |
| `/employees/:id/permanent` | DELETE | 👥 RH/ADMIN |
| `/employees/:id/salary-history` | GET | 👥 RH/ADMIN |
| `/employees/:id/photo` | POST | 👥 RH/ADMIN |
| `/employees/template` / `/import` / `/export` | GET/POST | 👥 RH/ADMIN |
| `/departments` | GET | 🔐 Autenticado |
| `/departments` | POST/PUT/DELETE | 👥 RH/ADMIN |
| `/job-positions` | GET | 🔐 Autenticado |
| `/job-positions` | POST/PUT/DELETE | 👥 RH/ADMIN |
| `/departments/:id/job-positions` | GET | 🔐 Autenticado |
| `/managers` | GET | 🔐 Autenticado |

### 6.3 Documentos de Empleado (`/api`)
| Endpoint | Método | Acceso |
|---|---|---|
| `/employee/:employeeId/documents` | GET | 🧩 EMPLEADOS |
| `/employee-documents/allowed-types` | GET | 🧩 EMPLEADOS |
| `/employee/:employeeId/documents` | POST | 👥 RH/ADMIN |
| `/employee-documents/:documentId/download` | GET | 🧩 EMPLEADOS |
| `/employee-documents/:documentId` | DELETE | 👥 RH/ADMIN |

### 6.4 Organización (`/api`)
Todos los endpoints (`/departments`, `/job-positions`, `/organization/stats`) → 🧩 EMPLEADOS.

### 6.5 Reclutamiento (`/api`)
| Endpoint | Método | Acceso |
|---|---|---|
| `/vacancies/form-data` | GET | 🧩 RECLUTAMIENTO |
| `/vacancies`, `/vacancies/my`, `/vacancies/stats`, `/vacancies/:id` | GET/POST | 🧩 RECLUTAMIENTO |
| `/recruitment/vacancies` | POST/GET | 🧩 RECLUTAMIENTO |
| `/recruitment/my-vacancies` | GET | 🧩 RECLUTAMIENTO |
| `/recruitment/vacancies/:id/technical-profile` | PUT | 🧩 RECLUTAMIENTO |
| `/recruitment/vacancies/:id/activities` | POST | 🧩 RECLUTAMIENTO (jefes de área) |
| `/recruitment/vacancies/:id/approve` / `close` | PUT | 👥 RH/ADMIN |
| `/recruitment/vacancies/direct` | POST | 👥 RH/ADMIN (flujo directo) |
| `/recruitment/vacancies/:id/comments` | POST | 🧩 RECLUTAMIENTO |
| `/recruitment/vacancies/:vacancy_id/candidates` | POST | 👥 RH/ADMIN |
| `/recruitment/candidates/:candidate_id/observations` | PUT | 👥 RH/ADMIN |
| `/recruitment/candidates/:candidate_id/documents` | PUT | 👥 RH/ADMIN |
| `/recruitment/candidates/:candidate_id/vote` / `select` | PUT | 🧩 RECLUTAMIENTO (jefes de área) |
| `/recruitment/candidates/:candidate_id/cv` | GET | 🧩 RECLUTAMIENTO |
| `/recruitment/vacancies/:id` | DELETE | 👥 RH/ADMIN |
| `/recruitment/activities/:activityId` | PUT | 🧩 RECLUTAMIENTO |
| `/recruitment/vacancies/:id/cancel` | PUT | 🧩 RECLUTAMIENTO |

### 6.6 Vacaciones (`/api`)
| Endpoint | Método | Acceso |
|---|---|---|
| `/vacations` | POST | 🧩 VACACIONES |
| `/vacations/my` | GET | 🧩 VACACIONES |
| `/vacations` | GET | 🧩 VACACIONES |
| `/vacations/balance` | GET | 🧩 VACACIONES |
| `/vacations/pending-for-jefe` | GET | 🧩 VACACIONES (jefe directo) |
| `/vacations/:id` | GET | 🧩 VACACIONES |
| `/vacations/:id/authorize-jefe` | POST | 🧩 VACACIONES (jefe directo) |
| `/vacations/:id/approve` | POST | 👥 RH/ADMIN |
| `/vacations/:id/reject` | POST | 🧩 VACACIONES (jefe en PENDIENTE, RH/ADMIN en PENDIENTE/AUTORIZADA) |
| `/vacations/:id/cancel` | POST | 🧩 VACACIONES |

**Flujo de estados:** `PENDIENTE → AUTORIZADA (jefe) → APROBADA (RH/ADMIN) / RECHAZADA / CANCELADA`.

### 6.7 Incapacidades (`/api`)
**Quién puede ver:** solo **RH y ADMIN** (Nivel C).
| Endpoint | Método | Acceso |
|---|---|---|
| `/incapacidades` | POST/GET | 👥 RH/ADMIN |
| `/incapacidades/:id` | GET/PUT | 👥 RH/ADMIN |
| `/incapacidades/:id/reincorporar` | POST | 👥 RH/ADMIN |

### 6.8 Incidencias / Asistencia (`/api`)
| Endpoint | Método | Acceso |
|---|---|---|
| `/attendance/upload` | POST | 🧩 INCIDENCIAS |
| `/attendance/` | GET | 🧩 INCIDENCIAS |

### 6.9 Compras — Órdenes (`/api`)
Todos los endpoints de solicitudes/órdenes de compra → 🧩 COMPRAS (crear, listar, cotizaciones, autorizar, entregar, comentarios, órdenes de compra, auditoría).

| Endpoint | Método | Acceso |
|---|---|---|
| `/purchases` | POST | 🧩 COMPRAS |
| `/purchases/my` | GET | 🧩 COMPRAS (propias) |
| `/purchases` | GET | 🧩 COMPRAS |
| `/purchases/details/:id` | GET | 🧩 COMPRAS |
| `/purchases/:id/quotes` | POST | 🧩 COMPRAS |
| `/purchases/:id/select-quote` | POST | 🧩 COMPRAS |
| `/purchases/:id/authorize` | POST | 🧩 COMPRAS |
| `/purchases/:id/deliver` | POST | 🧩 COMPRAS |
| `/purchases/:id/potential-approvers` | GET | 🧩 COMPRAS |
| `/purchases/:id/assign-approvers` | POST | 🧩 COMPRAS |
| `/purchases/:id/send-authorization` | POST | 🧩 COMPRAS |
| `/purchases/:id` | DELETE | 🧩 COMPRAS |
| `/purchases/:id/items` | PUT | 🧩 COMPRAS |
| `/purchases/:id/cancel` | POST | 🧩 COMPRAS |
| `/purchases/:id/quotes/*` | POST/PUT | 🧩 COMPRAS (subir/actualizar cotizaciones) |
| `/purchases/:id/comparison` | GET | 🧩 COMPRAS |
| `/purchases/:id/purchase-order` | GET/POST | 🧩 COMPRAS |
| `/purchase-orders` | GET | 🧩 COMPRAS |
| `/purchases/:id/audit` | GET | 🧩 COMPRAS |
| `/purchases/:id/comments` | GET/POST | 🧩 COMPRAS |
| `/purchases/:id/comments/stream` | GET (SSE) | 🧩 COMPRAS |

**Rutas públicas de compra** (`purchase-public.routes.js`) — para Gerentes/Directores/Presidente que NO tienen módulo COMPRAS:
| Endpoint | Método | Acceso |
|---|---|---|
| `/purchases/public/:id` | GET | 🔐 Autenticado |
| `/purchases/public/:id/authorize` | POST | 🔐 Autenticado |

### 6.10 Papelería (`/api`)
| Endpoint | Método | Acceso |
|---|---|---|
| `/stationery/my` | GET | 🔐 Autenticado (propias) |
| `/stationery` | POST | 🔐 Autenticado |
| `/stationery/:id/cancel` | POST | 🔐 Autenticado |
| `/stationery/inventory` | GET | 🧩 COMPRAS + 👥 RH/ADMIN/COMPRAS |
| `/stationery/inventory` | POST/PUT/DELETE/restock | 🧩 COMPRAS + 👥 RH/ADMIN |
| `/stationery` | GET | 🧩 COMPRAS |
| `/stationery/:id` | GET | 🧩 COMPRAS |
| `/stationery/:id/deliver` | POST | 🧩 COMPRAS |

### 6.11 Uniformes (`/api`)
| Endpoint | Método | Acceso |
|---|---|---|
| `/uniforms/inventory` | GET | 🧩 COMPRAS + 👥 RH/ADMIN/COMPRAS |
| `/uniforms/inventory` | POST/PUT/DELETE/restock | 🧩 COMPRAS + 👥 RH/ADMIN |
| `/uniforms/deliveries` | POST/GET | 🧩 COMPRAS |
| `/uniforms/deliveries/:id` | GET | 🧩 COMPRAS |
| `/uniforms/employees/:empleadoId/history` | GET | 🧩 COMPRAS |

### 6.12 Inventario — Ajustes y Movimientos (`/api`)
| Endpoint | Método | Acceso |
|---|---|---|
| `/inventory-adjustments` | POST | 🧩 COMPRAS |
| `/inventory-adjustments` | GET | 🧩 COMPRAS (ADMIN/RH ven todas, otros solo propias) |
| `/inventory-adjustments/:id/approve` | POST | 👥 RH/ADMIN |
| `/inventory-adjustments/:id/reject` | POST | 👥 RH/ADMIN |
| `/inventory-movements` | GET | 🧩 COMPRAS + 👥 RH/ADMIN/COMPRAS |

### 6.13 Reportes (`/api`)
Todos → 🧩 REPORTES.
| Reporte | Endpoints |
|---|---|
| Empleados | `/reports/empleados`, `/reports/empleados/export` |
| Compras | `/reports/compras`, `/reports/compras/export` |
| Inventario | `/reports/inventario`, `/reports/inventario/export` |
| Asistencia | `/reports/asistencia`, `/reports/asistencia/export` |
| Vacaciones | `/reports/vacaciones`, `/reports/vacaciones/export` |

### 6.14 Estadísticas (`/api`)
| Endpoint | Método | Acceso |
|---|---|---|
| `/stats/rh/dashboard` | GET | 🧩 EMPLEADOS |
| `/stats/my-dashboard` | GET | 🔐 Autenticado (verifica internamente módulos EMPLEADOS/RECLUTAMIENTO/COMPRAS/VACACIONES/INCIDENCIAS/DASHBOARD) |
| `/stats/system` | GET | 🧩 CONFIGURACION (controller requiere ADMIN — Nivel C) |

### 6.15 Notificaciones (`/api`)
| Endpoint | Método | Acceso |
|---|---|---|
| `/notifications/upcoming` | GET | 🔐 Autenticado |
| `/notifications/check-now` | POST | 👥 RH/ADMIN |
| `/notifications/logs` | GET | 👥 RH/ADMIN |

### 6.16 Permisos y Roles (`/api`)
| Endpoint | Método | Acceso |
|---|---|---|
| `/permissions/users` | GET | 👥 RH/ADMIN |
| `/permissions/modules` | GET | 👥 RH/ADMIN |
| `/permissions/users/:id` | PUT | 👥 RH/ADMIN |
| `/permissions/me` | GET | 🔐 Autenticado |
| `/roles` | GET | 🔐 Autenticado |
| `/roles` | POST | 👑 ADMIN |
| `/roles/:id` | PUT/DELETE | 👑 ADMIN |
| `/modules` | GET | 🔐 Autenticado |
| `/roles/presets` | GET | 🔐 Autenticado |

### 6.17 Usuarios (`/api`)
| Endpoint | Método | Acceso |
|---|---|---|
| `/:id/reset-password` | POST | 👥 RH/ADMIN |
| `/` (listar) | GET | 👑 ADMIN |
| `/stats` | GET | 👑 ADMIN |
| `/:id` | GET/PUT/DELETE | 👑 ADMIN |
| `/` (crear) | POST | 👑 ADMIN |

### 6.18 Seed / Reset BD (`/api`)
| Endpoint | Método | Acceso |
|---|---|---|
| `/seed/reset` | POST | 👑 ADMIN (con `{"confirm": true}`) |

---

## 7. Control de Acceso en el Frontend

### 7.1 Protección de rutas — `<ProtectedRoute>`
Componente en `frontend/components/ProtectedRoute.js`. Dos mecanismos:
- `requiredModule="MODULO"` → Nivel A (verifica `accessibleModules`, con bypass ADMIN/RH en `useAuthorization`).
- `allowedRoles={['ADMIN']}` → Nivel C (solo para operaciones críticas; **deprecado** para Nivel A).

Si no tiene acceso → redirige a `/403`.

### 7.2 Menú lateral — `DashboardLayout.js`
Filtra la navegación (`frontend/constants/navigation.js`) según permisos:
- **"Mi Portal"**: ítems por `module` (`DASHBOARD` siempre visible).
- **"Administración Global"**: ítems por `module` (Nivel A) + `roles` (Nivel C).

### 7.3 Ítems de navegación
**Mi Portal** (autoservicio):
| Ítem | Ruta | Módulo |
|---|---|---|
| Mi Espacio | `/dashboard/mi-espacio` | DASHBOARD |
| Mi Equipo | `/rh/empleados` | EMPLEADOS |
| Mis Vacantes | `/reclutamiento/mis-solicitudes` | RECLUTAMIENTO |
| Mis Compras | `/compras/mis-solicitudes` | COMPRAS |
| Papelería | `/compras/papeleria` | COMPRAS |
| Mis Vacaciones | `/vacaciones/mis-solicitudes` | VACACIONES |

**Administración Global**:
| Ítem | Ruta | Módulo | Roles |
|---|---|---|---|
| Dashboard RH | `/rh/dashboard-completo` | EMPLEADOS | ADMIN, RH |
| Reclutamiento | `/rh/reclutamiento` | RECLUTAMIENTO | ADMIN, RH |
| Incidencias | `/rh/incidencias` | INCIDENCIAS | ADMIN, RH |
| Incapacidades | `/rh/incapacidades` | EMPLEADOS | ADMIN, RH |
| Vacaciones | `/rh/vacaciones` | VACACIONES | ADMIN, RH |
| Reportes | `/dashboard/reportes` | REPORTES | ADMIN, RH |
| Gestión de Compras | `/dashboard/compras` | COMPRAS | ADMIN, COMPRAS |
| Papelería | `/dashboard/compras/papeleria` | COMPRAS | ADMIN, COMPRAS |
| Uniformes | `/dashboard/compras/uniformes` | COMPRAS | ADMIN, RH, COMPRAS |
| Aprobaciones de Inventario | `/dashboard/compras/aprobaciones-inventario` | COMPRAS | ADMIN, RH |
| Movimientos de Inventario | `/dashboard/compras/movimientos-inventario` | COMPRAS | ADMIN, RH, COMPRAS |
| Organización | `/dashboard/organizacion` | EMPLEADOS | ADMIN |
| Permisos y Roles | `/dashboard/accesos` | CONFIGURACION | ADMIN |
| Usuarios | `/dashboard/usuarios` | CONFIGURACION | ADMIN |

---

## 8. Scoping de Datos (Nivel B)

Además del acceso por módulo, los **datos** se filtran por jerarquía. Regla general:

| Quién | Qué ve |
|---|---|
| **ADMIN / RH** | Todo (bypass total) |
| **Jefe / Gerente / Coordinador** | Su departamento / subordinados |
| **Empleado regular** | Solo lo suyo |

Ejemplos aplicados:
- **Vacaciones**: un empleado ve solo sus solicitudes (`/vacations/my`); el jefe ve las de su equipo (`/vacations/pending-for-jefe`); RH ve todas.
- **Compras**: un empleado ve sus solicitudes (`/purchases/my`); RH/ADMIN/Compras ven todas.
- **Ajustes de inventario**: ADMIN/RH ven todas; otros solo las propias.
- **Mi Espacio**: métricas y saldo de vacaciones del propio empleado.

---

## 9. Reglas de Oro (Resumen Rápido)

1. **Acceso a módulos (Nivel A)** → `accessibleModules` + `requireModule()`. Bypass: ADMIN y RH.
2. **Scoping (Nivel B)** → filtrar por empleado/departamento/jerarquía. Bypass: ADMIN y RH.
3. **Operaciones críticas (Nivel C)** → `requireRole(['ADMIN'])` o `requireRole(['ADMIN','RH'])`. **Sin bypass**.
4. **Nunca** hardcodear `user.role === 'X'` para módulos, salvo ADMIN/RH.
5. **Incapacidades** → solo ADMIN y RH (Nivel C).
6. **Usuarios, roles, seed** → solo ADMIN (Nivel C).
7. **Reportes** → módulo REPORTES (ADMIN/RH bypass; presets no lo incluyen en otros roles).
8. **Fuente de verdad** de módulos: `modules.config.js`; de presets: `roles.config.js`; de roles: `roles.routes.js` (`SYSTEM_ROLES`).

---

*Documento generado el 16/08/2026 a partir del código real (middlewares, rutas y configuraciones).*



