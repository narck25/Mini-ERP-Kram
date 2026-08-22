import api from './client'

export const uniformApi = {
  // Inventario
  getInventory: (params) => api.get('/uniforms/inventory', { params }),
  addInventoryItem: (data) => api.post('/uniforms/inventory', data),
  updateInventoryItem: (id, data) => api.put(`/uniforms/inventory/${id}`, data),
  deleteInventoryItem: (id) => api.delete(`/uniforms/inventory/${id}`),
  restockInventoryItem: (id, cantidad) => api.post(`/uniforms/inventory/${id}/restock`, { cantidad }),

  // Entregas
  createDelivery: (data) => api.post('/uniforms/deliveries', data),
  getDeliveries: (params) => api.get('/uniforms/deliveries', { params }),
  getDeliveryById: (id) => api.get(`/uniforms/deliveries/${id}`),

  // Empleados disponibles para el selector de entrega
  getEmployeesForDelivery: () => api.get('/uniforms/employees'),

  // Historial por empleado
  getEmployeeHistory: (empleadoId) => api.get(`/uniforms/employees/${empleadoId}/history`),
}