/**
 * ⚠️ CONFIGURACIÓN DE FALLBACK VISUAL — NO USAR PARA LÓGICA DE NEGOCIO
 * 
 * La fuente primaria de roles es GET /api/roles (backend).
 * Esta configuración existe ÚNICAMENTE como fallback visual para cuando
 * la API no está disponible (desarrollo, red, etc.).
 * 
 * Reglas:
 * - No utilizar para lógica de negocio.
 * - No utilizar para control de acceso.
 * - No agregar nuevos roles aquí sin agregarlos también al backend.
 * - La fuente de verdad es backend/src/routes/roles.routes.js (SYSTEM_ROLES).
 * 
 * Para roles dinámicos (desde backend):
 * Usar getRolesFromApi() que consume GET /api/roles
 */

// Fallback visual — solo se usa cuando GET /api/roles falla
const ROLE_FALLBACK_CONFIG = {
  ADMIN: {
    name: 'Administrador',
    color: 'bg-purple-100 text-purple-800',
    description: 'Acceso total al sistema',
    icon: '👑',
    order: 0,
  },
  RH: {
    name: 'Recursos Humanos',
    color: 'bg-blue-100 text-blue-800',
    description: 'Gestión de personal y reclutamiento',
    icon: '👥',
    order: 1,
  },
  SISTEMAS: {
    name: 'Sistemas',
    color: 'bg-green-100 text-green-800',
    description: 'Soporte técnico y sistemas',
    icon: '💻',
    order: 2,
  },
  COMPRAS: {
    name: 'Compras',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Gestión de compras y proveedores',
    icon: '🛒',
    order: 3,
  },
  PRODUCCION: {
    name: 'Producción',
    color: 'bg-red-100 text-red-800',
    description: 'Gestión de producción',
    icon: '🏭',
    order: 4,
  },
  EMPLEADO_BASICO: {
    name: 'Empleado',
    color: 'bg-gray-100 text-gray-800',
    description: 'Acceso básico al sistema',
    icon: '👤',
    order: 5,
  },
};

/**
 * Obtiene el nombre legible de un rol
 * @param {string} role - Código del rol (ej. 'ADMIN')
 * @returns {string} Nombre legible
 */
export function getRoleName(role) {
  return ROLE_FALLBACK_CONFIG[role]?.name || role || 'Sin rol';
}

/**
 * Obtiene las clases de color para un rol
 * @param {string} role - Código del rol
 * @returns {string} Clases Tailwind para el color
 */
export function getRoleColor(role) {
  return ROLE_FALLBACK_CONFIG[role]?.color || 'bg-gray-100 text-gray-800';
}

/**
 * Obtiene el ícono de un rol
 * @param {string} role - Código del rol
 * @returns {string} Emoji del rol
 */
export function getRoleIcon(role) {
  return ROLE_FALLBACK_CONFIG[role]?.icon || '👤';
}

/**
 * Obtiene la descripción de un rol
 * @param {string} role - Código del rol
 * @returns {string} Descripción del rol
 */
export function getRoleDescription(role) {
  return ROLE_FALLBACK_CONFIG[role]?.description || '';
}

/**
 * Obtiene todos los roles disponibles ordenados
 * @returns {Array} Array de objetos { id, name, color, description, icon }
 */
export function getAllRoles() {
  return Object.entries(ROLE_FALLBACK_CONFIG)
    .map(([id, config]) => ({
      id,
      ...config,
    }))
    .sort((a, b) => a.order - b.order);
}

/**
 * Obtiene los roles desde el backend (100% dinámico)
 * @returns {Promise<Array>} Array de roles desde la API
 */
export async function getRolesFromApi() {
  try {
    const { systemApi } = await import('@/lib/api');
    const response = await systemApi.getRoles();
    return response.data.roles || [];
  } catch (error) {
    console.warn('⚠️ No se pudieron obtener roles desde la API, usando configuración local:', error.message);
    return getAllRoles();
  }
}

/**
 * Obtiene los módulos desde el backend (100% dinámico)
 * @returns {Promise<Array>} Array de módulos desde la API
 */
export async function getModulesFromApi() {
  try {
    const { systemApi } = await import('@/lib/api');
    const response = await systemApi.getModules();
    return response.data.modules || [];
  } catch (error) {
    console.warn('⚠️ No se pudieron obtener módulos desde la API:', error.message);
    return [];
  }
}

export default ROLE_FALLBACK_CONFIG;
