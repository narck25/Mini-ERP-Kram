# FLUJOS DE NEGOCIO — ERP KRAM

> **Documento:** `docs/FLUJOS_DE_NEGOCIO.md`
> **Versión:** 1.0
> **Propósito:** Documentar los flujos funcionales reales del sistema basados en el código fuente.

---

## ÍNDICE

1. [Flujo de Reclutamiento](#1-flujo-de-reclutamiento)
2. [Flujo de Compras](#2-flujo-de-compras)
3. [Flujo de Gestión de Empleados](#3-flujo-de-gestión-de-empleados)
4. [Flujo de Configuración de Usuarios y Accesos](#4-flujo-de-configuración-de-usuarios-y-accesos)

---

## 1. FLUJO DE RECLUTAMIENTO

**Controlador:** `backend/src/controllers/recruitment.controller.js` (~1550 líneas)
**Frontend:** `frontend/app/reclutamiento/` y `frontend/app/rh/reclutamiento/`

### 1.1 Flujo Estándar (Jefe de Área solicita → RH aprueba)

```
JEFE DE ÁREA (SISTEMAS, COMPRAS, PRODUCCION)
│
├── 1. CREAR SOLICITUD DE VACANTE
│   ├── POST /api/recruitment/vacancies
│   ├── Datos: titulo, departamento, puesto, motivo, tipo contratación, etc.
│   ├── Estado inicial: "Solicitada"
│   ├── Se crea comentario automático: "Solicitud de vacante creada."
│   └── Se notifica por email a usuarios RH y ADMIN
│
├── 2. RH REVISA Y APRUEBA
│   ├── PUT /api/recruitment/vacancies/:id/approve
│   ├── Solo ADMIN y RH pueden aprobar
│   ├── Estado cambia: "Solicitada" → "Aprobada"
│   ├── Se crea comentario automático: "Solicitud aprobada por RH."
│   └── Se notifica al solicitante por email
│
├── 3. JEFE DE ÁREA DEFINE ACTIVIDADES DEL PUESTO
│   ├── POST /api/recruitment/vacancies/:id/activities
│   ├── Solo el solicitante puede definir actividades
│   ├── Requiere estado "Aprobada"
│   ├── Se crean actividades (activityType, description, duration, priority)
│   ├── Estado se mantiene: "Aprobada" (lista para búsqueda)
│   ├── Se crea comentario automático con cantidad de actividades
│   └── Se notifica a RH que se definieron actividades
│
├── 4. RH ACTUALIZA PERFIL TÉCNICO Y PASA A BÚSQUEDA
│   ├── PUT /api/recruitment/vacancies/:id/technical-profile
│   ├── Requiere estado "Aprobada"
│   ├── Estado cambia: "Aprobada" → "Buscando"
│   ├── Se actualizan requerimientos técnicos detallados
│   └── Se crea comentario automático
│
├── 5. RH REGISTRA CANDIDATOS
│   ├── POST /api/recruitment/vacancies/:vacancy_id/candidates
│   ├── Requiere estado "Buscando"
│   ├── Sube CV (PDF obligatorio) y pruebas psicométricas (PDF opcional)
│   ├── Estado del candidato: "En_Revision"
│   ├── Se crea comentario automático
│   └── Se notifica al solicitante para que revise al candidato
│
├── 6. JEFE DE ÁREA VOTA POR CANDIDATOS
│   ├── PUT /api/recruitment/candidates/:candidate_id/vote
│   ├── Opciones: like (👍), dislike (👎), reset (🔄)
│   ├── Like → candidato pasa a "Seleccionado"
│   ├── Dislike → candidato pasa a "Descartado"
│   ├── Reset → candidato vuelve a "En_Revision" (solo RH)
│   ├── Se crea comentario automático del voto
│   └── Se notifica a RH del voto
│
└── 7. JEFE DE ÁREA SELECCIONA CANDIDATO FINAL Y CIERRA
    ├── PUT /api/recruitment/candidates/:candidate_id/select
    ├── Solo el solicitante puede seleccionar
    ├── Candidato se marca como "Seleccionado"
    ├── Vacante se cierra: "Buscando" → "Cerrada"
    ├── Se crea comentario automático
    └── Se notifica a RH de la selección
```

### 1.2 Flujo Directo (RH crea vacante pre-aprobada)

```
RH / ADMIN
│
├── 1. CREAR VACANTE DIRECTA (Flujo Fast-Track)
│   ├── POST /api/recruitment/vacancies/direct
│   ├── isDirect = true
│   ├── Estado inicial: "Aprobada" (salta la aprobación)
│   ├── Se pueden incluir actividades desde la creación
│   ├── Se crea comentario: "Vacante creada mediante Flujo Directo"
│   └── Se notifica al solicitante
│
├── 2. RH ACTUALIZA PERFIL TÉCNICO
│   └── (Mismo que paso 4 del flujo estándar)
│
├── 3. RH REGISTRA CANDIDATOS
│   └── (Mismo que paso 5 del flujo estándar)
│
└── 4. JEFE DE ÁREA VOTA Y SELECCIONA
    └── (Mismo que pasos 6 y 7 del flujo estándar)
```

### 1.3 Cancelación de Vacante

```
SOLICITANTE
│
├── PUT /api/recruitment/vacancies/:id/cancel
├── Solo el solicitante puede cancelar su propia vacante
├── Estado cambia a: "Cerrada"
└── Se crea comentario: "Vacante cancelada por el solicitante."
```

### 1.4 Eliminación de Vacante (permanente)

```
RH / ADMIN
│
├── DELETE /api/recruitment/vacancies/:id
├── Elimina físicamente: comentarios, actividades, candidatos, vacante
├── Elimina archivos del disco (CVs, pruebas psicométricas)
└── No hay recuperación posible
```

### 1.5 Diagrama de Estados (Vacantes)

```
                    ┌──────────────┐
                    │  Solicitada  │
                    └──────┬───────┘
                           │ RH aprueba
                           ▼
                    ┌──────────────┐
              ┌─────│  Aprobada    │◄──── (Flujo Directo)
              │     └──────┬───────┘
              │            │ Jefe define actividades
              │            │ RH actualiza perfil técnico
              │            ▼
              │     ┌──────────────┐
              │     │  Buscando    │
              │     └──────┬───────┘
              │            │ Candidato seleccionado
              │            ▼
              │     ┌──────────────┐
              └────►│   Cerrada    │
                    └──────────────┘
```

### 1.6 Diagrama de Estados (Candidatos)

```
                    ┌──────────────┐
              ┌─────│  En_Revision │◄──── (reset)
              │     └──────┬───────┘
              │        ┌───┴───┐
              │        │       │
              │        ▼       ▼
              │  ┌────────┐ ┌──────────┐
              │  │Descar- │ │Seleccio- │
              │  │tado    │ │nado      │
              │  └────────┘ └────┬─────┘
              │                  │ (selectCandidate)
              │                  ▼
              │           Vacante → Cerrada
              └─────────────────────────┘
```

---

## 2. FLUJO DE COMPRAS

**Controlador:** `backend/src/controllers/purchase.controller.js` (~772 líneas)
**Servicios:** `backend/src/services/purchases/` (purchase.service.js, quote.service.js, approval.service.js, purchase-order.service.js, etc.)
**Frontend:** `frontend/app/compras/` y `frontend/app/dashboard/compras/`

### 2.1 Flujo Completo de Compra

```
USUARIO (cualquier rol con módulo COMPRAS)
│
├── 1. CREAR SOLICITUD DE COMPRA
│   ├── POST /api/purchases/requests
│   ├── Datos: justificación, items (producto/servicio, cantidad)
│   ├── Estado inicial: "NUEVO"
│   └── Se registra auditoría de creación
│
├── 2. SUBIR COTIZACIONES
│   ├── POST /api/purchases/requests/:id/quotes
│   ├── Sube archivos de cotizaciones (PDF, imágenes, etc.)
│   ├── Estado cambia: "NUEVO" → "PENDIENTE"
│   ├── Se registra auditoría de subida
│   └── Se notifica cambio de estado (fire & forget)
│
├── 3. COMPARAR COTIZACIONES
│   ├── GET /api/purchases/requests/:id/comparison
│   ├── Devuelve tabla comparativa de cotizaciones
│   └── Solo consulta, no cambia estado
│
├── 4. SELECCIONAR COTIZACIÓN
│   ├── PUT /api/purchases/requests/:id/quotes/:quoteId/select
│   ├── Selecciona la mejor cotización
│   ├── Si monto ≤ $50,000 MXN:
│   │   ├── Estado cambia: "PENDIENTE" → "APROBADO"
│   │   └── No requiere autorización adicional
│   ├── Si monto > $50,000 MXN:
│   │   ├── Estado cambia: "PENDIENTE" → "EN_AUTORIZACION"
│   │   └── Requiere asignar aprobadores
│   ├── Se registra auditoría de selección
│   └── Se notifica cambio de estado
│
├── 5. ASIGNAR APROBADORES (solo si monto > $50,000)
│   ├── GET /api/purchases/requests/:id/potential-approvers
│   │   └── Obtiene lista de aprobadores potenciales
│   ├── POST /api/purchases/requests/:id/assign-approvers
│   │   └── Asigna aprobadores a la solicitud
│   ├── POST /api/purchases/requests/:id/send-authorization
│   │   └── Envía email de autorización a los aprobadores
│   └── Se registra auditoría de envío a autorización
│
├── 6. APROBADOR AUTORIZA
│   ├── PUT /api/purchases/requests/:id/authorize
│   ├── Estado cambia: "EN_AUTORIZACION" → "APROBADO"
│   ├── Se registra auditoría de aprobación
│   └── Se notifica cambio de estado
│
├── 7. GENERAR ORDEN DE COMPRA
│   ├── POST /api/purchases/requests/:id/purchase-order
│   ├── Datos: items personalizados con precio unitario
│   ├── Genera PDF de orden de compra
│   ├── Se registra auditoría de generación
│   └── Se puede regenerar PDF con PUT /.../purchase-order/regenerate
│
└── 8. MARCAR COMO ENTREGADO
    ├── PUT /api/purchases/requests/:id/delivered
    ├── Estado cambia: "APROBADO" → "ENTREGADO"
    ├── Se registra auditoría de entrega
    └── Se notifica cambio de estado
```

### 2.2 Cancelación de Solicitud

```
USUARIO (solicitante) / ADMIN
│
├── PUT /api/purchases/requests/:id/cancel
├── Estado cambia a: "CANCELADO"
├── Se registra auditoría de cancelación
└── Se notifica cambio de estado
```

### 2.3 Diagrama de Estados (Compras)

```
                    ┌──────────────┐
                    │    NUEVO     │
                    └──────┬───────┘
                           │ Subir cotizaciones
                           ▼
                    ┌──────────────┐
                    │  PENDIENTE   │
                    └──────┬───────┘
                           │ Seleccionar cotización
                           ▼
              ┌────────────────────────┐
              │ ¿Monto > $50,000 MXN?  │
              └──────┬─────────┬───────┘
                     │         │
                Sí   │         │  No
                     ▼         ▼
          ┌──────────────┐ ┌──────────────┐
          │EN_AUTORIZACION│ │  APROBADO    │
          └──────┬───────┘ └──────┬───────┘
                 │                │
                 ▼                ▼
          ┌──────────────┐ ┌──────────────┐
          │  APROBADO    │ │  ENTREGADO   │
          └──────┬───────┘ └──────────────┘
                 │
                 ▼
          ┌──────────────┐
          │  ENTREGADO   │
          └──────────────┘

          Cualquier estado puede ir a:
          ┌──────────────┐
          │  CANCELADO   │
          └──────────────┘
```

### 2.4 Historial de Auditoría

```
Cualquier usuario con acceso
│
├── GET /api/purchases/requests/:id/audit
└── Devuelve historial completo de cambios en la solicitud
    (creación, cotizaciones, selecciones, aprobaciones, entregas, cancelaciones)
```

---

## 3. FLUJO DE GESTIÓN DE EMPLEADOS

**Controlador:** `backend/src/controllers/employee-core.controller.js` (~1123 líneas)
**Frontend:** `frontend/app/rh/empleados/`

### 3.1 Flujo de Creación de Empleado

```
RH / ADMIN
│
├── 1. CREAR EMPLEADO
│   ├── POST /api/employees
│   ├── Datos requeridos: RFC, CURP, NSS, fecha_ingreso, puestoId, departamento_id
│   ├── Datos opcionales: nombre, apellidos, contacto, dirección, salario, etc.
│   ├── Validaciones:
│   │   ├── RFC, CURP, NSS únicos en el sistema
│   │   ├── userId opcional (si se proporciona, debe existir y no estar asociado)
│   │   └── reportaAId opcional (jefe directo en jerarquía)
│   ├── Cálculos automáticos:
│   │   ├── SD (Sueldo Diario) = salarioMensual / 30.4
│   │   └── SDI (Sueldo Diario Integrado) = SD × factor de integración
│   ├── Se crea registro en SalaryHistory con tipo "ALTA"
│   └── Opcional: crear usuario automático
│       ├── Email: correoEmpresa o correoElectronico
│       ├── Contraseña temporal: primeros 10 caracteres del RFC (minúsculas)
│       ├── Rol: "EMPLEADO_BASICO"
│       └── Módulos: solo "DASHBOARD"
│
├── 2. LISTAR EMPLEADOS (con scoping por jerarquía)
│   ├── GET /api/employees
│   ├── ADMIN/RH: ven todos los empleados
│   ├── PRESIDENTE/DIRECTOR/GERENTE/JEFE: ven empleados de su departamento
│   ├── COORDINADOR/ANALISTA/SUPERVISOR/AUX_ADMINISTRATIVO: ven su registro + reportados directos
│   ├── OPERATIVO: solo ve su propio registro
│   └── Filtros: estatus, departamento_id, search (nombre, RFC, CURP, NSS, puesto)
│
├── 3. VER DETALLE DE EMPLEADO
│   ├── GET /api/employees/:id
│   ├── Incluye: departamento, puesto, usuario asociado, documentos,
│   │            reportaA (jefe), subordinados, vacantes del empleado
│   └── 404 si no existe
│
├── 4. ACTUALIZAR EMPLEADO
│   ├── PUT /api/employees/:id
│   ├── Mismos campos que creación
│   ├── Validaciones de unicidad (RFC, CURP, NSS excluyendo el actual)
│   ├── Si cambia salario: recalcula SD/SDI y crea registro en SalaryHistory
│   │   └── tipoCambio: "INCREMENTO", "DECREMENTO", "AJUSTE"
│   └── Si cambia userId: verifica que no esté asociado a otro empleado
│
├── 5. DAR DE BAJA (Baja Lógica)
│   ├── DELETE /api/employees/:id
│   ├── Cambia estatus a "Inactivo"
│   └── Desactiva el usuario vinculado (isActive = false)
│
└── 6. ELIMINAR PERMANENTEMENTE
    ├── DELETE /api/employees/:id/permanent
    ├── Solo si NO tiene documentos ni vacantes asociadas
    ├── Elimina el usuario vinculado
    └── Elimina físicamente el registro de empleado
```

### 3.2 Flujo de Importación CSV

```
RH / ADMIN
│
├── POST /api/employees/csv/import
├── Sube archivo CSV con datos de empleados
├── Parsea y mapea columnas CSV → modelo Prisma
├── Crea empleados en lote
└── Reporta resultados (éxitos, errores, duplicados)
```

### 3.3 Flujo de Documentos

```
RH / ADMIN
│
├── POST /api/employees/:id/documents
│   └── Sube documento (tipo_documento, archivo)
├── GET /api/employees/:id/documents
│   └── Lista documentos del empleado
├── GET /api/employees/documents/:docId/download
│   └── Descarga documento
└── DELETE /api/employees/documents/:docId
    └── Elimina documento
```

### 3.4 Flujo de Foto de Perfil

```
RH / ADMIN
│
├── POST /api/employees/:id/photo
│   └── Sube foto de perfil
└── GET /api/employees/:id/photo
    └── Obtiene foto de perfil
```

### 3.5 Historial Salarial

```
RH / ADMIN
│
├── GET /api/employees/:id/salary-history
└── Devuelve historial de cambios salariales
    (ALTA, INCREMENTO, DECREMENTO, AJUSTE)
```

### 3.6 Diagrama de Estados (Empleado)

```
                    ┌──────────────┐
                    │   Activo     │
                    └──────┬───────┘
                           │ Dar de baja (DELETE)
                           ▼
                    ┌──────────────┐
                    │  Inactivo    │
                    └──────────────┘

         Eliminación permanente solo si:
         - No tiene documentos asociados
         - No tiene vacantes asociadas
```

---

## 4. FLUJO DE CONFIGURACIÓN DE USUARIOS Y ACCESOS

**Controladores:**
- `backend/src/controllers/user.controller.js` (~371 líneas) — CRUD de usuarios
- `backend/src/controllers/permission.controller.js` (~206 líneas) — Gestión de permisos ACL
- `backend/src/controllers/auth.controller.js` — Autenticación
**Frontend:** `frontend/app/dashboard/usuarios/` y `frontend/app/dashboard/accesos/`

### 4.1 Flujo de Autenticación

```
USUARIO
│
├── 1. INICIAR SESIÓN
│   ├── POST /api/auth/login
│   ├── Datos: email, password
│   ├── Validación: bcrypt.compare(password, hash)
│   ├── Genera JWT con payload: { id, email, name, role, accessibleModules,
│   │                            employeeId, employeeNivelJerarquico,
│   │                            employeeDepartamentoId }
│   └── Responde: { token, user }
│
├── 2. OBTENER PERFIL
│   ├── GET /api/auth/profile (requiere token)
│   └── Devuelve datos del usuario autenticado
│
├── 3. REGISTRARSE
│   ├── POST /api/auth/register
│   └── Crea nuevo usuario (público, sin protección)
│
└── 4. CERRAR SESIÓN
    └── Lado cliente: eliminar token del almacenamiento
```

### 4.2 Flujo de Gestión de Usuarios (solo ADMIN)

```
ADMIN
│
├── 1. LISTAR USUARIOS
│   ├── GET /api/users
│   └── Devuelve: id, name, email, role, isActive, accessibleModules, empleado asociado
│
├── 2. VER USUARIO
│   ├── GET /api/users/:id
│   └── Devuelve detalle del usuario
│
├── 3. CREAR USUARIO
│   ├── POST /api/users
│   ├── Datos requeridos: name, email, password, role
│   ├── Opcional: accessibleModules
│   ├── Hash de contraseña con bcrypt (salt rounds: 10)
│   └── Validación: name y email únicos
│
├── 4. ACTUALIZAR USUARIO
│   ├── PUT /api/users/:id
│   ├── Campos editables: name, email, password, role, accessibleModules, isActive
│   ├── Si cambia password: nuevo hash con bcrypt
│   └── Validación: name y email únicos (excluyendo el actual)
│
├── 5. RESTABLECER CONTRASEÑA
│   ├── PUT /api/users/:id/reset-password
│   ├── Accesible para ADMIN y RH
│   ├── Requiere newPassword ≥ 6 caracteres
│   └── Hash con bcrypt
│
├── 6. ELIMINAR USUARIO
│   ├── DELETE /api/users/:id
│   ├── No permite eliminar la propia cuenta
│   └── Eliminación física del registro
│
└── 7. ESTADÍSTICAS DE USUARIOS
    ├── GET /api/users/stats
    └── Devuelve: total, activos, inactivos, usuarios por rol
```

### 4.3 Flujo de Gestión de Permisos (ADMIN y RH)

```
ADMIN / RH
│
├── 1. LISTAR USUARIOS CON PERMISOS
│   ├── GET /api/permissions/users
│   └── Devuelve todos los usuarios con sus módulos accesibles
│
├── 2. ACTUALIZAR PERMISOS DE UN USUARIO
│   ├── PUT /api/permissions/users/:id
│   ├── Datos: accessibleModules (array de strings), role (opcional)
│   ├── Validaciones:
│   │   ├── accessibleModules debe ser un array
│   │   ├── Cada módulo debe existir en modules.config.js o ser "DASHBOARD"
│   │   └── DASHBOARD siempre se incluye automáticamente
│   ├── Si se proporciona role: se actualiza (acepta cualquier string,
│   │   incluidos roles personalizados)
│   └── Respuesta: mensaje de éxito con datos del usuario
│
├── 3. OBTENER MÓDULOS DISPONIBLES
│   ├── GET /api/permissions/modules
│   └── Devuelve lista de módulos desde modules.config.js
│
└── 4. VER MIS PERMISOS
    ├── GET /api/permissions/me
    └── Devuelve: id, email, name, role, accessibleModules del usuario autenticado
```

### 4.4 Flujo de Roles y Módulos (API pública)

```
CUALQUIER USUARIO AUTENTICADO
│
├── GET /api/roles
│   └── Devuelve lista de roles del sistema (SYSTEM_ROLES)
│
├── GET /api/modules
│   └── Devuelve lista de módulos disponibles
│
└── GET /api/roles/presets
    └── Devuelve presets de módulos por rol
```

### 4.5 Diagrama de Acceso (Permisos)

```
                    ┌─────────────────────────────────────┐
                    │       GESTIÓN DE ACCESOS             │
                    │  (Solo ADMIN y RH)                   │
                    └─────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
          ┌──────────────────┐          ┌──────────────────┐
          │  Listar usuarios  │          │  Actualizar       │
          │  con permisos     │          │  permisos         │
          └──────────────────┘          └──────────────────┘
                    │                               │
                    │                               ▼
                    │                    ┌──────────────────┐
                    │                    │  Seleccionar      │
                    │                    │  módulos (check)  │
                    │                    │  + rol (opcional) │
                    │                    └──────────────────┘
                    │                               │
                    │                               ▼
                    │                    ┌──────────────────┐
                    │                    │  Validar módulos  │
                    │                    │  vs config        │
                    │                    └──────────────────┘
                    │                               │
                    │                               ▼
                    │                    ┌──────────────────┐
                    │                    │  Actualizar BD    │
                    │                    │  + DASHBOARD      │
                    │                    │  (siempre incluido)│
                    │                    └──────────────────┘
                    │
                    ▼
          ┌─────────────────────────────────────┐
          │  El usuario ahora tiene acceso a     │
          │  los módulos seleccionados           │
          └─────────────────────────────────────┘
```

### 4.6 Diagrama de Ciclo de Vida del Usuario

```
                    ┌──────────────┐
                    │  Registro    │
                    │  (público)   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Creado por  │◄──── ADMIN crea usuario
                    │  ADMIN       │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Activo      │
                    │  isActive:   │
                    │  true        │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
      ┌──────────────┐         ┌──────────────┐
      │  Inactivo    │         │  Eliminado   │
      │  isActive:   │         │  (físico)    │
      │  false       │         └──────────────┘
      │  (baja lógica)│
      └──────────────┘
```

---

## RESUMEN DE FLUJOS

| Flujo | Estados | Actores | Frontend |
|-------|---------|---------|----------|
| **Reclutamiento** | Solicitada → Aprobada → Buscando → Cerrada | Jefe de Área, RH, ADMIN | `reclutamiento/`, `rh/reclutamiento/` |
| **Compras** | NUEVO → PENDIENTE → EN_AUTORIZACION → APROBADO → ENTREGADO / CANCELADO | Solicitante, Aprobador, ADMIN | `compras/`, `dashboard/compras/` |
| **Empleados** | Activo → Inactivo (baja lógica) | RH, ADMIN | `rh/empleados/` |
| **Usuarios** | Activo → Inactivo → Eliminado | ADMIN | `dashboard/usuarios/` |
| **Permisos** | Módulos asignados dinámicamente | ADMIN, RH | `dashboard/accesos/` |

---

*Fin del documento — Flujos de Negocio*
