'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { vacationApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import VacationTeamApprovals from '@/components/VacationTeamApprovals';

const ESTATUS_BADGES = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  AUTORIZADA: 'bg-blue-100 text-blue-800',
  APROBADA: 'bg-green-100 text-green-800',
  RECHAZADA: 'bg-red-100 text-red-800',
  CANCELADA: 'bg-gray-100 text-gray-800',
};

const ESTATUS_TEXT = {
  PENDIENTE: 'Pendiente',
  AUTORIZADA: 'Autorizada por jefe',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
};

// Extrae la fecha sin zona horaria para evitar el "bug del día anterior".
function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.substring(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function calcDias(inicio, fin) {
  if (!inicio || !fin) return 0;
  const a = new Date(inicio.substring(0, 10));
  const b = new Date(fin.substring(0, 10));
  return Math.max(0, Math.round((b - a) / 86400000) + 1);
}

export default function MisVacacionesPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [form, setForm] = useState({ fechaInicio: '', fechaFin: '', motivo: '' });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await vacationApi.getMyRequests();
      setRequests(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar tus solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await vacationApi.getBalance();
      setBalance(res.data?.data || null);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (user?.accessibleModules?.includes('VACACIONES')) {
      fetchRequests();
      fetchBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fechaInicio || !form.fechaFin) {
      toast.error('Selecciona la fecha de inicio y de fin');
      return;
    }
    if (form.fechaFin < form.fechaInicio) {
      toast.error('La fecha de fin no puede ser anterior a la de inicio');
      return;
    }
    try {
      setSubmitting(true);
      await vacationApi.createRequest(form);
      toast.success('Solicitud de vacaciones enviada');
      setForm({ fechaInicio: '', fechaFin: '', motivo: '' });
      fetchRequests();
      fetchBalance();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await vacationApi.cancelRequest(id);
      toast.success('Solicitud cancelada');
      setConfirmingId(null);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cancelar');
    }
  };

  return (
    <ProtectedRoute requiredModule="VACACIONES" redirectTo="/dashboard/mi-espacio">
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Mis Vacaciones</h1>
            <p className="text-gray-600">Solicita y consulta tus periodos de vacaciones</p>
          </div>

          {balance && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-blue-600">Días disponibles</p>
                <p className="text-2xl font-bold text-blue-800">{balance.diasDisponibles}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Corresponden</p>
                <p className="text-lg font-semibold text-gray-800">{balance.diasCorresponden}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Usados</p>
                <p className="text-lg font-semibold text-gray-800">{balance.diasUsados}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Antigüedad</p>
                <p className="text-lg font-semibold text-gray-800">{balance.antiguedad} año(s)</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nueva solicitud</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
                <input
                  type="date"
                  value={form.fechaInicio}
                  onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de fin</label>
                <input
                  type="date"
                  value={form.fechaFin}
                  min={form.fechaInicio}
                  onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  placeholder="Notas adicionales"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
                >
                  {submitting ? 'Enviando...' : 'Solicitar vacaciones'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Mis solicitudes</h2>
            </div>
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-500">Cargando...</div>
            ) : requests.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">No tienes solicitudes de vacaciones.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{formatDate(r.fechaInicio)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatDate(r.fechaFin)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{calcDias(r.fechaInicio, r.fechaFin)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{r.motivo || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${ESTATUS_BADGES[r.estatus] || 'bg-gray-100 text-gray-800'}`}>
                            {ESTATUS_TEXT[r.estatus] || r.estatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {r.estatus === 'PENDIENTE' && (
                            confirmingId === r.id ? (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => handleCancel(r.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">
                                  Confirmar
                                </button>
                                <button onClick={() => setConfirmingId(null)} className="text-gray-500 hover:text-gray-700 text-sm">
                                  No
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmingId(r.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">
                                Cancelar
                              </button>
                            )
                          )}
                          {r.estatus !== 'PENDIENTE' && r.comentarioAprobacion && (
                            <span className="text-xs text-gray-500" title={r.comentarioAprobacion}>💬</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <VacationTeamApprovals />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
