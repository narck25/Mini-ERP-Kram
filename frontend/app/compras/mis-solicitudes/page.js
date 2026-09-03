'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { getStatusColor, getStatusText, formatDate, formatCurrency } from '@/utils/purchaseHelpers';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const STATUS_ICONS = {
  BORRADOR: '📝', NUEVO: '🆕', PENDIENTE: '⏳', EN_AUTORIZACION: '📋', APROBADO: '✅', ENTREGADO: '📦', CANCELADO: '❌'
};

export default function MisSolicitudesComprasPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

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

  const calculateTotal = (request) => {
    if (!request?.quotes?.length) return 0;
    const selectedQuote = request.quotes.find(q => q.isSelected);
    return selectedQuote?.monto || 0;
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm('¿Estás seguro de cancelar esta solicitud?')) return;
    try {
      setCancellingId(requestId);
      await api.post(`/purchases/${requestId}/cancel`);
      toast.success('Solicitud cancelada exitosamente');
      fetchMyRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error(error.response?.data?.message || 'Error al cancelar la solicitud');
    } finally {
      setCancellingId(null);
    }
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
              <p className="text-gray-600">Solicitudes que has creado</p>
            </div>
            <Link
              href="/compras/nueva-solicitud"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              + Nueva Solicitud
            </Link>
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
          <div className="space-y-4">
            {requests.map((request) => {
              const total = calculateTotal(request);
              const selectedQuote = request?.quotes?.find(q => q.isSelected);
              const isAdminOrCompras = ['ADMIN', 'COMPRAS'].includes(user?.role);
              const isBorrador = request.estatus === 'BORRADOR';
              const canCancel = ['NUEVO', 'PENDIENTE'].includes(request.estatus);
              const canSelectQuote = request.estatus === 'PENDIENTE' && request.quotes?.length > 0;
              const canDelete = (isAdminOrCompras && ['NUEVO', 'PENDIENTE', 'CANCELADO'].includes(request.estatus)) || isBorrador;

              return (
                <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  {/* Encabezado de la tarjeta */}
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icono de estado */}
                          <div className={`hidden sm:flex w-12 h-12 rounded-full items-center justify-center text-2xl ${
                            request.estatus === 'APROBADO' || request.estatus === 'ENTREGADO' ? 'bg-green-100' :
                            request.estatus === 'CANCELADO' || request.estatus === 'BORRADOR' ? 'bg-gray-100' :
                            request.estatus === 'EN_AUTORIZACION' ? 'bg-blue-100' :
                            'bg-yellow-100'
                          }`}>
                            {STATUS_ICONS[request.estatus] || '📄'}
                        </div>

                        {/* Información principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Solicitud #{request.folio}
                            </h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.estatus)}`}>
                              {getStatusText(request.estatus)}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                            <span>📅 {formatDate(request.fechaSolicitud)}</span>
                            {request.departamento && (
                              <span>🏢 {request.departamento.nombre}</span>
                            )}
                            {request.items && (
                              <span>📦 {request.items.length} ítem(s)</span>
                            )}
                          </div>

                          {request.justificacion && (
                            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{request.justificacion}</p>
                          )}
                        </div>
                      </div>

                      {/* Monto y proveedor */}
                      <div className="text-right ml-4 flex-shrink-0">
                        {total > 0 && (
                          <div className="text-xl font-bold text-gray-900">
                            {formatCurrency(total)}
                          </div>
                        )}
                        {selectedQuote && (
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">{selectedQuote.proveedor}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Aprobadores (solo si está en autorización o aprobado) */}
                    {request.approvers?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-3">
                          {request.approvers.map((app, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className={`w-2 h-2 rounded-full ${
                                app.estatus === 'APROBADO' ? 'bg-green-500' :
                                app.estatus === 'RECHAZADO' ? 'bg-red-500' :
                                'bg-yellow-400'
                              }`}></span>
                              <span className="text-gray-700">{app.employee?.nombre || 'N/A'}</span>
                              <span className="text-gray-400 text-xs">
                                {app.employee?.nivelJerarquico || ''}
                              </span>
                              <span className={`text-xs font-medium ${
                                app.estatus === 'APROBADO' ? 'text-green-600' :
                                app.estatus === 'RECHAZADO' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>
                                {app.estatus === 'APROBADO' ? '✓ Aprobó' :
                                 app.estatus === 'RECHAZADO' ? '✗ Rechazó' :
                                 '⏳ Pendiente'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                      {isBorrador ? (
                        <Link
                          href={`/compras/nueva-solicitud?id=${request.id}`}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                        >
                          Continuar editando
                        </Link>
                      ) : (
                        <Link
                          href={`/compras/mis-solicitudes/${request.id}`}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                        >
                          Ver Detalle
                        </Link>
                      )}

                      {canSelectQuote && (
                        <Link
                          href={`/compras/mis-solicitudes/${request.id}`}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                        >
                          Seleccionar Cotización
                        </Link>
                      )}

                      {canCancel && (
                        <button
                          onClick={() => handleCancel(request.id)}
                          disabled={cancellingId === request.id}
                          className="px-4 py-2 bg-white border border-red-300 hover:bg-red-50 text-red-700 rounded-md text-sm font-medium disabled:opacity-50"
                        >
                          {cancellingId === request.id ? 'Cancelando...' : 'Cancelar Solicitud'}
                        </button>
                      )}

                      {/* Eliminar: ADMIN/COMPRAS en estados permitidos, o el dueño si es un borrador */}
                      {canDelete && (
                        <button
                          onClick={async () => {
                            if (!window.confirm('¿Eliminar solicitud? Esta acción no se puede deshacer.')) return;
                            try {
                              await api.delete(`/purchases/${request.id}`);
                              toast.success('Solicitud eliminada');
                              fetchMyRequests();
                            } catch (error) {
                              toast.error(error.response?.data?.message || 'Error al eliminar');
                            }
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
                        >
                          Eliminar
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


