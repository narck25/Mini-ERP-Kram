'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { vacationApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

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

function nombreEmpleado(emp) {
  if (!emp) return '—';
  return [emp.nombres, emp.apellidoPaterno].filter(Boolean).join(' ');
}

export default function VacacionesPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState('solicitudes');
  const [balances, setBalances] = useState([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balanceSearch, setBalanceSearch] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = filter ? { estatus: filter } : {};
      const res = await vacationApi.getAllRequests(params);
      setRequests(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalances = async () => {
    try {
      setBalancesLoading(true);
      const res = await vacationApi.getAllBalances();
      setBalances(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar el saldo de empleados');
    } finally {
      setBalancesLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    if (tab === 'saldos') fetchBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleApprove = async (id) => {
    try {
      await vacationApi.approve(id);
      toast.success('Solicitud aprobada');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al aprobar');
    }
  };

  const handleReject = async (id) => {
    try {
      await vacationApi.reject(id);
      toast.success('Solicitud rechazada');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al rechazar');
    }
  };

  const filteredBalances = balances.filter((b) => {
    if (!balanceSearch) return true;
    const q = balanceSearch.toLowerCase();
    return (
      (b.nombreCompleto || '').toLowerCase().includes(q) ||
      (b.clave || '').toLowerCase().includes(q)
    );
  });

  return (
    <ProtectedRoute requiredModule="VACACIONES" allowedRoles={['ADMIN', 'RH']} redirectTo="/dashboard/mi-espacio">
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Vacaciones</h1>
            <p className="text-gray-600">Aprueba solicitudes y consulta el saldo de vacaciones del personal</p>
          </div>

          <div className="mb-6 border-b border-gray-200">
            <nav className="flex gap-6">
              <button
                onClick={() => setTab('solicitudes')}
                className={`pb-2 px-1 text-sm font-medium border-b-2 ${tab === 'solicitudes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Solicitudes
              </button>
              <button
                onClick={() => setTab('saldos')}
                className={`pb-2 px-1 text-sm font-medium border-b-2 ${tab === 'saldos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Saldo por empleado
              </button>
            </nav>
          </div>

          {tab === 'solicitudes' && (
          <div className="mb-6 flex justify-end">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="AUTORIZADA">Autorizadas (por jefe)</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="APROBADA">Aprobadas</option>
              <option value="RECHAZADA">Rechazadas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </div>
          )}

          {tab === 'solicitudes' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-500">Cargando...</div>
            ) : requests.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">No hay solicitudes de vacaciones.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
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
                        <td className="px-6 py-4 text-sm text-gray-900">{nombreEmpleado(r.empleado)}</td>
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
                          <div className="flex items-center justify-end gap-2">
                          <Link href={`/vacaciones/solicitud/${r.id}`} className="text-blue-600 hover:text-blue-800" title="Imprimir solicitud">🖨️</Link>
                          {r.estatus === 'AUTORIZADA' && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleApprove(r.id)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleReject(r.id)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
                              >
                                Rechazar
                              </button>
                            </div>
                          )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}

          {tab === 'saldos' && (
            <>
              <div className="mb-6 flex justify-end">
                <input
                  type="text"
                  value={balanceSearch}
                  onChange={(e) => setBalanceSearch(e.target.value)}
                  placeholder="Buscar por nombre o número de empleado"
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-80"
                />
              </div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {balancesLoading ? (
                  <div className="px-6 py-8 text-center text-gray-500">Cargando...</div>
                ) : filteredBalances.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">No hay empleados activos.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Núm.</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departamento</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Puesto</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Antigüedad</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Corresponden</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Usados</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Disponibles</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredBalances.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{b.clave || '—'}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{b.nombreCompleto}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{b.departamento || '—'}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{b.puesto || '—'}</td>
                            <td className="px-6 py-4 text-sm text-center text-gray-900">{b.antiguedad} años</td>
                            <td className="px-6 py-4 text-sm text-center text-gray-900">{b.diasCorresponden}</td>
                            <td className="px-6 py-4 text-sm text-center text-gray-900">{b.diasUsados}</td>
                            <td className="px-6 py-4 text-sm text-center">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${b.diasDisponibles > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                {b.diasDisponibles}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
