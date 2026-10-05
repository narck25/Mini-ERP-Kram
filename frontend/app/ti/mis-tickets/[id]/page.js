'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ticketApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { downloadProtectedFile } from '@/lib/files';
import TicketComments from '@/components/TicketComments';
import { getStatusColor, getStatusText, getCategoriaLabel, getPrioridadColor, getPrioridadText, formatDate } from '@/utils/ticketHelpers';

const CANCELABLES = ['ABIERTO', 'EN_PROCESO', 'EN_ESPERA'];

export default function MiTicketDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await ticketApi.getById(id);
      setTicket(res.data?.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'No se pudo cargar el ticket');
      router.push('/ti/mis-tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('¿Cancelar este ticket?')) return;
    try {
      setCancelling(true);
      await ticketApi.cancel(id);
      toast.success('Ticket cancelado');
      fetchTicket();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo cancelar el ticket');
    } finally {
      setCancelling(false);
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
        <button onClick={() => router.push('/ti/mis-tickets')} className="text-sm text-blue-600 hover:text-blue-800">
          ← Volver a mis tickets
        </button>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">#{ticket.folio} — {ticket.asunto}</h1>
              <p className="text-sm text-gray-500 mt-1">Creado el {formatDate(ticket.createdAt)}</p>
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
              <span className="text-xs text-gray-500 uppercase">Atendido por</span>
              <p className="font-medium text-gray-900">{ticket.asignado?.name || 'Sin asignar todavía'}</p>
            </div>
          </div>

          <div className="mb-4">
            <span className="text-xs text-gray-500 uppercase">Descripción</span>
            <p className="text-gray-700 whitespace-pre-wrap mt-1">{ticket.descripcion}</p>
          </div>

          {ticket.attachments?.length > 0 && (
            <div className="mb-2">
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

          {CANCELABLES.includes(ticket.estatus) && (
            <div className="pt-4 border-t border-gray-200 mt-4">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {cancelling ? 'Cancelando...' : 'Cancelar ticket'}
              </button>
            </div>
          )}
        </div>

        <TicketComments ticketId={id} />
      </div>
    </DashboardLayout>
  );
}
