'use client';

import { useState, useEffect } from 'react';
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
  const [form, setForm] = useState({ employeeId: '', tipo: 'ENFERMEDAD_GENERAL', subtipoRiesgo: '', fechaInicio: '', fechaFin: '', folioIncapacidad: '', observaciones: '' });
  const [archivo, setArchivo] = useState(null);

  const fetchEmployees = async () => {
    try {
      const res = await employeeApi.getAll({ estatus: 'Activo', limit: 500 });
      const list = res.data?.employees || [];
      setEmployees(Array.isArray(list) ? list : []);
    } catch (e) { console.error(e); }
  };

  const fetchIncapacidades = async () => {
    try {
      setLoading(true);
      const params = filter ? { estatus: filter } : {};
      const res = await incapacidadApi.getAll(params);
      setIncapacidades(res.data?.data || []);
    } catch (e) { toast.error('Error al cargar incapacidades'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchEmployees();
    fetchIncapacidades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

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
      fetchIncapacidades();
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
      fetchIncapacidades();
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
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Incapacidades registradas</h2>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">Todas</option>
                <option value="ACTIVA">Activas</option>
                <option value="REINCORPORADO">Reincorporados</option>
              </select>
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
