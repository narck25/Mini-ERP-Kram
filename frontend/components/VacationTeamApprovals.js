'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { vacationApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

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

export default function VacationTeamApprovals() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await vacationApi.getPendingForJefe();
      setPending(res.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.accessibleModules?.includes('VACACIONES')) {
      fetchPending();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAuthorize = async (id) => {
    try {
      await vacationApi.authorizeByJefe(id);
      toast.success('Solicitud autorizada');
      fetchPending();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al autorizar');
    }
  };

  const handleReject = async (id) => {
    try {
      await vacationApi.reject(id);
      toast.success('Solicitud rechazada');
      fetchPending();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al rechazar');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Solicitudes de mi equipo</h2>
      </div>
      {loading ? (
        <div className="px-6 py-8 text-center text-gray-500">Cargando...</div>
      ) : pending.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500">No tienes solicitudes pendientes de autorizar.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pending.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{nombreEmpleado(r.empleado)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatDate(r.fechaInicio)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatDate(r.fechaFin)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{calcDias(r.fechaInicio, r.fechaFin)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleAuthorize(r.id)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium">
                        Autorizar
                      </button>
                      <button onClick={() => handleReject(r.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium">
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
