import api from './client'

export const incapacidadApi = {
  getAll: (params) => api.get('/incapacidades', { params }),
  getById: (id) => api.get(`/incapacidades/${id}`),
  create: (data) => api.post('/incapacidades', data),
  update: (id, data) => api.put(`/incapacidades/${id}`, data),
  reincorporar: (id) => api.post(`/incapacidades/${id}/reincorporar`),
}
