import api from './client'

export const hrAuditApi = {
  getByEmployee: (employeeId) => api.get(`/hr-audit/employee/${employeeId}`),
}
