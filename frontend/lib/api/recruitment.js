import api from './client'

export const recruitmentApi = {
  // CRUD de vacantes colaborativas
  getAll: (params) => api.get('/recruitment/vacancies', { params }),
  getById: (id) => api.get(`/recruitment/vacancies/${id}`),
  create: (data) => api.post('/recruitment/vacancies', data),
  update: (id, data) => api.put(`/recruitment/vacancies/${id}`, data),

  // Vacantes del usuario actual
  getMyVacancies: () => api.get('/recruitment/my-vacancies'),

  // Aprobación de vacantes (RH)
  approve: (id) => api.put(`/recruitment/vacancies/${id}/approve`),
  close: (id) => api.put(`/recruitment/vacancies/${id}/close`),

  // Estadísticas
  getStats: () => api.get('/recruitment/vacancies/stats'),

  // Candidatos
  getCandidates: (vacancyId) => api.get(`/recruitment/vacancies/${vacancyId}/candidates`),
  createCandidate: (vacancyId, formData) => api.post(`/recruitment/vacancies/${vacancyId}/candidates`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateCandidateObservations: (candidateId, data) => api.put(`/recruitment/candidates/${candidateId}/observations`, data),
  voteCandidate: (candidateId, data) => api.put(`/recruitment/candidates/${candidateId}/vote`, data),
  selectCandidate: (candidateId) => api.put(`/recruitment/candidates/${candidateId}/select`),
  getCandidateCV: (candidateId) => api.get(`/recruitment/candidates/${candidateId}/cv`, {
    responseType: 'blob'
  }),

  // Comentarios
  getComments: (vacancyId) => api.get(`/recruitment/vacancies/${vacancyId}/comments`),
  createComment: (vacancyId, data) => api.post(`/recruitment/vacancies/${vacancyId}/comments`, data),

  // Perfil técnico
  updateTechnicalProfile: (vacancyId, data) => api.put(`/recruitment/vacancies/${vacancyId}/technical-profile`, data),
}