import api from './client'

export const attendanceApi = {
  // Mi propia asistencia (autoservicio, no requiere módulo INCIDENCIAS).
  // Nota: el router de asistencia está montado en /api/incidencias, no /api/attendance.
  getMy: (startDate, endDate) => api.get('/incidencias/my', { params: { startDate, endDate } }),
}
