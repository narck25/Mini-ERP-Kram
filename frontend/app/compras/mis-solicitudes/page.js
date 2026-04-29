'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function MisSolicitudesComprasPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user && user.accessibleModules?.includes('COMPRAS')) {
      fetchMyRequests();
    }
  }, [user]);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/purchases/my');
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      toast.error('Error al cargar las solicitudes de compra');
    } finally {
      setLoading(false);
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
      case 'PENDIENTE': return 'Pendiente de cotización';
      case 'EN_AUTORIZACION': return 'En autorización';
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
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const calculateTotal = (request) => {
    if (!request?.quotes?.length) return 0;
    const selectedQuote = request.quotes.find(q => q.isSelected);
    return selectedQuote?.monto || 0;
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

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Solicitudes de Compra</h1>
              <p className="text-gray-600">Gestiona tus solicitudes de compra y materiales</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/compras/nueva-solicitud"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                + Nueva Solicitud
              </Link>
            </div>
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Proceso de Compras</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    <span className="font-semibold">NUEVO</span> → <span className="font-semibold">PENDIENTE</span> → <span className="font-semibold">EN AUTORIZACIÓN</span> → <span className="font-semibold">APROBADO</span> → <span className="font-semibold">ENTREGADO</span>
                  </p>
                  <p className="mt-1">
                    Las solicitudes mayores a $28,000 MXN requieren autorización adicional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Solicitudes */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando solicitudes...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes de compra</h3>
            <p className="text-gray-600 mb-4">Crea tu primera solicitud de compra.</p>
            <Link
              href="/compras/nueva-solicitud"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              + Crear Primera Solicitud
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => {
              const total = calculateTotal(request);
              const selectedQuote = request?.quotes?.find(q => q.isSelected);
              
              return (
                <div key={request.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Solicitud #{request.folio}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.estatus)}`}>
                            {getStatusText(request.estatus)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Departamento: {request.departamento?.nombre} • 
                          Fecha: {formatDate(request.fechaSolicitud)}
                        </p>
                        {request.justificacion && (
                          <p className="text-sm text-gray-700 mt-2">{request.justificacion}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {total > 0 && (
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(total)}
                          </div>
                        )}
                        {selectedQuote && (
                          <div className="text-sm text-gray-600">
                            Proveedor: {selectedQuote.proveedor}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Ítems de la solicitud */}
                    {request.items?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Ítems solicitados:</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Producto/Servicio
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Cantidad
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Descripción
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {request.items.map((item, index) => (
                                <tr key={index}>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {item.productoServicio}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {item.cantidad}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    {item.descripcion || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Cotizaciones */}
                    {request.quotes?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Cotizaciones:</h4>
                        <div className="space-y-2">
                          {request.quotes.map((quote, index) => (
                            <div 
                              key={quote.id} 
                              className={`p-3 rounded border ${quote.isSelected ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium">{quote.proveedor}</span>
                                  <span className="ml-2 text-sm text-gray-600">
                                    {formatDate(quote.fechaCotizacion)}
                                  </span>
                                  {quote.isSelected && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                      Seleccionada
                                    </span>
                                  )}
                                </div>
                                <div className="font-semibold">
                                  {formatCurrency(quote.monto)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Información de autorización */}
                    {request.autorizadoPor && (
                      <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-700 mb-1">Autorización:</h4>
                        <p className="text-sm text-blue-600">
                          Autorizado por: {request.autorizadoPor?.nombre} • 
                          Fecha: {formatDate(request.fechaAutorizacion)}
                        </p>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {request.estatus === 'PENDIENTE' && request.quotes?.length > 0 && (
                        <Link
                          href={`/compras/mis-solicitudes/${request.id}`}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm inline-block"
                        >
                          Seleccionar Cotización
                        </Link>
                      )}
                      
                      {request.estatus === 'APROBADO' && (
                        <button
                          onClick={() => {
                            // Aquí iría la lógica para marcar como entregado
                            toast.success('Función de entrega en desarrollo');
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm"
                        >
                          Marcar como Entregado
                        </button>
                      )}
                      
                      {(request.estatus === 'NUEVO' || request.estatus === 'PENDIENTE') && (
                        <button
                          onClick={() => {
                            // Aquí iría la lógica para cancelar
                            toast.success('Función de cancelación en desarrollo');
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium text-sm"
                        >
                          Cancelar Solicitud
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}