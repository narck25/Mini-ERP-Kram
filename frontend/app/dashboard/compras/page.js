'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import QuoteSelectionModal from '@/components/QuoteSelectionModal';
import SendAuthorizationModal from '@/components/SendAuthorizationModal';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function ComprasAdminPage() {
  const { user } = useAuth();
  // Dataset completo (sin paginar) — alimenta estadísticas, gráficas, gastos
  // por depto/proveedor y la exportación a Excel, que siempre deben reflejar
  // TODO lo que hay (filtrado solo por estado), no nada más la página actual.
  const [requests, setRequests] = useState([]);
  // Subconjunto paginado/buscado — es lo único que alimenta la tabla.
  const [tableRequests, setTableRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  // Por defecto, el mes actual — así la pantalla abre mostrando lo relevante
  // en vez de todo el historial. "Todos" sigue disponible limpiando el filtro.
  const [anioFilter, setAnioFilter] = useState(() => String(new Date().getFullYear()));
  const [mesFilter, setMesFilter] = useState(() => String(new Date().getMonth() + 1));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedRequestForAuth, setSelectedRequestForAuth] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const hasAccess = user && user.accessibleModules?.includes('COMPRAS');

  const fetchFullData = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (anioFilter) params.append('anio', anioFilter);
      if (mesFilter) params.append('mes', mesFilter);
      params.append('limit', '1000');
      const response = await api.get(`/purchases?${params.toString()}`);
      const data = response.data.requests || [];
      setRequests(data);

      const statsData = {
        total: data.length,
        nuevo: data.filter(r => r.estatus === 'NUEVO').length,
        enProceso: data.filter(r => r.estatus === 'EN_PROCESO').length,
        pendiente: data.filter(r => r.estatus === 'PENDIENTE').length,
        enAutorizacion: data.filter(r => r.estatus === 'EN_AUTORIZACION').length,
        aprobado: data.filter(r => r.estatus === 'APROBADO').length,
        entregado: data.filter(r => r.estatus === 'ENTREGADO').length,
        cancelado: data.filter(r => r.estatus === 'CANCELADO').length,
      };
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      toast.error('Error al cargar las solicitudes de compra');
    }
  };

  const fetchTableRequests = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (anioFilter) params.append('anio', anioFilter);
      if (mesFilter) params.append('mes', mesFilter);
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', '20');
      const response = await api.get(`/purchases?${params.toString()}`);
      setTableRequests(response.data.requests || []);
      setPagination(response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      toast.error('Error al cargar las solicitudes de compra');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, anioFilter, mesFilter, search]);

  const refreshAll = () => {
    fetchFullData();
    fetchTableRequests(pagination.page);
  };

  useEffect(() => {
    if (hasAccess) fetchFullData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statusFilter, anioFilter, mesFilter]);

  // Debounce sobre el efecto (no sobre el onChange del input de búsqueda):
  // así siempre corre con el closure más reciente de fetchTableRequests, sin
  // el riesgo de carrera que ya encontramos antes en el buscador de empleados.
  // IMPORTANTE: `hasAccess` va en las deps además de `fetchTableRequests` —
  // `user` carga async desde el contexto de auth, así que en el primer
  // render `hasAccess` suele ser false y este efecto no dispara nada; sin
  // `hasAccess` aquí, la tabla se quedaba en "Cargando..." para siempre una
  // vez que `user` sí llegaba, porque `fetchTableRequests` no cambia de
  // identidad solo porque `user`/`hasAccess` cambien (sus deps son los
  // filtros, no el usuario) — solo se "arreglaba" al presionar Actualizar,
  // que llama fetchTableRequests directo sin pasar por este guard.
  useEffect(() => {
    if (!hasAccess) return;
    const timeout = setTimeout(() => {
      fetchTableRequests(1);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTableRequests, hasAccess]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTableRequests(newPage);
    }
  };

  const getStatusColor = (estatus) => {
    switch (estatus) {
      case 'NUEVO': return 'bg-red-100 text-red-800';
      case 'EN_PROCESO': return 'bg-orange-100 text-orange-800';
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
      case 'EN_PROCESO': return 'En Proceso';
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
      refreshAll();
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error(error.response?.data?.message || 'Error al marcar como entregada');
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta solicitud? Se eliminarán todos los datos relacionados (cotizaciones, comentarios, órdenes de compra, etc.). Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      setDeletingId(requestId);
      await api.delete(`/purchases/${requestId}`);
      toast.success('Solicitud eliminada exitosamente');
      refreshAll();
    } catch (error) {
      console.error('Error deleting purchase request:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar la solicitud');
    } finally {
      setDeletingId(null);
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

  // ─────────────────────────────────────────────────────────────
  // Calcular gastos por departamento (solicitudes APROBADAS y ENTREGADAS)
  // ─────────────────────────────────────────────────────────────
  const gastosPorDepto = (() => {
    const deptos = {};
    const estadosGasto = ['APROBADO', 'ENTREGADO'];

    requests.forEach(req => {
      if (!estadosGasto.includes(req.estatus)) return;
      const depto = req.departamento?.nombre || 'Sin departamento';
      const monto = calculateTotal(req);

      if (!deptos[depto]) {
        deptos[depto] = { departamento: depto, total: 0, cantidad: 0 };
      }
      deptos[depto].total += monto;
      deptos[depto].cantidad += 1;
    });

    return Object.values(deptos).sort((a, b) => b.total - a.total);
  })();
  // Solo para la gráfica — la tabla de abajo sigue mostrando todos.
  const gastosPorDeptoChart = gastosPorDepto.slice(0, 8);

  // ─────────────────────────────────────────────────────────────
  // Calcular gastos por proveedor (mismo criterio: APROBADO/ENTREGADO)
  // Agrupa por el nombre snapshot del proveedor (siempre presente,
  // incluso en cotizaciones anteriores al catálogo de proveedores).
  // ─────────────────────────────────────────────────────────────
  const gastosPorProveedor = (() => {
    const proveedores = {};
    const estadosGasto = ['APROBADO', 'ENTREGADO'];

    requests.forEach(req => {
      if (!estadosGasto.includes(req.estatus)) return;
      if (!req?.quotes?.length) return;
      const selectedQuote = req.quotes.find(q => q.isSelected);
      const quote = selectedQuote || req.quotes.reduce((lowest, current) => current.monto < lowest.monto ? current : lowest);
      const proveedor = quote?.proveedor || 'Sin proveedor';
      const monto = calculateTotal(req);

      if (!proveedores[proveedor]) {
        proveedores[proveedor] = { proveedor, total: 0, cantidad: 0 };
      }
      proveedores[proveedor].total += monto;
      proveedores[proveedor].cantidad += 1;
    });

    return Object.values(proveedores).sort((a, b) => b.total - a.total);
  })();
  // Solo para la gráfica — la tabla de abajo sigue mostrando todos.
  const gastosPorProveedorChart = gastosPorProveedor.slice(0, 8);

  const exportGastosPorProveedor = () => {
    if (!gastosPorProveedor.length) {
      toast.error('No hay datos de gastos para exportar');
      return;
    }
    try {
      const totalGeneral = gastosPorProveedor.reduce((s, p) => s + p.total, 0);
      const totalCantidad = gastosPorProveedor.reduce((s, p) => s + p.cantidad, 0);

      const dataToExport = [
        ...gastosPorProveedor.map(p => ({
          "Proveedor": p.proveedor,
          "Solicitudes Completadas": p.cantidad,
          "Total Gastado": p.total,
          "Total Formateado": formatCurrency(p.total)
        })),
        {
          "Proveedor": "TOTAL GENERAL",
          "Solicitudes Completadas": totalCantidad,
          "Total Gastado": totalGeneral,
          "Total Formateado": formatCurrency(totalGeneral)
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const maxWidth = dataToExport.reduce((acc, row) => {
        Object.keys(row).forEach(key => {
          const cellValue = String(row[key] || '');
          acc[key] = Math.max(acc[key] || 0, cellValue.length);
        });
        return acc;
      }, {});
      worksheet['!cols'] = Object.keys(maxWidth).map(key => ({ wch: Math.min(maxWidth[key] + 2, 50) }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Gastos por Proveedor");

      const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
      XLSX.writeFile(workbook, `Gastos_por_Proveedor_${fecha}.xlsx`);
      toast.success('Reporte de gastos por proveedor exportado exitosamente');
    } catch (error) {
      console.error('Error exporting gastos:', error);
      toast.error('Error al exportar el reporte de gastos');
    }
  };

  const exportGastosPorDepartamento = () => {
    if (!gastosPorDepto.length) {
      toast.error('No hay datos de gastos para exportar');
      return;
    }
    try {
      const totalGeneral = gastosPorDepto.reduce((s, d) => s + d.total, 0);
      const totalCantidad = gastosPorDepto.reduce((s, d) => s + d.cantidad, 0);

      const dataToExport = [
        ...gastosPorDepto.map(d => ({
          "Departamento": d.departamento,
          "Solicitudes Completadas": d.cantidad,
          "Total Gastado": d.total,
          "Total Formateado": formatCurrency(d.total)
        })),
        {
          "Departamento": "TOTAL GENERAL",
          "Solicitudes Completadas": totalCantidad,
          "Total Gastado": totalGeneral,
          "Total Formateado": formatCurrency(totalGeneral)
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const maxWidth = dataToExport.reduce((acc, row) => {
        Object.keys(row).forEach(key => {
          const cellValue = String(row[key] || '');
          acc[key] = Math.max(acc[key] || 0, cellValue.length);
        });
        return acc;
      }, {});
      worksheet['!cols'] = Object.keys(maxWidth).map(key => ({ wch: Math.min(maxWidth[key] + 2, 50) }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Gastos por Departamento");

      const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
      XLSX.writeFile(workbook, `Gastos_por_Departamento_${fecha}.xlsx`);
      toast.success('Reporte de gastos por departamento exportado exitosamente');
    } catch (error) {
      console.error('Error exporting gastos:', error);
      toast.error('Error al exportar el reporte de gastos');
    }
  };

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

        {/* Filtros */}
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar:
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Folio, solicitante, departamento..."
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
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
                <option value="EN_PROCESO">En Proceso</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_AUTORIZACION">En Autorización</option>
                <option value="APROBADO">Aprobado</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <select
                value={anioFilter}
                onChange={(e) => { setAnioFilter(e.target.value); if (!e.target.value) setMesFilter(''); }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
              <select
                value={mesFilter}
                onChange={(e) => setMesFilter(e.target.value)}
                disabled={!anioFilter}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Todos</option>
                {MESES.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
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
                onClick={refreshAll}
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
        ) : tableRequests.length === 0 ? (
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
                  {tableRequests.map((request) => {
                    const amountDisplay = getAmountDisplay(request);

                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
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
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Entregar
                            </button>
                          )}
                          {/* Botón Eliminar: solo ADMIN y COMPRAS, solo en estatus NUEVO, PENDIENTE o CANCELADO */}
                          {['NUEVO', 'EN_PROCESO', 'PENDIENTE', 'CANCELADO'].includes(request.estatus) && (
                            <button
                              onClick={() => handleDelete(request.id)}
                              disabled={deletingId === request.id}
                              className="text-red-700 hover:text-red-900 disabled:opacity-50"
                            >
                              {deletingId === request.id ? 'Eliminando...' : 'Eliminar'}
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

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 mt-4 mb-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Anterior
              </button>
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de{' '}
                  <span className="font-medium">{pagination.total}</span> solicitudes
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="sr-only">Primera</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                  </button>
                  <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="sr-only">Anterior</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                    .map((p, idx, arr) => (
                      <span key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
                        )}
                        <button onClick={() => handlePageChange(p)} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${p === pagination.page ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                          {p}
                        </button>
                      </span>
                    ))}
                  <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="sr-only">Siguiente</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                  </button>
                  <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="sr-only">Última</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700">Total</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-white border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700">Nuevo</h3>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.nuevo}</p>
            </div>
            <div className="bg-white border border-orange-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700">En Proceso</h3>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.enProceso}</p>
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
                { name: 'En Proceso', value: stats.enProceso || 0, fill: '#F97316' },
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
                    { name: 'En Proceso', value: stats.enProceso || 0, fill: '#F97316' },
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

        {/* Gastos por Departamento */}
        {requests.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Gastos por Departamento</h2>
              <button
                onClick={() => exportGastosPorDepartamento()}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Montos totales de solicitudes aprobadas y entregadas, agrupados por departamento.
              {gastosPorDepto.length > 8 && ' Gráfica: top 8 — la tabla de abajo muestra todos.'}
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gastosPorDeptoChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="departamento" />
                <YAxis tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Departamento</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Solicitudes</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Total Gastado</th>
                  </tr>
                </thead>
                <tbody>
                  {gastosPorDepto.map((depto, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{depto.departamento}</td>
                      <td className="py-2 px-3 text-right">{depto.cantidad}</td>
                      <td className="py-2 px-3 text-right font-semibold">{formatCurrency(depto.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-2 px-3">TOTAL GENERAL</td>
                    <td className="py-2 px-3 text-right">{gastosPorDepto.reduce((s, d) => s + d.cantidad, 0)}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(gastosPorDepto.reduce((s, d) => s + d.total, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Gasto por Proveedor */}
        {requests.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Gasto por Proveedor</h2>
              <button
                onClick={() => exportGastosPorProveedor()}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Montos totales de solicitudes aprobadas y entregadas, agrupados por proveedor de la cotización usada.
              {gastosPorProveedor.length > 8 && ' Gráfica: top 8 — la tabla de abajo muestra todos.'}
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gastosPorProveedorChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="proveedor" />
                <YAxis tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Proveedor</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Solicitudes</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Total Gastado</th>
                  </tr>
                </thead>
                <tbody>
                  {gastosPorProveedor.map((prov, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{prov.proveedor}</td>
                      <td className="py-2 px-3 text-right">{prov.cantidad}</td>
                      <td className="py-2 px-3 text-right font-semibold">{formatCurrency(prov.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-2 px-3">TOTAL GENERAL</td>
                    <td className="py-2 px-3 text-right">{gastosPorProveedor.reduce((s, p) => s + p.cantidad, 0)}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(gastosPorProveedor.reduce((s, p) => s + p.total, 0))}</td>
                  </tr>
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
              refreshAll();
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
