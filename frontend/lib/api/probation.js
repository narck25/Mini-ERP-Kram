import api from './client'

export const probationApi = {
  listAll: () => api.get('/probation-evaluations'),
  getPendingForJefe: () => api.get('/probation-evaluations/pending-for-jefe'),
  capture: (id, data) => api.post(`/probation-evaluations/${id}/capture`, data),
}
