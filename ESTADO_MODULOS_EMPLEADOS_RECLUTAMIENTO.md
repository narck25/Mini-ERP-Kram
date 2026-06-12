# Estado de Módulos: Empleados, Reclutamiento y Compras

**Fecha:** 11 de junio de 2026  
**Versión del Sistema:** ERP KRAM 3.2  
**Última Actualización:** Órdenes de Compra (OC) con partidas editables, PDF profesional con Precio Unitario/Importe, cálculo automático de IVA, auditoría de OC

---

## 📋 TABLA DE CONTENIDO

1. [Módulo de Empleados](#-módulo-de-empleados)
2. [Módulo de Reclutamiento](#-módulo-de-reclutamiento)
3. [Módulo de Compras](#-módulo-de-compras)
4. [Módulo de Asistencia (Incidencias)](#-módulo-de-asistencia-incidencias)
5. [Módulo de Organización](#-módulo-de-organización)
6. [Módulo de Permisos y Accesos](#-módulo-de-permisos-y-accesos)
7. [Servicio de Notificaciones Automáticas](#-servicio-de-notificaciones-automáticas)
8. [Arquitectura y Flujo de Datos](#-arquitectura-y-flujo-de-datos)
9. [Integración entre Módulos](#-integración-entre-módulos)
10. [Etapas de Desarrollo por Módulo](#-etapas-de-desarrollo-por-módulo)
11. [Pruebas Realizadas](#-pruebas-realizadas)
12. [Mantenimiento y Archivos Clave](#-mantenimiento-y-archivos-clave)

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

#### 2. Sistema de Jerarquía (v3.0)
- **Niveles**: PRESIDENTE, DIRECTOR, GERENTE, JEFE, COORDINADOR, ANALISTA, SUPERVISOR, AUX_ADMINISTRATIVO, OPERATIVO
- **Jefe directo**: Relación `reportaA` (auto-referencia en Employee)
- **Scoping de visibilidad**:
  - ADMIN/RH: Ven todos los empleados
  - PRESIDENTE/DIRECTOR/GERENTE/JEFE: Ven empleados de su mismo departamento
  - COORDINADOR/ANALISTA/SUPERVISOR/AUX_ADMINISTRATIVO: Ven su registro + subordinados directos
  - OPERATIVO: Solo ve su propio registro

#### 3. Historial de Sueldos (v3.0)
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
| Notificaciones por email (cumpleaños/aniversarios) | ✅ Completo | - |
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

## ✅ MÓDULO DE COMPRAS (v3.2)

### 🎯 Propósito
Gestión completa del ciclo de solicitudes de compra: desde la creación de una solicitud por parte de un empleado, pasando por la cotización con proveedores, autorización gerencial, hasta la entrega final. Incluye sistema de aprobadores múltiples, comentarios tipo chat, selección de cotizaciones y **generación de Órdenes de Compra (OC) con PDF profesional**.

### 📂 Estructura de Archivos

#### Backend (Controladores)
| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `purchase.controller.js` | CRUD completo de solicitudes, cotizaciones, autorizaciones, OC | ~800+ |
| `purchase-comment.controller.js` | Comentarios tipo chat por solicitud | ~100 |

#### Backend (Servicios)
| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `purchases/purchase.service.js` | CRUD de solicitudes, estados, archivos | ~400 |
| `purchases/quote.service.js` | Cotizaciones (subida, selección, montos) | ~300 |
| `purchases/approval.service.js` | Aprobadores (asignación, potenciales) | ~200 |
| `purchases/comparison.service.js` | Comparativa de cotizaciones | ~100 |
| `purchases/purchase-notification.service.js` | Notificaciones por email | ~200 |
| `purchases/status-notification.service.js` | Notificaciones de cambio de estado (SSE) | ~100 |
| `purchases/purchase-order.service.js` | **Generación de Órdenes de Compra con PDF** | ~400 |
| `audit.service.js` | Sistema de auditoría genérico (ACCIONES, log, getHistory) | ~200 |
| `sse-manager.service.js` | Server-Sent Events para notificaciones en tiempo real | ~80 |
| `email.service.js` | Servicio de envío de correos (Nodemailer/Resend) | ~200 |

#### Backend (Rutas)
| Ruta | Método | Middleware | Propósito |
|------|--------|-----------|-----------|
| `/purchases` | POST | `requireModule('COMPRAS')` | Crear nueva solicitud de compra |
| `/purchases/my` | GET | `requireModule('COMPRAS')` | Mis solicitudes (usuario actual) |
| `/purchases` | GET | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | Todas las solicitudes (Admin/Compras) |
| `/purchases/details/:id` | GET | `requireModule('COMPRAS')` | Detalle de solicitud |
| `/purchases/:id/quotes` | POST | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | Subir cotizaciones |
| `/purchases/:id/select-quote` | POST | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | Seleccionar cotización |
| `/purchases/:id/authorize` | POST | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | Autorizar solicitud |
| `/purchases/:id/deliver` | POST | `requireModule('COMPRAS')` | Marcar como entregado |
| `/purchases/:id/potential-approvers` | GET | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | Obtener aprobadores potenciales |
| `/purchases/:id/assign-approvers` | POST | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | Asignar aprobadores |
| `/purchases/:id/send-authorization` | POST | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | Enviar autorización manual |
| `/purchases/:id/cancel` | POST | `requireModule('COMPRAS')` | Cancelar solicitud |
| `/purchases/:id/comparison` | GET | `requireModule('COMPRAS')` | Comparativa de cotizaciones |
| `/purchases/:id/comments` | GET | `requireModule('COMPRAS')` | Obtener comentarios |
| `/purchases/:id/comments` | POST | `requireModule('COMPRAS')` | Agregar comentario |
| `/purchases/:id/quotes/:quoteId/upload` | POST | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | Subir archivo a cotización |
| `/purchases/:id/quotes/upload-with-file` | POST | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | Subir cotización con archivo |
| `/purchases/:id/upload-quote-file` | POST | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | Subir archivo para nueva cotización |
| `/purchases/:id/quotes/:quoteId/amount` | PUT | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | Actualizar monto de cotización |
| `/purchases/:id/purchase-order` | **POST** | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | **Generar Orden de Compra** |
| `/purchases/:id/purchase-order` | **GET** | `requireModule('COMPRAS')` | **Obtener OC de una solicitud** |
| `/purchases/:id/purchase-order/regenerate` | **POST** | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | **Regenerar OC** |
| `/purchases/orders` | **GET** | `requireModule('COMPRAS')` + `requireRole(['ADMIN','COMPRAS'])` | **Listar todas las OC** |
| `/purchases/:id/audit-history` | GET | `requireModule('COMPRAS')` | Historial de auditoría de la solicitud |

#### Frontend (Páginas)
| Ruta | Componente | Propósito |
|------|-----------|-----------|
| `/compras/mis-solicitudes` | `page.js` | Lista de mis solicitudes de compra |
| `/compras/mis-solicitudes/[id]` | `page.js` | Detalle de solicitud de compra (usuario) |
| `/compras/nueva-solicitud` | `page.js` | Formulario de nueva solicitud |
| `/dashboard/compras` | `page.js` | Panel de gestión de compras (Admin/Compras) |
| `/dashboard/compras/[id]` | `page.js` | Detalle de solicitud (Admin/Compras) con botón **Generar OC** |

#### Frontend (Componentes)
| Componente | Propósito |
|-----------|-----------|
| `QuoteSelectionModal.js` | Modal de selección de cotizaciones |
| `SendAuthorizationModal.js` | Modal de envío de autorización |
| `PurchaseComments.js` | Sistema de comentarios tipo chat |
| `PurchaseOrderModal.js` | **Modal de generación de OC con partidas editables** |

### 🔧 Funcionalidades Detalladas

#### 1. Flujo de Solicitudes de Compra
```
NUEVO → PENDIENTE → EN_AUTORIZACION → APROBADO → ENTREGADO
                              ↓
                          CANCELADO
```

1. **Creación**: Empleado crea solicitud con productos/servicios, cantidades y justificación
2. **Cotización**: Admin/Compras sube cotizaciones de proveedores (con archivos PDF)
3. **Selección**: Admin/Compras selecciona la mejor cotización
4. **Autorización**: Se asignan aprobadores (gerentes) y se envía autorización por email
5. **Aprobación**: Los aprobadores reciben email y pueden aprobar/rechazar
6. **Entrega**: Se marca como entregado cuando el producto/servicio llega

#### 2. Órdenes de Compra (OC) — NUEVO en v3.2

**Flujo de Generación de OC:**
```
APROBADO → Generar OC (Admin/Compras) → OC generada con PDF
```

**Modal de Generación (`PurchaseOrderModal.js`):**
- **Partidas editables**: Tabla con columnas Producto/Servicio, Cantidad, **Precio Unitario**, **Importe**
- **Cálculo automático**: Subtotal = Σ(cantidad × precioUnitario), IVA configurable (16% por defecto), Total = Subtotal + IVA
- **Acciones por fila**: Agregar, duplicar, eliminar líneas
- **Validación**: Todas las partidas deben tener producto y precio unitario > 0
- **Proveedor**: Se toma de la cotización seleccionada (no editable)

**PDF Profesional (`purchase-order.service.js`):**
- **Encabezado**: Título "ORDEN DE COMPRA", número de OC destacado
- **Información**: Solicitante, departamento, proveedor, fechas, autorizado por
- **Tabla de partidas**: #, Producto/Servicio, Cantidad, **Precio Unitario**, **Importe** (con fondo alternado)
- **Desglose**: Subtotal, IVA (con tasa), Total (destacado en recuadro azul)
- **Footer**: Sello de autenticidad "DOCUMENTO AUTENTICADO", folio interno
- **Colores corporativos**: Azul oscuro (#1e40af), azul medio (#3b82f6), fondos claros

**Número de OC:** Formato `OC-AAAA-000001` (consecutivo por año)

**Regeneración:** Si se elimina la OC existente, se puede regenerar desde el mismo botón

#### 3. Sistema de Aprobadores Múltiples
- **Asignación**: Admin/Compras asigna aprobadores potenciales (empleados con nivel jerárquico GERENTE+)
- **Estados por aprobador**: PENDIENTE → APROBADO / RECHAZADO
- **Notificaciones**: Email a cada aprobador con enlace para aprobar/rechazar
- **Reenvío**: Posibilidad de reenviar autorización desde estado EN_AUTORIZACION

#### 4. Cotizaciones
- **Múltiples proveedores**: Varias cotizaciones por solicitud
- **Archivos adjuntos**: Subida de PDFs de cotizaciones
- **Selección**: Marcar una cotización como seleccionada
- **Comparativa**: Vista comparativa de todas las cotizaciones

#### 5. Comentarios (Tipo Chat)
- **Comentarios**: Sistema de comentarios tipo blog/chat por solicitud
- **Participantes**: Todos los usuarios con módulo COMPRAS pueden comentar
- **Timestamp**: Cada comentario registra usuario y fecha/hora

#### 6. Auditoría de Operaciones
- **Acciones auditables**: CREACION, COTIZACION_SUBIDA, MONTO_EDITADO, COTIZACION_SELECCIONADA, ENVIO_AUTORIZACION, APROBACION, ENTREGA, CANCELACION, **ORDEN_COMPRA_GENERADA**, **ORDEN_COMPRA_REGENERADA**
- **Registro**: IP, User-Agent, valor anterior, valor nuevo, usuario, timestamp
- **Consulta**: Endpoint `/purchases/:id/audit-history` con historial completo enriquecido con nombres de usuario

### 🧩 Modelo de Datos (Prisma)

```prisma
model PurchaseRequest {
  id              String         @id @default(cuid())
  folio           Int            @default(autoincrement())
  solicitanteId   String
  departamentoId  String
  estatus         PurchaseStatus @default(NUEVO)
  // NUEVO, PENDIENTE, EN_AUTORIZACION, APROBADO, ENTREGADO, CANCELADO
  justificacion   String?
  requiereAutorizacion Boolean   @default(false)
  autorizadoPorId      String?
  fechaAutorizacion    DateTime?
  // Relaciones
  solicitante     Employee       @relation("ComprasSolicitante")
  departamento    Department     @relation("ComprasDepartamento")
  items           PurchaseItem[]
  quotes          PurchaseQuote[]
  comments        PurchaseComment[]
  approvers       PurchaseApprover[]
  purchaseOrder   PurchaseOrder?  // Una OC por solicitud
}

model PurchaseOrder {
  id                String              @id @default(cuid())
  purchaseRequestId String              @unique
  numero            String              @unique // OC-AAAA-000001
  proveedor         String
  monto             Float
  subtotal          Float?              // Subtotal antes de IVA
  iva               Float?              // IVA calculado
  ivaRate           Float?              // Tasa de IVA (0.16)
  pdfUrl            String?             // Ruta al PDF generado
  createdAt         DateTime            @default(now())
  request           PurchaseRequest     @relation
  items             PurchaseOrderItem[]
}

model PurchaseOrderItem {
  id                String         @id @default(cuid())
  orderId           String
  productoServicio  String
  cantidad          Float
  descripcion       String?
  precioUnitario    Float?          // Precio unitario del producto
  importe           Float?          // cantidad × precioUnitario
  order             PurchaseOrder  @relation
}
```

### 📊 Estado por Funcionalidad

| Funcionalidad | Estado | Prioridad |
|--------------|--------|-----------|
| Creación de solicitud de compra | ✅ Completo | - |
| Listado de mis solicitudes | ✅ Completo | - |
| Panel de gestión (Admin/Compras) | ✅ Completo | - |
| Detalle de solicitud | ✅ Completo | - |
| Subida de cotizaciones | ✅ Completo | - |
| Selección de cotización | ✅ Completo | - |
| Comparativa de cotizaciones | ✅ Completo | - |
| Sistema de aprobadores múltiples | ✅ Completo | - |
| Asignación de aprobadores | ✅ Completo | - |
| Envío de autorización por email | ✅ Completo | - |
| Reenvío de autorización | ✅ Completo | - |
| Cancelación de solicitudes | ✅ Completo | - |
| Marcado como entregado | ✅ Completo | - |
| Comentarios tipo chat | ✅ Completo | - |
| Subida de archivos a cotizaciones | ✅ Completo | - |
| Actualización de montos | ✅ Completo | - |
| Notificaciones por email a aprobadores | ✅ Completo | - |
| **Generación de Órdenes de Compra** | ✅ **Completo** | - |
| **PDF profesional con Precio Unitario/Importe** | ✅ **Completo** | - |
| **Cálculo automático de IVA** | ✅ **Completo** | - |
| **Auditoría de OC (generación/regeneración)** | ✅ **Completo** | - |
| **Modal con partidas editables** | ✅ **Completo** | - |
| **Regeneración de OC** | ✅ **Completo** | - |
| Reportes exportables (PDF) | ❌ Pendiente | Media |
| Presupuesto por departamento | ❌ Pendiente | Baja |

---

## ✅ MÓDULO DE ASISTENCIA (INCIDENCIAS)

### 🎯 Propósito
Gestión de registros de asistencia mediante importación de archivos CSV desde checadores ZKTeco. Permite subir, consultar y filtrar registros de entrada/salida de empleados.

### 📂 Estructura de Archivos

#### Backend (Controlador)
| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `attendance.controller.js` | Importación CSV, consulta y filtrado de registros | ~200 |

#### Backend (Rutas)
| Ruta | Método | Middleware | Propósito |
|------|--------|-----------|-----------|
| `/attendance/upload` | POST | `requireModule('INCIDENCIAS')` | Subir archivo CSV de asistencia |
| `/attendance/records` | GET | `requireModule('INCIDENCIAS')` | Consultar registros con filtros (fecha, empleado) |

#### Frontend (Páginas)
| Ruta | Componente | Propósito |
|------|-----------|-----------|
| `/rh/asistencia` | `page.js` | Panel de asistencia con subida CSV y tabla de registros |

### 📊 Estado por Funcionalidad

| Funcionalidad | Estado | Prioridad |
|--------------|--------|-----------|
| Importación CSV desde checadores ZKTeco | ✅ Completo | - |
| Consulta de registros con filtros | ✅ Completo | - |
| Cálculo de horas trabajadas | ❌ Pendiente | Media |
| Reportes de asistencia (PDF) | ❌ Pendiente | Media |
| Notificaciones de incidencias | ❌ Pendiente | Baja |

---

## ✅ MÓDULO DE ORGANIZACIÓN

### 🎯 Propósito
Visualización del organigrama empresarial con jerarquías, departamentos y puestos. Permite navegar la estructura organizacional de forma interactiva.

### 📂 Estructura de Archivos

#### Backend
| Archivo | Propósito |
|---------|-----------|
| `employee-org.controller.js` | Departamentos, puestos, jefes directos, estadísticas |

#### Frontend (Páginas)
| Ruta | Componente | Propósito |
|------|-----------|-----------|
| `/dashboard/organizacion` | `page.js` | Organigrama interactivo con árbol jerárquico |

### 📊 Estado por Funcionalidad

| Funcionalidad | Estado | Prioridad |
|--------------|--------|-----------|
| Visualización de organigrama | ✅ Completo | - |
| Navegación por jerarquías | ✅ Completo | - |
| Filtros por departamento | ✅ Completo | - |
| Exportar organigrama | ❌ Pendiente | Baja |

---

## ✅ MÓDULO DE PERMISOS Y ACCESOS

### 🎯 Propósito
Administración centralizada de usuarios del sistema, roles y módulos asignados. Permite gestionar qué usuarios tienen acceso a qué módulos del ERP.

### 📂 Estructura de Archivos

#### Backend
| Archivo | Propósito |
|---------|-----------|
| `user.controller.js` | CRUD de usuarios, roles, módulos |
| `auth.controller.js` | Autenticación (login, registro, perfil) |

#### Backend (Rutas)
| Ruta | Método | Middleware | Propósito |
|------|--------|-----------|-----------|
| `/auth/register` | POST | `requireRole(['ADMIN'])` | Registrar nuevo usuario |
| `/auth/login` | POST | - | Iniciar sesión |
| `/auth/me` | GET | `verifyToken` | Obtener perfil del usuario actual |
| `/users` | GET | `requireRole(['ADMIN'])` | Listar todos los usuarios |
| `/users/:id` | PUT | `requireRole(['ADMIN'])` | Actualizar usuario (rol, módulos) |
| `/users/:id` | DELETE | `requireRole(['ADMIN'])` | Eliminar usuario |
| `/api/roles` | GET | `verifyToken` | Obtener roles disponibles (dinámico) |
| `/api/modules` | GET | `verifyToken` | Obtener módulos disponibles (dinámico) |

#### Frontend (Páginas)
| Ruta | Componente | Propósito |
|------|-----------|-----------|
| `/dashboard/usuarios` | `page.js` | Lista de usuarios con CRUD |
| `/dashboard/accesos` | `page.js` | Gestión de roles y módulos por usuario |
| `/login` | `page.js` | Página de inicio de sesión |
| `/register` | `page.js` | Registro de nuevos usuarios (solo ADMIN) |
| `/dashboard/profile` | `page.js` | Perfil del usuario actual |

#### Frontend (Componentes)
| Componente | Propósito |
|-----------|-----------|
| `RoleManager.js` | Gestor visual de roles y módulos asignados |

### 📊 Estado por Funcionalidad

| Funcionalidad | Estado | Prioridad |
|--------------|--------|-----------|
| Autenticación JWT | ✅ Completo | - |
| Registro de usuarios | ✅ Completo | - |
| CRUD de usuarios | ✅ Completo | - |
| Asignación de roles | ✅ Completo | - |
| Asignación de módulos (accessibleModules) | ✅ Completo | - |
| Roles dinámicos desde API | ✅ Completo | - |
| Módulos dinámicos desde API | ✅ Completo | - |
| Configuración centralizada (rolesConfig.js) | ✅ Completo | - |
| Protección de rutas (Frontend) | ✅ Completo | - |
| Middleware de módulos (Backend) | ✅ Completo | - |
| Bypass ADMIN/RH en scoping | ✅ Completo | - |
| Sistema de permisos escalable (3 niveles) | ✅ Completo | - |

---

## ✅ SERVICIO DE NOTIFICACIONES AUTOMÁTICAS

### 🎯 Propósito
Envío de notificaciones por email para eventos del sistema: cumpleaños, aniversarios laborales, cambios de estado en solicitudes de compra, autorizaciones pendientes, etc.

### 📂 Estructura de Archivos

#### Backend
| Archivo | Propósito |
|---------|-----------|
| `email.service.js` | Servicio de envío de correos (Nodemailer/Resend) |
| `purchases/purchase-notification.service.js` | Notificaciones del módulo de compras |
| `purchases/status-notification.service.js` | Notificaciones SSE de cambio de estado |
| `sse-manager.service.js` | Server-Sent Events para tiempo real |

### 📊 Estado por Funcionalidad

| Funcionalidad | Estado | Prioridad |
|--------------|--------|-----------|
| Notificaciones de cumpleaños | ✅ Completo | - |
| Notificaciones de aniversarios laborales | ✅ Completo | - |
| Notificaciones de solicitudes de compra | ✅ Completo | - |
| Notificaciones de autorización | ✅ Completo | - |
| Notificaciones de vacantes (reclutamiento) | ✅ Completo | - |
| SSE en tiempo real | ✅ Completo | - |

---

## 🧩 ARQUITECTURA Y FLUJO DE DATOS

### Backend (Express + Prisma + PostgreSQL)

```
backend/
├── src/
│   ├── index.js                    # Punto de entrada del servidor
│   ├── controllers/                # Controladores por módulo
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── employee-core.controller.js
│   │   ├── employee-csv.controller.js
│   │   ├── employee-org.controller.js
│   │   ├── employee-photo.controller.js
│   │   ├── employeeDocument.controller.js
│   │   ├── recruitment.controller.js
│   │   ├── purchase.controller.js
│   │   ├── purchase-comment.controller.js
│   │   └── attendance.controller.js
│   ├── routes/                     # Definición de rutas Express
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── employee.routes.js
│   │   ├── recruitment.routes.js
│   │   ├── purchase.routes.js
│   │   └── seed.routes.js
│   ├── services/                   # Lógica de negocio
│   │   ├── email.service.js
│   │   ├── audit.service.js
│   │   ├── sse-manager.service.js
│   │   └── purchases/
│   │       ├── purchase.service.js
│   │       ├── quote.service.js
│   │       ├── approval.service.js
│   │       ├── comparison.service.js
│   │       ├── purchase-notification.service.js
│   │       ├── status-notification.service.js
│   │       └── purchase-order.service.js
│   └── middlewares/                # Middleware de autenticación y permisos
│       ├── auth.middleware.js
│       └── upload.middleware.js
├── prisma/
│   ├── schema.prisma               # Modelo de datos completo
│   └── migrations/                 # Migraciones de base de datos
└── uploads/                        # Archivos subidos (PDFs, fotos, CVs)
```

### Frontend (Next.js 14 + App Router + Tailwind CSS)

```
frontend/
├── app/
│   ├── layout.js                   # Layout principal con AuthProvider
│   ├── page.js                     # Página de inicio (redirección)
│   ├── login/page.js               # Inicio de sesión
│   ├── register/page.js            # Registro de usuarios
│   ├── rh/
│   │   ├── empleados/
│   │   │   ├── page.js             # Lista de empleados
│   │   │   └── [id]/page.js        # Perfil de empleado
│   │   ├── reclutamiento/
│   │   │   ├── page.js             # Panel RH de reclutamiento
│   │   │   └── crear-vacante/page.js
│   │   └── asistencia/page.js      # Panel de asistencia
│   ├── reclutamiento/
│   │   ├── solicitar-vacante/page.js
│   │   ├── mis-solicitudes/page.js
│   │   └── vacantes/[id]/
│   │       ├── page.js             # Detalle de vacante
│   │       └── perfil-tecnico/page.js
│   ├── compras/
│   │   ├── mis-solicitudes/
│   │   │   ├── page.js
│   │   │   └── [id]/page.js
│   │   └── nueva-solicitud/page.js
│   └── dashboard/
│       ├── compras/
│       │   ├── page.js             # Panel de gestión de compras
│       │   └── [id]/page.js        # Detalle con Generar OC
│       ├── organizacion/page.js    # Organigrama
│       ├── usuarios/page.js        # Gestión de usuarios
│       ├── accesos/page.js         # Gestión de accesos
│       ├── mi-espacio/page.js      # Espacio personal
│       └── profile/page.js         # Perfil de usuario
├── components/
│   ├── DashboardLayout.js          # Layout del dashboard
│   ├── EmployeeTable.js            # Tabla de empleados
│   ├── EmployeeForm.js             # Formulario de empleados
│   ├── EmployeeImport.js           # Importación CSV
│   ├── CandidatesTab.js            # Gestión de candidatos
│   ├── QuoteSelectionModal.js      # Selección de cotizaciones
│   ├── SendAuthorizationModal.js   # Envío de autorización
│   ├── PurchaseComments.js         # Comentarios tipo chat
│   ├── PurchaseOrderModal.js       # Generación de OC
│   └── RoleManager.js              # Gestor de roles
├── contexts/
│   └── AuthContext.js              # Contexto de autenticación
├── hooks/
│   └── useAuth.js                  # Hook de autenticación
└── lib/
    ├── api.js                      # Cliente API (axios)
    ├── rolesConfig.js              # Configuración de roles
    └── employeePdfExport.js        # Exportación de perfil a PDF
```

---

## 🔗 INTEGRACIÓN ENTRE MÓDULOS

| Módulo A | Módulo B | Tipo de Integración |
|----------|----------|---------------------|
| Empleados | Usuarios | Creación automática de usuario al crear empleado |
| Empleados | Reclutamiento | Solicitante de vacante es un Employee |
| Empleados | Compras | Solicitante de compra es un Employee |
| Empleados | Organización | Jerarquía y departamentos compartidos |
| Empleados | Asistencia | Registros de asistencia vinculados a Employee |
| Reclutamiento | Notificaciones | Email a RH al crear vacante, email a solicitante al aprobar |
| Compras | Notificaciones | Email a aprobadores, notificaciones SSE de cambio de estado |
| Compras | Auditoría | Registro de todas las operaciones de compras |
| Compras | Empleados | Aprobadores son empleados con nivel GERENTE+ |
| Permisos | Todos | Sistema de módulos (accessibleModules) protege todos los endpoints |

---

## 📈 ETAPAS DE DESARROLLO POR MÓDULO

| Módulo | Etapa | % Completado |
|--------|-------|-------------|
| Empleados | ✅ Producción | 95% |
| Reclutamiento | ✅ Producción | 90% |
| Compras | ✅ Producción | 95% |
| Asistencia | ⚠️ Beta | 40% |
| Organización | ✅ Producción | 80% |
| Permisos y Accesos | ✅ Producción | 100% |
| Notificaciones | ✅ Producción | 85% |

---

## 🧪 PRUEBAS REALIZADAS

| Archivo de Prueba | Propósito |
|-------------------|-----------|
| `backend/test-recruitment.js` | Pruebas del flujo de reclutamiento |
| `backend/test_new_users.ps1` | Creación masiva de usuarios de prueba |
| `backend/test_login_http.js` | Prueba de autenticación |
| `backend/test_usuarios_modulos.js` | Prueba de asignación de módulos |
| `backend/check_request.js` | Verificación de solicitudes de compra |
| `test_admin_compras.json` | Datos de prueba para admin de compras |
| `test_compras_flow.js` | Prueba del flujo completo de compras |
| `test_admin.json` | Datos de prueba para admin |
| `test_login.json` | Datos de prueba para login |
| `check_user.js` | Verificación de usuarios |
| `test_usuarios_modulos.js` | Prueba de módulos por usuario |

---

## 🔧 MANTENIMIENTO Y ARCHIVOS CLAVE

### Archivos de Configuración
| Archivo | Propósito |
|---------|-----------|
| `.clinerules` | Reglas maestras del sistema (permisos, convenciones) |
| `ESTADO_MODULOS_EMPLEADOS_RECLUTAMIENTO.md` | Este documento - estado actual del proyecto |
| `backend/.env` | Variables de entorno (DB, JWT, email) |
| `backend/prisma/schema.prisma` | Modelo de datos completo |
| `frontend/lib/rolesConfig.js` | Configuración centralizada de roles |
| `frontend/lib/api.js` | Cliente API con interceptores |
| `docker-compose.yml` | Entorno de desarrollo |
| `docker-compose.prod.yml` | Entorno de producción |

### Comandos Útiles
```bash
# Iniciar backend
cd backend && npm run dev

# Iniciar frontend
cd frontend && npm run dev

# Migraciones Prisma
cd backend && npx prisma migrate dev --name nombre_migracion

# Regenerar Prisma Client
cd backend && npx prisma generate

# Seed de datos
cd backend && npx prisma db seed

# Docker (producción)
docker-compose -f docker-compose.prod.yml up -d
```

---

**Documento generado el:** 11 de junio de 2026  
**Versión:** 3.2 — Órdenes de Compra con partidas editables y PDF profesional  
**Próxima actualización:** Pendiente de nuevos desarrollos
