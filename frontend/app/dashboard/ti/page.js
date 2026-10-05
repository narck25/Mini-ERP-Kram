'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const [takingId, setTakingId] = useState(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await ticketApi.getAll({
        estatus: filtroEstatus || undefined,
        categoria: filtroCategoria || undefined,
        prioridad: filtroPrioridad || undefined,
      });
      setTickets(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar la cola de tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstatus, filtroCategoria, filtroPrioridad]);

  const handleTomar = async (ticketId) => {
    try {
      setTakingId(ticketId);
      await ticketApi.assign(ticketId, user.id);
      toast.success('Ticket asignado a ti');
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo tomar el ticket');
    } finally {
      setTakingId(null);
    }
  };

  const stats = useMemo(() => {
    const abiertos = tickets.filter((t) => t.estatus === 'ABIERTO').length;
    const enProceso = tickets.filter((t) => t.estatus === 'EN_PROCESO' || t.estatus === 'EN_ESPERA').length;
    const hoy = new Date();
    const resueltosEsteMes = tickets.filter((t) => {
      if (!['RESUELTO', 'CERRADO'].includes(t.estatus) || !t.fechaResolucion) return false;
      const f = new Date(t.fechaResolucion);
      return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
    }).length;
    return { abiertos, enProceso, resueltosEsteMes, total: tickets.length };
  }, [tickets]);

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
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
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
