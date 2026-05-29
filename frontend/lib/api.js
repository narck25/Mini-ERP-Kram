import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
}

export const healthApi = {
  check: () => api.get('/health'),
}

// Módulo de Empleados (RH)
export const employeeApi = {
  // CRUD de empleados
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  
  // Importación/Exportación
  import: (formData) => {
    // En producción, enviar DIRECTAMENTE al backend HTTPS para evitar problemas con el proxy de Next.js
    // con multipart/form-data. NO usar NEXT_PUBLIC_API_URL porque apunta a http://backend:3001 (interno Docker).
    // En desarrollo, usar el proxy normal (/api).
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    const baseURL = isProduction 
      ? 'https://apierp.kramhub.site' 
      : '/api';
    
    return axios.post(`${baseURL}/api/employees/import`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  export: (params) => api.get('/employees/export', { 
    params,
    responseType: 'blob'
  }),
  downloadTemplate: () => api.get('/employees/template', {
    responseType: 'blob'
  }),
  
  // Estadísticas
  getStats: () => api.get('/employees/stats'),
  
  // Departamentos
  getDepartments: () => api.get('/departments'),
  
  // Empleado actual (para usuarios regulares)
  getCurrent: () => api.get('/employees/me'),
}

// Módulo de Vacantes Originales (Sistemas/Compras)
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

// Módulo de Reclutamiento Colaborativo (RH)
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

// Módulo de Documentos de Empleados
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

// Módulo de Estadísticas
export const statsApi = {
  // Estadísticas para RH
  getRHStats: () => api.get('/stats/rh'),
  
  // Estadísticas para jefes de departamento
  getDepartmentStats: () => api.get('/stats/department'),
  
  // Estadísticas del sistema (solo ADMIN)
  getSystemStats: () => api.get('/stats/system'),
}

// Módulo de Permisos y Accesos
export const permissionApi = {
  // Obtener todos los usuarios con sus permisos (solo ADMIN y RH)
  getAllUsersWithPermissions: () => api.get('/permissions/users'),
  
  // Obtener módulos disponibles
  getAvailableModules: () => api.get('/permissions/modules'),
  
  // Actualizar permisos de un usuario
  updateUserPermissions: (userId, accessibleModules) => 
    api.put(`/permissions/users/${userId}`, { accessibleModules }),
  
  // Obtener permisos del usuario actual
  getCurrentUserPermissions: () => api.get('/permissions/me'),
}

export default api
