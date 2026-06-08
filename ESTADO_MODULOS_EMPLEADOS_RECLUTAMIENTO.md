# Estado de Módulos: Empleados y Reclutamiento

**Fecha:** 8 de junio de 2026  
**Versión del Sistema:** ERP KRAM 3.0  
**Última Actualización:** Análisis completo de funcionalidades y arquitectura

---

## 📋 TABLA DE CONTENIDO

1. [Módulo de Empleados](#-módulo-de-empleados)
2. [Módulo de Reclutamiento](#-módulo-de-reclutamiento)
3. [Arquitectura y Flujo de Datos](#-arquitectura-y-flujo-de-datos)
4. [Integración entre Módulos](#-integración-entre-módulos)
5. [Etapas de Desarrollo por Módulo](#-etapas-de-desarrollo-por-módulo)
6. [Pruebas Realizadas](#-pruebas-realizadas)
7. [Mantenimiento y Archivos Clave](#-mantenimiento-y-archivos-clave)

---

## ✅ MÓDULO DE EMPLEADOS

### 🎯 Propósito
Gestión integral del ciclo de vida de los empleados: desde su registro inicial (con datos personales, laborales, legales, financieros, uniformes, beneficiarios y familiares), hasta su baja o eliminación del sistema. Incluye expediente digital con documentos, fotografía de perfil, historial salarial y jerarquía organizacional.

### 📂 Estructura de Archivos

#### Backend (Controladores)
| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `employee-core.controller.js` | CRUD principal, scoping por jerarquía, salary history | ~1123 |
| `employee-csv.controller.js` | Importación/exportación CSV masiva | ~500 |
| `employee-org.controller.js` | Departamentos, puestos, jefes directos, estadísticas | ~300 |
| `employee-photo.controller.js` | Subida/descarga de foto de perfil | ~150 |
| `employee.controller.js` | Controlador legacy (posible dead code) | - |
| `employeeDocument.controller.js` | CRUD de documentos digitales por empleado | ~300 |

#### Backend (Rutas)
| Ruta | Método | Middleware | Propósito |
|------|--------|-----------|-----------|
| `/employees` | GET | `requireModule('EMPLEADOS')` | Listar empleados (con paginación, filtros, scoping) |
| `/employees/me` | GET | `verifyToken` | Obtener empleado del usuario actual |
| `/employees/stats` | GET | `requireRHOrAdmin()` | Estadísticas de empleados |
| `/employees/:id` | GET | `requireRHOrAdmin()` | Detalle de empleado (con jerarquía) |
| `/employees` | POST | `requireRHOrAdmin()` | Crear empleado (con creación automática de usuario) |
| `/employees/:id` | PUT | `requireRHOrAdmin()` | Actualizar empleado (registra salary history) |
| `/employees/:id` | DELETE | `requireRHOrAdmin()` | Baja lógica (cambia estatus a Inactivo) |
| `/employees/:id/permanent` | DELETE | `requireRHOrAdmin()` | Eliminación física permanente |
| `/employees/:id/photo` | POST | `requireRHOrAdmin()` | Subir foto de perfil |
| `/employees/:id/salary-history` | GET | `requireRHOrAdmin()` | Historial de cambios salariales |
| `/employees/import` | POST | `requireRHOrAdmin()` | Importación masiva CSV |
| `/employees/export` | GET | `requireRHOrAdmin()` | Exportación CSV |
| `/employees/template` | GET | `requireRHOrAdmin()` | Descargar plantilla CSV |
| `/departments` | GET | `verifyToken` | Listar departamentos |
| `/departments/:id/job-positions` | GET | `verifyToken` | Puestos por departamento |
| `/managers` | GET | `verifyToken` | Jefes directos disponibles |

#### Frontend (Páginas)
| Ruta | Componente | Propósito |
|------|-----------|-----------|
| `/rh/empleados` | `page.js` | Lista de empleados con tabla, filtros, CRUD, importación |
| `/rh/empleados/[id]` | `page.js` | Perfil completo del empleado (14 secciones editables) |

#### Frontend (Componentes)
| Componente | Propósito |
|-----------|-----------|
| `EmployeeTable.js` | Tabla con paginación, búsqueda, filtros por estatus/departamento |
| `EmployeeForm.js` | Formulario de creación/edición con todos los campos |
| `EmployeeImport.js` | Modal de importación CSV con mapeo de columnas |

### 🔧 Funcionalidades Detalladas

#### 1. CRUD de Empleados
- **Creación**: 40+ campos organizados en secciones (personales, laborales, legales, financieros, uniformes, beneficiarios, familiares)
- **Lectura**: Vista de perfil con 14 cards informativas + foto + documentos
- **Actualización**: Edición por sección individual (8 modales separados)
- **Eliminación**: Baja lógica (cambia estatus) y eliminación física permanente
- **Campos calculados**: SD (salario diario = mensual/30), SDI (SD × factor de integración según antigüedad)

#### 2. Sistema de Jerarquía (NUEVO - v3.0)
- **Niveles**: PRESIDENTE, DIRECTOR, GERENTE, JEFE, COORDINADOR, ANALISTA, SUPERVISOR, AUX_ADMINISTRATIVO, OPERATIVO
- **Jefe directo**: Relación `reportaA` (auto-referencia en Employee)
- **Scoping de visibilidad**:
  - ADMIN/RH: Ven todos los empleados
  - PRESIDENTE/DIRECTOR/GERENTE/JEFE: Ven empleados de su mismo departamento
  - COORDINADOR/ANALISTA/SUPERVISOR/AUX_ADMINISTRATIVO: Ven su registro + subordinados directos
  - OPERATIVO: Solo ve su propio registro

#### 3. Historial de Sueldos (NUEVO - v3.0)
- **Modelo**: `SalaryHistory` con campos: salarioAnterior, salarioNuevo, sdAnterior, sdNuevo, sdiAnterior, sdiNuevo, factorUsado, tipoCambio (ALTA/INCREMENTO/DECREMENTO/AJUSTE), motivo
- **Registro automático**: Al crear empleado (ALTA) y al actualizar salario (INCREMENTO/DECREMENTO)
- **Visualización**: Modal con tabla completa en el perfil del empleado (solo ADMIN/RH)

#### 4. Importación/Exportación CSV
- **Plantilla**: Descargable con todas las columnas del sistema
- **Importación**: Mapeo inteligente de columnas (csvMapper.js), soporta nivelJerarquico y reportaA por clave
- **Exportación**: Genera CSV completo con datos actuales
- **Validaciones**: RFC/CURP/NSS duplicados, creación de departamentos/puestos automática

#### 5. Expediente Digital
- **Documentos**: Subida por tipo (INE, CURP, RFC, ComprobanteDomicilio, CertificadoEstudios, CartaRecomendacion, etc.)
- **Foto de perfil**: Subida con validación de tipo (imagen) y tamaño (máx 5MB)
- **Descarga**: Documentos descargables individualmente

#### 6. Integración con Usuarios
- **Creación automática**: Al crear empleado con `createUser=true`, se genera usuario con contraseña temporal (primeros 10 chars del RFC)
- **Asociación**: Relación 1:1 entre Employee y User

### 🧩 Modelo de Datos (Prisma)

```prisma
model Employee {
  id                    String             @id @default(cuid())
  // Datos Personales
  clave, nombres, apellidoPaterno, apellidoMaterno, fechaNacimiento,
  lugarNacimiento, estadoCivil, nacionalidad, sexo, nivelAcademico
  // Contacto
  telefonoCasa, telefonoMovil, correoElectronico, correoEmpresa,
  direccionCompleta, estado, cpFiscal
  // Legales
  rfc, curp, nss
  // Laborales
  fechaAlta, fechaBaja, estatus, sucursal, area, region, contrato, horario
  // Financieros
  salarioMensual, sd, sdi, clabe, numeroCuenta, banco
  // Jerarquía
  nivelJerarquico, reportaAId, jefeDirecto
  // Uniformes
  tallaCamisa, tallaPlayera, tallaPantalon, tallaZapatos
  // Beneficiarios
  nombreConyuge, beneficiario1, fechaNacBeneficiario1, porcentaje1,
  beneficiario2, fechaNacBeneficiario2, porcentaje2
  // Familiares
  esPadre, numeroHijos
  // Relaciones
  departamento, puesto, user, reportaA, subordinados[], documents[],
  jobVacancies[], salaryHistory[]
}
```

### 📊 Estado por Funcionalidad

| Funcionalidad | Estado | Prioridad |
|--------------|--------|-----------|
| CRUD básico de empleados | ✅ Completo | - |
| Perfil visual con 14 secciones | ✅ Completo | - |
| Edición por sección individual | ✅ Completo | - |
| Importación/Exportación CSV | ✅ Completo | - |
| Foto de perfil | ✅ Completo | - |
| Expediente digital (documentos) | ✅ Completo | - |
| Integración con usuarios del sistema | ✅ Completo | - |
| Sistema de jerarquía (nivelJerarquico) | ✅ Completo | - |
| Scoping de visibilidad por jerarquía | ✅ Completo | - |
| Historial de sueldos (SalaryHistory) | ✅ Completo | - |
| Cálculo automático SD/SDI | ✅ Completo | - |
| Baja lógica y eliminación permanente | ✅ Completo | - |
| Dashboard de RH con estadísticas | ✅ Completo | - |
| Notificaciones por email | ❌ Pendiente | Baja |
| Exportar perfil a PDF (Resumen RH) | ✅ Completo | - |
| Reportes exportables (PDF avanzados) | ❌ Pendiente | Media |
| Historial de cambios en todos los campos | ❌ Pendiente | Baja |

---

## ✅ MÓDULO DE RECLUTAMIENTO

### 🎯 Propósito
Gestión completa del proceso de reclutamiento: desde la solicitud de una nueva vacante por parte de un jefe de área, pasando por la aprobación de RH, la definición del perfil técnico y actividades, hasta la recepción de candidatos con CV, votación colaborativa y selección final.

### 📂 Estructura de Archivos

#### Backend (Controlador)
| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `recruitment.controller.js` | Controlador unificado (~1550 líneas) con toda la lógica de reclutamiento | ~1550 |

#### Backend (Rutas)
| Ruta | Método | Middleware | Propósito |
|------|--------|-----------|-----------|
| `/recruitment/vacancies` | POST | `requireModule('RECLUTAMIENTO')` | Crear solicitud de vacante (jefe de área) |
| `/recruitment/vacancies/direct` | POST | `requireRHOrAdmin()` | Crear vacante directa (RH/ADMIN, Fast-Track) |
| `/recruitment/my-vacancies` | GET | `requireModule('RECLUTAMIENTO')` | Mis solicitudes (jefe de área) |
| `/recruitment/vacancies` | GET | `requireModule('RECLUTAMIENTO')` | Todas las vacantes (con filtros y paginación) |
| `/recruitment/vacancies/stats` | GET | `requireModule('RECLUTAMIENTO')` | Estadísticas de vacantes |
| `/recruitment/vacancies/:id` | GET | `requireModule('RECLUTAMIENTO')` | Detalle de vacante |
| `/recruitment/vacancies/:id/approve` | PUT | `requireRHOrAdmin()` | Aprobar vacante |
| `/recruitment/vacancies/:id/close` | PUT | `requireRHOrAdmin()` | Cerrar vacante |
| `/recruitment/vacancies/:id/cancel` | PUT | `requireModule('RECLUTAMIENTO')` | Cancelar vacante (solicitante) |
| `/recruitment/vacancies/:id` | DELETE | `requireRHOrAdmin()` | Eliminar vacante (con archivos) |
| `/recruitment/vacancies/:id/technical-profile` | PUT | `requireModule('RECLUTAMIENTO')` | Actualizar perfil técnico |
| `/recruitment/vacancies/:id/activities` | POST | `requireModule('RECLUTAMIENTO')` | Crear actividades del puesto |
| `/recruitment/activities/:activityId` | PUT | `requireModule('RECLUTAMIENTO')` | Actualizar actividad (completar) |
| `/recruitment/vacancies/:id/comments` | GET | `requireModule('RECLUTAMIENTO')` | Obtener comentarios |
| `/recruitment/vacancies/:id/comments` | POST | `requireModule('RECLUTAMIENTO')` | Agregar comentario |
| `/recruitment/vacancies/:vacancy_id/candidates` | POST | `requireRHOrAdmin()` | Registrar candidato (con CV y pruebas) |
| `/recruitment/candidates/:candidate_id/observations` | PUT | `requireRHOrAdmin()` | Actualizar observaciones |
| `/recruitment/candidates/:candidate_id/documents` | PUT | `requireRHOrAdmin()` | Actualizar documentos del candidato |
| `/recruitment/candidates/:candidate_id/vote` | PUT | `requireModule('RECLUTAMIENTO')` | Votar por candidato (like/dislike) |
| `/recruitment/candidates/:candidate_id/select` | PUT | `requireModule('RECLUTAMIENTO')` | Seleccionar candidato final |
| `/recruitment/candidates/:candidate_id/cv` | GET | `requireModule('RECLUTAMIENTO')` | Descargar CV del candidato |

#### Frontend (Páginas)
| Ruta | Componente | Propósito |
|------|-----------|-----------|
| `/reclutamiento/solicitar-vacante` | `page.js` | Formulario de solicitud (jefes de área) |
| `/reclutamiento/mis-solicitudes` | `page.js` | Lista de mis solicitudes |
| `/reclutamiento/vacantes/[id]` | `page.js` | Detalle de vacante (con tabs: info, candidatos, perfil técnico) |
| `/reclutamiento/vacantes/[id]/perfil-tecnico` | `page.js` | Perfil técnico y actividades |
| `/rh/reclutamiento` | `page.js` | Panel RH: listado, filtros, aprobación, creación directa |
| `/rh/reclutamiento/crear-vacante` | `page.js` | Creación directa de vacante (RH/ADMIN) |

#### Frontend (Componentes)
| Componente | Propósito |
|-----------|-----------|
| `CandidatesTab.js` | Gestión de candidatos por vacante (subida, votación, selección) |

### 🔧 Funcionalidades Detalladas

#### 1. Flujo de Vacantes (2 Flujos)

**Flujo Estándar (Jefes de Área):**
```
Solicitada → Aprobada (RH) → Buscando → Cerrada
```
1. Jefe de área crea solicitud con: título, departamento, puesto, motivo, requerimientos técnicos
2. RH recibe notificación por email y aprueba/rechaza
3. Jefe de área define actividades del puesto y perfil técnico
4. RH registra candidatos con CV y pruebas psicométricas
5. Jefe de área vota (like/dislike) por cada candidato
6. Jefe de área selecciona candidato final → vacante se cierra

**Flujo Directo / Fast-Track (RH/ADMIN):**
```
Aprobada → Buscando → Cerrada
```
- RH crea vacante directamente en estado "Aprobada"
- Ideal para reposiciones urgentes o autorizadas previamente
- Incluye definición de actividades desde la creación

#### 2. Gestión de Candidatos
- **Registro**: Subida de CV (PDF) y pruebas psicométricas
- **Votación colaborativa**: Like/Dislike por jefe de área
- **Selección final**: El solicitante selecciona al candidato ganador
- **Documentos**: Actualización de CV y pruebas posterior al registro

#### 3. Perfil Técnico y Actividades
- **Perfil técnico**: Conocimientos requeridos, habilidades, experiencia
- **Actividades**: Lista de tareas del proceso de reclutamiento con prioridad y duración
- **Seguimiento**: Marcar actividades como completadas

#### 4. Comentarios y Colaboración
- **Comentarios automáticos**: El sistema genera comentarios en cada cambio de estado
- **Comentarios manuales**: Cualquier usuario autorizado puede agregar notas

#### 5. Notificaciones por Email
- **Solicitud creada**: Notifica a RH cuando un jefe de área solicita vacante
- **Vacante aprobada**: Notifica al solicitante cuando RH aprueba
- **Flujo directo**: Notifica al solicitante cuando RH crea vacante directa

### 🧩 Modelo de Datos (Prisma)

```prisma
model JobVacancy {
  id                      String           @id @default(cuid())
  titulo                  String?
  estatus                 VacancyStatus    @default(Solicitada)
  departamento_id         String?
  jobPositionId           String?
  solicitanteId           String
  numeroVacantes          Int              @default(1)
  motivoSolicitud         MotivoVacante
  tipoContratacion        TipoContratacion
  // Campos del formato físico digitalizado
  personaAReemplazarNombre, personaAReemplazarCargo,
  noAceptanReingresos, reqComputadoraEscritorio, reqLaptop,
  reqTelefonoMovil, reqExtensionTelefonica, ubicacionFisica,
  otrosRequerimientosFisicos, consideraPromocionInterna,
  candidatosInternosPropuestos, observacionesPromocion,
  conocimientosAdicionales, requerimientos_tecnicos
  // Aprobación
  fechaAutorizacion, autorizadoPorId, voBoPorId
  // Relaciones
  solicitante, autorizadoPor, voBoPor, departamento, jobPosition,
  candidatesRH[], JobActivity[], comments[]
}

model CandidateRH {
  id              String     @id @default(cuid())
  vacancyId       String
  nombre          String
  cv_url          String?
  psych_test_url  String?
  observaciones   String?
  votoSolicitante String?    // like / dislike / null
  estatus         String?    // En_Revision / Descartado / Seleccionado
  createdAt       DateTime   @default(now())
  vacancy         JobVacancy @relation(fields: [vacancyId], references: [id])
}

model JobActivity {
  id           String     @id @default(cuid())
  vacancyId    String
  activityType String
  description  String
  duration     String?
  priority     Int        @default(1)
  isCompleted  Boolean    @default(false)
  completedAt  DateTime?
  vacancy      JobVacancy @relation(fields: [vacancyId], references: [id])
}

model VacancyComment {
  id         String     @id @default(cuid())
  vacancy_id String
  user_id    String
  mensaje    String
  createdAt  DateTime   @default(now())
  vacancy    JobVacancy @relation(fields: [vacancy_id], references: [id])
  user       User       @relation(fields: [user_id], references: [id])
}
```

### 📊 Estado por Funcionalidad

| Funcionalidad | Estado | Prioridad |
|--------------|--------|-----------|
| Solicitud de vacante (jefe de área) | ✅ Completo | - |
| Creación directa (RH Fast-Track) | ✅ Completo | - |
| Aprobación de vacantes (RH) | ✅ Completo | - |
| Cierre de vacantes | ✅ Completo | - |
| Cancelación de vacantes (solicitante) | ✅ Completo | - |
| Eliminación de vacantes (RH) | ✅ Completo | - |
| Listado con filtros y paginación | ✅ Completo | - |
| Mis solicitudes (jefe de área) | ✅ Completo | - |
| Estadísticas de vacantes | ✅ Completo | - |
| Registro de candidatos con CV | ✅ Completo | - |
| Subida de pruebas psicométricas | ✅ Completo | - |
| Votación colaborativa (like/dislike) | ✅ Completo | - |
| Selección de candidato final | ✅ Completo | - |
| Perfil técnico por vacante | ✅ Completo | - |
| Actividades del proceso | ✅ Completo | - |
| Comentarios (automáticos + manuales) | ✅ Completo | - |
| Notificaciones por email | ✅ Completo | - |
| Descarga de CV | ✅ Completo | - |
| Dashboard RH con estadísticas | ✅ Completo | - |
| Reportes exportables (PDF) | ❌ Pendiente | Media |
| Entrevistas programadas (calendario) | ❌ Pendiente | Baja |
| Evaluaciones psicométricas en línea | ❌ Pendiente | Baja |
| Ofertas de trabajo públicas | ❌ Pendiente | Media |

---

## 🔗 ARQUITECTURA Y FLUJO DE DATOS

### Diagrama de Flujo del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  RH Dashboard │  │  Empleados   │  │   Reclutamiento      │   │
│  │  /rh/*        │  │  /rh/empleados│  │  /reclutamiento/*    │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │               │
│         └─────────────────┴──────────────────────┘               │
│                              │                                    │
│                    ┌─────────▼─────────┐                         │
│                    │   lib/api.js       │                         │
│                    │   (Axios Client)   │                         │
│                    └─────────┬─────────┘                         │
└──────────────────────────────┼───────────────────────────────────┘
                               │ HTTP /api/*
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                       BACKEND (Express)                           │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Auth Routes  │  │ Employee     │  │  Recruitment Routes  │   │
│  │  /auth/*      │  │ Routes       │  │  /recruitment/*      │   │
│  └──────┬───────┘  │ /employees/*  │  └──────────┬───────────┘   │
│         │          └──────┬───────┘             │               │
│         │                 │                      │               │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────────▼───────────┐   │
│  │ Auth          │  │ Employee     │  │ Recruitment          │   │
│  │ Middleware    │  │ Controllers  │  │ Controller           │   │
│  │ (JWT Verify)  │  │ (4 archivos) │  │ (1 archivo unificado)│   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │               │
│         └─────────────────┴──────────────────────┘               │
│                              │                                    │
│                    ┌─────────▼─────────┐                         │
│                    │   Prisma ORM      │                         │
│                    └─────────┬─────────┘                         │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   PostgreSQL DB     │
                    └─────────────────────┘
```

### Sistema de Permisos (3 Niveles)

| Nivel | Mecanismo | Ejemplo |
|-------|-----------|---------|
| **A - Módulos** | `accessibleModules?.includes('EMPLEADOS')` | Ocultar/mostrar menús, proteger rutas |
| **B - Scoping** | `nivelJerarquico`, `departamento_id` | Jefe ve solo su departamento |
| **C - Críticas** | `role === 'ADMIN'` | Solo ADMIN elimina permanentemente |

### Middleware de Protección

| Middleware | Propósito |
|-----------|-----------|
| `verifyToken` | Verifica JWT y carga usuario en `req.user` |
| `requireModule('MODULO')` | Verifica que el usuario tenga el módulo en `accessibleModules` |
| `requireRHOrAdmin()` | Verifica que el usuario sea RH o ADMIN (bypass total) |
| `requireRole(['ADMIN'])` | Solo para operaciones críticas del sistema |

---

## 🔗 INTEGRACIÓN ENTRE MÓDULOS

### 1. Relación Empleado-Vacante
- Cada vacante tiene un `solicitanteId` que referencia a un empleado
- Los empleados pueden solicitar vacantes (promoción interna)
- RH/ADMIN pueden crear vacantes en nombre de cualquier empleado
- Helper `getOrCreateSolicitante()`: busca empleado por `userId`, si no existe, busca empleado RH o crea uno temporal

### 2. Sistema de Permisos Unificado
- **Módulo EMPLEADOS**: Gestión completa de expedientes
- **Módulo RECLUTAMIENTO**: Proceso completo de contratación
- **Validación**: `user.accessibleModules.includes('MODULO')`
- **Protección de rutas**: `<ProtectedRoute requiredModule="MODULO">`

### 3. Base de Datos Integrada
```prisma
model Employee {
  id           String        @id @default(cuid())
  jobVacancies JobVacancy[]  // Relación con vacantes solicitadas
  salaryHistory SalaryHistory[]
  documents    EmployeeDocument[]
  reportaA     Employee?     // Auto-referencia para jerarquía
  subordinados Employee[]    // Auto-referencia inversa
}

model JobVacancy {
  id           String   @id @default(cuid())
  solicitanteId String
  solicitante   Employee @relation(fields: [solicitanteId], references: [id])
  candidatesRH CandidateRH[]
  JobActivity  JobActivity[]
  comments     VacancyComment[]
}
```

### 4. Flujo de Notificaciones
```
Jefe de Área crea solicitud → Email a RH → RH aprueba → Email al Jefe
RH crea vacante directa → Email al solicitante
```

---

## 📊 ETAPAS DE DESARROLLO POR MÓDULO

### Módulo de Empleados

#### 🟢 Etapa 1: Fundación (COMPLETADA)
- [x] Modelo Employee en Prisma con campos básicos
- [x] CRUD básico (crear, leer, actualizar, eliminar)
- [x] Integración con sistema de autenticación
- [x] Protección de rutas con middleware

#### 🟢 Etapa 2: Expediente Digital (COMPLETADA)
- [x] Perfil visual con todas las secciones
- [x] Edición por sección individual
- [x] Subida de documentos (PDF, imágenes)
- [x] Foto de perfil
- [x] Importación/Exportación CSV

#### 🟢 Etapa 3: Jerarquía y Scoping (COMPLETADA)
- [x] Niveles jerárquicos (9 niveles)
- [x] Relación jefe directo (reportaA)
- [x] Scoping de visibilidad por nivel jerárquico
- [x] Vista de subordinados en perfil

#### 🟢 Etapa 4: Historial Salarial (COMPLETADA)
- [x] Modelo SalaryHistory
- [x] Registro automático en creación y actualización
- [x] Visualización en perfil del empleado
- [x] Cálculo automático SD/SDI

#### 🟡 Etapa 5: Mejoras Futuras (PENDIENTE)
- [ ] Reportes exportables (PDF)
- [ ] Historial de cambios en todos los campos (auditoría)
- [ ] Notificaciones por email (cumpleaños, aniversarios)
- [ ] Módulo de Vacaciones/Incapacidades
- [ ] Módulo de Incidencias

---

### Módulo de Reclutamiento

#### 🟢 Etapa 1: Fundación (COMPLETADA)
- [x] Modelo JobVacancy en Prisma
- [x] Solicitud de vacante (jefe de área)
- [x] Aprobación por RH
- [x] Estados: Solicitada → Aprobada → Buscando → Cerrada

#### 🟢 Etapa 2: Gestión de Candidatos (COMPLETADA)
- [x] Registro de candidatos con CV
- [x] Subida de pruebas psicométricas
- [x] Votación colaborativa (like/dislike)
- [x] Selección de candidato final

#### 🟢 Etapa 3: Perfil Técnico y Actividades (COMPLETADA)
- [x] Definición de perfil técnico
- [x] Actividades del proceso de reclutamiento
- [x] Priorización y seguimiento
- [x] Completar actividades

#### 🟢 Etapa 4: Flujo Directo y Notificaciones (COMPLETADA)
- [x] Flujo Fast-Track (RH/ADMIN)
- [x] Notificaciones por email
- [x] Comentarios automáticos y manuales
- [x] Cancelación de vacantes

#### 🟡 Etapa 5: Mejoras Futuras (PENDIENTE)
- [ ] Reportes exportables (PDF)
- [ ] Programación de entrevistas (calendario)
- [ ] Evaluaciones psicométricas en línea
- [ ] Ofertas de trabajo públicas (portal externo)
- [ ] Integración con bolsas de trabajo (Indeed, LinkedIn)

---

## 🧪 PRUEBAS REALIZADAS

### Módulo Empleados
- [x] Creación de nuevo empleado con todos los campos
- [x] Actualización de datos por sección
- [x] Subida y descarga de documentos
- [x] Foto de perfil (subida, cambio, descarga)
- [x] Importación CSV masiva
- [x] Exportación CSV
- [x] Baja lógica (cambio de estatus)
- [x] Eliminación física permanente
- [x] Scoping de visibilidad por jerarquía
- [x] Historial de sueldos (creación y actualización)
- [x] Cálculo automático SD/SDI
- [x] Acceso controlado por permisos
- [x] Integración con usuarios del sistema

### Módulo Reclutamiento
- [x] Solicitud de vacante (jefe de área)
- [x] Solicitud de vacante (RH/ADMIN)
- [x] Flujo directo / Fast-Track
- [x] Aprobación de vacante
- [x] Cierre de vacante
- [x] Cancelación de vacante
- [x] Eliminación de vacante (con archivos)
- [x] Agregar candidato con CV
- [x] Subida de pruebas psicométricas
- [x] Votación (like/dislike)
- [x] Selección de candidato final
- [x] Definir perfil técnico
- [x] Agregar actividades al proceso
- [x] Completar actividades
- [x] Comentarios automáticos y manuales
- [x] Notificaciones por email
- [x] Descarga de CV
- [x] Cambios de estado (Solicitada → Aprobada → Buscando → Cerrada)
- [x] Filtros combinados (estatus, departamento, fechas, búsqueda)
- [x] Paginación en listados

---

## 🔧 MANTENIMIENTO Y ARCHIVOS CLAVE

### Archivos Clave del Sistema

#### Backend
| Archivo | Ruta | Propósito |
|---------|------|-----------|
| Schema Prisma | `backend/prisma/schema.prisma` | Modelo de datos completo (460 líneas) |
| Employee Core | `backend/src/controllers/employee-core.controller.js` | CRUD + scoping + salary history |
| Employee CSV | `backend/src/controllers/employee-csv.controller.js` | Importación/exportación masiva |
| Recruitment | `backend/src/controllers/recruitment.controller.js` | Lógica completa de reclutamiento |
| Employee Routes | `backend/src/routes/employee.routes.js` | 87 líneas de rutas protegidas |
| Recruitment Routes | `backend/src/routes/recruitment.routes.js` | 165 líneas de rutas protegidas |
| Auth Middleware | `backend/src/middlewares/auth.middleware.js` | verifyToken, requireModule, requireRHOrAdmin |
| Salary Calculator | `backend/src/utils/salaryCalculator.js` | Cálculo de SD/SDI con factor de integración |
| CSV Mapper | `backend/src/utils/csvMapper.js` | Mapeo de columnas CSV a modelo |
| Email Service | `backend/src/services/email.service.js` | Notificaciones por correo |

#### Frontend
| Archivo | Ruta | Propósito |
|---------|------|-----------|
| API Client | `frontend/lib/api.js` | Cliente Axios con todos los endpoints |
| Employee List | `frontend/app/rh/empleados/page.js` | Lista con tabla, filtros, CRUD |
| Employee Profile | `frontend/app/rh/empleados/[id]/page.js` | Perfil completo con 14 secciones |
| Employee Form | `frontend/components/EmployeeForm.js` | Formulario de creación/edición |
| Employee Table | `frontend/components/EmployeeTable.js` | Tabla con paginación y filtros |
| Employee Import | `frontend/components/EmployeeImport.js` | Modal de importación CSV |
| Recruitment RH | `frontend/app/rh/reclutamiento/page.js` | Panel RH de reclutamiento |
| Vacancy Detail | `frontend/app/reclutamiento/vacantes/[id]/page.js` | Detalle de vacante con tabs |
| Candidates Tab | `frontend/app/reclutamiento/vacantes/[id]/CandidatesTab.js` | Gestión de candidatos |
| Technical Profile | `frontend/app/reclutamiento/vacantes/[id]/perfil-tecnico/page.js` | Perfil técnico y actividades |
| My Requests | `frontend/app/reclutamiento/mis-solicitudes/page.js` | Mis solicitudes de vacante |
| Request Vacancy | `frontend/app/reclutamiento/solicitar-vacante/page.js` | Formulario de solicitud |

---

## 📝 NOTAS ADICIONALES

### Dead Code Identificado
- `backend/src/controllers/employee.controller.js` - Posible controlador legacy, no referenciado en rutas actuales
- `frontend/app/vacancies/[id]/activities/page.js` - Ruta antigua de actividades (reemplazada por perfil-tecnico)

### Dependencias Clave
- **Prisma ORM**: Conexión a PostgreSQL con modelos Employee, JobVacancy, CandidateRH, SalaryHistory
- **Next.js 14**: App Router con páginas server/client
- **Express.js**: API REST con middleware de autenticación JWT
- **Axios**: Cliente HTTP para comunicación Frontend-Backend
- **Multer**: Subida de archivos (fotos, CVs, documentos)
- **Nodemailer**: Envío de notificaciones por email
- **bcryptjs**: Hash de contraseñas

### Configuración de Docker
- **Frontend**: Dockerfile con build de Next.js
- **Backend**: Dockerfile con Node.js + Prisma
- **docker-compose.yml**: Orquestación de servicios
- **docker-compose.prod.yml**: Configuración de producción con HTTPS

---

*Documento generado automáticamente mediante análisis de código fuente.*  
*Para actualizar, ejecutar análisis completo de los archivos del proyecto.*
