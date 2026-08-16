# Auditoría del Módulo: CONFIGURACION

**Fecha**: 24/06/2026  
**Auditor**: Arquitectura — ERP KRAM  
**Versión**: 1.0

---

## Descripción

Módulo de configuración del sistema. Agrupa funcionalidades administrativas: gestión de usuarios (solo ADMIN), gestión de accesos/permisos (ADMIN y RH), roles del sistema, y estadísticas del sistema.

---

## Modelos Prisma

| Modelo | Propósito |
|--------|-----------|
| `User` | Usuarios del sistema |
| `Role` | Roles personalizados |
| `Session` | Sesiones JWT |

---

## Rutas (Backend)

### Archivo: `user.routes.js` (36 líneas) — Montado en: `/api/users`

| Método | Ruta | Middleware | Controlador |
|--------|------|-----------|-------------|
| POST | `/:id/reset-password` | requireRole(['ADMIN', 'RH']) | UserController.resetPassword |
| GET | `/` | requireRole(['ADMIN']) | UserController.getAllUsers |
| GET | `/stats` | requireRole(['ADMIN']) | UserController.getUserStats |
| GET | `/:id` | requireRole(['ADMIN']) | UserController.getUserById |
| POST | `/` | requireRole(['ADMIN']) | UserController.createUser |
| PUT | `/:id` | requireRole(['ADMIN']) | UserController.updateUser |
| DELETE | `/:id` | requireRole(['ADMIN']) | UserController.deleteUser |

### Archivo: `permission.routes.js` (32 líneas) — Montado en: `/api`

| Método | Ruta | Middleware | Controlador |
|--------|------|-----------|-------------|
| GET | `/permissions/users` | requireRole(['ADMIN', 'RH']) | PermissionController.getAllUsersWithPermissions |
| GET | `/permissions/modules` | requireRole(['ADMIN', 'RH']) | PermissionController.getAvailableModules |
| PUT | `/permissions/users/:id` | requireRole(['ADMIN', 'RH']) | PermissionController.updateUserPermissions |
| GET | `/permissions/me` | verifyToken | PermissionController.getCurrentUserPermissions |

### Archivo: `roles.routes.js` — Montado en: `/api`

| Método | Ruta | Middleware | Controlador |
|--------|------|-----------|-------------|
| GET | `/roles` | verifyToken | getRoles |
| GET | `/modules` | verifyToken | getModules |
| GET | `/roles/presets` | verifyToken | getPresets |

### Archivo: `stats.routes.js` (27 líneas) — Montado en: `/api`

| Método | Ruta | Middleware | Controlador |
|--------|------|-----------|-------------|
| GET | `/stats/system` | requireModule('CONFIGURACION') | statsController.getSystemStats |

**Total de endpoints**: 15

---

## Controladores

| Controlador | Líneas | Propósito |
|-------------|--------|-----------|
| `user.controller.js` | 371 | CRUD usuarios, reset password |
| `permission.controller.js` | 206 | Gestión de accesos y módulos |
| `stats.controller.js` | 472 | Estadísticas del sistema (parcial) |

---

## APIs (Frontend)

| Objeto | Métodos |
|--------|---------|
| `userApi` | `getAll`, `getById`, `create`, `update`, `delete`, `resetPassword`, `getStats` |
| `systemApi` | `getRoles`, `getModules`, `getPresets` |

---

## Componentes (Frontend)

| Componente | Archivo |
|-----------|---------|
| RoleManager | `frontend/components/RoleManager.js` |

### Páginas

| Ruta Frontend | Archivo |
|---------------|---------|
| `/dashboard/usuarios` | `frontend/app/dashboard/usuarios/page.js` |
| `/dashboard/accesos` | `frontend/app/dashboard/accesos/page.js` |

---

## Servicios

No hay servicios dedicados. Toda la lógica está en los controladores.

---

## Problemas Encontrados

### 🟡 P1 — Altos

1. **Sin capa de servicio**: CRUD de usuarios y permisos directamente en controladores.

2. **Prisma directo en controladores**: Todas las consultas en `user.controller.js` y `permission.controller.js`.

### 🟡 P2 — Medios

3. **Sin paginación en usuarios**: `getAllUsers` no tiene paginación.

4. **Sin auditoría de cambios de permisos**: No se registra quién cambió los módulos de un usuario.

### 🟢 P3 — Bajos

5. **Sin validación de email**: No se valida formato de email al crear usuario.

---

## Estado General

| Dimensión | Calificación | Comentario |
|-----------|-------------|------------|
| **Arquitectura** | 5/10 | Sin servicios, lógica en controllers |
| **Seguridad** | 8/10 | Nivel A y C correctos, bypass ADMIN/RH bien implementado |
| **UI** | 7/10 | Funcional, RoleManager completo |
| **Backend** | 5/10 | Sin servicios, sin paginación |
| **Mantenibilidad** | 6/10 | Controladores organizados pero sin capa de servicio |

### Calificación Final: **6.2 / 10**
