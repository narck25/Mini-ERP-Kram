# ARQUITECTURA DEL ERP KRAM

> **Documento de Arquitectura — Fase 1: Inventario del Sistema**
> *Generado: 13/06/2026*
> *Última actualización: 13/06/2026*
> *Versión: 1.1 — Roles Estratégicos*

---

## 1. INFORMACIÓN GENERAL DEL PROYECTO

### Nombre del Sistema
**ERP KRAM** — Sistema de Gestión Empresarial

### Objetivo del ERP
Sistema ERP para la gestión integral de la empresa KRAM, que cubre:
- Gestión de empleados y expedientes (RH)
- Reclutamiento colaborativo (solicitud de vacantes, candidatos, perfil técnico)
- Control de asistencia e incidencias (integración con checador ZKTeco)
- Gestión de compras (solicitudes, cotizaciones, autorizaciones, órdenes de compra)
- Configuración del sistema (usuarios, roles, permisos)
- Reportes y estadísticas

### Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | Next.js (React) | 14+ |
| | Tailwind CSS | 3 |
| | Axios (HTTP client) | |
| | React Hook Form + Zod | Validación de formularios |
| | React Hot Toast | Notificaciones |
| **Backend** | Node.js + Express | |
| | Prisma ORM | 5+ |
| | PostgreSQL | Base de datos |
| | JWT (JSON Web Tokens) | Autenticación |
| | bcrypt | Hash de contraseñas |
| | Multer | Subida de archivos |
| | node-cron | Tareas programadas |
| **Infraestructura** | Docker / Docker Compose | Contenedores |
| | Coolify + Traefik | Despliegue (producción) |
| | Coolify Proxy | Proxy inverso |

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Next.js (Frontend)                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │  │
│  │  │   Pages  │ │Components│ │ Contexts │ │   Lib   │  │  │
│  │  │ (App Dir)│ │   (UI)   │ │ (Auth)   │ │(API,etc)│  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / JSON
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Express (Backend)                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Routes  │ │Controllers│ │Services  │ │  Middlewares   │  │
│  │  (REST)  │ │ (Lógica)  │ │(Negocio) │ │(Auth, Upload) │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Prisma ORM                                │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ SQL
                           ▼
              ┌─────────────────────┐
              │     PostgreSQL      │
              │   (Base de Datos)   │
              └─────────────────────┘
```

**Patrón arquitectónico:** REST API monolítica con frontend separado (SPA con SSR híbrido de Next.js).

---

## 2. ESTRUCTURA DEL REPOSITORIO

```
Mini-ERP-Kram/
│
├── frontend/                     # Aplicación Next.js (React)
│   ├── app/                      # App Router de Next.js
│   │   ├── layout.js             # Layout raíz (AuthProvider, Toaster)
│   │   ├── page.js               # Landing page (pública)
│   │   ├── globals.css           # Estilos globales
│   │   ├── ThemeScript.js        # Script de tema (claro/oscuro)
│   │   ├── login/                # Página de inicio de sesión
│   │   ├── register/             # Página de registro
│   │   ├── dashboard/            # Dashboard principal (protegido)
│   │   │   ├── page.js           # Dashboard genérico
│   │   │   ├── DashboardWrapper.js
│   │   │   ├── accesos/          # Gestión de accesos (solo ADMIN)
│   │   │   ├── compras/          # Gestión de compras
│   │   │   ├── mi-espacio/       # Mi Espacio (autoservicio)
│   │   │   ├── organizacion/     # Organigrama (solo ADMIN)
│   │   │   ├── profile/          # Perfil de usuario
│   │   │   └── usuarios/         # Gestión de usuarios (solo ADMIN)
│   │   ├── rh/                   # Módulo RH
│   │   │   ├── dashboard-completo/  # Dashboard RH
│   │   │   ├── empleados/        # Gestión de empleados
│   │   │   ├── incidencias/      # Incidencias / Asistencia
│   │   │   └── reclutamiento/    # Reclutamiento RH
│   │   ├── rh-dashboard/         # Redirección al dashboard RH
│   │   ├── reclutamiento/        # Portal de reclutamiento
│   │   │   ├── mis-solicitudes/  # Mis solicitudes de vacante
│   │   │   ├── solicitar-vacante/ # Solicitar nueva vacante
│   │   │   └── vacantes/         # Detalle de vacante
│   │   ├── compras/              # Portal de compras
│   │   │   ├── mis-solicitudes/  # Mis solicitudes de compra
│   │   │   └── nueva-solicitud/  # Nueva solicitud de compra
│   │   ├── my-vacancies/         # Mis vacantes (jefes de área)
│   │   └── vacancies/            # Vacantes (legacy)
│   ├── components/               # Componentes reutilizables
│   │   ├── DashboardLayout.js    # Layout principal con sidebar
│   │   ├── ProtectedRoute.js     # Protección de rutas (ACL)
│   │   ├── EmployeeForm.js       # Formulario de empleados
│   │   ├── EmployeeImport.js     # Importación CSV de empleados
│   │   ├── EmployeeTable.js      # Tabla de empleados
│   │   ├── RoleManager.js        # Gestor de roles
│   │   ├── PurchaseComments.js   # Comentarios de compras
│   │   ├── PurchaseOrderModal.js # Modal de orden de compra
│   │   ├── QuoteSelectionModal.js # Selección de cotización
│   │   ├── SendAuthorizationModal.js # Envío a autorización
│   │   └── UpcomingEventsWidget.js # Widget de eventos próximos
│   ├── contexts/                 # Contextos de React
│   │   └── AuthContext.js        # Contexto de autenticación
│   ├── hooks/                    # Custom hooks (vacío)
│   ├── lib/                      # Utilidades y clientes
│   │   ├── api.js                # Cliente Axios (todos los endpoints)
│   │   ├── auth.js               # Utilidades de autenticación (server)
│   │   ├── rolesConfig.js        # Configuración visual de roles (fallback)
│   │   └── employeePdfExport.js  # Exportación PDF de empleados
│   └── utils/                    # Utilidades
│       └── dateUtils.js          # Utilidades de fechas
│
├── backend/                      # API REST (Express + Prisma)
│   ├── prisma/                   # ORM y base de datos
│   │   ├── schema.prisma         # Esquema de datos (modelos, enums)
│   │   ├── migrations/           # Migraciones de base de datos
│   │   ├── seed.js               # Seed principal
│   │   ├── seed-demo.js          # Seed de demostración
│   │   ├── seed-prod.js          # Seed de producción
│   │   ├── seed-estructura-rh.js # Seed de estructura RH
│   │   └── seed-factores.js      # Seed de factores de integración
│   ├── src/                      # Código fuente del backend
│   │   ├── index.js              # Entry point (Express app)
│   │   ├── config/               # Configuraciones
│   │   │   ├── modules.config.js # Configuración de módulos
│   │   │   └── roles.config.js   # Configuración de presets por rol
│   │   ├── controllers/          # Controladores (lógica de endpoints)
│   │   │   ├── auth.controller.js
│   │   │   ├── employee.controller.js
│   │   │   ├── employee-core.controller.js
│   │   │   ├── employee-csv.controller.js
│   │   │   ├── employee-org.controller.js
│   │   │   ├── employee-photo.controller.js
│   │   │   ├── employeeDocument.controller.js
│   │   │   ├── organization.controller.js
│   │   │   ├── permission.controller.js
│   │   │   ├── recruitment.controller.js
│   │   │   ├── stats.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── purchase.controller.js
│   │   │   ├── purchase-comment.controller.js
│   │   │   └── attendance.controller.js
│   │   ├── routes/               # Rutas Express
│   │   │   ├── auth.routes.js
│   │   │   ├── employee.routes.js
│   │   │   ├── employeeDocument.routes.js
│   │   │   ├── recruitment.routes.js
│   │   │   ├── stats.routes.js
│   │   │   ├── permission.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── organization.routes.js
│   │   │   ├── purchase.routes.js
│   │   │   ├── attendance.routes.js
│   │   │   ├── roles.routes.js
│   │   │   ├── notifications.routes.js
│   │   │   └── seed.routes.js
│   │   ├── middlewares/          # Middlewares
│   │   │   ├── auth.middleware.js # JWT, requireRole, requireModule
│   │   │   └── upload.middleware.js # Multer (file uploads)
│   │   ├── services/             # Lógica de negocio
│   │   │   ├── audit.service.js
│   │   │   ├── birthdayAnniversary.service.js
│   │   │   ├── email.service.js
│   │   │   ├── sse-manager.service.js
│   │   │   └── purchases/        # Servicios de compras
│   │   │       ├── approval.service.js
│   │   │       ├── comparison.service.js
│   │   │       ├── purchase-notification.service.js
│   │   │       ├── purchase-order.service.js
│   │   │       ├── purchase.service.js
│   │   │       ├── quote.service.js
│   │   │       └── status-notification.service.js
│   │   └── utils/                # Utilidades
│   │       ├── auth.utils.js
│   │       ├── csvMapper.js
│   │       └── salaryCalculator.js
│   ├── uploads/                  # Archivos subidos (enlace simbólico)
│   └── scripts/                  # Scripts auxiliares
│
├── uploads/                      # Archivos subidos (carpeta compartida)
│   ├── photos/                   # Fotos de empleados
│   ├── cvs/                      # CVs de candidatos
│   ├── employee-documents/       # Documentos de empleados
│   ├── psych-tests/              # Tests psicométricos
│   └── purchase-quotes/          # Cotizaciones de compras
│
├── init-db/                      # Scripts de inicialización de BD
├── referencias/                  # Documentación de referencia
├── docs/                         # Documentación del proyecto
│
├── docker-compose.yml            # Orquestación Docker (desarrollo)
├── docker-compose.prod.yml       # Orquestación Docker (producción)
├── start-backend.bat             # Script de inicio (Windows)
├── start-frontend.bat            # Script de inicio (Windows)
├── .clinerules                   # Reglas de desarrollo (AI)
├── MANUAL_RH.md                  # Manual de RH
├── MANUAL_USUARIO.md             # Manual de usuario
├── README.md                     # README del proyecto
└── package.json                  # Scripts raíz
```

### Propósito de Directorios Importantes

| Directorio | Propósito |
|-----------|-----------|
| `frontend/app/` | Páginas y rutas de Next.js (App Router) |
| `frontend/components/` | Componentes React reutilizables |
| `frontend/contexts/` | Contextos de React (AuthContext) |
| `frontend/lib/` | Cliente API, utilidades de autenticación, configuración de roles |
| `frontend/utils/` | Utilidades genéricas (fechas) |
| `backend/src/config/` | Configuraciones centralizadas (módulos, roles) |
| `backend/src/controllers/` | Controladores REST (lógica de endpoints) |
| `backend/src/routes/` | Definición de rutas Express |
| `backend/src/middlewares/` | Middlewares (autenticación, subida de archivos) |
| `backend/src/services/` | Lógica de negocio (servicios) |
| `backend/prisma/` | Esquema de datos, migraciones, seeds |
| `uploads/` | Archivos subidos por usuarios |

---

## 3. INVENTARIO DE MÓDULOS

**Fuente:** `backend/src/config/modules.config.js`

| # | Key | Nombre Visible | Estado | Descripción |
|---|-----|---------------|--------|-------------|
| 1 | `EMPLEADOS` | Empleados | ✅ `enabled: true` | Gestión de empleados y expedientes |
| 2 | `RECLUTAMIENTO` | Reclutamiento | ✅ `enabled: true` | Gestión de vacantes y candidatos |
| 3 | `VACACIONES` | Vacaciones | ✅ `enabled: true` | Solicitud y aprobación de vacaciones |
| 4 | `INCIDENCIAS` | Incidencias | ✅ `enabled: true` | Reporte y seguimiento de incidencias |
| 5 | `CONFIGURACION` | Configuración | ✅ `enabled: true` | Configuración del sistema |
| 6 | `REPORTES` | Reportes | ✅ `enabled: true` | Generación de reportes y estadísticas |
| 7 | `COMPRAS` | Compras | ✅ `enabled: true` | Gestión de compras |

**Módulo adicional en BD (enum `ModuleType` en `schema.prisma`):**
- `DASHBOARD` — Panel principal (siempre activo, no listado en `modules.config.js`)

**Total de módulos: 8** (7 en `modules.config.js` + `DASHBOARD` como implícito)

---

## 4. INVENTARIO DE ROLES

**Fuente primaria:** `backend/src/routes/roles.routes.js` → `SYSTEM_ROLES`
**Fuente de fallback visual:** `frontend/lib/rolesConfig.js`

| # | ID | Nombre | Color | Icono | Descripción | Tipo | Orden |
|---|-----|--------|-------|-------|-------------|------|-------|
| 1 | `ADMIN` | Administrador | `bg-purple-100 text-purple-800` | 👑 | Administrador del sistema — control técnico global | Estratégico | 0 |
| 2 | `RH` | Recursos Humanos | `bg-blue-100 text-blue-800` | 👥 | Gestión de personal y reclutamiento — control operativo global autorizado por Dirección General | Estratégico | 1 |
| 3 | `SISTEMAS` | Sistemas | `bg-green-100 text-green-800` | 💻 | Soporte técnico y sistemas | Departamental | 2 |
| 4 | `COMPRAS` | Compras | `bg-yellow-100 text-yellow-800` | 🛒 | Gestión de compras y proveedores | Departamental | 3 |
| 5 | `PRODUCCION` | Producción | `bg-red-100 text-red-800` | 🏭 | Gestión de producción | Departamental | 4 |
| 6 | `EMPLEADO_BASICO` | Empleado | `bg-gray-100 text-gray-800` | 👤 | Acceso básico al sistema | Base | 5 |

**Total de roles del sistema: 6**

### Roles Estratégicos

El ERP KRAM reconoce dos **Roles Estratégicos** con bypass global, cada uno con responsabilidades distintas:

| Rol | Tipo | Responsabilidad | Ámbito |
|-----|------|----------------|--------|
| **ADMIN** | Control técnico global | Administración del sistema, configuración técnica, operaciones críticas (Nivel C) | Todo el sistema |
| **RH** | Control operativo global autorizado por Dirección General | Gestión de personal, reclutamiento, configuración de accesos, supervisión operativa | Todos los módulos y datos |

**Fundamento organizacional:** El rol RH representa la mano derecha operativa de Presidencia dentro de Comercializadora KRAM. Por decisión explícita de Dirección General, RH posee acceso global al sistema, al mismo nivel funcional que ADMIN, aunque con responsabilidades distintas.

> ⚠️ **Política de seguridad:** Ningún otro rol deberá recibir privilegios equivalentes a ADMIN o RH sin autorización expresa de Presidencia.

> **Nota:** El backend también soporta roles personalizados (almacenados en tabla `roles` de BD), creados desde la UI de Gestión de Accesos. Estos no se listan aquí por ser dinámicos.

---

## 5. INVENTARIO DE PRESETS

**Fuente:** `backend/src/config/roles.config.js`

```
ADMIN
  ↓
  DASHBOARD, EMPLEADOS, RECLUTAMIENTO, VACACIONES,
  INCIDENCIAS, CONFIGURACION, REPORTES, COMPRAS
  (8 módulos — acceso total)

RH
  ↓
  DASHBOARD, EMPLEADOS, RECLUTAMIENTO, VACACIONES,
  INCIDENCIAS, REPORTES
  (6 módulos)

SISTEMAS
  ↓
  DASHBOARD, CONFIGURACION, REPORTES
  (3 módulos)

COMPRAS
  ↓
  DASHBOARD, COMPRAS, REPORTES
  (3 módulos)

PRODUCCION
  ↓
  DASHBOARD, REPORTES
  (2 módulos)

EMPLEADO_BASICO
  ↓
  DASHBOARD
  (1 módulo)
```

**Total de presets: 6**

---

## RESUMEN DEL INVENTARIO

| Elemento | Cantidad |
|----------|----------|
| **Módulos del sistema** | **8** (7 en `modules.config.js` + `DASHBOARD` implícito) |
| **Roles del sistema** | **6** (`ADMIN`, `RH`, `SISTEMAS`, `COMPRAS`, `PRODUCCION`, `EMPLEADO_BASICO`) |
| **Presets de módulos por rol** | **6** (uno por cada rol del sistema) |

---

---

## 6. INVENTARIO DE ENDPOINTS (API REST)

**Fuente:** `backend/src/routes/` (13 archivos de rutas)
**Base URL:** `/api`

### 6.1 Autenticación — `auth.routes.js` (montado en `/api/auth`)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| POST | `/api/auth/register` | Pública | `AuthController.register` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Pública | `AuthController.login` | Iniciar sesión |
| GET | `/api/auth/profile` | `verifyToken` | `AuthController.getProfile` | Obtener perfil del usuario autenticado |
| PUT | `/api/auth/profile` | `verifyToken` | `AuthController.updateProfile` | Actualizar perfil |
| POST | `/api/auth/logout` | `verifyToken` | `AuthController.logout` | Cerrar sesión |
| POST | `/api/auth/change-password` | `verifyToken` | `AuthController.changePassword` | Cambiar contraseña |
| GET | `/api/auth/admin/users` | `verifyToken` + `requireAdmin` | Inline | Listar usuarios (solo ADMIN) — pendiente implementar |
| GET | `/api/auth/test/admin` | `verifyToken` + `requireAdmin` | Inline | Test de acceso ADMIN |
| GET | `/api/auth/test/rh` | `verifyToken` + `requireRHOrAdmin` | Inline | Test de acceso RH |
| GET | `/api/auth/test/sistemas` | `verifyToken` + `requireSistemasOrAdmin` | Inline | Test de acceso SISTEMAS |
| GET | `/api/auth/test/compras` | `verifyToken` + `requireComprasOrAdmin` | Inline | Test de acceso COMPRAS |
| GET | `/api/auth/test/produccion` | `verifyToken` + `requireProduccionOrAdmin` | Inline | Test de acceso PRODUCCION |

### 6.2 Empleados — `employee.routes.js` (montado en `/api`)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| GET | `/api/employees/template` | `requireRHOrAdmin` | `employeeCsvController.downloadImportTemplate` | Descargar plantilla CSV para importación |
| POST | `/api/employees/import` | `requireRHOrAdmin` + Multer | `employeeCsvController.importEmployees` | Importar empleados desde CSV |
| GET | `/api/employees/export` | `requireRHOrAdmin` | `employeeCsvController.exportEmployees` | Exportar empleados a CSV |
| GET | `/api/employees` | `requireModule('EMPLEADOS')` | `employeeCoreController.getAllEmployees` | Listar todos los empleados |
| GET | `/api/employees/me` | `verifyToken` | `employeeCoreController.getCurrentEmployee` | Obtener empleado asociado al usuario autenticado |
| GET | `/api/employees/stats` | `requireRHOrAdmin` | `employeeOrgController.getEmployeeStats` | Estadísticas de empleados |
| POST | `/api/employees` | `requireRHOrAdmin` | `employeeCoreController.createEmployee` | Crear nuevo empleado |
| GET | `/api/employees/:id` | `requireRHOrAdmin` | `employeeCoreController.getEmployeeById` | Obtener empleado por ID |
| PUT | `/api/employees/:id` | `requireRHOrAdmin` | `employeeCoreController.updateEmployee` | Actualizar empleado |
| DELETE | `/api/employees/:id` | `requireRHOrAdmin` | `employeeCoreController.deleteEmployee` | Eliminar empleado (lógico) |
| DELETE | `/api/employees/:id/permanent` | `requireRHOrAdmin` | `employeeCoreController.deleteEmployeePermanently` | Eliminar empleado permanentemente |
| GET | `/api/departments` | `verifyToken` | `employeeOrgController.getDepartments` | Listar departamentos |
| POST | `/api/departments` | `requireRHOrAdmin` | `employeeOrgController.createDepartment` | Crear departamento |
| PUT | `/api/departments/:id` | `requireRHOrAdmin` | `employeeOrgController.updateDepartment` | Actualizar departamento |
| DELETE | `/api/departments/:id` | `requireRHOrAdmin` | `employeeOrgController.deleteDepartment` | Eliminar departamento |
| GET | `/api/job-positions` | `verifyToken` | `employeeOrgController.getAllJobPositions` | Listar puestos de trabajo |
| POST | `/api/job-positions` | `requireRHOrAdmin` | `employeeOrgController.createJobPosition` | Crear puesto |
| PUT | `/api/job-positions/:id` | `requireRHOrAdmin` | `employeeOrgController.updateJobPosition` | Actualizar puesto |
| DELETE | `/api/job-positions/:id` | `requireRHOrAdmin` | `employeeOrgController.deleteJobPosition` | Eliminar puesto |
| GET | `/api/managers` | `verifyToken` | `employeeOrgController.getManagers` | Obtener jefes directos |
| POST | `/api/employees/:id/photo` | `requireRHOrAdmin` + Multer | `employeePhotoController.uploadProfilePhoto` | Subir foto de perfil |
| GET | `/api/departments/:id/job-positions` | `verifyToken` | `employeeOrgController.getJobPositionsByDepartment` | Puestos por departamento |
| GET | `/api/employees/:id/salary-history` | `requireRHOrAdmin` | `employeeCoreController.getSalaryHistory` | Historial de sueldos |

### 6.3 Documentos de Empleados — `employeeDocument.routes.js` (montado en `/api`)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| GET | `/api/employee/:employeeId/documents` | `requireModule('EMPLEADOS')` | `employeeDocumentController.getEmployeeDocuments` | Listar documentos de un empleado |
| GET | `/api/employee-documents/allowed-types` | `requireModule('EMPLEADOS')` | `employeeDocumentController.getAllowedDocumentTypes` | Tipos de documentos permitidos |
| POST | `/api/employee/:employeeId/documents` | `requireRHOrAdmin` + Multer | `employeeDocumentController.uploadEmployeeDocument` | Subir documento |
| GET | `/api/employee-documents/:documentId/download` | `requireModule('EMPLEADOS')` | `employeeDocumentController.downloadEmployeeDocument` | Descargar documento |
| DELETE | `/api/employee-documents/:documentId` | `requireRHOrAdmin` | `employeeDocumentController.deleteEmployeeDocument` | Eliminar documento |

### 6.4 Reclutamiento — `recruitment.routes.js` (montado en `/api`)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| POST | `/api/recruitment/vacancies` | `requireModule('RECLUTAMIENTO')` | `recruitmentController.createVacancyRequest` | Crear solicitud de vacante (jefes de área) |
| GET | `/api/recruitment/my-vacancies` | `requireModule('RECLUTAMIENTO')` | `recruitmentController.getMyVacancyRequests` | Mis solicitudes de vacante |
| PUT | `/api/recruitment/vacancies/:id/technical-profile` | `requireModule('RECLUTAMIENTO')` | `recruitmentController.updateTechnicalProfile` | Actualizar perfil técnico |
| POST | `/api/recruitment/vacancies/:id/activities` | `requireModule('RECLUTAMIENTO')` | `recruitmentController.createJobActivities` | Crear actividades del puesto |
| GET | `/api/recruitment/vacancies` | `requireModule('RECLUTAMIENTO')` | `recruitmentController.getAllVacancyRequests` | Listar todas las vacantes (RH) |
| PUT | `/api/recruitment/vacancies/:id/approve` | `requireRHOrAdmin` | `recruitmentController.approveVacancyRequest` | Aprobar solicitud de vacante |
| PUT | `/api/recruitment/vacancies/:id/close` | `requireRHOrAdmin` | `recruitmentController.closeVacancyRequest` | Cerrar vacante |
| GET | `/api/recruitment/vacancies/stats` | `requireModule('RECLUTAMIENTO')` | `recruitmentController.getVacancyRequestStats` | Estadísticas de vacantes |
| POST | `/api/recruitment/vacancies/direct` | `requireRHOrAdmin` | `recruitmentController.createDirectVacancy` | Crear vacante directa (Fast-Track RH) |
| GET | `/api/recruitment/vacancies/:id` | `requireModule('RECLUTAMIENTO')` | `recruitmentController.getVacancyRequestById` | Obtener detalle de vacante |
| POST | `/api/recruitment/vacancies/:id/comments` | `requireModule('RECLUTAMIENTO')` | `recruitmentController.addComment` | Agregar comentario a vacante |
| POST | `/api/recruitment/vacancies/:vacancy_id/candidates` | `requireRHOrAdmin` + Multer | `recruitmentController.createCandidate` | Registrar candidato (CV + psicométrico) |
| PUT | `/api/recruitment/candidates/:candidate_id/observations` | `requireRHOrAdmin` | `recruitmentController.updateCandidateObservations` | Actualizar observaciones de candidato |
| PUT | `/api/recruitment/candidates/:candidate_id/documents` | `requireRHOrAdmin` + Multer | `recruitmentController.updateCandidateDocuments` | Actualizar documentos de candidato |
| PUT | `/api/recruitment/candidates/:candidate_id/vote` | `requireModule('RECLUTAMIENTO')` | `recruitmentController.updateCandidateVote` | Votar por candidato (like/dislike) |
| PUT | `/api/recruitment/candidates/:candidate_id/select` | `requireModule('RECLUTAMIENTO')` | `recruitmentController.selectCandidate` | Seleccionar candidato final |
| GET | `/api/recruitment/candidates/:candidate_id/cv` | `requireModule('RECLUTAMIENTO')` | `recruitmentController.downloadCandidateCV` | Descargar CV de candidato |
| DELETE | `/api/recruitment/vacancies/:id` | `requireRHOrAdmin` | `recruitmentController.deleteVacancy` | Eliminar vacante |
| PUT | `/api/recruitment/activities/:activityId` | `requireModule('RECLUTAMIENTO')` | `recruitmentController.updateActivity` | Actualizar actividad |
| PUT | `/api/recruitment/vacancies/:id/cancel` | `requireModule('RECLUTAMIENTO')` | `recruitmentController.cancelVacancy` | Cancelar vacante (solicitante) |

### 6.5 Estadísticas — `stats.routes.js` (montado en `/api`)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| GET | `/api/stats/rh/dashboard` | `requireModule('EMPLEADOS')` | `statsController.getRHDashboardStats` | Dashboard RH |
| GET | `/api/stats/my-dashboard` | `requireModule('EMPLEADOS')` | `statsController.getMyDashboardStats` | Dashboard de Mi Espacio (jefes) |
| GET | `/api/stats/system` | `requireModule('CONFIGURACION')` | `statsController.getSystemStats` | Estadísticas del sistema (solo ADMIN) |

### 6.6 Permisos — `permission.routes.js` (montado en `/api`)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| GET | `/api/permissions/users` | `requireRole(['ADMIN', 'RH'])` | `PermissionController.getAllUsersWithPermissions` | Usuarios con permisos |
| GET | `/api/permissions/modules` | `requireRole(['ADMIN', 'RH'])` | `PermissionController.getAvailableModules` | Módulos disponibles |
| PUT | `/api/permissions/users/:id` | `requireRole(['ADMIN', 'RH'])` | `PermissionController.updateUserPermissions` | Actualizar permisos de usuario |
| GET | `/api/permissions/me` | `verifyToken` | `PermissionController.getCurrentUserPermissions` | Permisos del usuario actual |

### 6.7 Usuarios — `user.routes.js` (montado en `/api/users`)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| POST | `/api/users/:id/reset-password` | `verifyToken` + `requireRole(['ADMIN', 'RH'])` | `UserController.resetPassword` | Restablecer contraseña |
| GET | `/api/users` | `verifyToken` + `requireRole(['ADMIN'])` | `UserController.getAllUsers` | Listar todos los usuarios |
| GET | `/api/users/stats` | `verifyToken` + `requireRole(['ADMIN'])` | `UserController.getUserStats` | Estadísticas de usuarios |
| GET | `/api/users/:id` | `verifyToken` + `requireRole(['ADMIN'])` | `UserController.getUserById` | Obtener usuario por ID |
| POST | `/api/users` | `verifyToken` + `requireRole(['ADMIN'])` | `UserController.createUser` | Crear nuevo usuario |
| PUT | `/api/users/:id` | `verifyToken` + `requireRole(['ADMIN'])` | `UserController.updateUser` | Actualizar usuario |
| DELETE | `/api/users/:id` | `verifyToken` + `requireRole(['ADMIN'])` | `UserController.deleteUser` | Eliminar usuario |

### 6.8 Organización — `organization.routes.js` (montado en `/api`)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| GET | `/api/departments` | `requireModule('EMPLEADOS')` | `organizationController.getAllDepartments` | Listar departamentos |
| GET | `/api/departments/:id` | `requireModule('EMPLEADOS')` | `organizationController.getDepartmentById` | Departamento por ID |
| POST | `/api/departments` | `requireModule('EMPLEADOS')` | `organizationController.createDepartment` | Crear departamento |
| PUT | `/api/departments/:id` | `requireModule('EMPLEADOS')` | `organizationController.updateDepartment` | Actualizar departamento |
| DELETE | `/api/departments/:id` | `requireModule('EMPLEADOS')` | `organizationController.deleteDepartment` | Eliminar departamento |
| GET | `/api/job-positions` | `requireModule('EMPLEADOS')` | `organizationController.getAllJobPositions` | Listar puestos |
| GET | `/api/job-positions/:id` | `requireModule('EMPLEADOS')` | `organizationController.getJobPositionById` | Puesto por ID |
| POST | `/api/job-positions` | `requireModule('EMPLEADOS')` | `organizationController.createJobPosition` | Crear puesto |
| PUT | `/api/job-positions/:id` | `requireModule('EMPLEADOS')` | `organizationController.updateJobPosition` | Actualizar puesto |
| DELETE | `/api/job-positions/:id` | `requireModule('EMPLEADOS')` | `organizationController.deleteJobPosition` | Eliminar puesto |
| GET | `/api/departments/:departmentId/job-positions` | `requireModule('EMPLEADOS')` | `organizationController.getJobPositionsByDepartment` | Puestos por departamento |
| GET | `/api/organization/stats` | `requireModule('EMPLEADOS')` | `organizationController.getOrganizationStats` | Estadísticas de organización |

### 6.9 Compras — `purchase.routes.js` (montado en `/api`)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| POST | `/api/purchases` | `requireModule('COMPRAS')` | `PurchaseController.createRequest` | Crear solicitud de compra |
| GET | `/api/purchases/my` | `requireModule('COMPRAS')` | `PurchaseController.getMyRequests` | Mis solicitudes de compra |
| GET | `/api/purchases` | `requireModule('COMPRAS')` + `requireRole(['ADMIN', 'COMPRAS'])` | `PurchaseController.getAllRequests` | Todas las solicitudes |
| GET | `/api/purchases/details/:id` | `requireModule('COMPRAS')` | `PurchaseController.getRequestDetails` | Detalle de solicitud |
| POST | `/api/purchases/:id/quotes` | `requireModule('COMPRAS')` + `requireRole(['ADMIN', 'COMPRAS'])` | `PurchaseController.uploadQuotes` | Subir cotizaciones |
| POST | `/api/purchases/:id/select-quote` | `requireModule('COMPRAS')` + `requireRole(['ADMIN', 'COMPRAS'])` | `PurchaseController.selectQuote` | Seleccionar cotización |
| POST | `/api/purchases/:id/authorize` | `requireModule('COMPRAS')` + `requireRole(['ADMIN', 'COMPRAS'])` | `PurchaseController.authorizeRequest` | Autorizar solicitud |
| POST | `/api/purchases/:id/deliver` | `requireModule('COMPRAS')` | `PurchaseController.markAsDelivered` | Marcar como entregado |
| GET | `/api/purchases/:id/potential-approvers` | `requireModule('COMPRAS')` + `requireRole(['ADMIN', 'COMPRAS'])` | `PurchaseController.getPotentialApprovers` | Aprobadores potenciales |
| POST | `/api/purchases/:id/assign-approvers` | `requireModule('COMPRAS')` + `requireRole(['ADMIN', 'COMPRAS'])` | `PurchaseController.assignApprovers` | Asignar aprobadores |
| POST | `/api/purchases/:id/send-authorization` | `requireModule('COMPRAS')` + `requireRole(['ADMIN', 'COMPRAS'])` | `PurchaseController.sendAuthorization` | Enviar a autorización |
| POST | `/api/purchases/:id/cancel` | `requireModule('COMPRAS')` | `PurchaseController.cancelRequest` | Cancelar solicitud |
| POST | `/api/purchases/:id/quotes/:quoteId/upload` | `requireModule('COMPRAS')` + `requireRole(['ADMIN', 'COMPRAS'])` + Multer | `PurchaseController.uploadQuoteFile` | Subir archivo a cotización |
| POST | `/api/purchases/:id/quotes/upload-with-file` | `requireModule('COMPRAS')` + `requireRole(['ADMIN', 'COMPRAS'])` + Multer | `PurchaseController.uploadQuoteWithFile` | Subir cotización con archivo |
| POST | `/api/purchases/:id/upload-quote-file` | `requireModule('COMPRAS')` + `requireRole(['ADMIN', 'COMPRAS'])` + Multer | `PurchaseController.uploadQuoteFileForNewQuote` | Subir archivo para nueva cotización |
| PUT | `/api/purchases/:id/quotes/:quoteId/amount` | `requireModule('COMPRAS')` + `requireRole(['ADMIN', 'COMPRAS'])` | `PurchaseController.updateQuoteAmount` | Actualizar monto de cotización |
| GET | `/api/purchases/:id/comparison` | `requireModule('COMPRAS')` | `PurchaseController.getQuoteComparison` | Comparativa de cotizaciones |
| GET | `/api/purchases/:id/purchase-order` | `requireModule('COMPRAS')` | `PurchaseController.getPurchaseOrder` | Obtener orden de compra |
| POST | `/api/purchases/:id/purchase-order` | `requireModule('COMPRAS')` + `requireRole(['ADMIN', 'COMPRAS'])` | `PurchaseController.generatePurchaseOrder` | Generar orden de compra |
| GET | `/api/purchase-orders` | `requireModule('COMPRAS')` + `requireRole(['ADMIN', 'COMPRAS'])` | `PurchaseController.getAllPurchaseOrders` | Listar órdenes de compra |
| POST | `/api/purchases/:id/regenerate-order` | `requireModule('COMPRAS')` + `requireRole(['ADMIN', 'COMPRAS'])` | `PurchaseController.regeneratePurchaseOrder` | Regenerar orden de compra |
| GET | `/api/purchases/:id/audit` | `requireModule('COMPRAS')` + `requireRole(['ADMIN', 'COMPRAS'])` | `PurchaseController.getAuditHistory` | Historial de auditoría |
| GET | `/api/purchases/:id/comments/stream` | `verifyTokenFromQuery` + `requireModule('COMPRAS')` | `PurchaseCommentController.streamComments` | SSE: Stream de comentarios en tiempo real |
| GET | `/api/purchases/:id/comments` | `requireModule('COMPRAS')` | `PurchaseCommentController.getComments` | Obtener comentarios |
| POST | `/api/purchases/:id/comments` | `requireModule('COMPRAS')` | `PurchaseCommentController.addComment` | Agregar comentario |

### 6.10 Incidencias / Asistencia — `attendance.routes.js` (montado en `/api/incidencias`)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| POST | `/api/incidencias/upload` | `verifyToken` + `requireModule('INCIDENCIAS')` + Multer | `AttendanceController.uploadCSV` | Subir CSV del checador ZKTeco |
| GET | `/api/incidencias/` | `verifyToken` + `requireModule('INCIDENCIAS')` | `AttendanceController.getRecords` | Obtener registros por rango de fechas |

### 6.11 Roles y Módulos — `roles.routes.js` (montado en `/api`)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| GET | `/api/roles` | `verifyToken` | Inline | Listar todos los roles (sistema + personalizados) |
| POST | `/api/roles` | `verifyToken` + `requireRole(['ADMIN'])` | Inline | Crear rol personalizado |
| PUT | `/api/roles/:id` | `verifyToken` + `requireRole(['ADMIN'])` | Inline | Actualizar rol personalizado |
| DELETE | `/api/roles/:id` | `verifyToken` + `requireRole(['ADMIN'])` | Inline | Eliminar rol personalizado |
| GET | `/api/modules` | `verifyToken` | Inline | Listar módulos disponibles |
| GET | `/api/roles/presets` | `verifyToken` | Inline | Obtener presets de módulos por rol |

### 6.12 Notificaciones — `notifications.routes.js` (montado en `/api`)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| GET | `/api/notifications/upcoming` | `verifyToken` | Inline | Próximos cumpleaños y aniversarios |
| POST | `/api/notifications/check-now` | `verifyToken` + `requireAdminOrRH` | Inline | Ejecutar verificación manual |
| GET | `/api/notifications/logs` | `verifyToken` + `requireAdminOrRH` | Inline | Historial de notificaciones enviadas |

### 6.13 Seed / Reset — `seed.routes.js` (montado en `/api`)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| POST | `/api/seed/reset` | `verifyToken` + `requireRole(['ADMIN'])` | Inline | Resetear BD y ejecutar seed de producción |

### 6.14 Health Check — `index.js` (inline)

| Método | Ruta | Protección | Descripción |
|--------|------|-----------|-------------|
| GET | `/api/health` | Pública | Estado del servidor, uptime, directorio de uploads |

---

## RESUMEN DE ENDPOINTS

| Módulo / Archivo | Endpoints | Endpoints Públicos | Endpoints Protegidos |
|-----------------|-----------|-------------------|---------------------|
| Autenticación (`auth.routes.js`) | 12 | 2 | 10 |
| Empleados (`employee.routes.js`) | 23 | 0 | 23 |
| Documentos (`employeeDocument.routes.js`) | 5 | 0 | 5 |
| Reclutamiento (`recruitment.routes.js`) | 20 | 0 | 20 |
| Estadísticas (`stats.routes.js`) | 3 | 0 | 3 |
| Permisos (`permission.routes.js`) | 4 | 0 | 4 |
| Usuarios (`user.routes.js`) | 7 | 0 | 7 |
| Organización (`organization.routes.js`) | 12 | 0 | 12 |
| Compras (`purchase.routes.js`) | 27 | 0 | 27 |
| Incidencias (`attendance.routes.js`) | 2 | 0 | 2 |
| Roles y Módulos (`roles.routes.js`) | 6 | 0 | 6 |
| Notificaciones (`notifications.routes.js`) | 3 | 0 | 3 |
| Seed (`seed.routes.js`) | 1 | 0 | 1 |
| Health Check (`index.js`) | 1 | 1 | 0 |
| **TOTAL** | **126** | **3** | **123** |

---

## LEYENDA DE PROTECCIONES

| Middleware | Descripción |
|-----------|-------------|
| `verifyToken` | Verifica JWT en header `Authorization: Bearer <token>` |
| `verifyTokenFromQuery` | Verifica JWT desde query param `?token=` (para SSE) |
| `requireModule('MODULO')` | Verifica que el usuario tenga el módulo en `accessibleModules` |
| `requireRole(['ADMIN', 'RH'])` | Verifica que el rol del usuario esté en la lista permitida |
| `requireRHOrAdmin()` | Atajo para `requireRole(['ADMIN', 'RH'])` |
| `requireAdmin()` | Atajo para `requireRole(['ADMIN'])` |
| `requireSistemasOrAdmin()` | Atajo para `requireRole(['ADMIN', 'SISTEMAS'])` |
| `requireComprasOrAdmin()` | Atajo para `requireRole(['ADMIN', 'COMPRAS'])` |
| `requireProduccionOrAdmin()` | Atajo para `requireRole(['ADMIN', 'PRODUCCION'])` |
| `requireAdminOrRH` | Inline en `notifications.routes.js` (verifica rol en req.user.role) |
| Multer | Middleware de subida de archivos (multipart/form-data) |

---

## 7. INVENTARIO DE ENTIDADES Y RELACIONES (BASE DE DATOS)

**Fuente:** `backend/prisma/schema.prisma`
**Motor:** PostgreSQL vía Prisma ORM

### 7.1 Diagrama de Entidades

```
┌─────────────────────────────────────────────────────────────────┐
│                         SISTEMA KRAM                            │
│                                                                 │
│  ┌──────────┐     ┌──────────┐     ┌──────────────────────┐    │
│  │   User   │1──0.1│ Employee │1──*│  EmployeeDocument    │    │
│  └──────────┘     └──────────┘     └──────────────────────┘    │
│       │                 │                                       │
│       │                 │1                                      │
│       │                 ├────────────────────┐                  │
│       │                 │*                   │*                 │
│       │          ┌──────────────┐    ┌──────────────┐          │
│       │          │  Department  │    │  JobPosition │          │
│       │          └──────────────┘    └──────────────┘          │
│       │                 │1                  │1                  │
│       │                 │*                  │*                  │
│       │          ┌──────────────┐    ┌──────────────┐          │
│       │          │ JobVacancy   │    │  Employee    │          │
│       │          └──────────────┘    │ (reportaA)   │          │
│       │                 │            └──────────────┘          │
│       │                 ├──* CandidateRH                        │
│       │                 ├──* JobActivity                        │
│       │                 ├──* VacancyComment ──── User           │
│       │                                                        │
│       │  ┌─────────────────────────────────────────────┐       │
│       │  │           MÓDULO DE COMPRAS                 │       │
│       │  │                                             │       │
│       │  │  PurchaseRequest ──*── PurchaseItem         │       │
│       │  │       │──*── PurchaseQuote                  │       │
│       │  │       │──*── PurchaseComment ──── User      │       │
│       │  │       │──*── PurchaseApprover ──── Employee │       │
│       │  │       │──*── PurchaseAuditLog               │       │
│       │  │       │──1── PurchaseOrder ──*── PurchaseOrderItem│  │
│       │  └─────────────────────────────────────────────┘       │
│       │                                                        │
│       │  ┌─────────────────────────────────────────────┐       │
│       │  │         MÓDULO DE INCIDENCIAS               │       │
│       │  │                                             │       │
│       │  │  AttendanceRecord (independiente)           │       │
│       │  └─────────────────────────────────────────────┘       │
│       │                                                        │
│       │  ┌─────────────────────────────────────────────┐       │
│       │  │         MÓDULO DE RH / NÓMINA               │       │
│       │  │                                             │       │
│       │  │  SalaryHistory ──── Employee                │       │
│       │  │  NotificationLog ──── Employee              │       │
│       │  │  FactorIntegracion (catálogo)               │       │
│       │  └─────────────────────────────────────────────┘       │
│       │                                                        │
│       │  ┌─────────────────────────────────────────────┐       │
│       │  │         SEGURIDAD                           │       │
│       │  │                                             │       │
│       │  │  Role (roles personalizados)                │       │
│       │  │  Session ──── User                          │       │
│       │  └─────────────────────────────────────────────┘       │
│       └─────────────────────────────────────────────────────────┘
```

### 7.2 Modelos y sus Campos

#### 7.2.1 `User` — Usuarios del sistema
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `email` | String (único) | Correo electrónico |
| `password` | String | Hash bcrypt |
| `name` | String | Nombre completo |
| `role` | String (default: `EMPLEADO_BASICO`) | Rol del sistema |
| `accessibleModules` | ModuleType[] | Módulos a los que tiene acceso |
| `isActive` | Boolean (default: true) | Cuenta activa/inactiva |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Última actualización |

**Relaciones:**
- `employee` → `Employee` (1:0..1) — Un usuario puede tener un empleado asociado
- `sessions` → `Session[]` (1:N) — Sesiones activas
- `VacancyComment` → `VacancyComment[]` (1:N) — Comentarios en vacantes
- `purchaseComments` → `PurchaseComment[]` (1:N) — Comentarios en compras

#### 7.2.2 `Role` — Roles personalizados
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `name` | String (único) | Nombre del rol |
| `description` | String? | Descripción |
| `color` | String | Clase CSS de color |
| `icon` | String | Emoji del rol |
| `isCustom` | Boolean (default: true) | Si es personalizado (vs sistema) |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

#### 7.2.3 `Session` — Sesiones JWT
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `userId` | String | FK → User |
| `token` | String (único) | Token JWT |
| `expiresAt` | DateTime | Fecha de expiración |
| `createdAt` | DateTime | |

#### 7.2.4 `Employee` — Empleados
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `userId` | String? (único) | FK → User |
| `curp` | String (único) | CURP |
| `rfc` | String (único) | RFC |
| `nss` | String (único) | NSS |
| `clave` | String? (único) | Clave de empleado |
| `nombres` | String? | Nombres |
| `apellidoPaterno` | String? | Apellido paterno |
| `apellidoMaterno` | String? | Apellido materno |
| `nombre` | String? | Nombre completo |
| `departamento_id` | String | FK → Department |
| `puestoId` | String? | FK → JobPosition |
| `nivelJerarquico` | NivelJerarquico? | Nivel jerárquico |
| `reportaAId` | String? | FK → Employee (jefe directo) |
| `salarioMensual` | Float? | Salario |
| `sd` | Float? | Salario diario |
| `sdi` | Float? | Salario diario integrado |
| `fechaAlta` | DateTime | Fecha de ingreso |
| `fechaBaja` | DateTime? | Fecha de baja |
| `estatus` | EmployeeStatus | Activo / Inactivo |
| `fotoUrl` | String? | URL de foto de perfil |
| `esPadre` | Boolean | Tiene hijos |
| `numeroHijos` | Int | Número de hijos |
| *+30 campos adicionales* | varios | Datos personales, bancarios, tallas, etc. |

**Relaciones:**
- `user` → `User` (0..1:1) — Empleado asociado a un usuario
- `departamento` → `Department` (N:1)
- `puesto` → `JobPosition` (N:1)
- `reportaA` → `Employee` (N:1) — Auto-referencia jerárquica
- `subordinados` → `Employee[]` (1:N) — Auto-referencia inversa
- `documents` → `EmployeeDocument[]` (1:N)
- `salaryHistory` → `SalaryHistory[]` (1:N)
- `notificationLogs` → `NotificationLog[]` (1:N)
- `jobVacancies` → `JobVacancy[]` (1:N) — Como solicitante
- `autorizadoVacancies` → `JobVacancy[]` (1:N) — Como autorizador
- `voBoVacancies` → `JobVacancy[]` (1:N) — Como VoBo
- `comprasSolicitadas` → `PurchaseRequest[]` (1:N) — Como solicitante
- `comprasAutorizadas` → `PurchaseRequest[]` (1:N) — Como autorizador
- `purchaseApprovals` → `PurchaseApprover[]` (1:N)

#### 7.2.5 `Department` — Departamentos
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `nombre` | String (único) | Nombre del departamento |
| `descripcion` | String? | Descripción |
| `estado` | String (default: Activo) | Estado |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Relaciones:**
- `employees` → `Employee[]` (1:N)
- `jobVacancies` → `JobVacancy[]` (1:N)
- `jobPositions` → `JobPosition[]` (1:N)
- `purchaseRequests` → `PurchaseRequest[]` (1:N)

#### 7.2.6 `JobPosition` — Puestos de trabajo
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `nombre` | String | Nombre del puesto |
| `descripcion` | String? | Descripción |
| `nivelJerarquico` | NivelJerarquico | Nivel jerárquico |
| `estado` | String (default: Activo) | |
| `departamentoId` | String | FK → Department |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Unique:** `[nombre, departamentoId]`

**Relaciones:**
- `departamento` → `Department` (N:1)
- `employees` → `Employee[]` (1:N)
- `jobVacancies` → `JobVacancy[]` (1:N)

#### 7.2.7 `JobVacancy` — Vacantes / Solicitudes de reclutamiento
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `titulo` | String? | Título de la vacante |
| `solicitanteId` | String | FK → Employee (solicitante) |
| `autorizadoPorId` | String? | FK → Employee (quien autorizó) |
| `voBoPorId` | String? | FK → Employee (VoBo) |
| `departamento_id` | String? | FK → Department |
| `jobPositionId` | String? | FK → JobPosition |
| `estatus` | VacancyStatus | Solicitada / Aprobada / Buscando / Cerrada |
| `motivoSolicitud` | MotivoVacante | Motivo de la vacante |
| `tipoContratacion` | TipoContratacion | Tipo de contratación |
| `numeroVacantes` | Int (default: 1) | Número de vacantes |
| `fechaSolicitud` | DateTime | |
| `fechaAutorizacion` | DateTime? | |
| `closedAt` | DateTime? | |
| *+20 campos adicionales* | varios | Requerimientos técnicos, físicos, etc. |

**Relaciones:**
- `solicitante` → `Employee` (N:1)
- `autorizadoPor` → `Employee` (N:1, opcional)
- `voBoPor` → `Employee` (N:1, opcional)
- `departamento` → `Department` (N:1, opcional)
- `jobPosition` → `JobPosition` (N:1, opcional)
- `candidatesRH` → `CandidateRH[]` (1:N)
- `JobActivity` → `JobActivity[]` (1:N)
- `comments` → `VacancyComment[]` (1:N)

#### 7.2.8 `CandidateRH` — Candidatos a vacantes
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `vacancy_id` | String | FK → JobVacancy |
| `nombre` | String | Nombre del candidato |
| `cv_url` | String? | URL del CV |
| `psych_test_url` | String? | URL de prueba psicométrica |
| `estatus` | CandidateStatus | En_Revision / Descartado / Seleccionado |
| `comentarios_rh` | String? | Observaciones de RH |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

#### 7.2.9 `JobActivity` — Actividades del puesto (flujo estándar)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `vacancyId` | String | FK → JobVacancy |
| `activityType` | String | Tipo de actividad |
| `description` | String | Descripción |
| `duration` | String? | Duración |
| `priority` | Int (default: 1) | Prioridad |
| `isCompleted` | Boolean | Completada |
| `completedAt` | DateTime? | |

#### 7.2.10 `VacancyComment` — Comentarios en vacantes
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `vacancy_id` | String | FK → JobVacancy |
| `user_id` | String | FK → User |
| `mensaje` | String | Contenido del comentario |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

#### 7.2.11 `EmployeeDocument` — Documentos de empleados
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `employee_id` | String | FK → Employee |
| `tipo_documento` | String | Tipo (INE, CURP, etc.) |
| `nombre_archivo` | String | Nombre del archivo |
| `url_archivo` | String | Ruta del archivo |
| `mime_type` | String | Tipo MIME |
| `size_bytes` | Int? | Tamaño en bytes |
| `uploaded_by` | String? | Quién subió |
| `uploaded_at` | DateTime | |

#### 7.2.12 `PurchaseRequest` — Solicitudes de compra
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `folio` | Int (autoincrement) | Folio único |
| `solicitanteId` | String | FK → Employee |
| `departamentoId` | String | FK → Department |
| `estatus` | PurchaseStatus | NUEVO / PENDIENTE / EN_AUTORIZACION / APROBADO / ENTREGADO / CANCELADO |
| `justificacion` | String? | Justificación |
| `requiereAutorizacion` | Boolean | Requiere autorización |
| `autorizadoPorId` | String? | FK → Employee |
| `fechaAutorizacion` | DateTime? | |
| `fechaSolicitud` | DateTime | |

**Relaciones:**
- `solicitante` → `Employee` (N:1)
- `autorizadoPor` → `Employee` (N:1, opcional)
- `departamento` → `Department` (N:1)
- `items` → `PurchaseItem[]` (1:N)
- `quotes` → `PurchaseQuote[]` (1:N)
- `comments` → `PurchaseComment[]` (1:N)
- `approvers` → `PurchaseApprover[]` (1:N)
- `purchaseOrder` → `PurchaseOrder` (1:1, opcional)

#### 7.2.13 `PurchaseItem` — Partidas de solicitud de compra
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `requestId` | String | FK → PurchaseRequest |
| `productoServicio` | String | Producto o servicio |
| `cantidad` | Float | Cantidad |
| `descripcion` | String? | Descripción |

#### 7.2.14 `PurchaseQuote` — Cotizaciones de compra
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `requestId` | String | FK → PurchaseRequest |
| `proveedor` | String | Nombre del proveedor |
| `monto` | Float | Monto |
| `fechaCotizacion` | DateTime | |
| `archivoUrl` | String? | URL del archivo |
| `isSelected` | Boolean | Seleccionada |
| `comentarios` | String? | |
| `fechaEstimadaEntrega` | DateTime? | |

#### 7.2.15 `PurchaseComment` — Comentarios en compras
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `requestId` | String | FK → PurchaseRequest |
| `userId` | String | FK → User |
| `mensaje` | String | Contenido |
| `createdAt` | DateTime | |

#### 7.2.16 `PurchaseApprover` — Aprobadores de compras
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `requestId` | String | FK → PurchaseRequest |
| `employeeId` | String | FK → Employee |
| `estatus` | String (default: PENDIENTE) | PENDIENTE / APROBADO / RECHAZADO |
| `fechaRespuesta` | DateTime? | |
| `comentarios` | String? | |

**Unique:** `[requestId, employeeId]`

#### 7.2.17 `PurchaseOrder` — Órdenes de compra
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `purchaseRequestId` | String (único) | FK → PurchaseRequest |
| `numero` | String (único) | Formato: OC-AAAA-000001 |
| `proveedor` | String | |
| `monto` | Float | |
| `subtotal` | Float? | |
| `iva` | Float? | |
| `ivaRate` | Float? | |
| `pdfUrl` | String? | URL del PDF |
| `createdAt` | DateTime | |

**Relaciones:**
- `request` → `PurchaseRequest` (1:1)
- `items` → `PurchaseOrderItem[]` (1:N)

#### 7.2.18 `PurchaseOrderItem` — Partidas de orden de compra
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `orderId` | String | FK → PurchaseOrder |
| `productoServicio` | String | |
| `cantidad` | Float | |
| `descripcion` | String? | |
| `precioUnitario` | Float? | |
| `importe` | Float? | |

#### 7.2.19 `PurchaseAuditLog` — Auditoría de compras
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `requestId` | String | FK → PurchaseRequest |
| `userId` | String | Usuario que realizó la acción |
| `accion` | String | Tipo de acción |
| `valorAnterior` | Json? | Valor antes del cambio |
| `valorNuevo` | Json? | Valor después del cambio |
| `ip` | String? | Dirección IP |
| `userAgent` | String? | User-Agent |
| `createdAt` | DateTime | |

#### 7.2.20 `AttendanceRecord` — Registros de asistencia (checador)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `numeroEmpleado` | String | Número del checador |
| `nombreEmpleado` | String | Nombre del empleado |
| `fechaHora` | DateTime | Fecha y hora de la checada |
| `tipo` | String | Entrada / Salida |
| `dispositivo` | String? | Dispositivo |
| `createdAt` | DateTime | |

**Índices:** `numeroEmpleado`, `fechaHora`

#### 7.2.21 `SalaryHistory` — Historial de sueldos
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `employeeId` | String | FK → Employee |
| `salarioAnterior` | Float? | |
| `salarioNuevo` | Float | |
| `sdAnterior` | Float? | |
| `sdNuevo` | Float | |
| `sdiAnterior` | Float? | |
| `sdiNuevo` | Float | |
| `factorUsado` | Float? | |
| `tipoCambio` | String | ALTA / INCREMENTO / DECREMENTO / AJUSTE |
| `motivo` | String? | |
| `fechaCambio` | DateTime | |
| `usuarioId` | String? | |

#### 7.2.22 `NotificationLog` — Log de notificaciones
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `tipo` | String | CUMPLEANOS / ANIVERSARIO |
| `employeeId` | String | FK → Employee |
| `employeeName` | String | |
| `email` | String | |
| `enviadoA` | DateTime | |
| `estatus` | String | ENVIADO / FALLIDO |
| `errorMsg` | String? | |

#### 7.2.23 `FactorIntegracion` — Factores de integración (catálogo)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Int (autoincrement) | PK |
| `anio` | Int (único) | Año de antigüedad (1-30) |
| `diasAguinaldo` | Int | Días de aguinaldo |
| `diasVacaciones` | Int | Días de vacaciones |
| `primaVacacional` | Float | % prima vacacional |
| `factor` | Float | Factor precalculado |

### 7.3 Enumeraciones (Enums)

| Enum | Valores | Uso |
|------|---------|-----|
| `RoleType` | `EMPLEADO_BASICO`, `ADMIN`, `RH`, `SISTEMAS`, `COMPRAS`, `PRODUCCION` | Roles del sistema |
| `ModuleType` | `EMPLEADOS`, `RECLUTAMIENTO`, `VACACIONES`, `INCIDENCIAS`, `CONFIGURACION`, `DASHBOARD`, `REPORTES`, `COMPRAS` | Módulos del sistema |
| `EmployeeStatus` | `Activo`, `Inactivo` | Estatus del empleado |
| `VacancyStatus` | `Solicitada`, `Aprobada`, `Buscando`, `Cerrada` | Ciclo de vida de vacante |
| `CandidateStatus` | `En_Revision`, `Descartado`, `Seleccionado` | Estatus de candidato |
| `MotivoVacante` | `NUEVA_CREACION`, `REEMPLAZO_DEFINITIVO`, `REEMPLAZO_TEMPORAL`, `REEMPLAZO_RENUNCIA`, `REEMPLAZO_TERMINACION_CONTRATO`, `INCREMENTO_PLANTILLA`, `INCREMENTO_PRODUCCION`, `RENUNCIA`, `TERMINACION_CONTRATO`, `LICENCIA`, `LICENCIA_TEMPORAL`, `INCAPACIDAD`, `JUBILACION`, `JUBILACION_RETIRO`, `PROMOCION`, `REESTRUCTURACION`, `MATERNIDAD`, `LICENCIA_MATERNIDAD`, `VACACIONES` | Motivos de solicitud de vacante |
| `TipoContratacion` | `ADMINISTRATIVO`, `TEMPORAL`, `SINDICALIZADO`, `TIEMPO_COMPLETO`, `PERMANENTE`, `BECARIO`, `ROL_TURNOS` | Tipos de contratación |
| `NivelJerarquico` | `PRESIDENTE`, `DIRECTOR`, `GERENTE`, `JEFE`, `COORDINADOR`, `ANALISTA`, `SUPERVISOR`, `AUX_ADMINISTRATIVO`, `OPERATIVO` | Niveles jerárquicos |
| `PurchaseStatus` | `NUEVO`, `PENDIENTE`, `EN_AUTORIZACION`, `APROBADO`, `ENTREGADO`, `CANCELADO` | Ciclo de vida de solicitud de compra |

### 7.4 Resumen de Entidades

| # | Entidad | Tabla | Propósito | Relaciones clave |
|---|---------|-------|-----------|-----------------|
| 1 | `User` | `users` | Usuarios del sistema | → Employee, Session, Comments |
| 2 | `Role` | `roles` | Roles personalizados | Independiente |
| 3 | `Session` | `sessions` | Sesiones JWT | → User |
| 4 | `Employee` | `employees` | Empleados (RH) | → User, Department, JobPosition, auto-referencia jerárquica |
| 5 | `Department` | `departments` | Departamentos | → Employee, JobPosition, JobVacancy, PurchaseRequest |
| 6 | `JobPosition` | `job_positions` | Puestos de trabajo | → Department, Employee, JobVacancy |
| 7 | `JobVacancy` | `job_vacancies` | Vacantes | → Employee (x3), Department, JobPosition, CandidateRH, JobActivity |
| 8 | `CandidateRH` | `candidates_rh` | Candidatos | → JobVacancy |
| 9 | `JobActivity` | `job_activities` | Actividades del puesto | → JobVacancy |
| 10 | `VacancyComment` | `vacancy_comments` | Comentarios en vacantes | → JobVacancy, User |
| 11 | `EmployeeDocument` | `employee_documents` | Documentos de empleados | → Employee |
| 12 | `PurchaseRequest` | `purchase_requests` | Solicitudes de compra | → Employee (x2), Department, PurchaseItem, PurchaseQuote, PurchaseComment, PurchaseApprover, PurchaseOrder |
| 13 | `PurchaseItem` | `purchase_items` | Partidas de compra | → PurchaseRequest |
| 14 | `PurchaseQuote` | `purchase_quotes` | Cotizaciones | → PurchaseRequest |
| 15 | `PurchaseComment` | `purchase_comments` | Comentarios en compras | → PurchaseRequest, User |
| 16 | `PurchaseApprover` | `purchase_approvers` | Aprobadores | → PurchaseRequest, Employee |
| 17 | `PurchaseOrder` | `purchase_orders` | Órdenes de compra | → PurchaseRequest, PurchaseOrderItem |
| 18 | `PurchaseOrderItem` | `purchase_order_items` | Partidas de OC | → PurchaseOrder |
| 19 | `PurchaseAuditLog` | `purchase_audit_logs` | Auditoría de compras | → PurchaseRequest |
| 20 | `AttendanceRecord` | `attendance_records` | Registros de checador | Independiente |
| 21 | `SalaryHistory` | `salary_history` | Historial de sueldos | → Employee |
| 22 | `NotificationLog` | `notification_logs` | Log de notificaciones | → Employee |
| 23 | `FactorIntegracion` | `factores_integracion` | Catálogo de factores | Independiente |

**Total de entidades: 23 modelos + 8 enums**

---

## 8. INVENTARIO EXHAUSTIVO DEL MÓDULO DE COMPRAS

### 8.1 Visión General

El módulo de Compras es el más complejo del sistema, con **27 endpoints REST**, **7 servicios de negocio**, **6 entidades en BD**, **1 sistema de auditoría**, **1 sistema de notificaciones SSE en tiempo real** y **generación de PDF profesional**.

**Propósito:** Gestionar el ciclo de vida completo de una solicitud de compra, desde la creación por parte de un empleado hasta la entrega de los bienes/servicios, incluyendo cotizaciones, autorizaciones y órdenes de compra.

### 8.2 Arquitectura del Módulo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MÓDULO DE COMPRAS — ARQUITECTURA                  │
│                                                                     │
│  FRONTEND (Next.js)                                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  /dashboard/compras/         → Dashboard de compras          │   │
│  │  /dashboard/compras/[id]/    → Detalle de solicitud          │   │
│  │  /compras/mis-solicitudes/   → Mis solicitudes               │   │
│  │  /compras/mis-solicitudes/[id]/ → Detalle (solicitante)      │   │
│  │  /compras/nueva-solicitud/   → Nueva solicitud               │   │
│  │                                                              │   │
│  │  Componentes clave:                                          │   │
│  │  ├── PurchaseComments.js     → Comentarios + SSE             │   │
│  │  ├── PurchaseOrderModal.js   → Modal de OC                   │   │
│  │  ├── QuoteSelectionModal.js  → Selección de cotización       │   │
│  │  ├── SendAuthorizationModal.js → Envío a autorización        │   │
│  │  └── RoleManager.js          → Gestión de roles (compras)    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                           │ HTTP / SSE                              │
│                           ▼                                         │
│  BACKEND (Express)                                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  purchase.routes.js          → 27 endpoints                  │   │
│  │                                                              │   │
│  │  purchase.controller.js      → Orquestador + Auditoría       │   │
│  │  purchase-comment.controller.js → Comentarios + SSE          │   │
│  │                                                              │   │
│  │  SERVICIOS (src/services/purchases/):                        │   │
│  │  ├── purchase.service.js           → CRUD, estados, archivos │   │
│  │  ├── quote.service.js              → Cotizaciones            │   │
│  │  ├── approval.service.js           → Aprobadores             │   │
│  │  ├── comparison.service.js         → Comparativa             │   │
│  │  ├── purchase-order.service.js     → OC + PDF               │   │
│  │  ├── purchase-notification.service.js → Emails autorización │   │
│  │  └── status-notification.service.js → Emails cambio estado  │   │
│  │                                                              │   │
│  │  SERVICIOS TRANSVERSALES:                                    │   │
│  │  ├── audit.service.js              → Auditoría               │   │
│  │  └── sse-manager.service.js        → SSE en tiempo real      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                           │ SQL                                     │
│                           ▼                                         │
│  BASE DE DATOS (PostgreSQL)                                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  purchase_requests       → Solicitudes de compra             │   │
│  │  purchase_items          → Partidas de solicitud             │   │
│  │  purchase_quotes         → Cotizaciones                      │   │
│  │  purchase_comments       → Comentarios                       │   │
│  │  purchase_approvers      → Aprobadores asignados             │   │
│  │  purchase_orders         → Órdenes de compra                 │   │
│  │  purchase_order_items    → Partidas de OC                    │   │
│  │  purchase_audit_logs     → Auditoría                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.3 Ciclo de Vida de una Solicitud de Compra

```
NUEVO ──→ PENDIENTE ──→ EN_AUTORIZACION ──→ APROBADO ──→ ENTREGADO
  │           │               │                  │
  │           │               │                  │
  └───────────┴───────────────┴──────────────────┘
                       │
                  CANCELADO (desde cualquier estado excepto ENTREGADO)
```

| Transición | Acción | ¿Quién? | ¿Auditoría? | ¿Notificación? |
|-----------|--------|---------|-------------|----------------|
| `NUEVO → PENDIENTE` | Subir cotizaciones | Admin/Compras | ✅ `COTIZACION_SUBIDA` | ✅ Email al solicitante |
| `PENDIENTE → APROBADO` | Seleccionar cotización (≤ $50,000) | Admin/Compras | ✅ `COTIZACION_SELECCIONADA` | ✅ Email al solicitante |
| `PENDIENTE → EN_AUTORIZACION` | Seleccionar cotización (> $50,000) | Admin/Compras | ✅ `COTIZACION_SELECCIONADA` | ✅ Email al solicitante |
| `EN_AUTORIZACION → APROBADO` | Autorizar solicitud | Admin/Compras | ✅ `APROBACION` | ✅ Email al solicitante |
| `APROBADO → ENTREGADO` | Marcar como entregado | Admin/Compras | ✅ `ENTREGA` | ✅ Email al solicitante |
| `* → CANCELADO` | Cancelar solicitud | Solicitante o Admin/Compras | ✅ `CANCELACION` | ✅ Email al solicitante |

### 8.4 Reglas de Negocio

| Regla | Descripción |
|-------|-------------|
| **Umbral de autorización** | Solicitudes > $50,000 MXN requieren autorización de aprobadores |
| **Límite de cotizaciones** | Máximo 3 cotizaciones por solicitud (batch) |
| **Selección única** | Solo una cotización puede estar seleccionada (`isSelected = true`) |
| **Cancelación** | No se pueden cancelar solicitudes en estado `ENTREGADO` |
| **Entrega** | Solo se pueden marcar como entregadas solicitudes en estado `APROBADO` |
| **OC única** | Una solicitud solo puede tener una orden de compra (relación 1:1) |
| **OC automática** | Al autorizar, se genera automáticamente la OC (fire & forget) |
| **Comentarios** | Solo el solicitante o Admin/Compras pueden comentar |
| **Scoping de datos** | Usuarios regulares ven solo sus solicitudes; Admin/Compras ven todas |

### 8.5 Endpoints del Módulo

#### 8.5.1 Solicitudes (CRUD)

| Método | Ruta | Protección | Servicio | Descripción |
|--------|------|-----------|----------|-------------|
| `POST` | `/api/purchases` | `requireModule('COMPRAS')` | `purchase.service.createRequest` | Crear solicitud (cualquier usuario con módulo COMPRAS) |
| `GET` | `/api/purchases/my` | `requireModule('COMPRAS')` | `purchase.service.getMyRequests` | Mis solicitudes (filtradas por empleado asociado) |
| `GET` | `/api/purchases` | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | `purchase.service.getAllRequests` | Todas las solicitudes (con filtros: `?status=`, `?department=`) |
| `GET` | `/api/purchases/details/:id` | `requireModule('COMPRAS')` | `purchase.service.getRequestDetails` | Detalle de solicitud (con scoping: solo solicitante o Admin/Compras) |

#### 8.5.2 Cotizaciones

| Método | Ruta | Protección | Servicio | Descripción |
|--------|------|-----------|----------|-------------|
| `POST` | `/api/purchases/:id/quotes` | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | `quote.service.uploadQuotes` | Subir 1-3 cotizaciones en batch (solo estado NUEVO) |
| `POST` | `/api/purchases/:id/select-quote` | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | `quote.service.selectQuote` | Seleccionar cotización (evalúa umbral $50,000) |
| `POST` | `/api/purchases/:id/quotes/upload-with-file` | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` + Multer | `quote.service.uploadQuoteWithFile` | Subir cotización + archivo en una llamada |
| `POST` | `/api/purchases/:id/quotes/:quoteId/upload` | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` + Multer | `purchase.service.uploadQuoteFile` | Subir archivo a cotización existente |
| `POST` | `/api/purchases/:id/upload-quote-file` | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` + Multer | `purchase.service.uploadQuoteFileForNewQuote` | Subir archivo para nueva cotización (pre-creación) |
| `PUT` | `/api/purchases/:id/quotes/:quoteId/amount` | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | `purchase.service.updateQuoteAmount` | Actualizar monto (reevalúa umbral si está seleccionada) |
| `GET` | `/api/purchases/:id/comparison` | `requireModule('COMPRAS')` | `comparison.service.getQuoteComparison` | Comparativa con ranking, diferencias, ahorro potencial |

#### 8.5.3 Aprobaciones

| Método | Ruta | Protección | Servicio | Descripción |
|--------|------|-----------|----------|-------------|
| `GET` | `/api/purchases/:id/potential-approvers` | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | `approval.service.getPotentialApprovers` | Empleados con nivel GERENTE/DIRECTOR/PRESIDENTE + ADMIN/RH |
| `POST` | `/api/purchases/:id/assign-approvers` | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | `approval.service.assignApprovers` | Asignar aprobadores (cambia a EN_AUTORIZACION) |
| `POST` | `/api/purchases/:id/authorize` | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | `purchase.service.authorizeRequest` | Autorizar (cambia a APROBADO + genera OC automática) |
| `POST` | `/api/purchases/:id/send-authorization` | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | `purchase-notification.service.sendAuthorization` | Enviar email de autorización a aprobadores |

#### 8.5.4 Estados y Operaciones

| Método | Ruta | Protección | Servicio | Descripción |
|--------|------|-----------|----------|-------------|
| `POST` | `/api/purchases/:id/deliver` | `requireModule('COMPRAS')` | `purchase.service.markAsDelivered` | Marcar como ENTREGADO (solo desde APROBADO) |
| `POST` | `/api/purchases/:id/cancel` | `requireModule('COMPRAS')` | `purchase.service.cancelRequest` | Cancelar (solicitante o Admin/Compras, no desde ENTREGADO) |

#### 8.5.5 Órdenes de Compra

| Método | Ruta | Protección | Servicio | Descripción |
|--------|------|-----------|----------|-------------|
| `GET` | `/api/purchases/:id/purchase-order` | `requireModule('COMPRAS')` | `purchase-order.service.getOrderByRequestId` | Obtener OC de una solicitud |
| `POST` | `/api/purchases/:id/purchase-order` | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | `purchase-order.service.generateOrder` | Generar OC (con partidas + precioUnitario) |
| `GET` | `/api/purchase-orders` | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | `purchase-order.service.getAllOrders` | Listar todas las OC |
| `POST` | `/api/purchases/:id/regenerate-order` | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | `purchase-order.service.regeneratePdf` | Regenerar PDF de OC existente |

#### 8.5.6 Comentarios (Chat en Tiempo Real)

| Método | Ruta | Protección | Servicio | Descripción |
|--------|------|-----------|----------|-------------|
| `GET` | `/api/purchases/:id/comments/stream` | `verifyTokenFromQuery` + `requireModule('COMPRAS')` | `PurchaseCommentController.streamComments` | SSE: Stream de comentarios en tiempo real |
| `GET` | `/api/purchases/:id/comments` | `requireModule('COMPRAS')` | `PurchaseCommentController.getComments` | Obtener comentarios (ordenados asc) |
| `POST` | `/api/purchases/:id/comments` | `requireModule('COMPRAS')` | `PurchaseCommentController.addComment` | Agregar comentario (solo solicitante o Admin/Compras) |

#### 8.5.7 Auditoría

| Método | Ruta | Protección | Servicio | Descripción |
|--------|------|-----------|----------|-------------|
| `GET` | `/api/purchases/:id/audit` | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | `audit.service.getHistory` | Historial completo de auditoría de una solicitud |

### 8.6 Servicios de Negocio

#### 8.6.1 `purchase.service.js` — CRUD y Estados
| Método | Descripción | Validaciones clave |
|--------|-------------|-------------------|
| `createRequest(userId, justificacion, items)` | Crear solicitud en transacción | Empleado existe, items válidos |
| `getMyRequests(req)` | Solicitudes del usuario | Filtra por `solicitanteId = employee.id` |
| `getRequestDetails(req)` | Detalle con scoping | Solo solicitante o Admin/Compras |
| `getAllRequests(req)` | Todas las solicitudes | Filtros opcionales: `?status=`, `?department=` |
| `cancelRequest(userId, userRole, requestId)` | Cancelar | No desde ENTREGADO, solo solicitante o Admin/Compras |
| `markAsDelivered(requestId)` | Marcar entregado | Solo desde APROBADO |
| `uploadQuoteFile(requestId, quoteId, filename)` | Subir archivo a cotización | Cotización pertenece a la solicitud |
| `uploadQuoteFileForNewQuote(requestId, filename, quoteIndex)` | Subir archivo pre-creación | Solo NUEVO o PENDIENTE, índice 0-2 |
| `updateQuoteAmount(requestId, quoteId, monto)` | Actualizar monto | Reevalúa umbral si está seleccionada |
| `authorizeRequest(userId, requestId)` | Autorizar + OC automática | Solo desde EN_AUTORIZACION, genera OC fire & forget |

#### 8.6.2 `quote.service.js` — Cotizaciones
| Método | Descripción | Validaciones clave |
|--------|-------------|-------------------|
| `uploadQuotes(req)` | Subir 1-3 cotizaciones batch | Solo NUEVO, máximo 3, transacción |
| `selectQuote(req)` | Seleccionar cotización | Solo PENDIENTE, evalúa umbral $50,000 |
| `uploadQuoteWithFile(req)` | Subir cotización + archivo | NUEVO o PENDIENTE, multipart |

#### 8.6.3 `approval.service.js` — Aprobadores
| Método | Descripción | Lógica |
|--------|-------------|--------|
| `getPotentialApprovers(requestId)` | Empleados con nivel gerencial | Busca GERENTE/DIRECTOR/PRESIDENTE + ADMIN/RH, deduplica |
| `assignApprovers(requestId, approverIds)` | Asignar aprobadores | Elimina anteriores, crea nuevos, cambia a EN_AUTORIZACION |

#### 8.6.4 `comparison.service.js` — Comparativa
| Método | Descripción | Datos calculados |
|--------|-------------|-----------------|
| `getQuoteComparison(req)` | Comparativa de cotizaciones | Ranking, diferencia vs mejor, % diferencia, monto min/max/promedio, ahorro potencial |

#### 8.6.5 `purchase-order.service.js` — Órdenes de Compra + PDF
| Método | Descripción | Detalles técnicos |
|--------|-------------|-------------------|
| `generateOrder(requestId, userId, customItems?)` | Generar OC completa | Valida APROBADO, OC única, cotización seleccionada. Calcula subtotal + IVA 16% + total. Genera PDF con PDFKit. |
| `regeneratePdf(requestId, userId)` | Regenerar PDF | Usa datos existentes de la OC |
| `getOrderByRequestId(requestId)` | Obtener OC | Con items y datos de la solicitud |
| `getAllOrders()` | Listar OC | Ordenadas por fecha descendente |

**Formato de número de OC:** `OC-AAAA-000001` (año + 6 dígitos secuenciales)

**PDF generado con PDFKit incluye:**
- Encabezado corporativo (azul oscuro)
- Número de OC destacado
- Datos: solicitante, departamento, proveedor, fechas
- Subtotal, IVA (16%), monto total
- Tabla de partidas con #, producto, cantidad, precio unitario, importe
- Sello de autenticidad
- Footer con fecha de generación

#### 8.6.6 `purchase-notification.service.js` — Notificaciones de Autorización
| Método | Descripción |
|--------|-------------|
| `sendAuthorization(requestId, approverEmails)` | Enviar email a aprobadores seleccionados con datos de la solicitud |

#### 8.6.7 `status-notification.service.js` — Notificaciones de Cambio de Estado
| Método | Descripción |
|--------|-------------|
| `notifyStatusChange(purchaseRequestId, previousStatus, newStatus)` | Enviar email al solicitante con plantilla HTML según la transición |
| `notifyStatusChangeAsync(...)` | Versión fire & forget (no bloqueante) |

**Plantillas de email disponibles:**
| Transición | Plantilla | Contenido |
|-----------|-----------|-----------|
| NUEVO → PENDIENTE | `templatePendiente` | Cotizaciones recibidas, tabla de artículos y montos |
| PENDIENTE → EN_AUTORIZACION | `templateEnAutorizacion` | Supera límite $50,000, datos de la cotización seleccionada |
| EN_AUTORIZACION → APROBADO | `templateAprobado` | Aprobada, quién autorizó, monto |
| APROBADO → ENTREGADO | `templateEntregado` | Entregada, proveedor |
| * → CANCELADO | `templateCancelado` | Cancelada, estado anterior |
| Otras | `templateGenerico` | Genérica con badges de estado |

### 8.7 Sistema de Auditoría

**Servicio:** `audit.service.js`

| Acción | Código | ¿Cuándo se registra? |
|--------|--------|---------------------|
| `CREACION` | `audit.ACCIONES.CREACION` | Al crear una solicitud |
| `COTIZACION_SUBIDA` | `audit.ACCIONES.COTIZACION_SUBIDA` | Al subir cotizaciones (batch o individual) |
| `MONTO_EDITADO` | `audit.ACCIONES.MONTO_EDITADO` | Al editar monto de cotización |
| `COTIZACION_SELECCIONADA` | `audit.ACCIONES.COTIZACION_SELECCIONADA` | Al seleccionar cotización |
| `ENVIO_AUTORIZACION` | `audit.ACCIONES.ENVIO_AUTORIZACION` | Al asignar aprobadores o reenviar autorización |
| `APROBACION` | `audit.ACCIONES.APROBACION` | Al autorizar solicitud |
| `ENTREGA` | `audit.ACCIONES.ENTREGA` | Al marcar como entregado |
| `CANCELACION` | `audit.ACCIONES.CANCELACION` | Al cancelar solicitud |
| `ORDEN_COMPRA_GENERADA` | `audit.ACCIONES.ORDEN_COMPRA_GENERADA` | Al generar OC |
| `ORDEN_COMPRA_REGENERADA` | `audit.ACCIONES.ORDEN_COMPRA_REGENERADA` | Al regenerar PDF de OC |

**Métodos del servicio de auditoría:**
| Método | Descripción |
|--------|-------------|
| `log(requestId, userId, accion, valorAnterior, valorNuevo, req?)` | Registrar auditoría |
| `logWithReq(requestId, userId, accion, valorAnterior, valorNuevo, req)` | Registrar con IP + User-Agent |
| `getHistory(requestId)` | Historial completo (enriquecido con nombre de usuario) |
| `getHistoryFiltered(filters)` | Historial con filtros (requestId, userId, accion, fechas, paginación) |
| `logInTransaction(tx, requestId, userId, accion, valorAnterior, valorNuevo, req?)` | Auditoría dentro de transacciones Prisma |

### 8.8 Sistema SSE (Server-Sent Events) — Tiempo Real

**Servicio:** `sse-manager.service.js`

| Método | Descripción |
|--------|-------------|
| `addClient(requestId, res)` | Conectar cliente a una sala (requestId) |
| `removeClient(requestId, res)` | Desconectar cliente |
| `broadcast(requestId, eventName, data)` | Emitir evento a todos los clientes de una sala |
| `getStats()` | Estadísticas de conexiones activas |
| `cleanup()` | Limpiar todas las conexiones (graceful shutdown) |

**Eventos SSE emitidos:**
| Evento | Cuándo | Payload |
|--------|--------|---------|
| `connected` | Cliente se conecta | `{ requestId, timestamp, message }` |
| `new-comment` | Nuevo comentario | `{ comment: { id, mensaje, user, createdAt } }` |
| `heartbeat` | Cada 30s | `:heartbeat timestamp` (comentario SSE) |
| `shutdown` | Servidor se apaga | `{ message: "Server shutting down" }` |

### 8.9 Entidades del Módulo

| # | Entidad | Tabla | Registros típicos | Relaciones |
|---|---------|-------|-------------------|------------|
| 1 | `PurchaseRequest` | `purchase_requests` | Una por solicitud | → Employee (solicitante), Employee (autorizador), Department, PurchaseItem[], PurchaseQuote[], PurchaseComment[], PurchaseApprover[], PurchaseOrder |
| 2 | `PurchaseItem` | `purchase_items` | 1-N por solicitud | → PurchaseRequest |
| 3 | `PurchaseQuote` | `purchase_quotes` | 1-3 por solicitud | → PurchaseRequest |
| 4 | `PurchaseComment` | `purchase_comments` | 0-N por solicitud | → PurchaseRequest, User |
| 5 | `PurchaseApprover` | `purchase_approvers` | 0-N por solicitud | → PurchaseRequest, Employee |
| 6 | `PurchaseOrder` | `purchase_orders` | 0-1 por solicitud | → PurchaseRequest, PurchaseOrderItem[] |
| 7 | `PurchaseOrderItem` | `purchase_order_items` | 1-N por OC | → PurchaseOrder |
| 8 | `PurchaseAuditLog` | `purchase_audit_logs` | 1-N por solicitud | → PurchaseRequest (lógico) |

### 8.10 Frontend — Componentes y Páginas

| Ruta/Página | Propósito | Usuarios |
|-------------|-----------|----------|
| `/dashboard/compras/` | Dashboard de compras (Admin/Compras) | Admin, Compras |
| `/dashboard/compras/[id]/` | Detalle de solicitud (Admin/Compras) | Admin, Compras |
| `/compras/mis-solicitudes/` | Mis solicitudes de compra | Cualquier usuario con módulo COMPRAS |
| `/compras/mis-solicitudes/[id]/` | Detalle de solicitud (solicitante) | Solicitante |
| `/compras/nueva-solicitud/` | Crear nueva solicitud | Cualquier usuario con módulo COMPRAS |

| Componente | Propósito |
|-----------|-----------|
| `PurchaseComments.js` | Sistema de comentarios con SSE en tiempo real |
| `PurchaseOrderModal.js` | Modal para generar orden de compra con partidas y precios |
| `QuoteSelectionModal.js` | Modal para seleccionar cotización |
| `SendAuthorizationModal.js` | Modal para enviar a autorización por email |

### 8.11 Resumen del Módulo de Compras

| Elemento | Cantidad |
|----------|----------|
| **Endpoints REST** | 27 |
| **Servicios de negocio** | 7 |
| **Servicios transversales** | 2 (auditoría + SSE) |
| **Entidades en BD** | 8 |
| **Estados del ciclo de vida** | 6 (NUEVO, PENDIENTE, EN_AUTORIZACION, APROBADO, ENTREGADO, CANCELADO) |
| **Transiciones de estado** | 6 posibles |
| **Acciones auditables** | 10 |
| **Plantillas de email** | 6 (5 específicas + 1 genérica) |
| **Componentes frontend** | 4 modales + 1 dashboard + 3 páginas |
| **Umbral de autorización** | $50,000 MXN |
| **Tasa de IVA** | 16% |
| **Formato de OC** | OC-AAAA-000001 |

---

## 9. INVENTARIO EXHAUSTIVO DEL MÓDULO DE RECLUTAMIENTO

### 9.1 Visión General

El módulo de Reclutamiento es el segundo más complejo del sistema, con **20 endpoints REST**, **1 controlador unificado** (~1550 líneas), **4 entidades en BD**, **sistema de comentarios**, **votación colaborativa de candidatos (like/dislike)**, **subida de CVs y pruebas psicométricas**, **notificaciones por email** y **dos flujos de creación de vacantes**.

**Propósito:** Gestionar el ciclo de vida completo de una solicitud de vacante, desde la solicitud por parte de un jefe de área hasta la selección del candidato final y cierre de la vacante, con un modelo colaborativo donde RH y jefes de área trabajan en conjunto.

### 9.2 Arquitectura del Módulo

```
┌─────────────────────────────────────────────────────────────────────┐
│                  MÓDULO DE RECLUTAMIENTO — ARQUITECTURA              │
│                                                                     │
│  FRONTEND (Next.js)                                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  PORTAL JEFES DE ÁREA:                                       │   │
│  │  ├── /reclutamiento/mis-solicitudes/    → Mis vacantes       │   │
│  │  ├── /reclutamiento/solicitar-vacante/  → Nueva solicitud    │   │
│  │  ├── /reclutamiento/vacantes/[id]/      → Detalle vacante    │   │
│  │  │   ├── CandidatesTab.js               → Pestaña candidatos │   │
│  │  │   └── perfil-tecnico/                → Perfil técnico     │   │
│  │  ├── /my-vacancies/                     → Mis vacantes (legacy)│  │
│  │  └── /vacancies/[id]/activities/        → Actividades (legacy)│  │
│  │                                                              │   │
│  │  PORTAL RH:                                                  │   │
│  │  ├── /rh/reclutamiento/                 → Dashboard RH       │   │
│  │  └── /rh/reclutamiento/crear-vacante/   → Crear vacante RH   │   │
│  │                                                              │   │
│  │  COMPONENTES COMPARTIDOS:                                    │   │
│  │  └── CandidatesTab.js                   → Gestión candidatos │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                           │ HTTP                                     │
│                           ▼                                         │
│  BACKEND (Express)                                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  recruitment.routes.js       → 20 endpoints                  │   │
│  │                                                              │   │
│  │  recruitment.controller.js   → 1550 líneas (unificado)       │   │
│  │                                                              │   │
│  │  SERVICIOS TRANSVERSALES:                                    │   │
│  │  └── email.service.js        → Notificaciones por email      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                           │ SQL                                     │
│                           ▼                                         │
│  BASE DE DATOS (PostgreSQL)                                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  job_vacancies          → Solicitudes de vacante             │   │
│  │  candidates_rh          → Candidatos                         │   │
│  │  job_activities         → Actividades del puesto             │   │
│  │  vacancy_comments       → Comentarios                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.3 Ciclo de Vida de una Vacante

#### 9.3.1 Flujo Estándar (Jefes de Área)

```
SOLICITADA ──→ APROBADA ──→ BUSCANDO ──→ CERRADA
     │             │             │
     │             │             │
     └─────────────┴─────────────┘
                  │
             CANCELADA (solicitante)
```

| Transición | Acción | ¿Quién? | ¿Notificación? |
|-----------|--------|---------|----------------|
| `→ SOLICITADA` | Crear solicitud de vacante | Jefe de área (SISTEMAS, COMPRAS, PRODUCCION) | ✅ Email a RH |
| `SOLICITADA → APROBADA` | Aprobar solicitud | RH / ADMIN | ✅ Email al solicitante |
| `APROBADA → BUSCANDO` | Definir actividades del puesto | Jefe de área | — |
| `BUSCANDO → CERRADA` | Seleccionar candidato final | Jefe de área | ✅ Email a RH |
| `* → CERRADA` | Cancelar vacante | Solicitante | — |

#### 9.3.2 Flujo Directo / Fast-Track (RH/ADMIN)

```
APROBADA ──→ BUSCANDO ──→ CERRADA
```

| Transición | Acción | ¿Quién? | ¿Notificación? |
|-----------|--------|---------|----------------|
| `→ APROBADA` | Crear vacante directa (pre-aprobada) | RH / ADMIN | ✅ Email al solicitante |
| `APROBADA → BUSCANDO` | Definir actividades | Jefe de área | — |
| `BUSCANDO → CERRADA` | Seleccionar candidato final | Jefe de área | ✅ Email a RH |

### 9.4 Reglas de Negocio

| Regla | Descripción |
|-------|-------------|
| **Scoping de datos** | Jefes de área ven solo sus vacantes (`solicitanteId = employee.id`) |
| **RH/ADMIN ven todo** | Sin filtros de scoping para RH y ADMIN |
| **CV obligatorio** | Todo candidato debe tener CV en PDF |
| **Pruebas psicométricas** | Opcionales, deben ser PDF si se proporcionan |
| **Votación colaborativa** | Jefes de área pueden dar like/dislike a candidatos |
| **Selección final** | Solo el solicitante puede seleccionar candidato final |
| **Comentarios** | Solo el solicitante o RH/ADMIN pueden comentar |
| **Actividades del puesto** | Se definen después de aprobación (flujo estándar) |
| **Cancelación** | El solicitante puede cancelar su vacante en cualquier estado |
| **Vacante única por candidato** | Un candidato pertenece a una sola vacante |

### 9.5 Endpoints del Módulo

#### 9.5.1 Creación de Vacantes

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `POST` | `/api/recruitment/vacancies` | `requireModule('RECLUTAMIENTO')` | `createVacancyRequest` | Crear solicitud de vacante (flujo estándar, jefes de área) |
| `POST` | `/api/recruitment/vacancies/direct` | `requireRHOrAdmin()` | `createDirectVacancy` | Crear vacante directa (Fast-Track, solo RH/ADMIN) |

#### 9.5.2 Listado de Vacantes

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/api/recruitment/my-vacancies` | `requireModule('RECLUTAMIENTO')` | `getMyVacancyRequests` | Mis vacantes (filtradas por solicitante, con paginación) |
| `GET` | `/api/recruitment/vacancies` | `requireModule('RECLUTAMIENTO')` | `getAllVacancyRequests` | Todas las vacantes (RH/ADMIN, con filtros combinados + paginación) |
| `GET` | `/api/recruitment/vacancies/stats` | `requireModule('RECLUTAMIENTO')` | `getVacancyRequestStats` | Estadísticas (total, solicitadas, aprobadas, buscando, cerradas) |
| `GET` | `/api/recruitment/vacancies/:id` | `requireModule('RECLUTAMIENTO')` | `getVacancyRequestById` | Detalle de vacante (con relaciones completas) |

#### 9.5.3 Aprobación y Estados

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `PUT` | `/api/recruitment/vacancies/:id/approve` | `requireRHOrAdmin()` | `approveVacancyRequest` | Aprobar solicitud (SOLICITADA → APROBADA) |
| `PUT` | `/api/recruitment/vacancies/:id/close` | `requireRHOrAdmin()` | `closeVacancyRequest` | Cerrar vacante (BUSCANDO → CERRADA, forzado por RH) |
| `PUT` | `/api/recruitment/vacancies/:id/cancel` | `requireModule('RECLUTAMIENTO')` | `cancelVacancy` | Cancelar vacante (solicitante, cualquier estado → CERRADA) |
| `DELETE` | `/api/recruitment/vacancies/:id` | `requireRHOrAdmin()` | `deleteVacancy` | Eliminar vacante permanentemente |

#### 9.5.4 Perfil Técnico y Actividades

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `PUT` | `/api/recruitment/vacancies/:id/technical-profile` | `requireModule('RECLUTAMIENTO')` | `updateTechnicalProfile` | Actualizar perfil técnico de la vacante |
| `POST` | `/api/recruitment/vacancies/:id/activities` | `requireModule('RECLUTAMIENTO')` | `createJobActivities` | Crear actividades del puesto (batch) |
| `PUT` | `/api/recruitment/activities/:activityId` | `requireModule('RECLUTAMIENTO')` | `updateActivity` | Actualizar actividad (completar/descompletar) |

#### 9.5.5 Candidatos

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `POST` | `/api/recruitment/vacancies/:vacancy_id/candidates` | `requireRHOrAdmin()` + Multer (CV + psychTest) | `createCandidate` | Registrar candidato con CV (obligatorio) y prueba psicométrica (opcional) |
| `PUT` | `/api/recruitment/candidates/:candidate_id/observations` | `requireRHOrAdmin()` | `updateCandidateObservations` | Actualizar observaciones de RH |
| `PUT` | `/api/recruitment/candidates/:candidate_id/documents` | `requireRHOrAdmin()` + Multer (CV + psychTest) | `updateCandidateDocuments` | Actualizar documentos del candidato |
| `PUT` | `/api/recruitment/candidates/:candidate_id/vote` | `requireModule('RECLUTAMIENTO')` | `updateCandidateVote` | Votar por candidato (like/dislike/reset) |
| `PUT` | `/api/recruitment/candidates/:candidate_id/select` | `requireModule('RECLUTAMIENTO')` | `selectCandidate` | Seleccionar candidato final y cerrar vacante |
| `GET` | `/api/recruitment/candidates/:candidate_id/cv` | `requireModule('RECLUTAMIENTO')` | `downloadCandidateCV` | Descargar CV del candidato |

#### 9.5.6 Comentarios

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `POST` | `/api/recruitment/vacancies/:id/comments` | `requireModule('RECLUTAMIENTO')` | `addComment` | Agregar comentario (solo solicitante o RH/ADMIN) |

### 9.6 Controlador — Métodos y Lógica

#### 9.6.1 `createVacancy(req, res)` — Creación unificada (~200 líneas)
| Aspecto | Detalle |
|---------|---------|
| **Parámetros** | `titulo`, `departamento_id`, `jobPositionId`, `numeroVacantes`, `motivoSolicitud`, `tipoContratacion`, `isDirect`, +20 campos adicionales |
| **Flujo estándar** | Jefes de área → estado `SOLICITADA`, notifica a RH |
| **Flujo directo** | RH/ADMIN → estado `APROBADA`, notifica al solicitante |
| **Actividades** | Si se proporcionan en el body, se crean automáticamente |
| **Comentario automático** | Se crea comentario según el flujo |
| **Notificaciones** | Email a RH (flujo estándar) o al solicitante (flujo directo) |

#### 9.6.2 `getMyVacancyRequests(req, res)` — Mis vacantes
| Aspecto | Detalle |
|---------|---------|
| **Scoping** | Filtra por `solicitanteId = employee.id` |
| **Paginación** | `?page=1&limit=10` (default) |
| **Incluye** | Departamento, solicitante (con user), `_count` de comments y candidatesRH |
| **Orden** | `createdAt: 'desc'` |

#### 9.6.3 `getAllVacancyRequests(req, res)` — Todas las vacantes (RH)
| Aspecto | Detalle |
|---------|---------|
| **Filtros** | `?estatus=`, `?departamento_id=`, `?search=` (búsqueda en título), `?fecha_desde=`, `?fecha_hasta=` |
| **Paginación** | `?page=1&limit=10` (default) |
| **Incluye** | Departamento, solicitante (con user), `_count` de comments y candidatesRH |

#### 9.6.4 `approveVacancyRequest(req, res)` — Aprobar vacante
| Aspecto | Detalle |
|---------|---------|
| **Transición** | `SOLICITADA → APROBADA` |
| **Acciones** | Actualiza `fechaAutorizacion`, `autorizadoPorId`. Crea comentario automático. Notifica al solicitante por email. |

#### 9.6.5 `closeVacancyRequest(req, res)` — Cerrar vacante (RH)
| Aspecto | Detalle |
|---------|---------|
| **Transición** | Cualquier estado → `CERRADA` |
| **Acciones** | Actualiza `closedAt`. Crea comentario automático. |

#### 9.6.6 `cancelVacancy(req, res)` — Cancelar vacante (solicitante)
| Aspecto | Detalle |
|---------|---------|
| **Transición** | Cualquier estado → `CERRADA` |
| **Validación** | Solo el solicitante puede cancelar |
| **Acciones** | Actualiza `closedAt`. Crea comentario automático. |

#### 9.6.7 `updateTechnicalProfile(req, res)` — Perfil técnico
| Aspecto | Detalle |
|---------|---------|
| **Campos** | `requerimientos_tecnicos` (array), `conocimientosAdicionales`, `entrevistadorTecnico`, `entrevistadorRespaldo` |
| **Transición** | Si está en `APROBADA`, cambia a `BUSCANDO` (inicio de búsqueda) |

#### 9.6.8 `createJobActivities(req, res)` — Actividades del puesto
| Aspecto | Detalle |
|---------|---------|
| **Parámetros** | Array de `{ activityType, description, duration, priority }` |
| **Batch** | Crea múltiples actividades en una sola llamada |
| **Validación** | Solo si la vacante está en estado `APROBADA` o `BUSCANDO` |

#### 9.6.9 `createCandidate(req, res)` — Registrar candidato
| Aspecto | Detalle |
|---------|---------|
| **Archivos** | `cv` (obligatorio, PDF), `psychTest` (opcional, PDF) |
| **Validaciones** | Vacante debe estar en `BUSCANDO`. CV obligatorio y PDF. PsychTest PDF si existe. |
| **Comentario automático** | `👤 Candidato "X" registrado por RH. CV y pruebas psicométricas adjuntas.` |
| **Notificación** | Email al solicitante pidiendo revisión del candidato |
| **Limpieza** | Si falla la creación, elimina archivos subidos del disco |

#### 9.6.10 `updateCandidateVote(req, res)` — Votación colaborativa
| Aspecto | Detalle |
|---------|---------|
| **Acciones** | `like` → `SELECCIONADO`, `dislike` → `DESCARTADO`, `reset` → `EN_REVISION` |
| **Validación** | Like/dislike solo del solicitante. Reset puede hacerlo RH/ADMIN. |
| **Comentario automático** | `👍 Visto bueno`, `👎 No seleccionado`, `🔄 Devuelto a revisión` |
| **Notificación** | Email a RH cuando hay voto (like/dislike) |

#### 9.6.11 `selectCandidate(req, res)` — Selección final
| Aspecto | Detalle |
|---------|---------|
| **Acciones** | Marca candidato como `SELECCIONADO` + cierra vacante (`CERRADA` + `closedAt`) |
| **Validación** | Solo el solicitante |
| **Comentario automático** | `🎯 Candidato "X" seleccionado como final. La vacante ha sido cerrada.` |
| **Notificación** | Email a RH con datos del candidato seleccionado |

### 9.7 Entidades del Módulo

| # | Entidad | Tabla | Campos clave | Relaciones |
|---|---------|-------|-------------|------------|
| 1 | `JobVacancy` | `job_vacancies` | `titulo`, `estatus` (VacancyStatus), `motivoSolicitud` (MotivoVacante), `tipoContratacion` (TipoContratacion), `solicitanteId`, `autorizadoPorId`, `voBoPorId`, `departamento_id`, `jobPositionId`, `numeroVacantes`, `fechaSolicitud`, `fechaAutorizacion`, `closedAt`, `requerimientos_tecnicos` (Json), +20 campos de requerimientos físicos/técnicos | → Employee (x3), Department, JobPosition, CandidateRH[], JobActivity[], VacancyComment[] |
| 2 | `CandidateRH` | `candidates_rh` | `nombre`, `cv_url`, `psych_test_url`, `estatus` (CandidateStatus), `comentarios_rh` | → JobVacancy |
| 3 | `JobActivity` | `job_activities` | `activityType`, `description`, `duration`, `priority`, `isCompleted`, `completedAt` | → JobVacancy |
| 4 | `VacancyComment` | `vacancy_comments` | `mensaje`, `createdAt` | → JobVacancy, User |

### 9.8 Enumeraciones del Módulo

| Enum | Valores | Uso |
|------|---------|-----|
| `VacancyStatus` | `Solicitada`, `Aprobada`, `Buscando`, `Cerrada` | Ciclo de vida de la vacante |
| `CandidateStatus` | `En_Revision`, `Descartado`, `Seleccionado` | Estatus del candidato |
| `MotivoVacante` | `NUEVA_CREACION`, `REEMPLAZO_DEFINITIVO`, `REEMPLAZO_TEMPORAL`, `REEMPLAZO_RENUNCIA`, `REEMPLAZO_TERMINACION_CONTRATO`, `INCREMENTO_PLANTILLA`, `INCREMENTO_PRODUCCION`, `RENUNCIA`, `TERMINACION_CONTRATO`, `LICENCIA`, `LICENCIA_TEMPORAL`, `INCAPACIDAD`, `JUBILACION`, `JUBILACION_RETIRO`, `PROMOCION`, `REESTRUCTURACION`, `MATERNIDAD`, `LICENCIA_MATERNIDAD`, `VACACIONES` (19 valores) | Motivos de solicitud de vacante |
| `TipoContratacion` | `ADMINISTRATIVO`, `TEMPORAL`, `SINDICALIZADO`, `TIEMPO_COMPLETO`, `PERMANENTE`, `BECARIO`, `ROL_TURNOS` (7 valores) | Tipos de contratación |

### 9.9 Notificaciones por Email

El módulo utiliza `email.service.js` para enviar las siguientes notificaciones:

| Tipo de Email | Método en `email.service.js` | ¿Cuándo se envía? | Destinatario |
|--------------|------------------------------|-------------------|--------------|
| Solicitud de aprobación | `sendVacancyApprovalRequired` | Jefe de área crea solicitud | RH / ADMIN |
| Vacante directa creada | `sendVacancyDirectCreated` | RH crea vacante Fast-Track | Solicitante |
| Vacante aprobada | `sendVacancyApproved` | RH aprueba solicitud | Solicitante |
| Revisión de candidato | `sendCandidateReviewRequest` | RH registra candidato | Solicitante |
| Candidato votado | `sendCandidateVoted` | Solicitante vota (like/dislike) | RH / ADMIN |
| Candidato seleccionado | `sendCandidateSelected` | Solicitante selecciona final | RH / ADMIN |

### 9.10 Frontend — Páginas y Componentes

| Ruta/Página | Propósito | Usuarios |
|-------------|-----------|----------|
| `/reclutamiento/mis-solicitudes/` | Mis solicitudes de vacante (jefes de área) | SISTEMAS, COMPRAS, PRODUCCION |
| `/reclutamiento/solicitar-vacante/` | Formulario de nueva solicitud de vacante | SISTEMAS, COMPRAS, PRODUCCION |
| `/reclutamiento/vacantes/[id]/` | Detalle de vacante (info + comentarios + candidatos) | Todos con módulo RECLUTAMIENTO |
| `/reclutamiento/vacantes/[id]/CandidatesTab.js` | Pestaña de gestión de candidatos (votación, selección) | Todos con módulo RECLUTAMIENTO |
| `/reclutamiento/vacantes/[id]/perfil-tecnico/` | Perfil técnico y actividades del puesto | Jefes de área |
| `/rh/reclutamiento/` | Dashboard RH de reclutamiento (todas las vacantes, filtros, stats) | RH, ADMIN |
| `/rh/reclutamiento/crear-vacante/` | Crear vacante (flujo estándar o Fast-Track) | RH, ADMIN |
| `/my-vacancies/` | Mis vacantes (legacy, versión anterior) | SISTEMAS, COMPRAS, PRODUCCION |
| `/vacancies/[id]/activities/` | Actividades del puesto (legacy) | SISTEMAS, COMPRAS, PRODUCCION |

### 9.11 Funcionalidades Clave

| Funcionalidad | Descripción | ¿Dónde? |
|--------------|-------------|---------|
| **Flujo Estándar** | Jefe de área solicita → RH aprueba → Jefe define actividades → RH busca candidatos → Jefe selecciona | Controlador + Frontend |
| **Flujo Fast-Track** | RH crea vacante pre-aprobada con actividades → Búsqueda inmediata | `createDirectVacancy` |
| **Votación Colaborativa** | Jefe de área da like/dislike a candidatos, RH recibe notificación | `updateCandidateVote` |
| **Selección Final** | Jefe de área selecciona candidato → Vacante se cierra automáticamente | `selectCandidate` |
| **Comentarios Automáticos** | Cada acción importante genera un comentario en la vacante | Todo el controlador |
| **Subida de CV** | Solo PDF, obligatorio, almacenado en `uploads/cvs/` | `createCandidate` |
| **Pruebas Psicométricas** | Solo PDF, opcional, almacenado en `uploads/psych-tests/` | `createCandidate` |
| **Paginación** | Mis vacantes y todas las vacantes con paginación (`?page=&limit=`) | `getMyVacancyRequests`, `getAllVacancyRequests` |
| **Filtros Combinados** | Estatus + departamento + búsqueda + rango de fechas | `getAllVacancyRequests` |
| **Helper `getOrCreateSolicitante`** | Busca empleado por userId, o crea uno temporal de RH si no existe | Función helper del controlador |

### 9.12 Resumen del Módulo de Reclutamiento

| Elemento | Cantidad |
|----------|----------|
| **Endpoints REST** | 20 |
| **Controladores** | 1 (unificado, ~1550 líneas) |
| **Entidades en BD** | 4 (JobVacancy, CandidateRH, JobActivity, VacancyComment) |
| **Enums del módulo** | 4 (VacancyStatus, CandidateStatus, MotivoVacante [19 valores], TipoContratacion [7 valores]) |
| **Estados del ciclo de vida** | 4 (SOLICITADA, APROBADA, BUSCANDO, CERRADA) |
| **Flujos de creación** | 2 (Estándar, Fast-Track) |
| **Tipos de email** | 6 |
| **Páginas frontend** | 9 (5 activas + 4 legacy) |
| **Componentes clave** | 1 (CandidatesTab.js) |
| **Archivos subidos** | CVs (PDF) + Pruebas psicométricas (PDF) |
| **Votación colaborativa** | Like / Dislike / Reset |

---

## 10. INVENTARIO EXHAUSTIVO DEL MÓDULO DE EMPLEADOS

### 10.1 Visión General

El módulo de Empleados es el núcleo del sistema de RH, con **28 endpoints REST**, **5 controladores**, **3 entidades en BD**, **sistema de importación/exportación CSV**, **subida de fotos y documentos**, **historial de sueldos**, **jerarquía organizacional** y **scoping de datos basado en nivel jerárquico**.

**Propósito:** Gestionar el ciclo de vida completo de los empleados de la empresa KRAM, desde su alta hasta su baja, incluyendo datos personales, laborales, financieros, documentación, fotografía, estructura jerárquica y organigrama.

### 10.2 Arquitectura del Módulo

```
┌─────────────────────────────────────────────────────────────────────┐
│                  MÓDULO DE EMPLEADOS — ARQUITECTURA                  │
│                                                                     │
│  FRONTEND (Next.js)                                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  PÁGINAS:                                                    │   │
│  │  ├── /rh/empleados/                  → Lista de empleados    │   │
│  │  ├── /rh/empleados/[id]/             → Detalle de empleado   │   │
│  │  ├── /dashboard/mi-espacio/          → Mi Espacio            │   │
│  │  ├── /dashboard/organizacion/        → Organigrama           │   │
│  │  └── /dashboard/profile/             → Perfil de usuario     │   │
│  │                                                              │   │
│  │  COMPONENTES CLAVE:                                          │   │
│  │  ├── EmployeeTable.js               → Tabla con filtros      │   │
│  │  ├── EmployeeForm.js                → Formulario completo    │   │
│  │  ├── EmployeeImport.js              → Importación CSV        │   │
│  │  └── employeePdfExport.js           → Exportación PDF        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                           │ HTTP                                     │
│                           ▼                                         │
│  BACKEND (Express)                                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  employee.routes.js           → 23 endpoints                 │   │
│  │  employeeDocument.routes.js   → 5 endpoints                  │   │
│  │                                                              │   │
│  │  CONTROLADORES:                                              │   │
│  │  ├── employee-core.controller.js   → CRUD + scoping (1123L) │   │
│  │  ├── employee-csv.controller.js    → Import/Export CSV (831L)│   │
│  │  ├── employee-org.controller.js    → Deptos, puestos (423L) │   │
│  │  ├── employee-photo.controller.js  → Fotos de perfil (55L)  │   │
│  │  └── employeeDocument.controller.js→ Documentos (186L)      │   │
│  │                                                              │   │
│  │  UTILIDADES:                                                 │   │
│  │  ├── csvMapper.js                  → Mapeo CSV → Prisma     │   │
│  │  └── salaryCalculator.js           → Cálculo SD/SDI         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                           │ SQL                                     │
│                           ▼                                         │
│  BASE DE DATOS (PostgreSQL)                                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  employees              → Datos maestros de empleados        │   │
│  │  employee_documents     → Documentos (INE, CURP, etc.)       │   │
│  │  salary_history         → Historial de sueldos               │   │
│  │  departments            → Catálogo de departamentos          │   │
│  │  job_positions          → Catálogo de puestos                │   │
│  │  factores_integracion   → Catálogo de factores SDI           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.3 Scoping de Datos (Visibilidad Jerárquica)

El módulo implementa un sistema de **scoping de datos basado en nivel jerárquico** (Nivel B del sistema ACL):

| Nivel Jerárquico | Visibilidad |
|-----------------|-------------|
| `ADMIN` / `RH` | Todos los empleados (sin restricciones) |
| `PRESIDENTE` / `DIRECTOR` / `GERENTE` / `JEFE` | Empleados de su mismo departamento |
| `COORDINADOR` / `ANALISTA` / `SUPERVISOR` / `AUX_ADMINISTRATIVO` | Su propio registro + empleados que le reportan directamente |
| `OPERATIVO` | Solo su propio registro |
| Sin empleado asociado | No ve ningún empleado |

### 10.4 Reglas de Negocio

| Regla | Descripción |
|-------|-------------|
| **Campos únicos** | RFC, CURP, NSS, clave de empleado son únicos en el sistema |
| **Campos requeridos** | RFC, CURP, NSS, fecha de ingreso, puesto y departamento son obligatorios |
| **Baja lógica** | `deleteEmployee` cambia estatus a `Inactivo` (no elimina) |
| **Baja física** | `deleteEmployeePermanently` elimina el registro de BD (solo RH/ADMIN) |
| **Importación CSV** | Columnas obligatorias: RFC, CURP, NSS, FECHA ALTA, PUESTO |
| **Modos de duplicados** | `error` (default), `skip`, `update` en importación CSV |
| **Creación de usuarios** | Opcional al importar CSV (`createUsers=true`) |
| **Foto de perfil** | Una foto por empleado, se reemplaza al subir nueva |
| **Documentos** | 10 tipos permitidos, extensiones: .pdf, .jpg, .jpeg, .png, .doc, .docx |
| **Historial de sueldos** | Se registra automáticamente al crear/actualizar salario |
| **Jerarquía** | Auto-referencia: `reportaAId` → Employee (jefe directo) |
| **Paginación** | Listado con `?page=&limit=` (default: page=1, limit=20, max: 100) |

### 10.5 Endpoints del Módulo

#### 10.5.1 CRUD de Empleados (`employee.routes.js`)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/api/employees` | `requireModule('EMPLEADOS')` | `employeeCoreController.getAllEmployees` | Listar empleados (con scoping jerárquico + paginación + filtros) |
| `GET` | `/api/employees/me` | `verifyToken` | `employeeCoreController.getCurrentEmployee` | Empleado asociado al usuario autenticado |
| `GET` | `/api/employees/stats` | `requireRHOrAdmin()` | `employeeOrgController.getEmployeeStats` | Estadísticas (total, activos, inactivos, por depto, por puesto) |
| `POST` | `/api/employees` | `requireRHOrAdmin()` | `employeeCoreController.createEmployee` | Crear empleado (con validación de duplicados + cálculo SD/SDI) |
| `GET` | `/api/employees/:id` | `requireRHOrAdmin()` | `employeeCoreController.getEmployeeById` | Detalle con relaciones (depto, puesto, user, docs, jerarquía) |
| `PUT` | `/api/employees/:id` | `requireRHOrAdmin()` | `employeeCoreController.updateEmployee` | Actualizar empleado (con historial de sueldos si cambia salario) |
| `DELETE` | `/api/employees/:id` | `requireRHOrAdmin()` | `employeeCoreController.deleteEmployee` | Baja lógica (estatus → Inactivo) |
| `DELETE` | `/api/employees/:id/permanent` | `requireRHOrAdmin()` | `employeeCoreController.deleteEmployeePermanently` | Baja física (elimina registro) |
| `GET` | `/api/employees/:id/salary-history` | `requireRHOrAdmin()` | `employeeCoreController.getSalaryHistory` | Historial de sueldos del empleado |

#### 10.5.2 Importación/Exportación CSV

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/api/employees/template` | `requireRHOrAdmin()` | `employeeCsvController.downloadImportTemplate` | Descargar plantilla CSV |
| `POST` | `/api/employees/import` | `requireRHOrAdmin()` + Multer | `employeeCsvController.importEmployees` | Importar empleados desde CSV |
| `GET` | `/api/employees/export` | `requireRHOrAdmin()` | `employeeCsvController.exportEmployees` | Exportar empleados a CSV |

#### 10.5.3 Foto de Perfil

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `POST` | `/api/employees/:id/photo` | `requireRHOrAdmin()` + Multer | `employeePhotoController.uploadProfilePhoto` | Subir foto de perfil |

#### 10.5.4 Documentos de Empleados (`employeeDocument.routes.js`)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/api/employee/:employeeId/documents` | `requireModule('EMPLEADOS')` | `employeeDocumentController.getEmployeeDocuments` | Listar documentos |
| `GET` | `/api/employee-documents/allowed-types` | `requireModule('EMPLEADOS')` | `employeeDocumentController.getAllowedDocumentTypes` | Tipos de documentos permitidos |
| `POST` | `/api/employee/:employeeId/documents` | `requireRHOrAdmin()` + Multer | `employeeDocumentController.uploadEmployeeDocument` | Subir documento |
| `GET` | `/api/employee-documents/:documentId/download` | `requireModule('EMPLEADOS')` | `employeeDocumentController.downloadEmployeeDocument` | Descargar documento |
| `DELETE` | `/api/employee-documents/:documentId` | `requireRHOrAdmin()` | `employeeDocumentController.deleteEmployeeDocument` | Eliminar documento |

#### 10.5.5 Departamentos

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/api/departments` | `verifyToken` | `employeeOrgController.getDepartments` | Listar departamentos |
| `POST` | `/api/departments` | `requireRHOrAdmin()` | `employeeOrgController.createDepartment` | Crear departamento |
| `PUT` | `/api/departments/:id` | `requireRHOrAdmin()` | `employeeOrgController.updateDepartment` | Actualizar departamento |
| `DELETE` | `/api/departments/:id` | `requireRHOrAdmin()` | `employeeOrgController.deleteDepartment` | Eliminar departamento |
| `GET` | `/api/departments/:id/job-positions` | `verifyToken` | `employeeOrgController.getJobPositionsByDepartment` | Puestos por departamento |

#### 10.5.6 Puestos de Trabajo

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/api/job-positions` | `verifyToken` | `employeeOrgController.getAllJobPositions` | Listar puestos |
| `POST` | `/api/job-positions` | `requireRHOrAdmin()` | `employeeOrgController.createJobPosition` | Crear puesto |
| `PUT` | `/api/job-positions/:id` | `requireRHOrAdmin()` | `employeeOrgController.updateJobPosition` | Actualizar puesto |
| `DELETE` | `/api/job-positions/:id` | `requireRHOrAdmin()` | `employeeOrgController.deleteJobPosition` | Eliminar puesto |

#### 10.5.7 Jerarquía

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/api/managers` | `verifyToken` | `employeeOrgController.getManagers` | Jefes directos (nivel PRESIDENTE a SUPERVISOR) |

### 10.6 Controladores — Métodos y Lógica

#### 10.6.1 `employee-core.controller.js` — CRUD Principal (~1123 líneas)

| Método | Descripción | Validaciones clave |
|--------|-------------|-------------------|
| `getAllEmployees(req, res)` | Listar con scoping jerárquico + paginación + filtros | Scoping por nivel jerárquico, filtros: `?estatus=`, `?departamento_id=`, `?search=`, `?page=`, `?limit=` |
| `getCurrentEmployee(req, res)` | Empleado del usuario autenticado | Busca por `userId`, incluye depto, puesto, user, docs, vacantes |
| `getEmployeeById(req, res)` | Detalle completo con relaciones | Incluye reportaA (jefe) y subordinados (jerarquía completa) |
| `createEmployee(req, res)` | Crear con ~50 campos | Valida RFC/CURP/NSS únicos, campos requeridos, calcula SD/SDI |
| `updateEmployee(req, res)` | Actualizar con historial de sueldos | Si cambia salario → registra en `SalaryHistory` |
| `deleteEmployee(req, res)` | Baja lógica | Cambia `estatus` a `Inactivo` |
| `deleteEmployeePermanently(req, res)` | Baja física | Elimina registro de BD |
| `getSalaryHistory(req, res)` | Historial de sueldos | Ordenado por fecha descendente |

#### 10.6.2 `employee-csv.controller.js` — Importación/Exportación (~831 líneas)

| Método | Descripción | Lógica |
|--------|-------------|--------|
| `importEmployees(req, res)` | Importar desde CSV | Lee buffer o disco, parsea con `csv-parser`, mapea con `csvMapper`, valida cabeceras, maneja duplicados (error/skip/update), crea usuarios opcionalmente, transacción Prisma |
| `exportEmployees(req, res)` | Exportar a CSV | Genera CSV con todos los empleados activos |
| `downloadImportTemplate(req, res)` | Plantilla CSV | Archivo predefinido con cabeceras |

**Columnas del CSV (mapeadas por `csvMapper.js`):**
| Columna CSV | Campo Prisma | Obligatorio |
|-------------|-------------|-------------|
| `RFC` | `rfc` | ✅ |
| `CURP` | `curp` | ✅ |
| `NSS` | `nss` | ✅ |
| `FECHA ALTA` | `fechaAlta` | ✅ |
| `PUESTO` | `puesto` (búsqueda en JobPosition) | ✅ |
| `NOMBRE` | `nombre` | ❌ |
| `APELLIDO PATERNO` | `apellidoPaterno` | ❌ |
| `APELLIDO MATERNO` | `apellidoMaterno` | ❌ |
| `SD` | `sd` | ❌ |
| `SDI` | `sdi` | ❌ |
| *+30 columnas adicionales* | varios | ❌ |

#### 10.6.3 `employee-org.controller.js` — Organización (~423 líneas)

| Método | Descripción |
|--------|-------------|
| `getEmployeeStats(req, res)` | Estadísticas: total, activos, inactivos, por departamento, top 10 puestos |
| `getDepartments(req, res)` | Listar departamentos (orden alfabético) |
| `createDepartment(req, res)` | Crear departamento |
| `updateDepartment(req, res)` | Actualizar departamento |
| `deleteDepartment(req, res)` | Eliminar departamento |
| `getAllJobPositions(req, res)` | Listar puestos |
| `createJobPosition(req, res)` | Crear puesto (con nivel jerárquico y departamento) |
| `updateJobPosition(req, res)` | Actualizar puesto |
| `deleteJobPosition(req, res)` | Eliminar puesto |
| `getManagers(req, res)` | Jefes directos (PRESIDENTE, DIRECTOR, GERENTE, JEFE, COORDINADOR, SUPERVISOR) |
| `getJobPositionsByDepartment(req, res)` | Puestos por departamento |

#### 10.6.4 `employee-photo.controller.js` — Fotos (~55 líneas)

| Método | Descripción |
|--------|-------------|
| `uploadProfilePhoto(req, res)` | Subir foto, actualiza `fotoUrl` en Employee, almacena en `uploads/photos/` |

#### 10.6.5 `employeeDocument.controller.js` — Documentos (~186 líneas)

| Método | Descripción | Validaciones |
|--------|-------------|-------------|
| `getEmployeeDocuments(req, res)` | Listar documentos de un empleado | Ordenados por fecha descendente |
| `getAllowedDocumentTypes(req, res)` | Tipos permitidos | 10 tipos predefinidos |
| `uploadEmployeeDocument(req, res)` | Subir documento | Valida tipo, extensión, empleado existe. Guarda en `uploads/employee-documents/` |
| `downloadEmployeeDocument(req, res)` | Descargar archivo | Stream del archivo |
| `deleteEmployeeDocument(req, res)` | Eliminar documento | Elimina archivo del disco + registro BD |

**Tipos de documentos permitidos:**
`Contrato`, `Identificación Oficial`, `Comprobante de Domicilio`, `Acta de Nacimiento`, `CURP`, `RFC`, `NSS`, `Título Profesional`, `Carta de Recomendación`, `Otro`

**Extensiones permitidas:** `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`

### 10.7 Entidades del Módulo

| # | Entidad | Tabla | Campos clave | Relaciones |
|---|---------|-------|-------------|------------|
| 1 | `Employee` | `employees` | `rfc` (único), `curp` (único), `nss` (único), `clave` (único), `nombre`, `departamento_id`, `puestoId`, `nivelJerarquico` (NivelJerarquico), `reportaAId`, `salarioMensual`, `sd`, `sdi`, `fechaAlta`, `fechaBaja`, `estatus` (EmployeeStatus), `fotoUrl`, +40 campos adicionales | → User, Department, JobPosition, Employee (auto), EmployeeDocument[], SalaryHistory[], NotificationLog[], JobVacancy[] (x3), PurchaseRequest[] (x2), PurchaseApprover[] |
| 2 | `EmployeeDocument` | `employee_documents` | `employee_id`, `tipo_documento`, `nombre_archivo`, `url_archivo`, `mime_type`, `size_bytes` | → Employee |
| 3 | `SalaryHistory` | `salary_history` | `employeeId`, `salarioAnterior`, `salarioNuevo`, `sdAnterior`, `sdNuevo`, `sdiAnterior`, `sdiNuevo`, `factorUsado`, `tipoCambio` (ALTA/INCREMENTO/DECREMENTO/AJUSTE) | → Employee |
| 4 | `Department` | `departments` | `nombre` (único), `descripcion`, `estado` | → Employee[], JobPosition[], JobVacancy[], PurchaseRequest[] |
| 5 | `JobPosition` | `job_positions` | `nombre`, `descripcion`, `nivelJerarquico` (NivelJerarquico), `departamentoId` | → Department, Employee[], JobVacancy[] |
| 6 | `FactorIntegracion` | `factores_integracion` | `anio` (1-30), `diasAguinaldo`, `diasVacaciones`, `primaVacacional`, `factor` | Independiente (catálogo) |

### 10.8 Utilidades del Módulo

#### 10.8.1 `csvMapper.js` — Mapeo CSV → Prisma
| Función | Descripción |
|---------|-------------|
| `mapEmployeeFromCsv(data, prisma)` | Mapea fila CSV a objeto Employee, busca departamento y puesto por nombre |
| `validateEmployeeData(employeeData, rowNumber)` | Valida campos requeridos y formatos |
| `prepareForPrisma(employeeData)` | Prepara datos para inserción en Prisma |
| `validateCsvHeaders(headers)` | Valida que existan las columnas obligatorias |

#### 10.8.2 `salaryCalculator.js` — Cálculo de SD/SDI
| Función | Descripción |
|---------|-------------|
| `calcularTodo(salarioMensual, fechaAlta)` | Calcula SD, SDI y factor de integración basado en antigüedad |
| `calcularSD(salarioMensual)` | Salario diario = salarioMensual / 30 |
| `calcularSDI(salarioMensual, fechaAlta)` | SDI = SD × factor de integración (según años de antigüedad) |
| `obtenerFactorIntegracion(aniosAntiguedad)` | Busca en tabla `factores_integracion` el factor correspondiente |

### 10.9 Frontend — Páginas y Componentes

| Ruta/Página | Propósito | Usuarios |
|-------------|-----------|----------|
| `/rh/empleados/` | Lista de empleados con tabla, filtros, paginación, CRUD | RH, ADMIN |
| `/rh/empleados/[id]/` | Detalle de empleado con expediente completo | RH, ADMIN |
| `/dashboard/mi-espacio/` | Mi Espacio (autoservicio para jefes) | Jefes de área |
| `/dashboard/organizacion/` | Organigrama de la empresa | ADMIN |
| `/dashboard/profile/` | Perfil de usuario | Todos |

| Componente | Propósito |
|-----------|-----------|
| `EmployeeTable.js` | Tabla de empleados con búsqueda, filtros por departamento/estatus, paginación |
| `EmployeeForm.js` | Formulario completo de alta/edición de empleados (~50 campos) |
| `EmployeeImport.js` | Modal de importación CSV con selector de archivo y opciones |
| `employeePdfExport.js` | Exportación de datos de empleados a PDF |

### 10.10 Funcionalidades Clave

| Funcionalidad | Descripción | ¿Dónde? |
|--------------|-------------|---------|
| **Scoping Jerárquico** | Cada usuario ve solo los empleados que le corresponde según su nivel | `getAllEmployees` |
| **Importación CSV Masiva** | Alta de múltiples empleados desde archivo CSV con 3 modos de duplicados | `employee-csv.controller.js` |
| **Creación Automática de Usuarios** | Al importar CSV, puede crear usuarios con contraseña temporal | `importEmployees` |
| **Cálculo Automático SD/SDI** | Al dar de alta un empleado, calcula salario diario e integrado | `salaryCalculator.js` |
| **Historial de Sueldos** | Cada cambio salarial queda registrado automáticamente | `updateEmployee` |
| **Jerarquía Organizacional** | Auto-referencia con jefe directo y subordinados | Modelo Employee |
| **Documentos por Tipo** | 10 tipos de documentos con validación de extensiones | `employeeDocument.controller.js` |
| **Foto de Perfil** | Subida y actualización de foto por empleado | `employee-photo.controller.js` |
| **Paginación** | Listado con `?page=&limit=` (default 20, máximo 100) | `getAllEmployees` |
| **Baja Lógica y Física** | Dos modalidades de eliminación | `deleteEmployee` / `deleteEmployeePermanently` |

### 10.11 Resumen del Módulo de Empleados

| Elemento | Cantidad |
|----------|----------|
| **Endpoints REST** | 28 (23 employee.routes + 5 employeeDocument.routes) |
| **Controladores** | 5 (core, csv, org, photo, document) |
| **Entidades en BD** | 6 (Employee, EmployeeDocument, SalaryHistory, Department, JobPosition, FactorIntegracion) |
| **Enums del módulo** | 2 (EmployeeStatus, NivelJerarquico [9 valores]) |
| **Tipos de documentos** | 10 |
| **Extensiones permitidas** | 6 (.pdf, .jpg, .jpeg, .png, .doc, .docx) |
| **Niveles jerárquicos** | 9 (PRESIDENTE a OPERATIVO) |
| **Campos del empleado** | ~50+ |
| **Páginas frontend** | 5 |
| **Componentes clave** | 4 (EmployeeTable, EmployeeForm, EmployeeImport, employeePdfExport) |
| **Utilidades** | 2 (csvMapper, salaryCalculator) |
| **Archivos subidos** | Fotos (photos/), Documentos (employee-documents/) |

---

## 11. INVENTARIO EXHAUSTIVO DEL MÓDULO DE DASHBOARDS

### 11.1 Visión General

El módulo de Dashboards agrupa **4 paneles de visualización** que presentan datos agregados de los módulos de Empleados, Reclutamiento y Compras. Utiliza **3 endpoints REST** (1 controlador con 5 métodos), **gráficas Recharts** y **componentes de resumen**.

**Propósito:** Proporcionar visibilidad rápida del estado de la organización a diferentes niveles: RH (visión global), jefes de área (visión departamental/personal), ADMIN (visión del sistema) y usuarios regulares (dashboard genérico con accesos directos).

### 11.2 Arquitectura del Módulo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MÓDULO DE DASHBOARDS — ARQUITECTURA               │
│                                                                     │
│  FRONTEND (Next.js)                                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  PANELES:                                                    │   │
│  │                                                              │   │
│  │  /dashboard/                  → Dashboard genérico           │   │
│  │    (accesos directos dinámicos según módulos del usuario)    │   │
│  │                                                              │   │
│  │  /rh/dashboard-completo/      → Dashboard RH                 │   │
│  │    (estadísticas globales de empleados, vacantes,            │   │
│  │     reclutamiento, contrataciones recientes)                 │   │
│  │                                                              │   │
│  │  /dashboard/mi-espacio/       → Mi Espacio (jefes de área)   │   │
│  │    (mis vacantes, mis compras, actividades pendientes,       │   │
│  │     candidatos en revisión)                                  │   │
│  │                                                              │   │
│  │  /dashboard/organizacion/     → Organigrama                  │   │
│  │    (gestión de departamentos y puestos)                      │   │
│  │                                                              │   │
│  │  COMPONENTES COMPARTIDOS:                                    │   │
│  │  ├── UpcomingEventsWidget.js  → Cumpleaños/aniversarios      │   │
│  │  └── DashboardLayout.js       → Layout con sidebar           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                           │ HTTP                                     │
│                           ▼                                         │
│  BACKEND (Express)                                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  stats.routes.js              → 3 endpoints                  │   │
│  │                                                              │   │
│  │  stats.controller.js          → 5 métodos (472 líneas)       │   │
│  │  ├── getRHDashboardStats      → Dashboard RH                 │   │
│  │  ├── getMyDashboardStats      → Mi Espacio (jefes)           │   │
│  │  ├── getDepartmentStats       → Legacy (jefes)               │   │
│  │  ├── getSystemStats           → Sistema (solo ADMIN)         │   │
│  │  └── getRHStats               → Legacy (RH)                  │   │
│  │                                                              │   │
│  │  SERVICIOS RELACIONADOS:                                     │   │
│  │  └── birthdayAnniversary.service.js → Cumpleaños/aniversarios│   │
│  └──────────────────────────────────────────────────────────────┘   │
│                           │ SQL                                     │
│                           ▼                                         │
│  BASE DE DATOS (PostgreSQL)                                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Consultas agregadas sobre:                                  │   │
│  │  ├── employees          → Total, activos, inactivos, altas   │   │
│  │  ├── job_vacancies      → Total, por estatus                 │   │
│  │  ├── candidates_rh      → Total, por estatus                 │   │
│  │  ├── job_activities     → Pendientes                         │   │
│  │  ├── purchase_requests  → Total, activas (Mi Espacio)        │   │
│  │  ├── users              → Total, activos, por rol (System)   │   │
│  │  └── employee_documents → Total (System)                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.3 Endpoints del Módulo

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/api/stats/rh/dashboard` | `requireModule('EMPLEADOS')` | `getRHDashboardStats` | Dashboard RH: empleados, vacantes, reclutamiento, contrataciones recientes |
| `GET` | `/api/stats/my-dashboard` | `requireModule('EMPLEADOS')` | `getMyDashboardStats` | Mi Espacio: mis vacantes, mis compras, actividades pendientes, candidatos |
| `GET` | `/api/stats/system` | `requireModule('CONFIGURACION')` | `getSystemStats` | Sistema: usuarios, empleados, vacantes, candidatos, documentos, uptime |

**Endpoints legacy (mantenidos por compatibilidad):**

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/api/stats/rh` | `requireModule('EMPLEADOS')` | `getRHStats` | RH legacy: empleados, vacantes, candidatos |
| `GET` | `/api/stats/department` | `requireModule('RECLUTAMIENTO')` | `getDepartmentStats` | Legacy: vacantes, actividades, candidatos del jefe |

### 11.4 Controlador — Métodos y Lógica

#### 11.4.1 `getRHDashboardStats(req, res)` — Dashboard RH (~120 líneas)

| Aspecto | Detalle |
|---------|---------|
| **Protección** | `requireModule('EMPLEADOS')` |
| **Datos devueltos** | `employees` (total, active, onVacation, onLeave), `vacancies` (total, open, inProgress, closed), `recruitment` (total, thisMonth, pending), `recentHires` (últimos 5), `lastUpdated` |
| **Consultas** | 7 consultas a BD: Employee (x3), JobVacancy (x4), CandidateRH (x1) |
| **Lógica** | `openVacancies` = Aprobada + Buscando. `inProgressVacancies` = Buscando. `hiresThisMonth` = empleados con fechaAlta en el mes actual. `recentHires` = top 5 empleados contratados este mes con departamento y puesto. |
| **Nota** | `employeesOnVacation` y `employeesOnLeave` están hardcodeados a 0 (TODO: implementar lógica real) |

#### 11.4.2 `getMyDashboardStats(req, res)` — Mi Espacio (~100 líneas)

| Aspecto | Detalle |
|---------|---------|
| **Protección** | `requireModule('EMPLEADOS')` |
| **Scoping** | Busca empleado por `userId`. Si no existe, devuelve datos vacíos. |
| **Datos devueltos** | `myVacancies` (total, active, latest[3]), `myPurchases` (total, active, latest[3]), `pendingActivities` (total, activities[5]), `candidates` (total, enRevision), `lastUpdated` |
| **Consultas** | Employee (x1), JobVacancy (x1), PurchaseRequest (x1, try/catch por si no existe modelo), JobActivity (x1), CandidateRH (x1) |
| **Lógica** | `activeVacancies` = no Cerrada. `myPurchases` usa try/catch por si el modelo PurchaseRequest no existe. `pendingActivities` filtradas por vacantes del empleado. `candidates` filtrados por vacantes del empleado. |

#### 11.4.3 `getSystemStats(req, res)` — Sistema (~70 líneas)

| Aspecto | Detalle |
|---------|---------|
| **Protección** | `requireModule('CONFIGURACION')` + verificación inline `req.user.role !== 'ADMIN'` (Nivel C) |
| **Datos devueltos** | `users` (total, active, byRole), `employees` (total), `vacancies` (total), `candidates` (total), `activities` (total), `documents` (total), `system` (uptime, lastUpdated) |
| **Consultas** | 7 consultas a BD: User (x2), Employee (x1), JobVacancy (x1), CandidateRH (x1), JobActivity (x1), EmployeeDocument (x1) |
| **Lógica** | `usersByRole` usa `groupBy` y reduce a objeto `{ ROL: count }`. `system.uptime` = `process.uptime()`. |

#### 11.4.4 `getRHStats(req, res)` — Legacy (~60 líneas)

| Aspecto | Detalle |
|---------|---------|
| **Protección** | `requireModule('EMPLEADOS')` |
| **Datos devueltos** | `employees` (total, activos, inactivos), `vacancies` (total, solicitadas, aprobadas, buscando, cerradas), `candidates` (total, byStatus), `lastUpdated` |
| **Nota** | Endpoint antiguo mantenido por compatibilidad. Usa `filter()` en lugar de `count()` para vacantes. |

#### 11.4.5 `getDepartmentStats(req, res)` — Legacy (~100 líneas)

| Aspecto | Detalle |
|---------|---------|
| **Protección** | `requireModule('RECLUTAMIENTO')` |
| **Scoping** | Busca empleado por `userId`. Filtra vacantes por `solicitanteId`. |
| **Datos devueltos** | `vacancyRequests` (total, solicitadas, aprobadas, buscando, cerradas), `pendingActivities` (total, activities), `candidates` (total, enRevision, descartados, seleccionados), `lastUpdated` |
| **Nota** | Endpoint antiguo mantenido por compatibilidad. |

### 11.5 Frontend — Paneles y Componentes

#### 11.5.1 Dashboard Genérico (`/dashboard/`)

| Aspecto | Detalle |
|---------|---------|
| **Archivo** | `frontend/app/dashboard/page.js` (~132 líneas) |
| **Propósito** | Página principal del dashboard con accesos directos dinámicos |
| **Usuarios** | Todos los usuarios autenticados |
| **Lógica** | Construye array de módulos basado en `user.accessibleModules` y `user.role`. Muestra tarjetas con icono, nombre y enlace. |
| **Módulos base** | Mi Perfil (siempre), Mi Espacio (si tiene EMPLEADOS) |
| **Módulos dinámicos** | |
| | `EMPLEADOS` → Mi Equipo, Organización (solo ADMIN) |
| | `RECLUTAMIENTO` → Mis Vacantes, Solicitar Vacante, RH-Reclutamiento (solo RH/ADMIN), Crear Vacante HR (solo RH/ADMIN), Dashboard Completo (solo RH/ADMIN) |
| | `COMPRAS` → Mis Compras, Nueva Solicitud, Gestión Global (solo ADMIN/COMPRAS) |
| | `REPORTES` → Reportes |
| | `CONFIGURACION` → Usuarios (solo ADMIN), Accesos (solo ADMIN) |
| | `INCIDENCIAS` → Incidencias |
| **Widget adicional** | `UpcomingEventsWidget` — Próximos cumpleaños y aniversarios |

#### 11.5.2 Dashboard RH (`/rh/dashboard-completo/`)

| Aspecto | Detalle |
|---------|---------|
| **Archivo** | `frontend/app/rh/dashboard-completo/page.js` (~488 líneas) |
| **Propósito** | Panel de control completo para RH con gráficas y estadísticas |
| **Usuarios** | RH, ADMIN |
| **API** | `GET /api/stats/rh/dashboard` |
| **Gráficas** | |
| | **Barras** (Recharts): Vacantes por estatus (Solicitadas, Aprobadas, Buscando, Cerradas) |
| | **Pastel** (Recharts): Distribución de empleados (Activos, Vacaciones, Incapacidad) |
| **Tarjetas/KPIs** | |
| | Total empleados, Empleados activos, En vacaciones, En incapacidad |
| | Total vacantes, Vacantes abiertas, En proceso, Cerradas |
| | Total candidatos, Contrataciones del mes, Vacantes pendientes |
| **Tablas** | Contrataciones recientes (últimos 5 empleados contratados) |
| **Widget** | `UpcomingEventsWidget` — Próximos cumpleaños y aniversarios |
| **Acciones** | Botón "Actualizar datos" para refrescar manualmente |

#### 11.5.3 Mi Espacio (`/dashboard/mi-espacio/`)

| Aspecto | Detalle |
|---------|---------|
| **Archivo** | `frontend/app/dashboard/mi-espacio/page.js` (~388 líneas) |
| **Propósito** | Panel de autoservicio para jefes de área |
| **Usuarios** | Jefes de área (SISTEMAS, COMPRAS, PRODUCCION) con módulo EMPLEADOS |
| **API** | `GET /api/stats/my-dashboard` |
| **Gráficas** | |
| | **Pastel** (Recharts): Vacantes por estatus (Solicitadas, Aprobadas, Buscando, Cerradas) |
| | **Barras** (Recharts): Candidatos (En revisión, Descartados, Seleccionados) |
| **Tarjetas/KPIs** | |
| | Mis vacantes (total, activas) |
| | Mis compras (total, activas) |
| | Actividades pendientes |
| | Candidatos en revisión |
| **Tablas** | |
| | Últimas vacantes (3 más recientes con estatus y departamento) |
| | Actividades pendientes (5 más recientes con tipo y descripción) |
| **Acciones** | Botón "Actualizar datos" para refrescar manualmente |

#### 11.5.4 Organigrama (`/dashboard/organizacion/`)

| Aspecto | Detalle |
|---------|---------|
| **Archivo** | `frontend/app/dashboard/organizacion/page.js` (~683 líneas) |
| **Propósito** | Gestión de departamentos y puestos de trabajo |
| **Usuarios** | ADMIN (visible en el dashboard genérico solo para ADMIN) |
| **API** | `GET /api/departments`, `GET /api/job-positions` |
| **Funcionalidades** | |
| | **Pestañas**: Departamentos / Puestos |
| | **CRUD Departamentos**: Crear, editar, eliminar (con confirmación) |
| | **CRUD Puestos**: Crear, editar, eliminar (con nivel jerárquico y departamento asociado) |
| | **Búsqueda**: Filtro por texto en ambas pestañas |
| | **Paginación**: 12 items por página |
| | **Modal de puestos por departamento**: Ver todos los puestos de un departamento específico |
| **Niveles jerárquicos** | PRESIDENTE, DIRECTOR, GERENTE, JEFE, COORDINADOR, ANALISTA, SUPERVISOR, AUX_ADMINISTRATIVO, OPERATIVO |

### 11.6 Servicios Relacionados

#### 11.6.1 `birthdayAnniversary.service.js` — Cumpleaños y Aniversarios

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Calcular próximos cumpleaños y aniversarios de empleados |
| **Endpoint** | `GET /api/notifications/upcoming` |
| **Lógica** | Busca empleados activos, calcula próximos cumpleaños (día y mes actual o próximo) y aniversarios (fecha de ingreso). |
| **Uso** | Widget `UpcomingEventsWidget` en dashboards |

#### 11.6.2 `UpcomingEventsWidget.js` — Widget de Eventos

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Mostrar próximos cumpleaños y aniversarios en el dashboard |
| **Ubicación** | `frontend/components/UpcomingEventsWidget.js` |
| **API** | `GET /api/notifications/upcoming` |
| **Visualización** | Lista de eventos con iconos (🎂 cumpleaños, 🎉 aniversario) y días restantes |

### 11.7 Flujo de Datos por Panel

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE DATOS — DASHBOARDS                       │
│                                                                     │
│  PANEL RH (/rh/dashboard-completo)                                  │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────────────┐  │
│  │  Página   │───→│  stats.controller│───→│  Prisma Queries     │  │
│  │  React    │    │  getRHDashboard  │    │  - Employee.count   │  │
│  │  (488L)   │←───│  Stats()         │←───│  - JobVacancy.count │  │
│  └──────────┘    └──────────────────┘    │  - CandidateRH.count │  │
│                                           └──────────────────────┘  │
│                                                                     │
│  PANEL MI ESPACIO (/dashboard/mi-espacio)                           │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────────────┐  │
│  │  Página   │───→│  stats.controller│───→│  Prisma Queries     │  │
│  │  React    │    │  getMyDashboard  │    │  - Employee.find    │  │
│  │  (388L)   │←───│  Stats()         │←───│  - JobVacancy.find  │  │
│  └──────────┘    └──────────────────┘    │  - PurchaseRequest   │  │
│                                           │  - JobActivity.find  │  │
│                                           │  - CandidateRH.find  │  │
│                                           └──────────────────────┘  │
│                                                                     │
│  PANEL SISTEMA (/stats/system)                                      │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────────────┐  │
│  │  (API)    │───→│  stats.controller│───→│  Prisma Queries     │  │
│  │           │    │  getSystemStats  │    │  - User (x2)        │  │
│  │           │←───│  ()              │←───│  - Employee.count   │  │
│  └──────────┘    └──────────────────┘    │  - JobVacancy.count  │  │
│                                           │  - CandidateRH.count │  │
│                                           │  - JobActivity.count │  │
│                                           │  - EmployeeDocument  │  │
│                                           └──────────────────────┘  │
│                                                                     │
│  DASHBOARD GENÉRICO (/dashboard)                                    │
│  ┌──────────┐                                                      │
│  │  Página   │── Lógica 100% frontend                              │
│  │  React    │── Basada en user.accessibleModules + user.role      │
│  │  (132L)   │── Sin llamadas a API de estadísticas                │
│  └──────────┘                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.8 Resumen del Módulo de Dashboards

| Elemento | Cantidad |
|----------|----------|
| **Endpoints REST** | 3 activos + 2 legacy = 5 total |
| **Controlador** | 1 (stats.controller.js, 472 líneas, 5 métodos) |
| **Paneles frontend** | 4 (Dashboard genérico, RH Dashboard, Mi Espacio, Organigrama) |
| **Gráficas Recharts** | 2 tipos (Barras, Pastel) en 2 paneles |
| **KPIs totales** | ~15 (empleados, vacantes, candidatos, compras, actividades) |
| **Tablas de datos** | 3 (contrataciones recientes, últimas vacantes, actividades pendientes) |
| **Servicios relacionados** | 1 (birthdayAnniversary.service.js) |
| **Widgets** | 1 (UpcomingEventsWidget.js) |
| **Consultas a BD** | ~20 en total (entre todos los métodos) |
| **Líneas de frontend** | ~1,700 (132 + 488 + 388 + 683) |

---

## 12. INVENTARIO EXHAUSTIVO DEL MÓDULO DE MI ESPACIO

### 12.1 Visión General

**Mi Espacio** es un **panel de autoservicio** diseñado para jefes de área (SISTEMAS, COMPRAS, PRODUCCION) que consolida en una sola pantalla toda la información relevante para la gestión diaria de un responsable de departamento. No es un módulo independiente del sistema ACL, sino una **vista agregada** que cruza datos de los módulos de Empleados, Reclutamiento y Compras.

**Propósito:** Proporcionar a los jefes de área un centro de control personal donde puedan ver el estado de sus solicitudes de vacante, sus solicitudes de compra, las actividades pendientes del puesto y los candidatos en revisión, todo filtrado automáticamente por su empleado asociado.

### 12.2 Arquitectura del Módulo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MI ESPACIO — ARQUITECTURA                         │
│                                                                     │
│  FRONTEND (Next.js)                                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  RUTA: /dashboard/mi-espacio/                                │   │
│  │                                                              │   │
│  │  ESTRUCTURA DE LA PÁGINA (388 líneas):                      │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │  HEADER                                              │    │   │
│  │  │  ├── Título: "Mi Espacio"                           │    │   │
│  │  │  ├── Subtítulo: "Panel personal con tus solicitudes" │    │   │
│  │  │  ├── Última actualización (timestamp)                │    │   │
│  │  │  └── Botón "Actualizar" (refrescar datos)           │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │  TARJETAS DE KPIs (grid 4 columnas)                  │    │   │
│  │  │  ├── 🔵 Mis Vacantes (total, activas)                │    │   │
│  │  │  ├── 🟡 Mis Compras (total, activas)                 │    │   │
│  │  │  ├── 🟣 Actividades (pendientes)                     │    │   │
│  │  │  └── 🟢 Candidatos (en revisión / totales)           │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │  GRÁFICAS Y TABLAS (grid 2 columnas)                 │    │   │
│  │  │  ├── 📊 Gráfica Pastel: Distribución de Vacantes     │    │   │
│  │  │  │   (Solicitadas/Aprobadas/Buscando/Cerradas)       │    │   │
│  │  │  └── 📋 Últimas Vacantes (3 más recientes)           │    │   │
│  │  │      (título, departamento, estatus, fecha)          │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │  ACTIVIDADES PENDIENTES                              │    │   │
│  │  │  ├── Lista de actividades (5 más recientes)          │    │   │
│  │  │  └── Cada una: descripción, vacante, tipo            │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │  ACCIONES RÁPIDAS (grid 3 columnas)                  │    │   │
│  │  │  ├── 🔵 Solicitar Vacante                           │    │   │
│  │  │  ├── 🟡 Nueva Compra                                │    │   │
│  │  │  └── 🟢 Mis Solicitudes                             │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                           │ HTTP                                     │
│                           ▼                                         │
│  BACKEND (Express)                                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  ENDPOINT: GET /api/stats/my-dashboard                      │   │
│  │                                                              │   │
│  │  stats.controller.js → getMyDashboardStats() (~100 líneas)  │   │
│  │                                                              │   │
│  │  FLUJO:                                                      │   │
│  │  1. Verificar que usuario tiene módulo EMPLEADOS             │   │
│  │  2. Buscar empleado asociado por userId                      │   │
│  │  3. Si no existe empleado → devolver datos vacíos            │   │
│  │  4. Consultar mis vacantes (JobVacancy por solicitanteId)    │   │
│  │  5. Consultar mis compras (PurchaseRequest, try/catch)       │   │
│  │  6. Consultar actividades pendientes (JobActivity)           │   │
│  │  7. Consultar candidatos (CandidateRH)                       │   │
│  │  8. Devolver JSON agregado                                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                           │ SQL                                     │
│                           ▼                                         │
│  BASE DE DATOS (PostgreSQL)                                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  5 consultas a BD:                                           │   │
│  │  ├── Employee.findUnique({ where: { userId } })              │   │
│  │  ├── JobVacancy.findMany({ where: { solicitanteId } })       │   │
│  │  ├── PurchaseRequest.findMany({ where: { solicitanteId } })  │   │
│  │  ├── JobActivity.findMany({ where: { vacancyId: { in } } }) │   │
│  │  └── CandidateRH.findMany({ where: { vacancy_id: { in } } })│   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 12.3 Endpoint

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/api/stats/my-dashboard` | `requireModule('EMPLEADOS')` | `statsController.getMyDashboardStats` | Datos agregados del jefe de área |

### 12.4 Controlador — `getMyDashboardStats(req, res)`

| Aspecto | Detalle |
|---------|---------|
| **Archivo** | `backend/src/controllers/stats.controller.js` (~100 líneas) |
| **Protección** | `requireModule('EMPLEADOS')` + verificación inline de `accessibleModules` |
| **Scoping** | Busca empleado por `userId`. Si no existe, devuelve datos vacíos. |
| **Respuesta** | `{ myVacancies, myPurchases, pendingActivities, candidates, lastUpdated }` |

#### 12.4.1 Estructura de la Respuesta

```json
{
  "myVacancies": {
    "total": 5,
    "active": 3,
    "latest": [
      {
        "id": "clx...",
        "titulo": "Desarrollador Full Stack",
        "estatus": "Buscando",
        "departamento": "Sistemas",
        "createdAt": "2026-06-01T..."
      }
    ]
  },
  "myPurchases": {
    "total": 2,
    "active": 1,
    "latest": [
      {
        "id": "clx...",
        "folio": 42,
        "estatus": "APROBADO",
        "createdAt": "2026-06-05T..."
      }
    ]
  },
  "pendingActivities": {
    "total": 8,
    "activities": [
      {
        "id": "clx...",
        "description": "Revisar perfiles técnicos",
        "vacancyTitle": "Desarrollador Full Stack",
        "activityType": "REVISION_PERFILES"
      }
    ]
  },
  "candidates": {
    "total": 12,
    "enRevision": 5
  },
  "lastUpdated": "2026-06-13T06:00:00.000Z"
}
```

#### 12.4.2 Lógica Interna

| Paso | Operación | Código |
|------|-----------|--------|
| 1 | Verificar módulo EMPLEADOS | `if (!req.user.accessibleModules?.includes('EMPLEADOS')) return 403` |
| 2 | Buscar empleado asociado | `prisma.employee.findUnique({ where: { userId } })` |
| 3 | Si no hay empleado | Devolver `{ myVacancies: { total: 0, active: 0, latest: [] }, myPurchases: { total: 0, active: 0, latest: [] }, pendingActivities: { total: 0, activities: [] }, candidates: { total: 0, enRevision: 0 } }` |
| 4 | Mis vacantes | `prisma.jobVacancy.findMany({ where: { solicitanteId: employee.id }, orderBy: { createdAt: 'desc' }, include: { departamento: { select: { nombre: true } } } })` |
| 5 | Vacantes activas | `filter(v => v.estatus !== 'Cerrada')` |
| 6 | Mis compras | `prisma.purchaseRequest.findMany({ where: { solicitanteId: employee.id }, orderBy: { createdAt: 'desc' }, take: 5 })` envuelto en `try/catch` por si el modelo no existe |
| 7 | Compras activas | `filter(p => !['ENTREGADO', 'CANCELADO'].includes(p.estatus))` |
| 8 | Actividades pendientes | `prisma.jobActivity.findMany({ where: { vacancyId: { in: myJobVacancies.map(v => v.id) } }, include: { vacancy: { select: { titulo: true } } } })` |
| 9 | Candidatos | `prisma.candidateRH.findMany({ where: { vacancy_id: { in: myJobVacancies.map(v => v.id) } } })` |
| 10 | Candidatos en revisión | `filter(c => c.estatus === 'En_Revision')` |

### 12.5 Frontend — Página `/dashboard/mi-espacio/`

| Aspecto | Detalle |
|---------|---------|
| **Archivo** | `frontend/app/dashboard/mi-espacio/page.js` (388 líneas) |
| **Framework** | Next.js 14+ (App Router), `'use client'` |
| **Protección** | `<ProtectedRoute requiredModule="EMPLEADOS">` |
| **Layout** | `<DashboardLayout>` (sidebar + header) |
| **API** | `GET /api/stats/my-dashboard` vía `api` (Axios) |
| **Gráficas** | Recharts (`PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend`) |
| **Estados** | Loading (spinner), Error (toast + datos vacíos), Empty (mensajes), Datos (renderizado) |

#### 12.5.1 Secciones de la Página

| # | Sección | Elementos | Estado vacío |
|---|---------|-----------|-------------|
| 1 | **Header** | Título, subtítulo, timestamp, botón Actualizar | Siempre visible |
| 2 | **KPIs** (grid 4) | Mis Vacantes (total, activas), Mis Compras (total, activas), Actividades (pendientes), Candidatos (en revisión / totales) | Muestra 0 |
| 3 | **Gráfica Pastel** | Distribución de vacantes por estatus (Solicitadas/Aprobadas/Buscando/Cerradas) con colores: 🟡 🟢 🔵 ⚫ | "Aún no tienes vacantes registradas" + enlace "Solicitar mi primera vacante" |
| 4 | **Últimas Vacantes** | Lista de 3 vacantes más recientes con título, departamento, badge de estatus, fecha formateada (DD/MM/AAAA) | "No tienes vacantes registradas" |
| 5 | **Actividades Pendientes** | Lista de 5 actividades con icono 🟣, descripción, nombre de vacante, tipo de actividad | "No tienes actividades pendientes" |
| 6 | **Acciones Rápidas** (grid 3) | 🔵 Solicitar Vacante, 🟡 Nueva Compra, 🟢 Mis Solicitudes | Siempre visible |

#### 12.5.2 Funcionalidades del Frontend

| Funcionalidad | Implementación |
|--------------|---------------|
| **Carga inicial** | `useEffect` con dependencia `[user?.id, user?.accessibleModules, dashboardData]` — solo carga si no hay datos |
| **Refresco manual** | Botón "Actualizar" → `fetchDashboardData()` |
| **Formateo de fechas** | `vacancy.createdAt.split('T')[0].split('-')` → `DD/MM/AAAA` (evita bug de zona horaria) |
| **Colores de estatus** | Función `getStatusColor()`: Solicitada 🟡, Aprobada 🟢, Buscando 🔵, Cerrada ⚫ |
| **Colores de gráfica** | Array `COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#6B7280']` |
| **Manejo de errores** | `try/catch` → `toast.error()` + datos vacíos por defecto |
| **Protección** | Doble: `<ProtectedRoute>` + verificación inline `user.accessibleModules?.includes('EMPLEADOS')` |
| **Loading** | Spinner animado mientras `authLoading` o `loading` |
| **Acceso denegado** | Mensaje rojo si no tiene módulo EMPLEADOS |

### 12.6 Flujo de Datos Completo

```
USUARIO (Jefe de Área)
  │
  ▼
/dashboard/mi-espacio/ (Next.js)
  │
  │  useEffect → api.get('/stats/my-dashboard')
  │
  ▼
GET /api/stats/my-dashboard
  │
  │  authMiddleware.verifyToken → req.user
  │  authMiddleware.requireModule('EMPLEADOS')
  │
  ▼
stats.controller.getMyDashboardStats()
  │
  │  1. Verificar accessibleModules.includes('EMPLEADOS')
  │  2. Buscar Employee por userId
  │     └── Si no existe → {} vacío
  │  3. JobVacancy.findMany({ solicitanteId })
  │  4. PurchaseRequest.findMany({ solicitanteId }) [try/catch]
  │  5. JobActivity.findMany({ vacancyId: { in: [...] } })
  │  6. CandidateRH.findMany({ vacancy_id: { in: [...] } })
  │
  ▼
RESPUESTA JSON
  {
    myVacancies: { total, active, latest[] },
    myPurchases: { total, active, latest[] },
    pendingActivities: { total, activities[] },
    candidates: { total, enRevision },
    lastUpdated: ISO
  }
  │
  ▼
FRONTEND RENDERIZA:
  ├── 4 Tarjetas KPI
  ├── 1 Gráfica Pastel (Recharts)
  ├── 1 Lista de Últimas Vacantes
  ├── 1 Lista de Actividades Pendientes
  └── 3 Acciones Rápidas
```

### 12.7 Dependencias del Módulo

| Dependencia | Tipo | Propósito |
|------------|------|-----------|
| `EMPLEADOS` | Módulo ACL | Requerido para acceder al endpoint |
| `Employee` | Entidad BD | Asociación usuario ↔ empleado |
| `JobVacancy` | Entidad BD | Vacantes del jefe de área |
| `PurchaseRequest` | Entidad BD | Compras del jefe de área (opcional, try/catch) |
| `JobActivity` | Entidad BD | Actividades pendientes |
| `CandidateRH` | Entidad BD | Candidatos en revisión |
| `Recharts` | Librería NPM | Gráfica pastel |
| `react-hot-toast` | Librería NPM | Notificaciones de error |
| `DashboardLayout` | Componente | Layout con sidebar |
| `ProtectedRoute` | Componente | Protección de ruta |

### 12.8 Resumen del Módulo de Mi Espacio

| Elemento | Cantidad |
|----------|----------|
| **Endpoints REST** | 1 (`GET /api/stats/my-dashboard`) |
| **Controlador** | 1 método (`getMyDashboardStats`, ~100 líneas) |
| **Página frontend** | 1 (`/dashboard/mi-espacio/`, 388 líneas) |
| **Consultas a BD** | 5 (Employee, JobVacancy, PurchaseRequest, JobActivity, CandidateRH) |
| **KPIs** | 4 (vacantes, compras, actividades, candidatos) |
| **Gráficas** | 1 (Pastel con Recharts) |
| **Tablas/Listas** | 2 (últimas vacantes, actividades pendientes) |
| **Acciones rápidas** | 3 (solicitar vacante, nueva compra, mis solicitudes) |
| **Estados de UI** | 4 (loading, error, empty, datos) |
| **Dependencias de entidades** | 5 (Employee, JobVacancy, PurchaseRequest, JobActivity, CandidateRH) |

---

## 13. INVENTARIO EXHAUSTIVO DEL MÓDULO DE ORGANIZACIÓN

### 13.1 Visión General

El módulo de Organización es el **catálogo maestro de la estructura corporativa** de KRAM. Gestiona los departamentos y puestos de trabajo que definen la jerarquía organizacional. Es un módulo transversal utilizado por Empleados (asignación de departamento/puesto), Reclutamiento (vacantes por departamento/puesto) y Dashboards (estadísticas organizacionales).

**Propósito:** Proporcionar una interfaz de administración para mantener actualizados los catálogos de departamentos y puestos de trabajo, con validaciones de integridad referencial que impiden eliminar elementos que estén en uso.

### 13.2 Arquitectura del Módulo

```
┌─────────────────────────────────────────────────────────────────────┐
│                  MÓDULO DE ORGANIZACIÓN — ARQUITECTURA               │
│                                                                     │
│  FRONTEND (Next.js)                                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  RUTA: /dashboard/organizacion/                              │   │
│  │                                                              │   │
│  │  ESTRUCTURA DE LA PÁGINA (683 líneas):                      │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │  HEADER                                              │    │   │
│  │  │  ├── Título: "Estructura Organizacional"            │    │   │
│  │  │  └── Subtítulo: "Administra departamentos y puestos" │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │  TABS (2 pestañas)                                   │    │   │
│  │  │  ├── 📁 Departamentos (con contador)                 │    │   │
│  │  │  └── 💼 Puestos (con contador)                       │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │  TAB: DEPARTAMENTOS                                  │    │   │
│  │  │  ├── Barra de búsqueda + Botón "Nuevo Departamento"  │    │   │
│  │  │  ├── Formulario inline (crear/editar)                │    │   │
│  │  │  ├── Grid de tarjetas (3 columnas)                   │    │   │
│  │  │  │   ├── Nombre, descripción, estado (badge)         │    │   │
│  │  │  │   ├── Contador de puestos                         │    │   │
│  │  │  │   ├── Botones: Editar ✏️, Eliminar 🗑️            │    │   │
│  │  │  │   └── Botón "Ver N puesto(s)" → Modal             │    │   │
│  │  │  └── Paginación (12 items/página)                    │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │  TAB: PUESTOS                                        │    │   │
│  │  │  ├── Barra de búsqueda + Botón "Nuevo Puesto"        │    │   │
│  │  │  ├── Formulario inline (crear/editar)                │    │   │
│  │  │  ├── Tabla con columnas:                             │    │   │
│  │  │  │   ├── Puesto (nombre)                             │    │   │
│  │  │  │   ├── Departamento                                │    │   │
│  │  │  │   ├── Nivel (badge azul)                          │    │   │
│  │  │  │   ├── Estado (badge verde/rojo)                   │    │   │
│  │  │  │   └── Acciones: Editar ✏️, Eliminar 🗑️           │    │   │
│  │  │  └── Paginación (12 items/página)                    │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │  MODAL: Puestos por Departamento                     │    │   │
│  │  │  ├── Título: "Puestos en [Departamento]"             │    │   │
│  │  │  ├── Formulario inline (nuevo/editar puesto)         │    │   │
│  │  │  ├── Lista de puestos con nivel y acciones           │    │   │
│  │  │  └── Botón "+ Agregar puesto a [Departamento]"       │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                           │ HTTP                                     │
│                           ▼                                         │
│  BACKEND (Express)                                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  DOS CONTROLADORES (duplicación funcional):                  │   │
│  │                                                              │   │
│  │  organization.controller.js  (581 líneas) — NUEVO            │   │
│  │  ├── getAllDepartments       → con jobPositions + _count     │   │
│  │  ├── getDepartmentById       → con employees + jobPositions  │   │
│  │  ├── createDepartment        → con validación unique nombre  │   │
│  │  ├── updateDepartment        → con validación unique nombre  │   │
│  │  ├── deleteDepartment        → con verificación empleados    │   │
│  │  ├── getAllJobPositions      → con departamento + _count     │   │
│  │  ├── getJobPositionById      → con departamento + employees  │   │
│  │  ├── createJobPosition       → con validación unique comp.   │   │
│  │  ├── updateJobPosition       → con validación unique comp.   │   │
│  │  ├── deleteJobPosition       → con verificación empleados    │   │
│  │  ├── getJobPositionsByDepartment → solo activos              │   │
│  │  └── getOrganizationStats    → conteos + top 5               │   │
│  │                                                              │   │
│  │  employee-org.controller.js (423 líneas) — LEGACY            │   │
│  │  ├── getEmployeeStats        → total, activos, inactivos     │   │
│  │  ├── getDepartments          → sin relaciones                │   │
│  │  ├── getManagers             → jefes directos                │   │
│  │  ├── getJobPositionsByDepartment → solo activos              │   │
│  │  ├── createDepartment        → con validación unique nombre  │   │
│  │  ├── updateDepartment        → con validación unique nombre  │   │
│  │  ├── deleteDepartment        → con verificación empleados    │   │
│  │  ├── getAllJobPositions      → con departamento              │   │
│  │  ├── createJobPosition       → con validación unique comp.   │   │
│  │  ├── updateJobPosition       → con validación unique comp.   │   │
│  │  └── deleteJobPosition       → con verificación empleados    │   │
│  │                                                              │   │
│  │  DOS ARCHIVOS DE RUTAS (duplicación funcional):              │   │
│  │                                                              │   │
│  │  organization.routes.js      → 12 endpoints (NUEVO)          │   │
│  │  employee.routes.js          → 5 endpoints (LEGACY)          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                           │ SQL                                     │
│                           ▼                                         │
│  BASE DE DATOS (PostgreSQL)                                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  departments     → Catálogo de departamentos                 │   │
│  │  job_positions   → Catálogo de puestos (FK → departments)    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 13.3 Endpoints del Módulo

#### 13.3.1 Rutas Nuevas (`organization.routes.js` — 12 endpoints)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/api/departments` | `requireModule('EMPLEADOS')` | `organizationController.getAllDepartments` | Departamentos con puestos y conteos |
| `GET` | `/api/departments/:id` | `requireModule('EMPLEADOS')` | `organizationController.getDepartmentById` | Departamento con empleados y puestos |
| `POST` | `/api/departments` | `requireModule('EMPLEADOS')` | `organizationController.createDepartment` | Crear departamento |
| `PUT` | `/api/departments/:id` | `requireModule('EMPLEADOS')` | `organizationController.updateDepartment` | Actualizar departamento |
| `DELETE` | `/api/departments/:id` | `requireModule('EMPLEADOS')` | `organizationController.deleteDepartment` | Eliminar (con verificación de integridad) |
| `GET` | `/api/job-positions` | `requireModule('EMPLEADOS')` | `organizationController.getAllJobPositions` | Puestos con departamento y conteo |
| `GET` | `/api/job-positions/:id` | `requireModule('EMPLEADOS')` | `organizationController.getJobPositionById` | Puesto con departamento y empleados |
| `POST` | `/api/job-positions` | `requireModule('EMPLEADOS')` | `organizationController.createJobPosition` | Crear puesto |
| `PUT` | `/api/job-positions/:id` | `requireModule('EMPLEADOS')` | `organizationController.updateJobPosition` | Actualizar puesto |
| `DELETE` | `/api/job-positions/:id` | `requireModule('EMPLEADOS')` | `organizationController.deleteJobPosition` | Eliminar (con verificación de integridad) |
| `GET` | `/api/departments/:departmentId/job-positions` | `requireModule('EMPLEADOS')` | `organizationController.getJobPositionsByDepartment` | Puestos activos por departamento |
| `GET` | `/api/organization/stats` | `requireModule('EMPLEADOS')` | `organizationController.getOrganizationStats` | Estadísticas organizacionales |

#### 13.3.2 Rutas Legacy (`employee.routes.js` — 5 endpoints)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/api/departments` | `verifyToken` | `employeeOrgController.getDepartments` | Departamentos (sin relaciones) |
| `GET` | `/api/departments/:id/job-positions` | `verifyToken` | `employeeOrgController.getJobPositionsByDepartment` | Puestos activos por departamento |
| `GET` | `/api/job-positions` | `verifyToken` | `employeeOrgController.getAllJobPositions` | Puestos con departamento |
| `GET` | `/api/managers` | `verifyToken` | `employeeOrgController.getManagers` | Jefes directos |
| `GET` | `/api/employees/stats` | `requireRHOrAdmin()` | `employeeOrgController.getEmployeeStats` | Estadísticas de empleados |

> **Nota:** Existe duplicación funcional entre `organization.controller.js` (nuevo) y `employee-org.controller.js` (legacy). Ambos controladores tienen endpoints activos montados en rutas diferentes. El frontend de Organización (`/dashboard/organizacion/`) consume los endpoints del controlador nuevo (`organization.controller.js`).

### 13.4 Controladores — Métodos y Lógica

#### 13.4.1 `organization.controller.js` — Controlador Nuevo (581 líneas)

| Método | Descripción | Lógica interna |
|--------|-------------|---------------|
| `getAllDepartments(req, res)` | Listar todos los departamentos | `findMany` con `include: { jobPositions, _count: { employees, jobPositions } }`, ordenado por nombre asc |
| `getDepartmentById(req, res)` | Departamento por ID | `findUnique` con `include: { employees (con puesto), jobPositions }`. 404 si no existe. |
| `createDepartment(req, res)` | Crear departamento | Valida nombre requerido. Verifica unique por nombre. Crea con nombre, descripción, estado. |
| `updateDepartment(req, res)` | Actualizar departamento | Verifica existencia. Si cambia nombre, verifica unique. Actualiza campos. |
| `deleteDepartment(req, res)` | Eliminar departamento | Verifica existencia. Verifica `_count.employees > 0` y `_count.jobPositions > 0`. Si tiene asociados, error 400 con detalles. |
| `getAllJobPositions(req, res)` | Listar todos los puestos | `findMany` con `include: { departamento, _count: { employees } }`, ordenado por nombre asc |
| `getJobPositionById(req, res)` | Puesto por ID | `findUnique` con `include: { departamento, employees }`. 404 si no existe. |
| `createJobPosition(req, res)` | Crear puesto | Valida nombre y departamentoId requeridos. Verifica departamento existe. Verifica unique compuesto `[nombre, departamentoId]`. |
| `updateJobPosition(req, res)` | Actualizar puesto | Verifica existencia. Si cambia departamento, verifica que exista. Si cambia nombre o depto, verifica unique compuesto. |
| `deleteJobPosition(req, res)` | Eliminar puesto | Verifica existencia. Verifica `_count.employees > 0`. Si tiene empleados, error 400 con detalles. |
| `getJobPositionsByDepartment(req, res)` | Puestos activos por depto | Filtra por `departamentoId` y `estado: 'Activo'`. Solo devuelve id, nombre, nivelJerarquico, descripcion. |
| `getOrganizationStats(req, res)` | Estadísticas | `Promise.all` con 3 counts (departments, jobPositions, employees). Top 5 departamentos con más empleados. Top 5 puestos más comunes. |

#### 13.4.2 `employee-org.controller.js` — Controlador Legacy (423 líneas)

| Método | Descripción | Lógica interna |
|--------|-------------|---------------|
| `getEmployeeStats(req, res)` | Estadísticas de empleados | Total, activos, inactivos. `groupBy` por departamento con nombres. Top 10 puestos por `groupBy`. |
| `getDepartments(req, res)` | Departamentos (simple) | Solo id, nombre, descripcion, createdAt, updatedAt. Sin relaciones. |
| `getManagers(req, res)` | Jefes directos | Empleados activos con nivel `PRESIDENTE`, `DIRECTOR`, `GERENTE`, `JEFE`, `COORDINADOR`, `SUPERVISOR`. Formatea `displayName`. |
| `getJobPositionsByDepartment(req, res)` | Puestos activos por depto | Filtra por `departamentoId` y `estado: 'Activo'`. |
| `createDepartment(req, res)` | Crear departamento | Valida nombre requerido. Verifica unique. |
| `updateDepartment(req, res)` | Actualizar departamento | Verifica existencia. Si cambia nombre, verifica unique. |
| `deleteDepartment(req, res)` | Eliminar departamento | Verifica existencia. Verifica empleados y puestos asociados. |
| `getAllJobPositions(req, res)` | Listar puestos | `findMany` con `include: { departamento }`, ordenado por depto + nombre. |
| `createJobPosition(req, res)` | Crear puesto | Valida nombre y departamentoId. Verifica departamento existe. Verifica unique compuesto. |
| `updateJobPosition(req, res)` | Actualizar puesto | Verifica existencia. Si cambia nombre o depto, verifica unique compuesto. |
| `deleteJobPosition(req, res)` | Eliminar puesto | Verifica existencia. Verifica empleados asociados. |

### 13.5 Reglas de Negocio

| Regla | Descripción | ¿Dónde se valida? |
|-------|-------------|-------------------|
| **Nombre único de departamento** | No pueden existir dos departamentos con el mismo nombre | `createDepartment`, `updateDepartment` |
| **Unique compuesto [nombre, departamentoId]** | No pueden existir dos puestos con el mismo nombre en el mismo departamento | `createJobPosition`, `updateJobPosition` |
| **Integridad referencial (departamento)** | No se puede eliminar un departamento que tenga empleados o puestos asociados | `deleteDepartment` |
| **Integridad referencial (puesto)** | No se puede eliminar un puesto que tenga empleados asignados | `deleteJobPosition` |
| **Departamento requerido en puesto** | Todo puesto debe pertenecer a un departamento existente | `createJobPosition` |
| **Estado por defecto** | Nuevos departamentos y puestos se crean como `Activo` | `createDepartment`, `createJobPosition` |
| **Nivel jerárquico por defecto** | Nuevos puestos se crean como `OPERATIVO` si no se especifica | `createJobPosition` |
| **Solo activos en consultas** | `getJobPositionsByDepartment` solo devuelve puestos activos | Ambos controladores |

### 13.6 Entidades del Módulo

| # | Entidad | Tabla | Campos clave | Relaciones |
|---|---------|-------|-------------|------------|
| 1 | `Department` | `departments` | `id` (CUID), `nombre` (String, único), `descripcion` (String?), `estado` (String, default: Activo), `createdAt`, `updatedAt` | → Employee[], JobPosition[], JobVacancy[], PurchaseRequest[] |
| 2 | `JobPosition` | `job_positions` | `id` (CUID), `nombre` (String), `descripcion` (String?), `nivelJerarquico` (NivelJerarquico), `estado` (String, default: Activo), `departamentoId` (FK → Department), `createdAt`, `updatedAt` | → Department, Employee[], JobVacancy[] |

**Unique en JobPosition:** `[nombre, departamentoId]`

### 13.7 Frontend — Página `/dashboard/organizacion/`

| Aspecto | Detalle |
|---------|---------|
| **Archivo** | `frontend/app/dashboard/organizacion/page.js` (683 líneas) |
| **Framework** | Next.js 14+ (App Router), `'use client'` |
| **Protección** | `<ProtectedRoute requiredModule="EMPLEADOS">` |
| **Layout** | `<DashboardLayout>` (sidebar + header) |
| **API** | `GET /api/departments` y `GET /api/job-positions` vía `api` (Axios) |
| **Estados** | Loading (spinner), Empty (mensajes), Datos (renderizado) |

#### 13.7.1 Estados del Frontend

| Estado | Visualización |
|--------|--------------|
| **Loading** | Spinner animado centrado en pantalla |
| **Empty (departamentos)** | "No hay departamentos registrados" o "Sin resultados" si hay búsqueda |
| **Empty (puestos)** | "No hay puestos registrados" o "Sin resultados" si hay búsqueda |
| **Empty (modal)** | "Este departamento no tiene puestos registrados" |
| **Error** | `alert()` con mensaje de error del servidor |
| **Submitting** | Botón deshabilitado con "..." mientras se envía el formulario |

#### 13.7.2 Funcionalidades del Frontend

| Funcionalidad | Implementación |
|--------------|---------------|
| **Carga inicial** | `useEffect` → `fetchData()` que llama a ambos endpoints en paralelo |
| **Pestañas** | `activeTab` state: `'departments'` | `'jobPositions'` con estilo de borde azul en activa |
| **Búsqueda** | `searchDept` / `searchPos` con `useMemo` para filtrar. Búsqueda en nombre, descripción, departamento (puestos) y nivel jerárquico (puestos) |
| **Paginación** | Componente `Pagination` reutilizable con 12 items/página. Botones ← Anterior / Siguiente → |
| **Reset de página** | `useEffect` que resetea a página 1 cuando cambia la búsqueda |
| **Formulario inline** | Formulario que aparece/desaparece dentro de la pestaña (no modal) |
| **Modal de puestos** | Modal independiente `DeptPositionsModal` con formulario inline dentro |
| **CRUD Departamentos** | Crear, editar (formulario inline), eliminar (confirm + API) |
| **CRUD Puestos** | Crear, editar (formulario inline + modal), eliminar (confirm + API) |
| **Contador de puestos** | `jobPositions.filter(p => p.departamentoId === dept.id).length` |
| **Badges de estado** | Verde para Activo, Rojo para Inactivo |
| **Badges de nivel** | Azul con texto formateado (guiones bajos → espacios) |
| **Niveles jerárquicos** | Array constante: `PRESIDENTE`, `DIRECTOR`, `GERENTE`, `JEFE`, `COORDINADOR`, `ANALISTA`, `SUPERVISOR`, `AUX_ADMINISTRATIVO`, `OPERATIVO` |

#### 13.7.3 Componentes Internos

| Componente | Propósito | Líneas |
|-----------|-----------|--------|
| `Pagination` | Paginación reutilizable con página actual/total y botones | ~20 |
| `DeptPositionsModal` | Modal de puestos por departamento con CRUD inline | ~130 |

### 13.8 Flujo de Datos

```
USUARIO (ADMIN)
  │
  ▼
/dashboard/organizacion/ (Next.js, 683 líneas)
  │
  │  useEffect → Promise.all([
  │    api.get('/departments'),
  │    api.get('/job-positions')
  │  ])
  │
  ▼
GET /api/departments
GET /api/job-positions
  │
  │  authMiddleware.requireModule('EMPLEADOS')
  │
  ▼
organization.controller.js
  │
  │  getAllDepartments():
  │  ├── prisma.department.findMany({
  │  │     include: { jobPositions, _count: { employees, jobPositions } },
  │  │     orderBy: { nombre: 'asc' }
  │  │   })
  │  │
  │  getAllJobPositions():
  │  └── prisma.jobPosition.findMany({
  │        include: { departamento, _count: { employees } },
  │        orderBy: { nombre: 'asc' }
  │      })
  │
  ▼
RESPUESTA JSON
  {
    success: true,
    data: [
      {
        id: "clx...",
        nombre: "Sistemas",
        descripcion: "Departamento de TI",
        estado: "Activo",
        jobPositions: [{ id, nombre, nivelJerarquico, estado }],
        _count: { employees: 5, jobPositions: 3 }
      }
    ]
  }
  │
  ▼
FRONTEND RENDERIZA:
  ├── Pestaña Departamentos:
  │   ├── Grid de tarjetas con nombre, descripción, estado, conteo
  │   ├── Formulario inline (crear/editar)
  │   └── Modal de puestos por departamento
  │
  └── Pestaña Puestos:
      ├── Tabla con nombre, departamento, nivel, estado
      └── Formulario inline (crear/editar)
```

### 13.9 Dependencias del Módulo

| Dependencia | Tipo | Propósito |
|------------|------|-----------|
| `EMPLEADOS` | Módulo ACL | Requerido para acceder a todos los endpoints |
| `Department` | Entidad BD | Catálogo de departamentos |
| `JobPosition` | Entidad BD | Catálogo de puestos de trabajo |
| `Employee` | Entidad BD | Verificación de integridad referencial (conteo) |
| `DashboardLayout` | Componente | Layout con sidebar |
| `ProtectedRoute` | Componente | Protección de ruta |

### 13.10 Duplicación Funcional (Deuda Técnica)

| Aspecto | Controlador Nuevo (`organization.controller.js`) | Controlador Legacy (`employee-org.controller.js`) |
|---------|--------------------------------------------------|---------------------------------------------------|
| **Rutas montadas** | `organization.routes.js` (12 endpoints) | `employee.routes.js` (5 endpoints) |
| **Protección** | `requireModule('EMPLEADOS')` | `verifyToken` (departamentos, puestos, managers) / `requireRHOrAdmin()` (stats) |
| **Departamentos** | Con `include: { jobPositions, _count }` | Solo campos básicos |
| **Puestos** | Con `include: { departamento, _count: { employees } }` | Con `include: { departamento }` |
| **Estadísticas** | `getOrganizationStats` (conteos + top 5) | `getEmployeeStats` (conteos + groupBy) |
| **Managers** | No implementado | `getManagers` (jefes directos) |
| **Frontend que consume** | `/dashboard/organizacion/` | `/rh/empleados/` (formularios), `/rh/empleados/[id]/` (selectores) |

> **Recomendación:** Unificar ambos controladores en una futura refactorización, migrando todos los consumidores del legacy al nuevo controlador y eliminando el código duplicado.

### 13.11 Resumen del Módulo de Organización

| Elemento | Cantidad |
|----------|----------|
| **Endpoints REST (nuevos)** | 12 (`organization.routes.js`) |
| **Endpoints REST (legacy)** | 5 (`employee.routes.js`) |
| **Controladores** | 2 (organization.controller.js 581L + employee-org.controller.js 423L = 1,004 líneas total) |
| **Entidades en BD** | 2 (Department, JobPosition) |
| **Página frontend** | 1 (`/dashboard/organizacion/`, 683 líneas) |
| **Pestañas** | 2 (Departamentos, Puestos) |
| **Componentes internos** | 2 (Pagination, DeptPositionsModal) |
| **Niveles jerárquicos** | 9 (PRESIDENTE a OPERATIVO) |
| **Estados de UI** | 5 (loading, empty, error, submitting, datos) |
| **Validaciones de integridad** | 3 (departamento con empleados, departamento con puestos, puesto con empleados) |
| **Duplicación funcional** | 2 controladores con lógica similar |


---

## 14. Módulo de Gestión de Accesos

### 14.1 Visión General

El módulo de **Gestión de Accesos** es el panel de administración de permisos del sistema. Permite a los usuarios ADMIN y RH:

- Visualizar todos los usuarios del sistema con sus módulos asignados
- Activar/desactivar módulos individualmente por usuario
- Aplicar presets de módulos según el rol
- Activar/desactivar todos los módulos de un usuario de una sola vez
- Gestionar roles personalizados (crear, editar, eliminar)

### 14.2 Arquitectura

```
Frontend (React/Next.js)                    Backend (Express)
═════════════════════════                    ═════════════════

/dashboard/accesos/page.js  ────API────▶  /api/permissions/users (GET)
  (433 líneas)                             /api/permissions/users/:id (PUT)
  │                                        /api/permissions/modules (GET)
  ├── RoleManager.js                       /api/permissions/me (GET)
  │   (240 líneas)
  │                                        /api/roles (GET)
  └── permissionApi (api.js)               /api/roles (POST)
      systemApi (api.js)                   /api/roles/:id (PUT)
                                           /api/roles/:id (DELETE)
                                           /api/modules (GET)
                                           /api/roles/presets (GET)

/dashboard/usuarios/page.js  ────API────▶  /api/users (GET, POST)
  (561 líneas)                             /api/users/:id (GET, PUT, DELETE)
                                           /api/users/stats (GET)
                                           /api/users/:id/reset-password (POST)
```

### 14.3 Endpoints del Backend

#### 14.3.1 Rutas de Permisos (`permission.routes.js` — 32 líneas)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `GET` | `/api/permissions/users` | `requireRole(['ADMIN','RH'])` | `PermissionController.getAllUsersWithPermissions` | Obtener todos los usuarios con sus módulos accesibles |
| `GET` | `/api/permissions/modules` | `requireRole(['ADMIN','RH'])` | `PermissionController.getAvailableModules` | Obtener módulos disponibles del sistema |
| `PUT` | `/api/permissions/users/:id` | `requireRole(['ADMIN','RH'])` | `PermissionController.updateUserPermissions` | Actualizar módulos accesibles de un usuario |
| `GET` | `/api/permissions/me` | `verifyToken` | `PermissionController.getCurrentUserPermissions` | Obtener permisos del usuario autenticado |

#### 14.3.2 Rutas de Roles (`roles.routes.js` — 255 líneas)

| Método | Ruta | Protección | Descripción |
|--------|------|-----------|-------------|
| `GET` | `/api/roles` | `verifyToken` | Obtener todos los roles (sistema + personalizados) |
| `POST` | `/api/roles` | `requireRole(['ADMIN'])` | Crear un nuevo rol personalizado |
| `PUT` | `/api/roles/:id` | `requireRole(['ADMIN'])` | Actualizar un rol personalizado (color, ícono, descripción) |
| `DELETE` | `/api/roles/:id` | `requireRole(['ADMIN'])` | Eliminar un rol personalizado (reasigna usuarios a EMPLEADO_BASICO) |
| `GET` | `/api/modules` | `verifyToken` | Obtener todos los módulos disponibles del sistema |
| `GET` | `/api/roles/presets` | `verifyToken` | Obtener los presets de módulos por rol |

#### 14.3.3 Rutas de Usuarios (`user.routes.js` — 36 líneas)

| Método | Ruta | Protección | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `POST` | `/api/users/:id/reset-password` | `requireRole(['ADMIN','RH'])` | `UserController.resetPassword` | Restablecer contraseña de un usuario |
| `GET` | `/api/users` | `requireRole(['ADMIN'])` | `UserController.getAllUsers` | Obtener todos los usuarios |
| `GET` | `/api/users/stats` | `requireRole(['ADMIN'])` | `UserController.getUserStats` | Obtener estadísticas de usuarios |
| `GET` | `/api/users/:id` | `requireRole(['ADMIN'])` | `UserController.getUserById` | Obtener un usuario por ID |
| `POST` | `/api/users` | `requireRole(['ADMIN'])` | `UserController.createUser` | Crear un nuevo usuario |
| `PUT` | `/api/users/:id` | `requireRole(['ADMIN'])` | `UserController.updateUser` | Actualizar un usuario |
| `DELETE` | `/api/users/:id` | `requireRole(['ADMIN'])` | `UserController.deleteUser` | Eliminar un usuario |

### 14.4 Controladores

#### 14.4.1 `PermissionController` (`permission.controller.js` — 206 líneas)

| Método | Líneas | Descripción |
|--------|--------|-------------|
| `getAllUsersWithPermissions` | 58 | Obtiene todos los usuarios con empleado vinculado, departamento, puesto, módulos accesibles. Solo ADMIN/RH. |
| `updateUserPermissions` | 82 | Actualiza `accessibleModules` y opcionalmente `role` de un usuario. Valida módulos contra `modules.config.js`. Siempre incluye DASHBOARD. Solo ADMIN/RH. |
| `getAvailableModules` | 16 | Retorna los módulos desde `modules.config.js`. Solo ADMIN/RH. |
| `getCurrentUserPermissions` | 27 | Retorna los datos del usuario autenticado (id, email, name, role, accessibleModules). Todos los usuarios autenticados. |

**Reglas de negocio:**
- Solo ADMIN y RH pueden gestionar permisos (validación por `req.user.role`)
- DASHBOARD siempre está incluido en los módulos de un usuario
- Los módulos se validan contra `getEnabledModuleKeys()` de `modules.config.js`
- Si se actualiza el rol, se acepta cualquier string (soporta roles personalizados)
- Manejo de error `P2025` (usuario no encontrado en BD)

#### 14.4.2 `UserController` (`user.controller.js` — 371 líneas)

| Método | Líneas | Descripción |
|--------|--------|-------------|
| `getAllUsers` | 42 | Lista todos los usuarios con empleado vinculado y puesto. Ordenados por fecha de creación descendente. |
| `getUserById` | 38 | Obtiene un usuario por ID. |
| `createUser` | 66 | Crea usuario con validación de duplicados (name/email), hash de contraseña (bcrypt, salt=10). |
| `updateUser` | 83 | Actualiza usuario con validación de duplicados excluyendo al propio usuario. Hash de contraseña si se proporciona. |
| `resetPassword` | 46 | Restablece contraseña con validación de mínimo 6 caracteres. Accesible para ADMIN y RH. |
| `deleteUser` | 41 | Elimina usuario. No permite auto-eliminación. |
| `getUserStats` | 32 | Estadísticas: total, activos, inactivos, agrupación por rol. |

### 14.5 Frontend

#### 14.5.1 Página de Gestión de Accesos (`/dashboard/accesos/page.js` — 433 líneas)

**Componente principal:** `AccesosPage`

**Estados de UI:**
| Estado | Implementación |
|--------|---------------|
| **Carga inicial** | Spinner animado + texto "Cargando usuarios..." |
| **Sin permisos** | Banner rojo "Acceso Denegado" si no es ADMIN/RH |
| **Error** | Banner rojo con mensaje de error (conexión, servidor, validación) |
| **Éxito** | Banner verde con mensaje de confirmación (auto-destrucción 3s) |
| **Lista vacía** | Mensaje "No hay usuarios para mostrar" o "No se encontraron usuarios con los filtros seleccionados" |
| **Actualizando** | Checkbox deshabilitado + spinner en el módulo que se está actualizando |

**Funcionalidades:**
1. **Filtros** (líneas 232-259): Búsqueda por nombre/correo, filtro por rol (dinámico desde API), filtro por estado (activo/inactivo), botón limpiar
2. **Tabla de usuarios** (líneas 273-340): Nombre con avatar inicial, rol con color, estado activo/inactivo, módulos activos (máx 3 + contador), botones "Gestionar" y "Dar todos"/"Quitar todos"
3. **Panel expandido** (líneas 342-415): Checkboxes por módulo, botones de preset por rol, contador de módulos activos
4. **Presets** (líneas 159-184): Aplica módulos predefinidos según el rol seleccionado
5. **RoleManager** (línea 417): Solo visible para ADMIN, renderiza el componente de gestión de roles personalizados

**Llamadas API:**
- `permissionApi.getAllUsersWithPermissions()` — GET /api/permissions/users
- `permissionApi.updateUserPermissions(userId, modules, role?)` — PUT /api/permissions/users/:id
- `systemApi.getRoles()` — GET /api/roles
- `systemApi.getModules()` — GET /api/modules
- `systemApi.getRolePresets()` — GET /api/roles/presets

#### 14.5.2 Página de Gestión de Usuarios (`/dashboard/usuarios/page.js` — 561 líneas)

**Componente principal:** `UsersManagementPage`

**Protección:** Solo ADMIN (validación `user.role !== 'ADMIN'`)

**Estados de UI:**
| Estado | Implementación |
|--------|---------------|
| **Carga inicial** | Spinner animado + texto "Cargando usuarios..." |
| **Sin permisos** | Banner rojo "Acceso denegado" si no es ADMIN |
| **Lista vacía** | Mensaje "No hay usuarios registrados" o "No se encontraron usuarios con esos criterios" |
| **Error** | Toast error (react-hot-toast) |
| **Éxito** | Toast success (react-hot-toast) |
| **Envío** | Botón deshabilitado con texto "Creando...", "Guardando..." o "Restableciendo..." |

**Funcionalidades:**
1. **Estadísticas** (líneas 246-271): 4 tarjetas (Total, Activos, Inactivos, Roles con conteo)
2. **Búsqueda y filtros** (líneas 274-298): Búsqueda por nombre/email/empleado, filtro por rol dinámico
3. **Tabla de usuarios** (líneas 301-379): Nombre, correo, empleado vinculado con puesto, rol con color, estado, fecha de creación (formateada DD/MM/YYYY), acciones (Editar, Contraseña, Eliminar)
4. **Paginación** (líneas 174-197): Componente interno con 10 items por página, navegación anterior/siguiente, contador de resultados
5. **Modal de creación** (líneas 383-433): Formulario con nombre, email, contraseña, rol (select dinámico)
6. **Modal de edición** (líneas 494-550): Formulario con nombre, email, contraseña (opcional), rol, checkbox activo/inactivo
7. **Modal de restablecer contraseña** (líneas 436-491): Input de nueva contraseña con validación de mínimo 6 caracteres

**Llamadas API:**
- `api.get('/users')` — GET /api/users
- `api.get('/users/stats')` — GET /api/users/stats
- `api.post('/users', data)` — POST /api/users
- `api.put('/users/:id', data)` — PUT /api/users/:id
- `api.delete('/users/:id')` — DELETE /api/users/:id
- `api.post('/users/:id/reset-password', data)` — POST /api/users/:id/reset-password

#### 14.5.3 Componente RoleManager (`RoleManager.js` — 240 líneas)

**Propósito:** Gestión de roles personalizados (crear, visualizar, eliminar). Solo visible para ADMIN.

**Estados de UI:**
| Estado | Implementación |
|--------|---------------|
| **Carga** | Spinner animado + texto "Cargando roles..." |
| **Error** | Banner rojo con mensaje de error |
| **Éxito** | Banner verde con mensaje de confirmación (auto-destrucción 3s) |
| **Lista vacía (custom)** | Mensaje "No hay roles personalizados aún" con hint para crear |
| **Formulario abierto** | Sección expandida con campos de nombre, descripción, color, ícono |

**Funcionalidades:**
1. **Lista de roles del sistema** (líneas 181-199): Muestra los 6 roles predefinidos con su color, ícono y descripción. Etiqueta "Sistema".
2. **Lista de roles personalizados** (líneas 201-234): Muestra roles creados por el usuario con botón de eliminar (con confirmación). Etiqueta "Personalizados".
3. **Formulario de creación** (líneas 107-172): Nombre (autoconvertido a mayúsculas), descripción, selector de color (10 opciones), selector de ícono (16 emojis)
4. **Eliminación** (líneas 63-77): Confirmación con `window.confirm`, reasigna usuarios a EMPLEADO_BASICO

**Llamadas API:**
- `systemApi.getRoles()` — GET /api/roles
- `systemApi.createRole(data)` — POST /api/roles
- `systemApi.deleteRole(roleId)` — DELETE /api/roles/:id

### 14.6 Roles del Sistema (SYSTEM_ROLES)

Definidos en `roles.routes.js` (líneas 15-22):

| ID | Nombre | Descripción | Color | Ícono | Tipo |
|----|--------|-------------|-------|-------|------|
| `ADMIN` | Administrador | Administrador del sistema — control técnico global | `bg-purple-100 text-purple-800` | 👑 | Estratégico |
| `RH` | Recursos Humanos | Gestión de personal y reclutamiento — control operativo global autorizado por Dirección General | `bg-blue-100 text-blue-800` | 👥 | Estratégico |
| `SISTEMAS` | Sistemas | Soporte técnico y sistemas | `bg-green-100 text-green-800` | 💻 | Departamental |
| `COMPRAS` | Compras | Gestión de compras y proveedores | `bg-yellow-100 text-yellow-800` | 🛒 | Departamental |
| `PRODUCCION` | Producción | Gestión de producción | `bg-red-100 text-red-800` | 🏭 | Departamental |
| `EMPLEADO_BASICO` | Empleado | Acceso básico al sistema | `bg-gray-100 text-gray-800` | 👤 | Base |

### 14.7 Roles Personalizados

Los roles personalizados se almacenan en la tabla `Role` de la base de datos (Prisma) con los campos:
- `id` (autoincremental)
- `name` (unique, mayúsculas sin espacios)
- `description`
- `color` (clase Tailwind)
- `icon` (emoji)
- `isCustom` (siempre `true`)
- `createdAt`, `updatedAt`

### 14.8 Flujo de Datos

#### 14.8.1 Asignación de Módulos a Usuario

```
Usuario (ADMIN/RH)
  │
  ├── 1. Abre /dashboard/accesos
  │
  ├── 2. GET /api/permissions/users → Lista de usuarios con módulos
  │
  ├── 3. Expande un usuario
  │
  ├── 4. Hace clic en un checkbox de módulo
  │     │
  │     └── PUT /api/permissions/users/:id
  │           Body: { accessibleModules: ["DASHBOARD", "EMPLEADOS", ...] }
  │           │
  │           └── PermissionController.updateUserPermissions
  │                 ├── Valida módulos contra modules.config.js
  │                 ├── Asegura DASHBOARD siempre incluido
  │                 ├── Actualiza user.accessibleModules en BD
  │                 └── Retorna usuario actualizado
  │
  └── 5. UI se actualiza con los nuevos módulos
```

#### 14.8.2 Aplicación de Preset

```
Usuario (ADMIN/RH)
  │
  ├── 1. Expande un usuario en /dashboard/accesos
  │
  ├── 2. Hace clic en un botón de preset (ej. "Compras")
  │     │
  │     └── PUT /api/permissions/users/:id
  │           Body: { accessibleModules: ["DASHBOARD","COMPRAS","RECLUTAMIENTO"], role: "COMPRAS" }
  │           │
  │           └── PermissionController.updateUserPermissions
  │                 ├── Asigna módulos del preset + DASHBOARD
  │                 ├── Actualiza rol si se proporciona
  │                 └── Retorna usuario actualizado
  │
  └── 3. Se refresca la lista completa de usuarios desde el backend
```

#### 14.8.3 Creación de Rol Personalizado

```
Usuario (ADMIN)
  │
  ├── 1. En /dashboard/accesos, sección "Administración de Roles"
  │
  ├── 2. Hace clic en "+ Nuevo Rol"
  │
  ├── 3. Llena formulario: nombre, descripción, color, ícono
  │
  ├── 4. POST /api/roles
  │     Body: { name: "VENTAS", description: "...", color: "...", icon: "🎯" }
  │     │
  │     └── roles.routes.js
  │           ├── Normaliza nombre a mayúsculas
  │           ├── Verifica que no exista (sistema ni custom)
  │           ├── Crea registro en tabla Role
  │           └── Retorna rol creado
  │
  └── 5. El nuevo rol aparece en la lista de roles personalizados
      y está disponible en los selectores de rol de la UI
```

#### 14.8.4 Eliminación de Rol Personalizado

```
Usuario (ADMIN)
  │
  ├── 1. Hace clic en ícono de eliminar en un rol personalizado
  │
  ├── 2. Confirmación: "¿Estás seguro?"
  │
  ├── 3. DELETE /api/roles/:id
  │     │
  │     └── roles.routes.js
  │           ├── Verifica que no sea rol del sistema
  │           ├── Reasigna usuarios con ese rol a EMPLEADO_BASICO
  │           ├── Elimina el rol de la tabla Role
  │           └── Retorna mensaje de éxito
  │
  └── 4. El rol desaparece de la UI
```

### 14.9 Reglas de Negocio

1. **Solo ADMIN y RH** pueden gestionar permisos de módulos (Nivel C del sistema de permisos)
2. **Solo ADMIN** puede gestionar usuarios (CRUD completo) y roles personalizados
3. **DASHBOARD siempre activo**: No se puede desactivar el módulo Dashboard para ningún usuario
4. **Validación de módulos**: Los módulos asignados deben existir en `modules.config.js`
5. **Roles personalizados**: Se almacenan en tabla `Role` con `isCustom: true`
6. **Reasignación al eliminar rol**: Los usuarios con un rol personalizado eliminado se reasignan a `EMPLEADO_BASICO`
7. **No auto-eliminación**: Un ADMIN no puede eliminar su propia cuenta
8. **Hash de contraseñas**: bcrypt con salt rounds = 10
9. **Contraseña mínima**: 6 caracteres para restablecimiento
10. **Unique compuesto**: No pueden existir dos usuarios con el mismo nombre o email

### 14.10 Resumen del Módulo

| Elemento | Cantidad |
|----------|----------|
| **Endpoints REST** | 13 (4 permissions + 6 roles/modules + 7 users) |
| **Controladores** | 2 (PermissionController 206L + UserController 371L = 577 líneas total) |
| **Archivos de rutas** | 3 (permission.routes.js 32L + roles.routes.js 255L + user.routes.js 36L = 323 líneas total) |
| **Páginas frontend** | 2 (`/dashboard/accesos/` 433L + `/dashboard/usuarios/` 561L = 994 líneas total) |
| **Componentes** | 1 (RoleManager.js 240L) |
| **Roles del sistema** | 6 (ADMIN, RH, SISTEMAS, COMPRAS, PRODUCCION, EMPLEADO_BASICO) |
| **Roles personalizados** | Ilimitados (almacenados en tabla Role) |
| **Estados de UI (accesos)** | 6 (carga, sin permisos, error, éxito, vacío, actualizando) |
| **Estados de UI (usuarios)** | 6 (carga, sin permisos, vacío, error, éxito, envío) |
| **Estados de UI (RoleManager)** | 5 (carga, error, éxito, vacío custom, formulario abierto) |
| **Modales** | 3 (crear usuario, editar usuario, restablecer contraseña) |
| **Presets de módulos** | Definidos en `roles.config.js` |


---

## 15. Módulo de Gestión de Usuarios

### 15.1 Visión General

El módulo de **Gestión de Usuarios** es el panel de administración de cuentas del sistema. Permite a los usuarios **ADMIN** realizar el CRUD completo de usuarios del sistema, incluyendo:

- Visualizar todos los usuarios con estadísticas agregadas
- Crear, editar y eliminar cuentas de usuario
- Restablecer contraseñas de usuarios
- Filtrar y buscar usuarios por nombre, email, empleado vinculado o rol
- Paginación de resultados (10 items por página)
- Roles dinámicos obtenidos desde la API

### 15.2 Arquitectura

```
Frontend (React/Next.js)                    Backend (Express)
═════════════════════════                    ═════════════════

/dashboard/usuarios/page.js  ────API────▶  /api/users (GET)
  (561 líneas)                              /api/users/stats (GET)
  │                                         /api/users/:id (GET)
  ├── api (lib/api.js)                      /api/users (POST)
  │   api.get('/users')                     /api/users/:id (PUT)
  │   api.get('/users/stats')               /api/users/:id (DELETE)
  │   api.post('/users', data)              /api/users/:id/reset-password (POST)
  │   api.put('/users/:id', data)
  │   api.delete('/users/:id')
  │   api.post('/users/:id/reset-password')
  │
  ├── rolesConfig (lib/rolesConfig.js)
  │   getAllRoles()
  │   getRoleName()
  │   getRoleColor()
  │
  └── AuthContext (contexts/AuthContext.js)
      useAuth() → { user }
```

### 15.3 Endpoints del Backend

#### 15.3.1 Rutas de Usuarios (`user.routes.js` — 36 líneas)

| Método | Ruta | Middleware | Controlador | Descripción |
|--------|------|-----------|-------------|-------------|
| `POST` | `/api/users/:id/reset-password` | `verifyToken` + `requireRole(['ADMIN','RH'])` | `UserController.resetPassword` | Restablecer contraseña de un usuario |
| `GET` | `/api/users` | `verifyToken` + `requireRole(['ADMIN'])` | `UserController.getAllUsers` | Obtener todos los usuarios con empleado vinculado |
| `GET` | `/api/users/stats` | `verifyToken` + `requireRole(['ADMIN'])` | `UserController.getUserStats` | Obtener estadísticas de usuarios |
| `GET` | `/api/users/:id` | `verifyToken` + `requireRole(['ADMIN'])` | `UserController.getUserById` | Obtener un usuario por ID |
| `POST` | `/api/users` | `verifyToken` + `requireRole(['ADMIN'])` | `UserController.createUser` | Crear un nuevo usuario |
| `PUT` | `/api/users/:id` | `verifyToken` + `requireRole(['ADMIN'])` | `UserController.updateUser` | Actualizar un usuario |
| `DELETE` | `/api/users/:id` | `verifyToken` + `requireRole(['ADMIN'])` | `UserController.deleteUser` | Eliminar un usuario |

**Nota sobre protección:** Las rutas de gestión de usuarios (excepto reset-password) usan `router.use()` para aplicar `verifyToken` + `requireRole(['ADMIN'])` globalmente. La ruta de reset-password está declarada **antes** del `router.use()` global y solo requiere `requireRole(['ADMIN','RH'])`.

### 15.4 Controlador: `UserController` (`user.controller.js` — 371 líneas)

#### 15.4.1 `getAllUsers(req, res)` — Líneas 8-49 (42 líneas)

**Propósito:** Obtener todos los usuarios del sistema con datos del empleado vinculado.

**Query Prisma:**
```js
prisma.user.findMany({
  select: {
    id, name, email, role, isActive, accessibleModules, createdAt, updatedAt,
    employee: { select: { id, nombre, puesto: { select: { nombre } } } }
  },
  orderBy: { createdAt: 'desc' }
})
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "jperez",
      "email": "jperez@kram.com",
      "role": "RH",
      "isActive": true,
      "accessibleModules": ["DASHBOARD", "EMPLEADOS"],
      "createdAt": "2026-01-15T...",
      "updatedAt": "2026-06-01T...",
      "employee": {
        "id": 1,
        "nombre": "Juan Pérez",
        "puesto": { "nombre": "Gerente de RH" }
      }
    }
  ],
  "message": "Usuarios obtenidos exitosamente"
}
```

**Manejo de errores:** Captura genérica con `console.error` y respuesta 500.

#### 15.4.2 `getUserById(req, res)` — Líneas 52-89 (38 líneas)

**Propósito:** Obtener un usuario específico por su ID.

**Validaciones:**
- Si `!user` → 404 "Usuario no encontrado"

**Respuesta exitosa (200):** Mismos campos que `getAllUsers` pero sin incluir `employee`.

#### 15.4.3 `createUser(req, res)` — Líneas 92-158 (67 líneas)

**Propósito:** Crear un nuevo usuario en el sistema.

**Campos requeridos:** `name`, `email`, `password`, `role`

**Validaciones:**
1. Si falta `name || email || password || role` → 400 "Faltan campos requeridos"
2. Si ya existe usuario con mismo `name` o `email` → 400 "El nombre de usuario o correo electrónico ya está en uso"
3. Hash de contraseña con `bcrypt.hash(password, 10)`

**Reglas de negocio:**
- `accessibleModules` por defecto: `[]` (array vacío)
- `isActive` por defecto: `true`
- No se asigna empleado vinculado en la creación (se hace desde el módulo de empleados)

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": { "id": "uuid", "name": "...", "email": "...", "role": "...", "isActive": true, "accessibleModules": [], "createdAt": "...", "updatedAt": "..." },
  "message": "Usuario creado exitosamente"
}
```

#### 15.4.4 `updateUser(req, res)` — Líneas 161-243 (83 líneas)

**Propósito:** Actualizar un usuario existente.

**Campos opcionales:** `name`, `email`, `password`, `role`, `accessibleModules`, `isActive`

**Validaciones:**
1. Si `!existingUser` → 404 "Usuario no encontrado"
2. Si `name || email` → verificar duplicados excluyendo al propio usuario (`id: { not: id }`)
3. Si hay duplicado → 400 "El nombre de usuario o correo electrónico ya está en uso"

**Reglas de negocio:**
- Solo actualiza campos presentes en el body
- Si `password` se proporciona, hace hash con bcrypt (salt=10)
- Si `accessibleModules` es `undefined`, no se actualiza (se maneja desde el módulo de accesos)
- Si `isActive` es `undefined`, no se actualiza

**Respuesta exitosa (200):** Usuario actualizado (sin contraseña ni employee).

#### 15.4.5 `resetPassword(req, res)` — Líneas 246-291 (46 líneas)

**Propósito:** Restablecer la contraseña de un usuario. Accesible para ADMIN y RH.

**Campos requeridos:** `newPassword`

**Validaciones:**
1. Si `!newPassword || newPassword.length < 6` → 400 "La nueva contraseña debe tener al menos 6 caracteres"
2. Si `!existingUser` → 404 "Usuario no encontrado"

**Reglas de negocio:**
- Hash con bcrypt (salt=10)
- No requiere contraseña actual
- No invalida sesiones activas del usuario (no hay mecanismo de invalidación de tokens)

**Respuesta exitosa (200):**
```json
{ "success": true, "message": "Contraseña restablecida exitosamente" }
```

#### 15.4.6 `deleteUser(req, res)` — Líneas 294-334 (41 líneas)

**Propósito:** Eliminar un usuario del sistema.

**Validaciones:**
1. Si `!existingUser` → 404 "Usuario no encontrado"
2. Si `existingUser.id === req.user.id` → 400 "No puedes eliminar tu propia cuenta"

**Reglas de negocio:**
- Eliminación física (hard delete) de la tabla `User`
- No verifica si el usuario tiene empleado vinculado (podría dejar un `Employee` huérfano con `userId: null`)
- No verifica dependencias (ej. solicitudes de compra creadas por este usuario)

**Respuesta exitosa (200):**
```json
{ "success": true, "message": "Usuario eliminado exitosamente" }
```

#### 15.4.7 `getUserStats(req, res)` — Líneas 337-368 (32 líneas)

**Propósito:** Obtener estadísticas agregadas de usuarios.

**Queries Prisma:**
```js
prisma.user.count()  // totalUsers
prisma.user.count({ where: { isActive: true } })  // activeUsers
prisma.user.groupBy({ by: ['role'], _count: true })  // usersByRole
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 25,
    "activeUsers": 22,
    "inactiveUsers": 3,
    "usersByRole": [
      { "role": "ADMIN", "count": 2 },
      { "role": "RH", "count": 5 },
      { "role": "COMPRAS", "count": 8 },
      { "role": "EMPLEADO_BASICO", "count": 10 }
    ]
  },
  "message": "Estadísticas de usuarios obtenidas exitosamente"
}
```

### 15.5 Frontend: Página de Gestión de Usuarios (`/dashboard/usuarios/page.js` — 561 líneas)

#### 15.5.1 Estructura del Componente

```
UsersManagementPage (componente interno)
  │
  ├── Estados locales (líneas 14-41)
  │   ├── users, loading, stats
  │   ├── showCreateModal, showEditModal, showResetPasswordModal
  │   ├── selectedUser, resetPasswordValue, resettingPassword
  │   ├── availableRoles (dinámico desde getAllRoles())
  │   ├── search, filterRole, page
  │   ├── createForm, editForm
  │   └── submitting
  │
  ├── useEffect (líneas 43-49)
  │   └── Si user.role === 'ADMIN' → fetchUsers(), fetchStats(), setAvailableRoles()
  │
  ├── fetchUsers() (líneas 51-61)
  │   └── GET /api/users → setUsers(response.data.data)
  │
  ├── fetchStats() (líneas 63-70)
  │   └── GET /api/users/stats → setStats(response.data.data)
  │
  ├── Filtrado y paginación (líneas 73-95)
  │   ├── filteredUsers (useMemo): filtro por search (nombre/email/empleado) + filterRole
  │   ├── totalPages = Math.ceil(filteredUsers.length / 10)
  │   └── paginatedUsers = filteredUsers.slice((page-1)*10, page*10)
  │
  ├── Handlers (líneas 98-171)
  │   ├── handleCreateFormChange, handleEditFormChange
  │   ├── handleCreateUser, handleEditUser, handleDeleteUser
  │   └── openEditModal
  │
  ├── Pagination (componente interno, líneas 174-197)
  │   └── Navegación ← Anterior / Siguiente → con contador de resultados
  │
  ├── Render condicional (líneas 200-224)
  │   ├── user.role !== 'ADMIN' → "Acceso denegado"
  │   └── loading → Spinner + "Cargando usuarios..."
  │
  └── Render principal (líneas 226-551)
      ├── Encabezado (líneas 229-243)
      │   ├── Título "Gestión de Usuarios"
      │   └── Botón "Crear Nuevo Usuario"
      │
      ├── Estadísticas (líneas 246-271)
      │   ├── Tarjeta: Total (stats.totalUsers)
      │   ├── Tarjeta: Activos (stats.activeUsers) — verde
      │   ├── Tarjeta: Inactivos (stats.inactiveUsers) — rojo
      │   └── Tarjeta: Roles (stats.usersByRole) — badges por rol
      │
      ├── Búsqueda y filtros (líneas 274-298)
      │   ├── Input de búsqueda (nombre, email, empleado)
      │   ├── Select de filtro por rol (dinámico desde availableRoles)
      │   └── Contador "X de Y usuarios"
      │
      ├── Tabla de usuarios (líneas 301-379)
      │   ├── Columnas: Usuario, Correo, Empleado Vinculado, Rol, Estado, Creado, Acciones
      │   ├── Cada fila: hover:bg-gray-50
      │   ├── Empleado vinculado: nombre + puesto (o "No vinculado")
      │   ├── Rol: badge con color dinámico (getRoleColor)
      │   ├── Estado: badge verde "Activo" / rojo "Inactivo"
      │   ├── Fecha: formateada DD/MM/YYYY (split('T')[0] → split('-'))
      │   └── Acciones: Editar (azul), Contraseña (ámbar), Eliminar (rojo, deshabilitado si es propio)
      │
      └── 3 Modales (líneas 382-550)
          ├── Modal de Creación (líneas 383-433)
          ├── Modal de Restablecer Contraseña (líneas 436-491)
          └── Modal de Edición (líneas 494-550)
```

#### 15.5.2 Estados de UI

| Estado | Condición | Implementación | Líneas |
|--------|-----------|----------------|--------|
| **Sin permisos** | `user.role !== 'ADMIN'` | Banner rojo "Acceso denegado" + "Solo los administradores pueden acceder" | 200-211 |
| **Carga inicial** | `loading === true` | Spinner animado (animate-spin) + texto "Cargando usuarios..." | 213-224 |
| **Lista vacía (sin datos)** | `filteredUsers.length === 0 && !search && !filterRole` | "No hay usuarios registrados." | 370-376 |
| **Lista vacía (con filtros)** | `filteredUsers.length === 0 && (search \|\| filterRole)` | "No se encontraron usuarios con esos criterios" | 370-376 |
| **Error en fetch** | catch en fetchUsers/fetchStats | `toast.error('Error al cargar usuarios')` | 56-57, 68-69 |
| **Error en creación** | catch en handleCreateUser | `toast.error(error.response?.data?.error)` | 126-127 |
| **Error en edición** | catch en handleEditUser | `toast.error(error.response?.data?.error)` | 143-144 |
| **Error en eliminación** | catch en handleDeleteUser | `toast.error(error.response?.data?.error)` | 157-158 |
| **Error en contraseña** | catch en resetPassword | `toast.error(error.response?.data?.error)` | 478-479 |
| **Éxito en creación** | POST /users exitoso | `toast.success('Usuario creado exitosamente')` + cierra modal + refresca | 120-124 |
| **Éxito en edición** | PUT /users/:id exitoso | `toast.success('Usuario actualizado exitosamente')` + cierra modal + refresca | 137-141 |
| **Éxito en eliminación** | DELETE /users/:id exitoso | `toast.success('Usuario eliminado exitosamente')` + refresca | 153-155 |
| **Éxito en contraseña** | POST /users/:id/reset-password exitoso | `toast.success('Contraseña de X restablecida exitosamente')` + cierra modal | 473-476 |
| **Envío (submitting)** | `submitting === true` | Botón deshabilitado + texto "Creando...", "Guardando..." o "Restableciendo..." | 424-427, 482-484, 541-543 |
| **Validación en creación** | Campos vacíos | `toast.error('Por favor completa todos los campos requeridos')` | 113-114 |
| **Validación en contraseña** | `resetPasswordValue.length < 6` | `toast.error('La contraseña debe tener al menos 6 caracteres')` | 466-468 |
| **Confirmación eliminación** | click en Eliminar | `window.confirm('¿Estás seguro...?')` | 150 |

#### 15.5.3 Modales

##### Modal de Creación (líneas 383-433)

| Elemento | Tipo | Validación |
|----------|------|------------|
| Nombre de Usuario * | `input type="text"` | Requerido |
| Correo Electrónico * | `input type="email"` | Requerido |
| Contraseña * | `input type="password"` | Requerido |
| Rol * | `select` dinámico desde `availableRoles` | Requerido |
| Botón Cancelar | `button` | Cierra modal |
| Botón Crear Usuario | `button` con estado `submitting` | Deshabilitado durante envío |

**Flujo de creación:**
1. Usuario llena formulario
2. Validación client-side: todos los campos requeridos
3. `POST /api/users` con `{ name, email, password, role }`
4. Éxito: toast + cierra modal + refresca lista y estadísticas
5. Error: toast con mensaje del backend

##### Modal de Edición (líneas 494-550)

| Elemento | Tipo | Validación |
|----------|------|------------|
| Nombre de Usuario * | `input type="text"` | Requerido, prellenado |
| Correo Electrónico * | `input type="email"` | Requerido, prellenado |
| Nueva Contraseña | `input type="password"` | Opcional (vacío = no cambiar) |
| Rol * | `select` dinámico | Requerido, prellenado |
| Usuario Activo | `checkbox` | Prellenado |
| Botón Cancelar | `button` | Cierra modal |
| Botón Guardar Cambios | `button` con estado `submitting` | Deshabilitado durante envío |

**Flujo de edición:**
1. Usuario hace clic en "Editar" en la tabla
2. `openEditModal(user)`: prellena formulario con datos del usuario
3. Usuario modifica campos deseados
4. `PUT /api/users/:id` con `{ name, email, password?, role, isActive }`
5. Éxito: toast + cierra modal + refresca lista y estadísticas
6. Error: toast con mensaje del backend

##### Modal de Restablecer Contraseña (líneas 436-491)

| Elemento | Tipo | Validación |
|----------|------|------------|
| Información del usuario | `p` | Muestra nombre y email del usuario seleccionado |
| Nueva Contraseña * | `input type="password"` | Mínimo 6 caracteres, placeholder "Mínimo 6 caracteres" |
| Botón Cancelar | `button` | Cierra modal, deshabilitado durante envío |
| Botón Restablecer Contraseña | `button` con estado `resettingPassword` | Deshabilitado durante envío |

**Flujo de restablecimiento:**
1. Usuario hace clic en "Contraseña" en la tabla
2. Modal muestra nombre y email del usuario
3. Usuario ingresa nueva contraseña (mín. 6 caracteres)
4. Validación client-side: `resetPasswordValue.length >= 6`
5. `POST /api/users/:id/reset-password` con `{ newPassword }`
6. Éxito: toast + cierra modal
7. Error: toast con mensaje del backend

#### 15.5.4 Filtrado y Búsqueda

```js
const filteredUsers = useMemo(() => {
  let result = users;
  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.employee?.nombre || '').toLowerCase().includes(q)
    );
  }
  if (filterRole) {
    result = result.filter(u => u.role === filterRole);
  }
  return result;
}, [users, search, filterRole]);
```

**Campos de búsqueda:** `name`, `email`, `employee.nombre`
**Filtro por rol:** Select dinámico desde `getAllRoles()` (rolesConfig.js)
**Paginación:** 10 items por página, resetea a página 1 al cambiar filtros

#### 15.5.5 Roles Dinámicos

```js
const [availableRoles, setAvailableRoles] = useState([]);

useEffect(() => {
  if (user && user.role === 'ADMIN') {
    fetchUsers();
    fetchStats();
    setAvailableRoles(getAllRoles());  // ← rolesConfig.js
  }
}, [user]);
```

Los roles se obtienen de `rolesConfig.js` (configuración estática) y no de la API. Esto significa que los roles personalizados creados desde el RoleManager **no aparecen** en el selector de rol de esta página a menos que se recargue la página (los roles personalizados se obtienen desde la API en la página de accesos, pero aquí se usa la función estática `getAllRoles()`).

### 15.6 Modelo de Datos (Prisma)

#### 15.6.1 Entidad `User`

```prisma
model User {
  id                String     @id @default(uuid())
  name              String     @unique
  email             String     @unique
  password          String
  role              String     @default("EMPLEADO_BASICO")
  isActive          Boolean    @default(true)
  accessibleModules String[]   @default([])
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  employee          Employee?  @relation("UserEmployee")
  purchaseRequests  PurchaseRequest[]
  purchaseComments  PurchaseComment[]
  notifications     Notification[]
}
```

**Campos clave:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String (UUID)` | Identificador único |
| `name` | `String (unique)` | Nombre de usuario (login) |
| `email` | `String (unique)` | Correo electrónico |
| `password` | `String` | Hash bcrypt |
| `role` | `String` | Rol del usuario (default: EMPLEADO_BASICO) |
| `isActive` | `Boolean` | Estado activo/inactivo (default: true) |
| `accessibleModules` | `String[]` | Array de módulos accesibles (default: []) |

**Relaciones:**
| Relación | Modelo | Tipo | Campo FK |
|----------|--------|------|----------|
| `employee` | `Employee` | One-to-One (opcional) | `Employee.userId` |
| `purchaseRequests` | `PurchaseRequest` | One-to-Many | `PurchaseRequest.userId` |
| `purchaseComments` | `PurchaseComment` | One-to-Many | `PurchaseComment.userId` |
| `notifications` | `Notification` | One-to-Many | `Notification.userId` |

### 15.7 Reglas de Negocio

1. **Solo ADMIN** puede gestionar usuarios (CRUD completo) — Nivel C del sistema de permisos
2. **ADMIN y RH** pueden restablecer contraseñas
3. **Unique compuesto**: No pueden existir dos usuarios con el mismo `name` o `email`
4. **Hash de contraseñas**: bcrypt con salt rounds = 10
5. **Contraseña mínima**: 6 caracteres para restablecimiento
6. **No auto-eliminación**: Un ADMIN no puede eliminar su propia cuenta
7. **Eliminación física**: Los usuarios se eliminan realmente de la BD (no soft delete)
8. **Empleado vinculado**: Se asigna desde el módulo de empleados, no desde usuarios
9. **Módulos por defecto**: Los usuarios nuevos se crean con `accessibleModules: []`
10. **Roles dinámicos**: El selector de rol usa `getAllRoles()` de `rolesConfig.js` (roles estáticos del sistema)

### 15.8 Flujo de Datos

#### 15.8.1 Creación de Usuario

```
ADMIN
  │
  ├── 1. Abre /dashboard/usuarios
  │
  ├── 2. Hace clic en "Crear Nuevo Usuario"
  │
  ├── 3. Llena formulario: nombre, email, contraseña, rol
  │
  ├── 4. POST /api/users
  │     Body: { name: "jperez", email: "jperez@kram.com", password: "***", role: "RH" }
  │     │
  │     └── UserController.createUser
  │           ├── Valida campos requeridos
  │           ├── Verifica duplicados (name/email)
  │           ├── Hash de contraseña (bcrypt, salt=10)
  │           ├── Crea usuario en BD
  │           └── Retorna 201 con usuario creado
  │
  └── 5. UI: toast éxito + cierra modal + refresca lista y estadísticas
```

#### 15.8.2 Edición de Usuario

```
ADMIN
  │
  ├── 1. Hace clic en "Editar" en la tabla
  │
  ├── 2. Modal prellenado con datos del usuario
  │
  ├── 3. Modifica campos (nombre, email, contraseña opcional, rol, activo/inactivo)
  │
  ├── 4. PUT /api/users/:id
  │     Body: { name: "jperez", email: "jperez@kram.com", password: "", role: "COMPRAS", isActive: true }
  │     │
  │     └── UserController.updateUser
  │           ├── Verifica que el usuario existe
  │           ├── Si name/email cambiaron, verifica duplicados (excluyendo propio ID)
  │           ├── Si password no está vacío, hace hash
  │           ├── Actualiza solo campos presentes
  │           └── Retorna 200 con usuario actualizado
  │
  └── 5. UI: toast éxito + cierra modal + refresca lista y estadísticas
```

#### 15.8.3 Eliminación de Usuario

```
ADMIN
  │
  ├── 1. Hace clic en "Eliminar" en la tabla
  │
  ├── 2. Confirmación: "¿Estás seguro de que deseas eliminar este usuario?"
  │
  ├── 3. DELETE /api/users/:id
  │     │
  │     └── UserController.deleteUser
  │           ├── Verifica que el usuario existe
  │           ├── Verifica que no sea auto-eliminación
  │           ├── Elimina físicamente de BD
  │           └── Retorna 200
  │
  └── 4. UI: toast éxito + refresca lista y estadísticas
```

#### 15.8.4 Restablecimiento de Contraseña

```
ADMIN o RH
  │
  ├── 1. Hace clic en "Contraseña" en la tabla
  │
  ├── 2. Modal muestra nombre y email del usuario
  │
  ├── 3. Ingresa nueva contraseña (mín. 6 caracteres)
  │
  ├── 4. POST /api/users/:id/reset-password
  │     Body: { newPassword: "nueva123" }
  │     │
  │     └── UserController.resetPassword
  │           ├── Valida longitud mínima (6 caracteres)
  │           ├── Verifica que el usuario existe
  │           ├── Hash de nueva contraseña (bcrypt, salt=10)
  │           ├── Actualiza contraseña en BD
  │           └── Retorna 200
  │
  └── 5. UI: toast éxito + cierra modal
```

### 15.9 Dependencias con Otros Módulos

| Módulo | Relación | Descripción |
|--------|----------|-------------|
| **Gestión de Accesos** | Fuerte | Los usuarios tienen `accessibleModules` que se gestionan desde accesos |
| **Empleados** | Fuerte | Un `Employee` puede tener un `userId` vinculado (relación 1:1 opcional) |
| **Compras** | Débil | Las `PurchaseRequest` tienen un `userId` (creador de la solicitud) |
| **Autenticación** | Fuerte | `AuthContext` usa `user.id`, `user.role`, `user.accessibleModules` del JWT |
| **rolesConfig.js** | Fuerte | `getAllRoles()` proporciona los roles disponibles para el selector |

### 15.10 Resumen del Módulo

| Elemento | Cantidad |
|----------|----------|
| **Endpoints REST** | 7 (GET /users, GET /users/stats, GET /users/:id, POST /users, PUT /users/:id, DELETE /users/:id, POST /users/:id/reset-password) |
| **Controlador** | 1 (UserController — 371 líneas, 7 métodos) |
| **Archivo de rutas** | 1 (user.routes.js — 36 líneas) |
| **Página frontend** | 1 (`/dashboard/usuarios/page.js` — 561 líneas) |
| **Estados de UI** | 14 (sin permisos, carga, vacío sin filtros, vacío con filtros, error fetch, error creación, error edición, error eliminación, error contraseña, éxito creación, éxito edición, éxito eliminación, éxito contraseña, envío) |
| **Modales** | 3 (crear, editar, restablecer contraseña) |
| **Validaciones client-side** | 3 (campos requeridos en creación, contraseña mín. 6 caracteres, confirmación eliminación) |
| **Validaciones server-side** | 6 (campos requeridos, duplicados name/email, existencia usuario, auto-eliminación, contraseña mín. 6 caracteres, hash bcrypt) |
| **Filtros** | 2 (búsqueda textual + filtro por rol) |
| **Paginación** | 10 items por página con navegación anterior/siguiente |
| **Roles con acceso** | ADMIN (CRUD completo), ADMIN+RH (reset-password) |
| **Líneas totales del módulo** | 968 (backend 407 + frontend 561) |

---


---

## 16. GUÍA DE DESARROLLO — PATRONES Y CONVENCIONES

### 16.1 Visión General

Esta guía documenta los **patrones de código**, **convenciones** y **buenas prácticas** utilizadas en el desarrollo del ERP KRAM. Está diseñada para que cualquier desarrollador pueda:

1. Entender la arquitectura del proyecto en minutos
2. Seguir los patrones establecidos al agregar nuevas funcionalidades
3. Mantener consistencia en el estilo y estructura del código
4. Evitar errores comunes identificados durante el desarrollo

### 16.2 Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| **Frontend** | Next.js (App Router) | 14+ | Framework React con renderizado híbrido |
| **Frontend** | React | 18+ | Librería de UI |
| **Frontend** | Tailwind CSS | 3+ | Estilos utilitarios |
| **Frontend** | Recharts | 2+ | Gráficas y visualizaciones |
| **Frontend** | Axios | 1+ | Cliente HTTP |
| **Frontend** | react-hot-toast | 2+ | Notificaciones toast |
| **Backend** | Node.js | 18+ | Runtime |
| **Backend** | Express | 4+ | Framework HTTP |
| **Backend** | Prisma ORM | 5+ | ORM para PostgreSQL |
| **Backend** | JWT (jsonwebtoken) | 9+ | Autenticación |
| **Backend** | bcrypt | 5+ | Hash de contraseñas |
| **Backend** | Multer | 1+ | Subida de archivos |
| **Backend** | PDFKit | 0.15+ | Generación de PDFs |
| **Backend** | Resend | 3+ | Envío de emails |
| **Backend** | csv-parser | 3+ | Parseo de CSV |
| **Base de Datos** | PostgreSQL | 15+ | Base de datos relacional |
| **Infraestructura** | Docker | 24+ | Contenedores |
| **Infraestructura** | Coolify | - | Plataforma de despliegue |

### 16.3 Estructura de Archivos — Convenciones

#### 16.3.1 Backend (Express)

```
backend/
├── prisma/
│   └── schema.prisma          ← Único archivo de esquema BD
├── src/
│   ├── index.js               ← Entry point (Express app)
│   ├── config/
│   │   ├── modules.config.js  ← Configuración de módulos ACL
│   │   └── roles.config.js    ← Presets de módulos por rol
│   ├── controllers/
│   │   ├── *.controller.js    ← Lógica de negocio (métodos estáticos)
│   │   └── *-*.controller.js  ← Controladores con guiones para módulos complejos
│   ├── routes/
│   │   ├── *.routes.js        ← Definición de rutas Express
│   │   └── *-*.routes.js      ← Rutas con guiones para módulos complejos
│   ├── middlewares/
│   │   ├── auth.middleware.js  ← Autenticación y autorización
│   │   └── upload.middleware.js ← Subida de archivos (Multer)
│   └── services/
│       ├── *.service.js       ← Servicios de negocio
│       └── purchases/         ← Servicios agrupados por módulo
│           ├── *.service.js
│           └── *-*.service.js
└── uploads/                   ← Archivos subidos (fotos, CVs, documentos)
    ├── cvs/
    ├── employee-documents/
    ├── photos/
    ├── psych-tests/
    ├── purchase-quotes/
    └── temp/
```

**Convenciones de nomenclatura:**
- **Archivos**: `kebab-case` (guiones bajos solo para archivos legacy)
- **Controladores**: `nombre.controller.js` → exportan funciones individuales (`exports.funcion`)
- **Rutas**: `nombre.routes.js` → exportan `router` de Express
- **Servicios**: `nombre.service.js` → exportan funciones individuales
- **Middlewares**: `nombre.middleware.js` → exportan funciones middleware

#### 16.3.2 Frontend (Next.js App Router)

```
frontend/
├── app/
│   ├── layout.js              ← Layout raíz (AuthProvider, Toaster)
│   ├── page.js                ← Página de login (redirección)
│   ├── login/
│   │   └── page.js            ← Página de inicio de sesión
│   ├── dashboard/
│   │   ├── layout.js          ← DashboardLayout (sidebar + header)
│   │   ├── page.js            ← Dashboard genérico (accesos directos)
│   │   ├── accesos/
│   │   │   └── page.js        ← Gestión de accesos (permisos)
│   │   ├── usuarios/
│   │   │   └── page.js        ← Gestión de usuarios
│   │   ├── mi-espacio/
│   │   │   └── page.js        ← Mi Espacio (jefes de área)
│   │   ├── organizacion/
│   │   │   └── page.js        ← Organigrama (deptos/puestos)
│   │   ├── compras/
│   │   │   ├── [id]/
│   │   │   │   └── page.js    ← Detalle de solicitud (Admin/Compras)
│   │   │   └── page.js        ← Dashboard de compras
│   │   └── profile/
│   │       └── page.js        ← Perfil de usuario
│   ├── rh/
│   │   ├── dashboard-completo/
│   │   │   └── page.js        ← Dashboard RH
│   │   ├── empleados/
│   │   │   ├── [id]/
│   │   │   │   └── page.js    ← Detalle de empleado
│   │   │   └── page.js        ← Lista de empleados
│   │   ├── incidencias/
│   │   │   └── page.js        ← Incidencias
│   │   └── reclutamiento/
│   │       ├── crear-vacante/
│   │       │   └── page.js    ← Crear vacante (RH)
│   │       └── page.js        ← Dashboard RH reclutamiento
│   ├── reclutamiento/
│   │   ├── mis-solicitudes/
│   │   │   └── page.js        ← Mis vacantes (jefes de área)
│   │   ├── solicitar-vacante/
│   │   │   └── page.js        ← Solicitar vacante
│   │   └── vacantes/
│   │       └── [id]/
│   │           ├── page.js    ← Detalle de vacante
│   │           └── perfil-tecnico/
│   │               └── page.js ← Perfil técnico
│   ├── compras/
│   │   ├── mis-solicitudes/
│   │   │   ├── [id]/
│   │   │   │   └── page.js    ← Detalle de solicitud (solicitante)
│   │   │   └── page.js        ← Mis solicitudes de compra
│   │   └── nueva-solicitud/
│   │       └── page.js        ← Nueva solicitud de compra
│   ├── my-vacancies/
│   │   └── page.js            ← Mis vacantes (legacy)
│   ├── vacancies/
│   │   └── [id]/
│   │       └── page.js        ← Vacante (legacy)
│   └── register/
│       └── page.js            ← Registro de usuario
├── components/
│   ├── DashboardLayout.js     ← Layout con sidebar y header
│   ├── ProtectedRoute.js      ← HOC de protección de rutas
│   ├── EmployeeTable.js       ← Tabla de empleados
│   ├── EmployeeForm.js        ← Formulario de empleados
│   ├── EmployeeImport.js      ← Importación CSV
│   ├── employeePdfExport.js   ← Exportación PDF
│   ├── PurchaseComments.js    ← Comentarios con SSE
│   ├── PurchaseOrderModal.js  ← Modal de OC
│   ├── QuoteSelectionModal.js ← Selección de cotización
│   ├── SendAuthorizationModal.js ← Envío a autorización
│   ├── RoleManager.js         ← Gestión de roles personalizados
│   └── UpcomingEventsWidget.js ← Widget de cumpleaños/aniversarios
├── contexts/
│   └── AuthContext.js         ← Contexto de autenticación
├── hooks/
│   └── useAuth.js             ← Hook de autenticación (re-export)
├── lib/
│   ├── api.js                 ← Cliente Axios (authApi, api, permissionApi, systemApi)
│   └── rolesConfig.js         ← Configuración de roles (colores, iconos, nombres)
└── utils/
    └── ...                    ← Utilidades varias
```

**Convenciones de nomenclatura:**
- **Páginas**: `page.js` dentro de carpetas con nombre en `kebab-case`
- **Rutas dinámicas**: `[param]/page.js` (corchetes para parámetros de ruta)
- **Componentes**: `PascalCase.js` (ej. `EmployeeTable.js`, `ProtectedRoute.js`)
- **Contextos**: `NombreContext.js` (ej. `AuthContext.js`)
- **Librerías/Utilidades**: `camelCase.js` (ej. `api.js`, `rolesConfig.js`)

### 16.4 Patrón de Backend — Controladores

#### 16.4.1 Estructura de un Controlador

```javascript
// backend/src/controllers/ejemplo.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @desc    Descripción clara de la función
 * @route   GET /api/ejemplo
 * @access  requireModule('MODULO')
 */
exports.getEjemplo = async (req, res) => {
  try {
    // 1. Validaciones de entrada
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'ID es requerido' });
    }

    // 2. Lógica de negocio
    const data = await prisma.ejemplo.findUnique({ where: { id } });
    if (!data) {
      return res.status(404).json({ error: 'No encontrado' });
    }

    // 3. Scoping de datos (Nivel B)
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    });
    if (req.user.role !== 'ADMIN' && req.user.role !== 'RH') {
      if (data.solicitanteId !== employee.id) {
        return res.status(403).json({ error: 'No tienes acceso a este recurso' });
      }
    }

    // 4. Respuesta exitosa
    res.json({ data, message: 'Operación exitosa' });
  } catch (error) {
    console.error('Error en getEjemplo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
```

#### 16.4.2 Reglas para Controladores

| Regla | Descripción |
|-------|-------------|
| **Try/Catch siempre** | Todo controlador debe envolver su lógica en try/catch |
| **Mensajes en español** | Todos los mensajes de error y éxito deben estar en español |
| **Respuestas consistentes** | Usar `{ data: ..., message: ... }` o `{ error: ... }` |
| **Validación temprana** | Validar parámetros de entrada al inicio del controlador |
| **Scoping explícito** | Aplicar scoping de datos (Nivel B) después de obtener los datos |
| **Logging** | Registrar errores con `console.error` incluyendo nombre de la función |
| **Códigos HTTP** | 200 (éxito), 201 (creado), 400 (bad request), 403 (forbidden), 404 (not found), 500 (error interno) |

### 16.5 Patrón de Backend — Rutas

#### 16.5.1 Estructura de un Archivo de Rutas

```javascript
// backend/src/routes/ejemplo.routes.js
const express = require('express');
const router = express.Router();
const ejemploController = require('../controllers/ejemplo.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.verifyToken);

// Rutas públicas (dentro del módulo)
router.get('/ejemplo', 
  authMiddleware.requireModule('MODULO'), 
  ejemploController.getEjemplo
);

router.post('/ejemplo', 
  authMiddleware.requireModule('MODULO'), 
  ejemploController.createEjemplo
);

// Rutas protegidas (solo ADMIN/RH)
router.put('/ejemplo/:id', 
  authMiddleware.requireRHOrAdmin(), 
  ejemploController.updateEjemplo
);

module.exports = router;
```

#### 16.5.2 Middlewares de Protección Disponibles

| Middleware | Propósito | Nivel ACL |
|-----------|-----------|-----------|
| `authMiddleware.verifyToken` | Verificar JWT y adjuntar `req.user` | — |
| `authMiddleware.requireModule('MODULO')` | Verificar que el usuario tiene el módulo en `accessibleModules` | Nivel A |
| `authMiddleware.requireRHOrAdmin()` | Verificar que el usuario es RH o ADMIN | Nivel C |
| `authMiddleware.requireRole(['ADMIN'])` | Verificar que el usuario tiene un rol específico | Nivel C |

**Orden de aplicación:**
```javascript
// 1. verifyToken siempre primero
router.use(authMiddleware.verifyToken);

// 2. Luego requireModule para endpoints de módulo
router.get('/ruta', authMiddleware.requireModule('MODULO'), controlador);

// 3. requireRHOrAdmin o requireRole para operaciones críticas
router.delete('/ruta/:id', authMiddleware.requireRHOrAdmin(), controlador);
```

### 16.6 Patrón de Backend — Servicios

#### 16.6.1 Cuándo usar un Servicio

| Situación | ¿Servicio? | Alternativa |
|-----------|-----------|-------------|
| Lógica CRUD simple (< 50 líneas) | ❌ | Controlador directo |
| Lógica de negocio compleja (> 50 líneas) | ✅ | Servicio separado |
| Operaciones con transacciones Prisma | ✅ | Servicio con `prisma.$transaction` |
| Lógica reutilizable entre controladores | ✅ | Servicio compartido |
| Generación de PDF/archivos | ✅ | Servicio especializado |
| Envío de emails | ✅ | Servicio de email |
| Lógica de un solo uso | ❌ | Controlador |

#### 16.6.2 Estructura de un Servicio

```javascript
// backend/src/services/ejemplo.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Descripción clara del servicio
 */
exports.doSomething = async (param1, param2) => {
  // Validaciones
  if (!param1) {
    throw new Error('param1 es requerido');
  }

  // Lógica de negocio
  const result = await prisma.model.findMany({
    where: { field: param1 },
    include: { relation: true }
  });

  return result;
};
```

### 16.7 Patrón de Frontend — Páginas

#### 16.7.1 Estructura de una Página

```javascript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

function PageContent() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Carga de datos
  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/endpoint');
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar datos');
      toast.error(err.response?.data?.error || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // 2. Estados de UI
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  // 3. Renderizado
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Título</h1>
        {/* Contenido */}
      </div>
    </DashboardLayout>
  );
}

// 4. Exportación con protección
export default function Page() {
  return (
    <ProtectedRoute requiredModule="MODULO">
      <PageContent />
    </ProtectedRoute>
  );
}
```

#### 16.7.2 Estados de UI Obligatorios

| Estado | Implementación | Cuándo |
|--------|---------------|--------|
| **Loading** | Spinner animado + texto descriptivo | Mientras se cargan datos |
| **Error** | `toast.error()` + posible banner | Cuando falla una llamada API |
| **Empty** | Mensaje descriptivo + acción sugerida | Cuando no hay datos |
| **Success** | `toast.success()` | Cuando una operación se completa |
| **Submitting** | Botón deshabilitado + texto de carga | Durante envío de formularios |

### 16.8 Patrón de Frontend — Componentes

#### 16.8.1 Componentes Compartidos

| Componente | Props | Propósito |
|-----------|-------|-----------|
| `<ProtectedRoute>` | `requiredModule`, `children` | Proteger rutas por módulo ACL |
| `<DashboardLayout>` | `children` | Layout con sidebar y header |
| `<UpcomingEventsWidget>` | — | Widget de cumpleaños/aniversarios |

#### 16.8.2 Uso de ProtectedRoute

```javascript
// Protección simple por módulo
<ProtectedRoute requiredModule="EMPLEADOS">
  <MiComponente />
</ProtectedRoute>

// Protección por módulo + verificación inline de rol
<ProtectedRoute requiredModule="EMPLEADOS">
  {user.role === 'ADMIN' ? <AdminView /> : <RegularView />}
</ProtectedRoute>
```

### 16.9 Sistema de Autenticación y Autorización

#### 16.9.1 Flujo de Autenticación

```
1. Usuario ingresa credenciales en /login
2. POST /api/auth/login → Backend valida credenciales
3. Backend genera JWT con payload: { id, email, name, role, accessibleModules }
4. Frontend guarda token en localStorage + cookie
5. AuthContext.checkAuth() → GET /api/auth/profile → Verifica token
6. user queda disponible globalmente via useAuth()
```

#### 16.9.2 Payload del JWT

```javascript
// Generado en auth.controller.js
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    accessibleModules: user.accessibleModules
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

#### 16.9.3 Middleware de Verificación

```javascript
// auth.middleware.js — verifyToken
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
```

### 16.10 Sistema de Archivos (Uploads)

#### 16.10.1 Directorios de Subida

| Directorio | Contenido | Middleware |
|-----------|-----------|-----------|
| `uploads/cvs/` | Currículums de candidatos (PDF) | `uploadCV` |
| `uploads/psych-tests/` | Pruebas psicométricas (PDF) | `uploadPsychTest` |
| `uploads/photos/` | Fotos de perfil de empleados | `uploadPhoto` |
| `uploads/employee-documents/` | Documentos de empleados (INE, CURP, etc.) | `upload` |
| `uploads/purchase-quotes/` | Cotizaciones de compras (PDF, imágenes) | `upload` |
| `uploads/temp/` | Archivos temporales | `upload` |

#### 16.10.2 Configuración de Multer

```javascript
// upload.middleware.js
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determinar directorio según el campo del archivo
    const dirMap = {
      cv: PATHS.cvs,
      psychTest: PATHS.psychTests,
      photo: PATHS.photos,
      file: PATHS.purchaseQuotes,
      documents: PATHS.employeeDocuments
    };
    cb(null, dirMap[file.fieldname] || PATHS.temp);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
```

**Extensiones permitidas:** `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.csv`

### 16.11 Manejo de Fechas

#### 16.11.1 Regla de Oro

> **El Backend guarda en UTC. El Frontend muestra en DD/MM/YYYY.**

#### 16.11.2 Patrón para Evitar el Bug del Día Anterior

```javascript
// ✅ CORRECTO: Extraer fecha sin zona horaria
const formatDate = (isoString) => {
  if (!isoString) return '';
  const [year, month, day] = isoString.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
};

// ❌ INCORRECTO: Usar new Date() directamente
const formatDate = (isoString) => {
  const date = new Date(isoString); // ← Bug: puede mostrar el día anterior
  return date.toLocaleDateString('es-MX');
};
```

### 16.12 Sistema de Permisos (ACL) — Guía Rápida

#### 16.12.1 Los 3 Niveles

| Nivel | Mecanismo | Ejemplo |
|-------|-----------|---------|
| **A — Módulos** | `accessibleModules?.includes('MODULO')` | ¿Puede ver el módulo? |
| **B — Scoping** | Lógica de negocio (empleado, departamento) | ¿Qué datos ve? |
| **C — Críticas** | `requireRole(['ADMIN'])` | ¿Puede eliminar usuarios? |

#### 16.12.2 Bypass para ADMIN y RH (Roles Estratégicos)

El ERP KRAM reconoce dos **Roles Estratégicos** con bypass global, cada uno con responsabilidades distintas:

| Rol | Tipo | Responsabilidad | Ámbito |
|-----|------|----------------|--------|
| **ADMIN** | Control técnico global | Administración del sistema, configuración técnica, operaciones críticas (Nivel C) | Todo el sistema |
| **RH** | Control operativo global autorizado por Dirección General | Gestión de personal, reclutamiento, configuración de accesos, supervisión operativa | Todos los módulos y datos |

**Fundamento organizacional:** El rol RH representa la mano derecha operativa de Presidencia dentro de Comercializadora KRAM. Por decisión explícita de Dirección General, RH posee acceso global al sistema, al mismo nivel funcional que ADMIN, aunque con responsabilidades distintas.

> ⚠️ **Política de seguridad:** Ningún otro rol deberá recibir privilegios equivalentes a ADMIN o RH sin autorización expresa de Presidencia.

```javascript
// Siempre verificar bypass primero
if (req.user.role === 'ADMIN' || req.user.role === 'RH') {
  // Acceso completo, sin restricciones
  return res.json({ data: allData });
}

// Para otros roles, aplicar scoping
const employee = await prisma.employee.findUnique({
  where: { userId: req.user.id }
});
if (!employee) {
  return res.status(403).json({ error: 'Empleado no encontrado' });
}
// Filtrar datos por employee.id
```

#### 16.12.3 Lo que NUNCA se Debe Hacer

```javascript
// ❌ MAL: Hardcodear roles NO administrativos
if (user.role === 'SISTEMAS') { ... }
if (['SISTEMAS', 'COMPRAS'].includes(user.role)) { ... }

// ✅ BIEN: Usar accessibleModules
if (user.accessibleModules?.includes('EMPLEADOS')) { ... }

// ✅ BIEN: Bypass ADMIN/RH + accessibleModules
if (user.role === 'ADMIN' || user.role === 'RH') {
  // Acceso completo
} else if (user.accessibleModules?.includes('EMPLEADOS')) {
  // Acceso condicional
}
```

### 16.13 Cliente API (Axios)

#### 16.13.1 Instancias Disponibles

```javascript
// frontend/lib/api.js

// 1. authApi — Sin token (login, register)
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

// 2. api — Con token (uso general)
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

// 3. permissionApi — Para gestión de permisos
export const permissionApi = {
  getAllUsersWithPermissions: () => api.get('/permissions/users'),
  updateUserPermissions: (userId, modules, role) =>
    api.put(`/permissions/users/${userId}`, { accessibleModules: modules, role }),
  getAvailableModules: () => api.get('/permissions/modules'),
};

// 4. systemApi — Para roles y módulos
export const systemApi = {
  getRoles: () => api.get('/roles'),
  getModules: () => api.get('/modules'),
  getRolePresets: () => api.get('/roles/presets'),
  createRole: (data) => api.post('/roles', data),
  deleteRole: (id) => api.delete(`/roles/${id}`),
};
```

#### 16.13.2 Interceptor de Token

```javascript
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
```

### 16.14 Configuración de Módulos y Roles

#### 16.14.1 Agregar un Nuevo Módulo

```javascript
// 1. backend/src/config/modules.config.js
const MODULES = [
  { key: 'NUEVO_MODULO', name: 'Nombre Visible', enabled: true, description: 'Descripción' },
  // ...
];

// 2. backend/prisma/schema.prisma (opcional, si se usa enum)
enum ModuleType {
  NUEVO_MODULO
  // ...
}

// 3. backend/src/routes/roles.routes.js (GET /api/modules)
const MODULES_LIST = [
  { id: 'NUEVO_MODULO', name: 'Nombre Visible', description: 'Descripción' },
  // ...
];

// 4. frontend — Crear rutas protegidas
<ProtectedRoute requiredModule="NUEVO_MODULO">
  <NuevoComponente />
</ProtectedRoute>

// 5. backend — Proteger endpoints
router.get('/nueva-ruta', authMiddleware.requireModule('NUEVO_MODULO'), controlador);
```

#### 16.14.2 Agregar un Nuevo Rol

```javascript
// 1. frontend/lib/rolesConfig.js
const ROLES_CONFIG = {
  NUEVO_ROL: {
    name: 'Nombre Visible',
    color: 'bg-indigo-100 text-indigo-800',
    description: 'Descripción del rol',
    icon: '🎯',
    order: 7
  },
  // ...
};

// 2. backend/prisma/schema.prisma (opcional)
enum RoleType {
  NUEVO_ROL
  // ...
}

// 3. backend/src/routes/roles.routes.js (SYSTEM_ROLES)
const SYSTEM_ROLES = [
  { id: 'NUEVO_ROL', name: 'Nombre Visible', description: 'Descripción', color: 'bg-indigo-100 text-indigo-800', icon: '🎯' },
  // ...
];

// 4. backend/src/config/roles.config.js (presets, opcional)
const ROLE_PRESETS = {
  NUEVO_ROL: ['DASHBOARD', 'OTRO_MODULO'],
  // ...
};
```

#### 16.14.3 Agregar un Preset

```javascript
// backend/src/config/roles.config.js
const ROLE_PRESETS = {
  NUEVO_ROL: ['DASHBOARD', 'EMPLEADOS', 'RECLUTAMIENTO'],
  // ...
};
```

### 16.15 Prisma ORM — Buenas Prácticas

#### 16.15.1 Patrón de Consultas

```javascript
// ✅ BIEN: Select explícito (solo campos necesarios)
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, name: true, email: true, role: true }
});

// ✅ BIEN: Include con select anidado
const employee = await prisma.employee.findUnique({
  where: { id: employeeId },
  include: {
    departamento: { select: { id: true, nombre: true } },
    puesto: { select: { id: true, nombre: true } }
  }
});

// ✅ BIEN: Transacciones para operaciones atómicas
const result = await prisma.$transaction(async (tx) => {
  const created = await tx.model.create({ data: { ... } });
  await tx.auditLog.create({ data: { ... } });
  return created;
});
```

#### 16.15.2 Errores Comunes a Evitar

```javascript
// ❌ MAL: No usar select (devuelve TODOS los campos, incluyendo password)
const user = await prisma.user.findUnique({ where: { id } });

// ✅ BIEN: Excluir campos sensibles
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true, role: true, accessibleModules: true }
});

// ❌ MAL: No usar transacción para operaciones dependientes
await prisma.model.create({ data });
await prisma.relatedModel.create({ data }); // ← Si falla, el primer create queda huérfano

// ✅ BIEN: Usar transacción
await prisma.$transaction(async (tx) => {
  await tx.model.create({ data });
  await tx.relatedModel.create({ data });
});
```

### 16.16 Manejo de Errores

#### 16.16.1 Patrón de Error en Backend

```javascript
try {
  // Lógica
} catch (error) {
  console.error('❌ [NombreControlador.metodo]:', error.message);
  
  // Errores conocidos de Prisma
  if (error.code === 'P2002') {
    return res.status(400).json({ error: 'El registro ya existe (campo único duplicado)' });
  }
  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado' });
  }
  
  // Error genérico
  res.status(error.statusCode || 500).json({
    error: error.message || 'Error interno del servidor'
  });
}
```

#### 16.16.2 Patrón de Error en Frontend

```javascript
try {
  const response = await api.post('/endpoint', data);
  toast.success(response.data.message || 'Operación exitosa');
  fetchData(); // Refrescar datos
} catch (error) {
  const message = error.response?.data?.error || 'Error de conexión';
  toast.error(message);
}
```

### 16.17 Notificaciones por Email

#### 16.17.1 Configuración

```bash
# .env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@dominio.com
```

#### 16.17.2 Uso del Servicio de Email

```javascript
const emailService = require('../services/email.service');

// Enviar email simple
await emailService.sendEmail(
  'destinatario@ejemplo.com',
  'Asunto del correo',
  '<h1>Contenido HTML</h1>'
);

// Usar plantilla predefinida
await emailService.sendVacancyApprovalRequired(vacancy, rhUsers);
await emailService.sendVacancyApproved(vacancy, solicitante);
await emailService.sendCandidateReviewRequest(candidate, solicitante);
```

#### 16.17.3 Plantillas Disponibles

| Método | Propósito |
|--------|-----------|
| `sendVacancyApprovalRequired(vacancy, rhUsers)` | Solicitud de aprobación de vacante |
| `sendVacancyDirectCreated(vacancy, solicitante)` | Vacante directa creada por RH |
| `sendVacancyApproved(vacancy, solicitante)` | Vacante aprobada |
| `sendCandidateReviewRequest(candidate, solicitante)` | Revisión de candidato |
| `sendCandidateVoted(candidate, rhUsers)` | Candidato votado (like/dislike) |
| `sendCandidateSelected(candidate, rhUsers)` | Candidato seleccionado |
| `sendAuthorization(requestId, approverEmails)` | Envío a autorización (compras) |
| `notifyStatusChange(purchaseRequestId, previousStatus, newStatus)` | Cambio de estado (compras) |

### 16.18 Server-Sent Events (SSE) — Tiempo Real

#### 16.18.1 Implementación

```javascript
// Backend: sse-manager.service.js
const sseManager = require('../services/sse-manager.service');

// Backend: sse-manager.service.js
const sseManager = require('../services/sse-manager.service');

// Conectar cliente
router.get('/stream', authMiddleware.verifyToken, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Registrar cliente
  sseManager.addClient(req.user.id, res);

  // Eliminar cliente al desconectar
  req.on('close', () => {
    sseManager.removeClient(req.user.id, res);
  });
});

// Emitir evento a un usuario específico
sseManager.sendToUser(userId, { type: 'COMMENT_NEW', data: comment });

// Emitir evento a todos los usuarios
sseManager.broadcast({ type: 'STATUS_CHANGE', data: { id, status } });
```

#### 16.18.2 Uso en Frontend

```javascript
// Conectar al stream SSE
useEffect(() => {
  const token = localStorage.getItem('token');
  const eventSource = new EventSource(
    `${process.env.NEXT_PUBLIC_API_URL}/stream?token=${token}`
  );

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'COMMENT_NEW') {
      // Actualizar comentarios
      fetchComments();
    }
  };

  eventSource.onerror = (err) => {
    console.error('SSE error:', err);
    eventSource.close();
  };

  return () => eventSource.close();
}, []);

// Enviar comentario (POST normal, SSE solo recibe notificaciones)
const handleSubmitComment = async (text) => {
  await api.post(`/purchase-requests/${id}/comments`, { text });
  // El SSE notificará a otros usuarios automáticamente
};
```

### 16.19 Variables de Entorno

#### 16.19.1 Backend (.env)

```bash
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/kram_erp

# JWT
JWT_SECRET=tu_secreto_jwt_aqui

# Servidor
PORT=3001
BASE_URL=http://localhost:3001
NODE_ENV=development

# Frontend URL (para enlaces en emails)
SERVICE_FQDN_FRONTEND=localhost:3000

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@kramhub.site

# Uploads
UPLOAD_DIR=./uploads

# Coolify/Docker
SERVICE_FQDN_BACKEND=api.kramhub.site
```

#### 16.19.2 Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 16.20 Docker y Despliegue

#### 16.20.1 Estructura Docker

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/kram_erp
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
    volumes:
      - uploads_data:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.kramhub.site/api

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=kram_erp
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

#### 16.20.2 Comandos Útiles

```bash
# Desarrollo local
cd backend && npm run dev    # Backend en :3001
cd frontend && npm run dev   # Frontend en :3000

# Prisma
cd backend && npx prisma generate    # Generar cliente Prisma
cd backend && npx prisma db push     # Sincronizar esquema con BD
cd backend && npx prisma studio      # Abrir UI de Prisma Studio

# Docker
docker-compose up -d                 # Iniciar todos los servicios
docker-compose down                  # Detener servicios
docker-compose logs -f               # Ver logs en tiempo real

# Producción (Coolify)
docker-compose -f docker-compose.prod.yml up -d
```

### 16.21 Checklist para Nuevas Funcionalidades

Al agregar una nueva funcionalidad, seguir esta checklist:

- [ ] **1. Modelo de datos**: ¿Necesita nuevas tablas/campos en Prisma?
  - [ ] Agregar modelo al `schema.prisma`
  - [ ] Ejecutar `npx prisma generate` y `npx prisma db push`
- [ ] **2. Backend — Controlador**: Crear `backend/src/controllers/nuevo.controller.js`
  - [ ] Try/catch en todas las funciones
  - [ ] Mensajes en español
  - [ ] Scoping de datos (Nivel B) con bypass ADMIN/RH
  - [ ] Validación de parámetros de entrada
- [ ] **3. Backend — Rutas**: Crear `backend/src/routes/nuevo.routes.js`
  - [ ] `router.use(authMiddleware.verifyToken)` al inicio
  - [ ] `requireModule('MODULO')` para endpoints de módulo
  - [ ] `requireRHOrAdmin()` para operaciones críticas
  - [ ] Montar en `backend/src/index.js`
- [ ] **4. Backend — Servicios** (si aplica): Crear `backend/src/services/nuevo.service.js`
  - [ ] Transacciones Prisma para operaciones atómicas
  - [ ] Select explícito (no devolver campos sensibles)
- [ ] **5. Frontend — Página**: Crear `frontend/app/ruta/page.js`
  - [ ] `'use client'` al inicio
  - [ ] `useAuth()` para obtener usuario
  - [ ] `DashboardLayout` como wrapper
  - [ ] `ProtectedRoute` como exportación
  - [ ] Estados: loading, error, empty, success
  - [ ] Formateo de fechas a DD/MM/YYYY
- [ ] **6. Frontend — API**: Agregar métodos al cliente API en `frontend/lib/api.js`
- [ ] **7. Módulo/Rol** (si aplica):
  - [ ] Agregar módulo a `modules.config.js`
  - [ ] Agregar rol a `rolesConfig.js`
  - [ ] Agregar preset a `roles.config.js`
  - [ ] Agregar a `SYSTEM_ROLES` en `roles.routes.js`
- [ ] **8. Pruebas**:
  - [ ] Probar con usuario ADMIN (debe ver todo)
  - [ ] Probar con usuario RH (debe ver todo)
  - [ ] Probar con usuario regular (debe ver solo sus datos)
  - [ ] Probar sin módulo asignado (debe recibir 403)

### 16.22 Resumen de Convenciones

| Concepto | Convención |
|----------|-----------|
| **Nombres de archivos (backend)** | `kebab-case` (ej. `employee-core.controller.js`) |
| **Nombres de archivos (frontend)** | `PascalCase` para componentes, `kebab-case` para páginas |
| **Exportaciones (backend)** | `exports.funcion = async (req, res) => { ... }` |
| **Exportaciones (frontend)** | `export default function Componente() { ... }` |
| **Mensajes de error** | Español |
| **Código de estado HTTP** | 200, 201, 400, 403, 404, 500 |
| **Formato de fechas (UI)** | DD/MM/YYYY |
| **Formato de fechas (BD)** | ISO 8601 UTC |
| **Control de acceso** | `accessibleModules` + bypass ADMIN/RH |
| **Scoping de datos** | Por `employee.id` o `departamento_id` |
| **Operaciones críticas** | Solo ADMIN (`requireRole(['ADMIN'])`) |
| **Autenticación** | JWT en header `Authorization: Bearer <token>` |
| **Subida de archivos** | Multer con `diskStorage` |
| **Tiempo real** | SSE (Server-Sent Events) |
| **Notificaciones** | Resend (email) |

---


---

## 17. CONFIGURACIÓN DEL SISTEMA E INFRAESTRUCTURA

### 17.1 Variables de Entorno del Backend

Fuente: `backend/.env.example`, `backend/Dockerfile`, `docker-compose.prod.yml`, `backend/src/index.js`

| Variable | Obligatoria | Descripción | Módulo Relacionado |
|----------|-------------|-------------|-------------------|
| `DATABASE_URL` | Sí | Cadena de conexión a PostgreSQL (`postgresql://user:password@host:5432/db?schema=public`) | Todos (Prisma) |
| `JWT_SECRET` | Sí | Clave secreta para firmar tokens JWT. Debe cambiarse en producción | Autenticación |
| `JWT_EXPIRES_IN` | No | Tiempo de expiración del token (defecto: `7d`) | Autenticación |
| `PORT` | No | Puerto del servidor Express (defecto: `3001`) | Infraestructura |
| `NODE_ENV` | No | Entorno de ejecución (`development`, `production`) | Todos |
| `CORS_ORIGIN` | Sí (producción) | Orígenes permitidos para CORS (separados por coma). Si no se define, usa defaults hardcodeados | Todos (CORS) |
| `BASE_URL` | No | URL base del backend para enlaces en emails (defecto: `http://localhost:3001`) | Email |
| `TRUST_PROXY` | No | Nivel de confianza de proxy inverso (0, 1, 2). Requerido en Coolify/Traefik | Infraestructura |
| `SERVICE_FQDN_FRONTEND` | No | FQDN del frontend para Coolify (ej: `erp.kramhub.site`) | Email, CORS |
| `SERVICE_FQDN_BACKEND` | No | FQDN del backend para Coolify (ej: `apierp.kramhub.site`) | Email, CORS |
| `RESEND_API_KEY` | No | API key de Resend para envío de emails. Sin ella, los emails no se envían | Email (Notificaciones) |
| `RESEND_FROM_EMAIL` | No | Dirección remitente para emails (defecto: `noreply@pid.kramhub.site`) | Email (Notificaciones) |
| `UPLOAD_DIR` | No | Directorio base de uploads (defecto: `./uploads`) | Uploads (todos los módulos) |
| `SEED_RESET` | No | Si es `true`, ejecuta seed de producción con reset de BD (solo primer deploy) | Seed/Instalación |

**Total de variables documentadas: 14**

#### Variables Críticas para Producción

| Variable | Riesgo si no se configura |
|----------|--------------------------|
| `DATABASE_URL` | El backend no puede conectarse a la BD. Error en todos los endpoints |
| `JWT_SECRET` | Tokens inseguros. Si se usa el valor por defecto, cualquiera puede firmar tokens válidos |
| `CORS_ORIGIN` | El frontend no podrá hacer peticiones al backend (bloqueo CORS) |
| `TRUST_PROXY` | Sin esta variable, `req.ip` y `req.protocol` serán incorrectos detrás de Traefik |
| `RESEND_API_KEY` | Los emails de notificaciones no se enviarán (vacantes, autorizaciones, cumpleaños) |

### 17.2 Variables de Entorno del Frontend

Fuente: `frontend/Dockerfile`, `frontend/next.config.js`, `docker-compose.prod.yml`

No existe archivo `.env.example` en el frontend. Las variables se configuran directamente en el Dockerfile y docker-compose.

| Variable | Obligatoria | Descripción | Módulo Relacionado |
|----------|-------------|-------------|-------------------|
| `NEXT_PUBLIC_API_URL` | Sí | URL base de la API del backend (defecto: `http://localhost:3001`). Se inyecta en build-time | Todos (API Client) |
| `NEXT_PUBLIC_ALLOWED_ORIGIN` | No | Origen permitido para Server Actions de Next.js (defecto: `erp.kramhub.site`) | Infraestructura (Server Actions) |
| `NEXT_TELEMETRY_DISABLED` | No | Deshabilitar telemetría de Next.js (defecto: `1`) | Infraestructura |

**Total de variables documentadas: 3**

#### Variables Críticas para Producción

| Variable | Riesgo si no se configura |
|----------|--------------------------|
| `NEXT_PUBLIC_API_URL` | El frontend no podrá comunicarse con el backend. Todas las llamadas API fallarán |

### 17.3 Variables Utilizadas por Coolify

Coolify es la plataforma de despliegue en producción. Las variables se configuran por servicio en la UI de Coolify.

#### Servicio: Backend

| Variable | Propósito en Coolify |
|----------|---------------------|
| `DATABASE_URL` | Conectar al contenedor de PostgreSQL gestionado por Coolify |
| `JWT_SECRET` | Configurar secreto JWT (Coolify permite generarlo automáticamente) |
| `CORS_ORIGIN` | Definir orígenes CORS incluyendo el dominio del frontend en Coolify |
| `TRUST_PROXY` | Habilitar confianza de proxy (Coolify usa Traefik como proxy inverso) |
| `SERVICE_FQDN_FRONTEND` | FQDN del frontend asignado por Coolify (ej: `erp.kramhub.site`) |
| `SERVICE_FQDN_BACKEND` | FQDN del backend asignado por Coolify (ej: `apierp.kramhub.site`) |
| `RESEND_API_KEY` | API key de Resend para notificaciones |
| `SEED_RESET` | Solo para primer deploy: `true` para inicializar BD con datos de producción |
| `BUILD_DATE` | ARG de Docker para invalidar caché de build. Coolify debe pasar un valor único en cada deploy |

#### Servicio: Frontend

| Variable | Propósito en Coolify |
|----------|---------------------|
| `NEXT_PUBLIC_API_URL` | URL del backend en el dominio de Coolify (ej: `https://apierp.kramhub.site`) |
| `NEXT_PUBLIC_ALLOWED_ORIGIN` | FQDN del frontend para Server Actions de Next.js |

#### Servicio: PostgreSQL

| Variable | Propósito en Coolify |
|----------|---------------------|
| `DB_USER` | Usuario de PostgreSQL (defecto: `kramadmin`) |
| `DB_PASSWORD` | Contraseña de PostgreSQL |
| `DB_NAME` | Nombre de la base de datos (defecto: `kram_erp`) |

### 17.4 Proceso Real de Despliegue

El flujo de despliegue está definido por la interacción entre GitHub, Coolify y Docker.

```
┌─────────────────────────────────────────────────────────────────┐
│                        DESARROLLADOR                            │
│  git push → GitHub (rama main o deploy)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        COOLIFY                                   │
│  1. Detecta push en el repositorio configurado                  │
│  2. Clona/actualiza el código fuente                            │
│  3. Lee docker-compose.prod.yml                                 │
│  4. Inicia build de imágenes Docker                             │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER BUILD (BACKEND)                        │
│                                                                  │
│  STAGE 1: Builder                                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1. node:20-slim                                          │    │
│  │ 2. Instalar OpenSSL + ca-certificates                    │    │
│  │ 3. Copiar package*.json + prisma/                        │    │
│  │ 4. npm install (genera Prisma Client automáticamente)    │    │
│  │ 5. Verificar node_modules/.prisma/client existe          │    │
│  │ 6. Copiar src/ + scripts/                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  STAGE 2: Runner                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1. node:20-slim                                          │    │
│  │ 2. Instalar OpenSSL + ca-certificates + curl (health)    │    │
│  │ 3. Copiar desde builder: node_modules, src, scripts,     │    │
│  │    prisma                                                 │    │
│  │ 4. Crear directorios uploads/ con permisos 777           │    │
│  │ 5. EXPOSE 3001                                           │    │
│  │ 6. HEALTHCHECK cada 30s (curl /api/health)               │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER BUILD (FRONTEND)                       │
│                                                                  │
│  STAGE 1: Builder                                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1. node:20-slim                                          │    │
│  │ 2. Instalar python3, make, g++ (para sharp)             │    │
│  │ 3. Actualizar npm a v11 (lockfileVersion 3)             │    │
│  │ 4. npm install --include=dev                            │    │
│  │ 5. ARG NEXT_PUBLIC_API_URL (inyectado por Coolify)      │    │
│  │ 6. npm run build (Next.js production build)             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  STAGE 2: Runner                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1. node:20-alpine (más ligero)                          │    │
│  │ 2. Crear usuario no-root (nextjs)                       │    │
│  │ 3. Copiar: .next, node_modules, public, next.config.js  │    │
│  │ 4. chown a nextjs:nodejs                                │    │
│  │ 5. USER nextjs (seguridad)                              │    │
│  │ 6. EXPOSE 3000                                          │    │
│  │ 7. HEALTHCHECK cada 30s (wget /)                        │    │
│  │ 8. CMD: npm start                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INICIO DE CONTENEDORES                        │
│                                                                  │
│  1. postgres: Inicia primero (healthcheck: pg_isready)          │
│  2. backend: Espera a que postgres esté healthy                 │
│     a. Ejecuta resolve-migrations.js (marcar migraciones        │
│        fallidas como aplicadas)                                 │
│     b. Ejecuta npx prisma migrate deploy (aplicar migraciones   │
│        pendientes)                                              │
│     c. Inicia servidor Express (node src/index.js)              │
│  3. frontend: Espera a que backend esté corriendo               │
│     a. Inicia Next.js (npm start)                               │
│  4. Coolify verifica healthchecks de cada servicio              │
│  5. Coolify configura dominio y SSL (Traefik)                   │
└─────────────────────────────────────────────────────────────────┘
                           ▼
                    🟢 SISTEMA OPERATIVO
```

#### Detalles Técnicos del Despliegue

| Aspecto | Detalle |
|---------|---------|
| **Trigger** | `git push` a GitHub (Coolify detecta automáticamente) |
| **Orquestación** | `docker-compose.prod.yml` (3 servicios: postgres, backend, frontend) |
| **Build cache** | `BUILD_DATE` como ARG para invalidar caché de Docker en cada deploy |
| **Migraciones** | `resolve-migrations.js` → `prisma migrate deploy` (no `db push`) |
| **Seed** | Comentado en el CMD. Se ejecuta manualmente vía endpoint `POST /api/seed/reset` |
| **Uploads** | Volumen Docker `backend_uploads:/app/uploads` para persistencia |
| **Proxy** | Coolify usa Traefik como proxy inverso (SSL automático) |
| **Health checks** | Backend: `curl /api/health` cada 30s. Frontend: `wget /` cada 30s |
| **Recursos** | Backend: 512MB límite / 256MB reserva. Frontend: 768MB límite / 384MB reserva |

### 17.5 Estructura de Uploads

Fuente: `backend/src/middlewares/upload.middleware.js`, `backend/src/index.js`, `backend/Dockerfile`, sistema de archivos `uploads/`

| Carpeta | Contenido | Módulo Responsable | Extensiones Permitidas |
|---------|-----------|-------------------|----------------------|
| `uploads/cvs/` | Currículums de candidatos (PDF) | Reclutamiento | `.pdf` |
| `uploads/psych-tests/` | Pruebas psicométricas de candidatos (PDF) | Reclutamiento | `.pdf` |
| `uploads/photos/` | Fotos de perfil de empleados | Empleados | `.jpg`, `.jpeg`, `.png` |
| `uploads/employee-documents/` | Documentos de empleados (INE, CURP, comprobantes, etc.) | Empleados | `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.csv` |
| `uploads/purchase-quotes/` | Cotizaciones de proveedores (PDF, imágenes) | Compras | `.pdf`, `.jpg`, `.jpeg`, `.png` |
| `uploads/temp/` | Archivos temporales (fallback para campos no mapeados) | Todos | `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.csv` |

**Total de carpetas de uploads: 6**

#### Configuración Técnica

| Aspecto | Valor |
|---------|-------|
| **Tamaño máximo** | 10MB (configurado en `express.json({ limit: '10mb' })`) |
| **Extensiones permitidas** | `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.csv` |
| **Persistencia en Docker** | Volumen `backend_uploads:/app/uploads` definido en `docker-compose.prod.yml` |
| **Permisos en contenedor** | `chmod -R 777 /app/uploads` (ejecutado como root en Dockerfile) |
| **Fallback en Coolify** | Si `UPLOAD_DIR` no está configurado, usa `/tmp/uploads` como fallback |
| **Servido estático** | Express sirve `uploads/` en la ruta `/uploads` mediante `express.static` |
| **Proxy en Frontend** | Next.js tiene rewrite de `/uploads/:path*` → `{apiUrl}/uploads/:path*` |

### 17.6 Ambientes Soportados

#### Ambiente 1: Desarrollo Local

| Aspecto | Configuración |
|---------|--------------|
| **Base de datos** | PostgreSQL local o Docker (`docker-compose.yml`) |
| **Backend** | `npm run dev` en `localhost:3001` (nodemon con hot reload) |
| **Frontend** | `npm run dev` en `localhost:3000` (Next.js dev server con HMR) |
| **CORS** | `http://localhost:3000` (default hardcodeado en `index.js`) |
| **Uploads** | Directorio local `./uploads/` |
| **Email** | No funcional sin `RESEND_API_KEY` |
| **Proxy** | No aplica (sin Traefik) |
| **SSL** | No (HTTP plano) |
| **Herramientas extra** | pgAdmin en `localhost:5050` (opcional, definido en `docker-compose.yml`) |

**Comando de inicio:**
```bash
# Terminal 1: Base de datos
docker-compose up -d postgres

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

#### Ambiente 2: Producción (Coolify)

| Aspecto | Configuración |
|---------|--------------|
| **Base de datos** | PostgreSQL como servicio Docker en Coolify (con healthcheck) |
| **Backend** | Contenedor Docker con `node src/index.js` en puerto 3001 |
| **Frontend** | Contenedor Docker con `npm start` (Next.js production) en puerto 3000 |
| **CORS** | Configurado vía variable `CORS_ORIGIN` con dominio de producción |
| **Uploads** | Volumen persistente `backend_uploads` en Docker |
| **Email** | Funcional con `RESEND_API_KEY` configurada |
| **Proxy** | Traefik (Coolify) como proxy inverso con `TRUST_PROXY=1` |
| **SSL** | Automático (Let's Encrypt vía Traefik) |
| **Migraciones** | Automáticas al iniciar el contenedor (`prisma migrate deploy`) |
| **Seed** | Manual vía endpoint `POST /api/seed/reset` (comentado en CMD por defecto) |

**Orquestación:** `docker-compose.prod.yml` (3 servicios: postgres, backend, frontend)

#### Diferencias Clave entre Ambientes

| Aspecto | Desarrollo Local | Producción (Coolify) |
|---------|-----------------|---------------------|
| **Node.js** | Local (cualquier versión) | Contenedor Docker (node:20-slim/alpine) |
| **Hot Reload** | ✅ (nodemon + Next.js HMR) | ❌ (producción estática) |
| **Base de datos** | Local o Docker | Contenedor Docker con healthcheck |
| **Migraciones** | Manual (`npx prisma db push`) | Automática (`prisma migrate deploy`) |
| **Uploads** | Directorio local | Volumen Docker persistente |
| **SSL** | ❌ | ✅ (Let's Encrypt) |
| **Proxy** | ❌ | ✅ (Traefik) |
| **Email** | ❌ (sin API key) | ✅ (con RESEND_API_KEY) |
| **Seguridad** | Mínima | Usuario no-root (frontend), permisos restringidos |
| **Recursos** | Ilimitados (local) | Limitados por contenedor (512MB/768MB) |

### 17.7 Riesgos Operativos Identificados

Basado en el análisis de la implementación actual (`Dockerfile`, `docker-compose.prod.yml`, `index.js`, `upload.middleware.js`, `resolve-migrations.js`).

#### Riesgos de Configuración

| # | Riesgo | Impacto | Mitigación |
|---|--------|---------|------------|
| 1 | `JWT_SECRET` con valor por defecto en producción | Tokens falsificables. Cualquiera puede generar JWT válidos | Configurar secreto único en Coolify. Coolify puede generarlo automáticamente |
| 2 | `CORS_ORIGIN` sin configurar en producción | El frontend no podrá hacer peticiones al backend (error CORS) | Configurar explícitamente con el dominio de producción |
| 3 | `TRUST_PROXY` sin configurar | `req.ip` mostrará IP del proxy (Traefik) en lugar de IP real del cliente | Configurar `TRUST_PROXY=1` en Coolify |
| 4 | `DATABASE_URL` incorrecta | Backend no inicia. Error de conexión a PostgreSQL | Verificar credenciales y hostname del contenedor de BD |
| 5 | `NEXT_PUBLIC_API_URL` incorrecta en build | Frontend construido con URL de API incorrecta. Requiere rebuild | Configurar correctamente en Coolify antes del primer build |

#### Riesgos de Dependencias Externas

| # | Riesgo | Impacto | Mitigación |
|---|--------|---------|------------|
| 6 | PostgreSQL no disponible | Backend no puede iniciar. Error P1001 de Prisma | Healthcheck en PostgreSQL + `depends_on: condition: service_healthy` |
| 7 | Resend (API de email) caído | Notificaciones no se envían. El sistema sigue funcionando | El servicio tiene fallback silencioso (`console.warn`). Monitorear logs |
| 8 | GitHub no disponible | No se pueden hacer deploys nuevos | El sistema en producción sigue funcionando. Solo afecta nuevos deploys |

#### Riesgos de Despliegue

| # | Riesgo | Impacto | Mitigación |
|---|--------|---------|------------|
| 9 | Migración fallida bloquea el deploy | Backend no inicia. Contenedor en crash loop | Script `resolve-migrations.js` marca migraciones fallidas como aplicadas automáticamente |
| 10 | Seed de producción ejecutado múltiples veces | Datos duplicados o inconsistentes | Seed comentado en CMD. Solo se ejecuta manualmente vía endpoint `POST /api/seed/reset` |
| 11 | Build cache de Docker no invalidado | Código antiguo desplegado (cambios no reflejados) | `BUILD_DATE` como ARG para forzar rebuild. Coolify debe pasar valor único |
| 12 | npm lockfileVersion incompatible | Error al instalar dependencias en Docker | Frontend actualiza npm a v11 explícitamente. Backend usa `npm install` en vez de `npm ci` |

#### Riesgos de Pérdida de Datos (Uploads)

| # | Riesgo | Impacto | Mitigación |
|---|--------|---------|------------|
| 13 | Volumen Docker no persistente | Todos los archivos subidos se pierden al reiniciar el contenedor | Volumen `backend_uploads:/app/uploads` definido en `docker-compose.prod.yml` |
| 14 | Backup de uploads no realizado | Pérdida permanente de CVs, fotos, documentos y cotizaciones | Implementar backup periódico del volumen Docker |
| 15 | Permisos incorrectos en uploads | Error 403 al escribir archivos en el contenedor | `chmod -R 777 /app/uploads` en Dockerfile (ejecutado como root) |
| 16 | Fallback a `/tmp/uploads` sin persistencia | Archivos perdidos al reiniciar si `UPLOAD_DIR` no está configurado | Configurar `UPLOAD_DIR` explícitamente en Coolify |

#### Riesgos de Seguridad

| # | Riesgo | Impacto | Mitigación |
|---|--------|---------|------------|
| 17 | Usuario root en backend Docker | Si el contenedor es comprometido, el atacante tiene acceso root | El backend usa root por necesidad (permisos 777 en uploads). El frontend sí usa usuario no-root |
| 18 | Sin rate limiting en endpoints de autenticación | Fuerza bruta en login | No implementado actualmente. Pendiente de agregar |
| 19 | Subida de archivos maliciosos | Posible ejecución de código si se suben archivos con extensiones peligrosas | Filtro de extensiones en Multer (solo 9 extensiones permitidas) |
| 20 | Tamaño de archivo ilimitado | Ataque DoS por subida de archivos enormes | Límite de 10MB configurado en Express |

#### Resumen de Riesgos Críticos

| Prioridad | Riesgo | Acción Recomendada |
|-----------|--------|-------------------|
| 🔴 Crítico | JWT_SECRET por defecto en producción | Configurar secreto único antes del primer deploy |
| 🔴 Crítico | Volumen de uploads sin backup | Implementar backup periódico del volumen Docker |
| 🟡 Alto | Migración fallida bloquea deploy | El script resolve-migrations.js mitiga parcialmente. Monitorear logs |
| 🟡 Alto | Build cache no invalidado | Asegurar que Coolify pase BUILD_DATE único en cada deploy |
| 🟡 Alto | Sin rate limiting en login | Implementar express-rate-limit en rutas de autenticación |
| 🟢 Medio | Seed ejecutado múltiples veces | Mantener comentado en CMD. Usar endpoint manual con token de admin |
| 🟢 Medio | Fallback a /tmp/uploads sin persistencia | Configurar UPLOAD_DIR explícitamente en Coolify |

---

---

## 8. MATRIZ DE PERMISOS

**Fuentes de verdad:**
- `backend/src/config/modules.config.js` — Definición de módulos
- `backend/src/config/roles.config.js` — Presets de módulos por rol
- `backend/src/middlewares/auth.middleware.js` — Middleware de autenticación y autorización
- `backend/src/routes/**/*.js` — Protección de endpoints

### 8.1 Matriz de Acceso a Módulos (Nivel A)

La siguiente tabla muestra qué módulos tiene cada rol del sistema **por defecto** (según los presets definidos en `roles.config.js`).

| Módulo | EMPLEADO_BASICO | PRODUCCION | SISTEMAS | COMPRAS | RH | ADMIN |
|--------|:---------------:|:----------:|:--------:|:-------:|:--:|:-----:|
| `DASHBOARD` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `EMPLEADOS` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `RECLUTAMIENTO` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `VACACIONES` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `INCIDENCIAS` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `CONFIGURACION` | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `REPORTES` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `COMPRAS` | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |

**Leyenda:**
- ✅ = Tiene acceso por defecto (según preset)
- ❌ = No tiene acceso por defecto

> **Nota importante:** Los permisos son **dinámicos y configurables por usuario** desde la UI de Gestión de Accesos. La tabla refleja los **valores por defecto** (presets). ADMIN y RH pueden modificar los `accessibleModules` de cualquier usuario en cualquier momento.

### 8.2 Niveles de Seguridad

El sistema implementa un modelo de seguridad de **3 niveles** (Tiered Access Control), definido en `auth.middleware.js` y aplicado en todas las rutas.

#### Nivel A — Control de Acceso a Módulos (`requireModule`)

**Middleware:** `AuthMiddleware.requireModule(moduleName)`

Verifica que el módulo requerido esté presente en `req.user.accessibleModules[]`. Es la primera barrera de seguridad para acceder a cualquier funcionalidad del sistema.

**Endpoints que usan `requireModule`:**

| Módulo | Endpoints protegidos |
|--------|---------------------|
| `EMPLEADOS` | `GET /api/employees`, `GET /api/employees/me`, `GET /api/employee/:id/documents`, `GET /api/employee-documents/allowed-types`, `GET /api/employee-documents/:id/download`, `GET /api/departments`, `GET /api/departments/:id`, `POST /api/departments`, `PUT /api/departments/:id`, `DELETE /api/departments/:id`, `GET /api/job-positions`, `GET /api/job-positions/:id`, `POST /api/job-positions`, `PUT /api/job-positions/:id`, `DELETE /api/job-positions/:id`, `GET /api/departments/:deptId/job-positions`, `GET /api/organization/stats`, `GET /api/stats/rh/dashboard`, `GET /api/stats/my-dashboard` |
| `RECLUTAMIENTO` | `POST /api/recruitment/vacancies`, `GET /api/recruitment/my-vacancies`, `PUT /api/recruitment/vacancies/:id/technical-profile`, `POST /api/recruitment/vacancies/:id/activities`, `GET /api/recruitment/vacancies`, `GET /api/recruitment/vacancies/stats`, `GET /api/recruitment/vacancies/:id`, `POST /api/recruitment/vacancies/:id/comments`, `PUT /api/recruitment/candidates/:id/vote`, `PUT /api/recruitment/candidates/:id/select`, `GET /api/recruitment/candidates/:id/cv`, `PUT /api/recruitment/activities/:id`, `PUT /api/recruitment/vacancies/:id/cancel` |
| `INCIDENCIAS` | `POST /api/incidencias/upload`, `GET /api/incidencias/` |
| `COMPRAS` | `POST /api/purchases`, `GET /api/purchases/my`, `GET /api/purchases`, `GET /api/purchases/details/:id`, `POST /api/purchases/:id/quotes`, `POST /api/purchases/:id/select-quote`, `POST /api/purchases/:id/authorize`, `POST /api/purchases/:id/deliver`, `GET /api/purchases/:id/potential-approvers`, `POST /api/purchases/:id/assign-approvers`, `POST /api/purchases/:id/send-authorization`, `POST /api/purchases/:id/cancel`, `POST /api/purchases/:id/quotes/:quoteId/upload`, `POST /api/purchases/:id/quotes/upload-with-file`, `POST /api/purchases/:id/upload-quote-file`, `PUT /api/purchases/:id/quotes/:quoteId/amount`, `GET /api/purchases/:id/comparison`, `GET /api/purchases/:id/purchase-order`, `POST /api/purchases/:id/purchase-order`, `GET /api/purchase-orders`, `POST /api/purchases/:id/regenerate-order`, `GET /api/purchases/:id/audit`, `GET /api/purchases/:id/comments/stream`, `GET /api/purchases/:id/comments`, `POST /api/purchases/:id/comments` |
| `CONFIGURACION` | `GET /api/stats/system` |

#### Nivel B — Restricciones por Ownership o Scope del Usuario

Se aplican a nivel de **controlador** (lógica de negocio), no en rutas. Determinan **qué datos** puede ver o modificar un usuario dentro de un módulo.

**Patrones identificados:**

| Patrón | Descripción | Ejemplos |
|--------|-------------|----------|
| **Propiedad (My)** | El usuario solo ve/opera sobre recursos que él mismo creó | `GET /api/recruitment/my-vacancies` — solo vacantes donde el usuario es el solicitante |
| | | `GET /api/purchases/my` — solo solicitudes de compra del usuario autenticado |
| **Scoping por departamento** | Jefes de área (SISTEMAS, COMPRAS, PRODUCCION) ven solo empleados de su departamento | `employeeCoreController.getAllEmployees` — filtra por `departamento_id` si el usuario no es ADMIN/RH |
| **Scoping por jerarquía** | Un gerente ve a sus subordinados directos e indirectos | Basado en `employee.nivelJerarquico` y `employee.reportaAId` |
| **Votación de candidatos** | El solicitante de una vacante puede votar (like/dislike) solo por candidatos de su propia vacante | `PUT /api/recruitment/candidates/:id/vote` — verifica que el candidato pertenezca a una vacante del solicitante |
| **Cancelación por propietario** | Solo el solicitante puede cancelar su propia vacante | `PUT /api/recruitment/vacancies/:id/cancel` — verifica `solicitanteId` |

**Regla de bypass:** Los roles **ADMIN** y **RH** tienen bypass total de scoping — ven todos los datos sin filtros.

#### Nivel C — Operaciones Críticas del Sistema (`requireRole`)

**Middleware:** `AuthMiddleware.requireRole(allowedRoles)`

Restringe operaciones sensibles a roles específicos. Se usa exclusivamente para operaciones que modifican la configuración del sistema, gestionan usuarios, o ejecutan acciones destructivas.

**Operaciones exclusivas para ADMIN:**

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/users` | Listar todos los usuarios |
| `GET /api/users/stats` | Estadísticas de usuarios |
| `GET /api/users/:id` | Obtener usuario por ID |
| `POST /api/users` | Crear nuevo usuario |
| `PUT /api/users/:id` | Actualizar usuario |
| `DELETE /api/users/:id` | Eliminar usuario |
| `POST /api/roles` | Crear rol personalizado |
| `PUT /api/roles/:id` | Actualizar rol personalizado |
| `DELETE /api/roles/:id` | Eliminar rol personalizado |
| `POST /api/seed/reset` | Resetear base de datos |

**Operaciones para ADMIN o RH (`requireRHOrAdmin`):**

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/employees/template` | Descargar plantilla CSV |
| `POST /api/employees/import` | Importar empleados desde CSV |
| `GET /api/employees/export` | Exportar empleados a CSV |
| `GET /api/employees/stats` | Estadísticas de empleados |
| `POST /api/employees` | Crear empleado |
| `GET /api/employees/:id` | Obtener empleado por ID |
| `PUT /api/employees/:id` | Actualizar empleado |
| `DELETE /api/employees/:id` | Eliminar empleado |
| `DELETE /api/employees/:id/permanent` | Eliminar empleado permanentemente |
| `POST /api/departments` | Crear departamento |
| `PUT /api/departments/:id` | Actualizar departamento |
| `DELETE /api/departments/:id` | Eliminar departamento |
| `POST /api/job-positions` | Crear puesto |
| `PUT /api/job-positions/:id` | Actualizar puesto |
| `DELETE /api/job-positions/:id` | Eliminar puesto |
| `POST /api/employees/:id/photo` | Subir foto de perfil |
| `GET /api/employees/:id/salary-history` | Historial de sueldos |
| `POST /api/employee/:id/documents` | Subir documento de empleado |
| `DELETE /api/employee-documents/:id` | Eliminar documento de empleado |
| `PUT /api/recruitment/vacancies/:id/approve` | Aprobar solicitud de vacante |
| `PUT /api/recruitment/vacancies/:id/close` | Cerrar vacante |
| `POST /api/recruitment/vacancies/direct` | Crear vacante directa (Fast-Track) |
| `POST /api/recruitment/vacancies/:vacancy_id/candidates` | Registrar candidato |
| `PUT /api/recruitment/candidates/:id/observations` | Actualizar observaciones de candidato |
| `PUT /api/recruitment/candidates/:id/documents` | Actualizar documentos de candidato |
| `DELETE /api/recruitment/vacancies/:id` | Eliminar vacante |
| `GET /api/permissions/users` | Usuarios con permisos |
| `GET /api/permissions/modules` | Módulos disponibles |
| `PUT /api/permissions/users/:id` | Actualizar permisos de usuario |
| `POST /api/users/:id/reset-password` | Restablecer contraseña |
| `POST /api/notifications/check-now` | Ejecutar verificación manual de notificaciones |
| `GET /api/notifications/logs` | Historial de notificaciones |

**Operaciones para ADMIN o COMPRAS (`requireRole(['ADMIN', 'COMPRAS'])`):**

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/purchases` | Listar todas las solicitudes de compra |
| `POST /api/purchases/:id/quotes` | Subir cotizaciones |
| `POST /api/purchases/:id/select-quote` | Seleccionar cotización |
| `POST /api/purchases/:id/authorize` | Autorizar solicitud |
| `GET /api/purchases/:id/potential-approvers` | Aprobadores potenciales |
| `POST /api/purchases/:id/assign-approvers` | Asignar aprobadores |
| `POST /api/purchases/:id/send-authorization` | Enviar a autorización |
| `POST /api/purchases/:id/quotes/:quoteId/upload` | Subir archivo a cotización |
| `POST /api/purchases/:id/quotes/upload-with-file` | Subir cotización con archivo |
| `POST /api/purchases/:id/upload-quote-file` | Subir archivo para nueva cotización |
| `PUT /api/purchases/:id/quotes/:quoteId/amount` | Actualizar monto de cotización |
| `POST /api/purchases/:id/purchase-order` | Generar orden de compra |
| `GET /api/purchase-orders` | Listar órdenes de compra |
| `POST /api/purchases/:id/regenerate-order` | Regenerar orden de compra |
| `GET /api/purchases/:id/audit` | Historial de auditoría |

### 8.3 Resumen de la Matriz de Permisos

| Nivel | Mecanismo | Propósito | Roles con bypass |
|-------|-----------|-----------|------------------|
| **A — Módulos** | `requireModule('MODULO')` | Controlar acceso a funcionalidades completas | ADMIN, RH (acceso total) |
| **B — Scope** | Lógica en controladores (ownership, departamento, jerarquía) | Determinar qué datos ve cada usuario | ADMIN, RH (ven todo) |
| **C — Críticas** | `requireRole(['ADMIN'])` o `requireRole(['ADMIN', 'RH'])` | Operaciones sensibles del sistema | Solo ADMIN para operaciones críticas; ADMIN+RH para gestión de empleados |


---

## 19. JERARQUÍA ORGANIZACIONAL

### 19.1 Enum `NivelJerarquico`

Definido en `backend/prisma/schema.prisma` (línea 334):

```prisma
enum NivelJerarquico {
  PRESIDENTE
  DIRECTOR
  GERENTE
  JEFE
  COORDINADOR
  ANALISTA
  SUPERVISOR
  AUX_ADMINISTRATIVO
  OPERATIVO
}
```

El enum contiene **9 niveles jerárquicos** ordenados de mayor a menor autoridad. El valor por defecto es `OPERATIVO`.

### 19.2 Relaciones en el Modelo `Employee`

El modelo `Employee` implementa una **auto-referencia jerárquica** (relación recursiva) a través de dos campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `reportaAId` | `String?` | ID del empleado al que reporta (jefe directo) |
| `reportaA` | `Employee?` | Relación `@relation("Jerarquia")` — el jefe directo |
| `subordinados` | `Employee[]` | Relación inversa `@relation("Jerarquia")` — empleados que le reportan |

**Definición en Prisma:**

```prisma
reportaA              Employee?   @relation("Jerarquia", fields: [reportaAId], references: [id])
subordinados          Employee[]  @relation("Jerarquia")
```

Además, el modelo `JobPosition` también tiene un campo `nivelJerarquico`:

```prisma
model JobPosition {
  id              String           @id @default(cuid())
  nivelJerarquico NivelJerarquico  @default(OPERATIVO)
  // ...
}
```

Esto permite que cada **puesto** esté asociado a un nivel jerárquico, y cada **empleado** herede o tenga su propio nivel.

### 19.3 Diagrama de Jerarquía

```
                    ┌─────────────┐
                    │ PRESIDENTE  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  DIRECTOR   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   GERENTE   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    JEFE     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ COORDINADOR │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  SUPERVISOR │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   ANALISTA  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────────┐
                    │AUX_ADMINISTRATIVO│
                    └──────┬──────────┘
                           │
                    ┌──────▼──────┐
                    │  OPERATIVO  │
                    └─────────────┘
```

**Nota:** La relación `reportaA` / `subordinados` permite que cualquier empleado apunte a su jefe directo, formando un **árbol jerárquico** donde cada nodo puede tener N subordinados. El diagrama anterior muestra la progresión típica de niveles, pero en la práctica un `COORDINADOR` podría reportar directamente a un `DIRECTOR` si la estructura organizacional lo requiere.

### 19.4 Impacto en los Módulos

#### Reclutamiento

- **Scoping de visibilidad de vacantes:** Los jefes (GERENTE, DIRECTOR, PRESIDENTE) pueden ver vacantes de su departamento. Los niveles inferiores solo ven sus propias solicitudes.
- **Aprobación de vacantes:** El flujo de autorización (`VoBoPor`, `AutorizadoPor`) utiliza la jerarquía para determinar quién debe aprobar.
- **Campo `reportaA` en vacantes:** Al crear una vacante, se registra a quién reportará la nueva posición (`reportaA` en `JobVacancy`).
- **Búsqueda de aprobadores:** El sistema busca empleados con nivel `GERENTE`, `DIRECTOR` o `PRESIDENTE` para asignar autorizaciones.

```js
// approval.service.js — Búsqueda de aprobadores por nivel jerárquico
nivelJerarquico: { in: ['GERENTE', 'DIRECTOR', 'PRESIDENTE'] },
```

#### Empleados

- **Scoping de datos (Nivel B):** El módulo de empleados implementa visibilidad basada en el nivel jerárquico del usuario logueado:

  | Nivel del usuario | Visibilidad |
  |-------------------|-------------|
  | `PRESIDENTE`, `DIRECTOR`, `GERENTE`, `JEFE` | Empleados de su mismo departamento |
  | `COORDINADOR`, `ANALISTA`, `SUPERVISOR`, `AUX_ADMINISTRATIVO` | Su propio registro + empleados que le reportan directamente |
  | `OPERATIVO` | Solo su propio registro |

- **Asignación de jefe directo:** Al crear/editar un empleado, se puede establecer `reportaAId` para definir su posición en el árbol jerárquico.
- **Visualización de jerarquía:** La ficha del empleado muestra `reportaA` (jefe) y `subordinados` (equipo a cargo).

#### Compras

- **Aprobación de solicitudes de compra:** El servicio `approval.service.js` utiliza el nivel jerárquico para determinar aprobadores automáticos:

  ```js
  nivelJerarquico: { in: ['GERENTE', 'DIRECTOR', 'PRESIDENTE'] },
  ```

- **Scoping de solicitudes:** Los empleados de nivel `GERENTE`, `DIRECTOR` o `PRESIDENTE` pueden ver y autorizar compras de su departamento.
- **Orden de aprobación:** Los aprobadores se ordenan por `nivelJerarquico` ascendente (de menor a mayor jerarquía), asegurando que primero apruebe el nivel más cercano.

#### Organigrama

- **Visualización del árbol jerárquico:** El módulo de Organización (`/dashboard/organizacion/`) construye el organigrama completo usando la relación `reportaA` / `subordinados`.
- **Filtros por nivel:** Se pueden filtrar empleados por `nivelJerarquico` para visualizar la estructura por capas.
- **Creación de puestos:** Al crear un `JobPosition`, se asigna un `nivelJerarquico` que determina su lugar en la jerarquía organizacional.
- **Ordenamiento:** Las consultas de organización ordenan por `nivelJerarquico` descendente (mayor jerarquía primero) y luego por nombre alfabético.

### 19.5 Resumen de la Jerarquía

| Aspecto | Detalle |
|---------|---------|
| **Niveles definidos** | 9 (PRESIDENTE → OPERATIVO) |
| **Mecanismo** | Auto-referencia en `Employee` (`reportaAId` → `reportaA` / `subordinados`) |
| **Default** | `OPERATIVO` |
| **Módulos impactados** | Reclutamiento, Empleados, Compras, Organigrama |
| **Tipo de control** | Nivel B — Scoping de datos por jerarquía |

---


---

## 20. FLUJOS DE NEGOCIO

> **Fuente:** `backend/src/controllers/` + `frontend/app/`
> *Documentación del flujo funcional REAL del sistema, basado en el código fuente.*

---

### 20.1 Flujo de Reclutamiento (Solicitud de Vacante)

**Archivos involucrados:**
- `backend/src/controllers/recruitment.controller.js` (1550 líneas)
- `frontend/app/rh/reclutamiento/` (panel RH)
- `frontend/app/reclutamiento/` (portal de jefes de área)
- `frontend/app/my-vacancies/` (mis vacantes)

**Diagrama de flujo:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE RECLUTAMIENTO                                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  INICIO: Jefe de área (SISTEMAS, COMPRAS, PRODUCCION)           │    │
│  │  o cualquier usuario con módulo RECLUTAMIENTO                   │    │
│  └────────────────────────┬────────────────────────────────────────┘    │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  1. CREAR SOLICITUD DE VACANTE                                  │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ POST /api/recruitment/vacancies                           │  │    │
│  │  │ Controlador: createVacancy / createVacancyRequest         │  │    │
│  │  │                                                           │  │    │
│  │  │ Datos requeridos:                                         │  │    │
│  │  │ ├── titulo (título del puesto)                            │  │    │
│  │  │ ├── departamento_id                                       │  │    │
│  │  │ ├── jobPositionId (puesto asociado)                       │  │    │
│  │  │ ├── numeroVacantes                                        │  │    │
│  │  │ ├── motivoSolicitud (enum MotivoVacante)                  │  │    │
│  │  │ ├── tipoContratacion (enum TipoContratacion)              │  │    │
│  │  │ └── ~20 campos adicionales (requerimientos, etc.)         │  │    │
│  │  │                                                           │  │    │
│  │  │ Reglas:                                                   │  │    │
│  │  │ ├── Se obtiene solicitante vía getOrCreateSolicitante()   │  │    │
│  │  │ ├── Si el rol es RH/ADMIN → estatus = APROBADA            │  │    │
│  │  │ │   (aprobación automática)                               │  │    │
│  │  │ ├── Si el rol es SISTEMAS/COMPRAS/PRODUCCION              │  │    │
│  │  │ │   → estatus = SOLICITADA + notificación a RH            │  │    │
│  │  │ └── Se crea comentario automático de creación             │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  FRONTEND:                                                      │    │
│  │  ├── /reclutamiento/solicitar-vacante/ (jefes de área)         │    │
│  │  └── /rh/reclutamiento/crear-vacante/ (RH — flujo directo)     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  2. APROBACIÓN POR RH (solo si estatus = SOLICITADA)            │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ PUT /api/recruitment/vacancies/:id/approve                │  │    │
│  │  │ Controlador: approveVacancyRequest                       │  │    │
│  │  │                                                           │  │    │
│  │  │ Acción: Cambia estatus a APROBADA                         │  │    │
│  │  │ Notifica al solicitante por email                         │  │    │
│  │  │ Crea comentario automático de aprobación                  │  │    │
│  │  │                                                           │  │    │
│  │  │ FRONTEND: /rh/reclutamiento/ (botón "Aprobar")            │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  (No implementado actualmente: Flujo de VoBo — Visto Bueno     │    │
│  │   del director del área antes de la aprobación de RH)          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  3. DEFINIR ACTIVIDADES DEL PUESTO (Flujo Estándar)             │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ POST /api/recruitment/vacancies/:id/activities            │  │    │
│  │  │ Controlador: createJobActivities                          │  │    │
│  │  │                                                           │  │    │
│  │  │ Requisitos:                                               │  │    │
│  │  │ ├── La vacante debe estar en estado APROBADA              │  │    │
│  │  │ └── Solo el solicitante puede definir actividades         │  │    │
│  │  │                                                           │  │    │
│  │  │ Datos: Array de { activityType, description, duration,    │  │    │
│  │  │         priority }                                        │  │    │
│  │  │                                                           │  │    │
│  │  │ Notifica a RH que se definieron actividades               │  │    │
│  │  │                                                           │  │    │
│  │  │ FRONTEND: /reclutamiento/vacantes/[id]/ (pestaña          │  │    │
│  │  │           "Actividades del Puesto")                       │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  (No implementado actualmente: Flujo de perfil técnico         │    │
│  │   detallado por parte del jefe de área antes de búsqueda)      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  4. ACTUALIZAR PERFIL TÉCNICO (Flujo Directo / RH)              │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ PUT /api/recruitment/vacancies/:id/technical-profile      │  │    │
│  │  │ Controlador: updateTechnicalProfile                       │  │    │
│  │  │                                                           │  │    │
│  │  │ Requisito: La vacante debe estar en estado APROBADA        │  │    │
│  │  │                                                           │  │    │
│  │  │ Acción:                                                   │  │    │
│  │  │ ├── Crea actividades (si se proporcionan)                 │  │    │
│  │  │ ├── Actualiza requerimientos_tecnicos                     │  │    │
│  │  │ └── Cambia estatus a BUSCANDO                             │  │    │
│  │  │                                                           │  │    │
│  │  │ FRONTEND: /reclutamiento/vacantes/[id]/perfil-tecnico/    │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  (No implementado actualmente: Flujo de VoBo del director      │    │
│  │   del área sobre el perfil técnico)                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  5. REGISTRO DE CANDIDATOS (RH)                                 │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ POST /api/recruitment/vacancies/:vacancy_id/candidates    │  │    │
│  │  │ Controlador: createCandidate                              │  │    │
│  │  │                                                           │  │    │
│  │  │ Requisitos:                                               │  │    │
│  │  │ ├── La vacante debe estar en estado BUSCANDO              │  │    │
│  │  │ ├── CV obligatorio (PDF)                                  │  │    │
│  │  │ └── Prueba psicométrica opcional (PDF)                    │  │    │
│  │  │                                                           │  │    │
│  │  │ Acción:                                                   │  │    │
│  │  │ ├── Sube archivos a /uploads/cvs/ y /uploads/psych-tests/ │  │    │
│  │  │ ├── Crea candidato con estatus EN_REVISION                │  │    │
│  │  │ └── Notifica al solicitante para revisión                 │  │    │
│  │  │                                                           │  │    │
│  │  │ FRONTEND: /reclutamiento/vacantes/[id]/ (pestaña          │  │    │
│  │  │           "Candidatos")                                   │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  (No implementado actualmente: Evaluación técnica por parte    │    │
│  │   del entrevistador técnico)                                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  6. VOTACIÓN DEL SOLICITANTE (Like / Dislike)                   │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ PUT /api/recruitment/candidates/:candidate_id/vote        │  │    │
│  │  │ Controlador: updateCandidateVote                          │  │    │
│  │  │                                                           │  │    │
│  │  │ Acciones:                                                 │  │    │
│  │  │ ├── like → estatus = SELECCIONADO                         │  │    │
│  │  │ ├── dislike → estatus = DESCARTADO                        │  │    │
│  │  │ ├── reset → estatus = EN_REVISION (solo RH)               │  │    │
│  │  │ └── Notifica a RH del voto                                │  │    │
│  │  │                                                           │  │    │
│  │  │ FRONTEND: /reclutamiento/vacantes/[id]/ (pestaña          │  │    │
│  │  │           "Candidatos" — thumbs up/down)                  │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  (No implementado actualmente: Entrevista técnica,             │    │
│  │   evaluación psicométrica automatizada)                         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  7. SELECCIÓN DE CANDIDATO FINAL Y CIERRE                       │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ PUT /api/recruitment/candidates/:candidate_id/select      │  │    │
│  │  │ Controlador: selectCandidate                              │  │    │
│  │  │                                                           │  │    │
│  │  │ Requisito: Solo el solicitante puede seleccionar          │  │    │
│  │  │                                                           │  │    │
│  │  │ Acción:                                                   │  │    │
│  │  │ ├── Marca candidato como SELECCIONADO                     │  │    │
│  │  │ ├── Cambia vacante a CERRADA                              │  │    │
│  │  │ └── Notifica a RH                                         │  │    │
│  │  │                                                           │  │    │
│  │  │ FRONTEND: /reclutamiento/vacantes/[id]/ (botón            │  │    │
│  │  │           "Seleccionar candidato final")                  │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  (No implementado actualmente: Contratación formal del         │    │
│  │   candidato seleccionado — creación de empleado en sistema)    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  FLUJO ALTERNATIVO: VACANTE DIRECTA (Fast-Track RH)             │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ POST /api/recruitment/vacancies/direct                    │  │    │
│  │  │ Controlador: createDirectVacancy                          │  │    │
│  │  │                                                           │  │    │
│  │  │ Solo disponible para ADMIN y RH                           │  │    │
│  │  │                                                           │  │    │
│  │  │ Diferencias con flujo estándar:                           │  │    │
│  │  │ ├── Se crea directamente en estado APROBADA               │  │    │
│  │  │ ├── Se establece fechaAutorizacion automática             │  │    │
│  │  │ ├── Se pueden incluir actividades desde la creación       │  │    │
│  │  │ └── Se notifica al solicitante que es Fast-Track          │  │    │
│  │  │                                                           │  │    │
│  │  │ FRONTEND: /rh/reclutamiento/crear-vacante/ (checkbox      │  │    │
│  │  │           "Flujo Directo — Pre-aprobada")                 │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  (No implementado actualmente: Aprobación del director         │    │
│  │   general para vacantes directas)                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  FLUJO ALTERNATIVO: CANCELACIÓN POR SOLICITANTE                 │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ PUT /api/recruitment/vacancies/:id/cancel                 │  │    │
│  │  │ Controlador: cancelVacancy                                │  │    │
│  │  │                                                           │  │    │
│  │  │ Requisito: Solo el solicitante puede cancelar             │  │    │
│  │  │ Acción: Cambia estatus a CERRADA                          │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Estados de una vacante:**
```
SOLICITADA → APROBADA → BUSCANDO → CERRADA
                ↑           │
                └───────────┘ (Flujo Directo: salta SOLICITADA)
```

**Estados de un candidato:**
```
EN_REVISION → SELECCIONADO (like del solicitante)
EN_REVISION → DESCARTADO (dislike del solicitante)
DESCARTADO/SELECCIONADO → EN_REVISION (reset por RH)
```

---

### 20.2 Flujo de Compras (Solicitud de Compra)

**Archivos involucrados:**
- `backend/src/controllers/purchase.controller.js` (772 líneas)
- `backend/src/services/purchases/` (7 servicios)
- `frontend/app/compras/` (portal de solicitantes)
- `frontend/app/dashboard/compras/` (panel de Admin/Compras)

**Diagrama de flujo:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE COMPRAS                                      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  INICIO: Cualquier empleado con módulo COMPRAS                  │    │
│  └────────────────────────┬────────────────────────────────────────┘    │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  1. CREAR SOLICITUD DE COMPRA                                   │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ POST /api/purchases                                       │  │    │
│  │  │ Controlador: PurchaseController.createRequest             │  │    │
│  │  │ Servicio: purchase.service.createRequest                  │  │    │
│  │  │                                                           │  │    │
│  │  │ Datos:                                                    │  │    │
│  │  │ ├── justificacion (texto)                                 │  │    │
│  │  │ └── items: [{ productoServicio, cantidad, descripcion }]  │  │    │
│  │  │                                                           │  │    │
│  │  │ Auditoría: CREACION                                       │  │    │
│  │  │ Estatus inicial: NUEVO                                    │  │    │
│  │  │                                                           │  │    │
│  │  │ FRONTEND: /compras/nueva-solicitud/                       │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  (No implementado actualmente: Límite de presupuesto por       │    │
│  │   departamento, aprobación automática del jefe directo)         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  2. SUBIR COTIZACIONES (Admin/Compras)                          │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ POST /api/purchases/:id/quotes                            │  │    │
│  │  │ Controlador: PurchaseController.uploadQuotes              │  │    │
│  │  │ Servicio: quote.service.uploadQuotes                      │  │    │
│  │  │                                                           │  │    │
│  │  │ Requisito: Solicitud en estado NUEVO                      │  │    │
│  │  │                                                           │  │    │
│  │  │ Datos: [{ proveedor, monto, fechaEstimadaEntrega,         │  │    │
│  │  │          comentarios }] (máximo 3)                        │  │    │
│  │  │                                                           │  │    │
│  │  │ Acción: Cambia estatus a PENDIENTE                        │  │    │
│  │  │ Auditoría: COTIZACION_SUBIDA                              │  │    │
│  │  │ Notificación: NUEVO → PENDIENTE                           │  │    │
│  │  │                                                           │  │    │
│  │  │ FRONTEND: /dashboard/compras/[id]/ (modal                 │  │    │
│  │  │           "Subir Cotizaciones")                           │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  (No implementado actualmente: Cotización automática desde     │    │
│  │   proveedores registrados en el sistema)                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  3. SELECCIONAR COTIZACIÓN (Admin/Compras)                      │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ POST /api/purchases/:id/select-quote                      │  │    │
│  │  │ Controlador: PurchaseController.selectQuote               │  │    │
│  │  │ Servicio: quote.service.selectQuote                       │  │    │
│  │  │                                                           │  │    │
│  │  │ Datos: { quoteId }                                        │  │    │
│  │  │                                                           │  │    │
│  │  │ Regla de negocio:                                         │  │    │
│  │  │ ├── Si monto ≤ $50,000 MXN → APROBADO (sin autorización) │  │    │
│  │  │ └── Si monto > $50,000 MXN → EN_AUTORIZACION             │  │    │
│  │  │                                                           │  │    │
│  │  │ Auditoría: COTIZACION_SELECCIONADA                        │  │    │
│  │  │ Notificación: PENDIENTE → APROBADO o EN_AUTORIZACION     │  │    │
│  │  │                                                           │  │    │
│  │  │ FRONTEND: /dashboard/compras/[id]/ (modal                 │  │    │
│  │  │           "Seleccionar Cotización")                       │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  (No implementado actualmente: Comparativa automática con      │    │
│  │   ranking de proveedores, recomendación de mejor opción)        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  4. ASIGNAR APROBADORES (solo si EN_AUTORIZACION)               │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ GET /api/purchases/:id/potential-approvers                │  │    │
│  │  │ POST /api/purchases/:id/assign-approvers                  │  │    │
│  │  │ Controlador: getPotentialApprovers / assignApprovers      │  │    │
│  │  │ Servicio: approval.service                                │  │    │
│  │  │                                                           │  │    │
│  │  │ Aprobadores potenciales: Empleados con nivel jerárquico   │  │    │
│  │  │ GERENTE, DIRECTOR o PRESIDENTE + ADMIN/RH                │  │    │
│  │  │                                                           │  │    │
│  │  │ Auditoría: ENVIO_AUTORIZACION                             │  │    │
│  │  │                                                           │  │    │
│  │  │ FRONTEND: /dashboard/compras/[id]/ (modal                 │  │    │
│  │  │           "Asignar Aprobadores")                          │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  (No implementado actualmente: Flujo de aprobación             │    │
│  │   secuencial — que cada aprobador vea y apruebe en orden)      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  5. AUTORIZAR SOLICITUD (Admin/Compras)                         │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ POST /api/purchases/:id/authorize                         │  │    │
│  │  │ Controlador: PurchaseController.authorizeRequest          │  │    │
│  │  │ Servicio: purchase.service.authorizeRequest               │  │    │
│  │  │                                                           │  │    │
│  │  │ Requisito: Solicitud en estado EN_AUTORIZACION            │  │    │
│  │  │                                                           │  │    │
│  │  │ Acción:                                                   │  │    │
│  │  │ ├── Cambia estatus a APROBADO                             │  │    │
│  │  │ ├── Registra autorizadoPorId y fechaAutorizacion          │  │    │
│  │  │ └── Genera orden de compra automática (fire & forget)     │  │    │
│  │  │                                                           │  │    │
│  │  │ Auditoría: APROBACION                                     │  │    │
│  │  │ Notificación: EN_AUTORIZACION → APROBADO                  │  │    │
│  │  │                                                           │  │    │
│  │  │ FRONTEND: /dashboard/compras/[id]/ (botón "Autorizar")    │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  (No implementado actualmente: Notificación a los              │    │
│  │   aprobadores asignados para que autoricen individualmente)    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  6. GENERAR ORDEN DE COMPRA (Admin/Compras)                     │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ POST /api/purchases/:id/purchase-order                    │  │    │
│  │  │ Controlador: PurchaseController.generatePurchaseOrder     │  │    │
│  │  │ Servicio: purchase-order.service.generateOrder            │  │    │
│  │  │                                                           │  │    │
│  │  │ Datos: [{ productoServicio, cantidad, precioUnitario }]   │  │    │
│  │  │                                                           │  │    │
│  │  │ Acción:                                                   │  │    │
│  │  │ ├── Crea OC con formato OC-AAAA-000001                   │  │    │
│  │  │ ├── Calcula subtotal, IVA, total                         │  │    │
│  │  │ └── Genera PDF profesional                                │  │    │
│  │  │                                                           │  │    │
│  │  │ Auditoría: ORDEN_COMPRA_GENERADA                          │  │    │
│  │  │                                                           │  │    │
│  │  │ FRONTEND: /dashboard/compras/[id]/ (modal                 │  │    │
│  │  │           "Generar Orden de Compra")                      │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  (No implementado actualmente: Envío automático de la OC       │    │
│  │   al proveedor por email)                                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  7. MARCAR COMO ENTREGADO                                       │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ POST /api/purchases/:id/deliver                           │  │    │
│  │  │ Controlador: PurchaseController.markAsDelivered           │  │    │
│  │  │ Servicio: purchase.service.markAsDelivered                │  │    │
│  │  │                                                           │  │    │
│  │  │ Requisito: Solicitud en estado APROBADO                   │  │    │
│  │  │                                                           │  │    │
│  │  │ Acción: Cambia estatus a ENTREGADO                        │  │    │
│  │  │ Auditoría: ENTREGA                                        │  │    │
│  │  │ Notificación: APROBADO → ENTREGADO                        │  │    │
│  │  │                                                           │  │    │
│  │  │ FRONTEND: /dashboard/compras/[id]/ (botón                 │  │    │
│  │  │           "Marcar como Entregado")                        │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  (No implementado actualmente: Confirmación de recepción       │    │
│  │   por parte del solicitante)                                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  FLUJO ALTERNATIVO: CANCELACIÓN                                  │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │ POST /api/purchases/:id/cancel                            │  │    │
│  │  │ Controlador: PurchaseController.cancelRequest             │  │    │
│  │  │ Servicio: purchase.service.cancelRequest                  │  │    │
│  │  │                                                           │  │    │
│  │  │ Disponible desde cualquier estado excepto ENTREGADO       │  │    │
│  │  │ Puede cancelar: el solicitante o Admin/Compras            │  │    │
│  │  │                                                           │  │    │
│  │  │ Auditoría: CANCELACION                                    │  │    │
│  │  │ Notificación: [estado_anterior] → CANCELADO               │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Ciclo de vida de una solicitud de compra:**
```
NUEVO ──→ PENDIENTE ──→ EN_AUTORIZACION ──→ APROBADO ──→ ENTREGADO
  │           │               │                  │
  └───────────┴───────────────┴──────────────────┘
                       │
                  CANCELADO
```

**Reglas de negocio implementadas:**
| Regla | Implementación |
|-------|---------------|
| Umbral $50,000 MXN para autorización | ✅ `quote.service.selectQuote` |
| Máximo 3 cotizaciones por solicitud | ✅ `quote.service.uploadQuotes` |
| Selección única de cotización | ✅ `quote.service.selectQuote` |
| Cancelación no permitida desde ENTREGADO | ✅ `purchase.service.cancelRequest` |
| OC única por solicitud (1:1) | ✅ `purchase-order.service` |
| Generación automática de OC al autorizar | ✅ `purchase.service.authorizeRequest` |
| Comentarios con SSE en tiempo real | ✅ `purchase-comment.controller` + `sse-manager.service` |
| Auditoría completa por acción | ✅ `audit.service` |
| Notificaciones por email en cada transición | ✅ `status-notification.service` |

---

### 20.3 Flujo de Gestión de Empleados

**Archivos involucrados:**
- `backend/src/controllers/employee-core.controller.js` (1123 líneas)
- `backend/src/controllers/employee-org.controller.js` (423 líneas)
- `backend/src/controllers/employee-csv.controller.js`
- `backend/src/controllers/employee-photo.controller.js`
- `backend/src/controllers/employeeDocument.controller.js`
- `frontend/app/rh/empleados/` (gestión de empleados)
- `frontend/app/rh/empleados/[id]/` (ficha de empleado)

**Diagrama de flujo:**

```
## 22. INFRAESTRUCTURA Y DESPLIEGUE

### 22.1 Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          GITHUB (Código Fuente)                         │
│  https://github.com/narck25/Mini-ERP-Kram                               │
│  Rama: main (producción)                                                │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ Push / Webhook
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          COOLIFY (PaaS)                                  │
│  https://coolify.kramhub.site (o instancia propia)                      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Docker Build Pipeline                         │   │
│  │                                                                  │   │
│  │  ┌─────────────────────┐    ┌─────────────────────────────────┐  │   │
│  │  │  frontend/Dockerfile │    │  backend/Dockerfile             │  │   │
│  │  │  (Multi-stage)       │    │  (Multi-stage)                  │  │   │
│  │  │                      │    │                                 │  │   │
│  │  │  Stage 1: Builder    │    │  Stage 1: Builder               │  │   │
│  │  │  ├─ npm install      │    │  ├─ apt-get openssl            │  │   │
│  │  │  ├─ npm run build    │    │  ├─ npm install                │  │   │
│  │  │  │                   │    │  ├─ prisma generate            │  │   │
│  │  │  Stage 2: Runner     │    │  │                             │  │   │
│  │  │  ├─ node:20-alpine   │    │  Stage 2: Runner               │  │   │
│  │  │  ├─ nextjs user      │    │  ├─ node:20-slim               │  │   │
│  │  │  ├─ HEALTHCHECK      │    │  ├─ mkdir /app/uploads/*       │  │   │
│  │  │  └─ npm start        │    │  ├─ HEALTHCHECK                │  │   │
│  │  └─────────────────────┘    │  └─ CMD: resolve-migrations.js  │  │   │
│  │                             │     → prisma migrate deploy     │  │   │
│  │                             │     → node src/index.js         │  │   │
│  │                             └─────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    docker-compose.prod.yml                       │   │
│  │                                                                  │   │
│  │  Servicios:                                                      │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────────────┐   │   │
│  │  │  postgres   │  │  backend   │  │  frontend                │   │   │
│  │  │  15-alpine  │  │  Node 20   │  │  Next.js 14             │   │   │
│  │  │  :5432      │  │  :3001     │  │  :3000                  │   │   │
│  │  │  Volumen:   │  │  Volumen:  │  │  Sin puerto expuesto    │   │   │
│  │  │  postgres_  │  │  backend_  │  │  (Coolify maneja        │   │   │
│  │  │  data       │  │  uploads   │  │   enrutamiento)         │   │   │
│  │  └────────────┘  └────────────┘  └──────────────────────────┘   │   │
│  │                                                                  │   │
│  │  Red: kram-network (bridge)                                      │   │
│  │  Volúmenes: postgres_data, backend_uploads                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    TRAEFIK (Proxy Inverso)                       │   │
│  │                                                                  │   │
│  │  https://erp.kramhub.site  ───→  frontend:3000                   │   │
│  │  https://apierp.kramhub.site ───→ backend:3001                   │   │
│  │                                                                  │   │
│  │  Coolify configura Traefik automáticamente usando:               │   │
│  │  - SERVICE_FQDN_FRONTEND (erp.kramhub.site)                      │   │
│  │  - SERVICE_FQDN_BACKEND  (apierp.kramhub.site)                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          USUARIOS FINALES                               │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Empleados   │  │    RH        │  │   ADMIN      │                  │
│  │  (autoserv.) │  │  (gestión)   │  │  (sistema)   │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 22.2 Flujo de Despliegue (CI/CD)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  GIT     │     │ COOLIFY  │     │  DOCKER  │     │  TRAEFIK │
│  PUSH    │────→│ DETECTA  │────→│  BUILD   │────→│  ROUTE   │
│          │     │ WEBHOOK  │     │  & RUN   │     │  TRAFFIC │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

**Pasos detallados:**

1. **Desarrollador** hace `git push` a `main` (o rama configurada en Coolify)
2. **Coolify** detecta el push vía webhook de GitHub
3. **Coolify** ejecuta `docker-compose.prod.yml`:
   - Construye imagen `backend` usando `backend/Dockerfile`
   - Construye imagen `frontend` usando `frontend/Dockerfile`
   - Usa `BUILD_DATE` como ARG para invalidar caché de Docker
4. **PostgreSQL** se inicia primero (con healthcheck)
5. **Backend** espera a que PostgreSQL esté saludable (`condition: service_healthy`)
6. **Backend** ejecuta en orden:
   - `node scripts/resolve-migrations.js` — Resuelve migraciones fallidas
   - `npx prisma migrate deploy` — Aplica migraciones pendientes
   - `node src/index.js` — Inicia servidor Express
7. **Frontend** se inicia después del backend
8. **Traefik** (configurado por Coolify) enruta:
   - `erp.kramhub.site` → frontend:3000
   - `apierp.kramhub.site` → backend:3001

### 22.3 Flujo de Rollback

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ROLLBACK EN COOLIFY                             │
│                                                                         │
│  Opción 1: Rollback a versión anterior                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  1. Ir a Coolify → Deployment → History                         │   │
│  │  2. Seleccionar deploy anterior exitoso                         │   │
│  │  3. Click "Rollback"                                            │   │
│  │  4. Coolify reconstruye y despliega la imagen anterior          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Opción 2: Rollback manual (BD)                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  1. Identificar migración problemática:                         │   │
│  │     npx prisma migrate status                                   │   │
│  │                                                                 │   │
│  │  2. Si la migración ya se aplicó:                               │   │
│  │     npx prisma migrate diff --from-schema-datamodel             │   │
│  │                                                                 │   │
│  │  3. Restaurar BD desde backup (si está disponible):             │   │
│  │     pg_restore -U kramadmin -d kram_erp backup_2026XXXX.dump    │   │
│  │                                                                 │   │
│  │  4. Revertir migración manualmente:                             │   │
│  │     DELETE FROM _prisma_migrations WHERE migration_name = '...' │   │
│  │     (Solo si el SQL no se ejecutó completamente)                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Opción 3: Rollback de código (git)                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  1. git revert <commit_hash>                                   │   │
│  │  2. git push origin main                                        │   │
│  │  3. Coolify detecta el push y redeploya automáticamente         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 22.4 Variables de Entorno Críticas

#### Backend (`backend/.env.example` → `docker-compose.prod.yml`)

| Variable | Descripción | Valor Ejemplo | Crítica |
|----------|-------------|---------------|---------|
| `DATABASE_URL` | Conexión a PostgreSQL | `postgresql://user:pass@postgres:5432/kram_erp` | ✅ Sí |
| `JWT_SECRET` | Secreto para firmar tokens JWT | (generado aleatoriamente) | ✅ Sí |
| `JWT_EXPIRES_IN` | Duración del token JWT | `7d` | No |
| `PORT` | Puerto del servidor Express | `3001` | No |
| `NODE_ENV` | Entorno de ejecución | `production` | ✅ Sí |
| `CORS_ORIGIN` | Orígenes CORS permitidos | `https://erp.kramhub.site` | ✅ Sí |
| `TRUST_PROXY` | Nivel de trust para proxy inverso | `1` | ✅ Sí |
| `BASE_URL` | URL base del backend (emails) | `https://apierp.kramhub.site` | ✅ Sí |
| `SERVICE_FQDN_FRONTEND` | FQDN del frontend (Coolify) | `erp.kramhub.site` | No |
| `SERVICE_FQDN_BACKEND` | FQDN del backend (Coolify) | `apierp.kramhub.site` | No |
| `RESEND_API_KEY` | API Key de Resend (emails) | `re_...` | ✅ Sí |
| `RESEND_FROM_EMAIL` | Email remitente | `noreply@pid.kramhub.site` | No |
| `SEED_RESET` | Forzar reset de BD en deploy | `false` | ⚠️ Peligrosa |

#### Frontend (`frontend/Dockerfile` → `docker-compose.prod.yml`)

| Variable | Descripción | Valor Ejemplo | Crítica |
|----------|-------------|---------------|---------|
| `NEXT_PUBLIC_API_URL` | URL del backend (build-time) | `http://backend:3001` | ✅ Sí |
| `NEXT_PUBLIC_ALLOWED_ORIGIN` | Origen permitido para Server Actions | `erp.kramhub.site` | ✅ Sí |
| `NEXT_TELEMETRY_DISABLED` | Deshabilitar telemetría Next.js | `1` | No |

### 22.5 Configuración de Docker

#### `docker-compose.yml` (Desarrollo)

```yaml
Servicios:
  - postgres:15-alpine (puerto 5432 expuesto)
  - pgadmin4 (puerto 5050 expuesto, solo desarrollo)

Red: kram-network (bridge)
Volumen: postgres_data
```

> **Uso:** Ideal para desarrollo local. pgadmin4 permite inspeccionar la BD.

#### `docker-compose.prod.yml` (Producción — Coolify)

```yaml
Servicios:
  - postgres:15-alpine (sin puerto expuesto, healthcheck)
  - backend (Node 20, multi-stage build, healthcheck, límites de memoria)
  - frontend (Next.js 14, multi-stage build, healthcheck, límites de memoria)

Red: kram-network (bridge)
Volúmenes:
  - postgres_data (persistencia de BD)
  - backend_uploads (archivos subidos: fotos, CVs, documentos, cotizaciones)

Límites de recursos:
  - postgres: 256M-512M
  - backend: 256M-512M
  - frontend: 384M-768M
```

#### `backend/Dockerfile` — Multi-stage

| Stage | Base | Propósito |
|-------|------|-----------|
| **builder** | `node:20-slim` | Instalar dependencias, generar Prisma Client |
| **runner** | `node:20-slim` | Copiar solo lo necesario, configurar uploads, HEALTHCHECK |

**Detalles importantes:**
- `BUILD_DATE` como ARG para invalidar caché de Docker en Coolify
- `openssl` y `ca-certificates` instalados para Prisma + PostgreSQL
- Directorios de uploads creados con permisos 777:
  - `/app/uploads/cvs/`
  - `/app/uploads/employee-documents/`
  - `/app/uploads/psych-tests/`
  - `/app/uploads/purchase-quotes/`
  - `/app/uploads/temp/`
  - `/app/uploads/photos/`
- `HEALTHCHECK` cada 30s en `/api/health`
- `CMD` ejecuta: `resolve-migrations.js` → `prisma migrate deploy` → `node src/index.js`

#### `frontend/Dockerfile` — Multi-stage

| Stage | Base | Propósito |
|-------|------|-----------|
| **builder** | `node:20-slim` | Instalar dependencias (npm@11), build de Next.js |
| **runner** | `node:20-alpine` | Copiar `.next`, `node_modules`, usuario no-root |

**Detalles importantes:**
- `npm@11` instalado explícitamente para compatibilidad con `lockfileVersion 3`
- `sharp` compilado en stage builder para optimización de imágenes
- Usuario `nextjs` (UID 1001) no-root en runner
- `HEALTHCHECK` cada 30s en `http://localhost:3000/`
- Sin puertos expuestos en producción (Coolify/Traefik manejan enrutamiento)

### 22.6 Configuración de Next.js Proxy (`frontend/next.config.js`)

```js
Rewrites:
  /api/:path*  →  ${NEXT_PUBLIC_API_URL}/api/:path*
  /uploads/:path*  →  ${NEXT_PUBLIC_API_URL}/uploads/:path*

Server Actions:
  allowedOrigins: ['erp.kramhub.site', 'apierp.kramhub.site', 'localhost:3000']

Headers de seguridad:
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

### 22.7 Configuración de CORS (Backend)

```js
Orígenes permitidos (por defecto):
  - http://localhost:3000
  - http://localhost:3002
  - https://erp.kramhub.site
  - https://apierp.kramhub.site
  - http://apierp.kramhub.site

Configurable vía: CORS_ORIGIN (separar múltiples con coma)
```

### 22.8 Configuración de Proxy Trust

```js
TRUST_PROXY:
  0 = desactivado (no confiar en proxies)
  1 = confiar en primer proxy (Coolify/Traefik)
  2 = confiar en dos niveles (Traefik + Coolify proxy)
  'loopback' = solo loopback (default si no se configura)
```

### 22.9 Scripts de Inicialización

#### `backend/scripts/resolve-migrations.js`

**Propósito:** Resolver migraciones fallidas de Prisma que bloquean el deploy.

**Problema que resuelve:** Cuando una migración falla (ej: columna ya existe), Prisma bloquea futuras migraciones con error `P3009`.

**Solución:** Detecta migraciones fallidas en `_prisma_migrations` (donde `finished_at IS NULL`) y las marca como "aplicadas".

**Uso:** Se ejecuta automáticamente en el `CMD` del Dockerfile antes de `prisma migrate deploy`.

#### `backend/scripts/docker-entrypoint.sh`

**Propósito:** Script de entrada alternativo para el contenedor Docker.

**Funciones:**
1. Arreglar permisos de `/app/uploads` (chmod 777)
2. Ejecutar migraciones Prisma
3. Ejecutar seed de producción
4. Cambiar a usuario `nodeuser` y ejecutar la aplicación

> **Nota:** El `CMD` actual del Dockerfile usa un comando inline en lugar de este script. El script existe como alternativa.

### 22.10 Volúmenes Persistentes

| Volumen | Montaje | Propósito |
|---------|---------|-----------|
| `postgres_data` | `/var/lib/postgresql/data` | Datos de PostgreSQL |
| `backend_uploads` | `/app/uploads` | Archivos subidos (fotos, CVs, documentos, cotizaciones) |

### 22.11 Health Checks

| Servicio | Comando | Intervalo | Timeout | Periodo de gracia |
|----------|---------|-----------|---------|-------------------|
| **postgres** | `pg_isready -U kramadmin -d kram_erp` | 10s | 5s | 5 intentos |
| **backend** | `curl -f http://localhost:3001/api/health` | 30s | 5s | 15s |
| **frontend** | `wget --spider http://localhost:3000/` | 30s | 5s | 30s |

### 22.12 Límites de Recursos

| Servicio | Límite | Reserva |
|----------|--------|---------|
| **postgres** | 512 MB | 256 MB |
| **backend** | 512 MB | 256 MB |
| **frontend** | 768 MB | 384 MB |

### 22.13 Diagrama de Red

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         kram-network (bridge)                           │
│                                                                         │
│  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐        │
│  │   postgres   │◄──────│   backend    │◄──────│   frontend   │        │
│  │   :5432      │       │   :3001      │       │   :3000      │        │
│  └──────────────┘       └──────────────┘       └──────────────┘        │
│        │                      │                      │                  │
│        │                      │                      │                  │
│  postgres_data          backend_uploads              │                  │
│  (volumen)              (volumen)                    │                  │
│                                                      │                  │
│                                         Traefik (Coolify)              │
│                                              │                         │
│                                              ▼                         │
│                                   Internet (HTTPS)                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 22.14 Resumen de Infraestructura

| Componente | Tecnología | Versión | Propósito |
|-----------|-----------|---------|-----------|
| **Repositorio** | GitHub | — | Código fuente |
| **PaaS** | Coolify | — | Orquestación de contenedores, CI/CD |
| **Proxy Inverso** | Traefik | — | Enrutamiento HTTPS, SSL |
| **Contenedores** | Docker | — | Aislamiento de servicios |
| **Base de Datos** | PostgreSQL | 15 Alpine | Persistencia de datos |
| **Backend** | Node.js | 20 Slim | API REST |
| **Frontend** | Next.js | 14 (Alpine) | UI/UX |
| **Emails** | Resend | — | Notificaciones por correo |
| **Tareas Programadas** | node-cron | — | Cumpleaños, aniversarios (8:00 AM) |

---

*Fin de la sección — Infraestructura y Despliegue*
