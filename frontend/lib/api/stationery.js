import api from './client'

export const stationeryApi = {
  // Mis solicitudes (usuario)
  getMyRequests: () => api.get('/stationery/my'),
  createRequest: (data) => api.post('/stationery', data),
  cancelRequest: (id) => api.post(`/stationery/${id}/cancel`),

  // Gestión (Admin/Compras)
  getAllRequests: (params) => api.get('/stationery', { params }),
  getRequestById: (id) => api.get(`/stationery/${id}`),
  deliverRequest: (id) => api.post(`/stationery/${id}/deliver`),

  // Inventario
  getInventory: (params) => api.get('/stationery/inventory', { params }),
  addInventoryItem: (data) => api.post('/stationery/inventory', data),
  updateInventoryItem: (id, data) => api.put(`/stationery/inventory/${id}`, data),
  deleteInventoryItem: (id) => api.delete(`/stationery/inventory/${id}`),
}