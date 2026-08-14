# Módulo: Empleados

> **Última actualización:** 24/06/2026
> **Versión:** 1.0

---

## 1. Descripción General

El módulo de **Empleados** es el núcleo del sistema de gestión de personal del ERP KRAM. Permite administrar toda la información relacionada con los colaboradores de la organización, incluyendo datos personales, laborales, legales, financieros, documentación digital, historial salarial y más.

---

## 2. Funcionalidades Principales

| Funcionalidad | Descripción | Acceso |
|--------------|-------------|--------|
| **Listado de empleados** | Tabla paginada con filtros por estatus, departamento y búsqueda textual | EMPLEADOS |
| **Perfil de empleado** | Vista detallada con secciones editables individualmente | EMPLEADOS |
| **Creación de empleados** | Formulario multi-sección para alta de nuevos empleados | ADMIN / RH |
| **Edición de empleados** | Edición por secciones (personales, laborales, contacto, legales, financieros, uniformes, beneficiarios, familiares) | ADMIN / RH |
| **Baja de empleados** | Borrado lógico (cambio de estatus a Inactivo) | ADMIN / RH |
| **Eliminación permanente** | Borrado físico de la base de datos | ADMIN / RH |
| **Importación CSV** | Carga masiva de empleados desde archivo CSV con manejo de duplicados | ADMIN / RH |
| **Exportación CSV** | Descarga de listado completo de empleados | ADMIN / RH |
| **Archivo Digital** | Subida, descarga y eliminación de documentos por empleado | ADMIN / RH |
| **Foto de perfil** | Subida y descarga de foto del empleado | ADMIN / RH |
| **Historial de sueldos** | Registro automático de cambios salariales con SD/SDI | ADMIN / RH |
| **Exportación PDF** | Generación de resumen del empleado en PDF | ADMIN / RH |
| **Estructura organizacional** | Gestión de departamentos y puestos de trabajo | EMPLEADOS |

---

## 3. Modelo de Datos (Prisma)

### 3.1 Modelo `Employee`

**Tabla:** `employees`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | ID único |
| `userId` | String? (unique) | Relación con User |
| `clave` | String? (unique) | Clave interna del empleado |
| `nombres` | String? | Nombres del empleado |
| `nombre` | String? | Nombre compuesto (legacy) |
| `apellidoPaterno` | String? | Apellido paterno |
| `apellidoMaterno` | String? | Apellido materno |
| `rfc` | String (unique) | Registro Federal de Contribuyentes |
| `curp` | String (unique) | CURP |
| `nss` | String (unique) | Número de Seguridad Social |
| `fechaAlta` | DateTime (`fecha_ingreso`) | Fecha de ingreso |
| `fechaBaja` | DateTime? | Fecha de baja |
| `estatus` | EmployeeStatus | Activo / Inactivo |
| `salarioMensual` | Float? (`salary`) | Salario mensual |
| `sd` | Float? | Sueldo Diario |
| `sdi` | Float? | Sueldo Diario Integrado |
| `departamento_id` | String | Departamento al que pertenece |
| `puestoId` | String? | Puesto de trabajo |
| `nivelJerarquico` | NivelJerarquico? | Nivel en la jerarquía organizacional |
| `reportaAId` | String? | Jefe directo (auto-referencia) |
| `jefeDirecto` | String? | Nombre del jefe directo (legacy) |
| `fotoUrl` | String? | URL de la foto de perfil |
| `area` | String? | Área de trabajo |
| `region` | String? | Región |
| `sucursal` | String? | Sucursal |
| `contrato` | String? | Tipo de contrato |
| `horario` | String? | Horario laboral |
| `fechaNacimiento` | DateTime? | Fecha de nacimiento |
| `lugarNacimiento` | String? | Lugar de nacimiento |
| `estadoCivil` | String? | Estado civil |
| `nacionalidad` | String? | Nacionalidad |
| `sexo` | String? | Sexo |
| `nivelAcademico` | String? | Nivel académico |
| `correoElectronico` | String? | Correo personal |
| `correoEmpresa` | String? | Correo empresarial |
| `telefonoCasa` | String? | Teléfono de casa |
| `telefonoMovil` | String? | Teléfono móvil |
| `direccionCompleta` | String? | Dirección completa |
| `estado` | String? | Estado (dirección fiscal) |
| `cpFiscal` | String? | Código Postal Fiscal |
| `banco` | String? | Banco para nómina |
| `clabe` | String? | CLABE interbancaria |
| `numeroCuenta` | String? | Número de cuenta |
| `tallaCamisa` | String? | Talla de camisa |
| `tallaPlayera` | String? | Talla de playera |
| `tallaPantalon` | String? | Talla de pantalón |
| `tallaZapatos` | String? | Talla de zapatos |
| `nombreConyuge` | String? | Nombre del cónyuge |
| `beneficiario1` | String? | Nombre beneficiario 1 |
| `fechaNacBeneficiario1` | DateTime? | Fecha nacimiento beneficiario 1 |
| `porcentaje1` | Float? | Porcentaje beneficiario 1 |
| `beneficiario2` | String? | Nombre beneficiario 2 |
| `fechaNacBeneficiario2` | DateTime? | Fecha nacimiento beneficiario 2 |
| `porcentaje2` | Float? | Porcentaje beneficiario 2 |
| `esPadre` | Boolean | ¿Es padre/madre? |
| `numeroHijos` | Int | Número de hijos |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Última actualización |

### 3.2 Relaciones

| Relación | Modelo | Campo FK |
|----------|--------|----------|
| Departamento | `Department` | `departamento_id` |
| Usuario | `User` | `userId` |
| Jefe directo | `Employee` (self) | `reportaAId` |
| Subordinados | `Employee[]` (self) | `reportaAId` |
| Puesto | `JobPosition` | `puestoId` |
| Documentos | `EmployeeDocument[]` | — |
| Historial salarial | `SalaryHistory[]` | — |
| Vacantes solicitadas | `JobVacancy[]` | `solicitanteId` |
| Vacantes autorizadas | `JobVacancy[]` | `autorizadoPorId` |
| Compras solicitadas | `PurchaseRequest[]` | — |
| Solicitudes papelería | `StationeryRequest[]` | — |
| Entregas uniformes | `UniformDelivery[]` | — |

### 3.3 Enumeraciones

#### `EmployeeStatus`
```prisma
enum EmployeeStatus {
  Activo
  Inactivo
}
```

#### `NivelJerarquico`
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

---

## 4. API (Endpoints)

### 4.1 Empleados

| Método | Ruta | Descripción | Módulo Requerido |
|--------|------|-------------|------------------|
| `GET` | `/api/employees` | Listar empleados (con filtros y paginación) | EMPLEADOS |
| `GET` | `/api/employees/:id` | Obtener empleado por ID | EMPLEADOS |
| `POST` | `/api/employees` | Crear empleado | EMPLEADOS |
| `PUT` | `/api/employees/:id` | Actualizar empleado | EMPLEADOS |
| `DELETE` | `/api/employees/:id/permanent` | Eliminar permanentemente | EMPLEADOS |
| `GET` | `/api/employees/export` | Exportar empleados a CSV | EMPLEADOS |
| `GET` | `/api/employees/template` | Descargar plantilla CSV | EMPLEADOS |
| `POST` | `/api/employees/import` | Importar empleados desde CSV | EMPLEADOS |
| `POST` | `/api/employees/:id/photo` | Subir foto de perfil | EMPLEADOS |
| `GET` | `/api/employees/:id/salary-history` | Obtener historial de sueldos | EMPLEADOS |

### 4.2 Documentos de Empleados

| Método | Ruta | Descripción | Módulo Requerido |
|--------|------|-------------|------------------|
| `GET` | `/api/employee/:id/documents` | Listar documentos del empleado | EMPLEADOS |
| `POST` | `/api/employee/:id/documents` | Subir documento | EMPLEADOS |
| `GET` | `/api/employee-documents/:id/download` | Descargar documento | EMPLEADOS |
| `DELETE` | `/api/employee-documents/:id` | Eliminar documento | EMPLEADOS |
| `GET` | `/api/employee-documents/allowed-types` | Obtener tipos de documento permitidos | EMPLEADOS |

### 4.3 Departamentos

| Método | Ruta | Descripción | Módulo Requerido |
|--------|------|-------------|------------------|
| `GET` | `/api/departments` | Listar departamentos | EMPLEADOS |
| `POST` | `/api/departments` | Crear departamento | EMPLEADOS |
| `PUT` | `/api/departments/:id` | Actualizar departamento | EMPLEADOS |
| `DELETE` | `/api/departments/:id` | Eliminar departamento | EMPLEADOS |
| `GET` | `/api/departments/:id/job-positions` | Puestos por departamento | EMPLEADOS |

### 4.4 Puestos de Trabajo

| Método | Ruta | Descripción | Módulo Requerido |
|--------|------|-------------|------------------|
| `GET` | `/api/job-positions` | Listar puestos | EMPLEADOS |
| `POST` | `/api/job-positions` | Crear puesto | EMPLEADOS |
| `PUT` | `/api/job-positions/:id` | Actualizar puesto | EMPLEADOS |
| `DELETE` | `/api/job-positions/:id` | Eliminar puesto | EMPLEADOS |

### 4.5 Jefes (Managers)

| Método | Ruta | Descripción | Módulo Requerido |
|--------|------|-------------|------------------|
| `GET` | `/api/managers` | Listar jefes disponibles | EMPLEADOS |

---

## 5. Reglas de Visibilidad (Scoping - Nivel B)

El acceso a los datos de empleados sigue reglas de visibilidad basadas en el nivel jerárquico del usuario:

| Rol / Nivel | Visibilidad |
|-------------|-------------|
| **ADMIN** | Todos los empleados (sin restricciones) |
| **RH** | Todos los empleados (sin restricciones) |
| **PRESIDENTE / DIRECTOR / GERENTE** | Empleados de su mismo departamento |
| **JEFE / COORDINADOR / ANALISTA** | Empleados de su mismo departamento |
| **SUPERVISOR** | Su propio registro + empleados que le reportan directamente |
| **OPERATIVO** | Solo su propio registro |
| Sin empleado asociado | No ve ningún registro |

---

## 6. Componentes Frontend

### 6.1 Páginas

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/rh/empleados` | `frontend/app/rh/empleados/page.js` | Listado de empleados con tabla, filtros y acciones |
| `/rh/empleados/[id]` | `frontend/app/rh/empleados/[id]/page.js` | Perfil detallado del empleado con secciones editables |
| `/dashboard/organizacion` | `frontend/app/dashboard/organizacion/page.js` | Estructura organizacional (departamentos y puestos) |

### 6.2 Componentes

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| `EmployeeTable` | `frontend/components/EmployeeTable.js` | Tabla de empleados con filtros, búsqueda y paginación |
| `EmployeeForm` | `frontend/components/EmployeeForm.js` | Formulario multi-sección para crear/editar empleados |
| `EmployeeImport` | `frontend/components/EmployeeImport.js` | Modal de importación CSV con manejo de duplicados |

### 6.3 Funcionalidades del Perfil de Empleado

El perfil de empleado (`[id]/page.js`) incluye:

- **Hero Card**: Foto, nombre, puesto, estatus, clave, antigüedad
- **Secciones editables** (cada una con su propio modal):
  - Datos Personales (10 campos)
  - Datos Laborales (11 campos + SD/SDI auto-calculados)
  - Contacto y Dirección (7 campos)
  - Datos Legales (RFC, CURP, NSS)
  - Datos Financieros (banco, cuenta, CLABE)
  - Uniformes (4 tallas)
  - Beneficiarios (2 beneficiarios con porcentajes)
  - Datos Familiares (es padre/madre, número de hijos)
- **Historial de Sueldos**: Modal con tabla de cambios salariales
- **Archivo Digital**: Subida, descarga y eliminación de documentos
- **Exportación PDF**: Resumen completo del empleado

---

## 7. Cálculos Automáticos

### 7.1 SD (Sueldo Diario)
```
SD = Salario Mensual ÷ 30
```

### 7.2 SDI (Sueldo Diario Integrado)
```
SDI = SD × Factor de Integración
```

El factor de integración depende de la antigüedad del empleado (1-30 años), calculado según la Ley Federal del Trabajo:

| Antigüedad | Factor |
|------------|--------|
| 1 año | 1.0493 |
| 2 años | 1.0507 |
| 3 años | 1.0521 |
| 4 años | 1.0534 |
| 5 años | 1.0548 |
| 6-10 años | 1.0562 |
| 11-15 años | 1.0575 |
| 16-20 años | 1.0589 |
| 21-25 años | 1.0603 |
| 26-30 años | 1.0616 |

---

## 8. Importación CSV

### 8.1 Columnas del Archivo

El archivo CSV debe contener las siguientes columnas (en orden):

```
CLAVE, NOMBRES, APELLIDO PATERNO, APELLIDO MATERNO,
RFC, CURP, NSS,
FECHA NACIMIENTO, LUGAR NACIMIENTO, ESTADO CIVIL, NACIONALIDAD, SEXO, NIVEL ACADEMICO,
TELEFONO CASA, TELEFONO MOVIL, CORREO ELECTRONICO, CORREO EMPRESA,
DIRECCION COMPLETA, ESTADO, CP FISCAL,
FECHA ALTA, FECHA BAJA, ESTATUS, SUCURSAL, AREA, REGION, CONTRATO, HORARIO, DEPARTAMENTO, PUESTO,
SALARIO MENSUAL, CLABE, NUMERO CUENTA, BANCO,
JEFE DIRECTO, SD, SDI,
NIVEL JERARQUICO, JEFE DIRECTO (CLAVE),
TALLA CAMISA, TALLA PLAYERA, TALLA PANTALON, TALLA ZAPATOS, NOMBRE CONYUGE,
BENEFICIARIO 1, FECHA NAC BENEFICIARIO 1, PORCENTAJE 1,
BENEFICIARIO 2, FECHA NAC BENEFICIARIO 2, PORCENTAJE 2
```

### 8.2 Modos de Manejo de Duplicados

| Modo | Comportamiento |
|------|---------------|
| `error` | Si hay duplicados, no se importa nada (rollback total) |
| `skip` | Los nuevos se importan, los existentes se saltan |
| `update` | Los existentes se actualizan con los datos del CSV |

---

## 9. Seguridad

### 9.1 Nivel A - Control de Acceso

- Todas las páginas están protegidas con `ProtectedRoute requiredModule="EMPLEADOS"`
- Los endpoints del backend están protegidos con `requireModule('EMPLEADOS')`

### 9.2 Nivel B - Scoping de Datos

- Implementado en `employee.controller.js` con reglas de visibilidad por nivel jerárquico
- ADMIN y RH tienen bypass total (ven todos los empleados)

### 9.3 Nivel C - Operaciones Críticas

- Eliminación permanente: Solo ADMIN (verificado en backend)
- Las operaciones de escritura (crear, editar, importar) requieren ADMIN o RH en frontend

---

## 10. Dependencias del Módulo

| Dependencia | Tipo | Propósito |
|-------------|------|-----------|
| `Department` | Modelo | Departamento del empleado |
| `JobPosition` | Modelo | Puesto de trabajo |
| `User` | Modelo | Usuario asociado |
| `EmployeeDocument` | Modelo | Documentos digitales |
| `SalaryHistory` | Modelo | Historial de cambios salariales |
| `csv-parser` | Librería | Parseo de archivos CSV |
| `multer` | Librería | Subida de archivos (fotos, documentos) |
| `jspdf` / `html2canvas` | Librería | Exportación a PDF |

---

## 11. Notas Técnicas

- **Campos calculados**: SD y SDI se calculan en el frontend (no se almacenan cálculos redundantes en BD, aunque sí se persisten los valores calculados)
- **Fechas**: Se manejan con el patrón `split('T')[0]` para evitar el "bug del día anterior" por zonas horarias
- **Borrado lógico**: La baja de empleados cambia el estatus a `Inactivo`; la eliminación permanente es una operación separada y restringida
- **Importación CSV**: Usa `csv-parser` para parsear y `multer` para la subida del archivo
- **Foto de perfil**: Se sube mediante endpoint separado y se almacena la URL en el campo `fotoUrl`
