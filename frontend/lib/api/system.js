import api from './client'

export const systemApi = {
  // Obtener todos los roles disponibles
  getRoles: () => api.get('/roles'),

  // Crear un nuevo rol personalizado
  createRole: (roleData) => api.post('/roles', roleData),

  // Actualizar un rol personalizado
  updateRole: (roleId, roleData) => api.put(`/roles/${roleId}`, roleData),

  // Eliminar un rol personalizado
  deleteRole: (roleId) => api.delete(`/roles/${roleId}`),

  // Obtener todos los módulos disponibles
  getModules: () => api.get('/modules'),

  // Obtener presets de módulos por rol
  getRolePresets: () => api.get('/roles/presets'),
}