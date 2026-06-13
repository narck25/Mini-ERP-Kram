'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function QuoteSelectionModal({ request, onClose, onSuccess }) {
  const { user } = useAuth();
  
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [comentarios, setComentarios] = useState('');
  const [fechaEstimadaEntrega, setFechaEstimadaEntrega] = useState('');
  const [selecting, setSelecting] = useState(false);
  
  // Estado para el modal de PDF
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');
  
  // Estado para selección de aprobadores (solicitudes > $50k)
  const [showApproverModal, setShowApproverModal] = useState(false);
  const [potentialApprovers, setPotentialApprovers] = useState([]);
  const [selectedApproverIds, setSelectedApproverIds] = useState([]);
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const [assigningApprovers, setAssigningApprovers] = useState(false);
  const [selectedQuoteData, setSelectedQuoteData] = useState(null);
  
  const handleViewQuotePdf = (quote) => {
    if (!quote.archivoUrl) {
      toast.error('Archivo de cotización no disponible');
      return;
    }
    const encodedUrl = encodeURI(quote.archivoUrl);
    setPdfUrl(encodedUrl);
    setPdfTitle(`Cotización - ${quote.proveedor} - ${formatCurrency(quote.monto)}`);
    setShowPdfModal(true);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleSelectQuote = async () => {
    if (!selectedQuoteId) {
      toast.error('Por favor selecciona una cotización');
      return;
    }

    if (!fechaEstimadaEntrega) {
      toast.error('Por favor indica la fecha estimada de entrega');
      return;
    }

    setSelecting(true);
    try {
      const response = await api.post(`/purchases/${request.id}/select-quote`, {
        quoteId: selectedQuoteId,
        comentarios: comentarios.trim() || null,
        fechaEstimadaEntrega
      });
      
      // Si requiere autorización (> $50k), mostrar modal de selección de aprobadores
      if (response.data?.data?.requiereAutorizacion) {
        const selectedQuote = request.quotes.find(q => q.id === selectedQuoteId);
        setSelectedQuoteData(selectedQuote);
        setShowApproverModal(true);
        // Cargar aprobadores potenciales
        loadPotentialApprovers();
      } else {
        toast.success('Cotización seleccionada exitosamente. Solicitud aprobada.');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error selecting quote:', error);
      toast.error(error.response?.data?.message || 'Error al seleccionar cotización');
    } finally {
      setSelecting(false);
    }
  };

  // Cargar aprobadores potenciales
  const loadPotentialApprovers = async () => {
    setLoadingApprovers(true);
    try {
      const response = await api.get(`/purchases/${request.id}/potential-approvers`);
      setPotentialApprovers(response.data?.data || []);
    } catch (error) {
      console.error('Error loading potential approvers:', error);
      toast.error('Error al cargar aprobadores disponibles');
    } finally {
      setLoadingApprovers(false);
    }
  };

  // Asignar aprobadores
  const handleAssignApprovers = async () => {
    if (selectedApproverIds.length === 0) {
      toast.error('Debe seleccionar al menos un aprobador');
      return;
    }

    setAssigningApprovers(true);
    try {
      await api.post(`/purchases/${request.id}/assign-approvers`, {
        approverIds: selectedApproverIds
      });
      toast.success('Aprobadores asignados exitosamente. Solicitud enviada a autorización.');
      setShowApproverModal(false);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning approvers:', error);
      toast.error(error.response?.data?.message || 'Error al asignar aprobadores');
    } finally {
      setAssigningApprovers(false);
    }
  };

  // Toggle selección de aprobador
  const toggleApprover = (employeeId) => {
    setSelectedApproverIds(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  // Ordenar cotizaciones por monto ascendente
  const sortedQuotes = [...(request.quotes || [])].sort((a, b) => a.monto - b.monto);
  const mejorMonto = sortedQuotes.length > 0 ? sortedQuotes[0].monto : 0;

  // Solo ADMIN y COMPRAS pueden seleccionar cotizaciones
  if (!user || (user.role !== 'ADMIN' && user.role !== 'COMPRAS')) {
    return null;
  }

  return (
    <>
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl z-10">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Seleccionar Cotización
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Solicitud #{request.folio} - {request.departamento?.nombre || 'N/A'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Items de la solicitud */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Artículos solicitados:</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                {request.items?.map((item, idx) => (
                  <div key={item.id || idx} className="text-sm text-gray-600">
                    • {item.cantidad} x {item.productoServicio}
                    {item.descripcion && <span className="text-gray-400"> - {item.descripcion}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Lista de cotizaciones */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Cotizaciones recibidas:</h3>
            <div className="space-y-3 mb-6">
              {sortedQuotes.map((quote) => {
                const isBest = quote.monto === mejorMonto;
                const diferencia = quote.monto - mejorMonto;
                const diferenciaPorcentual = mejorMonto > 0 ? ((diferencia / mejorMonto) * 100).toFixed(1) : 0;

                return (
                  <div
                    key={quote.id}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedQuoteId === quote.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : isBest
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedQuoteId(quote.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Radio button */}
                      <div className="flex-shrink-0 pt-1">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedQuoteId === quote.id
                            ? 'border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedQuoteId === quote.id && (
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{quote.proveedor}</h4>
                            <p className="text-sm text-gray-500">
                              Cotizado: {formatDate(quote.fechaCotizacion)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">
                              {formatCurrency(quote.monto)}
                            </p>
                            {isBest && sortedQuotes.length > 1 && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                Mejor opción
                              </span>
                            )}
                          </div>
                        </div>

                        {!isBest && diferencia > 0 && (
                          <p className="text-sm text-red-500 mt-1">
                            +{formatCurrency(diferencia)} ({diferenciaPorcentual}% más caro)
                          </p>
                        )}

                        {quote.archivoUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewQuotePdf(quote);
                            }}
                            className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Ver PDF
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Campos adicionales */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Información adicional</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comentarios <span className="text-gray-400">(opcional)</span>
                </label>
                <textarea
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  placeholder="Agrega comentarios sobre la selección..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha estimada de entrega <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={fechaEstimadaEntrega}
                  onChange={(e) => setFechaEstimadaEntrega(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Resumen */}
            {selectedQuoteId && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Resumen:</strong> Se seleccionará la cotización de{' '}
                  <strong>{sortedQuotes.find(q => q.id === selectedQuoteId)?.proveedor}</strong> por{' '}
                  <strong>{formatCurrency(sortedQuotes.find(q => q.id === selectedQuoteId)?.monto)}</strong>
                  {sortedQuotes.find(q => q.id === selectedQuoteId)?.monto > 50000 && (
                    <span className="block mt-1 text-yellow-700">
                      ⚠️ Esta compra supera los $50,000 MXN y requerirá autorización de Dirección/RH
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 rounded-b-xl">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedQuoteId ? (
                  <span className="text-green-600 font-medium">✓ Cotización seleccionada</span>
                ) : (
                  <span>Selecciona una cotización para continuar</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSelectQuote}
                  disabled={!selectedQuoteId || selecting || !fechaEstimadaEntrega}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selecting ? 'Procesando...' : 'Seleccionar Cotización'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Modal de selección de aprobadores (para solicitudes > $50k) */}
    {showApproverModal && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl z-10">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Asignar Aprobadores
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Esta solicitud supera los <strong>$50,000 MXN</strong> y requiere autorización
                </p>
              </div>
              <button
                onClick={() => {
                  setShowApproverModal(false);
                  onClose();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Resumen de la cotización seleccionada */}
            {selectedQuoteData && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Cotización seleccionada: <strong>{selectedQuoteData.proveedor}</strong>
                    </p>
                    <p className="text-sm text-yellow-700">
                      Monto: <strong>{formatCurrency(selectedQuoteData.monto)}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Selecciona las personas que deben aprobar esta compra:
            </h3>

            {loadingApprovers ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Cargando aprobadores disponibles...</p>
              </div>
            ) : potentialApprovers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No se encontraron aprobadores disponibles</p>
                <p className="text-sm text-gray-400 mt-1">
                  Asegúrate de que existan empleados con nivel jerárquico Gerente, Director o Presidente
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {potentialApprovers.map((approver) => (
                  <div
                    key={approver.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedApproverIds.includes(approver.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleApprover(approver.id)}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedApproverIds.includes(approver.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedApproverIds.includes(approver.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{approver.nombre}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {approver.nivelJerarquico}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {approver.departamento}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 rounded-b-xl">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedApproverIds.length > 0 ? (
                  <span className="text-green-600 font-medium">
                    ✓ {selectedApproverIds.length} aprobador(es) seleccionado(s)
                  </span>
                ) : (
                  <span>Selecciona al menos un aprobador</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowApproverModal(false);
                    onClose();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssignApprovers}
                  disabled={selectedApproverIds.length === 0 || assigningApprovers}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assigningApprovers ? 'Asignando...' : 'Enviar a Autorización'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Modal para visualizar PDFs */}
    {showPdfModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl h-5/6 flex flex-col">
          {/* Encabezado del modal */}
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">{pdfTitle}</h3>
            <button
              onClick={() => setShowPdfModal(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
          </div>
          
          {/* Contenido del PDF */}
          <div className="flex-1 overflow-hidden">
            <iframe
              src={pdfUrl}
              title={pdfTitle}
              className="w-full h-full border-0"
              style={{ minHeight: '500px' }}
            />
          </div>
          
          {/* Pie del modal */}
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              <p>Para descargar el PDF, haz clic derecho en el documento y selecciona "Guardar como"</p>
            </div>
            <div className="flex gap-2">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
              >
                Abrir en nueva pestaña
              </a>
              <button
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
