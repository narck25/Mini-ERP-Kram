'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

/**
 * Widget de Próximos Cumpleaños y Aniversarios
 * Muestra los eventos de los próximos 30 días
 * Incluye botón para enviar correos manualmente
 */
export default function UpcomingEventsWidget() {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('cumpleaños');

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/notifications/upcoming?dias=30');
      setEvents(response.data.data);
    } catch (err) {
      console.error('Error al cargar próximos eventos:', err);
      setError('No se pudieron cargar los eventos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Envía correos de cumpleaños y aniversarios manualmente
   */
  const handleSendNow = async () => {
    if (sending) return;
    setSending(true);
    try {
      const response = await api.post('/notifications/check-now');
      const data = response.data.data;
      const msg = `✅ Correos enviados: ${data.cumpleaños.enviados} cumpleaños, ${data.aniversarios.enviados} aniversarios`;
      toast.success(msg);
      // Recargar eventos
      await fetchUpcomingEvents();
    } catch (err) {
      console.error('Error al enviar correos:', err);
      toast.error('Error al enviar correos. Revisa la consola para más detalles.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-center py-6">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando próximos eventos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // No mostrar el widget si hay error
  }

  const cumpleaños = events?.cumpleaños || [];
  const aniversarios = events?.aniversarios || [];
  const totalEvents = cumpleaños.length + aniversarios.length;

  if (totalEvents === 0) {
    return null; // No mostrar si no hay eventos próximos
  }

  const currentList = activeTab === 'cumpleaños' ? cumpleaños : aniversarios;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🎉 Próximos Eventos</h2>
          <p className="text-sm text-gray-600">Cumpleaños y aniversarios de los próximos 30 días</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSendNow}
            disabled={sending}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              sending
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            }`}
          >
            {sending ? (
              <>
                <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-green-600"></span>
                Enviando...
              </>
            ) : (
              <>
                📧 Enviar correos ahora
              </>
            )}
          </button>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('cumpleaños')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'cumpleaños'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎂 Cumpleaños ({cumpleaños.length})
          </button>
          <button
            onClick={() => setActiveTab('aniversarios')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'aniversarios'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎊 Aniversarios ({aniversarios.length})
          </button>
          </div>
        </div>
      </div>

      {currentList.length > 0 ? (
        <div className="space-y-3">
          {currentList.map((event, index) => (
            <div
              key={`${activeTab}-${event.id || index}`}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                {event.nombreCompleto?.charAt(0) || '?'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {event.nombreCompleto}
                </p>
                <p className="text-xs text-gray-500">
                  {event.departamento || 'Sin departamento'}
                  {event.puesto ? ` · ${event.puesto}` : ''}
                  {event.antiguedad ? ` · ${event.antiguedad} año${event.antiguedad !== 1 ? 's' : ''}` : ''}
                </p>
              </div>

              {/* Fecha */}
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {event.fecha}
                </div>
                <div className="text-xs text-gray-500">
                  {activeTab === 'cumpleaños' ? '🎂 Cumpleaños' : '🎊 Aniversario'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <p>No hay {activeTab === 'cumpleaños' ? 'cumpleaños' : 'aniversarios'} próximos</p>
        </div>
      )}
    </div>
  );
}
