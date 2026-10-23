'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { probationApi } from '@/lib/api/probation';
import { systemApi } from '@/lib/api';
import FeatureToggle from '@/components/FeatureToggle';
import { toast } from 'react-hot-toast';

const TIPO_LABELS = { DIA_30: '30 días', DIA_60: '60 días', DIA_90: '90 días' };

// Dictamen institucional (PDF "Evaluación Desempeño 30/60/90"): resultado
// reutiliza el enum ya existente, ver probationCriteria.config.js.
const RESULTADO_BADGES = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  APROBADO: 'bg-green-100 text-green-800',
  NO_APROBADO: 'bg-red-100 text-red-800',
  EXTENDIDO: 'bg-blue-100 text-blue-800',
};

const RESULTADO_TEXT = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado Satisfactoriamente',
  NO_APROBADO: 'No Satisfactorio',
  EXTENDIDO: 'Aprobado Condicionado (PIP)',
};

// Estado del flujo de dos pasos para una fila PENDIENTE, calculado en el
// frontend a partir de autoevaluacionCompletadaAt (sin campo nuevo en BD).
function estadoFlujo(e) {
  if (e.resultado !== 'PENDIENTE') return null;
  return e.autoevaluacionCompletadaAt
    ? { text: 'Lista para evaluar', cls: 'bg-blue-100 text-blue-800' }
    : { text: 'Esperando autoevaluación', cls: 'bg-gray-100 text-gray-700' };
}

function formatDate(iso) {
  if (!iso) return '—';
  // timeZone: 'UTC' evita el bug del día anterior (fecha guardada como
  // medianoche UTC, leída en la zona horaria local del navegador).
  return new Date(iso).toLocaleDateString('es-MX', { timeZone: 'UTC' });
}

function nombreEmpleado(emp) {
  if (!emp) return '—';
  return `${emp.nombres || emp.nombre || ''} ${emp.apellidoPaterno || ''} ${emp.apellidoMaterno || ''}`.trim();
}

export default function PeriodoPruebaPage() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pendientes');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [pendientesTotal, setPendientesTotal] = useState(0);

  const fetchEvaluations = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 20, soloPendientes: tab === 'pendientes' };
      if (search) params.search = search;
      const res = await probationApi.listAll(params);
      setEvaluations(res.data?.data || []);
      const pag = res.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };
      setPagination(pag);
      if (tab === 'pendientes') setPendientesTotal(pag.total);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar las evaluaciones');
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  // Debounce sobre el efecto, no sobre el handler del input: así el timeout
  // siempre dispara con el cierre (closure) más reciente de fetchEvaluations
  // (que ya trae el valor de búsqueda/tab actual), en vez de capturar uno
  // viejo y pisar el resultado correcto con uno de un caracter atrás.
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchEvaluations(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchEvaluations]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchEvaluations(newPage);
    }
  };

  const visibles = evaluations;

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'RH']} redirectTo="/dashboard/mi-espacio">
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Periodo de Prueba</h1>
            <p className="text-gray-600">Evaluaciones de 30/60/90 días de los empleados nuevos</p>
          </div>

          <div className="mb-6">
            <FeatureToggle
              title="Periodo de Prueba"
              onDescription="El sistema crea la evaluación automáticamente a los 30/60/90 días. Los recordatorios (20/50/80 días) se envían siempre, esté activado o no."
              offDescription="Pausado: no se crean nuevas evaluaciones (lo ya creado no se borra). Los recordatorios (20/50/80 días) se siguen enviando."
              getFn={systemApi.getProbationEvaluationsEnabled}
              setFn={systemApi.setProbationEvaluationsEnabled}
            />
          </div>

          <div className="mb-6 border-b border-gray-200">
            <nav className="flex gap-6">
              <button
                onClick={() => setTab('pendientes')}
                className={`pb-2 px-1 text-sm font-medium border-b-2 ${tab === 'pendientes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Pendientes ({pendientesTotal})
              </button>
              <button
                onClick={() => setTab('historial')}
                className={`pb-2 px-1 text-sm font-medium border-b-2 ${tab === 'historial' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Historial
              </button>
            </nav>
          </div>

          <div className="mb-6 flex justify-end">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre de empleado"
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
            />
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-500">Cargando...</div>
            ) : visibles.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                {tab === 'pendientes' ? 'No hay evaluaciones pendientes.' : 'No hay evaluaciones capturadas todavía.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evaluación</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Programada</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      {tab === 'historial' && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evaluador</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comentarios</th>
                        </>
                      )}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visibles.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{nombreEmpleado(e.empleado)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{TIPO_LABELS[e.tipo] || e.tipo}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatDate(e.fechaProgramada)}</td>
                        <td className="px-6 py-4">
                          {tab === 'pendientes' ? (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoFlujo(e).cls}`}>
                              {estadoFlujo(e).text}
                            </span>
                          ) : (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${RESULTADO_BADGES[e.resultado] || 'bg-gray-100 text-gray-800'}`}>
                              {RESULTADO_TEXT[e.resultado] || e.resultado}
                            </span>
                          )}
                        </td>
                        {tab === 'historial' && (
                          <>
                            <td className="px-6 py-4 text-sm text-gray-500">{e.evaluador?.name || '—'}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-[250px] truncate" title={e.comentarios || ''}>{e.comentarios || '—'}</td>
                          </>
                        )}
                        <td className="px-6 py-4 text-right">
                          {tab === 'pendientes' ? (
                            <button
                              onClick={() => router.push(`/rh/periodo-prueba/${e.id}`)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                            >
                              {e.autoevaluacionCompletadaAt ? 'Capturar' : 'Ver'}
                            </button>
                          ) : (
                            <button
                              onClick={() => router.push(`/rh/periodo-prueba/${e.id}`)}
                              className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium"
                            >
                              Ver detalle
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm border border-gray-200">
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
                    <span className="font-medium">{pagination.total}</span> evaluaciones
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
