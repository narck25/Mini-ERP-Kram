'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import QuoteSelectionModal from '@/components/QuoteSelectionModal';
import SendAuthorizationModal from '@/components/SendAuthorizationModal';

export default function ComprasAdminPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedRequestForAuth, setSelectedRequestForAuth] = useState(null);

  useEffect(() => {
    if (user && user.accessibleModules?.includes('COMPRAS')) {
      fetchAllRequests();
      fetchStats();
    }
  }, [user, statusFilter]);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/purchases?status=${statusFilter}` : '/purchases';
      const response = await api.get(url);
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      toast.error('Error al cargar las solicitudes de compra');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calcular estadísticas desde los datos
      const allRequests = await api.get('/purchases');
      const data = allRequests.data.requests || [];
      
      const statsData = {
        total: data.length,
        nuevo: data.filter(r => r.estatus === 'NUEVO').length,
        pendiente: data.filter(r => r.estatus === 'PENDIENTE').length,
        enAutorizacion: data.filter(r => r.estatus === 'EN_AUTORIZACION').length,
        aprobado: data.filter(r => r.estatus === 'APROBADO').length,
        entregado: data.filter(r => r.estatus === 'ENTREGADO').length,
        cancelado: data.filter(r => r.estatus === 'CANCELADO').length,
      };
      
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
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
      case 'PENDIENTE': return 'Pendiente';
      case 'EN_AUTORIZACION': return 'En Autorización';
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
    
    // Primero buscar cotización seleccionada
    const selectedQuote = request.quotes.find(q => q.isSelected);
    if (selectedQuote) return selectedQuote.monto;
    
    // Si no hay seleccionada, mostrar la cotización con el monto más bajo
    const lowestQuote = request.quotes.reduce((lowest, current) => {
      return current.monto < lowest.monto ? current : lowest;
    });
    
    return lowestQuote?.monto || 0;
  };

  const getAmountDisplay = (request) => {
    if (!request?.quotes?.length) return 'Sin cotización';
    
    // Primero buscar cotización seleccionada
    const selectedQuote = request.quotes.find(q => q.isSelected);
    if (selectedQuote) return formatCurrency(selectedQuote.monto);
    
    // Si no hay seleccionada, mostrar la cotización con el monto más bajo
    const lowestQuote = request.quotes.reduce((lowest, current) => {
      return current.monto < lowest.monto ? current : lowest;
    });
    
    return formatCurrency(lowestQuote?.monto || 0);
  };

  const handleMarkAsDelivered = async (requestId) => {
    if (!confirm('¿Marcar esta solicitud como entregada?')) return;
    
    try {
      await api.post(`/purchases/${requestId}/deliver`);
      toast.success('Solicitud marcada como entregada');
      fetchAllRequests();
      fetchStats();
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error(error.response?.data?.message || 'Error al marcar como entregada');
    }
  };

  const handleExportExcel = () => {
    if (!requests.length) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      // Mapear los datos para exportación
      const dataToExport = requests.map(request => {
        // Obtener el monto de la cotización seleccionada o la más baja
        let monto = 0;
        let montoTexto = 'Sin cotización';
        
        if (request?.quotes?.length) {
          const selectedQuote = request.quotes.find(q => q.isSelected);
          if (selectedQuote) {
            monto = selectedQuote.monto;
            montoTexto = formatCurrency(selectedQuote.monto);
          } else {
            const lowestQuote = request.quotes.reduce((lowest, current) => {
              return current.monto < lowest.monto ? current : lowest;
            });
            monto = lowestQuote?.monto || 0;
            montoTexto = formatCurrency(lowestQuote?.monto || 0);
          }
        }

        return {
          "ID Solicitud": request.id,
          "Folio": `#${request.folio}`,
          "Fecha Solicitud": formatDate(request.fechaSolicitud),
          "Fecha Creación": formatDate(request.createdAt),
          "Departamento": request.departamento?.nombre || 'N/A',
          "Solicitante": request.solicitante?.nombre || 'N/A',
          "Email Solicitante": request.solicitante?.user?.email || '',
          "Estatus": getStatusText(request.estatus),
          "Monto": monto,
          "Monto Formateado": montoTexto,
          "Artículos (Cantidad)": request.items?.length || 0,
          "Cotizaciones Recibidas": request.quotes?.length || 0,
          "Cotización Seleccionada": request.quotes?.some(q => q.isSelected) ? 'Sí' : 'No',
          "Autorizado Por": request.autorizadoPor?.nombre || 'N/A',
          "Fecha Autorización": formatDate(request.fechaAutorizacion),
          "Observaciones": request.observaciones || '',
          "Prioridad": request.prioridad || 'Normal'
        };
      });

      // Crear hoja de trabajo
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      
      // Ajustar el ancho de las columnas
      const maxWidth = dataToExport.reduce((acc, row) => {
        Object.keys(row).forEach(key => {
          const cellValue = String(row[key] || '');
          acc[key] = Math.max(acc[key] || 0, cellValue.length);
        });
        return acc;
      }, {});
      
      const colWidths = Object.keys(maxWidth).map(key => ({ wch: Math.min(maxWidth[key] + 2, 50) }));
      worksheet['!cols'] = colWidths;

      // Crear libro de trabajo
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Solicitudes de Compra");

      // Generar nombre de archivo con fecha
      const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileName = `Reporte_Compras_${fecha}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Reporte exportado exitosamente: ${fileName}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Error al exportar el reporte a Excel');
    }
  };

  // Verificar permisos
  const hasAccess = user && user.accessibleModules?.includes('COMPRAS');
  
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">No tiene permisos para acceder al panel de administración de compras.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Administración de Compras</h1>
              <p className="text-gray-600">Gestión de todas las solicitudes de compra del sistema</p>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700">Total</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-white border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700">Nuevo</h3>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.nuevo}</p>
            </div>
            <div className="bg-white border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700">Pendiente</h3>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendiente}</p>
            </div>
            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700">En Autorización</h3>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.enAutorizacion}</p>
            </div>
            <div className="bg-white border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700">Aprobado</h3>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.aprobado}</p>
            </div>
            <div className="bg-white border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700">Entregado</h3>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.entregado}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700">Cancelado</h3>
              <p className="text-2xl font-bold text-gray-600 mt-1">{stats.cancelado}</p>
            </div>
          </div>
        )}

        {/* Gráfica de tendencias */}
        {stats && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Solicitudes por Estado</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'Nuevo', value: stats.nuevo || 0, fill: '#EF4444' },
                { name: 'Pendiente', value: stats.pendiente || 0, fill: '#F59E0B' },
                { name: 'En Aut.', value: stats.enAutorizacion || 0, fill: '#3B82F6' },
                { name: 'Aprobado', value: stats.aprobado || 0, fill: '#10B981' },
                { name: 'Entregado', value: stats.entregado || 0, fill: '#059669' },
                { name: 'Cancelado', value: stats.cancelado || 0, fill: '#6B7280' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {[
                    { name: 'Nuevo', value: stats.nuevo || 0, fill: '#EF4444' },
                    { name: 'Pendiente', value: stats.pendiente || 0, fill: '#F59E0B' },
                    { name: 'En Aut.', value: stats.enAutorizacion || 0, fill: '#3B82F6' },
                    { name: 'Aprobado', value: stats.aprobado || 0, fill: '#10B981' },
                    { name: 'Entregado', value: stats.entregado || 0, fill: '#059669' },
                    { name: 'Cancelado', value: stats.cancelado || 0, fill: '#6B7280' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por estado:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="NUEVO">Nuevo</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_AUTORIZACION">En Autorización</option>
                <option value="APROBADO">Aprobado</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div className="flex-1"></div>
            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                disabled={!requests.length}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar a Excel
              </button>
              <button
                onClick={fetchAllRequests}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de solicitudes */}
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
            <p className="text-gray-600">No se encontraron solicitudes con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Folio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solicitante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ítems
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => {
                    const amountDisplay = getAmountDisplay(request);
                    
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            #{request.folio}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {request.solicitante?.nombre || 'N/A'}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {request.solicitante?.user?.email || ''}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.departamento?.nombre || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.fechaSolicitud)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.estatus)}`}>
                            {getStatusText(request.estatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {amountDisplay}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.items?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/dashboard/compras/${request.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Gestionar
                          </Link>
                          {(request.estatus === 'PENDIENTE' || request.estatus === 'EN_AUTORIZACION') && (
                            <button
                              onClick={() => {
                                setSelectedRequestForAuth(request);
                                setShowAuthModal(true);
                              }}
                              className="text-purple-600 hover:text-purple-900 mr-3"
                            >
                              {request.estatus === 'EN_AUTORIZACION' ? 'Reenviar' : 'Autorizar'}
                            </button>
                          )}
                          {request.estatus === 'APROBADO' && (
                            <button
                              onClick={() => handleMarkAsDelivered(request.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Entregar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Enviar a Autorización */}
        {showAuthModal && selectedRequestForAuth && (
          <SendAuthorizationModal
            request={selectedRequestForAuth}
            onClose={() => {
              setShowAuthModal(false);
              setSelectedRequestForAuth(null);
            }}
            onSuccess={() => {
              fetchAllRequests();
              fetchStats();
            }}
          />
        )}

        {/* Información */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Funciones del administrador de compras</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Estado NUEVO:</strong> Subir cotizaciones (1 a 3, no es forzoso tener 3)</li>
                  <li><strong>Estado PENDIENTE:</strong> Admin/Compras debe seleccionar la cotización más conveniente</li>
                  <li><strong>Estado EN_AUTORIZACION:</strong> Solicitudes mayores a $50,000 MXN requieren autorización adicional</li>
                  <li><strong>Estado APROBADO:</strong> Puedes marcar como entregado cuando se complete la compra</li>
                  <li><strong>Estado ENTREGADO:</strong> Solicitud completada</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}