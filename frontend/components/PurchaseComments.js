'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function PurchaseComments({ requestId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // ───────────────────────────────────────────────────────────
  // 1. Carga inicial de comentarios (GET /purchases/:id/comments)
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (requestId) {
      fetchComments();
    }
  }, [requestId]);

  // ───────────────────────────────────────────────────────────
  // 2. Conexión SSE para recibir comentarios en tiempo real
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!requestId) return;

    /**
     * Establece una conexión SSE (Server-Sent Events) al backend.
     *
     * El token JWT se pasa como query param `token` porque
     * EventSource (API nativa del navegador) NO soporta
     * headers personalizados como Authorization.
     *
     * Eventos recibidos:
     *   - 'connected':  Confirmación de conexión exitosa
     *   - 'new-comment': Nuevo comentario agregado por otro usuario
     *   - 'error':       Error del servidor
     *   - 'shutdown':    Servidor cerrándose
     */
    const connectSSE = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Cerrar conexión anterior si existe
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Construir URL con token como query param
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const sseUrl = `${baseUrl}/api/purchases/${requestId}/comments/stream?token=${encodeURIComponent(token)}`;

      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      // ── Evento: connected ──
      eventSource.addEventListener('connected', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('🔌 SSE conectado:', data.message);
          setSseConnected(true);
        } catch (err) {
          console.warn('⚠️ SSE: Error parseando evento connected:', err);
        }
      });

      // ── Evento: new-comment ──
      // Cuando otro usuario (o el mismo desde otra pestaña) agrega
      // un comentario, el backend lo emite y aquí lo agregamos a la
      // lista local sin necesidad de hacer polling.
      eventSource.addEventListener('new-comment', (event) => {
        try {
          const data = JSON.parse(event.data);
          const newComment = data.comment;

          // Evitar duplicados: si el comentario ya está en la lista,
          // no lo agregamos de nuevo (puede ocurrir si el usuario que
          // envió el comentario ya lo agregó localmente en handleSendMessage).
          setComments((prev) => {
            const exists = prev.some((c) => c.id === newComment.id);
            if (exists) return prev;
            return [...prev, newComment];
          });

          // Scroll automático al nuevo comentario
          setTimeout(scrollToBottom, 50);
        } catch (err) {
          console.warn('⚠️ SSE: Error parseando new-comment:', err);
        }
      });

      // ── Evento: error ──
      eventSource.addEventListener('error', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.error('❌ SSE Error:', data.error);
        } catch (err) {
          console.error('❌ SSE: Error de conexión (sin datos)');
        }
        setSseConnected(false);
      });

      // ── Evento: shutdown ──
      eventSource.addEventListener('shutdown', (event) => {
        console.log('🔌 SSE: Servidor cerró la conexión');
        setSseConnected(false);
        eventSource.close();
      });

      // ── Manejo de errores de conexión (onerror nativo) ──
      // EventSource no tiene reconexión automática configurable,
      // pero por defecto intenta reconectar después de 3 segundos.
      // Nosotros implementamos reconexión manual con backoff.
      eventSource.onerror = () => {
        console.warn('⚠️ SSE: Error de conexión, reconectando en 5s...');
        setSseConnected(false);
        eventSource.close();

        // Reconexión automática después de 5 segundos
        setTimeout(() => {
          if (requestId) {
            console.log('🔄 SSE: Reintentando conexión...');
            connectSSE();
          }
        }, 5000);
      };
    };

    // Iniciar conexión SSE
    connectSSE();

    // Cleanup al desmontar el componente o cambiar requestId
    return () => {
      if (eventSourceRef.current) {
        console.log('🔌 SSE: Cerrando conexión (cleanup)');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setSseConnected(false);
    };
  }, [requestId]);

  // ───────────────────────────────────────────────────────────
  // 3. Scroll automático al último comentario
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ───────────────────────────────────────────────────────────
  // 4. Carga inicial de comentarios (GET)
  // ───────────────────────────────────────────────────────────
  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/purchases/${requestId}/comments`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────
  // 5. Envío de nuevo comentario (POST)
  // ───────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      toast.error('Escribe un mensaje');
      return;
    }

    try {
      setSending(true);
      const response = await api.post(`/purchases/${requestId}/comments`, {
        mensaje: newMessage.trim()
      });
      
      // Agregar el comentario localmente inmediatamente
      // (el SSE también lo emitirá, pero el filtro de duplicados
      //  en el listener de 'new-comment' evitará duplicación)
      setComments(prev => [...prev, response.data.data]);
      setNewMessage('');
      
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending comment:', error);
      toast.error(error.response?.data?.message || 'Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  // ───────────────────────────────────────────────────────────
  // 6. Helpers de UI
  // ───────────────────────────────────────────────────────────
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role) => {
    const badges = {
      'ADMIN': 'bg-red-100 text-red-800',
      'COMPRAS': 'bg-blue-100 text-blue-800',
      'RH': 'bg-purple-100 text-purple-800',
      'SISTEMAS': 'bg-green-100 text-green-800',
      'PRODUCCION': 'bg-yellow-100 text-yellow-800'
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleName = (role) => {
    const names = {
      'ADMIN': 'Admin',
      'COMPRAS': 'Compras',
      'RH': 'RH',
      'SISTEMAS': 'Sistemas',
      'PRODUCCION': 'Producción'
    };
    return names[role] || role;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // ───────────────────────────────────────────────────────────
  // 7. Render
  // ───────────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-white">Comentarios</h3>
            <p className="text-sm text-blue-200">
              Conversación entre solicitante y compras
            </p>
          </div>
          {/* Indicador de conexión SSE en tiempo real */}
          <div className="ml-auto flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${
              sseConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`}></span>
            <span className="text-xs text-blue-200">
              {sseConnected ? 'Tiempo real' : 'Reconectando...'}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de mensajes */}
      <div className="h-80 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Cargando comentarios...</p>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No hay comentarios aún</p>
              <p className="text-xs text-gray-400">Sé el primero en comentar</p>
            </div>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwnMessage = comment.user?.id === user?.id;
            const userName = comment.user?.employee?.nombre || comment.user?.name || 'Usuario';
            const userRole = comment.user?.role || '';
            
            return (
              <div
                key={comment.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {comment.user?.employee?.fotoUrl ? (
                      <img
                        src={comment.user.employee.fotoUrl}
                        alt={userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        isOwnMessage ? 'bg-blue-600' : 'bg-gray-500'
                      }`}>
                        {getInitials(userName)}
                      </div>
                    )}
                  </div>

                  {/* Burbuja de mensaje */}
                  <div>
                    <div className={`rounded-2xl px-4 py-3 ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{comment.mensaje}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs text-gray-500">{userName}</span>
                      <span className={`px-1.5 py-0.5 text-xs rounded ${getRoleBadge(userRole)}`}>
                        {getRoleName(userRole)}
                      </span>
                      <span className="text-xs text-gray-400">{formatDateTime(comment.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input para nuevo mensaje */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un comentario..."
            disabled={sending}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Enviar</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
