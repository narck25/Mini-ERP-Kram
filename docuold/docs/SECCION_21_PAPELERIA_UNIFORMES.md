# Sección 21 — Módulo de Papelería y Uniformes

**Fecha de generación**: 24/06/2026  
**Versión**: 1.0  
**Propósito**: Documentar la arquitectura completa de los submódulos de Papelería (Stationery) y Uniformes (Uniforms), incluyendo modelo de datos, API REST, frontend, permisos y flujos de negocio.

---

## 21.1 Visión General

Los submódulos de **Papelería** y **Uniformes** son extensiones operativas del módulo **COMPRAS**. Permiten gestionar solicitudes de artículos de oficina y la entrega de uniformes al personal, con inventarios dedicados y control de existencias.

| Submódulo | Propósito | Usuarios objetivo |
|-----------|-----------|-------------------|
| **Papelería** | Solicitud, gestión y entrega de artículos de papelería y periféricos | Todos los empleados (solicitantes), Admin/Compras (gestión) |
| **Uniformes** | Inventario y registro de entregas de uniformes al personal | Admin/Compras (inventario y entregas), RH (historial) |

---

## 21.2 Modelo de Datos (Prisma)

### 21.2.1 Enumeraciones

```prisma
enum StationeryStatus {
  PENDIENTE
  ENTREGADO
  CANCELADO
}
```

### 21.2.2 Modelos — Papelería

#### `StationeryRequest` (Tabla: `stationery_requests`)

Solicitud de papelería realizada por un empleado.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String @id @default(cuid())` | Identificador único |
| `solicitanteId` | `String` | FK → `Employee.id` |
| `departamentoId` | `String` | FK → `Department.id` |
| `estatus` | `StationeryStatus @default(PENDIENTE)` | Estado de la solicitud |
| `justificacion` | `String?` | Motivo de la solicitud |
| `fechaSolicitud` | `DateTime @default(now())` | Fecha de creación |
| `fechaEntrega` | `DateTime?` | Fecha de entrega |
| `entregadoPorId` | `String?` | FK → `Employee.id` (quien entregó) |
| `createdAt` / `updatedAt` | `DateTime` | Auditoría |

**Relaciones:**
- `solicitante → Employee` (PapeleriaSolicitante)
- `departamento → Department` (PapeleriaDepartamento)
- `entregadoPor → Employee?` (PapeleriaEntregador)
- `items → StationeryItem[]`

#### `StationeryItem` (Tabla: `stationery_items`)

Artículo individual dentro de una solicitud.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String @id @default(cuid())` | Identificador único |
| `requestId` | `String` | FK → `StationeryRequest.id` |
| `producto` | `String` | Nombre del producto |
| `cantidad` | `Int` | Cantidad solicitada |
| `unidad` | `String @default("pzas")` | Unidad de medida |

**Relaciones:**
- `request → StationeryRequest` (Cascade on delete)

#### `StationeryInventory` (Tabla: `stationery_inventory`)

Catálogo de productos disponibles en inventario de papelería.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String @id @default(cuid())` | Identificador único |
| `producto` | `String @unique` | Nombre del producto |
| `categoria` | `String @default("PAPELERIA")` | Categoría: `PAPELERIA`, `PERIFERICO`, `OTRO` |
| `cantidadActual` | `Int @default(0)` | Stock actual |
| `cantidadMinima` | `Int @default(5)` | Stock mínimo para alerta |
| `unidad` | `String @default("pzas")` | Unidad de medida |
| `createdAt` / `updatedAt` | `DateTime` | Auditoría |

### 21.2.3 Modelos — Uniformes

#### `UniformInventory` (Tabla: `uniform_inventory`)

Inventario de uniformes por tipo, talla y género.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String @id @default(cuid())` | Identificador único |
| `tipo` | `String` | Tipo: `CAMISA`, `PANTALON`, `PLAYERA`, `ZAPATOS`, `CHALECO`, `MANDIL`, `GORRA` |
| `talla` | `String` | Talla (ej: `CH`, `M`, `G`, `XG`, `28`, `30`, etc.) |
| `genero` | `String?` | Género: `HOMBRE`, `MUJER`, `UNISEX` |
| `cantidadActual` | `Int @default(0)` | Stock actual |
| `cantidadMinima` | `Int @default(2)` | Stock mínimo para alerta |
| `createdAt` / `updatedAt` | `DateTime` | Auditoría |

**Unique constraint:** `@@unique([tipo, talla, genero])`

#### `UniformDelivery` (Tabla: `uniform_deliveries`)

Registro de entrega de uniformes a un empleado.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String @id @default(cuid())` | Identificador único |
| `empleadoId` | `String` | FK → `Employee.id` |
| `items` | `Json` | Array de objetos: `[{tipo, talla, cantidad}]` |
| `fechaEntrega` | `DateTime @default(now())` | Fecha de la entrega |
| `entregadoPorId` | `String` | FK → `Employee.id` (quien entrega) |
| `observaciones` | `String?` | Notas adicionales |
| `createdAt` | `DateTime` | Auditoría |

**Relaciones:**
- `empleado → Employee` (UniformeEmpleado)
- `entregadoPor → Employee` (UniformeEntregador)

---

## 21.3 API REST (Backend)

### 21.3.1 Rutas de Papelería (`stationery.routes.js`)

Archivo: `backend/src/routes/stationery.routes.js`

#### Rutas de Usuario (cualquier empleado autenticado)

| Método | Ruta | Middleware | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/stationery/my` | `verifyToken` | `getMyRequests` | Solicitudes del empleado actual |
| `POST` | `/stationery` | `verifyToken` | `createRequest` | Crear nueva solicitud |
| `POST` | `/stationery/:id/cancel` | `verifyToken` | `cancelRequest` | Cancelar solicitud propia (solo PENDIENTE) |

#### Rutas de Inventario (Admin/Compras)

| Método | Ruta | Middleware | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/stationery/inventory` | `verifyToken` + `requireModule('COMPRAS')` | `getInventory` | Listar inventario |
| `POST` | `/stationery/inventory` | `verifyToken` + `requireRole(['ADMIN', 'COMPRAS'])` | `addInventoryItem` | Agregar producto |
| `PUT` | `/stationery/inventory/:id` | `verifyToken` + `requireRole(['ADMIN', 'COMPRAS'])` | `updateInventoryItem` | Actualizar producto |
| `DELETE` | `/stationery/inventory/:id` | `verifyToken` + `requireRole(['ADMIN', 'COMPRAS'])` | `deleteInventoryItem` | Eliminar producto |

#### Rutas de Gestión (Admin/Compras)

| Método | Ruta | Middleware | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/stationery` | `verifyToken` + `requireModule('COMPRAS')` | `getAllRequests` | Todas las solicitudes |
| `GET` | `/stationery/:id` | `verifyToken` + `requireModule('COMPRAS')` | `getRequestById` | Detalle de solicitud |
| `POST` | `/stationery/:id/deliver` | `verifyToken` + `requireModule('COMPRAS')` | `deliverRequest` | Marcar como entregada |

> **⚠️ Orden importante:** Las rutas fijas (`/inventory`) deben declararse ANTES que las rutas con parámetros (`/:id`) para evitar conflictos de enrutamiento.

### 21.3.2 Rutas de Uniformes (`uniform.routes.js`)

Archivo: `backend/src/routes/uniform.routes.js`

#### Inventario (Admin/Compras)

| Método | Ruta | Middleware | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/uniforms/inventory` | `verifyToken` + `requireModule('COMPRAS')` | `getInventory` | Listar inventario |
| `POST` | `/uniforms/inventory` | `verifyToken` + `requireRole(['ADMIN', 'COMPRAS'])` | `addInventoryItem` | Agregar producto |
| `PUT` | `/uniforms/inventory/:id` | `verifyToken` + `requireRole(['ADMIN', 'COMPRAS'])` | `updateInventoryItem` | Actualizar producto |
| `DELETE` | `/uniforms/inventory/:id` | `verifyToken` + `requireRole(['ADMIN', 'COMPRAS'])` | `deleteInventoryItem` | Eliminar producto |

#### Entregas (Admin/Compras)

| Método | Ruta | Middleware | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `POST` | `/uniforms/deliveries` | `verifyToken` + `requireModule('COMPRAS')` | `createDelivery` | Registrar entrega |
| `GET` | `/uniforms/deliveries` | `verifyToken` + `requireModule('COMPRAS')` | `getDeliveries` | Listar entregas |
| `GET` | `/uniforms/deliveries/:id` | `verifyToken` + `requireModule('COMPRAS')` | `getDeliveryById` | Detalle de entrega |

#### Historial por Empleado (Admin/Compras/RH)

| Método | Ruta | Middleware | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/uniforms/employees/:empleadoId/history` | `verifyToken` + `requireRole(['ADMIN', 'COMPRAS', 'RH'])` | `getEmployeeHistory` | Historial de uniformes de un empleado |

### 21.3.3 Registro en `backend/src/index.js`

Ambos conjuntos de rutas se montan en el servidor Express:

```js
const stationeryRoutes = require('./routes/stationery.routes');
const uniformRoutes = require('./routes/uniform.routes');

app.use('/api', stationeryRoutes);
app.use('/api', uniformRoutes);
```

---

## 21.4 Servicios (Backend)

### 21.4.1 `StationeryService` (`backend/src/services/purchases/stationery.service.js`)

| Método | Descripción |
|--------|-------------|
| `getMyRequests(employeeId)` | Solicitudes del empleado, ordenadas por fecha descendente |
| `getAllRequests(filters)` | Todas las solicitudes con filtros opcionales (`estatus`, `departamentoId`) |
| `getRequestById(id)` | Detalle completo de una solicitud |
| `createRequest(data, employeeId)` | Crea solicitud con items (valida que haya al menos 1 artículo) |
| `cancelRequest(id, employeeId)` | Cancela solicitud (solo si es PENDIENTE y pertenece al solicitante) |
| `deliverRequest(id, entregadoPorId)` | Marca como ENTREGADO con fecha y responsable |
| `getInventory(filters)` | Lista inventario con filtro opcional por `categoria` |
| `addInventoryItem(data)` | Agrega producto al inventario |
| `updateInventoryItem(id, data)` | Actualiza stock/información del producto |
| `deleteInventoryItem(id)` | Elimina producto del inventario |

### 21.4.2 `UniformService` (`backend/src/services/purchases/uniform.service.js`)

| Método | Descripción |
|--------|-------------|
| `getInventory(filters)` | Lista inventario con filtros opcionales (`tipo`, `talla`) |
| `addInventoryItem(data)` | Agrega producto al inventario |
| `updateInventoryItem(id, data)` | Actualiza stock/información del producto |
| `deleteInventoryItem(id)` | Elimina producto del inventario |
| `createDelivery(data, entregadoPorId)` | Registra entrega y descuenta del inventario automáticamente |
| `getDeliveries(filters)` | Lista entregas con filtro opcional por `empleadoId` |
| `getDeliveryById(id)` | Detalle de entrega incluyendo tallas del empleado |
| `getEmployeeHistory(empleadoId)` | Historial completo de entregas a un empleado |

---

## 21.5 Controladores (Backend)

### 21.5.1 `StationeryController` (`backend/src/controllers/stationery.controller.js`)

| Método | HTTP | Lógica adicional |
|--------|------|------------------|
| `getMyRequests` | `GET /stationery/my` | Si el usuario no tiene `employeeId` (ADMIN/RH sin empleado), devuelve `[]` |
| `createRequest` | `POST /stationery` | Requiere `employeeId` — error 400 si no tiene empleado asociado |
| `cancelRequest` | `POST /stationery/:id/cancel` | Requiere `employeeId` |
| `getAllRequests` | `GET /stationery` | Filtros por query params `estatus`, `departamentoId` |
| `getRequestById` | `GET /stationery/:id` | Error 404 si no existe |
| `deliverRequest` | `POST /stationery/:id/deliver` | Requiere `employeeId` del entregador |
| `getInventory` | `GET /stationery/inventory` | Filtro por query param `categoria` |
| `addInventoryItem` | `POST /stationery/inventory` | — |
| `updateInventoryItem` | `PUT /stationery/inventory/:id` | — |
| `deleteInventoryItem` | `DELETE /stationery/inventory/:id` | — |

### 21.5.2 `UniformController` (`backend/src/controllers/uniform.controller.js`)

| Método | HTTP | Lógica adicional |
|--------|------|------------------|
| `getInventory` | `GET /uniforms/inventory` | Filtros por query params `tipo`, `talla` |
| `addInventoryItem` | `POST /uniforms/inventory` | — |
| `updateInventoryItem` | `PUT /uniforms/inventory/:id` | — |
| `deleteInventoryItem` | `DELETE /uniforms/inventory/:id` | — |
| `createDelivery` | `POST /uniforms/deliveries` | Requiere `employeeId` del entregador |
| `getDeliveries` | `GET /uniforms/deliveries` | Filtro por query param `empleadoId` |
| `getDeliveryById` | `GET /uniforms/deliveries/:id` | Error 404 si no existe |
| `getEmployeeHistory` | `GET /uniforms/employees/:empleadoId/history` | Accesible por ADMIN, COMPRAS y RH |

---

## 21.6 Frontend (Next.js)

### 21.6.1 API Client (`frontend/lib/api.js`)

#### `stationeryApi`

```js
export const stationeryApi = {
  // Mis solicitudes (usuario)
  getMyRequests: () => api.get('/stationery/my'),
  createRequest: (data) => api.post('/stationery', data),
  cancelRequest: (id) => api.post(`/stationery/${id}/cancel`),

  // Gestión (Admin/Compras)
  getAllRequests: (params) => api.get('/stationery', { params }),
  getRequestById: (id) => api.get(`/stationery/${id}`),
  deliverRequest: (id) => api.post(`/stationery/${id}/deliver`),

  // Inventario
  getInventory: (params) => api.get('/stationery/inventory', { params }),
  addInventoryItem: (data) => api.post('/stationery/inventory', data),
  updateInventoryItem: (id, data) => api.put(`/stationery/inventory/${id}`, data),
  deleteInventoryItem: (id) => api.delete(`/stationery/inventory/${id}`),
}
```

#### `uniformApi`

```js
export const uniformApi = {
  // Inventario
  getInventory: (params) => api.get('/uniforms/inventory', { params }),
  addInventoryItem: (data) => api.post('/uniforms/inventory', data),
  updateInventoryItem: (id, data) => api.put(`/uniforms/inventory/${id}`, data),
  deleteInventoryItem: (id) => api.delete(`/uniforms/inventory/${id}`),

  // Entregas
  createDelivery: (data) => api.post('/uniforms/deliveries', data),
  getDeliveries: (params) => api.get('/uniforms/deliveries', { params }),
  getDeliveryById: (id) => api.get(`/uniforms/deliveries/${id}`),

  // Historial por empleado
  getEmployeeHistory: (empleadoId) => api.get(`/uniforms/employees/${empleadoId}/history`),
}
```

### 21.6.2 Páginas de Papelería

| Ruta | Archivo | Propósito | Layout |
|------|---------|-----------|--------|
| `/compras/papeleria` | `frontend/app/compras/papeleria/page.js` | Mis solicitudes (usuario) | DashboardLayout |
| `/compras/papeleria/nueva-solicitud` | `frontend/app/compras/papeleria/nueva-solicitud/page.js` | Crear solicitud | DashboardLayout |
| `/compras/papeleria/[id]` | `frontend/app/compras/papeleria/[id]/page.js` | Detalle de solicitud | DashboardLayout |
| `/dashboard/compras/papeleria` | `frontend/app/dashboard/compras/papeleria/page.js` | Gestión de solicitudes (Admin/Compras) | DashboardLayout |
| `/dashboard/compras/papeleria/inventario` | `frontend/app/dashboard/compras/papeleria/inventario/page.js` | Inventario de papelería | DashboardLayout |

### 21.6.3 Páginas de Uniformes

| Ruta | Archivo | Propósito | Layout |
|------|---------|-----------|--------|
| `/dashboard/compras/uniformes` | `frontend/app/dashboard/compras/uniformes/page.js` | Gestión de uniformes (Admin/Compras) | DashboardLayout |
| `/dashboard/compras/uniformes/inventario` | `frontend/app/dashboard/compras/uniformes/inventario/page.js` | Inventario de uniformes | DashboardLayout |
| `/dashboard/compras/uniformes/entregas/[id]` | `frontend/app/dashboard/compras/uniformes/entregas/[id]/page.js` | Detalle de entrega | DashboardLayout |
| `/rh/uniformes` | `frontend/app/rh/uniformes/page.js` | Historial de uniformes (RH) | DashboardLayout |
| `/rh/uniformes/[id]` | `frontend/app/rh/uniformes/[id]/page.js` | Detalle de historial por empleado (RH) | DashboardLayout |

---

## 21.7 Matriz de Permisos

### Nivel A — Control de Acceso a Módulos

| Submódulo | Módulo requerido | Roles con bypass |
|-----------|------------------|------------------|
| Papelería (usuario) | No requiere módulo específico (autenticación sola) | — |
| Papelería (gestión) | `COMPRAS` | ADMIN, RH |
| Uniformes (inventario/entregas) | `COMPRAS` | ADMIN, RH |
| Uniformes (historial RH) | `requireRole(['ADMIN', 'COMPRAS', 'RH'])` | — |

### Nivel B — Scoping de Datos

| Operación | Regla de scoping |
|-----------|------------------|
| `GET /stationery/my` | Solo solicitudes del empleado autenticado (`solicitanteId === employeeId`) |
| `POST /stationery/:id/cancel` | Solo si `solicitanteId === employeeId` y estatus es `PENDIENTE` |
| `GET /stationery` (Admin/Compras) | Sin scoping — ve todas las solicitudes |
| `GET /uniforms/employees/:empleadoId/history` | Sin scoping — cualquier ADMIN/COMPRAS/RH puede ver historial de cualquier empleado |

### Nivel C — Operaciones Críticas

| Operación | Rol requerido |
|-----------|---------------|
| `POST /stationery/inventory` | `requireRole(['ADMIN', 'COMPRAS'])` |
| `PUT /stationery/inventory/:id` | `requireRole(['ADMIN', 'COMPRAS'])` |
| `DELETE /stationery/inventory/:id` | `requireRole(['ADMIN', 'COMPRAS'])` |
| `POST /uniforms/inventory` | `requireRole(['ADMIN', 'COMPRAS'])` |
| `PUT /uniforms/inventory/:id` | `requireRole(['ADMIN', 'COMPRAS'])` |
| `DELETE /uniforms/inventory/:id` | `requireRole(['ADMIN', 'COMPRAS'])` |

---

## 21.8 Flujos de Negocio

### 21.8.1 Flujo de Papelería

```
Empleado                     Admin/Compras
    │                             │
    │  1. Crea solicitud          │
    │  POST /stationery           │
    │  (items + justificación)    │
    │                             │
    │  2. (Opcional) Cancela      │
    │  POST /stationery/:id/cancel│
    │                             │
    │              ───────────────┤
    │                             │  3. Ve solicitudes pendientes
    │                             │  GET /stationery
    │                             │
    │                             │  4. Prepara artículos
    │                             │
    │                             │  5. Marca como entregada
    │                             │  POST /stationery/:id/deliver
    │              ◄──────────────┤
    │                             │
    │  6. Ve solicitud            │
    │  como ENTREGADO             │
    │                             │
```

**Estados de una solicitud:** `PENDIENTE → ENTREGADO` | `PENDIENTE → CANCELADO`

### 21.8.2 Flujo de Uniformes

```
Admin/Compras                    Empleado / RH
    │                                │
    │  1. Gestiona inventario        │
    │  CRUD /uniforms/inventory      │
    │                                │
    │  2. Registra entrega           │
    │  POST /uniforms/deliveries     │
    │  (descuenta del inventario)    │
    │                                │
    │              ──────────────────┤
    │                                │  3. RH consulta historial
    │                                │  GET /uniforms/employees/:id/history
    │              ◄─────────────────┤
    │                                │
```

**Regla de negocio:** Al registrar una entrega, el sistema descuenta automáticamente del inventario los artículos entregados (`cantidadActual = Math.max(0, cantidadActual - cantidad)`).

---

## 21.9 Resumen de Archivos

### Backend

| Archivo | Propósito |
|---------|-----------|
| `backend/src/routes/stationery.routes.js` | Rutas de Papelería (67 líneas) |
| `backend/src/routes/uniform.routes.js` | Rutas de Uniformes (57 líneas) |
| `backend/src/controllers/stationery.controller.js` | Controlador de Papelería (133 líneas) |
| `backend/src/controllers/uniform.controller.js` | Controlador de Uniformes (101 líneas) |
| `backend/src/services/purchases/stationery.service.js` | Lógica de negocio de Papelería (167 líneas) |
| `backend/src/services/purchases/uniform.service.js` | Lógica de negocio de Uniformes (116 líneas) |

### Frontend

| Archivo | Propósito |
|---------|-----------|
| `frontend/lib/api.js` (líneas 222-256) | Clientes API `stationeryApi` y `uniformApi` |
| `frontend/app/compras/papeleria/page.js` | Mis solicitudes de papelería |
| `frontend/app/compras/papeleria/nueva-solicitud/page.js` | Formulario de nueva solicitud |
| `frontend/app/compras/papeleria/[id]/page.js` | Detalle de solicitud |
| `frontend/app/dashboard/compras/papeleria/page.js` | Gestión de solicitudes (Admin/Compras) |
| `frontend/app/dashboard/compras/papeleria/inventario/page.js` | Inventario de papelería |
| `frontend/app/dashboard/compras/uniformes/page.js` | Gestión de uniformes (Admin/Compras) |
| `frontend/app/dashboard/compras/uniformes/inventario/page.js` | Inventario de uniformes |
| `frontend/app/dashboard/compras/uniformes/entregas/[id]/page.js` | Detalle de entrega |
| `frontend/app/rh/uniformes/page.js` | Historial de uniformes (RH) |
| `frontend/app/rh/uniformes/[id]/page.js` | Detalle de historial por empleado (RH) |

### Base de Datos

| Tabla | Modelo Prisma | Propósito |
|-------|---------------|-----------|
| `stationery_requests` | `StationeryRequest` | Solicitudes de papelería |
| `stationery_items` | `StationeryItem` | Artículos de cada solicitud |
| `stationery_inventory` | `StationeryInventory` | Inventario de papelería |
| `uniform_inventory` | `UniformInventory` | Inventario de uniformes |
| `uniform_deliveries` | `UniformDelivery` | Entregas de uniformes |

---

## 21.10 Estadísticas del Submódulo

| Métrica | Papelería | Uniformes | Total |
|---------|-----------|-----------|-------|
| Modelos Prisma | 3 | 2 | **5** |
| Endpoints API | 10 | 8 | **18** |
| Páginas Frontend | 5 | 5 | **10** |
| Servicios | 1 | 1 | **2** |
| Controladores | 1 | 1 | **2** |
| Archivos de rutas | 1 | 1 | **2** |

---

*Fin de la sección — Módulo de Papelería y Uniformes*
