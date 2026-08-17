# Referencia de API — ERP KRAM

> Generada a partir de los archivos reales de rutas (`backend/src/routes/`).
> Base URL: `http://localhost:3001/api` · Producción: `https://apierp.kramhub.site/api`

## Convenciones

- **Autenticación**: header `Authorization: Bearer <JWT>` en todas las rutas protegidas.
- **Respuestas**: `{ data, message }` en éxito; `{ error }` en error.
- **Permisos**: cada tabla indica el middleware aplicado.
  - `verifyToken` = requiere sesión válida.
  - `requireModule('X')` = requiere módulo `X` en `accessibleModules` (ADMIN/RH con bypass).
  - `requireRole(['ADMIN','RH'])` = solo roles listados.
  - `requireRHOrAdmin()` = solo RH o ADMIN.

## 1. Health & Auth (`/api/auth`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/health` | público | Estado del servidor |
| POST | `/auth/register` | público | Registrar usuario |
| POST | `/auth/login` | público | Login → JWT |
| GET | `/auth/profile` | verifyToken | Perfil del usuario actual |
| PUT | `/auth/profile` | verifyToken | Actualizar perfil |
| POST | `/auth/logout` | verifyToken | Cerrar sesión |
| POST | `/auth/change-password` | verifyToken | Cambiar contraseña |
| GET | `/auth/admin/users` | requireAdmin | Listar usuarios (legacy) |
| GET | `/auth/test/admin` | requireAdmin | Test de acceso ADMIN |
| GET | `/auth/test/rh` | requireRHOrAdmin | Test de acceso RH |
| GET | `/auth/test/sistemas` | requireSistemasOrAdmin | Test de acceso Sistemas |
| GET | `/auth/test/compras` | requireComprasOrAdmin | Test de acceso Compras |
| GET | `/auth/test/produccion` | requireProduccionOrAdmin | Test de acceso Producción |

## 2. Usuarios (`/api/users`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/users/:id/reset-password` | requireRole(['ADMIN','RH']) | Restablecer contraseña |
| GET | `/users` | requireRole(['ADMIN']) | Listar usuarios |
| GET | `/users/stats` | requireRole(['ADMIN']) | Estadísticas de usuarios |
| GET | `/users/:id` | requireRole(['ADMIN']) | Obtener usuario |
| POST | `/users` | requireRole(['ADMIN']) | Crear usuario |
| PUT | `/users/:id` | requireRole(['ADMIN']) | Actualizar usuario |
| DELETE | `/users/:id` | requireRole(['ADMIN']) | Eliminar usuario |

## 3. Empleados y organización (`/api`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/employees/template` | RH/ADMIN | Plantilla CSV de importación |
| POST | `/employees/import` | RH/ADMIN | Importar empleados (CSV) |
| GET | `/employees/export` | RH/ADMIN | Exportar empleados (Excel) |
| GET | `/employees` | module EMPLEADOS | Listar empleados |
| GET | `/employees/me` | verifyToken | Empleado del usuario actual |
| GET | `/employees/stats` | RH/ADMIN | Estadísticas de empleados |
| POST | `/employees` | RH/ADMIN | Crear empleado |
| GET | `/employees/:id` | RH/ADMIN | Obtener empleado |
| PUT | `/employees/:id` | RH/ADMIN | Actualizar empleado |
| DELETE | `/employees/:id` | RH/ADMIN | Baja lógica (soft delete) |
| DELETE | `/employees/:id/permanent` | RH/ADMIN | Baja física |
| GET | `/employees/:id/salary-history` | RH/ADMIN | Historial de sueldos |
| POST | `/employees/:id/photo` | RH/ADMIN | Subir foto de perfil |
| GET | `/departments` | module EMPLEADOS | Listar departamentos |
| POST | `/departments` | module EMPLEADOS | Crear departamento |
| PUT | `/departments/:id` | module EMPLEADOS | Actualizar departamento |
| DELETE | `/departments/:id` | module EMPLEADOS | Eliminar departamento |
| GET | `/departments/:id/job-positions` | verifyToken | Puestos por departamento |
| GET | `/job-positions` | module EMPLEADOS | Listar puestos |
| POST | `/job-positions` | module EMPLEADOS | Crear puesto |
| PUT | `/job-positions/:id` | module EMPLEADOS | Actualizar puesto |
| DELETE | `/job-positions/:id` | module EMPLEADOS | Eliminar puesto |
| GET | `/managers` | verifyToken | Jefes directos |
| GET | `/organization/stats` | module EMPLEADOS | Estadísticas de organización |

> Nota: `employee.routes.js` también expone `GET/POST/PUT/DELETE /departments` y `/job-positions` con permiso `RH/ADMIN` (histórico). `organization.routes.js` es la implementación vigente con `requireModule('EMPLEADOS')`.

## 4. Documentos de empleado (`/api`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/employee/:employeeId/documents` | module EMPLEADOS | Listar documentos |
| GET | `/employee-documents/allowed-types` | module EMPLEADOS | Tipos permitidos |
| POST | `/employee/:employeeId/documents` | RH/ADMIN | Subir documento |
| GET | `/employee-documents/:documentId/download` | module EMPLEADOS | Descargar documento |
| DELETE | `/employee-documents/:documentId` | RH/ADMIN | Eliminar documento |

## 5. Reclutamiento (`/api`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/vacancies/form-data` | module RECLUTAMIENTO | Datos para formulario |
| POST | `/vacancies` | module RECLUTAMIENTO | Crear solicitud de vacante |
| GET | `/vacancies` | module RECLUTAMIENTO | Listar vacantes |
| GET | `/vacancies/my` | module RECLUTAMIENTO | Mis vacantes |
| GET | `/vacancies/stats` | module RECLUTAMIENTO | Estadísticas de vacantes |
| GET | `/vacancies/:id` | module RECLUTAMIENTO | Detalle de vacante |
| POST | `/recruitment/vacancies` | module RECLUTAMIENTO | Crear (flujo estándar) |
| GET | `/recruitment/my-vacancies` | module RECLUTAMIENTO | Mis vacantes (alias) |
| PUT | `/recruitment/vacancies/:id/technical-profile` | module RECLUTAMIENTO | Perfil técnico |
| POST | `/recruitment/vacancies/:id/activities` | module RECLUTAMIENTO | Crear actividades |
| GET | `/recruitment/vacancies` | module RECLUTAMIENTO | Listar (RH/ADMIN) |
| PUT | `/recruitment/vacancies/:id/approve` | RH/ADMIN | Aprobar vacante |
| PUT | `/recruitment/vacancies/:id/close` | RH/ADMIN | Cerrar vacante |
| POST | `/recruitment/vacancies/direct` | RH/ADMIN | Vacante Fast-Track |
| GET | `/recruitment/vacancies/:id` | module RECLUTAMIENTO | Detalle |
| POST | `/recruitment/vacancies/:id/comments` | module RECLUTAMIENTO | Agregar comentario |
| POST | `/recruitment/vacancies/:vacancy_id/candidates` | RH/ADMIN | Registrar candidato (CV + prueba) |
| PUT | `/recruitment/candidates/:candidate_id/observations` | RH/ADMIN | Observaciones de candidato |
| PUT | `/recruitment/candidates/:candidate_id/documents` | RH/ADMIN | Actualizar CV/prueba |
| PUT | `/recruitment/candidates/:candidate_id/vote` | module RECLUTAMIENTO | Votar candidato |
| PUT | `/recruitment/candidates/:candidate_id/select` | module RECLUTAMIENTO | Seleccionar candidato final |
| GET | `/recruitment/candidates/:candidate_id/cv` | module RECLUTAMIENTO | Descargar CV |
| DELETE | `/recruitment/vacancies/:id` | RH/ADMIN | Eliminar vacante |
| PUT | `/recruitment/activities/:activityId` | module RECLUTAMIENTO | Completar actividad |
| PUT | `/recruitment/vacancies/:id/cancel` | module RECLUTAMIENTO | Cancelar vacante |

## 6. Estadísticas (`/api`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/stats/rh/dashboard` | module EMPLEADOS | Dashboard de RH |
| GET | `/stats/my-dashboard` | verifyToken | "Mi Espacio" |
| GET | `/stats/system` | module CONFIGURACION | Estadísticas del sistema |

## 7. Permisos (`/api`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/permissions/users` | ADMIN/RH | Usuarios con sus permisos |
| GET | `/permissions/modules` | ADMIN/RH | Módulos disponibles |
| PUT | `/permissions/users/:id` | ADMIN/RH | Actualizar permisos |
| GET | `/permissions/me` | verifyToken | Permisos del usuario actual |

## 8. Compras (`/api`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/purchases/:id/comments/stream` | module COMPRAS (SSE) | Stream de comentarios en tiempo real |
| POST | `/purchases` | module COMPRAS | Crear solicitud de compra |
| GET | `/purchases/my` | module COMPRAS | Mis solicitudes |
| GET | `/purchases` | module COMPRAS | Todas las solicitudes |
| GET | `/purchases/details/:id` | module COMPRAS | Detalle de solicitud |
| POST | `/purchases/:id/quotes` | module COMPRAS | Subir cotizaciones |
| POST | `/purchases/:id/select-quote` | module COMPRAS | Seleccionar cotización |
| POST | `/purchases/:id/authorize` | module COMPRAS | Autorizar solicitud |
| POST | `/purchases/:id/deliver` | module COMPRAS | Marcar entregada |
| GET | `/purchases/:id/potential-approvers` | module COMPRAS | Aprobadores potenciales |
| POST | `/purchases/:id/assign-approvers` | module COMPRAS | Asignar aprobadores |
| POST | `/purchases/:id/send-authorization` | module COMPRAS | Enviar a autorización |
| DELETE | `/purchases/:id` | module COMPRAS | Eliminar solicitud |
| PUT | `/purchases/:id/items` | module COMPRAS | Actualizar partidas |
| POST | `/purchases/:id/cancel` | module COMPRAS | Cancelar solicitud |
| POST | `/purchases/:id/quotes/:quoteId/upload` | module COMPRAS | Subir archivo a cotización |
| POST | `/purchases/:id/quotes/upload-with-file` | module COMPRAS | Cotización con archivo (multipart) |
| POST | `/purchases/:id/upload-quote-file` | module COMPRAS | Subir archivo previo |
| PUT | `/purchases/:id/quotes/:quoteId` | module COMPRAS | Actualizar cotización |
| PUT | `/purchases/:id/quotes/:quoteId/amount` | module COMPRAS | Actualizar monto (compat) |
| GET | `/purchases/:id/comparison` | module COMPRAS | Comparativa de cotizaciones |
| GET | `/purchases/:id/purchase-order` | module COMPRAS | Obtener orden de compra |
| POST | `/purchases/:id/purchase-order` | module COMPRAS | Generar orden de compra |
| GET | `/purchase-orders` | module COMPRAS | Listar órdenes de compra |
| POST | `/purchases/:id/regenerate-order` | module COMPRAS | Regenerar orden (legacy) |
| GET | `/purchases/:id/audit` | module COMPRAS | Historial de auditoría |
| GET | `/purchases/:id/comments` | module COMPRAS | Comentarios |
| POST | `/purchases/:id/comments` | module COMPRAS | Agregar comentario |

**Autorización pública** (solo autenticación, sin módulo COMPRAS — para Gerentes/Directores):

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/purchases/public/:id` | verifyToken | Detalle de solicitud |
| POST | `/purchases/public/:id/authorize` | verifyToken | Autorizar solicitud |

## 9. Papelería (`/api`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/stationery/my` | verifyToken | Mis solicitudes |
| POST | `/stationery` | verifyToken | Crear solicitud |
| POST | `/stationery/:id/cancel` | verifyToken | Cancelar solicitud |
| GET | `/stationery/inventory` | module COMPRAS + ADMIN/RH/COMPRAS | Ver inventario |
| POST | `/stationery/inventory` | module COMPRAS + ADMIN/RH | Agregar item |
| PUT | `/stationery/inventory/:id` | module COMPRAS + ADMIN/RH | Actualizar item |
| DELETE | `/stationery/inventory/:id` | module COMPRAS + ADMIN/RH | Eliminar item |
| POST | `/stationery/inventory/:id/restock` | module COMPRAS + ADMIN/RH | Reponer stock |
| GET | `/stationery` | module COMPRAS | Todas las solicitudes |
| GET | `/stationery/:id` | module COMPRAS | Detalle |
| POST | `/stationery/:id/deliver` | module COMPRAS | Marcar entregada |

## 10. Uniformes (`/api`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/uniforms/inventory` | module COMPRAS + ADMIN/RH/COMPRAS | Ver inventario |
| POST | `/uniforms/inventory` | module COMPRAS + ADMIN/RH | Agregar item |
| PUT | `/uniforms/inventory/:id` | module COMPRAS + ADMIN/RH | Actualizar item |
| DELETE | `/uniforms/inventory/:id` | module COMPRAS + ADMIN/RH | Eliminar item |
| POST | `/uniforms/inventory/:id/restock` | module COMPRAS + ADMIN/RH | Reponer stock |
| POST | `/uniforms/deliveries` | module COMPRAS | Registrar entrega |
| GET | `/uniforms/deliveries` | module COMPRAS | Listar entregas |
| GET | `/uniforms/deliveries/:id` | module COMPRAS | Detalle de entrega |
| GET | `/uniforms/employees/:empleadoId/history` | module COMPRAS | Historial por empleado |

## 11. Ajustes y movimientos de inventario (`/api`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/inventory-adjustments` | module COMPRAS | Solicitar ajuste |
| GET | `/inventory-adjustments` | module COMPRAS | Listar (ADMIN/RH ven todas) |
| POST | `/inventory-adjustments/:id/approve` | ADMIN/RH | Aprobar ajuste |
| POST | `/inventory-adjustments/:id/reject` | ADMIN/RH | Rechazar ajuste |
| GET | `/inventory-movements` | module COMPRAS + ADMIN/RH/COMPRAS | Kardex de movimientos |

## 12. Incidencias / Asistencia (`/api/incidencias`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/incidencias/upload` | module INCIDENCIAS | Subir CSV del checador |
| GET | `/incidencias` | module INCIDENCIAS | Registros por rango de fechas |

## 13. Roles y módulos (`/api`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/roles` | verifyToken | Roles del sistema + personalizados |
| POST | `/roles` | ADMIN | Crear rol personalizado |
| PUT | `/roles/:id` | ADMIN | Actualizar rol personalizado |
| DELETE | `/roles/:id` | ADMIN | Eliminar rol personalizado |
| GET | `/modules` | verifyToken | Módulos disponibles |
| GET | `/roles/presets` | verifyToken | Presets de módulos por rol |

## 14. Notificaciones (`/api`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/notifications/upcoming` | verifyToken | Próximos cumpleaños/aniversarios (`?dias=30`) |
| POST | `/notifications/check-now` | ADMIN/RH | Ejecutar verificación manual |
| GET | `/notifications/logs` | ADMIN/RH | Historial de envíos (`?page&limit&tipo`) |

## 15. Seed / Reseteo (`/api`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/seed/reset` | ADMIN | Resetear BD y ejecutar seed (`{confirm:true}`) |

## 16. Vacaciones (`/api`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/vacations` | module VACACIONES | Crear solicitud (PENDIENTE si hay jefe; AUTORIZADA si no) |
| GET | `/vacations/my` | module VACACIONES | Mis solicitudes |
| GET | `/vacations/balance` | module VACACIONES | Saldo: antigüedad, corresponden, usados, disponibles |
| GET | `/vacations/pending-for-jefe` | module VACACIONES | Pendientes de autorizar (jefe directo) |
| GET | `/vacations` | module VACACIONES | Todas (ADMIN/RH) o propias (scoping) |
| GET | `/vacations/:id` | module VACACIONES | Detalle |
| POST | `/vacations/:id/authorize-jefe` | module VACACIONES | Jefe autoriza (PENDIENTE → AUTORIZADA) |
| POST | `/vacations/:id/approve` | ADMIN/RH | RH aprueba (AUTORIZADA → APROBADA, descuenta días) |
| POST | `/vacations/:id/reject` | module VACACIONES | Jefe o RH rechaza |
| POST | `/vacations/:id/cancel` | module VACACIONES | Empleado cancela (solo PENDIENTE) |

## 17. Reportes (`/api`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/reports/empleados` (+ `/export`) | module REPORTES | Reporte de empleados |
| GET | `/reports/compras` (+ `/export`) | module REPORTES | Reporte de compras (`?estatus&fechaDesde&fechaHasta`) |
| GET | `/reports/inventario` (+ `/export`) | module REPORTES | Inventario papelería/uniformes (stock bajo) |
| GET | `/reports/asistencia` (+ `/export`) | module REPORTES | Checadas (`?fechaDesde&fechaHasta`) |
| GET | `/reports/vacaciones` (+ `/export`) | module REPORTES | Reporte de vacaciones (`?estatus`) |

## Códigos de error comunes

| Código | Significado |
|---|---|
| 400 | Datos inválidos / JSON malformado |
| 401 | Token ausente, expirado o inválido |
| 403 | Sin permiso (módulo/rol insuficiente) |
| 404 | Recurso no encontrado |
| 413 | Archivo o payload excede el límite (10 MB) |
| 500 | Error interno del servidor |
| 503 | Módulo de ruta falló al cargar |
