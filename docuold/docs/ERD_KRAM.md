# MODELO DE DATOS — ERP KRAM

> **Documento generado:** 13/06/2026
> **Fuente de verdad:** `backend/prisma/schema.prisma`
> **Propósito:** Documentar el estado actual del modelo relacional de la base de datos.
> **Restricción:** Este documento NO propone cambios. Solo describe el estado actual del schema.

---

## 1. Introducción

El modelo de datos del ERP KRAM está definido mediante **Prisma ORM** versión 5+, que actúa como la fuente de verdad única para el esquema relacional.

| Elemento | Detalle |
|----------|---------|
| **Motor de base de datos** | PostgreSQL |
| **ORM** | Prisma Client JS |
| **Ubicación del schema** | `backend/prisma/schema.prisma` |
| **Convención de nombres** | Modelos en PascalCase, tablas en snake_case (`@@map`) |
| **IDs** | CUID (string) por defecto, autoincrement en casos específicos |

---

## 2. Inventario Completo de Entidades

| # | Modelo | Propósito | Módulo |
|---|--------|-----------|--------|
| 1 | `User` | Usuarios del sistema (autenticación) | Seguridad |
| 2 | `Role` | Roles personalizados (dinámicos) | Seguridad |
| 3 | `Session` | Sesiones JWT activas | Seguridad |
| 4 | `Employee` | Empleados de la organización | Empleados |
| 5 | `Department` | Departamentos de la empresa | Empleados |
| 6 | `JobPosition` | Puestos de trabajo | Empleados |
| 7 | `EmployeeDocument` | Documentos de empleados (INE, CURP, etc.) | Empleados |
| 8 | `SalaryHistory` | Historial de cambios salariales | Empleados |
| 9 | `JobVacancy` | Solicitudes de vacante / reclutamiento | Reclutamiento |
| 10 | `JobActivity` | Actividades del puesto (flujo estándar) | Reclutamiento |
| 11 | `CandidateRH` | Candidatos a vacantes | Reclutamiento |
| 12 | `VacancyComment` | Comentarios en vacantes | Reclutamiento |
| 13 | `PurchaseRequest` | Solicitudes de compra | Compras |
| 14 | `PurchaseItem` | Partidas de solicitud de compra | Compras |
| 15 | `PurchaseQuote` | Cotizaciones de proveedores | Compras |
| 16 | `PurchaseComment` | Comentarios en solicitudes de compra | Compras |
| 17 | `PurchaseApprover` | Aprobadores asignados a solicitudes | Compras |
| 18 | `PurchaseOrder` | Órdenes de compra generadas | Compras |
| 19 | `PurchaseOrderItem` | Partidas de orden de compra | Compras |
| 20 | `PurchaseAuditLog` | Auditoría de cambios en compras | Compras |
| 21 | `AttendanceRecord` | Registros del checador ZKTeco | Incidencias |
| 22 | `NotificationLog` | Log de notificaciones enviadas | Empleados |
| 23 | `FactorIntegracion` | Catálogo de factores de integración (LFT) | Empleados |

**Total de modelos: 23**

---

## 3. Relaciones entre Entidades

### 3.1 Diagrama General del Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA KRAM — MODELO DE DATOS                   │
│                                                                         │
│  ┌──────────┐     ┌──────────┐     ┌──────────────────────┐            │
│  │   User   │1──0.1│ Employee │1──*│  EmployeeDocument    │            │
│  └────┬─────┘     └────┬─────┘     └──────────────────────┘            │
│       │                │                                                │
│       │1               │1                                               │
│       │                ├────────────────────┐                           │
│       │                │*                   │*                          │
│       │         ┌──────────────┐    ┌──────────────┐                    │
│       │         │  Department  │    │  JobPosition │                    │
│       │         └──────┬───────┘    └──────┬───────┘                    │
│       │                │1                  │1                           │
│       │                │*                  │*                           │
│       │         ┌──────────────┐    ┌──────────────┐                    │
│       │         │  JobVacancy  │    │  Employee    │                    │
│       │         └──────┬───────┘    │ (reportaA)   │                    │
│       │                │            └──────────────┘                    │
│       │                ├──* CandidateRH                                 │
│       │                ├──* JobActivity                                 │
│       │                ├──* VacancyComment ──── User                    │
│       │                                                                 │
│       │  ┌──────────────────────────────────────────────────────┐       │
│       │  │              MÓDULO DE COMPRAS                       │       │
│       │  │                                                      │       │
│       │  │  PurchaseRequest ──*── PurchaseItem                  │       │
│       │  │       │──*── PurchaseQuote                           │       │
│       │  │       │──*── PurchaseComment ──── User               │       │
│       │  │       │──*── PurchaseApprover ──── Employee          │       │
│       │  │       │──*── PurchaseAuditLog                        │       │
│       │  │       │──1── PurchaseOrder ──*── PurchaseOrderItem   │       │
│       │  └──────────────────────────────────────────────────────┘       │
│       │                                                                 │
│       │  ┌──────────────────────────────────────────────────────┐       │
│       │  │              MÓDULO DE INCIDENCIAS                   │       │
│       │  │                                                      │       │
│       │  │  AttendanceRecord (independiente, sin FK)            │       │
│       │  └──────────────────────────────────────────────────────┘       │
│       │                                                                 │
│       │  ┌──────────────────────────────────────────────────────┐       │
│       │  │              RH / NÓMINA                             │       │
│       │  │                                                      │       │
│       │  │  SalaryHistory ──── Employee                         │       │
│       │  │  NotificationLog ──── Employee                       │       │
│       │  │  FactorIntegracion (catálogo independiente)          │       │
│       │  └──────────────────────────────────────────────────────┘       │
│       │                                                                 │
│       │  ┌──────────────────────────────────────────────────────┐       │
│       │  │              SEGURIDAD                               │       │
│       │  │                                                      │       │
│       │  │  Role (roles personalizados, independiente)          │       │
│       │  │  Session ──── User                                   │       │
│       │  └──────────────────────────────────────────────────────┘       │
│       └──────────────────────────────────────────────────────────────────┘
```

---

## 4. Dominio de Empleados

### 4.1 Entidades

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `Employee` | `employees` | Datos personales, laborales y salariales de cada empleado |
| `Department` | `departments` | Catálogo de departamentos |
| `JobPosition` | `job_positions` | Catálogo de puestos (único por departamento) |
| `EmployeeDocument` | `employee_documents` | Documentos digitalizados de empleados |
| `SalaryHistory` | `salary_history` | Historial de cambios salariales |
| `NotificationLog` | `notification_logs` | Registro de notificaciones enviadas |
| `FactorIntegracion` | `factores_integracion` | Catálogo de factores de integración (LFT) |

### 4.2 ERD del Dominio

```
                    ┌──────────────────────┐
                    │     Department       │
                    │──────────────────────│
                    │ id (PK)              │
                    │ nombre (UQ)          │
                    │ descripcion          │
                    │ estado               │
                    └──────────┬───────────┘
                               │ 1
                               │
                    ┌──────────┴───────────┐
                    │     JobPosition      │
                    │──────────────────────│
                    │ id (PK)              │
                    │ nombre               │
                    │ departamentoId (FK)  │──┐
                    │ nivelJerarquico      │  │
                    │ estado               │  │
                    └──────────────────────┘  │
                                              │
                    ┌──────────────────────┐  │
                    │      Employee        │  │
                    │──────────────────────│  │
                    │ id (PK)              │  │
                    │ userId (UQ, FK) ─────┼──┼──> User
                    │ departamento_id (FK) ┼──┘
                    │ puestoId (FK) ───────┼──> JobPosition
                    │ reportaAId (FK) ─────┼──┐
                    │ curp (UQ)            │  │
                    │ rfc (UQ)             │  │
                    │ nss (UQ)             │  │
                    │ clave (UQ)           │  │
                    │ salarioMensual       │  │
                    │ sd                   │  │
                    │ sdi                  │  │
                    │ nivelJerarquico      │  │
                    │ estatus              │  │
                    │ fechaAlta            │  │
                    │ fechaBaja            │  │
                    │ esPadre              │  │
                    │ numeroHijos          │  │
                    │ fotoUrl              │  │
                    │ +30 campos más       │  │
                    └──────────┬───────────┘  │
                               │              │
                    ┌──────────┴───────────┐  │
                    │   EmployeeDocument   │  │
                    │──────────────────────│  │
                    │ id (PK)              │  │
                    │ employee_id (FK) ────┼──┘
                    │ tipo_documento       │
                    │ nombre_archivo       │
                    │ url_archivo          │
                    │ mime_type            │
                    │ size_bytes           │
                    └──────────────────────┘

                    ┌──────────────────────┐
                    │    SalaryHistory     │
                    │──────────────────────│
                    │ id (PK)              │
                    │ employeeId (FK) ─────┼──> Employee
                    │ salarioAnterior      │
                    │ salarioNuevo         │
                    │ sdAnterior           │
                    │ sdNuevo              │
                    │ sdiAnterior          │
                    │ sdiNuevo             │
                    │ tipoCambio           │
                    │ fechaCambio          │
                    └──────────────────────┘

                    ┌──────────────────────┐
                    │   NotificationLog    │
                    │──────────────────────│
                    │ id (PK)              │
                    │ employeeId (FK) ─────┼──> Employee
                    │ tipo                 │
                    │ employeeName         │
                    │ email                │
                    │ estatus              │
                    └──────────────────────┘

                    ┌──────────────────────┐
                    │  FactorIntegracion   │
                    │──────────────────────│
                    │ id (PK, autoincrement)│
                    │ anio (UQ)            │
                    │ diasAguinaldo        │
                    │ diasVacaciones       │
                    │ primaVacacional      │
                    │ factor               │
                    └──────────────────────┘
```

### 4.3 Relación Jerárquica (reportaA)

La entidad `Employee` tiene una **auto-referencia** para modelar la jerarquía organizacional:

```
                    ┌──────────────────────┐
                    │      Employee        │
                    │──────────────────────│
                    │ id (PK)              │
                    │ reportaAId (FK) ─────┼────┐
                    │ ...                  │    │
                    └──────────────────────┘    │
                         ▲                      │
                         └──────────────────────┘
                         (Auto-referencia)

    Un empleado puede tener un jefe (reportaA → Employee)
    Un empleado puede tener N subordinados (subordinados → Employee[])
```

**Campos de jerarquía en Employee:**
- `reportaAId` (String?, FK → Employee.id) — Jefe directo
- `nivelJerarquico` (NivelJerarquico?) — Nivel en la organización

---

## 5. Dominio de Reclutamiento

### 5.1 Entidades

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `JobVacancy` | `job_vacancies` | Solicitudes de vacante |
| `JobActivity` | `job_activities` | Actividades del puesto |
| `CandidateRH` | `candidates_rh` | Candidatos a vacantes |
| `VacancyComment` | `vacancy_comments` | Comentarios en vacantes |

### 5.2 ERD del Dominio

```
                    ┌──────────────────────┐
                    │      Employee        │
                    │──────────────────────│
                    │ id (PK)              │
                    └──────────┬───────────┘
                               │ 1
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          │ solicitanteId      │ autorizadoPorId    │ voBoPorId
          │                    │                    │
          ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   JobVacancy     │  │   JobVacancy     │  │   JobVacancy     │
│ (N:1)            │  │ (N:1, opcional)  │  │ (N:1, opcional)  │
└──────────────────┘  └──────────────────┘  └──────────────────┘

                    ┌──────────────────────┐
                    │      JobVacancy      │
                    │──────────────────────│
                    │ id (PK)              │
                    │ solicitanteId (FK) ──┼──> Employee
                    │ autorizadoPorId (FK) ┼──> Employee (opcional)
                    │ voBoPorId (FK) ──────┼──> Employee (opcional)
                    │ departamento_id (FK) ┼──> Department (opcional)
                    │ jobPositionId (FK) ──┼──> JobPosition (opcional)
                    │ titulo               │
                    │ estatus              │
                    │ motivoSolicitud      │
                    │ tipoContratacion     │
                    │ numeroVacantes       │
                    │ fechaSolicitud       │
                    │ fechaAutorizacion    │
                    │ closedAt             │
                    │ requerimientos_tecnicos (Json?)
                    │ +20 campos adicionales│
                    └──────────┬───────────┘
                               │ 1
                    ┌──────────┴───────────┐
                    │    CandidateRH       │
                    │──────────────────────│
                    │ id (PK)              │
                    │ vacancy_id (FK) ─────┼──> JobVacancy
                    │ nombre               │
                    │ cv_url               │
                    │ psych_test_url       │
                    │ estatus              │
                    │ comentarios_rh       │
                    └──────────────────────┘

                    ┌──────────────────────┐
                    │     JobActivity      │
                    │──────────────────────│
                    │ id (PK)              │
                    │ vacancyId (FK) ──────┼──> JobVacancy
                    │ activityType         │
                    │ description          │
                    │ duration             │
                    │ priority             │
                    │ isCompleted          │
                    │ completedAt          │
                    └──────────────────────┘

                    ┌──────────────────────┐
                    │   VacancyComment     │
                    │──────────────────────│
                    │ id (PK)              │
                    │ vacancy_id (FK) ─────┼──> JobVacancy
                    │ user_id (FK) ────────┼──> User
                    │ mensaje              │
                    │ createdAt            │
                    └──────────────────────┘
```

---

## 6. Dominio de Compras

### 6.1 Entidades

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `PurchaseRequest` | `purchase_requests` | Solicitudes de compra |
| `PurchaseItem` | `purchase_items` | Partidas de la solicitud |
| `PurchaseQuote` | `purchase_quotes` | Cotizaciones de proveedores |
| `PurchaseComment` | `purchase_comments` | Comentarios en solicitudes |
| `PurchaseApprover` | `purchase_approvers` | Aprobadores asignados |
| `PurchaseOrder` | `purchase_orders` | Órdenes de compra |
| `PurchaseOrderItem` | `purchase_order_items` | Partidas de orden de compra |
| `PurchaseAuditLog` | `purchase_audit_logs` | Auditoría de cambios |

### 6.2 ERD del Dominio

```
                    ┌──────────────────────┐
                    │      Employee        │
                    │──────────────────────│
                    │ id (PK)              │
                    └──────────┬───────────┘
                               │ 1
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          │ solicitanteId      │ autorizadoPorId    │
          │                    │                    │
          ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ PurchaseRequest  │  │ PurchaseRequest  │  │ PurchaseRequest  │
│ (N:1)            │  │ (N:1, opcional)  │  │ (N:1)            │
└──────────────────┘  └──────────────────┘  └──────────────────┘

                    ┌──────────────────────┐
                    │    Department        │
                    │──────────────────────│
                    │ id (PK)              │
                    └──────────┬───────────┘
                               │ 1
                               │
                    ┌──────────┴───────────┐
                    │   PurchaseRequest    │
                    │──────────────────────│
                    │ id (PK)              │
                    │ folio (autoincrement)│
                    │ solicitanteId (FK) ──┼──> Employee
                    │ departamentoId (FK) ─┼──> Department
                    │ autorizadoPorId (FK) ┼──> Employee (opcional)
                    │ estatus              │
                    │ justificacion        │
                    │ requiereAutorizacion │
                    │ fechaSolicitud       │
                    │ fechaAutorizacion    │
                    └──────────┬───────────┘
                               │ 1
                    ┌──────────┴───────────┐
                    │    PurchaseItem      │
                    │──────────────────────│
                    │ id (PK)              │
                    │ requestId (FK) ──────┼──> PurchaseRequest
                    │ productoServicio     │
                    │ cantidad             │
                    │ descripcion          │
                    └──────────────────────┘

                    ┌──────────────────────┐
                    │    PurchaseQuote     │
                    │──────────────────────│
                    │ id (PK)              │
                    │ requestId (FK) ──────┼──> PurchaseRequest
                    │ proveedor            │
                    │ monto                │
                    │ fechaCotizacion      │
                    │ archivoUrl           │
                    │ isSelected           │
                    │ comentarios          │
                    │ fechaEstimadaEntrega │
                    └──────────────────────┘

                    ┌──────────────────────┐
                    │   PurchaseComment    │
                    │──────────────────────│
                    │ id (PK)              │
                    │ requestId (FK) ──────┼──> PurchaseRequest
                    │ userId (FK) ─────────┼──> User
                    │ mensaje              │
                    │ createdAt            │
                    └──────────────────────┘

                    ┌──────────────────────┐
                    │  PurchaseApprover    │
                    │──────────────────────│
                    │ id (PK)              │
                    │ requestId (FK) ──────┼──> PurchaseRequest
                    │ employeeId (FK) ─────┼──> Employee
                    │ estatus              │
                    │ fechaRespuesta       │
                    │ comentarios          │
                    │ UNIQUE(requestId,    │
                    │        employeeId)   │
                    └──────────────────────┘

                    ┌──────────────────────┐
                    │   PurchaseAuditLog   │
                    │──────────────────────│
                    │ id (PK)              │
                    │ requestId (FK) ──────┼──> PurchaseRequest
                    │ userId               │
                    │ accion               │
                    │ valorAnterior (Json?)│
                    │ valorNuevo (Json?)   │
                    │ ip                   │
                    │ userAgent            │
                    │ createdAt            │
                    └──────────────────────┘

                    ┌──────────────────────┐
                    │    PurchaseOrder     │
                    │──────────────────────│
                    │ id (PK)              │
                    │ purchaseRequestId    │
                    │   (UQ, FK) ──────────┼──> PurchaseRequest
                    │ numero (UQ)          │
                    │ proveedor            │
                    │ monto                │
                    │ subtotal             │
                    │ iva                  │
                    │ ivaRate              │
                    │ pdfUrl               │
                    │ createdAt            │
                    └──────────┬───────────┘
                               │ 1
                    ┌──────────┴───────────┐
                    │  PurchaseOrderItem   │
                    │──────────────────────│
                    │ id (PK)              │
                    │ orderId (FK) ────────┼──> PurchaseOrder
                    │ productoServicio     │
                    │ cantidad             │
                    │ descripcion          │
                    │ precioUnitario       │
                    │ importe              │
                    └──────────────────────┘
```

---

## 7. Dominio de Seguridad

### 7.1 Entidades

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `User` | `users` | Usuarios del sistema |
| `Role` | `roles` | Roles personalizados (dinámicos) |
| `Session` | `sessions` | Sesiones JWT activas |

### 7.2 ERD del Dominio

```
                    ┌──────────────────────┐
                    │        User          │
                    │──────────────────────│
                    │ id (PK)              │
                    │ email (UQ)           │
                    │ password             │
                    │ name                 │
                    │ role                 │
                    │ accessibleModules[]  │
                    │ isActive             │
                    │ createdAt            │
                    │ updatedAt            │
                    └──────────┬───────────┘
                               │ 1
                    ┌──────────┴───────────┐
                    │       Session        │
                    │──────────────────────│
                    │ id (PK)              │
                    │ userId (FK) ─────────┼──> User
                    │ token (UQ)           │
                    │ expiresAt            │
                    │ createdAt            │
                    │ onDelete: Cascade    │
                    └──────────────────────┘

                    ┌──────────────────────┐
                    │        Role          │
                    │──────────────────────│
                    │ id (PK)              │
                    │ name (UQ)            │
                    │ description          │
                    │ color                │
                    │ icon                 │
                    │ isCustom             │
                    │ createdAt            │
                    │ updatedAt            │
                    └──────────────────────┘
                    (Independiente, sin FK)

                    ┌──────────────────────┐
                    │      Employee        │
                    │──────────────────────│
                    │ id (PK)              │
                    │ userId (UQ, FK) ─────┼──> User
                    │ ...                  │
                    └──────────────────────┘
                    (Relación 1:0..1 con User)
```

### 7.3 Relación User ↔ Employee

```
    User                          Employee
    ┌──────────┐                  ┌──────────┐
    │ id (PK)  │◄─────────────────│ userId   │
    │ ...      │   1:0..1         │ (UQ, FK) │
    └──────────┘                  │ ...      │
                                  └──────────┘

    Un User puede tener 0 o 1 Employee asociado.
    Un Employee puede tener 0 o 1 User asociado.
    La relación es opcional en ambos lados.
```

---

## 8. Enumeraciones

| # | Enum | Valores | Uso |
|---|------|---------|-----|
| 1 | `RoleType` | `EMPLEADO_BASICO`, `ADMIN`, `RH`, `SISTEMAS`, `COMPRAS`, `PRODUCCION` | Roles del sistema (campo `User.role`) |
| 2 | `ModuleType` | `EMPLEADOS`, `RECLUTAMIENTO`, `VACACIONES`, `INCIDENCIAS`, `CONFIGURACION`, `DASHBOARD`, `REPORTES`, `COMPRAS` | Módulos accesibles (campo `User.accessibleModules`) |
| 3 | `EmployeeStatus` | `Activo`, `Inactivo` | Estatus del empleado |
| 4 | `NivelJerarquico` | `PRESIDENTE`, `DIRECTOR`, `GERENTE`, `JEFE`, `COORDINADOR`, `ANALISTA`, `SUPERVISOR`, `AUX_ADMINISTRATIVO`, `OPERATIVO` | Nivel jerárquico del empleado y puesto |
| 5 | `VacancyStatus` | `Solicitada`, `Aprobada`, `Buscando`, `Cerrada` | Estados de una vacante |
| 6 | `CandidateStatus` | `En_Revision`, `Descartado`, `Seleccionado` | Estados de un candidato |
| 7 | `MotivoVacante` | `NUEVA_CREACION`, `REEMPLAZO_DEFINITIVO`, `REEMPLAZO_TEMPORAL`, `REEMPLAZO_RENUNCIA`, `REEMPLAZO_TERMINACION_CONTRATO`, `INCREMENTO_PLANTILLA`, `INCREMENTO_PRODUCCION`, `RENUNCIA`, `TERMINACION_CONTRATO`, `LICENCIA`, `LICENCIA_TEMPORAL`, `INCAPACIDAD`, `JUBILACION`, `JUBILACION_RETIRO`, `PROMOCION`, `REESTRUCTURACION`, `MATERNIDAD`, `LICENCIA_MATERNIDAD`, `VACACIONES` | Motivos de solicitud de vacante |
| 8 | `TipoContratacion` | `ADMINISTRATIVO`, `TEMPORAL`, `SINDICALIZADO`, `TIEMPO_COMPLETO`, `PERMANENTE`, `BECARIO`, `ROL_TURNOS` | Tipos de contratación |
| 9 | `PurchaseStatus` | `NUEVO`, `PENDIENTE`, `EN_AUTORIZACION`, `APROBADO`, `ENTREGADO`, `CANCELADO` | Estados de una solicitud de compra |

**Total de enums: 9**

---

## 9. Relaciones Críticas

### 9.1 Cascadas (onDelete)

| Modelo origen | Relación | Modelo destino | Acción onDelete | Impacto |
|---------------|----------|----------------|-----------------|---------|
| `Session` | N:1 | `User` | `Cascade` | Al eliminar un usuario, se eliminan todas sus sesiones |
| `EmployeeDocument` | N:1 | `Employee` | `Cascade` | Al eliminar un empleado, se eliminan todos sus documentos |
| `JobVacancy` | N:1 | `Employee` (solicitante) | `Cascade` | ⚠️ Al eliminar un empleado, se eliminan TODAS sus vacantes |
| `JobActivity` | N:1 | `JobVacancy` | `Cascade` | Al eliminar una vacante, se eliminan sus actividades |
| `CandidateRH` | N:1 | `JobVacancy` | `Cascade` | Al eliminar una vacante, se eliminan sus candidatos |
| `VacancyComment` | N:1 | `JobVacancy` | `Cascade` | Al eliminar una vacante, se eliminan sus comentarios |
| `PurchaseItem` | N:1 | `PurchaseRequest` | `Cascade` | Al eliminar una solicitud, se eliminan sus partidas |
| `PurchaseQuote` | N:1 | `PurchaseRequest` | `Cascade` | Al eliminar una solicitud, se eliminan sus cotizaciones |
| `PurchaseComment` | N:1 | `PurchaseRequest` | `Cascade` | Al eliminar una solicitud, se eliminan sus comentarios |
| `PurchaseApprover` | N:1 | `PurchaseRequest` | `Cascade` | Al eliminar una solicitud, se eliminan sus aprobadores |
| `PurchaseOrder` | N:1 | `PurchaseRequest` | `Cascade` | Al eliminar una solicitud, se elimina su orden de compra |
| `PurchaseOrderItem` | N:1 | `PurchaseOrder` | `Cascade` | Al eliminar una orden, se eliminan sus partidas |
| `SalaryHistory` | N:1 | `Employee` | `Cascade` | Al eliminar un empleado, se elimina su historial salarial |

**Total de relaciones con Cascade: 13**

### 9.2 Relaciones Opcionales

| Modelo | Campo FK | Relación | Descripción |
|--------|----------|----------|-------------|
| `Employee` | `userId` | 0..1:1 con `User` | Un empleado puede no tener usuario asociado |
| `Employee` | `puestoId` | N:1 con `JobPosition` | Un empleado puede no tener puesto asignado |
| `Employee` | `reportaAId` | N:1 con `Employee` | Un empleado puede no tener jefe directo |
| `JobVacancy` | `autorizadoPorId` | N:1 con `Employee` | Una vacante puede no tener autorizador |
| `JobVacancy` | `voBoPorId` | N:1 con `Employee` | Una vacante puede no tener VoBo |
| `JobVacancy` | `departamento_id` | N:1 con `Department` | Una vacante puede no tener departamento |
| `JobVacancy` | `jobPositionId` | N:1 con `JobPosition` | Una vacante puede no tener puesto asociado |
| `PurchaseRequest` | `autorizadoPorId` | N:1 con `Employee` | Una solicitud puede no tener autorizador |
| `PurchaseOrder` | `purchaseRequestId` | 1:1 con `PurchaseRequest` | Una solicitud puede no tener orden de compra |

**Total de relaciones opcionales: 9**

### 9.3 Relaciones Obligatorias

| Modelo | Campo FK | Relación | Descripción |
|--------|----------|----------|-------------|
| `Employee` | `departamento_id` | N:1 con `Department` | Todo empleado debe tener un departamento |
| `JobVacancy` | `solicitanteId` | N:1 con `Employee` | Toda vacante debe tener un solicitante |
| `PurchaseRequest` | `solicitanteId` | N:1 con `Employee` | Toda solicitud debe tener un solicitante |
| `PurchaseRequest` | `departamentoId` | N:1 con `Department` | Toda solicitud debe tener un departamento |
| `JobPosition` | `departamentoId` | N:1 con `Department` | Todo puesto debe tener un departamento |
| `Session` | `userId` | N:1 con `User` | Toda sesión debe tener un usuario |

**Total de relaciones obligatorias: 6**

### 9.4 Riesgos Detectados

| Riesgo | Descripción | Impacto |
|--------|-------------|---------|
| **Cascada en JobVacancy → Employee** | `onDelete: Cascade` en `solicitanteId` | Eliminar un empleado elimina todas sus vacantes (incluyendo candidatos, actividades y comentarios) |
| **AttendanceRecord sin FK** | No tiene relación con Employee ni User | Los registros del checador no están vinculados a empleados del sistema |
| **Role independiente** | El modelo `Role` no tiene relación con `User` | Los roles personalizados existen en BD pero no se asignan directamente a usuarios (se usa el campo `role` string en User) |
| **FactorIntegracion sin FK** | Catálogo independiente sin relación con Employee | Se usa desde lógica de negocio (cálculo de SDI) pero no hay FK que lo vincule |
| **PurchaseAuditLog sin FK** | `userId` es String, no FK a User | No hay integridad referencial en la auditoría |
| **User.role como String** | No es FK a Role | El rol del usuario es un string libre, no validado contra la tabla Role |

---

## 10. Estadísticas

| Métrica | Cantidad |
|---------|:--------:|
| **Modelos totales** | **23** |
| **Enums totales** | **9** |
| **Relaciones totales (FK)** | **28** |
| **Relaciones con Cascade** | **13** |
| **Relaciones opcionales** | **9** |
| **Relaciones obligatorias** | **6** |
| **Relaciones jerárquicas (auto-referencia)** | **1** (Employee → Employee) |
| **Relaciones 1:1** | **2** (User↔Employee, PurchaseRequest↔PurchaseOrder) |
| **Relaciones 1:N** | **26** |
| **Campos únicos (UQ)** | **9** (User.email, Role.name, Employee.curp, Employee.rfc, Employee.nss, Employee.clave, Session.token, PurchaseOrder.numero, PurchaseOrder.purchaseRequestId) |
| **Campos con @unique compuesto** | **2** (JobPosition[nombre, departamentoId], PurchaseApprover[requestId, employeeId]) |
| **Campos con índices** | **5** (AttendanceRecord.numeroEmpleado, AttendanceRecord.fechaHora, SalaryHistory.employeeId, SalaryHistory.fechaCambio, NotificationLog.employeeId, NotificationLog.tipo, NotificationLog.enviadoA, PurchaseAuditLog.requestId, PurchaseAuditLog.userId, PurchaseAuditLog.accion, PurchaseAuditLog.createdAt) |

---

> **Nota final:** Este documento es una fotografía del estado actual del modelo de datos definido en `backend/prisma/schema.prisma`. No propone cambios ni correcciones. Cualquier modificación al schema debe evaluar el impacto en las relaciones, cascadas y riesgos aquí documentados.


