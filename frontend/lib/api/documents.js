import api from './client'

export const employeeDocumentApi = {
  // CRUD de documentos
  getAll: (employeeId) => api.get(`/employee/${employeeId}/documents`),
  create: (employeeId, formData) => api.post(`/employee/${employeeId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (documentId) => api.delete(`/employee-documents/${documentId}`),

  // Tipos de documentos permitidos
  getAllowedTypes: () => api.get('/employee-documents/allowed-types'),
}