# Guía de APIs REST — ERP KRAM

> **Documento de Estándares de API**
> *Generado: 24/06/2026*
> *Última actualización: 24/06/2026*
> *Versión: 1.0*

---

## 1. FILOSOFÍA

### Principios Rectores

| Principio | Descripción |
|-----------|-------------|
| **Consistencia** | Todas las APIs deben seguir la misma estructura de respuestas, códigos HTTP y convenciones de nombres. Un desarrollador que conoce un endpoint conoce todos. |
| **Simplicidad** | Las respuestas deben ser claras y minimalistas. Incluir solo los datos necesarios para el cliente. Evitar anidaciones innecesarias. |
| **Versionado** | Las APIs se versionan a través del prefijo `/api/`. No se utiliza versionado numérico (`/v1/`, `/v2/`) a menos que un cambio rompa la compatibilidad con el frontend existente. |

### Reglas de Oro

1. **Toda respuesta debe tener una estructura predecible.** El frontend debe poder parsear cualquier respuesta sin ambigüedad.
2. **Los errores deben ser descriptivos y localizados (español).** Mensajes como "Error interno del servidor" solo para errores no controlados.
3. **Los controladores no contienen lógica de negocio.** Solo orquestan: validan request, llaman servicios, formatean respuesta.
4. **Los servicios son la única capa que interactúa con Prisma.** Ninguna consulta a base de datos en controladores o rutas.
5. **Toda escritura crítica debe generar auditoría.** Registrar quién hizo qué y cuándo.

---

## 2. ESTRUCTURA DE RESPUESTAS

### 2.1 Respuesta Exitosa (Listado)

```json
{
  "data": [
    { "id": "1", "name": "Ejemplo", "status": "active" },
    { "id": "2", "name": "Ejemplo 2", "status": "inactive" }
  ]
}
```

### 2.2 Respuesta Exitosa (Objeto Individual)

```json
{
  "data": {
    "id": "1",
    "name": "Ejemplo",
    "status": "active",
    "department": { "id": "1", "name": "Sistemas" }
  }
}
```

### 2.3 Respuesta Exitosa con Mensaje

```json
{
  "data": { "id": "1", "name": "Ejemplo" },
  "message": "Creado exitosamente"
}
```

### 2.4 Respuesta Exitosa sin Datos (Eliminación)

```json
{
  "message": "Eliminado exitosamente"
}
```

### 2.5 Respuesta con Estructura Personalizada (Casos Específicos)

Cuando el endpoint requiere devolver múltiples entidades relacionadas:

```json
{
  "vacancy": { "id": "1", "title": "Desarrollador" },
  "candidates": [
    { "id": "1", "name": "Juan Pérez", "stage": "ENTREVISTA" }
  ]
}
```

```json
{
  "request": { "id": "1", "justificacion": "..." },
  "items": [
    { "id": "1", "productoServicio": "Laptop", "cantidad": 2 }
  ]
}
```

---

## 3. MANEJO DE ERRORES

### 3.1 Estructura de Error

```json
{
  "error": "Descripción clara del error en español"
}
```

### 3.2 Error con Mensaje Adicional (Opcional)

```json
{
  "error": "No tienes un empleado asociado",
  "message": "Contacta a RH para que te asignen uno"
}
```

### 3.3 Error de Validación (Múltiples Campos)

```json
{
  "error": "Error de validación",
  "details": [
    { "field": "name", "message": "El nombre es requerido" },
    { "field": "email", "message": "El email no es válido" }
  ]
}
```

### 3.4 Reglas para Mensajes de Error

- **Siempre en español.**
- **Descriptivos y accionables.** Decir qué salió mal y qué puede hacer el usuario.
- **No exponer detalles internos.** No incluir stack traces, consultas SQL, o rutas de archivos.
- **Errores no controlados:** Usar `console.error()` para logging interno y devolver `"Error interno del servidor"`.

---

## 4. CÓDIGOS HTTP

| Código | Uso | Cuándo usarlo |
|--------|-----|---------------|
| **200** | OK | Respuesta exitosa GET, PUT, PATCH, DELETE |
| **201** | Created | Recurso creado exitosamente (POST) |
| **400** | Bad Request | Error de validación, datos inválidos, falta de campos requeridos |
| **401** | Unauthorized | Token faltante, inválido o expirado |
| **403** | Forbidden | Usuario autenticado pero sin permisos para el recurso/módulo |
| **404** | Not Found | Recurso no encontrado (ID inexistente) |
| **500** | Internal Server Error | Error no controlado en el servidor |

### Ejemplos de uso por código

```js
// 200 - Listado exitoso
res.json({ data: entities });

// 201 - Creación exitosa
res.status(201).json({ data: entity, message: 'Creado exitosamente' });

// 400 - Error de validación
res.status(400).json({ error: 'El nombre es requerido' });

// 401 - No autenticado (middleware)
res.status(401).json({ error: 'Token no proporcionado' });

// 403 - Sin permisos
res.status(403).json({ error: 'No tienes acceso a este módulo' });

// 404 - No encontrado
res.status(404).json({ error: 'Solicitud no encontrada' });

// 500 - Error interno
res.status(500).json({ error: 'Error interno del servidor' });
```

---

## 5. CONTROLADORES DELGADOS

### 5.1 Responsabilidades del Controlador

1. **Validar request** — Parámetros, body, headers, usuario autenticado.
2. **Llamar al servicio** correspondiente.
3. **Formatear respuesta HTTP** con código y estructura adecuados.
4. **NO** contiene lógica de negocio.
5. **NO** realiza consultas Prisma directamente.
6. **NO** implementa cálculos o transformaciones complejas.

### 5.2 Patrón Obligatorio

```js
// controllers/entity.controller.js
const EntityService = require('../services/entity.service');

class EntityController {
  // GET /api/entities
  static async list(req, res) {
    try {
      const filters = req.query;
      const data = await EntityService.list(filters, req.user);
      res.json({ data });
    } catch (error) {
      console.error('Error al listar entidades:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/entities/:id
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await EntityService.getById(id);
      if (!data) return res.status(404).json({ error: 'No encontrado' });
      res.json({ data });
    } catch (error) {
      console.error('Error al obtener entidad:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/entities
  static async create(req, res) {
    try {
      const data = await EntityService.create(req.body, req.user);
      res.status(201).json({ data, message: 'Creado exitosamente' });
    } catch (error) {
      console.error('Error al crear entidad:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // PUT /api/entities/:id
  static async update(req, res) {
    try {
      const { id } = req.params;
      const data = await EntityService.update(id, req.body, req.user);
      if (!data) return res.status(404).json({ error: 'No encontrado' });
      res.json({ data, message: 'Actualizado exitosamente' });
    } catch (error) {
      console.error('Error al actualizar entidad:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // DELETE /api/entities/:id
  static async delete(req, res) {
    try {
      const { id } = req.params;
      await EntityService.delete(id, req.user);
      res.json({ message: 'Eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar entidad:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = EntityController;
```

### 5.3 Excepción: CRUD Simple

Para operaciones CRUD verdaderamente triviales (sin lógica de negocio), se permite mantener la operación en el controlador si agregar una capa de servicio no aporta valor:

```js
// ✅ ACEPTABLE: CRUD simple sin lógica de negocio
static async listSimple(req, res) {
  try {
    const entities = await prisma.simpleEntity.findMany();
    res.json({ data: entities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

> **Regla práctica:** Si la operación requiere más de 3 líneas de lógica (validaciones, cálculos, transformaciones), debe ir en un servicio.

---

## 6. SERVICIOS ESPECIALIZADOS

### 6.1 Responsabilidades del Servicio

1. **Toda la lógica de negocio.**
2. **Todas las consultas Prisma.**
3. **Validaciones de negocio** (no confundir con validación de request).
4. **Scoping de datos** (Nivel B de seguridad).
5. **Transacciones** cuando se requiera atomicidad.

### 6.2 Patrón Obligatorio

```js
// services/entity.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class EntityService {
  static async list(filters = {}, user) {
    const where = {};

    // Scoping de datos (Nivel B)
    if (user.role !== 'ADMIN' && user.role !== 'RH') {
      where.departmentId = user.employeeDepartmentId;
    }

    // Filtros dinámicos
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return await prisma.entity.findMany({
      where,
      include: { department: true },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(filters.skip) || 0,
      take: parseInt(filters.take) || 50
    });
  }

  static async getById(id) {
    return await prisma.entity.findUnique({
      where: { id },
      include: { department: true, items: true }
    });
  }

  static async create(data, user) {
    // Validación de negocio
    if (!data.name) throw new Error('El nombre es requerido');

    return await prisma.entity.create({
      data: {
        ...data,
        createdBy: user.id
      }
    });
  }

  static async update(id, data, user) {
    const existing = await prisma.entity.findUnique({ where: { id } });
    if (!existing) return null;

    return await prisma.entity.update({
      where: { id },
      data: { ...data, updatedBy: user.id }
    });
  }

  static async delete(id, user) {
    // Borrado lógico
    return await prisma.entity.update({
      where: { id },
      data: { active: false, deletedBy: user.id, deletedAt: new Date() }
    });
  }
}

module.exports = EntityService;
```

### 6.3 Servicios Especializados por Dominio

En lugar de un solo servicio monolítico, dividir por dominio:

```
services/compras/
    purchase.service.js           → CRUD de solicitudes de compra
    quote.service.js              → Cotizaciones
    approval.service.js           → Aprobadores y autorizaciones
    purchase-order.service.js     → Órdenes de compra
    stationery.service.js         → Papelería
    uniform.service.js            → Uniformes
    purchase-notification.service.js → Notificaciones por email
    comparison.service.js         → Comparativa de cotizaciones
    status-notification.service.js → Notificaciones de cambio de estado
```

---

## 7. DTOS (DATA TRANSFER OBJECTS)

### 7.1 Propósito

Los DTOs sanitizan las respuestas para:
- Ocultar campos sensibles (contraseñas, tokens internos).
- Excluir campos innecesarios para el frontend.
- Aplanar estructuras anidadas cuando sea conveniente.

### 7.2 Patrón

```js
// utils/dto.js

function sanitizeEmployee(employee) {
  if (!employee) return null;
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    department: employee.department?.name,
    position: employee.position,
    // NO incluir: userId, createdAt, updatedAt (si no son necesarios)
  };
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    accessibleModules: user.accessibleModules,
    // NO incluir: password, resetToken, etc.
  };
}

module.exports = { sanitizeEmployee, sanitizeUser };
```

### 7.3 Uso en Controlador

```js
static async getById(req, res) {
  try {
    const employee = await EmployeeService.getById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'No encontrado' });
    res.json({ data: sanitizeEmployee(employee) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## 8. VALIDACIONES

### 8.1 Validación en Controlador (Request)

El controlador valida que el request tenga la estructura esperada:

```js
static async create(req, res) {
  try {
    const { name, email, departmentId } = req.body;

    // Validaciones básicas
    if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
    if (!email) return res.status(400).json({ error: 'El email es requerido' });
    if (!departmentId) return res.status(400).json({ error: 'El departamento es requerido' });

    const data = await EntityService.create({ name, email, departmentId }, req.user);
    res.status(201).json({ data, message: 'Creado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
```

### 8.2 Validación en Servicio (Negocio)

El servicio valida reglas de negocio:

```js
static async create(data, user) {
  // Validar unicidad
  const existing = await prisma.entity.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('Ya existe una entidad con ese email');

  // Validar regla de negocio
  if (data.type === 'SPECIAL' && user.role !== 'ADMIN') {
    throw new Error('Solo ADMIN puede crear entidades de tipo SPECIAL');
  }

  return await prisma.entity.create({ data: { ...data, createdBy: user.id } });
}
```

---

## 9. PAGINACIÓN

### 9.1 Parámetros

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `skip` | integer | 0 | Número de registros a saltar |
| `take` | integer | 50 | Número de registros a tomar (máximo 100) |

### 9.2 Implementación en Servicio

```js
static async list(filters = {}, user) {
  const where = {};
  // ... filtros ...

  const skip = parseInt(filters.skip) || 0;
  const take = Math.min(parseInt(filters.take) || 50, 100);

  const [data, total] = await Promise.all([
    prisma.entity.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.entity.count({ where })
  ]);

  return {
    data,
    pagination: {
      total,
      skip,
      take,
      hasMore: skip + take < total
    }
  };
}
```

### 9.3 Respuesta con Paginación

```json
{
  "data": [
    { "id": "1", "name": "Ejemplo 1" },
    { "id": "2", "name": "Ejemplo 2" }
  ],
  "pagination": {
    "total": 150,
    "skip": 0,
    "take": 50,
    "hasMore": true
  }
}
```

---

## 10. FILTROS

### 10.1 Convención

Los filtros se pasan como **query parameters** en endpoints GET.

| Tipo de filtro | Formato | Ejemplo |
|----------------|---------|---------|
| Exacto | `?status=active` | `?status=PENDING` |
| Búsqueda | `?search=texto` | `?search=Juan` |
| Rango | `?desde=fecha&hasta=fecha` | `?desde=2026-01-01&hasta=2026-06-30` |
| Múltiple | `?status=active&status=pending` | No recomendado; usar coma: `?status=active,pending` |

### 10.2 Implementación en Servicio

```js
static async list(filters = {}, user) {
  const where = {};

  // Filtro exacto
  if (filters.status) where.status = filters.status;

  // Búsqueda textual
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  // Filtro por rango de fechas
  if (filters.desde || filters.hasta) {
    where.createdAt = {};
    if (filters.desde) where.createdAt.gte = new Date(filters.desde);
    if (filters.hasta) where.createdAt.lte = new Date(filters.hasta);
  }

  // Filtro por ID de relación
  if (filters.departmentId) where.departmentId = filters.departmentId;

  return await prisma.entity.findMany({ where });
}
```

---

## 11. ORDENAMIENTO

### 11.1 Convención

| Parámetro | Formato | Ejemplo |
|-----------|---------|---------|
| `orderBy` | `campo:asc` o `campo:desc` | `?orderBy=createdAt:desc` |
| `orderBy` (múltiple) | Separado por coma | `?orderBy=status:asc,createdAt:desc` |

### 11.2 Implementación en Servicio

```js
static async list(filters = {}, user) {
  const where = {};
  // ... filtros ...

  // Ordenamiento
  let orderBy = { createdAt: 'desc' }; // Default
  if (filters.orderBy) {
    const parts = filters.orderBy.split(',');
    orderBy = {};
    for (const part of parts) {
      const [field, direction] = part.split(':');
      orderBy[field] = direction || 'asc';
    }
  }

  return await prisma.entity.findMany({
    where,
    orderBy,
    skip: parseInt(filters.skip) || 0,
    take: parseInt(filters.take) || 50
  });
}
```

---

## 12. INCLUDE DE PRISMA

### 12.1 Convención

- Incluir relaciones solo cuando el frontend las necesite.
- No incluir relaciones anidadas profundamente (máximo 2 niveles).
- Para relaciones grandes, considerar un endpoint separado.

### 12.2 Ejemplos

```js
// ✅ BIEN: Incluir relación directa necesaria
include: { department: true }

// ✅ BIEN: Incluir relación con selección de campos
include: {
  department: {
    select: { id: true, name: true }
  }
}

// ✅ BIEN: Incluir múltiples relaciones
include: {
  department: true,
  createdBy: { select: { id: true, name: true } }
}

// ❌ MAL: Incluir relaciones innecesarias
include: {
  department: { include: { manager: { include: { user: true } } } }
}
```

---

## 13. TRANSACCIONES

### 13.1 Cuándo Usar Transacciones

- Cuando se crean/actualizan/eliminan múltiples registros relacionados.
- Cuando se requiere atomicidad: todo o nada.
- Cuando se necesita consistencia entre tablas.

### 13.2 Patrón con Prisma

```js
static async createWithItems(data, user) {
  return await prisma.$transaction(async (tx) => {
    // 1. Crear entidad principal
    const entity = await tx.entity.create({
      data: {
        name: data.name,
        createdBy: user.id
      }
    });

    // 2. Crear items relacionados
    for (const item of data.items) {
      await tx.entityItem.create({
        data: {
          entityId: entity.id,
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }
      });
    }

    // 3. Actualizar inventario (si aplica)
    await tx.inventory.update({
      where: { productId: item.productId },
      data: { stock: { decrement: item.quantity } }
    });

    return entity;
  });
}
```

### 13.3 Transacciones Interactivas (para lógica condicional)

```js
static async processWithCondition(data, user) {
  return await prisma.$transaction(async (tx) => {
    const entity = await tx.entity.findUnique({ where: { id: data.id } });
    if (!entity) throw new Error('Entidad no encontrada');

    if (entity.status === 'APPROVED') {
      await tx.entity.update({
        where: { id: data.id },
        data: { status: 'COMPLETED', completedBy: user.id }
      });
    }

    return entity;
  });
}
```

---

## 14. AUDITORÍA

### 14.1 Reglas

- **Toda escritura crítica debe generar auditoría.**
- Registrar: quién (userId), qué (acción), cuándo (timestamp), sobre qué entidad (entityId), datos relevantes (metadata).
- No auditar operaciones de solo lectura.

### 14.2 Patrón

```js
// services/audit.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AuditService {
  static ACCIONES = {
    CREACION: 'CREACION',
    ACTUALIZACION: 'ACTUALIZACION',
    ELIMINACION: 'ELIMINACION',
    AUTORIZACION: 'AUTORIZACION',
    RECHAZO: 'RECHAZO',
    CAMBIO_ESTADO: 'CAMBIO_ESTADO'
  };

  static async log(entityId, userId, action, previousState, newState, metadata = {}) {
    return await prisma.auditLog.create({
      data: {
        entityId,
        userId,
        action,
        previousState: previousState ? JSON.stringify(previousState) : null,
        newState: newState ? JSON.stringify(newState) : null,
        metadata: JSON.stringify(metadata),
        ipAddress: metadata.ipAddress || null,
        userAgent: metadata.userAgent || null
      }
    });
  }

  static async logWithReq(entityId, userId, action, previousState, newState, req) {
    return await AuditService.log(entityId, userId, action, previousState, newState, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  }
}

module.exports = AuditService;
```

### 14.3 Uso en Controlador

```js
static async updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const previous = await EntityService.getById(id);
    const updated = await EntityService.updateStatus(id, status, req.user);

    // Auditoría
    await audit.logWithReq(
      id,
      req.user.id,
      audit.ACCIONES.CAMBIO_ESTADO,
      { status: previous.status },
      { status: updated.status },
      req
    );

    res.json({ data: updated, message: 'Estado actualizado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
```

---

## 15. EJEMPLOS COMPLETOS

### 15.1 GET — Listar Entidades

**Request:**
```
GET /api/entities?status=active&search=Juan&skip=0&take=20&orderBy=createdAt:desc
```

**Controller:**
```js
static async list(req, res) {
  try {
    const filters = req.query;
    const result = await EntityService.list(filters, req.user);
    res.json(result);
  } catch (error) {
    console.error('Error al listar entidades:', error);
    res.status(500).json({ error: error.message });
  }
}
```

**Service:**
```js
static async list(filters = {}, user) {
  const where = {};

  // Scoping
  if (user.role !== 'ADMIN' && user.role !== 'RH') {
    where.departmentId = user.employeeDepartmentId;
  }

  // Filtros
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  // Paginación
  const skip = parseInt(filters.skip) || 0;
  const take = Math.min(parseInt(filters.take) || 50, 100);

  // Ordenamiento
  let orderBy = { createdAt: 'desc' };
  if (filters.orderBy) {
    const [field, dir] = filters.orderBy.split(':');
    orderBy = { [field]: dir || 'asc' };
  }

  const [data, total] = await Promise.all([
    prisma.entity.findMany({ where, skip, take, orderBy, include: { department: true } }),
    prisma.entity.count({ where })
  ]);

  return { data, pagination: { total, skip, take, hasMore: skip + take < total } };
}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "1",
      "name": "Juan Pérez",
      "email": "juan@kram.com",
      "status": "active",
      "department": { "id": "1", "name": "Sistemas" }
    }
  ],
  "pagination": {
    "total": 45,
    "skip": 0,
    "take": 20,
    "hasMore": true
  }
}
```

### 15.2 GET — Obtener por ID

**Request:**
```
GET /api/entities/abc-123
```

**Controller:**
```js
static async getById(req, res) {
  try {
    const { id } = req.params;
    const data = await EntityService.getById(id);
    if (!data) return res.status(404).json({ error: 'Entidad no encontrada' });
    res.json({ data });
  } catch (error) {
    console.error('Error al obtener entidad:', error);
    res.status(500).json({ error: error.message });
  }
}
```

**Response (200):**
```json
{
  "data": {
    "id": "abc-123",
    "name": "Juan Pérez",
    "email": "juan@kram.com",
    "status": "active",
    "department": { "id": "1", "name": "Sistemas" },
    "createdAt": "2026-06-24T10:00:00.000Z"
  }
}
```

**Response (404):**
```json
{
  "error": "Entidad no encontrada"
}
```

### 15.3 POST — Crear Entidad

**Request:**
```
POST /api/entities
Content-Type: application/json

{
  "name": "Nueva Entidad",
  "email": "nueva@kram.com",
  "departmentId": "dept-1"
}
```

**Controller:**
```js
static async create(req, res) {
  try {
    const { name, email, departmentId } = req.body;

    // Validación de request
    if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
    if (!email) return res.status(400).json({ error: 'El email es requerido' });

    const data = await EntityService.create({ name, email, departmentId }, req.user);
    res.status(201).json({ data, message: 'Creado exitosamente' });
  } catch (error) {
    console.error('Error al crear entidad:', error);
    res.status(400).json({ error: error.message });
  }
}
```

**Response (201):**
```json
{
  "data": {
    "id": "new-abc-456",
    "name": "Nueva Entidad",
    "email": "nueva@kram.com",
    "status": "active",
    "departmentId": "dept-1"
  },
  "message": "Creado exitosamente"
}
```

**Response (400):**
```json
{
  "error": "El nombre es requerido"
}
```

### 15.4 PUT — Actualizar Entidad

**Request:**
```
PUT /api/entities/abc-123
Content-Type: application/json

{
  "name": "Nombre Actualizado",
  "status": "inactive"
}
```

**Controller:**
```js
static async update(req, res) {
  try {
    const { id } = req.params;
    const data = await EntityService.update(id, req.body, req.user);
    if (!data) return res.status(404).json({ error: 'Entidad no encontrada' });
    res.json({ data, message: 'Actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar entidad:', error);
    res.status(400).json({ error: error.message });
  }
}
```

**Response (200):**
```json
{
  "data": {
    "id": "abc-123",
    "name": "Nombre Actualizado",
    "status": "inactive"
  },
  "message": "Actualizado exitosamente"
}
```

### 15.5 DELETE — Eliminar Entidad

**Request:**
```
DELETE /api/entities/abc-123
```

**Controller:**
```js
static async delete(req, res) {
  try {
    const { id } = req.params;
    await EntityService.delete(id, req.user);
    res.json({ message: 'Eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar entidad:', error);
    res.status(400).json({ error: error.message });
  }
}
```

**Response (200):**
```json
{
  "message": "Eliminado exitosamente"
}
```

---

## 16. CONVENCIÓN DE RUTAS

### 16.1 Nombres de Rutas

| Método | Ruta | Acción |
|--------|------|--------|
| GET | `/api/entities` | Listar (con filtros, paginación) |
| GET | `/api/entities/:id` | Obtener por ID |
| POST | `/api/entities` | Crear |
| PUT | `/api/entities/:id` | Actualizar |
| DELETE | `/api/entities/:id` | Eliminar |
| GET | `/api/entities/:id/items` | Listar sub-recursos |
| POST | `/api/entities/:id/items` | Crear sub-recurso |

### 16.2 Archivo de Rutas

```js
// routes/entity.routes.js
const express = require('express');
const router = express.Router();
const EntityController = require('../controllers/entity.controller');
const { verifyToken, requireModule } = require('../middlewares/auth.middleware');

// Rutas públicas (solo autenticación)
router.get('/entities', verifyToken, EntityController.list);
router.get('/entities/:id', verifyToken, EntityController.getById);

// Rutas protegidas por módulo
router.post('/entities', verifyToken, requireModule('MODULO'), EntityController.create);
router.put('/entities/:id', verifyToken, requireModule('MODULO'), EntityController.update);
router.delete('/entities/:id', verifyToken, requireModule('MODULO'), EntityController.delete);

module.exports = router;
```

---

## 17. REFERENCIAS

| Archivo | Propósito |
|---------|-----------|
| `backend/src/controllers/stationery.controller.js` | Ejemplo real de controlador delgado (133 líneas) |
| `backend/src/controllers/purchase.controller.js` | Ejemplo real de controlador con auditoría (864 líneas) |
| `backend/src/services/purchases/stationery.service.js` | Ejemplo real de servicio especializado |
| `backend/src/services/audit.service.js` | Servicio de auditoría |
| `backend/src/routes/stationery.routes.js` | Ejemplo real de rutas con middlewares |
| `docs/STANDARDS.md` | Estándares de código y patrones detallados |
| `.clinerules` | Reglas maestras del sistema |

---

*Fin del documento — Guía de APIs REST ERP KRAM*
