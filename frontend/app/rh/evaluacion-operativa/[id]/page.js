'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { operationalEvaluationApi } from '@/lib/api/operationalEvaluation';
import { toast } from 'react-hot-toast';

const SECCIONES = [
  { key: 'rh', label: 'I. Recursos Humanos', ponderacion: 30 },
  { key: 'actitud', label: 'II. Mentalidad y Actitud', ponderacion: 20 },
  { key: 'desempeno', label: 'III. Desempeño y Productividad', ponderacion: 50 },
];

const RESULTADO_LABELS = {
  PENDIENTE: 'Pendiente',
  APROBADO_DISTINCION: 'Aprobado',
  EN_DESARROLLO: 'En Desarrollo — sin incremento, con plan de mejora',
  NO_APROBADO: 'No Aprobado — requiere acción inmediata',
};

const RESULTADO_BADGE = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  APROBADO_DISTINCION: 'bg-green-100 text-green-800',
  EN_DESARROLLO: 'bg-orange-100 text-orange-800',
  NO_APROBADO: 'bg-red-100 text-red-800',
};

function ScaleButtons({ value, onChange, disabled }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`w-8 h-8 rounded-md text-sm font-medium border ${
            value === n
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function EvaluacionOperativaDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [evaluation, setEvaluation] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [calificaciones, setCalificaciones] = useState({ rh: {}, actitud: {}, desempeno: {} });
  const [fortalezas, setFortalezas] = useState('');
  const [areasMejora, setAreasMejora] = useState('');
  const [compromisos, setCompromisos] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const backTarget = user?.role === 'ADMIN' || user?.role === 'RH' ? '/rh/evaluacion-operativa' : '/dashboard/mi-espacio';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [evalRes, templatesRes] = await Promise.all([
          operationalEvaluationApi.getById(id),
          operationalEvaluationApi.getCriteriaTemplates(),
        ]);
        const ev = evalRes.data?.data;
        setEvaluation(ev);

        // El puesto guardado en la evaluación puede ser un alias real del CSV
        // (ej. "AYUDANTE DE ALMACEN CUN") y no el nombre canónico de la
        // plantilla (ej. "Ayudante General") — se resuelve igual que
        // getTemplateByPuestoNombre en el backend: primero coincidencia
        // exacta insensible a mayúsculas, luego el mapa de alias.
        const templatesData = templatesRes.data?.data;
        const puestoNormalizado = (ev.puesto || '').trim().toLowerCase();
        const puestoCanonico = Object.keys(templatesData?.templates || {}).find(
          (k) => k.toLowerCase() === puestoNormalizado
        ) || templatesData?.aliases?.[puestoNormalizado];
        const tpl = puestoCanonico ? templatesData.templates[puestoCanonico] : null;
        setTemplate(tpl);

        if (ev.criterios) {
          setCalificaciones({
            rh: ev.criterios.rh || {},
            actitud: ev.criterios.actitud || {},
            desempeno: ev.criterios.desempeno || {},
          });
        }
        setFortalezas(ev.fortalezas || '');
        setAreasMejora(ev.areasMejora || '');
        setCompromisos(ev.compromisos || '');
        setObservaciones(ev.observaciones || '');
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.error || 'Error al cargar la evaluación');
        router.push(backTarget);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const readOnly = evaluation && evaluation.resultado !== 'PENDIENTE';

  const setCalificacion = (seccion, key, val) => {
    setCalificaciones((prev) => ({ ...prev, [seccion]: { ...prev[seccion], [key]: val } }));
  };

  const faltantes = template
    ? SECCIONES.reduce((acc, s) => acc + template[s.key].filter((item) => !calificaciones[s.key]?.[item.key]).length, 0)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (faltantes > 0) {
      toast.error(`Faltan ${faltantes} criterios por calificar`);
      return;
    }
    try {
      setSaving(true);
      await operationalEvaluationApi.capture(id, {
        criterios: calificaciones,
        fortalezas,
        areasMejora,
        compromisos,
        observaciones,
      });
      toast.success('Evaluación capturada');
      router.push(backTarget);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Error al capturar la evaluación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute redirectTo="/login">
      {/* Sin allowedRoles: cualquier jefe directo (no solo RH/ADMIN) debe poder
          capturar la evaluación de su propio subordinado. El control de acceso
          real (RH/ADMIN o jefe directo del empleado) lo hace el backend. */}
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto">
          {loading || !evaluation ? (
            <div className="text-center text-gray-500 py-8">Cargando...</div>
          ) : !template ? (
            <div className="text-center text-red-600 py-8">
              No hay una plantilla de criterios definida para el puesto &quot;{evaluation.puesto}&quot;.
            </div>
          ) : (
            <>
              <button onClick={() => router.push(backTarget)} className="text-blue-600 hover:underline text-sm mb-4">
                ← Volver al listado
              </button>

              <h1 className="text-2xl font-bold text-gray-900">Evaluación Operativa Trimestral</h1>
              <p className="text-gray-600 mb-1">
                {evaluation.empleado?.nombres || evaluation.empleado?.nombre} {evaluation.empleado?.apellidoPaterno} {evaluation.empleado?.apellidoMaterno} — {evaluation.puesto} · Trimestre #{evaluation.periodo}
              </p>
              <p className="text-sm text-gray-500 mb-6">Evaluador: Jefe Directo · Mínimo aprobatorio: 90%</p>

              {readOnly && (
                <div className={`mb-6 px-4 py-3 rounded-lg ${RESULTADO_BADGE[evaluation.resultado]}`}>
                  <span className="font-semibold">{RESULTADO_LABELS[evaluation.resultado]}</span>
                  {evaluation.calificacionFinal != null && (
                    <span className="ml-2">— Calificación final: {evaluation.calificacionFinal}%</span>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {SECCIONES.map((seccion) => (
                  <div key={seccion.key} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-baseline justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">{seccion.label}</h2>
                      <span className="text-sm text-gray-500">Ponderación: {seccion.ponderacion}%</span>
                    </div>
                    <div className="space-y-4">
                      {template[seccion.key].map((item) => (
                        <div key={item.key} className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium text-gray-900">{item.label} <span className="text-gray-400 font-normal">({item.peso}%)</span></p>
                            <p className="text-sm text-gray-500">{item.criterio}</p>
                          </div>
                          <ScaleButtons
                            value={calificaciones[seccion.key]?.[item.key]}
                            onChange={(v) => setCalificacion(seccion.key, item.key, v)}
                            disabled={readOnly}
                          />
                        </div>
                      ))}
                    </div>
                    {readOnly && evaluation[`subtotal${seccion.key === 'rh' ? 'RH' : seccion.key === 'actitud' ? 'Actitud' : 'Desempeno'}`] != null && (
                      <p className="mt-4 text-sm text-gray-600 text-right">
                        Subtotal: {evaluation[`subtotal${seccion.key === 'rh' ? 'RH' : seccion.key === 'actitud' ? 'Actitud' : 'Desempeno'}`]} / {seccion.ponderacion} pts
                      </p>
                    )}
                  </div>
                ))}

                <div className="bg-white rounded-lg shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fortalezas observadas</label>
                    <textarea
                      value={fortalezas}
                      onChange={(e) => setFortalezas(e.target.value)}
                      disabled={readOnly}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Áreas de mejora / plan de acción</label>
                    <textarea
                      value={areasMejora}
                      onChange={(e) => setAreasMejora(e.target.value)}
                      disabled={readOnly}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compromisos del colaborador</label>
                    <textarea
                      value={compromisos}
                      onChange={(e) => setCompromisos(e.target.value)}
                      disabled={readOnly}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones adicionales del evaluador</label>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      disabled={readOnly}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  Obtener una calificación final igual o superior al 90% no implica automáticamente un incremento salarial.
                  El resultado aprobatorio únicamente acredita al colaborador como elegible para ser considerado en una eventual
                  revisión de compensación, sujeta a las necesidades operativas, la disponibilidad presupuestal y la decisión de
                  Gerencia General.
                </div>

                {!readOnly && (
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => router.push(backTarget)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-60"
                    >
                      {saving ? 'Guardando...' : 'Capturar evaluación'}
                    </button>
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
