'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SistemasProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { ticketApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { getStatusColor, getStatusText, getCategoriaLabel, getPrioridadColor, getPrioridadText, formatDate } from '@/utils/ticketHelpers';

const ESTATUS_OPTIONS = ['ABIERTO', 'EN_PROCESO', 'EN_ESPERA', 'RESUELTO', 'CERRADO', 'CANCELADO'];
const CATEGORIA_OPTIONS = ['PROBLEMA_TECNICO', 'SOLICITUD_INFORME', 'SOLICITUD_ACCESO', 'SOLICITUD_EQUIPO', 'OTRO'];
const PRIORIDAD_OPTIONS = ['URGENTE', 'ALTA', 'MEDIA', 'BAJA'];

function TicketsTIQueueContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [takingId, setTakingId] = useState(null);
  const [stats, setStats] = useState({ abiertos: 0, enProceso: 0, resueltosEsteMes: 0, total: 0 });

  // Estadísticas de la cola completa — independientes de la paginación/
  // filtros de la tabla (si se calcularan sobre `tickets` ya paginados,
  // solo reflejarían la página actual en vez del total real).
  const fetchStats = async () => {
    try {
      const res = await ticketApi.getStats();
      setStats(res.data?.data || { abiertos: 0, enProceso: 0, resueltosEsteMes: 0, total: 0 });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchTickets = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await ticketApi.getAll({
        estatus: filtroEstatus || undefined,
        categoria: filtroCategoria || undefined,
        prioridad: filtroPrioridad || undefined,
        search: search || undefined,
        page,
        limit: 20,
      });
      setTickets(res.data?.data || []);
      setPagination(res.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar la cola de tickets');
    } finally {
      setLoading(false);
    }
  }, [filtroEstatus, filtroCategoria, filtroPrioridad, search]);

  // Debounce sobre el efecto, no sobre el handler del input: así el timeout
  // siempre dispara con el cierre (closure) más reciente de fetchTickets
  // (que ya trae el valor de búsqueda actual), en vez de capturar uno viejo
  // y pisar el resultado correcto con uno de un caracter atrás.
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTickets(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchTickets]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTickets(newPage);
    }
  };

  const handleTomar = async (ticketId) => {
    try {
      setTakingId(ticketId);
      await ticketApi.assign(ticketId, user.id);
      toast.success('Ticket asignado a ti');
      fetchTickets(pagination.page);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo tomar el ticket');
    } finally {
      setTakingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tickets de TI</h1>
          <p className="text-gray-600">Cola de reportes y solicitudes al área de Sistemas</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Abiertos</p>
            <p className="text-2xl font-bold text-red-600">{stats.abiertos}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">En proceso / espera</p>
            <p className="text-2xl font-bold text-blue-600">{stats.enProceso}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Resueltos este mes</p>
            <p className="text-2xl font-bold text-green-600">{stats.resueltosEsteMes}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Total (filtro actual)</p>
            <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por folio, asunto o solicitante..."
            className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1 min-w-[220px]"
          />
          <select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="">Todos los estatus</option>
            {ESTATUS_OPTIONS.map((e) => <option key={e} value={e}>{getStatusText(e)}</option>)}
          </select>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="">Todas las categorías</option>
            {CATEGORIA_OPTIONS.map((c) => <option key={c} value={c}>{getCategoriaLabel(c)}</option>)}
          </select>
          <select value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="">Todas las prioridades</option>
            {PRIORIDAD_OPTIONS.map((p) => <option key={p} value={p}>{getPrioridadText(p)}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="px-6 py-8 text-center text-gray-500">Cargando...</div>
          ) : tickets.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">No hay tickets con estos filtros.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asunto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estatus</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((t) => {
                    const nombreSolicitante = `${t.solicitante?.nombres || t.solicitante?.nombre || ''} ${t.solicitante?.apellidoPaterno || ''}`.trim() || '—';
                    return (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">#{t.folio}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{nombreSolicitante}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{t.asunto}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{getCategoriaLabel(t.categoria)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPrioridadColor(t.prioridad)}`}>
                            {getPrioridadText(t.prioridad)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{t.asignado?.name || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(t.estatus)}`}>
                            {getStatusText(t.estatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          {t.estatus === 'ABIERTO' && !t.asignado && (
                            <button
                              onClick={() => handleTomar(t.id)}
                              disabled={takingId === t.id}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                            >
                              {takingId === t.id ? 'Tomando...' : 'Tomar'}
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/dashboard/ti/${t.id}`)}
                            className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium"
                          >
                            Gestionar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginación */}
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
                  <span className="font-medium">{pagination.total}</span> tickets
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
  );
}

export default function TicketsTIQueuePage() {
  return (
    <SistemasProtectedRoute redirectTo="/dashboard/mi-espacio">
      <TicketsTIQueueContent />
    </SistemasProtectedRoute>
  );
}
