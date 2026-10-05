import api from './client'

// Módulo de Tickets de TI — mismo molde plano que stationery.js.
export const ticketApi = {
  create: (formData) => api.post('/tickets', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMy: () => api.get('/tickets/my'),
  getAll: (params) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  updateStatus: (id, estatus) => api.patch(`/tickets/${id}/status`, { estatus }),
  assign: (id, asignadoId) => api.patch(`/tickets/${id}/assign`, { asignadoId }),
  cancel: (id) => api.post(`/tickets/${id}/cancel`),
  addAttachments: (id, formData) => api.post(`/tickets/${id}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getComments: (id) => api.get(`/tickets/${id}/comments`),
  addComment: (id, mensaje) => api.post(`/tickets/${id}/comments`, { mensaje }),
}
