'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { incapacidadApi, employeeApi, employeeDocumentApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

const TIPOS = [
  { value: 'ENFERMEDAD_GENERAL', label: 'Enfermedad General' },
  { value: 'RIESGO_TRABAJO', label: 'Riesgo de Trabajo' },
  { value: 'MATERNIDAD', label: 'Maternidad' },
];

const SUBTIPOS_RIESGO = [
  { value: 'ACCIDENTE_TRABAJO', label: 'Accidente de Trabajo' },
  { value: 'ACCIDENTE_TRAYECTO', label: 'Accidente en Trayecto' },
  { value: 'ENFERMEDAD_TRABAJO', label: 'Enfermedad de Trabajo' },
];

const TIPO_TEXT = { ENFERMEDAD_GENERAL: 'Enfermedad General', RIESGO_TRABAJO: 'Riesgo de Trabajo', MATERNIDAD: 'Maternidad' };
const SUBTIPO_TEXT = { ACCIDENTE_TRABAJO: 'Accidente de Trabajo', ACCIDENTE_TRAYECTO: 'Accidente en Trayecto', ENFERMEDAD_TRABAJO: 'Enfermedad de Trabajo' };
const ESTATUS_BADGES = { ACTIVA: 'bg-red-100 text-red-800', REINCORPORADO: 'bg-green-100 text-green-800' };

const fmt = (iso) => (iso ? new Date(iso).toISOString().substring(0, 10).split('-').reverse().join('/') : '—');
const nombre = (e) => [e?.nombres, e?.apellidoPaterno].filter(Boolean).join(' ') || '—';

export default function IncapacidadesPage() {
  const [employees, setEmployees] = useState([]);
  const [incapacidades, setIncapacidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [form, setForm] = useState({ employeeId: '', tipo: 'ENFERMEDAD_GENERAL', subtipoRiesgo: '', fechaInicio: '', fechaFin: '', folioIncapacidad: '', observaciones: '' });
  const [archivo, setArchivo] = useState(null);

  const fetchEmployees = async () => {
    try {
      const res = await employeeApi.getAll({ estatus: 'Activo', limit: 500 });
      const list = res.data?.employees || [];
      setEmployees(Array.isArray(list) ? list : []);
    } catch (e) { console.error(e); }
  };

  const fetchIncapacidades = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filter) params.estatus = filter;
      if (search) params.search = search;
      const res = await incapacidadApi.getAll(params);
      setIncapacidades(res.data?.data || []);
      setPagination(res.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) { toast.error('Error al cargar incapacidades'); }
    finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Debounce sobre el efecto, no sobre el handler del input: así el timeout
  // siempre dispara con el cierre (closure) más reciente de fetchIncapacidades
  // (que ya trae el valor de búsqueda actual), en vez de capturar uno viejo
  // y pisar el resultado correcto con uno de un caracter atrás.
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchIncapacidades(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchIncapacidades]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchIncapacidades(newPage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.fechaInicio || !form.fechaFin) { toast.error('Selecciona empleado y fechas'); return; }
    if (form.fechaFin < form.fechaInicio) { toast.error('La fecha de fin no puede ser anterior a la de inicio'); return; }
    if (form.tipo === 'RIESGO_TRABAJO' && !form.subtipoRiesgo) { toast.error('Indica el subtipo de Riesgo de Trabajo'); return; }
    try {
      setSubmitting(true);
      let documentoId;
      if (archivo) {
        const formData = new FormData();
        formData.append('tipo_documento', 'Comprobante de Incapacidad');
        formData.append('document', archivo);
        const docRes = await employeeDocumentApi.create(form.employeeId, formData);
        documentoId = docRes.data?.document?.id;
      }
      const subtipoRiesgo = form.tipo === 'RIESGO_TRABAJO' ? form.subtipoRiesgo : undefined;
      await incapacidadApi.create({ ...form, subtipoRiesgo, documentoId });
      toast.success('Incapacidad registrada');
      setForm({ employeeId: '', tipo: 'ENFERMEDAD_GENERAL', subtipoRiesgo: '', fechaInicio: '', fechaFin: '', folioIncapacidad: '', observaciones: '' });
      setArchivo(null);
      fetchIncapacidades(1);
    } catch (e) { toast.error(e.response?.data?.error || 'Error al registrar'); }
    finally { setSubmitting(false); }
  };

  const handleDownloadComprobante = async (documentId, fileName) => {
    try {
      const res = await employeeDocumentApi.download(documentId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'comprobante');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) { toast.error('Error al descargar el comprobante'); }
  };

  const handleReincorporar = async (id) => {
    try {
      await incapacidadApi.reincorporar(id);
      toast.success('Empleado reincorporado');
      fetchIncapacidades(pagination.page);
    } catch (e) { toast.error(e.response?.data?.error || 'Error al reincorporar'); }
  };

  return (
    <ProtectedRoute requiredModule="EMPLEADOS" allowedRoles={['ADMIN', 'RH']} redirectTo="/dashboard/mi-espacio">
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Incapacidades</h1>
            <p className="text-gray-600">Registra y da seguimiento a las incapacidades del personal</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nueva incapacidad</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                  <option value="">Selecciona empleado</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{nombre(emp)} ({emp.clave || '—'})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value, subtipoRiesgo: e.target.value === 'RIESGO_TRABAJO' ? form.subtipoRiesgo : '' })} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {form.tipo === 'RIESGO_TRABAJO' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtipo de Riesgo</label>
                  <select value={form.subtipoRiesgo} onChange={(e) => setForm({ ...form, subtipoRiesgo: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                    <option value="">Selecciona subtipo</option>
                    {SUBTIPOS_RIESGO.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Folio IMSS</label>
                <input type="text" value={form.folioIncapacidad} onChange={(e) => setForm({ ...form, folioIncapacidad: e.target.value })} placeholder="Folio de incapacidad" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
                <input type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de fin</label>
                <input type="date" value={form.fechaFin} min={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <input type="text" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} placeholder="Notas" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comprobante (opcional)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => setArchivo(e.target.files?.[0] || null)} className="w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50">
                  {submitting ? 'Registrando...' : 'Registrar incapacidad'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Incapacidades registradas</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre de empleado"
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
                />
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">Todas</option>
                  <option value="ACTIVA">Activas</option>
                  <option value="REINCORPORADO">Reincorporados</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-500">Cargando...</div>
            ) : incapacidades.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">No hay incapacidades registradas.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio IMSS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comprobante</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {incapacidades.map((inc) => (
                      <tr key={inc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{nombre(inc.empleado)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {TIPO_TEXT[inc.tipo] || inc.tipo}
                          {inc.subtipoRiesgo && (
                            <span className="block text-xs text-gray-500">{SUBTIPO_TEXT[inc.subtipoRiesgo] || inc.subtipoRiesgo}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{fmt(inc.fechaInicio)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{fmt(inc.fechaFin)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{inc.folioIncapacidad || '—'}</td>
                        <td className="px-6 py-4 text-sm">
                          {inc.documento ? (
                            <button onClick={() => handleDownloadComprobante(inc.documento.id, inc.documento.nombre_archivo)} className="text-blue-600 hover:underline">
                              Ver comprobante
                            </button>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${ESTATUS_BADGES[inc.estatus] || 'bg-gray-100 text-gray-800'}`}>
                            {inc.estatus === 'ACTIVA' ? 'Activa' : 'Reincorporado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {inc.estatus === 'ACTIVA' && (
                            <button onClick={() => handleReincorporar(inc.id)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium">
                              Reincorporar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Anterior
                </button>
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de{' '}
                    <span className="font-medium">{pagination.total}</span> incapacidades
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      <span className="sr-only">Primera</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      <span className="sr-only">Anterior</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                      .map((p, idx, arr) => (
                        <span key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
                          )}
                          <button onClick={() => handlePageChange(p)} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${p === pagination.page ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                            {p}
                          </button>
                        </span>
                      ))}
                    <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      <span className="sr-only">Siguiente</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      <span className="sr-only">Última</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
