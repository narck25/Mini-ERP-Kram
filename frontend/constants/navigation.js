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
// `category` agrupa los ítems en secciones colapsables dentro del sidebar (ver DashboardLayout.js).
export const myPortalNavigation = [
  { name: 'Mi Espacio', href: '/dashboard/mi-espacio', icon: '🌟', module: 'DASHBOARD', category: 'General' },
  { name: 'Mis Documentos', href: '/dashboard/mis-documentos', icon: '📁', module: 'DASHBOARD', category: 'General' },
  { name: 'Mi Asistencia', href: '/dashboard/mi-asistencia', icon: '⏱️', module: 'ASISTENCIA', category: 'General' },
  { name: 'Mi Equipo', href: '/rh/empleados', icon: '👥', module: 'EMPLEADOS', category: 'General' },
  { name: 'Mis Vacantes', href: '/reclutamiento/mis-solicitudes', icon: '📝', module: 'RECLUTAMIENTO', requiresDirectReports: true, category: 'Mis Solicitudes' },
  { name: 'Mis Compras', href: '/compras/mis-solicitudes', icon: '🛒', module: 'COMPRAS', category: 'Mis Solicitudes' },
  { name: 'Papelería', href: '/compras/papeleria', icon: '📄', module: 'COMPRAS', category: 'Mis Solicitudes' },
  { name: 'Mis Vacaciones', href: '/vacaciones/mis-solicitudes', icon: '🏖️', module: 'VACACIONES', category: 'Mis Solicitudes' },
  { name: 'Mis Tickets TI', href: '/ti/mis-tickets', icon: '🎫', module: 'TICKETS', category: 'Mis Solicitudes' },
]

// Sección 2: "Administración" (Gestión Total)
// Nota: Se usa module para control de acceso (Nivel A) y roles como filtro adicional (Nivel C)
export const adminNavigation = [
  { name: 'Dashboard RH', href: '/rh/dashboard-completo', icon: '📊', module: 'EMPLEADOS', roles: ['ADMIN', 'RH'], category: 'Recursos Humanos' },
  { name: 'Reclutamiento', href: '/rh/reclutamiento', icon: '📋', module: 'RECLUTAMIENTO', roles: ['ADMIN', 'RH'], category: 'Recursos Humanos' },
  { name: 'Incidencias', href: '/rh/incidencias', icon: '⏰', module: 'INCIDENCIAS', roles: ['ADMIN', 'RH'], category: 'Recursos Humanos' },
  { name: 'Incapacidades', href: '/rh/incapacidades', icon: '🏥', module: 'EMPLEADOS', roles: ['ADMIN', 'RH'], category: 'Recursos Humanos' },
  { name: 'Periodo de Prueba', href: '/rh/periodo-prueba', icon: '📋', module: 'EMPLEADOS', roles: ['ADMIN', 'RH'], category: 'Recursos Humanos' },
  { name: 'Evaluación Operativa', href: '/rh/evaluacion-operativa', icon: '📈', module: 'EMPLEADOS', roles: ['ADMIN', 'RH'], category: 'Recursos Humanos' },
  { name: 'Vacaciones', href: '/rh/vacaciones', icon: '🏖️', module: 'VACACIONES', roles: ['ADMIN', 'RH'], category: 'Recursos Humanos' },
  { name: 'Reportes', href: '/dashboard/reportes', icon: '📊', module: 'REPORTES', roles: ['ADMIN', 'RH'], category: 'Recursos Humanos' },
  { name: 'Organización', href: '/dashboard/organizacion', icon: '🏢', module: 'EMPLEADOS', roles: ['ADMIN'], category: 'Recursos Humanos' },
  { name: 'Gestión de Compras', href: '/dashboard/compras', icon: '🛒', module: 'COMPRAS', roles: ['ADMIN', 'COMPRAS'], category: 'Compras' },
  { name: 'Proveedores', href: '/dashboard/compras/proveedores', icon: '🏭', module: 'COMPRAS', roles: ['ADMIN', 'COMPRAS'], category: 'Compras' },
  { name: 'Papelería', href: '/dashboard/compras/papeleria', icon: '📄', module: 'COMPRAS', roles: ['ADMIN', 'COMPRAS'], category: 'Compras' },
  { name: 'Uniformes', href: '/dashboard/compras/uniformes', icon: '👕', module: 'COMPRAS', roles: ['ADMIN', 'RH', 'COMPRAS'], category: 'Compras' },
  { name: 'Aprobaciones de Inventario', href: '/dashboard/compras/aprobaciones-inventario', icon: '✅', module: 'COMPRAS', roles: ['ADMIN', 'RH'], category: 'Compras' },
  { name: 'Movimientos de Inventario', href: '/dashboard/compras/movimientos-inventario', icon: '📊', module: 'COMPRAS', roles: ['ADMIN', 'RH', 'COMPRAS'], category: 'Compras' },
  { name: 'Permisos y Roles', href: '/dashboard/accesos', icon: '🔐', module: 'CONFIGURACION', roles: ['ADMIN'], category: 'Sistema' },
  { name: 'Usuarios', href: '/dashboard/usuarios', icon: '👤', module: 'CONFIGURACION', roles: ['ADMIN'], category: 'Sistema' },
  { name: 'Tickets de TI', href: '/dashboard/ti', icon: '🎫', module: 'TICKETS', roles: ['ADMIN', 'SISTEMAS'], category: 'Sistema' },
]

// Navegación del menú desplegable del usuario
export const userNavigation = [
  { name: 'Tu perfil', href: '/dashboard/profile' },
  { name: 'Configuración', href: '/dashboard/usuarios', roles: ['ADMIN'] },
]
