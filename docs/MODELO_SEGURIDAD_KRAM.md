# MODELO DE SEGURIDAD — ERP KRAM

> **Documento generado:** 13/06/2026
> **Versión:** 1.0
> **Propósito:** Referencia ejecutiva y técnica del modelo de autorización del ERP KRAM.
> **Audiencia:** Desarrolladores, Dirección General, Administradores del sistema.

---

## 1. Objetivo del Modelo

Establecer un marco de seguridad escalable y configurable que permita controlar el acceso a la información y funcionalidades del ERP KRAM, garantizando que cada usuario acceda únicamente a los recursos que necesita para desempeñar su función, sin depender de validaciones rígidas atadas a roles fijos.

El modelo está diseñado para:

- **Separar la identidad del usuario** (su rol organizacional) de **lo que puede hacer** (sus módulos asignados).
- **Permitir personalización granular** de accesos sin modificar código.
- **Escalar** con nuevos roles y módulos sin reescribir la lógica de autorización.
- **Ser auditable**: cada decisión de acceso sigue reglas claras y documentadas.

---

## 2. Principios de Seguridad

### 2.1 Principios Fundamentales

| # | Principio | Descripción |
|---|-----------|-------------|
| 1 | **Mínimo privilegio** | Cada usuario tiene acceso solo a los módulos y datos necesarios para su función. |
| 2 | **Defensa en profundidad** | Tres niveles de validación (módulo → datos → operación crítica) antes de conceder acceso. |
| 3 | **Configurable, no hardcodeado** | Los permisos se asignan por usuario vía `accessibleModules`, no se hardcodean por rol. |
| 4 | **Bypass controlado** | Solo ADMIN y RH tienen bypass global, cada uno con responsabilidades distintas y documentadas. |
| 5 | **Separación de responsabilidades** | El rol identifica al usuario; los módulos definen su acceso. No se mezclan. |
| 6 | **Auditabilidad** | Toda operación crítica y cambio de permisos debe ser registrable. |

### 2.2 Regla de Oro

> **NUNCA** uses validaciones rígidas de roles (`user.role === 'SISTEMAS'`) para ocultar/mostrar módulos en el Frontend o bloquear rutas en el Backend, **a menos que sea ADMIN o RH**.
>
> **SIEMPRE** utiliza el array `user.accessibleModules` para control de acceso a módulos de usuarios regulares.

### 2.3 Lo que NUNCA se debe hacer

```js
// ❌ MAL: Hardcodear roles NO estratégicos para acceso a módulos
if (user.role === 'SISTEMAS') { ... }
if (['SISTEMAS', 'COMPRAS'].includes(user.role)) { ... }

// ❌ MAL: Hardcodear roles en el frontend para redirigir
if (['SISTEMAS', 'COMPRAS'].includes(user.role)) {
  router.push('/rh/dashboard-completo');
}

// ✅ BIEN: Bypass ADMIN/RH + accessibleModules para acceso a módulos
if (user.role === 'ADMIN' || user.role === 'RH') {
  // Acceso completo
} else if (user.accessibleModules?.includes('EMPLEADOS')) {
  // Acceso condicional
}
```

---

## 3. Roles Estratégicos

El ERP KRAM reconoce dos **Roles Estratégicos** con bypass global. Cada uno tiene responsabilidades distintas y complementarias.

| Rol | Tipo | Responsabilidad | Ámbito |
|-----|------|----------------|--------|
| **ADMIN** | Control técnico global | Administración del sistema, configuración técnica, operaciones críticas (Nivel C) | Todo el sistema |
| **RH** | Control operativo global autorizado por Dirección General | Gestión de personal, reclutamiento, configuración de accesos, supervisión operativa | Todos los módulos y datos |

### 3.1 Bypass Global

| Aspecto | ADMIN | RH |
|---------|-------|----|
| Acceso a módulos | ✅ Bypass total | ✅ Bypass total |
| Scoping de datos (visibilidad) | ✅ Bypass total | ✅ Bypass total |
| Operaciones críticas (Nivel C) | ✅ Acceso completo | ❌ Sin acceso (solo ADMIN) |

**Fundamento organizacional:** El rol RH representa la mano derecha operativa de Presidencia dentro de Comercializadora KRAM. Por decisión explícita de Dirección General, RH posee acceso global al sistema, al mismo nivel funcional que ADMIN, aunque con responsabilidades distintas.

### 3.2 Implementación del Bypass

```js
// ✅ BIEN: Bypass para ADMIN/RH en acceso a módulos
if (user.role === 'ADMIN' || user.role === 'RH') {
  // Tiene acceso completo, no verificar módulos
} else if (user.accessibleModules?.includes('EMPLEADOS')) { ... }

// ✅ BIEN: Bypass para ADMIN/RH en scoping de datos
if (user.role === 'ADMIN' || user.role === 'RH') {
  // Ve todos los datos, sin filtros de scoping
}
// Para otros roles, aplicar scoping por jerarquía/departamento

// ✅ BIEN: Solo ADMIN para operaciones críticas del sistema
if (req.user.role !== 'ADMIN') {
  return res.status(403).json({ error: 'Solo ADMIN puede modificar permisos' });
}
```

---

## 4. Niveles de Autorización

El modelo implementa una **Estrategia de 3 Niveles** (Tiered Access Control) que debe aplicarse en ese orden:

```
Solicitud de acceso
        │
        ▼
┌─────────────────────┐
│  Nivel A: Módulos   │ ← ¿Tiene el módulo? (o es ADMIN/RH)
│  (requireModule)    │
└─────────┬───────────┘
          │ pasa
          ▼
┌─────────────────────┐
│  Nivel B: Ownership │ ← ¿Es dueño del recurso? (o es ADMIN/RH)
│  (scoping/negocio)  │
└─────────┬───────────┘
          │ pasa
          ▼
┌─────────────────────┐
│  Nivel C: Críticas  │ ← ¿Es ADMIN? (solo para operaciones sensibles)
│  (requireRole)      │
└─────────┬───────────┘
          │ pasa
          ▼
     ✅ ACCESO CONCEDIDO
```

### 4.1 Nivel A — Control de Acceso a Módulos

**Propósito:** Determinar SI un usuario puede acceder a un módulo del sistema.

**Mecanismo:** `accessibleModules?.includes('MODULO')` + bypass ADMIN/RH.

**Cuándo se usa:**
- Ocultar/mostrar menús en el sidebar
- Proteger rutas del frontend
- Validar endpoints de lectura/escritura en el backend

**Ejemplo de pregunta:** "¿Este usuario puede ver el módulo de Empleados?"

**Implementación:**

```js
// Frontend: Proteger ruta
<ProtectedRoute requiredModule="EMPLEADOS">
  <EmpleadosPage />
</ProtectedRoute>

// Frontend: Ocultar menú
{user.accessibleModules?.includes('EMPLEADOS') && (
  <MenuItem name="Empleados" href="/rh/empleados" />
)}

// Backend: Proteger endpoint
router.get('/api/employees',
  AuthMiddleware.requireModule('EMPLEADOS'),
  EmployeeController.getAll
);
```

**Reglas:**
- ADMIN y RH tienen bypass: no necesitan verificar módulos.
- Para usuarios regulares, se valida contra `user.accessibleModules[]`.
- El array `accessibleModules` se carga desde la base de datos y se incluye en el JWT.

### 4.2 Nivel B — Ownership / Scoping de Datos

**Propósito:** Determinar QUÉ datos ve o modifica un usuario dentro de un módulo.

**Mecanismo:** Lógica de negocio (empleado asociado, departamento, nivel jerárquico) + bypass ADMIN/RH.

**Cuándo se usa:**
- Filtrar registros por propiedad (ej: "solo mis vacantes")
- Restringir visibilidad por jerarquía (ej: "jefe ve solo su departamento")
- Validar que un usuario pueda modificar un recurso específico

**Ejemplo de pregunta:** "¿Este jefe ve todos los empleados o solo los de su departamento?"

**Implementación:**

```js
// Backend: Scoping por solicitante
const employee = await prisma.employee.findUnique({ where: { userId } });

if (user.role === 'ADMIN' || user.role === 'RH') {
  // Sin filtros, ve todo
} else if (employee && employee.nivelJerarquico === 'GERENTE') {
  where.departamento_id = employee.departamento_id;
}

// Backend: Verificar propiedad
if (vacancy.solicitanteId !== employee.id) {
  return res.status(403).json({ error: 'No tienes acceso a esta vacante' });
}
```

**Reglas:**
- ADMIN y RH tienen bypass total en scoping: ven todos los datos.
- Para otros roles, aplicar filtros por `solicitanteId`, `departamento_id`, o nivel jerárquico.
- Verificar propiedad del recurso incluso después de pasar Nivel A.
- Usar `getOrCreateSolicitante(userId)` para buscar empleado por `userId`, no por rol.

### 4.3 Nivel C — Operaciones Críticas del Sistema

**Propósito:** Restringir operaciones sensibles que afectan la configuración del sistema.

**Mecanismo:** `requireRole(['ADMIN'])` o `req.user.role !== 'ADMIN'`.

**Cuándo se usa:**
- Modificar permisos de usuarios (asignar/quitar módulos)
- Crear, modificar o eliminar usuarios
- Estadísticas del sistema
- Operaciones destructivas (reset de base de datos, eliminación permanente)
- Gestión de roles personalizados

**Ejemplo de pregunta:** "¿Solo ADMIN puede cambiar los módulos de otro usuario?"

**Implementación:**

```js
// Backend: Proteger endpoint crítico
router.put('/api/permissions/users/:id',
  AuthMiddleware.requireRole(['ADMIN']),
  PermissionController.updateUserModules
);

// Backend: Validación inline
if (req.user.role !== 'ADMIN') {
  return res.status(403).json({ error: 'Solo ADMIN puede modificar permisos' });
}
```

**Reglas:**
- **Solo ADMIN** tiene acceso a operaciones de Nivel C.
- **RH NO tiene bypass** en operaciones de Nivel C.
- Usar `requireRole(['ADMIN'])` exclusivamente para este nivel.
- No mezclar Nivel C con Nivel A (un endpoint no debe requerir `requireModule` + `requireRole` para la misma validación).

---

## 5. Jerarquía Oficial de KRAM

La siguiente jerarquía refleja la estructura organizacional y de autorización del ERP KRAM:

```
                    ┌──────────────────────┐
                    │     PRESIDENCIA       │
                    │  (Dirección General)  │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    │
┌─────────────────┐  ┌─────────────────┐          │
│  ADMIN          │  │  RH             │          │
│  Control        │  │  Control        │          │
│  técnico global │  │  operativo      │          │
│  (Nivel C)      │  │  global         │          │
└────────┬────────┘  │  (autorizado    │          │
         │           │   por Dir.      │          │
         │           │   General)      │          │
         │           └────────┬────────┘          │
         │                    │                    │
         └────────┬───────────┘                    │
                  │                                │
                  ▼                                │
    ┌─────────────────────────────┐                │
    │   ROLES DEPARTAMENTALES     │                │
    │                             │                │
    │  ┌──────────┐ ┌──────────┐  │                │
    │  │ SISTEMAS │ │ COMPRAS  │  │                │
    │  └──────────┘ └──────────┘  │                │
    │  ┌────────────┐             │                │
    │  │ PRODUCCION │             │                │
    │  └────────────┘             │                │
    └─────────────┬───────────────┘                │
                  │                                │
                  ▼                                │
    ┌─────────────────────────────┐                │
    │     USUARIOS BASE           │                │
    │  ┌──────────────────┐       │                │
    │  │ EMPLEADO_BASICO  │       │                │
    │  └──────────────────┘       │                │
    └─────────────────────────────┘                │
                                                   │
    ┌──────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────┐
│         ROLES PERSONALIZADOS (dinámicos)         │
│  Creados por ADMIN según necesidades específicas │
└──────────────────────────────────────────────────┘
```

### 5.1 Explicación de la Jerarquía

| Nivel | Descripción |
|-------|-------------|
| **Presidencia** | Dirección General. Autoriza la creación de Roles Estratégicos y privilegios excepcionales. |
| **ADMIN** | Control técnico global. Reporta a Presidencia. Gestiona la configuración técnica del sistema. |
| **RH** | Control operativo global autorizado por Dirección General. Reporta a Presidencia. Gestiona personal y accesos. |
| **Roles Departamentales** | SISTEMAS, COMPRAS, PRODUCCION. Acceso limitado a módulos específicos según su función. |
| **Usuarios Base** | EMPLEADO_BASICO. Acceso mínimo al sistema (solo Dashboard). |
| **Roles Personalizados** | Creados dinámicamente por ADMIN para necesidades específicas no cubiertas por roles existentes. |

### 5.2 Principios de la Jerarquía

1. **No es transitiva**: Un rol no hereda automáticamente los permisos de los roles superiores.
2. **Cada rol tiene módulos asignados explícitamente** (vía presets o configuración manual).
3. **Solo ADMIN y RH tienen bypass global** por decisión organizacional.
4. **Los roles personalizados** se crean al mismo nivel que los departamentales, sin privilegios especiales.

---

## 6. Tabla Completa de Roles

### 6.1 Roles del Sistema

| Rol | Nombre | Descripción | Color | Icono | Tipo | Módulos por defecto |
|-----|--------|-------------|-------|-------|------|---------------------|
| `ADMIN` | Administrador | Administrador del sistema — control técnico global | `bg-purple-100 text-purple-800` | 👑 | Estratégico | DASHBOARD, EMPLEADOS, RECLUTAMIENTO, VACACIONES, INCIDENCIAS, CONFIGURACION, REPORTES, COMPRAS |
| `RH` | Recursos Humanos | Gestión de personal y reclutamiento — control operativo global autorizado por Dirección General | `bg-blue-100 text-blue-800` | 👥 | Estratégico | DASHBOARD, EMPLEADOS, RECLUTAMIENTO, VACACIONES, INCIDENCIAS, REPORTES |
| `SISTEMAS` | Sistemas | Soporte técnico y sistemas | `bg-green-100 text-green-800` | 💻 | Departamental | DASHBOARD, CONFIGURACION, REPORTES |
| `COMPRAS` | Compras | Gestión de compras y proveedores | `bg-yellow-100 text-yellow-800` | 🛒 | Departamental | DASHBOARD, COMPRAS, REPORTES |
| `PRODUCCION` | Producción | Gestión de producción | `bg-red-100 text-red-800` | 🏭 | Departamental | DASHBOARD, REPORTES |
| `EMPLEADO_BASICO` | Empleado | Acceso básico al sistema | `bg-gray-100 text-gray-800` | 👤 | Base | DASHBOARD |

### 6.2 Roles Personalizados

| Rol | Descripción |
|-----|-------------|
| *(dinámico)* | Creados por ADMIN vía `POST /api/roles`. Sin presets predefinidos. Sus módulos se asignan manualmente desde la UI de Gestión de Accesos. |

### 6.3 Matriz de Acceso por Módulo

| Módulo | EMPLEADO_BASICO | PRODUCCION | COMPRAS | SISTEMAS | RH | ADMIN |
|--------|:---------------:|:----------:|:-------:|:--------:|:--:|:-----:|
| `DASHBOARD` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `EMPLEADOS` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `RECLUTAMIENTO` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `VACACIONES` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `INCIDENCIAS` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `CONFIGURACION` | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `REPORTES` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `COMPRAS` | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |

> **Nota:** Los presets son valores por defecto. Los módulos de cada usuario pueden personalizarse desde la UI de Gestión de Accesos (ADMIN/RH). El array `accessibleModules` se almacena por usuario en la base de datos.

---

## 7. Política sobre Privilegios Excepcionales

### 7.1 Política Oficial

> ⚠️ **Ningún otro rol deberá recibir privilegios equivalentes a ADMIN o RH sin autorización expresa de Presidencia.**

### 7.2 Implicaciones

- **ADMIN** y **RH** son los únicos roles con bypass global de módulos y datos.
- Cualquier solicitud para crear un rol con privilegios similares debe ser aprobada por Dirección General.
- La creación de roles personalizados no debe incluir bypass de módulos ni scoping.
- Los roles personalizados se gestionan como roles departamentales, con módulos asignados explícitamente.

### 7.3 Proceso para Solicitar un Privilegio Excepcional

1. **Solicitud formal** a Presidencia describiendo la necesidad del negocio.
2. **Evaluación de impacto** por ADMIN (seguridad, riesgos, alternativas).
3. **Autorización explícita** de Dirección General.
4. **Implementación** del nuevo rol o asignación especial.
5. **Registro** en la documentación oficial (`.clinerules` y `docs/`).

---

## 8. Procedimiento para Crear Nuevos Roles

### 8.1 Roles del Sistema (predefinidos)

Para agregar un nuevo rol permanente al sistema:

```
Paso 1: Agregar al enum RoleType en backend/prisma/schema.prisma
        └── Ejemplo: PRODUCCION, GERENTE_VENTAS, etc.

Paso 2: Agregar configuración visual en backend/src/routes/roles.routes.js
        └── Agregar entrada en SYSTEM_ROLES con:
            • id: Código del rol (mayúsculas, sin espacios)
            • name: Nombre legible
            • description: Descripción del rol
            • color: Clases Tailwind (bg-* text-*)
            • icon: Emoji representativo

Paso 3: Agregar preset en backend/src/config/roles.config.js
        └── Definir los módulos que tendrá por defecto

Paso 4: Configurar accessibleModules desde la UI de Gestión de Accesos
        └── ADMIN o RH asigna módulos adicionales según sea necesario

Paso 5: No se requiere modificar código de validación de acceso
        └── El sistema usa accessibleModules, no validaciones por rol
```

### 8.2 Roles Personalizados (dinámicos)

Para crear un rol temporal o específico desde la UI:

```
Paso 1: ADMIN accede a Gestión de Accesos → Crear Rol
Paso 2: Ingresar nombre, descripción, color e ícono
Paso 3: El sistema lo crea vía POST /api/roles
Paso 4: ADMIN asigna módulos desde la UI de Gestión de Accesos
Paso 5: El rol está disponible para asignar a usuarios
```

**Restricciones:**
- Los roles personalizados no pueden tener el mismo nombre que un rol del sistema.
- Al eliminar un rol personalizado, los usuarios asignados se reasignan automáticamente a `EMPLEADO_BASICO`.
- Los roles personalizados no tienen presets de módulos.

---

## 9. Procedimiento para Agregar Nuevos Módulos

Procedimiento oficial paso a paso para implementar un nuevo módulo en el ERP KRAM:

```
Paso  1: Actualizar Prisma Schema
         └── Agregar valor al enum ModuleType en backend/prisma/schema.prisma

Paso  2: Crear migraciones
         └── Ejecutar: npx prisma migrate dev

Paso  3: Registrar módulo en modules.config.js
         └── Agregar entrada en backend/src/config/modules.config.js
         └── Incluir: key, label, description, enabled: true

Paso  4: Actualizar presets en roles.config.js
         └── Agregar el módulo a los presets de los roles que correspondan

Paso  5: Crear servicios
         └── Implementar lógica de negocio en backend/src/services/<modulo>/

Paso  6: Crear controladores
         └── Implementar endpoints REST en backend/src/controllers/

Paso  7: Crear rutas
         └── Definir rutas Express protegidas con requireModule('NUEVO_MODULO')

Paso  8: Registrar rutas en index.js
         └── Montar las rutas en backend/src/index.js con app.use('/api', nuevasRutas)

Paso  9: Registrar APIs frontend
         └── Agregar métodos en frontend/lib/api.js para consumir los nuevos endpoints

Paso 10: Crear páginas Next.js
         └── Implementar UI en frontend/app/<modulo>/

Paso 11: Actualizar DashboardLayout
         └── Agregar entradas en el sidebar de frontend/components/DashboardLayout.js

Paso 12: Aplicar ProtectedRoute
         └── Proteger rutas del frontend con el módulo correspondiente

Paso 13: Actualizar documentación oficial
         └── Reflejar cambios en .clinerules y docs/
```

### Fuente de Verdad

La **única fuente de verdad** para los módulos del sistema es:

```
backend/src/config/modules.config.js
```

Este archivo centraliza la definición de todos los módulos (key, label, description, enabled). El backend expone estos módulos dinámicamente a través de `GET /api/modules`.

> **NO** hardcodear listados de módulos en el frontend. Consumir siempre desde `GET /api/modules`.

---

## 10. Referencias Documentales

### 10.1 Documentación Interna

| Documento | Propósito | Ubicación |
|-----------|-----------|-----------|
| Reglas Maestras del ERP | Configuración oficial del sistema de permisos, roles y módulos | `.clinerules` |
| Arquitectura del Sistema | Estructura del repositorio, inventario de módulos, roles y presets | `docs/ARQUITECTURA_KRAM.md` |
| Matriz de Permisos | Estado actual del modelo de autorización, rutas protegidas y riesgos | `docs/MATRIZ_DE_PERMISOS.md` |
| Flujos de Negocio | Flujos funcionales detallados del sistema | `docs/FLUJOS_DE_NEGOCIO.md` |
| Diagrama Entidad-Relación | Modelo de datos con 23 modelos y 9 enums | `docs/ERD_KRAM.md` |
| Guía para Nuevos Módulos | Procedimiento detallado para implementar módulos | `docs/GUIA_NUEVO_MODULO.md` |
| Deuda Técnica | Inventario de deuda técnica clasificada por prioridad | `docs/DEUDA_TECNICA.md` |

### 10.2 Archivos de Configuración Clave

| Archivo | Propósito |
|---------|-----------|
| `backend/src/config/modules.config.js` | **Fuente de verdad** de módulos del sistema |
| `backend/src/config/roles.config.js` | **Fuente de verdad** de presets de módulos por rol |
| `backend/src/routes/roles.routes.js` | **Fuente de verdad** de roles del sistema (SYSTEM_ROLES) + endpoints dinámicos |
| `backend/src/middlewares/auth.middleware.js` | Implementación de middlewares de autorización (requireModule, requireRole) |
| `frontend/lib/rolesConfig.js` | ⚠️ Solo fallback visual (`ROLE_FALLBACK_CONFIG`). No usar para autorización |
| `frontend/lib/api.js` → `systemApi` | Cliente API para consumir roles/módulos desde el frontend |
| `frontend/components/DashboardLayout.js` | Sidebar con navegación filtrada por módulos y roles |
| `frontend/components/ProtectedRoute.js` | Componente para proteger rutas del frontend |

### 10.3 Endpoints de la API de Seguridad

| Endpoint | Método | Propósito | Protección |
|----------|--------|-----------|------------|
| `GET /api/roles` | GET | Obtener todos los roles (sistema + personalizados) | Autenticación |
| `GET /api/roles/presets` | GET | Obtener presets de módulos por rol | Autenticación |
| `GET /api/modules` | GET | Obtener todos los módulos del sistema | Autenticación |
| `POST /api/roles` | POST | Crear rol personalizado | `requireRole(['ADMIN'])` |
| `PUT /api/roles/:id` | PUT | Actualizar rol personalizado | `requireRole(['ADMIN'])` |
| `DELETE /api/roles/:id` | DELETE | Eliminar rol personalizado | `requireRole(['ADMIN'])` |
| `GET /api/permissions/users` | GET | Obtener usuarios con sus módulos | `requireRole(['ADMIN', 'RH'])` |
| `GET /api/permissions/modules` | GET | Obtener módulos disponibles | `requireRole(['ADMIN', 'RH'])` |
| `PUT /api/permissions/users/:id` | PUT | Actualizar módulos de un usuario | `requireRole(['ADMIN', 'RH'])` |

---

## Apéndice A: Resumen de Métricas del Modelo

| Categoría | Cantidad |
|-----------|:--------:|
| Roles del sistema (SYSTEM_ROLES) | 6 |
| Roles Estratégicos con bypass | 2 (ADMIN, RH) |
| Roles Departamentales | 3 (SISTEMAS, COMPRAS, PRODUCCION) |
| Roles Base | 1 (EMPLEADO_BASICO) |
| Módulos registrados | 8 (7 en config + DASHBOARD implícito) |
| Presets de módulos por rol | 6 |
| Niveles de autorización | 3 (A: Módulos, B: Ownership, C: Críticas) |
| Endpoints protegidos por módulo | 59 |
| Endpoints protegidos por rol | 63 |

---

## Apéndice B: Historial de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 13/06/2026 | Versión inicial. Documento ejecutivo del modelo de seguridad basado en `.clinerules` v4.1. |

---

> **Nota final:** Este documento es una referencia oficial del modelo de seguridad del ERP KRAM. Cualquier cambio en la arquitectura de permisos, roles o módulos debe reflejarse tanto en este documento como en `.clinerules` y la documentación asociada en `docs/`.
