# Manual de Usuario — Recursos Humanos (RH)

> **Versión**: 1.0  
> **Fecha**: 24/06/2026  
> **Rol**: RH — Recursos Humanos  
> **Acceso**: Bypass global en todos los módulos del sistema

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Dashboard RH](#2-dashboard-rh)
3. [Gestión de Empleados](#3-gestión-de-empleados)
4. [Reclutamiento](#4-reclutamiento)
5. [Incidencias (Asistencia)](#5-incidencias-asistencia)
6. [Gestión de Accesos](#6-gestión-de-accesos)
7. [Solución de Problemas](#7-solución-de-problemas)

---

## 1. Introducción

### 1.1 ¿Qué es el ERP KRAM?

El ERP KRAM es un sistema integral de gestión empresarial diseñado para **Comercializadora KRAM**. Permite gestionar empleados, reclutamiento, compras, incidencias y más desde una plataforma unificada.

### 1.2 ¿Qué puede hacer RH?

Como usuario **RH**, tienes acceso completo a todos los módulos del sistema:

| Módulo | Acceso |
|--------|--------|
| Dashboard | ✅ Completo |
| Empleados | ✅ Completo (crear, editar, importar, exportar) |
| Reclutamiento | ✅ Completo (aprobar, gestionar candidatos) |
| Vacaciones | ✅ Completo |
| Incidencias | ✅ Completo |
| Reportes | ✅ Completo |
| Configuración | ✅ Gestión de Accesos (asignar módulos a usuarios) |
| Compras | ✅ Consulta de uniformes |

### 1.3 Acceso al Sistema

1. Abre tu navegador web (Chrome, Edge, Firefox)
2. Navega a la dirección del sistema (ej: `http://localhost:3000`)
3. Ingresa tu **correo electrónico** y **contraseña**
4. Haz clic en **Iniciar Sesión**

> **Nota**: Si olvidaste tu contraseña, contacta al administrador del sistema.

---

## 2. Dashboard RH

### 2.1 Acceso

- **Ruta**: `/rh/dashboard-completo`
- **Menú**: Administración Global → Dashboard RH

### 2.2 ¿Qué muestra?

El Dashboard RH es el panel de control principal con métricas clave del departamento:

#### Tarjetas de Métricas

| Tarjeta | Descripción |
|---------|-------------|
| **Empleados Activos** | Total de empleados activos en la empresa |
| **En Vacaciones** | Empleados actualmente de vacaciones |
| **Vacantes** | Posiciones abiertas (abiertas, en proceso, cerradas) |
| **Contrataciones** | Nuevas contrataciones este mes |

#### Próximos Eventos

Widget que muestra:
- **Cumpleaños** del mes
- **Aniversarios** de ingreso del mes

#### Gráficas

- **Vacantes por Estatus**: Gráfica de barras con distribución de vacantes
- **Distribución de Empleados**: Gráfica de pastel (activos, vacaciones, incapacidades)

#### Contrataciones Recientes

Tabla con los empleados dados de alta recientemente.

#### Acciones Rápidas

| Botón | Acción |
|-------|--------|
| Gestionar Empleados | Ir a la lista de empleados |
| Reclutamiento | Ir al dashboard de reclutamiento |
| Crear Vacante | Crear una vacante pre-aprobada |
| Permisos | Ir a gestión de accesos |

### 2.3 Actualizar Datos

Haz clic en el botón **Actualizar** para refrescar todas las métricas.

---

## 3. Gestión de Empleados

### 3.1 Acceso

- **Ruta**: `/rh/empleados`
- **Menú**: Mi Portal → Mi Equipo

### 3.2 Lista de Empleados

La pantalla principal muestra una tabla con todos los empleados registrados. Incluye:

- Nombre completo
- Clave/Número de empleado
- Puesto
- Departamento
- Estatus (Activo/Inactivo)
- Fecha de alta

### 3.3 Crear Nuevo Empleado

1. Haz clic en **Nuevo Empleado**
2. Completa el formulario con:
   - **Datos personales**: Nombre, fecha de nacimiento, CURP, RFC, NSS
   - **Datos laborales**: Puesto, departamento, fecha de alta, salario
   - **Datos de contacto**: Email, teléfono, dirección
3. Haz clic en **Guardar**

### 3.4 Editar Empleado

1. En la tabla, haz clic en el botón **Editar** del empleado deseado
2. Modifica los campos necesarios
3. Haz clic en **Guardar Cambios**

### 3.5 Dar de Baja un Empleado

1. En la tabla, haz clic en el botón de eliminar del empleado
2. Confirma la acción en el diálogo
3. El empleado pasará a estatus **Inactivo**

### 3.6 Importar Empleados desde CSV

1. Haz clic en **Importar CSV**
2. Descarga la **Plantilla CSV** si es necesario
3. Prepara tu archivo CSV con los datos de los empleados
4. Selecciona el archivo y haz clic en **Importar**

### 3.7 Exportar Empleados a CSV

1. Haz clic en **Exportar CSV**
2. El archivo se descargará automáticamente

### 3.8 Campos del Empleado

| Campo | Descripción | Requerido |
|-------|-------------|-----------|
| Nombre | Nombre completo del empleado | Sí |
| Clave | Número de empleado único | Sí |
| Puesto | Puesto que ocupa | Sí |
| Departamento | Departamento al que pertenece | Sí |
| Fecha de Alta | Fecha de ingreso | Sí |
| Salario | Salario mensual | No |
| CURP | Clave Única de Registro de Población | No |
| RFC | Registro Federal de Contribuyentes | No |
| NSS | Número de Seguridad Social | No |
| Email | Correo electrónico | No |
| Teléfono | Teléfono de contacto | No |

---

## 4. Reclutamiento

### 4.1 Dashboard de Reclutamiento

- **Ruta**: `/rh/reclutamiento`
- **Menú**: Administración Global → Reclutamiento RH

#### Estadísticas

| Indicador | Descripción |
|-----------|-------------|
| Total Solicitudes | Todas las solicitudes de vacante |
| Solicitadas | Pendientes de aprobación |
| Aprobadas | Aprobadas, esperando perfil técnico |
| Buscando | En proceso de reclutamiento |
| Cerradas | Vacantes cubiertas o canceladas |

#### Filtros Disponibles

| Filtro | Descripción |
|--------|-------------|
| Estado | Solicitada, Aprobada, Buscando, Cerrada |
| Departamento | Filtrar por departamento |
| Búsqueda | Por título de la vacante |
| Fecha desde | Fecha inicial |
| Fecha hasta | Fecha final |

### 4.2 Ciclo de Vida de una Vacante

```
Solicitada → Aprobada → Buscando → Cerrada
```

1. **Solicitada**: El jefe de área solicita una vacante
2. **Aprobada**: RH aprueba la solicitud
3. **Buscando**: Se buscan candidatos activamente
4. **Cerrada**: Vacante cubierta o cancelada

### 4.3 Aprobar una Solicitud de Vacante

1. En el dashboard de reclutamiento, localiza la solicitud con estatus **Solicitada**
2. Haz clic en **Aprobar Solicitud**
3. Confirma la acción

### 4.4 Cerrar una Solicitud de Vacante

1. Localiza la solicitud que deseas cerrar
2. Haz clic en **Cerrar Solicitud**
3. Confirma la acción

### 4.5 Reabrir una Solicitud

Si una vacante está **Cerrada**, puedes reabrirla haciendo clic en **Reabrir Solicitud**.

### 4.6 Crear Vacante Pre-Aprobada

1. Desde el dashboard de reclutamiento, haz clic en **+ Crear Vacante Pre-Aprobada**
2. Completa el formulario con los datos de la vacante
3. La vacante se crea directamente en estatus **Aprobada**

### 4.7 Gestionar Candidatos

1. En una vacante con estatus **Buscando**, haz clic en **Gestionar Candidatos**
2. Se abrirá la página de detalle de la vacante con la pestaña de candidatos
3. Puedes:
   - **Agregar candidatos** manualmente
   - **Ver candidatos** existentes
   - **Cambiar estatus** de los candidatos
   - **Agregar comentarios**

### 4.8 Perfil Técnico

Cuando una vacante está **Aprobada**, el solicitante debe definir el perfil técnico. Como RH, puedes:

- Dar seguimiento a la definición del perfil
- Ver los requerimientos técnicos definidos
- Iniciar la búsqueda de candidatos una vez definido

---

## 5. Incidencias (Asistencia)

### 5.1 Acceso

- **Ruta**: `/rh/incidencias`
- **Menú**: Administración Global → Incidencias

### 5.2 ¿Qué hace?

El módulo de Incidencias procesa los registros de asistencia del checador **ZKTeco** y genera un reporte detallado con:

- Horas de entrada y salida
- Tiempos de desayuno y comida
- Alertas de anomalías
- Clasificación por estado

### 5.3 Subir Archivo CSV del Checador

1. Haz clic en **Subir CSV ZKTeco**
2. Selecciona el archivo CSV generado por el checador
3. El sistema procesará automáticamente los registros

### 5.4 Consultar Registros por Fecha

1. Selecciona una **Fecha Inicio** y **Fecha Fin**
2. Haz clic en **Consultar**
3. El sistema mostrará los registros procesados

### 5.5 Entender los Estados

| Estado | Icono | Significado |
|--------|-------|-------------|
| **Normal** | ✅ | Registro completo, descansos dentro de tiempo |
| **Atención** | ⚠️ | Desayuno > 20 min o Comida > 65 min |
| **Crítico** | ❌ | Faltan registros de entrada/salida |
| **Información** | ℹ️ | Turno corto (< 6.5 horas) |

### 5.6 Columnas del Reporte

| Columna | Descripción |
|---------|-------------|
| Num. | Número de empleado |
| Nombre | Nombre del empleado |
| Fecha | Fecha del registro |
| Entrada (T1) | Hora de entrada |
| Desayuno (T2/T3) | Salida y regreso de desayuno |
| Comida (T4/T5) | Salida y regreso de comida |
| Salida (T6) | Hora de salida |
| Total | Total de horas trabajadas |
| Estado | Estado del registro |

### 5.7 Exportar Reporte

- **Copiar Reporte**: Copia los datos al portapapeles para pegar en Excel
- **Exportar CSV**: Descarga el reporte como archivo CSV

### 5.8 Buscar Empleados

Usa el campo de búsqueda para filtrar por nombre o número de empleado.

---

## 6. Gestión de Accesos

### 6.1 Acceso

- **Ruta**: `/dashboard/accesos`
- **Menú**: Administración Global → Gestión de Accesos

### 6.2 ¿Qué puedes hacer?

Como RH, puedes **asignar módulos** a los usuarios del sistema. Esto determina qué secciones del menú puede ver cada usuario.

### 6.3 Asignar Módulos a un Usuario

1. Localiza al usuario en la tabla
2. Haz clic en **Gestionar**
3. Se desplegará el panel de módulos
4. Activa o desactiva los módulos según necesites
5. Los cambios se guardan automáticamente

### 6.4 Aplicar Presets

Los presets asignan rápidamente los módulos típicos para cada rol:

| Rol | Módulos por Defecto |
|-----|---------------------|
| ADMIN | Todos los módulos |
| RH | Dashboard, Empleados, Reclutamiento, Vacaciones, Incidencias, Reportes |
| SISTEMAS | Dashboard, Configuración, Reportes |
| COMPRAS | Dashboard, Compras, Reportes |
| PRODUCCION | Dashboard, Reportes |
| EMPLEADO_BASICO | Dashboard |

Para aplicar un preset:
1. En el panel de gestión del usuario, haz clic en el preset deseado
2. Los módulos se asignarán automáticamente

### 6.5 Reglas Importantes

- El módulo **Dashboard** está siempre activo para todos
- Solo usuarios **Activos** pueden recibir cambios
- Los cambios afectan la visibilidad del menú lateral

---

## 7. Solución de Problemas

### 7.1 No puedo acceder al sistema

1. Verifica tu conexión a internet
2. Confirma que tu usuario está activo (contacta al administrador)
3. Usa la opción "¿Olvidaste tu contraseña?" en la pantalla de login

### 7.2 No veo un módulo en el menú

1. Verifica que el módulo esté activado en Gestión de Accesos
2. Si no tienes acceso, contacta al administrador

### 7.3 Error al subir CSV de incidencias

1. Verifica que el archivo tenga el formato correcto
2. Asegúrate de que las columnas coincidan con lo esperado
3. Intenta con un archivo más pequeño

### 7.4 No aparecen empleados en la lista

1. Verifica los filtros de búsqueda
2. Confirma que los empleados fueron dados de alta correctamente
3. Actualiza la página

---

## Apéndice: Atajos y Rutas Rápidas

| Acción | Ruta |
|--------|------|
| Dashboard RH | `/rh/dashboard-completo` |
| Empleados | `/rh/empleados` |
| Reclutamiento | `/rh/reclutamiento` |
| Crear Vacante | `/rh/reclutamiento/crear-vacante` |
| Incidencias | `/rh/incidencias` |
| Gestión de Accesos | `/dashboard/accesos` |
| Uniformes | `/rh/uniformes` |

---

*Documento generado el 24/06/2026 — ERP KRAM*
