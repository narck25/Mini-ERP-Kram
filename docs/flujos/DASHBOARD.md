# Flujos del Módulo Dashboard

## Flujo 1: Acceso al panel

1. El usuario inicia sesión (`POST /api/auth/login`).
2. El backend valida credenciales y genera un JWT con `role` y `accessibleModules`.
3. El frontend redirige al panel según el perfil:
   - Usuario regular → `/dashboard/mi-espacio` (Mi Espacio).
   - ADMIN/RH → pueden ir a `/rh/dashboard-completo` (Dashboard RH).

## Flujo 2: Mi Espacio (scoping Nivel B)

1. El usuario entra a "Mi Espacio".
2. El backend consulta `GET /api/stats/my-dashboard`.
3. El servicio aplica *scoping* por jerarquía:
   - ADMIN/RH → ven todos los datos (bypass).
   - Otros roles → ven solo **sus** vacantes, compras, actividades y candidatos.
4. El frontend renderiza las tarjetas con los datos filtrados.

## Notas

- El módulo `DASHBOARD` está siempre activo y no se puede quitar.
- No tiene operaciones de administración propias.
