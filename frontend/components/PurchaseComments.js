'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function PurchaseComments({ requestId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (requestId) {
      fetchComments();
    }
  }, [requestId]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
