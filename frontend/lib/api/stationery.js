import api from './client'

export const stationeryApi = {
  // Mis solicitudes (usuario)
  getMyRequests: () => api.get('/stationery/my'),
  createRequest: (data) => api.post('/stationery', data),
  cancelRequest: (id) => api.post(`/stationery/${id}/cancel`),
  closeRequest: (id) => api.post(`/stationery/${id}/close`),

  // Gestión (Admin/Compras)
  getAllRequests: (params) => api.get('/stationery', { params }),
  getRequestById: (id) => api.get(`/stationery/${id}`),
  // entregas: [{ itemId, cantidad }] con lo que se entrega en esta ronda
  deliverRequest: (id, entregas) => api.post(`/stationery/${id}/deliver`, { entregas }),

  // Comentarios
  getComments: (id) => api.get(`/stationery/${id}/comments`),
  addComment: (id, mensaje) => api.post(`/stationery/${id}/comments`, { mensaje }),

  // Inventario
  getInventory: (params) => api.get('/stationery/inventory', { params }),
  addInventoryItem: (data) => api.post('/stationery/inventory', data),
  updateInventoryItem: (id, data) => api.put(`/stationery/inventory/${id}`, data),
  deleteInventoryItem: (id) => api.delete(`/stationery/inventory/${id}`),
  restockInventoryItem: (id, cantidad) => api.post(`/stationery/inventory/${id}/restock`, { cantidad }),
}