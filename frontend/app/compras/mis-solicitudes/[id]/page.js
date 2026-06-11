'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import PurchaseComments from '@/components/PurchaseComments';

export default function MisSolicitudesDetallePage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const requestId = params.id;
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectingQuote, setSelectingQuote] = useState(false);
  
  // Estado para el modal de PDF
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');
  
  // Estado para la selección de cotizaciones
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [showQuotesModal, setShowQuotesModal] = useState(false);
  const [wasQuotesModalOpen, setWasQuotesModalOpen] = useState(false);

  useEffect(() => {
    if (user && user.accessibleModules?.includes('COMPRAS')) {
      fetchRequestDetails();
    }
  }, [user, requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/purchases/details/${requestId}`);
      setRequest(response.data.request);
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error('Error al cargar los detalles de la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuote = async (quoteId) => {
    if (!confirm('¿Está seguro de que desea seleccionar esta cotización?')) return;
    
    try {
      setSelectingQuote(true);
      await api.post(`/purchases/${requestId}/select-quote`, { quoteId });
      
      // Verificar si la cotización seleccionada es mayor a $50,000
      const selectedQuote = request?.quotes?.find(q => q.id === quoteId);
      const isOver50000 = selectedQuote?.monto > 50000;
      
      if (isOver50000) {
        toast.success('Cotización seleccionada. Por superar los $50,000 MXN, la solicitud pasó a Autorización Gerencial.');
      } else {
        toast.success('Cotización aprobada correctamente.');
      }
      
      fetchRequestDetails(); // Recargar datos
    } catch (error) {
      console.error('Error selecting quote:', error);
      toast.error(error.response?.data?.message || 'Error al seleccionar la cotización');
    } finally {
      setSelectingQuote(false);
    }
  };

  const getStatusColor = (estatus) => {
    switch (estatus) {
      case 'NUEVO': return 'bg-red-100 text-red-800';
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800';
      case 'EN_AUTORIZACION': return 'bg-blue-100 text-blue-800';
      case 'APROBADO': return 'bg-green-100 text-green-800';
      case 'ENTREGADO': return 'bg-green-100 text-green-800';
      case 'CANCELADO': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (estatus) => {
    switch (estatus) {
      case 'NUEVO': return 'Nuevo';
      case 'PENDIENTE': return 'Pendiente de selección';
      case 'EN_AUTORIZACION': return 'En Autorización Gerencial';
      case 'APROBADO': return 'Aprobado';
      case 'ENTREGADO': return 'Entregado';
      case 'CANCELADO': return 'Cancelado';
      default: return estatus;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Función para abrir el modal con la cotización
  const handleViewQuote = (quote) => {
    if (!quote.archivoUrl) {
      toast.error('Archivo de cotización no disponible');
      return;
    }
    
    // Guardar que el modal de selección estaba abierto
    setWasQuotesModalOpen(true);
    
    // Cerrar el modal de selección de cotizaciones primero
    setShowQuotesModal(false);
    
    // Construir la URL completa del archivo
    // Nota: Las cotizaciones de compras ya tienen URLs completas desde el backend
    let fileUrl = quote.archivoUrl;
    
    // Si la URL no comienza con http, asumir que es una ruta relativa
    if (!fileUrl.startsWith('http')) {
      // Agregar el dominio base del backend
      fileUrl = `http://localhost:3001${fileUrl}`;
    }
    
    const encodedUrl = encodeURI(fileUrl);
    setPdfUrl(encodedUrl);
    setPdfTitle(`Cotización - ${quote.proveedor} - ${formatCurrency(quote.monto)}`);
    
    // Usar setTimeout para asegurar que el modal de selección se cierre antes de abrir el PDF
    setTimeout(() => {
      setShowPdfModal(true);
    }, 100);
  };

  if (!user || !user.accessibleModules?.includes('COMPRAS')) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">No tiene acceso al módulo de Compras.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando detalles de la solicitud...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Solicitud no encontrada</h2>
            <p className="text-red-600 mt-1">La solicitud de compra no existe o no se pudo cargar.</p>
            <Link
              href="/compras/mis-solicitudes"
              className="mt-3 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              ← Volver a mis solicitudes
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedQuote = request?.quotes?.find(q => q.isSelected);
  const isOver50000 = selectedQuote?.monto > 50000;
  
  // Encontrar la cotización con el monto más bajo (mejor opción)
  const findBestQuote = () => {
    if (!request?.quotes || request.quotes.length === 0) return null;
    
    // Filtrar solo cotizaciones que no estén seleccionadas (para mostrar mejor opción disponible)
    const availableQuotes = request.quotes.filter(q => !q.isSelected);
    if (availableQuotes.length === 0) return null;
    
    return availableQuotes.reduce((lowest, current) => {
      return current.monto < lowest.monto ? current : lowest;
    });
  };
  
  const bestQuote = findBestQuote();

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/compras/mis-solicitudes"
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Volver a mis solicitudes
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                  Solicitud de Compra #{request.folio}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.estatus)}`}>
                  {getStatusText(request.estatus)}
                </span>
              </div>
              <p className="text-gray-600">
                Departamento: {request.departamento?.nombre} • 
                Fecha: {formatDate(request.fechaSolicitud)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Información de la solicitud */}
          <div className="lg:col-span-2 space-y-6">
            {/* Justificación */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Justificación</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{request.justificacion}</p>
            </div>

            {/* Ítems solicitados */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ítems solicitados</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto/Servicio
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {request.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.productoServicio}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.cantidad}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.descripcion || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botón para abrir modal de cotizaciones (solo Admin/Compras y estado PENDIENTE) */}
            {request.estatus === 'PENDIENTE' && request.quotes && request.quotes.length > 0 && (user.role === 'ADMIN' || user.role === 'COMPRAS') && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Cotizaciones disponibles</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Haz clic en el botón para ver todas las cotizaciones y seleccionar una.
                </p>
                
                <button
                  onClick={() => setShowQuotesModal(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Ver y Seleccionar Cotizaciones
                </button>
                
                {/* Mensaje informativo sobre la regla de $50,000 */}
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Regla de autorización</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Si seleccionas una cotización <strong>mayor a $50,000 MXN</strong>, la solicitud pasará a <strong>Autorización Gerencial</strong> y requerirá aprobación adicional.
                        </p>
                        <p className="mt-1">
                          Si la cotización es menor o igual a $50,000 MXN, la solicitud será <strong>aprobada automáticamente</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje de estado EN_AUTORIZACION */}
            {request.estatus === 'EN_AUTORIZACION' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado: En Autorización Gerencial</h2>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">¡Solicitud en proceso de autorización!</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          Has seleccionado una cotización de <strong>{formatCurrency(selectedQuote?.monto)}</strong> que supera los $50,000 MXN.
                        </p>
                        <p className="mt-1">
                          La solicitud está ahora en <strong>Autorización Gerencial</strong>. Un gerente o administrador debe aprobarla antes de continuar.
                        </p>
                        <p className="mt-1">
                          Proveedor seleccionado: <strong>{selectedQuote?.proveedor}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha: Información del estado */}
          <div className="space-y-6">
            {/* Información de estado */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del estado</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Estado actual:</div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusColor(request.estatus)}`}>
                    {getStatusText(request.estatus)}
                  </div>
                </div>
                
                {selectedQuote && (
                  <div>
                    <div className="text-sm text-gray-600">Cotización seleccionada:</div>
                    <div className="font-medium">{selectedQuote.proveedor}</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(selectedQuote.monto)}
                    </div>
                    {isOver50000 && (
                      <div className="mt-2 text-sm text-yellow-600">
                        ⚠️ Requiere autorización gerencial
                      </div>
                    )}
                  </div>
                )}

                {request.autorizadoPor && (
                  <div>
                    <div className="text-sm text-gray-600">Autorizado por:</div>
                    <div className="font-medium">{request.autorizadoPor?.nombre}</div>
                    <div className="text-sm text-gray-600">
                      Fecha: {formatDate(request.fechaAutorizacion)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Flujo del proceso</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${request.estatus === 'NUEVO' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    1
                  </div>
                  <div>
                    <div className="font-medium">NUEVO</div>
                    <div className="text-sm text-gray-600">Esperando cotizaciones</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${request.estatus === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                    2
                  </div>
                  <div>
                    <div className="font-medium">PENDIENTE</div>
                    <div className="text-sm text-gray-600">Seleccionar cotización</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${request.estatus === 'EN_AUTORIZACION' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    3
                  </div>
                  <div>
                    <div className="font-medium">EN AUTORIZACIÓN</div>
                    <div className="text-sm text-gray-600">Solo si mayor a $50,000 MXN</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${request.estatus === 'APROBADO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    4
                  </div>
                  <div>
                    <div className="font-medium">APROBADO</div>
                    <div className="text-sm text-gray-600">Listo para entregar</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${request.estatus === 'ENTREGADO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    5
                  </div>
                  <div>
                    <div className="font-medium">ENTREGADO</div>
                    <div className="text-sm text-gray-600">Proceso completado</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal para visualizar PDFs */}
        {showPdfModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl h-5/6 flex flex-col">
              {/* Encabezado del modal */}
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">{pdfTitle}</h3>
                <button
                  onClick={() => {
                    setShowPdfModal(false);
                    // Después de cerrar el PDF, volver a abrir el modal de selección si estaba abierto antes
                    setTimeout(() => {
                      if (wasQuotesModalOpen) {
                        setShowQuotesModal(true);
                        setWasQuotesModalOpen(false); // Resetear el estado
                      }
                    }, 100);
                  }}
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

        {/* Sección de comentarios tipo chat/blog */}
        <div className="mt-6">
          <PurchaseComments requestId={requestId} />
        </div>

        {/* Modal para seleccionar cotizaciones (solo Admin/Compras) */}
        {showQuotesModal && (user.role === 'ADMIN' || user.role === 'COMPRAS') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] flex flex-col">
              {/* Encabezado del modal */}
              <div className="flex justify-between items-center p-6 border-b">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Seleccionar Cotización</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Selecciona una cotización para tu solicitud #{request.folio}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowQuotesModal(false);
                    setSelectedQuoteId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              {/* Contenido del modal */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {request.quotes.map((quote, index) => {
                    const isBestQuote = bestQuote && quote.id === bestQuote.id;
                    const isSelected = quote.isSelected;
                    
                    return (
                      <div 
                        key={quote.id} 
                        className={`p-4 rounded-lg border-2 ${
                          isSelected 
                            ? 'border-green-500 bg-green-50' 
                            : isBestQuote 
                              ? 'border-green-500 bg-green-50' 
                              : selectedQuoteId === quote.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Checkbox para selección */}
                          <div className="flex-shrink-0 pt-1">
                            <input
                              type="radio"
                              id={`quote-${quote.id}`}
                              name="selectedQuote"
                              checked={selectedQuoteId === quote.id}
                              onChange={() => setSelectedQuoteId(quote.id)}
                              disabled={isSelected}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                          
                          {/* Información de la cotización */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <label 
                                    htmlFor={`quote-${quote.id}`}
                                    className="font-medium text-lg text-gray-900 cursor-pointer"
                                  >
                                    {quote.proveedor}
                                  </label>
                                  {isSelected && (
                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                      Seleccionada
                                    </span>
                                  )}
                                  {isBestQuote && !isSelected && (
                                    <span className="px-2 py-1 text-xs bg-green-50 text-green-800 rounded font-semibold border border-green-500">
                                      🏆 Mejor Opción (Menor Costo)
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Fecha: {formatDate(quote.fechaCotizacion)}
                                </div>
                                
                                {/* Botón para ver PDF - SIEMPRE visible */}
                                <div className="mt-3">
                                  <button
                                    onClick={() => handleViewQuote(quote)}
                                    className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Ver Cotización PDF
                                  </button>
                                  {!quote.archivoUrl && (
                                    <div className="mt-1 text-xs text-red-600">
                                      ⚠️ Archivo no disponible
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Monto */}
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">
                                  {formatCurrency(quote.monto)}
                                </div>
                                {quote.monto > 50000 && (
                                  <div className="text-sm text-yellow-600 mt-1">
                                    ⚠️ Requiere autorización gerencial
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Mensaje informativo */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Instrucciones</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>1. Selecciona una cotización marcando el círculo correspondiente</p>
                        <p>2. Haz clic en "Seleccionar Cotización" para confirmar tu elección</p>
                        <p>3. La cotización con el menor costo se muestra en color verde como la mejor opción</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Pie del modal */}
              <div className="flex justify-between items-center p-6 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  {selectedQuoteId ? (
                    <span className="text-green-600 font-medium">
                      ✓ Cotización seleccionada
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      Selecciona una cotización para continuar
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowQuotesModal(false);
                      setSelectedQuoteId(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedQuoteId) {
                        toast.error('Por favor selecciona una cotización');
                        return;
                      }
                      
                      setShowQuotesModal(false);
                      await handleSelectQuote(selectedQuoteId);
                      setSelectedQuoteId(null);
                    }}
                    disabled={!selectedQuoteId || selectingQuote}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectingQuote ? 'Procesando...' : 'Seleccionar Cotización'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
           