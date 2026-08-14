/**
 * Configuración centralizada de Módulos del Sistema
 * 
 * Única fuente de verdad para todos los módulos disponibles en el ERP.
 * 
 * Para agregar un nuevo módulo:
 * 1. Agregarlo aquí con su key, label y enabled
 * 2. El backend (PermissionController, GET /api/modules) lo usará automáticamente
 * 3. El frontend (Gestión de Accesos) lo consumirá desde la API
 * 
 * NOTA: No olvidar agregar el módulo al enum ModuleType en schema.prisma
 *       si se requiere persistencia en la base de datos.
 */

const MODULES_CONFIG = {
  EMPLEADOS: {
    key: 'EMPLEADOS',
    label: 'Empleados',
    description: 'Gestión de empleados y expedientes',
    enabled: true
  },
  RECLUTAMIENTO: {
    key: 'RECLUTAMIENTO',
    label: 'Reclutamiento',
    description: 'Gestión de vacantes y candidatos',
    enabled: true
  },
  VACACIONES: {
    key: 'VACACIONES',
    label: 'Vacaciones',
    description: 'Solicitud y aprobación de vacaciones',
    enabled: false
  },
  INCIDENCIAS: {
    key: 'INCIDENCIAS',
    label: 'Incidencias',
    description: 'Reporte y seguimiento de incidencias',
    enabled: true
  },
  CONFIGURACION: {
    key: 'CONFIGURACION',
    label: 'Configuración',
    description: 'Configuración del sistema',
    enabled: true
  },
  REPORTES: {
    key: 'REPORTES',
    label: 'Reportes',
    description: 'Generación de reportes y estadísticas',
    enabled: false
  },
  COMPRAS: {
    key: 'COMPRAS',
    label: 'Compras',
    description: 'Gestión de compras',
    enabled: true
  }
};

/**
 * Obtiene los keys de todos los módulos habilitados
 * @returns {string[]} Array de keys de módulos activos
 */
function getEnabledModuleKeys() {
  return Object.values(MODULES_CONFIG)
    .filter(m => m.enabled)
    .map(m => m.key);
}

/**
 * Obtiene todos los módulos como array (para respuestas API)
 * @returns {Array} Array de objetos módulo
 */
function getModulesArray() {
  return Object.values(MODULES_CONFIG)
    .filter(m => m.enabled)
    .map(m => ({
      id: m.key,
      name: m.label,
      description: m.description
    }));
}

module.exports = MODULES_CONFIG;
module.exports.getEnabledModuleKeys = getEnabledModuleKeys;
module.exports.getModulesArray = getModulesArray;
