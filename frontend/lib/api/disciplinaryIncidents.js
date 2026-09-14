import api from './client'

export const disciplinaryIncidentApi = {
  create: (formData) => api.post('/disciplinary-incidents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/disciplinary-incidents/${id}`, data),
  listByEmployee: (employeeId) => api.get(`/disciplinary-incidents/employee/${employeeId}`),
}
