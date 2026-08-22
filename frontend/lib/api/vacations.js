import api from './client'

export const vacationApi = {
  // Autoservicio
  getMyRequests: () => api.get('/vacations/my'),
  getBalance: () => api.get('/vacations/balance'),
  createRequest: (data) => api.post('/vacations', data),
  cancelRequest: (id) => api.post(`/vacations/${id}/cancel`),

  // Jefe directo
  getPendingForJefe: () => api.get('/vacations/pending-for-jefe'),
  authorizeByJefe: (id, comentario) => api.post(`/vacations/${id}/authorize-jefe`, { comentario }),

  // Gestión (Admin/RH)
  getAllRequests: (params) => api.get('/vacations', { params }),
  getAllBalances: () => api.get('/vacations/balances'),
  getById: (id) => api.get(`/vacations/${id}`),
  approve: (id, comentario) => api.post(`/vacations/${id}/approve`, { comentario }),
  reject: (id, comentario) => api.post(`/vacations/${id}/reject`, { comentario }),
}
