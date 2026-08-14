# Estándares de Código — ERP KRAM

**Última actualización**: 24/06/2026  
**Versión**: 1.0  
**Propósito**: Documentar ejemplos detallados, convenciones de nombres, patrones reutilizables y buenas prácticas. Este documento complementa al `.clinerules` (principios generales) con ejemplos concretos.

---

## 1. Convenciones de Nombres

### 1.1 Backend (Node.js/Express)

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Archivos de rutas | `snake-case.routes.js` | `purchase-order.routes.js` |
| Archivos de controladores | `snake-case.controller.js` | `purchase-order.controller.js` |
| Archivos de servicios | `snake-case.service.js` | `purchase-order.service.js` |
| Clases controladoras | `PascalCase + Controller` | `PurchaseOrderController` |
| Clases de servicios | `PascalCase + Service` | `PurchaseOrderService` |
| Métodos estáticos | `camelCase` | `create`, `getById`, `list` |
| Variables | `camelCase` | `purchaseOrder`, `totalAmount` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_ITEMS`, `DEFAULT_STATUS` |

### 1.2 Frontend (Next.js/React)

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Archivos de página | `page.js` | `page.js` (Next.js App Router) |
| Directorios de ruta | `snake-case` | `/mis-solicitudes/[id]/` |
| Componentes React | `PascalCase.js` | `PurchaseOrderModal.js` |
| Hooks personalizados | `camelCase` con prefijo `use` | `useAuth`, `useEmployees` |
| Contextos | `PascalCase + Context` | `AuthContext` |
| Proveedores | `PascalCase + Provider` | `AuthProvider` |
| Clientes API | `camelCase` | `stationeryApi`, `uniformApi` |

---

## 2. Estructura de Archivos

### 2.1 Backend — Controlador

```js
// backend/src/controllers/entity.controller.js
const EntityService = require('../services/entity.service');

class EntityController {
  // Listar todos (con filtros)
  static async list(req, res) {
    try {
      const filters = req.query;
      const data = await EntityService.list(filters);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await EntityService.getById(id);
      if (!data) return res.status(404).json({ error: 'No encontrado' });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Crear
  static async create(req, res) {
    try {
      const data = await EntityService.create(req.body, req.user);
      res.status(201).json({ data, message: 'Creado exitosamente' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Actualizar
  static async update(req, res) {
    try {
      const { id } = req.params;
      const data = await EntityService.update(id, req.body, req.user);
      if (!data) return res.status(404).json({ error: 'No encontrado' });
      res.json({ data, message: 'Actualizado exitosamente' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Eliminar (borrado lógico)
  static async delete(req, res) {
    try {
      const { id } = req.params;
      await EntityService.delete(id, req.user);
      res.json({ message: 'Eliminado exitosamente' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = EntityController;
```

### 2.2 Backend — Servicio

```js
// backend/src/services/entity.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class EntityService {
  static async list(filters = {}) {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.departmentId) where.departmentId = filters.departmentId;

    return await prisma.entity.findMany({
      where,
      include: { relatedModel: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getById(id) {
    return await prisma.entity.findUnique({
      where: { id },
      include: { relatedModel: true }
    });
  }

  static async create(data, user) {
    // Validaciones de negocio
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
      data: {
        ...data,
        updatedBy: user.id
      }
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

### 2.3 Backend — Rutas

```js
// backend/src/routes/entity.routes.js
const express = require('express');
const router = express.Router();
const EntityController = require('../controllers/entity.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireModule } = require('../middlewares/auth.middleware');

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

## 3. Patrones React

### 3.1 Componente con 'use client'

```jsx
'use client';

import { useState, useEffect } from 'react';
import { entityApi } from '@/lib/api';

export default function EntityList() {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEntities();
  }, []);

  async function loadEntities() {
    try {
      setLoading(true);
      const { data } = await entityApi.list();
      setEntities(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-4">Cargando...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Listado</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {entities.map(entity => (
            <tr key={entity.id} className="border-t hover:bg-gray-50">
              <td className="p-2">{entity.name}</td>
              <td className="p-2">{entity.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 3.2 Custom Hook

```js
// frontend/hooks/useEntities.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { entityApi } from '@/lib/api';

export function useEntities(filters = {}) {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await entityApi.list(filters);
      setEntities(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    load();
  }, [load]);

  return { entities, loading, error, reload: load };
}
```

### 3.3 Página Delgada

```jsx
// frontend/app/entities/page.js
'use client';

import { useEntities } from '@/hooks/useEntities';
import EntityTable from '@/components/EntityTable';
import DashboardLayout from '@/components/DashboardLayout';

export default function EntitiesPage() {
  const { entities, loading, error } = useEntities();

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Entidades</h1>
        <EntityTable entities={entities} loading={loading} error={error} />
      </div>
    </DashboardLayout>
  );
}
```

---

## 4. Patrones Prisma

### 4.1 Modelo con Borrado Lógico

```prisma
model Entity {
  id        String   @id @default(cuid())
  name      String
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?
  updatedBy String?
  deletedBy String?
}
```

### 4.2 Consultas con Filtros Dinámicos

```js
static async list(filters = {}, user) {
  const where = {};

  // Scoping de datos (Nivel B)
  if (user.role !== 'ADMIN' && user.role !== 'RH') {
    where.departmentId = user.employeeDepartmentId;
  }

  // Filtros opcionales
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } }
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
```

### 4.3 Transacciones

```js
static async createWithItems(data, user) {
  return await prisma.$transaction(async (tx) => {
    // Crear entidad principal
    const entity = await tx.entity.create({
      data: {
        name: data.name,
        createdBy: user.id
      }
    });

    // Crear items relacionados
    for (const item of data.items) {
      await tx.entityItem.create({
        data: {
          entityId: entity.id,
          product: item.product,
          quantity: item.quantity
        }
      });
    }

    return entity;
  });
}
```

---

## 5. Patrones de API Client

### 5.1 Cliente API Modular

```js
// frontend/lib/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para token JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Módulos API
export const entityApi = {
  list: (params) => api.get('/entities', { params }),
  getById: (id) => api.get(`/entities/${id}`),
  create: (data) => api.post('/entities', data),
  update: (id, data) => api.put(`/entities/${id}`, data),
  delete: (id) => api.delete(`/entities/${id}`),
};

export default api;
```

---

## 6. Manejo de Fechas

### 6.1 Formateo Seguro (Frontend)

```js
// utils/dateUtils.js

/**
 * Convierte una fecha ISO del backend a DD/MM/YYYY
 * Evita el "bug del día anterior" extrayendo la fecha sin zona horaria
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  const datePart = isoString.substring(0, 10); // "2026-06-24"
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Convierte una fecha ISO a objeto Date de forma segura
 */
export function safeParseDate(isoString) {
  if (!isoString) return null;
  const [datePart] = isoString.split('T');
  const [year, month, day] = datePart.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}
```

---

## 7. Patrones de Seguridad

### 7.1 Validación de Acceso en Backend

```js
// ✅ Nivel A: Control de acceso a módulos
router.get('/entities', verifyToken, requireModule('ENTITIES'), controller.list);

// ✅ Nivel B: Scoping de datos en servicio
static async list(filters, user) {
  const where = {};
  if (user.role !== 'ADMIN' && user.role !== 'RH') {
    where.createdById = user.employeeId;
  }
  return await prisma.entity.findMany({ where });
}

// ✅ Nivel C: Operaciones críticas (solo ADMIN)
router.delete('/entities/:id', verifyToken, requireRole(['ADMIN']), controller.delete);
```

### 7.2 Validación de Acceso en Frontend

```jsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProtectedPage({ requiredModule, children }) {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    router.push('/login');
    return null;
  }

  // Bypass para ADMIN y RH
  if (user.role === 'ADMIN' || user.role === 'RH') {
    return children;
  }

  // Validación por módulo
  if (!user.accessibleModules?.includes(requiredModule)) {
    router.push('/dashboard');
    return null;
  }

  return children;
}
```

---

## 8. Buenas Prácticas de Imports

### 8.1 Backend

```js
// Módulos del sistema
const express = require('express');
const { PrismaClient } = require('@prisma/client');

// Middlewares
const { verifyToken, requireModule } = require('../middlewares/auth.middleware');

// Controladores
const EntityController = require('../controllers/entity.controller');

// Servicios
const EntityService = require('../services/entity.service');

// Configuración
const { COMPANY_CONFIG } = require('../config/company.config');
```

### 8.2 Frontend

```jsx
// Hooks de React
'use client';
import { useState, useEffect, useCallback } from 'react';

// Contextos
import { useAuth } from '@/contexts/AuthContext';

// Hooks personalizados
import { useEntities } from '@/hooks/useEntities';

// Componentes
import DashboardLayout from '@/components/DashboardLayout';
import EntityTable from '@/components/EntityTable';

// API
import { entityApi } from '@/lib/api';

// Utilidades
import { formatDate } from '@/utils/dateUtils';

// Constantes
import { ROLES } from '@/constants/roles';
```

---

## 9. Patrón de DTOs (Data Transfer Objects)

### 9.1 Backend — Sanitización de Respuestas

```js
// utils/dto.js

/**
 * Sanitiza un empleado para respuesta API (oculta campos sensibles)
 */
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

// Uso en controlador
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

## 10. Resumen de Archivos de Referencia

| Archivo | Propósito |
|---------|-----------|
| `backend/src/controllers/stationery.controller.js` | Ejemplo de controlador delgado (133 líneas) |
| `backend/src/services/purchases/stationery.service.js` | Ejemplo de servicio especializado (167 líneas) |
| `backend/src/routes/stationery.routes.js` | Ejemplo de rutas con orden correcto (67 líneas) |
| `frontend/hooks/useAuth.js` | Ejemplo de custom hook con contexto |
| `frontend/lib/api.js` | Ejemplo de cliente API modular |
| `frontend/components/DashboardLayout.js` | Ejemplo de layout con sidebar y navegación |

---

*Fin del documento — Estándares de Código ERP KRAM*
