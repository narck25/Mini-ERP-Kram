import api from './client'

export const statsApi = {
  // Estadísticas para RH
  getRHStats: () => api.get('/stats/rh'),

  // Estadísticas para jefes de departamento
  getDepartmentStats: () => api.get('/stats/department'),

  // Estadísticas del sistema (solo ADMIN)
  getSystemStats: () => api.get('/stats/system'),
}