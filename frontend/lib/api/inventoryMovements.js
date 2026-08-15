import api from './client'

export const inventoryMovementApi = {
  list: (params) => api.get('/inventory-movements', { params }),
}
