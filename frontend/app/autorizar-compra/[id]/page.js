'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

/**
 * Página pública de autorización de compras.
 * NO requiere el módulo COMPRAS, solo autenticación.
 * Permite que Gerentes/Directores/Presidente autoricen compras
 * desde el link enviado por correo.
 */
export default function AutorizarCompraPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const requestId = params.id;

  const [request, setRequest] = useState(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // Guardar la URL actual para redirigir después del login
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && requestId) {
      fetchRequestDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoadingRequest(true);
      const response = await api.get(`/purchases/public/${requestId}`);
      setRequest(response.data.request);
    } catch (error) {
      console.error('Error fetching request:', error);
      const msg = error.response?.data?.message || 'Error al cargar la solicitud';
      toast.error(msg);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleAuthorize = async () => {
    if (!confirm('¿Estás seguro de que deseas AUTORIZAR esta solicitud de compra?')) return;

    try {
      setAuthorizing(true);
      const response = await api.post(`/purchases/public/${requestId}/authorize`);
      toast.success('✅ Solicitud autorizada exitosamente');
      setAuthorized(true);
      // Refrescar los detalles completos de la solicitud (incluye approvers actualizados)
      const refreshed = await api.get(`/purchases/public/${requestId}`);
      setRequest(refreshed.data.request);

    } catch (error) {
      console.error('Error authorizing:', error);
      const msg = error.response?.data?.message || 'Error al autorizar la solicitud';
      toast.error(msg);
    } finally {
      setAuthorizing(false);
    }
  };

  // Estado de carga
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Estado de carga de la solicitud
  if (loadingRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando solicitud...</p>
        </div>
      </div>
    );
  }

  // Error: solicitud no encontrada
  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud no encontrada</h2>
          <p className="text-gray-600 mb-6">La solicitud de compra que buscas no existe o no tienes acceso a ella.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Determinar si se puede autorizar
  const canAuthorize = !authorized && 
    (request.estatus === 'EN_AUTORIZACION' || request.estatus === 'PENDIENTE');

  // Obtener la cotización seleccionada
  const selectedQuote = request.quotes?.find(q => q.isSelected);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Encabezado */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Autorización de Compra</h1>
                <p className="text-blue-100 text-sm mt-1">
                  Folio: #{request.folio || request.id?.substring(0, 8)}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                request.estatus === 'APROBADO' ? 'bg-green-100 text-green-800' :
                request.estatus === 'EN_AUTORIZACION' ? 'bg-yellow-100 text-yellow-800' :
                request.estatus === 'RECHAZADO' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {request.estatus}
              </span>
            </div>
          </div>

          {/* Información de la solicitud */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Solicitante</label>
                <p className="font-medium text-gray-900">{request.solicitante?.nombre || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Departamento</label>
                <p className="font-medium text-gray-900">{request.departamento?.nombre || 'N/A'}</p>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">Justificación</label>
              <p className="font-medium text-gray-900">{request.justificacion || 'Sin justificación'}</p>
            </div>

            {/* Cotización seleccionada */}
            {selectedQuote && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">📄 Cotización Seleccionada</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-blue-600">Proveedor</label>
                    <p className="font-medium text-gray-900">{selectedQuote.proveedor}</p>
                  </div>
                  <div>
                    <label className="text-sm text-blue-600">Monto</label>
                    <p className="font-bold text-lg text-gray-900">
                      ${Number(selectedQuote.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </p>
                  </div>
                </div>
                {selectedQuote.comentarios && (
                  <div className="mt-2">
                    <label className="text-sm text-blue-600">Comentarios</label>
                    <p className="text-gray-700">{selectedQuote.comentarios}</p>
                  </div>
                )}
                {selectedQuote.archivoUrl && (
                  <div className="mt-2">
                    <a
                      href={selectedQuote.archivoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      📎 Ver cotización adjunta
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Items de la solicitud */}
            {request.items?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">📦 Productos/Servicios</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 border-b">Producto/Servicio</th>
                        <th className="text-right p-2 border-b">Cantidad</th>
                        <th className="text-right p-2 border-b">Precio Unit.</th>
                        <th className="text-right p-2 border-b">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {request.items.map((item, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-2">{item.productoServicio}</td>
                          <td className="p-2 text-right">{item.cantidad}</td>
                          <td className="p-2 text-right">
                            {item.precioUnitario 
                              ? `$${Number(item.precioUnitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                              : '—'}
                          </td>
                          <td className="p-2 text-right font-medium">
                            {item.precioUnitario 
                              ? `$${(item.cantidad * item.precioUnitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Aprobadores asignados */}
            {request.approvers?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">👥 Aprobadores Asignados</h3>
                <div className="space-y-2">
                  {request.approvers.map((app, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="font-medium text-gray-900">{app.employee?.nombre || 'N/A'}</p>
                        {app.employee?.nivelJerarquico && (
                          <p className="text-sm text-gray-500">{app.employee.nivelJerarquico}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        app.estatus === 'APROBADO' ? 'bg-green-100 text-green-800' :
                        app.estatus === 'RECHAZADO' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.estatus === 'APROBADO' ? '✅ Aprobado' :
                         app.estatus === 'RECHAZADO' ? '❌ Rechazado' :
                         '⏳ Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Acciones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {authorized ? (
            <div className="text-center py-4">
              <div className="text-green-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">✅ Solicitud Autorizada</h2>
              <p className="text-gray-600 mb-6">
                La solicitud de compra ha sido autorizada exitosamente.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                Ir al Dashboard
              </button>
            </div>
          ) : canAuthorize ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Al autorizar esta solicitud, confirmas que has revisado la información y estás de acuerdo con la compra.
              </p>
              <button
                onClick={handleAuthorize}
                disabled={authorizing}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                {authorizing ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                    Autorizando...
                  </>
                ) : (
                  '✅ AUTORIZAR SOLICITUD'
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-yellow-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-700 mb-2">
                {request.estatus === 'APROBADO' ? '✅ Ya fue autorizada' : 'No se puede autorizar'}
              </h2>
              <p className="text-gray-500 mb-4">
                {request.estatus === 'APROBADO' 
                  ? 'Esta solicitud ya fue autorizada anteriormente.'
                  : `La solicitud está en estatus "${request.estatus}" y no puede ser autorizada en este momento.`}
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                Ir al Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Información del usuario */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Autorizando como: <strong>{user?.name || user?.email}</strong></p>
          <p className="mt-1">ERP KRAM - Sistema de Gestión Empresarial</p>
        </div>
      </div>
    </div>
  );
}
