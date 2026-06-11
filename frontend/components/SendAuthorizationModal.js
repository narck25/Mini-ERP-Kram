'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function SendAuthorizationModal({ request, onClose, onSuccess }) {
  const { user } = useAuth();
  
  // Solo ADMIN y COMPRAS pueden enviar autorización
  if (!user || (user.role !== 'ADMIN' && user.role !== 'COMPRAS')) {
    return null;
  }
  
  const [potentialApprovers, setPotentialApprovers] = useState([]);
  const [selectedApproverIds, setSelectedApproverIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPotentialApprovers();
  }, []);

  const fetchPotentialApprovers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/purchases/${request.id}/potential-approvers`);
      setPotentialApprovers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching potential approvers:', error);
      toast.error('Error al cargar aprobadores disponibles');
    } finally {
      setLoading(false);
    }
  };

  const toggleApprover = (id) => {
    setSelectedApproverIds(prev => 
      prev.includes(id) 
        ? prev.filter(aid => aid !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedApproverIds(filteredApprovers.map(a => a.id));
  };

  const deselectAll = () => {
    setSelectedApproverIds([]);
  };

  const handleSendAuthorization = async () => {
    if (selectedApproverIds.length === 0) {
      toast.error('Debe seleccionar al menos un aprobador');
      return;
    }

    try {
      setSending(true);

      // Obtener los emails de los aprobadores seleccionados
      const selectedApprovers = potentialApprovers.filter(a => selectedApproverIds.includes(a.id));
      
      // Primero asignar los aprobadores en la BD
      await api.post(`/purchases/${request.id}/assign-approvers`, {
        approverIds: selectedApproverIds
      });

      // Luego enviar los correos de autorización
      const response = await api.post(`/purchases/${request.id}/send-authorization`, {
        approverEmails: selectedApprovers.map(a => a.email).filter(Boolean)
      });

      toast.success(response.data.message || 'Autorización enviada exitosamente');
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Error sending authorization:', error);
      toast.error(error.response?.data?.message || 'Error al enviar autorización');
    } finally {
      setSending(false);
    }
  };

  // Filtrar aprobadores por búsqueda
  const filteredApprovers = potentialApprovers.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.nombre?.toLowerCase().includes(term) ||
      a.nivelJerarquico?.toLowerCase().includes(term) ||
      a.departamento?.toLowerCase().includes(term)
    );
  });

  // Obtener la cotización seleccionada
  const selectedQuote = request.quotes?.find(q => q.isSelected);
  const montoSeleccionado = selectedQuote?.monto || 0;

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getNivelColor = (nivel) => {
    switch (nivel) {
      case 'DIRECTOR': return 'bg-purple-100 text-purple-800';
      case 'GERENTE': return 'bg-blue-100 text-blue-800';
      case 'PRESIDENTE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Enviar a Autorización</h2>
              <p className="text-gray-600 mt-1">
                Solicitud #{request.folio} - {formatCurrency(montoSeleccionado)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Importante:</strong> Esta solicitud supera los $50,000 MXN y requiere autorización de un Gerente, Director o RH.
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Seleccione los aprobadores a quienes se enviará la notificación por correo electrónico.
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar aprobadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Select All / Deselect All */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={selectAll}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              Seleccionar todos
            </button>
            <button
              onClick={deselectAll}
              className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              Deseleccionar todos
            </button>
            <span className="text-sm text-gray-500 ml-auto self-center">
              {selectedApproverIds.length} seleccionados
            </span>
          </div>

          {/* Approvers List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Cargando aprobadores...</p>
            </div>
          ) : filteredApprovers.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-600 font-medium">No se encontraron aprobadores</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm ? 'Intente con otro término de búsqueda' : 'No hay empleados con nivel gerencial registrados'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredApprovers.map((approver) => (
                <div
                  key={approver.id}
                  onClick={() => toggleApprover(approver.id)}
                  className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedApproverIds.includes(approver.id)
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedApproverIds.includes(approver.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedApproverIds.includes(approver.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {approver.nombre?.charAt(0) || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {approver.nombre}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getNivelColor(approver.nivelJerarquico)}`}>
                        {approver.nivelJerarquico}
                      </span>
                      {approver.departamento && (
                        <span className="text-xs text-gray-500">
                          {approver.departamento}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSendAuthorization}
              disabled={sending || selectedApproverIds.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar a Autorización
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
