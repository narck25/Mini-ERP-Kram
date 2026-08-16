# Manual de Usuario — Administrador (ADMIN)

> **Versión**: 1.0  
> **Fecha**: 24/06/2026  
> **Rol**: ADMIN — Administrador del Sistema  
> **Acceso**: Bypass global total — todos los módulos y operaciones críticas

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Gestión de Usuarios](#2-gestión-de-usuarios)
3. [Gestión de Accesos](#3-gestión-de-accesos)
4. [Gestión de Roles](#4-gestión-de-roles)
5. [Solución de Problemas](#5-solución-de-problemas)

---

## 1. Introducción

### 1.1 ¿Qué es el ERP KRAM?

El ERP KRAM es un sistema integral de gestión empresarial diseñado para **Comercializadora KRAM**.

### 1.2 ¿Qué puede hacer ADMIN?

Como **ADMIN**, tienes acceso completo y sin restricciones a **todos los módulos** del sistema, más capacidades exclusivas de administración:

| Capacidad | Descripción |
|-----------|-------------|
| Todos los módulos | Acceso completo a Dashboard, Empleados, Reclutamiento, Compras, etc. |
| Gestión de Usuarios | Crear, editar, eliminar usuarios y restablecer contraseñas |
| Gestión de Accesos | Asignar módulos a usuarios (como RH) |
| Gestión de Roles | Crear roles personalizados |
| Operaciones Críticas | Solo ADMIN puede modificar roles y permisos de otros usuarios |

### 1.3 Diferencia entre ADMIN y RH

| Aspecto | ADMIN | RH |
|---------|-------|-----|
| Acceso a módulos | ✅ Total | ✅ Total |
| Gestión de Usuarios | ✅ Crear, editar, eliminar | ❌ No |
| Gestión de Roles | ✅ Crear roles personalizados | ❌ No |
| Restablecer contraseñas | ✅ Sí | ❌ No |
| Asignar módulos | ✅ Sí | ✅ Sí |
| Operaciones críticas (Nivel C) | ✅ Sí | ❌ No |

---

## 2. Gestión de Usuarios

### 2.1 Acceso

- **Ruta**: `/dashboard/usuarios`
- **Menú**: Administración Global → Gestión de Usuarios

### 2.2 Estadísticas

El panel muestra:

| Indicador | Descripción |
|-----------|-------------|
| Total | Todos los usuarios registrados |
| Activos | Usuarios con cuenta activa |
| Inactivos | Usuarios con cuenta desactivada |
| Roles | Distribución de usuarios por rol |

### 2.3 Crear un Nuevo Usuario

1. Haz clic en **Crear Nuevo Usuario**
2. Completa el formulario:
   - **Nombre de Usuario** (requerido)
   - **Correo Electrónico** (requerido)
   - **Contraseña** (requerido, mínimo 6 caracteres)
   - **Rol** (requerido)
3. Haz clic en **Crear Usuario**

### 2.4 Editar un Usuario

1. En la tabla, haz clic en **Editar** del usuario deseado
2. Puedes modificar:
   - Nombre de usuario
   - Correo electrónico
   - Contraseña (dejar vacío para no cambiar)
   - Rol
   - Estado (Activo/Inactivo)
3. Haz clic en **Guardar Cambios**

### 2.5 Restablecer Contraseña

1. En la tabla, haz clic en **Contraseña** del usuario
2. Ingresa la nueva contraseña (mínimo 6 caracteres)
3. Haz clic en **Restablecer Contraseña**

### 2.6 Eliminar un Usuario

1. En la tabla, haz clic en **Eliminar** del usuario
2. Confirma la acción
3. **Importante**: No puedes eliminarte a ti mismo

### 2.7 Búsqueda y Filtros

- **Buscar**: Por nombre, correo o empleado vinculado
- **Filtrar por rol**: Selecciona un rol específico
- **Paginación**: Navega entre páginas de resultados

---

## 3. Gestión de Accesos

### 3.1 Acceso

- **Ruta**: `/dashboard/accesos`
- **Menú**: Administración Global → Gestión de Accesos

### 3.2 ¿Qué puedes hacer?

Como ADMIN, puedes gestionar los módulos a los que tiene acceso cada usuario.

### 3.3 Asignar Módulos

1. Localiza al usuario en la tabla
2. Haz clic en **Gestionar**
3. Activa o desactiva los módulos según necesites
4. Los cambios se guardan automáticamente

### 3.4 Aplicar Presets

Los presets asignan módulos típicos para cada rol:

| Rol | Módulos |
|-----|---------|
| ADMIN | Todos |
| RH | Dashboard, Empleados, Reclutamiento, Vacaciones, Incidencias, Reportes |
| SISTEMAS | Dashboard, Configuración, Reportes |
| COMPRAS | Dashboard, Compras, Reportes |
| PRODUCCION | Dashboard, Reportes |
| EMPLEADO_BASICO | Dashboard |

### 3.5 Acciones Masivas

- **Dar todos**: Activa todos los módulos para un usuario
- **Quitar todos**: Desactiva todos los módulos (excepto Dashboard)

---

## 4. Gestión de Roles

### 4.1 Acceso

La sección de **Gestión de Roles** aparece al final de la página de Gestión de Accesos, visible solo para ADMIN.

### 4.2 ¿Qué puedes hacer?

- **Ver** todos los roles del sistema
- **Crear** roles personalizados
- **Editar** roles existentes
- **Eliminar** roles personalizados

### 4.3 Crear un Rol Personalizado

1. En la sección de Gestión de Roles, haz clic en **Agregar Rol**
2. Completa:
   - **ID del Rol**: Código único (ej: `LOGISTICA`)
   - **Nombre**: Nombre visible (ej: `Logística`)
   - **Descripción**: Propósito del rol
   - **Color**: Clase de color (ej: `bg-orange-100 text-orange-800`)
   - **Icono**: Emoji representativo (ej: `🚚`)
3. Haz clic en **Guardar**

### 4.4 Editar un Rol

1. Haz clic en **Editar** del rol deseado
2. Modifica los campos necesarios
3. Haz clic en **Guardar**

### 4.5 Eliminar un Rol

1. Haz clic en **Eliminar** del rol personalizado
2. Confirma la acción

> **Nota**: No puedes eliminar roles del sistema (ADMIN, RH, SISTEMAS, COMPRAS, PRODUCCION, EMPLEADO_BASICO).

---

## 5. Solución de Problemas

### 5.1 Un usuario no puede acceder

1. Verifica que el usuario esté **Activo** en Gestión de Usuarios
2. Confirma que tenga los módulos necesarios en Gestión de Accesos
3. Restablece la contraseña si es necesario

### 5.2 Un usuario no ve un módulo

1. Ve a Gestión de Accesos
2. Localiza al usuario
3. Activa el módulo faltante
4. El usuario debe cerrar sesión y volver a entrar

### 5.3 Error al crear usuario

1. Verifica que el correo no esté duplicado
2. Asegúrate de que la contraseña tenga al menos 6 caracteres
3. Confirma que el rol seleccionado exista

### 5.4 No puedo eliminar un usuario

- No puedes eliminarte a ti mismo
- Si el usuario tiene datos asociados (empleado, solicitudes), puede haber restricciones

---

## Apéndice: Rutas Rápidas

| Acción | Ruta |
|--------|------|
| Gestión de Usuarios | `/dashboard/usuarios` |
| Gestión de Accesos | `/dashboard/accesos` |
| Dashboard RH | `/rh/dashboard-completo` |
| Empleados | `/rh/empleados` |
| Reclutamiento | `/rh/reclutamiento` |
| Compras | `/dashboard/compras` |
| Incidencias | `/rh/incidencias` |

---

*Documento generado el 24/06/2026 — ERP KRAM*
