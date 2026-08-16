# Módulo Dashboard

## 1. Cómo funciona

El Dashboard es el panel principal del ERP. **Siempre está activo** para todos los usuarios (no se puede desactivar). Incluye dos vistas principales:

- **Mi Espacio** (`/dashboard/mi-espacio`): panel personal de autoservicio. Aplica *scoping* por jerarquía (Nivel B): cada usuario ve únicamente **sus** vacantes, compras, actividades pendientes y candidatos.
- **Dashboard RH** (`/rh/dashboard-completo`): vista consolidada de indicadores para RH y Admin (empleados, vacantes, incidencias, etc.).

## 2. Quiénes pueden usarlo

- **Todos los roles.** El módulo `DASHBOARD` es el preset mínimo de cualquier rol y no se puede quitar.
- El contenido de *Mi Espacio* varía según el usuario (scoping): un empleado ve lo suyo; RH/Admin ven todo (bypass).

## 3. Manual del administrador

- No requiere configuración especial.
- El Dashboard **no se puede quitar** de un usuario en Gestión de Accesos (siempre incluido).
- El acceso al *Dashboard RH* (`/rh/dashboard-completo`) corresponde a los roles `ADMIN` y `RH`.

## 4. Manual del usuario

1. Inicia sesión; serás redirigido a tu panel (*Mi Espacio*).
2. Consulta tus tarjetas: vacantes activas, solicitudes de compra, actividades pendientes y candidatos relacionados.
3. Usa los accesos directos del panel para ir a cada módulo.
