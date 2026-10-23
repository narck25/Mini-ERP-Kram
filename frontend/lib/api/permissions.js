import api from './client'

export const permissionApi = {
  // Obtener todos los usuarios con sus permisos (solo ADMIN y RH)
  getAllUsersWithPermissions: (params) => api.get('/permissions/users', { params }),

  // Obtener módulos disponibles
  getAvailableModules: () => api.get('/permissions/modules'),

  // Actualizar permisos de un usuario (y opcionalmente el rol)
  updateUserPermissions: (userId, accessibleModules, role) =>
    api.put(`/permissions/users/${userId}`, { accessibleModules, role }),

  // Obtener permisos del usuario actual
  getCurrentUserPermissions: () => api.get('/permissions/me'),
}