# MANUAL DE USUARIO - MÓDULOS DE RH
## ERP KRAM v3.0

---

# ÍNDICE

1. [Estructura Organizacional (Jerarquías)](#1-estructura-organizacional-jerarquías)
2. [Módulo de Empleados](#2-módulo-de-empleados)
3. [Módulo de Reclutamiento](#3-módulo-de-reclutamiento)
4. [Dashboard RH](#4-dashboard-rh)
5. [Gestión de Usuarios y Accesos](#5-gestión-de-usuarios-y-accesos)
6. [Notificaciones Automáticas](#6-notificaciones-automáticas)
7. [Solución de Problemas Comunes](#7-solución-de-problemas-comunes)

---

# 1. ESTRUCTURA ORGANIZACIONAL (JERARQUÍAS)

## 1.1 Conceptos Clave

El ERP maneja una jerarquía organizacional de 3 niveles:

| Nivel | Nombre | Descripción |
|-------|--------|-------------|
| **1** | **Departamento** | Área general (Ej: Sistemas, RH, Producción) |
| **2** | **Puesto** | Cargo dentro del departamento (Ej: Programador, Analista RH) |
| **3** | **Empleado** | Persona asignada a un puesto |

## 1.2 Cómo crear la estructura

### Paso 1: Crear Departamentos
1. Ve a **Dashboard → Organización**
2. En la sección "Departamentos", haz clic en **"Agregar Departamento"**
3. Completa:
   - **Nombre**: Ej. "Sistemas", "Recursos Humanos", "Producción"
   - **Descripción**: Opcional
4. Guarda

### Paso 2: Crear Puestos
1. En la misma página de **Organización**, sección "Puestos"
2. Haz clic en **"Agregar Puesto"**
3. Completa:
   - **Nombre**: Ej. "Programador Senior", "Analista RH", "Operador"
   - **Departamento**: Selecciona el departamento al que pertenece
4. Guarda

### Paso 3: Dar de alta Empleados
Ver sección [2. Módulo de Empleados](#2-módulo-de-empleados)

---

# 2. MÓDULO DE EMPLEADOS

## 2.1 Acceso
- **Ruta**: `RH → Empleados`
- **Permisos**: Requiere módulo `EMPLEADOS` o ser ADMIN/RH

## 2.2 Dar de Alta un Empleado

### Desde el formulario individual:

1. Ve a **RH → Empleados**
2. Haz clic en **"Agregar Empleado"**
3. Completa los campos obligatorios:

**Datos Personales:**
| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| CURP | ✅ Sí | Clave Única de Registro de Población |
| RFC | ✅ Sí | Registro Federal de Contribuyentes |
| NSS | ✅ Sí | Número de Seguridad Social |
| Nombres | ✅ Sí | Nombre(s) del empleado |
| Apellido Paterno | ✅ Sí | Primer apellido |
| Apellido Materno | No | Segundo apellido |
| Correo Electrónico | No | Email personal |
| Correo Empresa | No | Email corporativo |
| Teléfono Móvil | No | Celular |
| Fecha de Nacimiento | No | Fecha de nacimiento |
| Sexo | No | Masculino / Femenino |
| Estado Civil | No | Soltero, Casado, etc. |
| Lugar de Nacimiento | No | Ciudad/Estado de nacimiento |
| Nacionalidad | No | Nacionalidad |

**Datos Laborales:**
| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Departamento | ✅ Sí | Seleccionar de la lista |
| Puesto | No | Seleccionar de la lista |
| Fecha de Alta | ✅ Sí | Fecha de ingreso |
| Clave | No | Clave interna del empleado |
| Salario Mensual | No | Salario bruto mensual |
| Tipo de Contrato | No | Base, Confianza, Temporal, etc. |
| Horario | No | Horario laboral |
| Área | No | Área específica |
| Región | No | Región geográfica |
| Sucursal | No | Sucursal asignada |

**Datos de Pago:**
| Campo | Descripción |
|-------|-------------|
| Banco | Nombre del banco |
| CLABE | Clabe interbancaria |
| Número de Cuenta | Número de cuenta |
| Beneficiario 1 | Nombre del beneficiario |
| % Beneficiario 1 | Porcentaje |
| Beneficiario 2 | Nombre del beneficiario |
| % Beneficiario 2 | Porcentaje |

**Datos Fiscales:**
| Campo | Descripción |
|-------|-------------|
| CP Fiscal | Código postal fiscal |
| Dirección Completa | Domicilio completo |
| Estado | Estado de residencia |

**Datos Adicionales:**
| Campo | Descripción |
|-------|-------------|
| Nivel Académico | Máximo nivel de estudios |
| Nombre del Cónyuge | Nombre del esposo(a) |
| Fecha Nac. Beneficiario 1 | Fecha de nacimiento |
| Fecha Nac. Beneficiario 2 | Fecha de nacimiento |
| Talla Camisa | Talla de camisa |
| Talla Playera | Talla de playera |
| Talla Pantalón | Talla de pantalón |
| Talla Zapatos | Talla de zapatos |

4. Haz clic en **"Guardar"**

### Desde archivo CSV (Importación masiva):

1. Ve a **RH → Empleados**
2. Haz clic en **"Importar CSV"**
3. Selecciona el archivo CSV con el formato adecuado
4. El sistema validará y creará los empleados automáticamente

**Formato del CSV:**
```
curp,rfc,nss,nombres,apellidoPaterno,apellidoMaterno,departamento_id,fechaAlta,...
```

## 2.3 Ver/Editar un Empleado

1. Ve a **RH → Empleados**
2. En la tabla, busca al empleado
3. Haz clic en su nombre o en el botón **"Ver"**
4. En la página de detalle puedes:
   - Ver toda la información del empleado
   - Editar campos
   - Ver documentos asociados
   - Ver historial salarial
   - Exportar a PDF

## 2.4 Exportar a PDF

1. En la página de detalle del empleado
2. Haz clic en **"Exportar PDF"**
3. Se descargará un PDF con:
   - Datos personales
   - Datos laborales
   - Datos de pago
   - Datos fiscales

## 2.5 Jerarquía y Scoping de Datos

**¿Quién ve qué empleados?**

| Rol | Ve todos los empleados | Ve solo su departamento |
|-----|------------------------|------------------------|
| ADMIN | ✅ Sí | — |
| RH | ✅ Sí | — |
| SISTEMAS | ❌ No | ✅ Sí (departamento Sistemas) |
| COMPRAS | ❌ No | ✅ Sí (departamento Compras) |
| PRODUCCION | ❌ No | ✅ Sí (departamento Producción) |
| EMPLEADO_BASICO | ❌ No | ❌ Solo se ve a sí mismo |

---

# 3. MÓDULO DE RECLUTAMIENTO

## 3.1 Acceso
- **Ruta**: `RH → Reclutamiento`
- **Permisos**: Requiere módulo `RECLUTAMIENTO` o ser ADMIN/RH

## 3.2 Crear una Vacante

1. Ve a **RH → Reclutamiento**
2. Haz clic en **"Nueva Vacante"**
3. Completa los campos:

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Título | ✅ Sí | Nombre del puesto vacante |
| Departamento | ✅ Sí | Departamento al que pertenece |
| Descripción | ✅ Sí | Descripción del puesto |
| Requisitos | ✅ Sí | Requisitos mínimos |
| Salario Ofrecido | No | Rango salarial |
| Tipo de Contrato | No | Tipo de contratación |
| Número de Vacantes | No | Cantidad de plazas |
| Fecha Límite | No | Fecha de cierre de la vacante |

4. Haz clic en **"Crear Vacante"**

## 3.3 Gestionar Candidatos

### Registrar un candidato:
1. Abre la vacante
2. En la sección "Candidatos", haz clic en **"Agregar Candidato"**
3. Completa:
   - Nombre completo
   - Email
   - Teléfono
   - Archivos (CV, documentos)

### Etapas del candidato:
| Etapa | Descripción |
|-------|-------------|
| **NUEVO** | Acaba de registrarse |
| **REVISADO** | RH revisó su perfil |
| **PRESELECCIONADO** | Pasa a siguiente fase |
| **ENTREVISTA** | En proceso de entrevista |
| **SELECCIONADO** | Aprobado para contratación |
| **RECHAZADO** | No continúa en el proceso |

### Cambiar etapa:
1. En la lista de candidatos, usa el menú de acciones
2. Selecciona la nueva etapa
3. El sistema actualiza automáticamente

## 3.4 Perfil Técnico (Evaluaciones)

Para vacantes que requieren evaluación técnica:

1. Abre la vacante
2. Ve a la pestaña **"Perfil Técnico"**
3. Agrega las evaluaciones necesarias
4. Asigna resultados a cada candidato

## 3.5 Actividades de Vacante

1. Abre la vacante
2. Ve a la pestaña **"Actividades"**
3. Puedes:
   - Ver el historial de actividades
   - Agregar notas
   - Programar entrevistas
   - Dar seguimiento

---

# 4. DASHBOARD RH

## 4.1 Acceso
- **Ruta**: `RH → Dashboard Completo`
- **Permisos**: Solo ADMIN y RH

## 4.2 Widgets Disponibles

### 1. Resumen de Empleados
- Total de empleados
- Empleados activos
- Empleados de vacaciones
- Empleados de baja/incapacidad

### 2. Resumen de Vacantes
- Total de vacantes
- Vacantes abiertas
- Vacantes en proceso
- Vacantes cerradas

### 3. Reclutamiento
- Total de candidatos
- Candidatos este mes
- Candidatos pendientes

### 4. Contrataciones Recientes
- Lista de los últimos empleados dados de alta
- Muestra: nombre, puesto, departamento, fecha

### 5. Próximos Eventos (Cumpleaños y Aniversarios)
- Muestra los cumpleaños de los próximos 30 días
- Muestra los aniversarios laborales de los próximos 30 días
- **Botón "📧 Enviar correos ahora"**: Envía manualmente las felicitaciones del día de hoy

### 6. Gráficas
- Empleados por departamento (gráfica de barras)
- Distribución por tipo de contrato (gráfica de pastel)

## 4.3 Actualizar Datos
- Los datos se cargan automáticamente al entrar
- Usa el botón **"Actualizar"** para recargar

---

# 5. GESTIÓN DE USUARIOS Y ACCESOS

## 5.1 Acceso
- **Ruta**: `Dashboard → Usuarios` (solo ADMIN)
- **Ruta**: `Dashboard → Accesos` (solo ADMIN)

## 5.2 Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| **ADMIN** | Acceso total al sistema. Puede gestionar usuarios y permisos |
| **RH** | Acceso completo a módulos de RH. Ve todos los empleados |
| **SISTEMAS** | Jefe de Sistemas. Ve solo empleados de su departamento |
| **COMPRAS** | Jefe de Compras. Ve solo empleados de su departamento |
| **PRODUCCION** | Jefe de Producción. Ve solo empleados de su departamento |
| **EMPLEADO_BASICO** | Usuario regular. Solo ve su propia información |

## 5.3 Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| `EMPLEADOS` | Gestión de empleados y expedientes |
| `RECLUTAMIENTO` | Gestión de vacantes y candidatos |
| `VACACIONES` | Solicitud y aprobación de vacaciones |
| `INCIDENCIAS` | Reporte y seguimiento de incidencias |
| `CONFIGURACION` | Configuración del sistema |
| `REPORTES` | Generación de reportes y estadísticas |
| `DASHBOARD` | Panel principal (siempre activo) |

## 5.4 Crear un Usuario

1. Ve a **Dashboard → Usuarios**
2. Haz clic en **"Nuevo Usuario"**
3. Completa:
   - **Nombre**: Nombre completo
   - **Email**: Correo electrónico (será el login)
   - **Contraseña**: Temporal (el usuario la cambiará después)
   - **Rol**: Selecciona el rol del sistema
4. Guarda

## 5.5 Asignar Módulos a un Usuario

1. Ve a **Dashboard → Accesos**
2. Busca al usuario en la tabla
3. En la columna "Módulos", haz clic en **"Editar"**
4. Selecciona los módulos a los que tendrá acceso
5. Guarda

**Regla importante:** Los roles ADMIN y RH tienen acceso a TODOS los módulos automáticamente. No necesitas asignarles módulos individuales.

## 5.6 Vincular Usuario con Empleado

Para que un usuario pueda ver datos de empleados (scoping), debe estar vinculado a un empleado:

1. Ve a **RH → Empleados**
2. Busca al empleado
3. En la página de detalle, busca el campo **"Usuario"**
4. Selecciona el usuario correspondiente
5. Guarda

**¿Por qué es importante?** Sin esta vinculación, el sistema no puede determinar qué empleados debe ver el usuario (scoping por departamento/jerarquía).

---

# 6. NOTIFICACIONES AUTOMÁTICAS

## 6.1 ¿Qué notifica el sistema?

| Tipo | ¿Cuándo? | ¿A quién? |
|------|-----------|-----------|
| 🎂 **Cumpleaños** | Diario a las 8:00 AM | Al empleado que cumple años |
| 🎊 **Aniversario laboral** | Diario a las 8:00 AM | Al empleado que cumple aniversario |
| 📅 **Resumen RH** | Diario a las 8:00 AM | A todos los usuarios con rol RH y ADMIN |

## 6.2 Envío Manual

Si la automatización falla, puedes enviar las notificaciones manualmente:

1. Ve a **RH → Dashboard Completo**
2. En el widget "Próximos Eventos", haz clic en **"📧 Enviar correos ahora"**
3. El sistema enviará las felicitaciones del día de hoy
4. Verás un mensaje de confirmación con el resultado

## 6.3 Configurar Email (Resend)

Para que funcione el envío de correos, el backend necesita la API Key de Resend:

1. En Coolify, ve a las variables de entorno del backend
2. Agrega:
   - `RESEND_API_KEY`: Tu API key de Resend
   - `RESEND_FROM_EMAIL`: Email remitente (default: `noreply@pid.kramhub.site`)
3. Redeploy el backend

---

# 7. SOLUCIÓN DE PROBLEMAS COMUNES

## 7.1 No puedo ver empleados

**Causa posible:** El usuario no está vinculado a un empleado o no tiene el módulo `EMPLEADOS`.

**Solución:**
1. Verifica que el usuario tenga el módulo `EMPLEADOS` en Dashboard → Accesos
2. Verifica que el usuario esté vinculado a un empleado en RH → Empleados → [empleado] → Usuario

## 7.2 No aparecen los departamentos/puestos

**Causa posible:** No se han creado en la sección de Organización.

**Solución:**
1. Ve a Dashboard → Organización
2. Crea los departamentos necesarios
3. Crea los puestos necesarios

## 7.3 El botón "Enviar correos" no envía nada

**Causa posible:** Los empleados no tienen email registrado.

**Solución:**
1. Ve a RH → Empleados
2. Edita cada empleado y agrega su `Correo Electrónico` o `Correo Empresa`
3. Vuelve a intentar

## 7.4 Error al importar CSV

**Causa posible:** El formato del CSV no coincide con lo esperado.

**Solución:**
1. Verifica que el CSV tenga los encabezados correctos
2. Verifica que los datos obligatorios (CURP, RFC, NSS) estén presentes
3. Verifica que los departamentos existan en el sistema

## 7.5 No recibo correos de notificaciones

**Causa posible:** Resend no está configurado.

**Solución:**
1. Verifica que `RESEND_API_KEY` esté configurada en Coolify
2. Verifica que el dominio del email remitente esté verificado en Resend
3. Prueba con el botón "Enviar correos ahora" en el Dashboard RH

---

# ANEXO: FLUJO COMPLETO DE ALTA DE EMPLEADO

```
1. Crear Departamento (Organización)
       ↓
2. Crear Puesto (Organización)
       ↓
3. Dar de alta Empleado (RH → Empleados)
   - Asignar departamento
   - Asignar puesto
   - Completar datos personales y laborales
       ↓
4. Crear Usuario (Dashboard → Usuarios)
   - Asignar rol
       ↓
5. Asignar Módulos (Dashboard → Accesos)
   - Seleccionar módulos según el rol
       ↓
6. Vincular Usuario con Empleado (RH → Empleados → [empleado])
   - Seleccionar el usuario creado
       ↓
7. ¡Listo! El empleado ya puede acceder al sistema
```

---

**Versión del manual**: 1.0  
**Fecha**: 09/06/2026  
**ERP KRAM v3.0**
