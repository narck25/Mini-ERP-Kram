import api from './client'

export const vacancyApi = {
  // CRUD de vacantes
  getAll: (params) => api.get('/vacancies', { params }),
  getById: (id) => api.get(`/vacancies/${id}`),
  create: (data) => api.post('/vacancies', data),
  update: (id, data) => api.put(`/vacancies/${id}`, data),

  // Vacantes del usuario actual
  getMyVacancies: () => api.get('/vacancies/my'),

  // Aprobación de vacantes (RH)
  approve: (id, data) => api.put(`/vacancies/${id}/approve`, data),
  close: (id) => api.put(`/vacancies/${id}/close`),

  // Estadísticas
  getStats: () => api.get('/vacancies/stats'),

  // Actividades
  getActivities: (id) => api.get(`/vacancies/${id}/activities`),
  createActivity: (id, data) => api.post(`/vacancies/${id}/activities`, data),
  updateActivity: (id, data) => api.put(`/activities/${id}`, data),
}