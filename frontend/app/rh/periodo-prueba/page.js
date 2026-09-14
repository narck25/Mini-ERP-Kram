'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { probationApi } from '@/lib/api/probation';
import { toast } from 'react-hot-toast';
import ProbationCaptureModal from '@/components/ProbationCaptureModal';

const TIPO_LABELS = { DIA_30: '30 días', DIA_60: '60 días', DIA_90: '90 días' };

const RESULTADO_BADGES = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  APROBADO: 'bg-green-100 text-green-800',
  NO_APROBADO: 'bg-red-100 text-red-800',
  EXTENDIDO: 'bg-blue-100 text-blue-800',
};

const RESULTADO_TEXT = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  NO_APROBADO: 'No aprobado',
  EXTENDIDO: 'Extendido',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX');
}

function nombreEmpleado(emp) {
  if (!emp) return '—';
  return `${emp.nombres || emp.nombre || ''} ${emp.apellidoPaterno || ''} ${emp.apellidoMaterno || ''}`.trim();
}

export default function PeriodoPruebaPage() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pendientes');
  const [captureModal, setCaptureModal] = useState(null);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const res = await probationApi.listAll();
      setEvaluations(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar las evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const pendientes = evaluations.filter(e => e.resultado === 'PENDIENTE');
  const historial = evaluations.filter(e => e.resultado !== 'PENDIENTE');
  const visibles = tab === 'pendientes' ? pendientes : historial;

  const handleCapture = async (id, data) => {
    try {
      await probationApi.capture(id, data);
      toast.success('Evaluación capturada');
      await fetchEvaluations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al capturar la evaluación');
      throw error;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'RH']} redirectTo="/dashboard/mi-espacio">
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Periodo de Prueba</h1>
            <p className="text-gray-600">Evaluaciones de 30/60/90 días de los empleados nuevos</p>
          </div>

          <div className="mb-6 border-b border-gray-200">
            <nav className="flex gap-6">
              <button
                onClick={() => setTab('pendientes')}
                className={`pb-2 px-1 text-sm font-medium border-b-2 ${tab === 'pendientes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Pendientes ({pendientes.length})
              </button>
              <button
                onClick={() => setTab('historial')}
                className={`pb-2 px-1 text-sm font-medium border-b-2 ${tab === 'historial' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Historial
              </button>
            </nav>
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
                      {tab === 'pendientes' && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visibles.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{nombreEmpleado(e.empleado)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{TIPO_LABELS[e.tipo] || e.tipo}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatDate(e.fechaProgramada)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${RESULTADO_BADGES[e.resultado] || 'bg-gray-100 text-gray-800'}`}>
                            {RESULTADO_TEXT[e.resultado] || e.resultado}
                          </span>
                        </td>
                        {tab === 'historial' && (
                          <>
                            <td className="px-6 py-4 text-sm text-gray-500">{e.evaluador?.name || '—'}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-[250px] truncate" title={e.comentarios || ''}>{e.comentarios || '—'}</td>
                          </>
                        )}
                        {tab === 'pendientes' && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setCaptureModal(e)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                            >
                              Capturar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <ProbationCaptureModal
          evaluation={captureModal}
          onClose={() => setCaptureModal(null)}
          onSubmit={handleCapture}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
