import api from './client'

export const operationalEvaluationApi = {
  listAll: () => api.get('/operational-evaluations'),
  getPendingForJefe: () => api.get('/operational-evaluations/pending-for-jefe'),
  getCriteriaTemplates: () => api.get('/operational-evaluations/criteria-templates'),
  capture: (id, data) => api.post(`/operational-evaluations/${id}/capture`, data),
  getById: (id) => api.get(`/operational-evaluations/${id}`),
}
