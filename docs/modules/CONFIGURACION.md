# Módulo Configuración (Accesos, Usuarios y Roles)

## 1. Cómo funciona

Agrupa la administración de **accesos** y **cuentas de usuario**:

- **Gestión de Accesos** (`/dashboard/accesos`): administra los **módulos** a los que cada usuario tiene acceso, aplica **presets por rol** y gestiona **roles personalizados**.
- **Gestión de Usuarios** (`/dashboard/usuarios`): crea, edita, elimina cuentas de usuario, cambia rol/estado y restablece contraseñas.

El control de acceso sigue un modelo de **3 niveles**:
- **Nivel A** — Módulos (`accessibleModules`).
- **Nivel B** — Alcance de datos (scoping).
- **Nivel C** — Operaciones críticas (solo ADMIN: cambiar roles, eliminar usuarios, roles personalizados).

## 2. Quiénes pueden usarlo

| Acción | Quién |
|--------|-------|
| Gestionar **módulos** de los usuarios | ADMIN y RH |
| **Aplicar presets** (cambia rol + módulos) | Solo ADMIN |
| **Cambiar el rol** de un usuario | Solo ADMIN |
| **Crear/editar/eliminar usuarios** y resetear contraseña | ADMIN (resetear contraseña: ADMIN y RH) |
| **Roles personalizados** (crear/editar/eliminar) | Solo ADMIN |

## 3. Manual del administrador

- **Asignar/retirar módulos**: en Gestión de Accesos, expande un usuario ("Gestionar") y marca/desmarca módulos. El módulo Dashboard siempre queda activo.
- **Aplicar preset**: expande el usuario y elige el preset de un rol (solo ADMIN). Cambia rol y módulos a la vez (pide confirmación).
- **Roles personalizados**: en Gestión de Accesos, sección "Roles" (solo ADMIN). Crea, edita o elimina roles personalizados.
- **Crear usuario**: Gestión de Usuarios → "Crear Nuevo Usuario" (nombre, correo, contraseña, rol).
- **Editar usuario**: cambia nombre, correo, rol, estado y contraseña.
- **Restablecer contraseña**: botón correspondiente en Gestión de Usuarios.
- **Eliminar usuario**: elimina la cuenta (los usuarios con rol personalizado eliminado pasan a "Empleado").

> ⚠️ **Seguridad**: no puedes modificar tus propios permisos (para evitar bloquearte).

## 4. Manual del usuario

- Módulo exclusivo de administración. No hay acciones de autoservicio para el empleado.
