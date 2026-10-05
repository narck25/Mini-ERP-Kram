'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ticketApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { getStatusColor, getStatusText, getCategoriaLabel, getPrioridadColor, getPrioridadText, formatDate } from '@/utils/ticketHelpers';

const ABIERTOS = ['ABIERTO', 'EN_PROCESO', 'EN_ESPERA'];

export default function MisTicketsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('abiertos');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await ticketApi.getMy();
      setTickets(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar tus tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user || !user.accessibleModules?.includes('TICKETS')) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">No tiene acceso al módulo de Tickets de TI.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const abiertos = tickets.filter((t) => ABIERTOS.includes(t.estatus));
  const historial = tickets.filter((t) => !ABIERTOS.includes(t.estatus));
  const visibles = tab === 'abiertos' ? abiertos : historial;

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Tickets a TI</h1>
            <p className="text-gray-600">Reportes y solicitudes que has hecho al área de Sistemas</p>
          </div>
          <button
            onClick={() => router.push('/ti/nuevo-ticket')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
          >
            + Nuevo ticket
          </button>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-6">
            <button
              onClick={() => setTab('abiertos')}
              className={`pb-2 px-1 text-sm font-medium border-b-2 ${tab === 'abiertos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Abiertos ({abiertos.length})
            </button>
            <button
              onClick={() => setTab('historial')}
              className={`pb-2 px-1 text-sm font-medium border-b-2 ${tab === 'historial' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Historial
            </button>
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="px-6 py-8 text-center text-gray-500">Cargando...</div>
          ) : visibles.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              {tab === 'abiertos' ? 'No tienes tickets abiertos.' : 'No tienes tickets en tu historial.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asunto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estatus</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visibles.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{t.folio}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{t.asunto}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{getCategoriaLabel(t.categoria)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPrioridadColor(t.prioridad)}`}>
                          {getPrioridadText(t.prioridad)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(t.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(t.estatus)}`}>
                          {getStatusText(t.estatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => router.push(`/ti/mis-tickets/${t.id}`)}
                          className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium"
                        >
                          Ver detalle
                        </button>
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
  );
}
