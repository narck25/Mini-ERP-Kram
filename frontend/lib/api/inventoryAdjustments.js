import api from './client'

export const inventoryAdjustmentApi = {
  create: (data) => api.post('/inventory-adjustments', data),
  list: (params) => api.get('/inventory-adjustments', { params }),
  approve: (id) => api.post(`/inventory-adjustments/${id}/approve`),
  reject: (id, comentario) => api.post(`/inventory-adjustments/${id}/reject`, { comentario }),
}
