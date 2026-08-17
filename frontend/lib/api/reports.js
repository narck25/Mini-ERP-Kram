import api from './client'

export const reportApi = {
  getEmpleados: (params) => api.get('/reports/empleados', { params }),
  getCompras: (params) => api.get('/reports/compras', { params }),
  getInventario: () => api.get('/reports/inventario'),
  getAsistencia: (params) => api.get('/reports/asistencia', { params }),
  getVacaciones: (params) => api.get('/reports/vacaciones', { params }),

  async exportXlsx(tipo, params = {}) {
    const res = await api.get(`/reports/${tipo}/export`, { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_${tipo}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
}
