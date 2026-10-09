'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { ticketApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useProtectedFileUrl } from '@/hooks/useProtectedFileUrl';

// Estilo bitácora (sin burbujas de chat) a propósito: ya no es tiempo real
// (ver PurchaseComments.js, mismo criterio), así que el aspecto de chat ya
// no calzaba — y una lista plana muestra mucho más limpio los adjuntos.
function CommentAvatar({ fotoUrl, userName, initials }) {
  const { blobUrl } = useProtectedFileUrl(fotoUrl);
  if (fotoUrl && blobUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- blob: URL, next/image no la optimiza
      <img src={blobUrl} alt={userName} width={36} height={36} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gray-500 flex-shrink-0">
      {initials}
    </div>
  );
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB, igual que el formulario de "Nuevo ticket"
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export default function TicketComments({ ticketId, onAttachmentAdded }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (ticketId) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tickets/${ticketId}/comments`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      toast.error('Escribe un mensaje');
      return;
    }

    try {
      setSending(true);
      const response = await api.post(`/tickets/${ticketId}/comments`, {
        mensaje: newMessage.trim()
      });

      setComments(prev => [...prev, response.data.data]);
      setNewMessage('');

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending comment:', error);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleAttachClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo después
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`"${file.name}" excede el tamaño máximo (10MB)`);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`"${file.name}" no es un tipo de archivo permitido`);
      return;
    }

    try {
      setAttaching(true);
      const formData = new FormData();
      formData.append('files', file);
      await ticketApi.addAttachments(ticketId, formData);
      toast.success('Archivo adjuntado');
      onAttachmentAdded?.();
    } catch (error) {
      console.error('Error adjuntando archivo:', error);
      toast.error(error.response?.data?.error || 'No se pudo adjuntar el archivo');
    } finally {
      setAttaching(false);
    }
  };

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

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-white">Comentarios</h3>
            <p className="text-sm text-blue-200">Conversación entre el solicitante y TI</p>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Cargando comentarios...</p>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex items-center justify-center py-12">
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
            const userName = comment.user?.employee?.nombre || comment.user?.name || 'Usuario';
            return (
              <div key={comment.id} className="px-6 py-4 border-b border-gray-100 last:border-0">
                <div className="flex items-start gap-3">
                  <CommentAvatar
                    fotoUrl={comment.user?.employee?.fotoUrl}
                    userName={userName}
                    initials={getInitials(userName)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{userName}</span>
                      <span className="text-xs text-gray-400">{formatDateTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mt-0.5">{comment.mensaje}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

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
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelected}
            className="hidden"
            accept={ALLOWED_TYPES.join(',')}
          />
          <button
            type="button"
            onClick={handleAttachClick}
            disabled={attaching}
            title="Adjuntar archivo"
            className="px-3 py-3 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50"
          >
            {attaching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            )}
          </button>
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
        <p className="text-xs text-gray-400 mt-1.5">📎 Los archivos adjuntados aparecen en la sección &ldquo;Adjuntos&rdquo; de arriba.</p>
      </form>
    </div>
  );
}
