import api from './client'
import axios from 'axios'

export const employeeApi = {
  // CRUD de empleados
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),

  // Importación/Exportación
  import: (formData) => {
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    const baseURL = isProduction
      ? 'https://apierp.kramhub.site/api'
      : '/api'

    return axios.post(`${baseURL}/employees/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
  },

  export: (params) => api.get('/employees/export', {
    params,
    responseType: 'blob'
  }),
  downloadTemplate: () => api.get('/employees/template', {
    responseType: 'blob'
  }),

  // Estadísticas
  getStats: () => api.get('/employees/stats'),

  // Departamentos
  getDepartments: () => api.get('/departments'),

  // Empleado actual (para usuarios regulares)
  getCurrent: () => api.get('/employees/me'),

  // Historial de sueldos
  getSalaryHistory: (id) => api.get(`/employees/${id}/salary-history`),
}