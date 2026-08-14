# Auditoría del Módulo: COMPRAS

**Fecha**: 24/06/2026  
**Auditor**: Arquitectura — ERP KRAM  
**Versión**: 1.0

---

## Descripción

Módulo de gestión de compras que cubre solicitudes de compra, cotizaciones, aprobaciones, órdenes de compra, papelería/periféricos y uniformes. Es el módulo más complejo del sistema con 8 servicios especializados.

---

## Modelos Prisma

| Modelo | Propósito | Líneas |
|--------|-----------|--------|
| `PurchaseRequest` | Solicitud de compra (folio, estatus, solicitante, departamento) | ~25 |
| `PurchaseItem` | Artículos de una solicitud | ~10 |
| `PurchaseQuote` | Cotizaciones por solicitud (proveedor, monto, archivo) | ~15 |
| `PurchaseComment` | Comentarios tipo chat en solicitudes | ~10 |
| `PurchaseApprover` | Aprobadores asignados a una solicitud | ~15 |
| `PurchaseOrder` | Orden de compra generada (PDF, proveedor, montos) | ~20 |
| `PurchaseOrderItem` | Partidas de la orden de compra | ~10 |
| `PurchaseAuditLog` | Auditoría de acciones sobre solicitudes | ~15 |
| `StationeryRequest` | Solicitud de papelería/periféricos | ~20 |
| `StationeryItem` | Artículos de papelería solicitados | ~10 |
| `StationeryInventory` | Inventario de papelería | ~10 |
| `UniformInventory` | Inventario de uniformes (tipo, talla, género) | ~15 |
| `UniformDelivery` | Entrega de uniformes a empleados | ~15 |

**Total**: 13 modelos involucrados

---

## Rutas (Backend)

### Archivo: `purchase.routes.js` (222 líneas)

| Método | Ruta | Middleware | Controlador |
|--------|------|-----------|-------------|
| GET | `/purchases/:id/comments/stream` | verifyTokenFromQuery, requireModule('COMPRAS') | streamComments |
| POST | `/purchases` | verifyToken, requireModule('COMPRAS') | createRequest |
| GET | `/purchases/my` | verifyToken, requireModule('COMPRAS') | getMyRequests |
| GET | `/purchases` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | getAllRequests |
| GET | `/purchases/details/:id` | verifyToken, requireModule('COMPRAS') | getRequestDetails |
| POST | `/purchases/:id/quotes` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | uploadQuotes |
| POST | `/purchases/:id/select-quote` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | selectQuote |
| POST | `/purchases/:id/authorize` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | authorizeRequest |
| POST | `/purchases/:id/deliver` | verifyToken, requireModule('COMPRAS') | markAsDelivered |
| GET | `/purchases/:id/potential-approvers` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | getPotentialApprovers |
| POST | `/purchases/:id/assign-approvers` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | assignApprovers |
| POST | `/purchases/:id/send-authorization` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | sendAuthorization |
| DELETE | `/purchases/:id` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | deleteRequest |
| PUT | `/purchases/:id/items` | verifyToken, requireModule('COMPRAS') | updateItems |
| POST | `/purchases/:id/cancel` | verifyToken, requireModule('COMPRAS') | cancelRequest |
| POST | `/purchases/:id/quotes/:quoteId/upload` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | uploadQuoteFile |
| POST | `/purchases/:id/quotes/upload-with-file` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | uploadQuoteWithFile |
| POST | `/purchases/:id/upload-quote-file` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | uploadQuoteFileForNewQuote |
| PUT | `/purchases/:id/quotes/:quoteId` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | updateQuote |
| PUT | `/purchases/:id/quotes/:quoteId/amount` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | updateQuote |
| GET | `/purchases/:id/comparison` | verifyToken, requireModule('COMPRAS') | getQuoteComparison |
| GET | `/purchases/:id/purchase-order` | verifyToken, requireModule('COMPRAS') | getPurchaseOrder |
| POST | `/purchases/:id/purchase-order` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | generatePurchaseOrder |
| GET | `/purchase-orders` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | getAllPurchaseOrders |
| POST | `/purchases/:id/regenerate-order` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | regeneratePurchaseOrder |
| GET | `/purchases/:id/audit` | verifyToken, requireModule('COMPRAS'), requireRole(['ADMIN','COMPRAS']) | getAuditHistory |
| GET | `/purchases/:id/comments` | verifyToken, requireModule('COMPRAS') | getComments |
| POST | `/purchases/:id/comments` | verifyToken, requireModule('COMPRAS') | addComment |

### Archivo: `purchase-public.routes.js` (30 líneas)

| Método | Ruta | Middleware | Controlador |
|--------|------|-----------|-------------|
| GET | `/purchases/public/:id` | verifyToken | getRequestDetails |
| POST | `/purchases/public/:id/authorize` | verifyToken | authorizeRequest |

### Archivo: `stationery.routes.js` (67 líneas)

| Método | Ruta | Middleware | Controlador |
|--------|------|-----------|-------------|
| GET | `/stationery/my` | verifyToken | getMyRequests |
| POST | `/stationery` | verifyToken | createRequest |
| POST | `/stationery/:id/cancel` | verifyToken | cancelRequest |
| GET | `/stationery/inventory` | verifyToken, requireModule('COMPRAS') | getInventory |
| POST | `/stationery/inventory` | verifyToken, requireRole(['ADMIN','COMPRAS']) | addInventoryItem |
| PUT | `/stationery/inventory/:id` | verifyToken, requireRole(['ADMIN','COMPRAS']) | updateInventoryItem |
| DELETE | `/stationery/inventory/:id` | verifyToken, requireRole(['ADMIN','COMPRAS']) | deleteInventoryItem |
| GET | `/stationery` | verifyToken, requireModule('COMPRAS') | getAllRequests |
| GET | `/stationery/:id` | verifyToken, requireModule('COMPRAS') | getRequestById |
| POST | `/stationery/:id/deliver` | verifyToken, requireModule('COMPRAS') | deliverRequest |

### Archivo: `uniform.routes.js` (57 líneas)

| Método | Ruta | Middleware | Controlador |
|--------|------|-----------|-------------|
| GET | `/uniforms/inventory` | verifyToken, requireModule('COMPRAS') | getInventory |
| POST | `/uniforms/inventory` | verifyToken, requireRole(['ADMIN','COMPRAS']) | addInventoryItem |
| PUT | `/uniforms/inventory/:id` | verifyToken, requireRole(['ADMIN','COMPRAS']) | updateInventoryItem |
| DELETE | `/uniforms/inventory/:id` | verifyToken, requireRole(['ADMIN','COMPRAS']) | deleteInventoryItem |
| POST | `/uniforms/deliveries` | verifyToken, requireModule('COMPRAS') | createDelivery |
| GET | `/uniforms/deliveries` | verifyToken, requireModule('COMPRAS') | getDeliveries |
| GET | `/uniforms/deliveries/:id` | verifyToken, requireModule('COMPRAS') | getDeliveryById |
| GET | `/uniforms/employees/:empleadoId/history` | verifyToken, requireRole(['ADMIN','COMPRAS','RH']) | getEmployeeHistory |

**Total de endpoints**: 46

---

## APIs (Frontend)

### `frontend/lib/api.js`

| Objeto | Métodos | Endpoints |
|--------|---------|-----------|
| `stationeryApi` | `getMyRequests`, `createRequest`, `cancelRequest`, `getAllRequests`, `getRequestById`, `deliverRequest`, `getInventory`, `addInventoryItem`, `updateInventoryItem`, `deleteInventoryItem` | 10 |
| `uniformApi` | `getInventory`, `addInventoryItem`, `updateInventoryItem`, `deleteInventoryItem`, `createDelivery`, `getDeliveries`, `getDeliveryById`, `getEmployeeHistory` | 8 |

**Nota**: Las APIs de compras (solicitudes, cotizaciones, órdenes) se consumen directamente desde los componentes sin un objeto api.js dedicado.

---

## Componentes (Frontend)

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| `PurchaseOrderModal` | `frontend/components/PurchaseOrderModal.js` | Modal para generar/ver órdenes de compra |
| `PurchaseComments` | `frontend/components/PurchaseComments.js` | Sistema de comentarios tipo chat en solicitudes |
| `SendAuthorizationModal` | `frontend/components/SendAuthorizationModal.js` | Modal para enviar autorización por email |
| `QuoteSelectionModal` | `frontend/components/QuoteSelectionModal.js` | Modal para seleccionar cotización |

### Páginas

| Ruta Frontend | Archivo | Propósito |
|---------------|---------|-----------|
| `/compras/mis-solicitudes` | `frontend/app/compras/mis-solicitudes/page.js` | Lista de solicitudes del usuario |
| `/compras/mis-solicitudes/[id]` | `frontend/app/compras/mis-solicitudes/[id]/page.js` | Detalle de solicitud |
| `/compras/nueva-solicitud` | `frontend/app/compras/nueva-solicitud/page.js` | Crear solicitud |
| `/compras/papeleria` | `frontend/app/compras/papeleria/page.js` | Mis solicitudes de papelería |
| `/compras/papeleria/nueva-solicitud` | `frontend/app/compras/papeleria/nueva-solicitud/page.js` | Nueva solicitud de papelería |
| `/compras/papeleria/[id]` | `frontend/app/compras/papeleria/[id]/page.js` | Detalle solicitud papelería |
| `/dashboard/compras` | `frontend/app/dashboard/compras/page.js` | Dashboard de compras (Admin/Compras) |
| `/dashboard/compras/[id]` | `frontend/app/dashboard/compras/[id]/page.js` | Gestión detallada de solicitud |
| `/dashboard/compras/papeleria` | `frontend/app/dashboard/compras/papeleria/page.js` | Gestión de solicitudes de papelería |
| `/dashboard/compras/papeleria/inventario` | `frontend/app/dashboard/compras/papeleria/inventario/page.js` | Inventario de papelería |
| `/dashboard/compras/uniformes` | `frontend/app/dashboard/compras/uniformes/page.js` | Gestión de uniformes |
| `/dashboard/compras/uniformes/inventario` | `frontend/app/dashboard/compras/uniformes/inventario/page.js` | Inventario de uniformes |
| `/dashboard/compras/uniformes/entregas/[id]` | `frontend/app/dashboard/compras/uniformes/entregas/[id]/page.js` | Detalle de entrega |
| `/rh/uniformes` | `frontend/app/rh/uniformes/page.js` | Uniformes desde RH |
| `/rh/uniformes/[id]` | `frontend/app/rh/uniformes/[id]/page.js` | Detalle uniforme RH |
| `/autorizar-compra/[id]` | `frontend/app/autorizar-compra/[id]/page.js` | Página pública de autorización |

---

## Servicios (Backend)

| Servicio | Archivo | Propósito | Líneas |
|----------|---------|-----------|--------|
| `PurchaseService` | `services/purchases/purchase.service.js` | CRUD de solicitudes, estados, archivos | ~400 |
| `QuoteService` | `services/purchases/quote.service.js` | Cotizaciones (subir, seleccionar, editar) | ~200 |
| `ApprovalService` | `services/purchases/approval.service.js` | Aprobadores (potenciales, asignar) | ~150 |
| `PurchaseOrderService` | `services/purchases/purchase-order.service.js` | Órdenes de compra (generar, PDF, listar) | ~300 |
| `ComparisonService` | `services/purchases/comparison.service.js` | Comparativa de cotizaciones | ~100 |
| `NotificationService` | `services/purchases/purchase-notification.service.js` | Notificaciones email de autorización | ~200 |
| `StatusNotificationService` | `services/purchases/status-notification.service.js` | Notificaciones de cambio de estado | ~100 |
| `StationeryService` | `services/purchases/stationery.service.js` | CRUD de papelería (solicitudes + inventario) | ~200 |
| `UniformService` | `services/purchases/uniform.service.js` | CRUD de uniformes (inventario + entregas) | ~200 |

---

## Flujo Funcional

```
Usuario crea solicitud (NUEVO)
  ↓
Admin/Compras sube cotizaciones (PENDIENTE)
  ↓
Admin/Compras selecciona cotización
  ├── Si < $50,000 → APROBADO automático
  └── Si ≥ $50,000 → EN_AUTORIZACION
       ↓
       Asignar aprobadores → Enviar email
       ↓
       Aprobador autoriza (APROBADO)
  ↓
Admin/Compras marca como entregado (ENTREGADO)
  ↓
Generar orden de compra (PDF)
```

---

## Permisos

### Nivel A — Módulos
- `requireModule('COMPRAS')` en todos los endpoints de compras
- `requireModule('COMPRAS')` en papelería y uniformes (inventario/gestión)
- Rutas públicas (`/purchases/public/`) solo requieren `verifyToken`, NO módulo

### Nivel B — Scoping de Datos
- `getMyRequests`: Filtra por solicitante (employeeId del usuario)
- `getAllRequests`: Sin scoping (Admin/Compras ven todo)
- Papelería: `getMyRequests` filtra por solicitante
- Uniformes: Sin scoping de datos

### Nivel C — Operaciones Críticas
- `requireRole(['ADMIN', 'COMPRAS'])` en: subir/seleccionar cotizaciones, autorizar, asignar aprobadores, eliminar, generar OC
- `requireRole(['ADMIN', 'COMPRAS', 'RH'])` en: historial de uniformes por empleado

---

## Problemas Encontrados

### 🔴 P0 — Críticos

1. **Controller de 864 líneas** (`purchase.controller.js`): Aunque está refactorizado para delegar en servicios, el archivo sigue siendo muy grande. Contiene 25 métodos estáticos.

2. **Prisma inline en controller** (línea 435-437): `updateQuote` crea una instancia de Prisma directamente en el controller para obtener el valor anterior de la cotización. Esto viola la separación de capas.

3. **Ruta `/purchases/public/:id/authorize` sin protección de módulo**: Solo requiere `verifyToken`, cualquier usuario autenticado puede autorizar si conoce el ID.

### 🟡 P1 — Altos

4. **Rutas duplicadas de vacantes**: Existen dos sistemas paralelos de vacantes:
   - `/api/vacancies/*` (vacancyApi en frontend)
   - `/api/recruitment/vacancies/*` (recruitmentApi en frontend)
   Ambos apuntan al mismo controller (`recruitmentController`).

5. **`purchase.controller.js` requiere `@prisma/client` inline** (línea 435): Debería estar en el servicio.

6. **Papelería y Uniformes sin scoping de datos Nivel B**: `getAllRequests` y `getDeliveries` no filtran por departamento del usuario.

### 🟡 P2 — Medios

7. **Ruta `/purchases/:id/deliver` sin requireRole**: Cualquier usuario con módulo COMPRAS puede marcar como entregado.

8. **Ruta `/purchases/:id/cancel` sin requireRole**: Cualquier usuario con módulo COMPRAS puede cancelar.

9. **Ruta `/purchases/:id/items` sin requireRole**: Cualquier usuario con módulo COMPRAS puede actualizar items.

10. **Ruta `/stationery/my` sin requireModule**: Cualquier usuario autenticado puede ver sus solicitudes de papelería.

### 🟢 P3 — Bajos

11. **Ruta `/stationery` (GET all) sin requireRole**: Solo requireModule('COMPRAS'), cualquier usuario con módulo COMPRAS ve todas las solicitudes.

12. **Ruta `/stationery/:id/deliver` sin requireRole**: Solo requireModule('COMPRAS').

13. **Ruta `/uniforms/deliveries` (GET) sin requireRole**: Solo requireModule('COMPRAS').

14. **Ruta `/uniforms/deliveries/:id` sin requireRole**: Solo requireModule('COMPRAS').

---

## Deuda Técnica

| ID | Descripción | Prioridad | Archivo |
|----|-------------|-----------|---------|
| DT-01 | Controller de 864 líneas (purchase.controller.js) | P1 | `controllers/purchase.controller.js` |
| DT-02 | Prisma inline en controller (línea 435-437) | P1 | `controllers/purchase.controller.js` |
| DT-03 | Dos sistemas de vacantes paralelos | P1 | `routes/recruitment.routes.js` |
| DT-04 | Falta de scoping Nivel B en papelería/uniformes | P2 | `services/purchases/stationery.service.js`, `uniform.service.js` |
| DT-05 | Endpoints sin requireRole donde debería haber | P2 | `routes/stationery.routes.js`, `routes/uniform.routes.js` |
| DT-06 | Ruta pública de autorización sin protección de módulo | P1 | `routes/purchase-public.routes.js` |
| DT-07 | Falta de pruebas unitarias en servicios de compras | P2 | `services/purchases/*` |
| DT-08 | Código duplicado de manejo de archivos psychTest en recruitment.routes.js | P2 | `routes/recruitment.routes.js` |

---

## Mejoras Sugeridas

1. **Dividir purchase.controller.js** en controladores especializados (PurchaseRequestController, QuoteController, ApprovalController, PurchaseOrderController).

2. **Mover Prisma inline** de `updateQuote` al servicio `QuoteService.updateQuote`.

3. **Agregar requireRole** a rutas de papelería y uniformes que lo requieran.

4. **Unificar sistema de vacantes**: Eliminar rutas `/api/vacancies/*` duplicadas y mantener solo `/api/recruitment/vacancies/*`.

5. **Agregar scoping Nivel B** en servicios de papelería y uniformes (filtrar por departamento del usuario).

6. **Proteger ruta pública** de autorización con validación adicional (token de autorización único).

7. **Agregar pruebas unitarias** para servicios críticos (PurchaseService, QuoteService, PurchaseOrderService).

---

## Estado General

| Dimensión | Calificación | Comentario |
|-----------|-------------|------------|
| **Arquitectura** | 8/10 | Buena separación de capas, pero controller muy grande |
| **Seguridad** | 7/10 | Nivel A bien implementado, Nivel B incompleto en papelería/uniformes |
| **UI** | 8/10 | Componentes funcionales, buena experiencia de usuario |
| **Backend** | 8/10 | Servicios bien estructurados, auditoría implementada |
| **Mantenibilidad** | 7/10 | Controller grande, código duplicado en recruitment routes |

### Calificación Final: **7.6 / 10**
