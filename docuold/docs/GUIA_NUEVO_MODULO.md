# GUÍA PARA IMPLEMENTAR UN NUEVO MÓDULO — ERP KRAM

> **Documento:** `docs/GUIA_NUEVO_MODULO.md`
> **Versión:** 1.0
> **Propósito:** Procedimiento oficial paso a paso para crear un módulo nuevo en el ERP KRAM.

---

## ÍNDICE

1. [Visión General](#1-visión-general)
2. [Checklist Completo](#2-checklist-completo)
3. [Paso a Paso Detallado](#3-paso-a-paso-detallado)
4. [Ejemplo: Módulo "INVENTARIOS"](#4-ejemplo-módulo-inventarios)
5. [Referencias Rápidas](#5-referencias-rápidas)

---

## 1. VISIÓN GENERAL

Agregar un nuevo módulo al ERP KRAM requiere tocar **9 capas** del sistema:

```
 1. Prisma Schema    → Enum + migración BD
 2. Config Backend   → modules.config.js
 3. Presets Backend  → roles.config.js
 4. Servicios        → Lógica de negocio
 5. Controladores    → Endpoints REST
 6. Rutas Express    → Router + registro en index.js
 7. API Frontend     → api.js (cliente Axios)
 8. Páginas Next.js  → app/<modulo>/ (páginas + layout)
 9. Sidebar          → DashboardLayout.js
10. Documentación    → .clinerules + docs
```

**Tiempo estimado:** 2-4 horas para un módulo CRUD básico.

---

## 2. CHECKLIST COMPLETO

```
FASE 1 — BACKEND (Prisma + Config)
□ 1.1 Agregar valor al enum ModuleType en schema.prisma
□ 1.2 Ejecutar migración Prisma
□ 1.3 Agregar módulo en modules.config.js
□ 1.4 Agregar preset en roles.config.js (opcional)

FASE 2 — BACKEND (Lógica de negocio)
□ 2.1 Crear servicio(s) en backend/src/services/<modulo>/
□ 2.2 Crear controlador en backend/src/controllers/
□ 2.3 Crear archivo de rutas en backend/src/routes/
□ 2.4 Registrar rutas en backend/src/index.js

FASE 3 — FRONTEND (API y UI)
□ 3.1 Registrar APIs en frontend/lib/api.js
□ 3.2 Crear páginas Next.js en frontend/app/<modulo>/
□ 3.3 Agregar entradas en DashboardLayout.js (sidebar)
□ 3.4 Proteger rutas con ProtectedRoute (opcional)

FASE 4 — DOCUMENTACIÓN Y DEPLOY
□ 4.1 Actualizar .clinerules (tabla de módulos)
□ 4.2 Actualizar docs/ARQUITECTURA_KRAM.md
□ 4.3 Actualizar docs/FLUJOS_DE_NEGOCIO.md
□ 4.4 Asignar módulo desde UI de Gestión de Accesos
□ 4.5 Rebuild y deploy
```

---

## 3. PASO A PASO DETALLADO

### FASE 1 — BACKEND (Prisma + Config)

#### □ 1.1 Agregar valor al enum `ModuleType` en `schema.prisma`

**Archivo:** `backend/prisma/schema.prisma`

Localizar el enum `ModuleType` (línea ~352) y agregar el nuevo valor:

```prisma
enum ModuleType {
  EMPLEADOS
  RECLUTAMIENTO
  VACACIONES
  INCIDENCIAS
  CONFIGURACION
  DASHBOARD
  REPORTES
  COMPRAS
  NUEVO_MODULO      // ← Agregar aquí
}
```

> **Regla:** Usar mayúsculas y guiones bajos. El orden no importa.

#### □ 1.2 Ejecutar migración Prisma

```bash
cd backend
npx prisma migrate dev --name add_nuevo_modulo
```

Esto genera la migración SQL y actualiza el cliente Prisma.

> Si el entorno es producción, usar `npx prisma migrate deploy` después de verificar la migración.

#### □ 1.3 Agregar módulo en `modules.config.js`

**Archivo:** `backend/src/config/modules.config.js`

Agregar una nueva entrada al objeto `MODULES_CONFIG`:

```js
const MODULES_CONFIG = {
  // ... módulos existentes ...
  NUEVO_MODULO: {
    key: 'NUEVO_MODULO',
    label: 'Nombre Visible',
    description: 'Descripción del módulo',
    enabled: true
  }
};
```

> **Automático:** El endpoint `GET /api/modules` y `GET /api/permissions/modules` ya incluirán este módulo sin cambios adicionales.

#### □ 1.4 Agregar preset en `roles.config.js` (opcional)

**Archivo:** `backend/src/config/roles.config.js`

Si se desea que ciertos roles tengan el módulo por defecto, agregarlo al preset:

```js
const ROLES_PRESETS = {
  ADMIN: [
    'DASHBOARD',
    // ... otros módulos ...
    'NUEVO_MODULO'       // ← Agregar aquí
  ],
  // Otros roles...
};
```

> **Nota:** Los módulos también se pueden asignar manualmente desde la UI de Gestión de Accesos, sin necesidad de modificar presets.

---

### FASE 2 — BACKEND (Lógica de negocio)

#### □ 2.1 Crear servicio(s)

**Directorio:** `backend/src/services/<modulo>/`

Crear uno o más archivos de servicio con la lógica de negocio:

```js
// backend/src/services/nuevo-modulo/nuevo-modulo.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NuevoModuloService {
  static async getAll(user) {
    // Lógica de negocio con scoping (Nivel B)
    if (user.role === 'ADMIN' || user.role === 'RH') {
      // Bypass: ve todo
    }
    // Aplicar filtros según jerarquía
    return prisma.nuevoModel.findMany({ ... });
  }

  static async create(userId, data) {
    return prisma.nuevoModel.create({ data: { ...data, userId } });
  }

  // ... más métodos
}

module.exports = NuevoModuloService;
```

> **Patrón:** Los servicios se encargan de toda la lógica de negocio. Los controladores solo manejan request/response y auditoría.

#### □ 2.2 Crear controlador

**Archivo:** `backend/src/controllers/nuevo-modulo.controller.js`

```js
const NuevoModuloService = require('../services/nuevo-modulo/nuevo-modulo.service');

class NuevoModuloController {
  static async getAll(req, res) {
    try {
      const data = await NuevoModuloService.getAll(req.user);
      res.json({ data });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al obtener datos' });
    }
  }

  static async create(req, res) {
    try {
      const result = await NuevoModuloService.create(req.user.id, req.body);
      res.status(201).json({ message: 'Creado exitosamente', data: result });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear' });
    }
  }

  // ... más métodos
}

module.exports = NuevoModuloController;
```

#### □ 2.3 Crear archivo de rutas

**Archivo:** `backend/src/routes/nuevo-modulo.routes.js`

```js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const NuevoModuloController = require('../controllers/nuevo-modulo.controller');

// Proteger todas las rutas con autenticación
router.use(authMiddleware.verifyToken);

// Proteger con módulo (Nivel A)
router.get('/nuevo-modulo',
  authMiddleware.requireModule('NUEVO_MODULO'),
  NuevoModuloController.getAll
);

router.post('/nuevo-modulo',
  authMiddleware.requireModule('NUEVO_MODULO'),
  NuevoModuloController.create
);

// ... más rutas

module.exports = router;
```

> **Importante:** Usar `authMiddleware.requireModule('NUEVO_MODULO')` para proteger endpoints. NO usar validaciones de rol hardcodeadas.

#### □ 2.4 Registrar rutas en `index.js`

**Archivo:** `backend/src/index.js`

Agregar el require y el app.use:

```js
// Al inicio del archivo, con los demás requires
const nuevoModuloRoutes = require('./routes/nuevo-modulo.routes');

// En la sección de rutas, con las demás
app.use('/api', nuevoModuloRoutes);
```

---

### FASE 3 — FRONTEND (API y UI)

#### □ 3.1 Registrar APIs en `api.js`

**Archivo:** `frontend/lib/api.js`

Agregar un nuevo objeto de API:

```js
// Módulo de Nuevo Módulo
export const nuevoModuloApi = {
  getAll: (params) => api.get('/nuevo-modulo', { params }),
  getById: (id) => api.get(`/nuevo-modulo/${id}`),
  create: (data) => api.post('/nuevo-modulo', data),
  update: (id, data) => api.put(`/nuevo-modulo/${id}`, data),
  delete: (id) => api.delete(`/nuevo-modulo/${id}`),
};
```

#### □ 3.2 Crear páginas Next.js

**Directorio:** `frontend/app/<modulo>/`

Estructura típica:

```
frontend/app/nuevo-modulo/
├── page.js              → Listado principal
├── crear/
│   └── page.js          → Formulario de creación
└── [id]/
    ├── page.js          → Detalle/edición
    └── editar/
        └── page.js      → Formulario de edición
```

Ejemplo de página listado:

```jsx
'use client'
import { useState, useEffect } from 'react'
import { nuevoModuloApi } from '@/lib/api'

export default function NuevoModuloPage() {
  const [data, setData] = useState([])

  useEffect(() => {
    nuevoModuloApi.getAll().then(res => setData(res.data.data))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold">Nuevo Módulo</h1>
      {/* Renderizar datos */}
    </div>
  )
}
```

#### □ 3.3 Agregar entradas en `DashboardLayout.js` (sidebar)

**Archivo:** `frontend/components/DashboardLayout.js`

Agregar en la sección correspondiente del sidebar:

```js
// En "Mi Portal" (autoservicio)
const myPortalNavigation = [
  // ... existentes ...
  { name: 'Mi Módulo', href: '/nuevo-modulo', icon: '📦', module: 'NUEVO_MODULO' },
]

// En "Administración Global" (gestión)
const adminNavigation = [
  // ... existentes ...
  { name: 'Gestión de Módulo', href: '/dashboard/nuevo-modulo', icon: '📊', module: 'NUEVO_MODULO', roles: ['ADMIN', 'RH'] },
]
```

> **Filtrado automático:** El sidebar ya filtra por `user.accessibleModules?.includes(item.module)`. No se necesita código adicional.

#### □ 3.4 Proteger rutas con `ProtectedRoute` (opcional)

**Archivo:** `frontend/app/nuevo-modulo/page.js`

```jsx
import ProtectedRoute from '@/components/ProtectedRoute'

export default function Page() {
  return (
    <ProtectedRoute requiredModule="NUEVO_MODULO">
      <Contenido />
    </ProtectedRoute>
  )
}
```

---

### FASE 4 — DOCUMENTACIÓN Y DEPLOY

#### □ 4.1 Actualizar `.clinerules`

Agregar el nuevo módulo a la tabla de módulos del sistema:

```markdown
| `NUEVO_MODULO` | Nombre Visible | Descripción del módulo |
```

#### □ 4.2 Actualizar `docs/ARQUITECTURA_KRAM.md`

Agregar el módulo en la sección de inventario de módulos.

#### □ 4.3 Actualizar `docs/FLUJOS_DE_NEGOCIO.md`

Agregar el flujo de negocio del nuevo módulo si aplica.

#### □ 4.4 Asignar módulo desde UI

1. Ir a **Gestión de Accesos** (`/dashboard/accesos`)
2. Seleccionar el usuario
3. Marcar el nuevo módulo en la lista
4. Guardar

> El módulo aparecerá automáticamente en la UI porque el endpoint `GET /api/permissions/modules` lo incluye desde `modules.config.js`.

#### □ 4.5 Rebuild y deploy

```bash
# Backend
cd backend
npm run build    # si aplica
pm2 restart all  # o systemctl restart kram-backend

# Frontend
cd frontend
npm run build
pm2 restart kram-frontend  # o similar
```

---

## 4. EJEMPLO: MÓDULO "INVENTARIOS"

A continuación, un ejemplo concreto de cómo implementar un módulo de **Inventarios**.

### 4.1 Prisma Schema

```prisma
// Agregar al enum ModuleType
enum ModuleType {
  EMPLEADOS
  RECLUTAMIENTO
  VACACIONES
  INCIDENCIAS
  CONFIGURACION
  DASHBOARD
  REPORTES
  COMPRAS
  INVENTARIOS        // ← Nuevo
}

// Nuevo modelo (opcional, según necesidades)
model InventoryItem {
  id          String   @id @default(cuid())
  codigo      String   @unique
  nombre      String
  descripcion String?
  cantidad    Int      @default(0)
  precioUnit  Float?
  ubicacion   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("inventory_items")
}
```

### 4.2 modules.config.js

```js
INVENTARIOS: {
  key: 'INVENTARIOS',
  label: 'Inventarios',
  description: 'Gestión de inventarios y almacén',
  enabled: true
}
```

### 4.3 roles.config.js (presets)

```js
ADMIN: [
  // ... existentes ...
  'INVENTARIOS'
],
COMPRAS: [
  // ... existentes ...
  'INVENTARIOS'
]
```

### 4.4 Backend — Servicio

```js
// backend/src/services/inventory/inventory.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class InventoryService {
  static async getAll(user) {
    // ADMIN/RH bypass
    if (user.role === 'ADMIN' || user.role === 'RH') {
      return prisma.inventoryItem.findMany({ orderBy: { nombre: 'asc' } });
    }
    // Scoping por departamento (Nivel B)
    const employee = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (employee?.departamento_id) {
      return prisma.inventoryItem.findMany({
        where: { ubicacion: employee.departamento_id },
        orderBy: { nombre: 'asc' }
      });
    }
    return [];
  }

  static async create(data) {
    return prisma.inventoryItem.create({ data });
  }

  static async update(id, data) {
    return prisma.inventoryItem.update({ where: { id }, data });
  }

  static async delete(id) {
    return prisma.inventoryItem.delete({ where: { id } });
  }
}

module.exports = InventoryService;
```

### 4.5 Backend — Controlador

```js
// backend/src/controllers/inventory.controller.js
const InventoryService = require('../services/inventory/inventory.service');

class InventoryController {
  static async getAll(req, res) {
    try {
      const items = await InventoryService.getAll(req.user);
      res.json({ items });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al obtener inventario' });
    }
  }

  static async create(req, res) {
    try {
      const item = await InventoryService.create(req.body);
      res.status(201).json({ message: 'Artículo creado', item });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear artículo' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const item = await InventoryService.update(id, req.body);
      res.json({ message: 'Artículo actualizado', item });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar artículo' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await InventoryService.delete(id);
      res.json({ message: 'Artículo eliminado' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar artículo' });
    }
  }
}

module.exports = InventoryController;
```

### 4.6 Backend — Rutas

```js
// backend/src/routes/inventory.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const InventoryController = require('../controllers/inventory.controller');

router.use(authMiddleware.verifyToken);

router.get('/inventory',
  authMiddleware.requireModule('INVENTARIOS'),
  InventoryController.getAll
);

router.post('/inventory',
  authMiddleware.requireModule('INVENTARIOS'),
  InventoryController.create
);

router.put('/inventory/:id',
  authMiddleware.requireModule('INVENTARIOS'),
  InventoryController.update
);

router.delete('/inventory/:id',
  authMiddleware.requireModule('INVENTARIOS'),
  InventoryController.delete
);

module.exports = router;
```

### 4.7 Backend — index.js

```js
// Agregar al inicio
const inventoryRoutes = require('./routes/inventory.routes');

// Agregar en la sección de rutas
app.use('/api', inventoryRoutes);
```

### 4.8 Frontend — api.js

```js
// Módulo de Inventarios
export const inventoryApi = {
  getAll: (params) => api.get('/inventory', { params }),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
};
```

### 4.9 Frontend — Páginas

```jsx
// frontend/app/inventarios/page.js
'use client'
import { useState, useEffect } from 'react'
import { inventoryApi } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function InventariosPage() {
  const [items, setItems] = useState([])

  useEffect(() => {
    inventoryApi.getAll().then(res => setItems(res.data.items))
  }, [])

  return (
    <ProtectedRoute requiredModule="INVENTARIOS">
      <div>
        <h1 className="text-2xl font-bold mb-4">Inventarios</h1>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td className="border px-4 py-2">{item.codigo}</td>
                <td className="border px-4 py-2">{item.nombre}</td>
                <td className="border px-4 py-2">{item.cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProtectedRoute>
  )
}
```

### 4.10 Frontend — Sidebar

```js
// En myPortalNavigation
{ name: 'Inventarios', href: '/inventarios', icon: '📦', module: 'INVENTARIOS' },

// En adminNavigation
{ name: 'Gestión de Inventarios', href: '/dashboard/inventarios', icon: '📊', module: 'INVENTARIOS', roles: ['ADMIN', 'COMPRAS'] },
```

---

## 5. REFERENCIAS RÁPIDAS

### 5.1 Archivos que DEBEN modificarse

| # | Archivo | Acción |
|---|---------|--------|
| 1 | `backend/prisma/schema.prisma` | Agregar al enum `ModuleType` |
| 2 | `backend/src/config/modules.config.js` | Agregar objeto del módulo |
| 3 | `backend/src/config/roles.config.js` | Agregar a presets (opcional) |
| 4 | `backend/src/services/<modulo>/` | Crear servicio(s) |
| 5 | `backend/src/controllers/<modulo>.controller.js` | Crear controlador |
| 6 | `backend/src/routes/<modulo>.routes.js` | Crear rutas |
| 7 | `backend/src/index.js` | Registrar rutas |
| 8 | `frontend/lib/api.js` | Agregar APIs |
| 9 | `frontend/app/<modulo>/` | Crear páginas |
| 10 | `frontend/components/DashboardLayout.js` | Agregar sidebar |
| 11 | `.clinerules` | Actualizar tabla de módulos |

### 5.2 Archivos que NO requieren modificación

| Archivo | Motivo |
|---------|--------|
| `backend/src/middlewares/auth.middleware.js` | `requireModule()` ya es genérico |
| `backend/src/controllers/permission.controller.js` | Usa `getModulesArray()` automáticamente |
| `backend/src/routes/roles.routes.js` | `GET /api/modules` es dinámico |
| `frontend/app/dashboard/accesos/page.js` | Consume `GET /api/permissions/modules` |
| `frontend/lib/rolesConfig.js` | Solo configura roles, no módulos |

### 5.3 Reglas de Validación (recordatorio)

| Nivel | Mecanismo | Dónde |
|-------|-----------|-------|
| **A** — Acceso a módulo | `requireModule('NUEVO_MODULO')` | Backend (rutas) |
| **A** — Acceso a módulo | `user.accessibleModules?.includes('NUEVO_MODULO')` | Frontend (sidebar, ProtectedRoute) |
| **B** — Scoping de datos | Lógica en servicio según jerarquía | Backend (servicios) |
| **C** — Operaciones críticas | `requireRole(['ADMIN'])` | Backend (rutas, solo ADMIN) |

### 5.4 Comandos Útiles

```bash
# Migración Prisma
cd backend
npx prisma migrate dev --name add_nuevo_modulo
npx prisma generate

# Build frontend
cd frontend
npm run build

# Verificar migraciones pendientes
cd backend
npx prisma migrate status
```

---

*Fin del documento — Guía para Implementar un Nuevo Módulo*
