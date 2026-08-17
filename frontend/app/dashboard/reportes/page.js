'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { reportApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

const TABS = [
  { key: 'empleados', label: '👥 Empleados' },
  { key: 'compras', label: '🛒 Compras' },
  { key: 'inventario', label: '📦 Inventario' },
  { key: 'asistencia', label: '⏰ Asistencia' },
  { key: 'vacaciones', label: '🏖️ Vacaciones' },
];

const FETCHERS = {
  empleados: (p) => reportApi.getEmpleados(p),
  compras: (p) => reportApi.getCompras(p),
  inventario: () => reportApi.getInventario(),
  asistencia: (p) => reportApi.getAsistencia(p),
  vacaciones: (p) => reportApi.getVacaciones(p),
};

const ESTATUS_OPCIONES = {
  empleados: [['Activo', 'Activos'], ['Inactivo', 'Inactivos']],
  compras: [['NUEVO', 'Nuevo'], ['PENDIENTE', 'Pendiente'], ['EN_AUTORIZACION', 'En autorización'], ['APROBADO', 'Aprobado'], ['ENTREGADO', 'Entregado'], ['CANCELADO', 'Cancelado']],
  vacaciones: [['PENDIENTE', 'Pendiente'], ['AUTORIZADA', 'Autorizada'], ['APROBADA', 'Aprobada'], ['RECHAZADA', 'Rechazada'], ['CANCELADA', 'Cancelada']],
};

const fmt = (iso) => (iso ? new Date(iso).toISOString().substring(0, 10) : '—');
const nombre = (e) => [e?.nombres, e?.apellidoPaterno].filter(Boolean).join(' ') || '—';

const BADGES = {
  Activo: 'bg-green-100 text-green-800', Inactivo: 'bg-gray-100 text-gray-800',
  PENDIENTE: 'bg-yellow-100 text-yellow-800', AUTORIZADA: 'bg-blue-100 text-blue-800',
  APROBADA: 'bg-green-100 text-green-800', RECHAZADA: 'bg-red-100 text-red-800',
  CANCELADA: 'bg-gray-100 text-gray-800', NUEVO: 'bg-yellow-100 text-yellow-800',
  APROBADO: 'bg-green-100 text-green-800', ENTREGADO: 'bg-blue-100 text-blue-800',
  EN_AUTORIZACION: 'bg-purple-100 text-purple-800',
};

function Badge({ v }) {
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${BADGES[v] || 'bg-gray-100 text-gray-800'}`}>{v}</span>;
}

function DataTable({ columns, rows }) {
  if (!rows || rows.length === 0) return <div className="px-6 py-8 text-center text-gray-500">Sin datos.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>{columns.map((c) => <th key={c.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{c.label}</th>)}</tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map((c) => <td key={c.key} className="px-4 py-3 text-sm text-gray-700">{c.render ? c.render(r) : (r[c.key] ?? '—')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryCards({ items }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-200">
      {items.map(([label, value]) => (
        <div key={label}>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
      ))}
    </div>
  );
}

export default function ReportesPage() {
  const [tab, setTab] = useState('empleados');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [estatus, setEstatus] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const buildParams = () => {
    const p = {};
    if (estatus) p.estatus = estatus;
    if (desde) p.fechaDesde = desde;
    if (hasta) p.fechaHasta = hasta;
    return p;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await FETCHERS[tab](buildParams());
      setData(res.data?.data);
    } catch (e) {
      toast.error('Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const changeTab = (key) => {
    setTab(key);
    setEstatus('');
    setDesde('');
    setHasta('');
    setData(null);
    setLoading(true);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, estatus, desde, hasta]);

  const handleExport = async () => {
    try {
      await reportApi.exportXlsx(tab, buildParams());
      toast.success('Reporte exportado');
    } catch (e) {
      toast.error('Error al exportar');
    }
  };

  return (
    <ProtectedRoute requiredModule="REPORTES" redirectTo="/dashboard/mi-espacio">
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
            <p className="text-gray-600">Genera y exporta reportes del sistema</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => changeTab(t.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-wrap gap-4 items-end">
            {ESTATUS_OPCIONES[tab] && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select value={estatus} onChange={(e) => setEstatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">Todos</option>
                  {ESTATUS_OPCIONES[tab].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            )}
            {(tab === 'compras' || tab === 'asistencia') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                  <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                  <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                </div>
              </>
            )}
            <button onClick={handleExport} className="ml-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium">
              ⬇️ Exportar Excel
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-500">Cargando...</div>
            ) : (
              <>
                {tab === 'empleados' && data && (
                  <>
                    <SummaryCards items={[['Total', data.total], ['Activos', data.activos], ['Inactivos', data.inactivos]]} />
                    <DataTable columns={[
                      { key: 'clave', label: 'Clave' },
                      { key: 'nombre', label: 'Nombre', render: (r) => nombre(r) },
                      { key: 'estatus', label: 'Estatus', render: (r) => <Badge v={r.estatus} /> },
                      { key: 'departamento', label: 'Departamento', render: (r) => r.departamento?.nombre },
                      { key: 'puesto', label: 'Puesto', render: (r) => r.puesto?.nombre },
                      { key: 'fechaAlta', label: 'Ingreso', render: (r) => fmt(r.fechaAlta) },
                    ]} rows={data.list} />
                  </>
                )}
                {tab === 'compras' && data && (
                  <>
                    <SummaryCards items={[['Total', data.total]]} />
                    <DataTable columns={[
                      { key: 'folio', label: 'Folio' },
                      { key: 'fechaSolicitud', label: 'Fecha', render: (r) => fmt(r.fechaSolicitud) },
                      { key: 'estatus', label: 'Estatus', render: (r) => <Badge v={r.estatus} /> },
                      { key: 'solicitante', label: 'Solicitante', render: (r) => nombre(r.solicitante) },
                      { key: 'departamento', label: 'Departamento', render: (r) => r.departamento?.nombre },
                      { key: 'items', label: 'Partidas', render: (r) => r._count?.items },
                    ]} rows={data.list} />
                  </>
                )}
                {tab === 'inventario' && data && (
                  <>
                    <h3 className="px-6 pt-4 text-sm font-semibold text-gray-700">Papelería ({data.papeleria.items.length} ítems · {data.papeleria.bajos} bajo mínimo)</h3>
                    <DataTable columns={[
                      { key: 'producto', label: 'Producto' },
                      { key: 'categoria', label: 'Categoría' },
                      { key: 'cantidadActual', label: 'Actual' },
                      { key: 'cantidadMinima', label: 'Mínimo' },
                      { key: 'unidad', label: 'Unidad' },
                    ]} rows={data.papeleria.items} />
                    <h3 className="px-6 pt-4 text-sm font-semibold text-gray-700">Uniformes ({data.uniformes.items.length} ítems · {data.uniformes.bajos} bajo mínimo)</h3>
                    <DataTable columns={[
                      { key: 'tipo', label: 'Tipo' },
                      { key: 'talla', label: 'Talla' },
                      { key: 'genero', label: 'Género' },
                      { key: 'cantidadActual', label: 'Actual' },
                      { key: 'cantidadMinima', label: 'Mínimo' },
                    ]} rows={data.uniformes.items} />
                  </>
                )}
                {tab === 'asistencia' && data && (
                  <DataTable columns={[
                    { key: 'numeroEmpleado', label: 'No. Empleado' },
                    { key: 'nombreEmpleado', label: 'Nombre' },
                    { key: 'fechaHora', label: 'Fecha/Hora', render: (r) => new Date(r.fechaHora).toLocaleString('es-MX') },
                    { key: 'tipo', label: 'Tipo' },
                    { key: 'dispositivo', label: 'Dispositivo' },
                  ]} rows={data.list} />
                )}
                {tab === 'vacaciones' && data && (
                  <>
                    <SummaryCards items={[['Total', data.total]]} />
                    <DataTable columns={[
                      { key: 'empleado', label: 'Empleado', render: (r) => nombre(r.empleado) },
                      { key: 'fechaInicio', label: 'Inicio', render: (r) => fmt(r.fechaInicio) },
                      { key: 'fechaFin', label: 'Fin', render: (r) => fmt(r.fechaFin) },
                      { key: 'estatus', label: 'Estatus', render: (r) => <Badge v={r.estatus} /> },
                      { key: 'motivo', label: 'Motivo' },
                    ]} rows={data.list} />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
