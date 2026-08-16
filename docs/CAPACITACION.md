# Guía de Capacitación por Rol — ERP KRAM

> Última actualización: 2026-06-24 · Complementa `MANUAL_PROYECTO.md` y los manuales de `docs/modules/`.

Esta guía está pensada para **capacitar a cada perfil de usuario** según su rol. El acceso a módulos **no lo define el rol**, sino los **`accessibleModules`** configurados por RH/ADMIN (ver `SEGURIDAD.md`). La excepción son los **Roles Estratégicos** (ADMIN y RH), que tienen bypass global.

## 1. Mapa general de roles y módulos

| Rol | Tipo | Módulos por defecto (preset) | Alcance de datos |
|---|---|---|---|
| **ADMIN** 👑 | Estratégico | Todos | Global (sin restricciones) |
| **RH** 👥 | Estratégico | DASHBOARD, EMPLEADOS, RECLUTAMIENTO, INCIDENCIAS | Global (sin restricciones) |
| **SISTEMAS** 💻 | Departamental | DASHBOARD, CONFIGURACION | Según configuración |
| **COMPRAS** 🛒 | Departamental | DASHBOARD, COMPRAS | Solicitudes propias + gestión de compras |
| **PRODUCCION** 🏭 | Departamental | DASHBOARD | Básico |
| **EMPLEADO_BASICO** 👤 | Base | DASHBOARD | Solo sus datos ("Mi Espacio") |

> Los módulos **VACACIONES** y **REPORTES** están deshabilitados (sin implementación).

## 2. ADMIN (Administrador)

**Qué puede hacer**
- Acceso total a todos los módulos y a todos los datos (bypass Nivel A y B).
- Operaciones críticas del sistema (Nivel C) — **solo ADMIN**:
  - Asignar/quitar módulos y cambiar roles de otros usuarios (`Gestión de Accesos`).
  - Crear/editar/eliminar roles personalizados.
  - Eliminar usuarios.
  - Resetear la base de datos (`POST /api/seed/reset`).
  - Ver estadísticas del sistema.

**Flujos clave**
1. `Dashboard → Accesos` para gestionar permisos y roles.
2. `Dashboard → Usuarios` para crear/editar usuarios y restablecer contraseñas.
3. `Configuración` para organización (departamentos, puestos) y parámetros del sistema.

## 3. RH (Recursos Humanos)

**Qué puede hacer**
- Acceso global a todos los módulos y datos (bypass Nivel A y B) — autorizado por Dirección General.
- Gestión completa de empleados (alta, expediente, documentos, baja con motivo).
- Reclutamiento: aprobar/cerrar/eliminar vacantes, registrar candidatos.
- Configurar accesos de usuarios (asignar módulos) y restablecer contraseñas.
- **No** realiza operaciones críticas de Nivel C reservadas a ADMIN.

**Flujos clave**
1. `RH → Empleados`: alta, edición, expediente digital, documentos, baja.
2. `RH → Reclutamiento`: seguimiento de vacantes y candidatos.
3. `Dashboard → Accesos`: asignar/quitar módulos a usuarios regulares.

## 4. COMPRAS (Compras)

**Qué puede hacer**
- Módulo `COMPRAS`: solicitudes de compra, cotizaciones, comparativa, órdenes de compra, papelería y uniformes.
- Gestión de inventario (papelería, uniformes) con restock.
- Solicitar ajustes de inventario (la aprobación la hace RH/ADMIN).
- Ver kardex de movimientos.

**Flujos clave**
1. `Dashboard → Compras → Nueva solicitud` (folio automático, partidas).
2. Subir cotizaciones y seleccionar la ganadora.
3. Generar la orden de compra (PDF) y marcar entrega.
4. `Compras → Papelería/Uniformes → Inventario` para reposición.

## 5. Empleados regulares (PRODUCCION, SISTEMAS, EMPLEADO_BASICO y otros)

**Qué pueden hacer**
- Ver su **"Mi Espacio"** (datos personales, cumpleaños/aniversarios).
- Según los módulos asignados: solicitar vacantes (Reclutamiento), incidencias, solicitar compras/papelería.

**Flujos clave**
1. `Dashboard → Mi Espacio` para consultar su información.
2. `Reclutamiento → Mis solicitudes` para crear/consultar solicitudes de vacante.
3. `Compras → Mis solicitudes` para solicitar compras/papelería.

## 6. Flujos comunes a todos los roles

1. **Iniciar sesión** con correo y contraseña.
2. **Cambiar contraseña** desde el perfil.
3. **Redirección post-login**: ADMIN/RH → dashboard completo; el resto → según su `accessibleModules` (con scoping de datos).
4. **Notificaciones**: cumpleaños y aniversarios próximos (widget + emails vía Resend).

## 7. Reglas de seguridad a reforzar en capacitación

- El **rol no define módulos**: lo hacen los `accessibleModules`. No compartir credenciales para "tener acceso".
- Solo **ADMIN** puede cambiar permisos/roles y resetear la BD.
- **RH** tiene acceso global operativo, pero no operaciones de Nivel C.
- Ningún otro rol debe recibir privilegios equivalentes a ADMIN/RH sin autorización de Presidencia.
