/**
 * Configuración centralizada de Presets de Módulos por Rol
 * 
 * Define qué módulos tiene cada rol por defecto.
 * Única fuente de verdad para los presets del sistema.
 * 
 * Para agregar un preset para un nuevo rol:
 * 1. Agregar el rol al enum RoleType en schema.prisma
 * 2. Agregar su preset aquí con los módulos que debe tener
 * 3. El frontend (Gestión de Accesos) lo consumirá desde la API
 */

const ROLES_PRESETS = {
  ADMIN: [
    'DASHBOARD',
    'EMPLEADOS',
    'RECLUTAMIENTO',
    'VACACIONES',
    'INCIDENCIAS',
    'CONFIGURACION',
    'REPORTES',
    'COMPRAS'
  ],
  RH: [
    'DASHBOARD',
    'EMPLEADOS',
    'RECLUTAMIENTO',
    'VACACIONES',
    'INCIDENCIAS',
    'REPORTES'
  ],
  SISTEMAS: [
    'DASHBOARD',
    'CONFIGURACION',
    'REPORTES'
  ],
  COMPRAS: [
    'DASHBOARD',
    'COMPRAS',
    'REPORTES'
  ],
  PRODUCCION: [
    'DASHBOARD',
    'REPORTES'
  ],
  EMPLEADO_BASICO: [
    'DASHBOARD'
  ]
};

/**
 * Obtiene todos los presets de módulos por rol
 * @returns {Object} Objeto con roleId como key y array de módulos como value
 */
function getAllPresets() {
  return { ...ROLES_PRESETS };
}

/**
 * Obtiene el preset de módulos para un rol específico
 * @param {string} roleId - Código del rol
 * @returns {string[]|null} Array de módulos o null si no existe preset
 */
function getPresetForRole(roleId) {
  return ROLES_PRESETS[roleId] || null;
}

module.exports = ROLES_PRESETS;
module.exports.getAllPresets = getAllPresets;
module.exports.getPresetForRole = getPresetForRole;
