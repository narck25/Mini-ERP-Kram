# Manual de Gestión de Accesos — ADMIN

> **Versión**: 1.0  
> **Fecha**: 24/06/2026  
> **Rol**: ADMIN — Administrador del sistema  
> **Módulo**: CONFIGURACION

---

## 1. Objetivo

Gestionar los permisos y accesos de los usuarios al sistema. Como ADMIN, puedes asignar o quitar módulos a cada usuario, cambiar roles y administrar la configuración de seguridad.

---

## 2. Alcance

| Funcionalidad | Descripción |
|---------------|-------------|
| Gestión de usuarios | CRUD completo de usuarios del sistema |
| Asignación de módulos | Configurar qué módulos puede ver cada usuario |
| Cambio de roles | Modificar el rol de un usuario |
| Configuración de accesos | Panel centralizado de administración de permisos |

---

## 3. Procedimientos Paso a Paso

### 3.1 Acceder a la Gestión de Accesos

1. Inicia sesión como ADMIN
2. En el menú lateral, ve a **Administración Global → Gestión de Accesos**
3. **Ruta directa**: `/dashboard/accesos`

> **Captura pendiente**: Panel de gestión de accesos

### 3.2 Gestionar Usuarios

#### 3.2.1 Ver Listado de Usuarios

La tabla muestra:
| Columna | Descripción |
|---------|-------------|
| **Nombre** | Nombre completo del usuario |
| **Email** | Correo electrónico |
| **Rol** | Rol asignado (con color e icono) |
| **Módulos** | Número de módulos asignados |
| **Estado** | Activo o Inactivo |
| **Acciones** | Editar, Eliminar |

**Búsqueda**: Filtra por nombre o email.

#### 3.2.2 Editar Accesos de un Usuario

1. Haz clic en **Editar** del usuario deseado
2. Se abrirá un modal con las siguientes secciones:

**Información del Usuario**:
| Campo | Descripción |
|-------|-------------|
| Nombre | Nombre del usuario |
| Email | Correo electrónico |
| Rol | Selector de rol (ADMIN, RH, SISTEMAS, COMPRAS, PRODUCCION, EMPLEADO_BASICO) |

**Módulos Asignados**:
Lista de checkboxes con todos los módulos disponibles:
- [ ] DASHBOARD
- [ ] EMPLEADOS
- [ ] RECLUTAMIENTO
- [ ] VACACIONES
- [ ] INCIDENCIAS
- [ ] CONFIGURACION
- [ ] REPORTES
- [ ] COMPRAS

3. Modifica los campos necesarios
4. Haz clic en **Guardar Cambios**

> **Captura pendiente**: Modal de edición de accesos

#### 3.2.3 Aplicar Preset por Rol

1. En el modal de edición, selecciona un rol del selector
2. Haz clic en **Aplicar Preset**
3. Los módulos se ajustarán automáticamente según la configuración predefinida para ese rol
4. Puedes personalizar manualmente después de aplicar el preset

**Presets disponibles**:
| Rol | Módulos asignados |
|-----|-------------------|
| ADMIN | Todos los módulos |
| RH | DASHBOARD, EMPLEADOS, RECLUTAMIENTO, VACACIONES, INCIDENCIAS, REPORTES |
| SISTEMAS | DASHBOARD, CONFIGURACION, REPORTES |
| COMPRAS | DASHBOARD, COMPRAS, REPORTES |
| PRODUCCION | DASHBOARD, REPORTES |
| EMPLEADO_BASICO | DASHBOARD |

#### 3.2.4 Eliminar un Usuario

1. Haz clic en **Eliminar** del usuario
2. Confirma la acción
3. **Importante**: Esta acción es irreversible

---

## 4. Gestión de Roles y Módulos

### 4.1 Roles del Sistema

| Rol | Color | Icono | Descripción |
|-----|-------|-------|-------------|
| ADMIN | bg-purple-100 text-purple-800 | 👑 | Administrador del sistema |
| RH | bg-blue-100 text-blue-800 | 👥 | Recursos Humanos |
| SISTEMAS | bg-green-100 text-green-800 | 💻 | Soporte técnico |
| COMPRAS | bg-yellow-100 text-yellow-800 | 🛒 | Compras |
| PRODUCCION | bg-red-100 text-red-800 | 🏭 | Producción |
| EMPLEADO_BASICO | bg-gray-100 text-gray-800 | 👤 | Empleado base |

### 4.2 Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| DASHBOARD | Panel principal (siempre activo) |
| EMPLEADOS | Gestión de empleados y expedientes |
| RECLUTAMIENTO | Gestión de vacantes y candidatos |
| VACACIONES | Solicitud y aprobación de vacaciones |
| INCIDENCIAS | Reporte y seguimiento de incidencias |
| CONFIGURACION | Configuración del sistema |
| REPORTES | Generación de reportes y estadísticas |
| COMPRAS | Gestión de compras |

---

## 5. Validaciones del Sistema

| Validación | Regla |
|------------|-------|
| Edición de ADMIN | Solo otro ADMIN puede modificar un usuario ADMIN |
| Módulo CONFIGURACION | Solo ADMIN tiene acceso por defecto |
| Eliminación de usuarios | Solo ADMIN puede eliminar usuarios |
| Cambio de rol | Cualquier rol es asignable |

---

## 6. Buenas Prácticas

1. **Usar presets**: Al crear o modificar usuarios, usa los presets como base y luego personaliza
2. **Mínimo privilegio**: Asigna solo los módulos que el usuario necesita para su trabajo
3. **Documentar cambios**: Lleva un registro de los cambios de permisos importantes
4. **Revisar periódicamente**: Audita los accesos de los usuarios regularmente
5. **No duplicar ADMIN**: Limita el número de usuarios con rol ADMIN

---

## 7. Preguntas Frecuentes

**P: ¿Puedo asignar módulos individuales sin cambiar el rol?**
R: Sí, los módulos son independientes del rol. Puedes personalizar los accesos de cada usuario.

**P: ¿Qué pasa si un usuario no tiene ningún módulo asignado?**
R: Solo verá el Dashboard (si tiene DASHBOARD) o recibirá error de acceso denegado.

**P: ¿Puedo crear un nuevo rol?**
R: Los roles están predefinidos en el sistema. No se pueden crear nuevos desde la UI.

**P: ¿RH puede gestionar accesos?**
R: No, la gestión de accesos es exclusiva de ADMIN (Nivel C).

---

## 8. Referencias

- **Gestión de Accesos**: `/dashboard/accesos`
- **Gestión de Usuarios**: `/dashboard/usuarios`
- **API Roles**: `GET /api/roles`
- **API Módulos**: `GET /api/modules`
- **API Presets**: `GET /api/roles/presets`

---

*Documento generado el 24/06/2026 — ERP KRAM*
