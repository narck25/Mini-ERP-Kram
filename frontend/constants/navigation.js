/**
 * Configuración de navegación del ERP KRAM.
 * 
 * Centraliza los menús del sidebar para que DashboardLayout.js sea un componente
 * delgado que solo renderiza, sin lógica de negocio hardcodeada.
 * 
 * Para agregar un nuevo ítem de menú, solo modificar este archivo.
 * En el futuro, estos datos pueden venir de GET /api/modules.
 */

// Sección 1: "Mi Portal" (Autoservicio y Equipo)
export const myPortalNavigation = [
  { name: 'Mi Espacio', href: '/dashboard/mi-espacio', icon: '🌟', module: 'EMPLEADOS' },
  { name: 'Mi Equipo', href: '/rh/empleados', icon: '👥', module: 'EMPLEADOS' },
  { name: 'Mis Vacantes', href: '/reclutamiento/mis-solicitudes', icon: '📝', module: 'RECLUTAMIENTO' },
  { name: 'Mis Compras', href: '/compras/mis-solicitudes', icon: '🛒', module: 'COMPRAS' },
  { name: 'Papelería', href: '/compras/papeleria', icon: '📄', module: 'COMPRAS' },
  { name: 'Mis Vacaciones', href: '/vacaciones/mis-solicitudes', icon: '🏖️', module: 'VACACIONES' },
]

// Sección 2: "Administración" (Gestión Total)
// Nota: Se usa module para control de acceso (Nivel A) y roles como filtro adicional (Nivel C)
export const adminNavigation = [
  { name: 'Dashboard RH', href: '/rh/dashboard-completo', icon: '📊', module: 'EMPLEADOS', roles: ['ADMIN', 'RH'] },
  { name: 'Reclutamiento', href: '/rh/reclutamiento', icon: '📋', module: 'RECLUTAMIENTO', roles: ['ADMIN', 'RH'] },
  { name: 'Incidencias', href: '/rh/incidencias', icon: '⏰', module: 'INCIDENCIAS', roles: ['ADMIN', 'RH'] },
  { name: 'Vacaciones', href: '/rh/vacaciones', icon: '🏖️', module: 'VACACIONES', roles: ['ADMIN', 'RH'] },
  { name: 'Reportes', href: '/dashboard/reportes', icon: '📊', module: 'REPORTES', roles: ['ADMIN', 'RH'] },
  { name: 'Gestión de Compras', href: '/dashboard/compras', icon: '🛒', module: 'COMPRAS', roles: ['ADMIN', 'COMPRAS'] },
  { name: 'Papelería', href: '/dashboard/compras/papeleria', icon: '📄', module: 'COMPRAS', roles: ['ADMIN', 'COMPRAS'] },
  { name: 'Uniformes', href: '/dashboard/compras/uniformes', icon: '👕', module: 'COMPRAS', roles: ['ADMIN', 'RH', 'COMPRAS'] },
  { name: 'Aprobaciones de Inventario', href: '/dashboard/compras/aprobaciones-inventario', icon: '✅', module: 'COMPRAS', roles: ['ADMIN', 'RH'] },
  { name: 'Movimientos de Inventario', href: '/dashboard/compras/movimientos-inventario', icon: '📊', module: 'COMPRAS', roles: ['ADMIN', 'RH', 'COMPRAS'] },
  { name: 'Organización', href: '/dashboard/organizacion', icon: '🏢', module: 'EMPLEADOS', roles: ['ADMIN'] },
  { name: 'Permisos y Roles', href: '/dashboard/accesos', icon: '🔐', module: 'CONFIGURACION', roles: ['ADMIN'] },
  { name: 'Usuarios', href: '/dashboard/usuarios', icon: '👤', module: 'CONFIGURACION', roles: ['ADMIN'] },
]

// Navegación del menú desplegable del usuario
export const userNavigation = [
  { name: 'Tu perfil', href: '/dashboard/profile' },
  { name: 'Configuración', href: '/dashboard/usuarios', roles: ['ADMIN'] },
]