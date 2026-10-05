'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SistemasProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { ticketApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { downloadProtectedFile } from '@/lib/files';
import TicketComments from '@/components/TicketComments';
import { getStatusColor, getStatusText, getCategoriaLabel, getPrioridadColor, getPrioridadText, formatDate } from '@/utils/ticketHelpers';

const ESTATUS_OPTIONS = ['ABIERTO', 'EN_PROCESO', 'EN_ESPERA', 'RESUELTO', 'CERRADO', 'CANCELADO'];

function nombreEmpleado(emp) {
  if (!emp) return '—';
  return `${emp.nombres || emp.nombre || ''} ${emp.apellidoPaterno || ''} ${emp.apellidoMaterno || ''}`.trim();
}

function TicketTIDetalleContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await ticketApi.getById(id);
      setTicket(res.data?.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'No se pudo cargar el ticket');
      router.push('/dashboard/ti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (nuevoEstatus) => {
    try {
      setUpdating(true);
      await ticketApi.updateStatus(id, nuevoEstatus);
      toast.success('Estatus actualizado');
      fetchTicket();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo actualizar el estatus');
    } finally {
      setUpdating(false);
    }
  };

  const handleTomar = async () => {
    try {
      setUpdating(true);
      await ticketApi.assign(id, user.id);
      toast.success('Ticket asignado a ti');
      fetchTicket();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo asignar el ticket');
    } finally {
      setUpdating(false);
    }
  };

  const handleLiberar = async () => {
    try {
      setUpdating(true);
      await ticketApi.assign(id, null);
      toast.success('Ticket liberado');
      fetchTicket();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo liberar el ticket');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !ticket) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-gray-500">Cargando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <button onClick={() => router.push('/dashboard/ti')} className="text-sm text-blue-600 hover:text-blue-800">
          ← Volver a la cola
        </button>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">#{ticket.folio} — {ticket.asunto}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {nombreEmpleado(ticket.solicitante)} · {ticket.solicitante?.departamento?.nombre || '—'} · {formatDate(ticket.createdAt)}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.estatus)}`}>
              {getStatusText(ticket.estatus)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
            <div>
              <span className="text-xs text-gray-500 uppercase">Categoría</span>
              <p className="font-medium text-gray-900">{getCategoriaLabel(ticket.categoria)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">Prioridad</span>
              <p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPrioridadColor(ticket.prioridad)}`}>
                  {getPrioridadText(ticket.prioridad)}
                </span>
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">Asignado a</span>
              <p className="font-medium text-gray-900">{ticket.asignado?.name || 'Sin asignar'}</p>
            </div>
          </div>

          <div className="mb-4">
            <span className="text-xs text-gray-500 uppercase">Descripción</span>
            <p className="text-gray-700 whitespace-pre-wrap mt-1">{ticket.descripcion}</p>
          </div>

          {ticket.attachments?.length > 0 && (
            <div className="mb-4">
              <span className="text-xs text-gray-500 uppercase">Adjuntos</span>
              <ul className="mt-1 space-y-1">
                {ticket.attachments.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => downloadProtectedFile(a.url, a.nombreArchivo)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      📎 {a.nombreArchivo}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {!ticket.asignado ? (
                <button
                  onClick={handleTomar}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  Tomar ticket
                </button>
              ) : ticket.asignado.id === user?.id ? (
                <button
                  onClick={handleLiberar}
                  disabled={updating}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  Liberar ticket
                </button>
              ) : null}

              <select
                value={ticket.estatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {ESTATUS_OPTIONS.map((e) => (
                  <option key={e} value={e}>{getStatusText(e)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <TicketComments ticketId={id} />
      </div>
    </DashboardLayout>
  );
}

export default function TicketTIDetallePage() {
  return (
    <SistemasProtectedRoute redirectTo="/dashboard/mi-espacio">
      <TicketTIDetalleContent />
    </SistemasProtectedRoute>
  );
}
