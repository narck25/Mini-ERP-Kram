'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { probationApi } from '@/lib/api/probation';
import { toast } from 'react-hot-toast';

const TIPO_LABELS = { DIA_30: '30 días', DIA_60: '60 días', DIA_90: '90 días' };
const HITO_OPTIONS = ['30 días', '30 / 60 días', '60 días', '60 / 90 días', '90 días'];

// Mismas 6 competencias y 3 hábitos que backend/src/config/probationCriteria.config.js
// (duplicado a propósito — es contenido estático, no amerita un endpoint).
const COMPETENCIAS = [
  { key: 'aptitudTecnica', label: 'Aptitud Técnica y Dominio del Puesto', criterio: 'Demuestra conocimiento práctico en las herramientas, normativas y procedimientos operativos requeridos. Producción limpia y sin errores recurrentes.' },
  { key: 'trabajoEquipo', label: 'Trabajo en Equipo y Colaboración', criterio: 'Se integra positivamente con sus pares y otras áreas. Muestra disposición para apoyar y compartir información relevante.' },
  { key: 'comunicacion', label: 'Comunicación Efectiva y Asertiva', criterio: 'Expresa ideas y datos con claridad, oportunidad y respeto, verbal y por escrito. Informa activamente a su líder.' },
  { key: 'liderazgo', label: 'Liderazgo, Autogestión y Proactividad', criterio: 'Administra eficientemente su tiempo y prioridades sin necesidad de supervisión excesiva. Propone soluciones proactivas.' },
  { key: 'resolucionConflictos', label: 'Resolución de Conflictos y Adaptabilidad', criterio: 'Mantiene la serenidad bajo presión. Se adapta con rapidez a cambios organizacionales con actitud constructiva.' },
  { key: 'apegoCultura', label: 'Apego a Cultura y Valores Kram', criterio: 'Cumple con puntualidad, código de conducta, imagen corporativa y políticas internas de la empresa.' },
];

const HABITOS = [
  { key: 'asistencia', label: 'Asistencia y Puntualidad', criterio: 'Cumple con los horarios establecidos y políticas de registro de asistencia.' },
  { key: 'ordenLimpieza', label: 'Orden y Limpieza', criterio: 'Mantiene su área de trabajo organizada, limpia y cuida sus herramientas.' },
  { key: 'cumplimientoNormas', label: 'Cumplimiento de Normas', criterio: 'Respeta las políticas internas, reglamentos y normativas de seguridad de la empresa.' },
];

const RESULTADO_OPTIONS = [
  { value: 'APROBADO', label: 'Aprobado Satisfactoriamente', hint: 'Continúa al siguiente hito / contrato indeterminado.' },
  { value: 'EXTENDIDO', label: 'Aprobado Condicionado', hint: 'Requiere Plan de Mejora Intensivo (PIP) a 30 días.' },
  { value: 'NO_APROBADO', label: 'No Satisfactorio', hint: 'Proceder con desvinculación o finalización de contrato.' },
];

const emptyObjetivo = () => ({ descripcion: '', hito: '30 días', ponderacion: 25, logro: '', calificacion: 3, observaciones: '' });
const emptyAccion = () => ({ accion: '', objetivo: '', fechaCompromiso: '', indicador: '' });

function nombreEmpleado(emp) {
  if (!emp) return '—';
  return `${emp.nombres || emp.nombre || ''} ${emp.apellidoPaterno || ''} ${emp.apellidoMaterno || ''}`.trim();
}

function ScoreSelect({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-8 h-8 rounded-md text-sm font-medium border ${
            value === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function ListEditor({ items, onChange, placeholder }) {
  const update = (i, v) => onChange(items.map((it, idx) => (idx === i ? v : it)));
  const add = () => onChange([...items, '']);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={it}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" onClick={() => remove(i)} className="px-2 text-gray-400 hover:text-red-600">✕</button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Agregar</button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

/**
 * Captura del evaluador — paso 2 del formato de RH "Evaluación Desempeño
 * 30/60/90". Solo disponible una vez que el colaborador envió su
 * autoevaluación (paso 1, ver dashboard/mi-autoevaluacion/[id]).
 */
function PeriodoPruebaDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  // RH/ADMIN vuelven al listado completo; un jefe directo (que no tiene
  // acceso a esa lista, solo a sus propias evaluaciones pendientes) vuelve
  // a Mi Espacio — evita mandarlo a una página que le dará 403.
  const backTarget = user?.role === 'ADMIN' || user?.role === 'RH' ? '/rh/periodo-prueba' : '/dashboard/mi-espacio';
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [objetivos, setObjetivos] = useState([emptyObjetivo(), emptyObjetivo(), emptyObjetivo(), emptyObjetivo()]);
  const [competencias, setCompetencias] = useState(Object.fromEntries(COMPETENCIAS.map((c) => [c.key, 3])));
  const [habitos, setHabitos] = useState(Object.fromEntries(HABITOS.map((h) => [h.key, { calificacion: 3, comentarios: '' }])));
  const [fortalezas, setFortalezas] = useState(['']);
  const [areasMejora, setAreasMejora] = useState(['']);
  const [planAccion, setPlanAccion] = useState([emptyAccion()]);
  const [minuta, setMinuta] = useState('');
  const [resultado, setResultado] = useState('APROBADO');
  const [comentarios, setComentarios] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await probationApi.getById(id);
        const ev = res.data?.data;
        setEvaluation(ev);
        if (ev.objetivos?.length) setObjetivos(ev.objetivos);
        if (ev.competencias) setCompetencias(ev.competencias);
        if (ev.habitos) setHabitos(ev.habitos);
        if (ev.fortalezas?.length) setFortalezas(ev.fortalezas);
        if (ev.areasMejora?.length) setAreasMejora(ev.areasMejora);
        if (ev.planAccion?.length) setPlanAccion(ev.planAccion);
        if (ev.minutaRetroalimentacion) setMinuta(ev.minutaRetroalimentacion);
        if (ev.resultado && ev.resultado !== 'PENDIENTE') setResultado(ev.resultado);
        if (ev.comentarios) setComentarios(ev.comentarios);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Error al cargar la evaluación');
        router.push(backTarget);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totalPonderacion = objetivos.reduce((sum, o) => sum + (Number(o.ponderacion) || 0), 0);
  const yaCapturada = evaluation && evaluation.resultado !== 'PENDIENTE';
  const readOnly = yaCapturada;

  // Para evaluaciones ya capturadas antes de que estas secciones existieran
  // en el sistema (datos legado), no hay que mostrar los valores por defecto
  // del formulario como si fueran datos reales — se avisa que no hay nada
  // registrado en vez de aparentar una captura que nunca ocurrió.
  const hasObjetivos = !readOnly || (evaluation.objetivos && evaluation.objetivos.length > 0);
  const hasCompetencias = !readOnly || !!evaluation.competencias;
  const hasHabitos = !readOnly || !!evaluation.habitos;

  const updateObjetivo = (i, field, value) => {
    setObjetivos(objetivos.map((o, idx) => (idx === i ? { ...o, [field]: value } : o)));
  };
  const updateAccion = (i, field, value) => {
    setPlanAccion(planAccion.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalPonderacion > 100) {
      toast.error('La suma de ponderaciones de los objetivos no puede superar 100%');
      return;
    }
    setSubmitting(true);
    try {
      await probationApi.capture(id, {
        resultado, comentarios,
        objetivos, competencias, habitos,
        fortalezas: fortalezas.filter((f) => f.trim()),
        areasMejora: areasMejora.filter((a) => a.trim()),
        planAccion,
        minutaRetroalimentacion: minuta,
      });
      toast.success('Evaluación capturada');
      router.push(backTarget);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al capturar la evaluación');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <DashboardLayout><div className="p-6 text-gray-500">Cargando...</div></DashboardLayout>;
  }
  if (!evaluation) return null;

  const auto = evaluation.autoevaluacion;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <button onClick={() => router.push(backTarget)} className="text-sm text-blue-600 hover:text-blue-800 mb-2">
            ← Volver al listado
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Evaluación de {TIPO_LABELS[evaluation.tipo] || evaluation.tipo}
          </h1>
          <p className="text-gray-600 mt-1">
            {nombreEmpleado(evaluation.empleado)} — {evaluation.empleado?.puesto?.nombre || 'Sin puesto asignado'} · {evaluation.empleado?.departamento?.nombre || '—'}
          </p>
        </div>

        {/* El bloqueo por autoevaluación pendiente solo aplica mientras la
            evaluación sigue PENDIENTE de capturar. Una evaluación ya
            capturada (incluida una anterior a que este paso existiera en el
            sistema, sin autoevaluacionCompletadaAt) siempre debe poder
            verse en modo lectura — nunca quedarse bloqueada. */}
        {!readOnly && !evaluation.autoevaluacionCompletadaAt ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 font-medium">El colaborador todavía no envía su autoevaluación.</p>
            <p className="text-yellow-700 text-sm mt-1">No puedes capturar el resultado hasta que la complete.</p>
          </div>
        ) : (
          <>
            <Section title="Autoevaluación del colaborador">
              {auto ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div><span className="text-xs text-gray-500">Integración al equipo</span><p className="font-medium">{auto?.integracion}/5</p></div>
                    <div><span className="text-xs text-gray-500">Claridad en funciones</span><p className="font-medium">{auto?.claridadFunciones}/5</p></div>
                    <div><span className="text-xs text-gray-500">Clima laboral</span><p className="font-medium">{auto?.climaLaboral}/5</p></div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div><span className="font-medium text-gray-700">Logros: </span><span className="text-gray-600">{auto?.logros}</span></div>
                    <div><span className="font-medium text-gray-700">Retos: </span><span className="text-gray-600">{auto?.retos}</span></div>
                    <div><span className="font-medium text-gray-700">Apoyo requerido: </span><span className="text-gray-600">{auto?.apoyo}</span></div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Esta evaluación no tiene autoevaluación registrada (se capturó antes de que este paso existiera en el sistema, o el colaborador todavía no la envía).
                </p>
              )}
            </Section>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Section title="Objetivos y resultados de gestión">
                {!hasObjetivos ? (
                  <p className="text-sm text-gray-500 italic">No hay objetivos registrados para esta evaluación.</p>
                ) : (
                <>
                <div className="space-y-4">
                  {objetivos.map((o, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
                      <input
                        disabled={readOnly}
                        value={o.descripcion}
                        onChange={(e) => updateObjetivo(i, 'descripcion', e.target.value)}
                        placeholder={`Objetivo ${i + 1} / meta específica`}
                        className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
                      />
                      <select disabled={readOnly} value={o.hito} onChange={(e) => updateObjetivo(i, 'hito', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50">
                        {HITO_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <input
                        disabled={readOnly} type="number" min={0} max={100} value={o.ponderacion}
                        onChange={(e) => updateObjetivo(i, 'ponderacion', Number(e.target.value))}
                        placeholder="Pond. %" className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
                      />
                      <input
                        disabled={readOnly} value={o.logro} onChange={(e) => updateObjetivo(i, 'logro', e.target.value)}
                        placeholder="Logro %" className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
                      />
                      <div>
                        <ScoreSelect value={o.calificacion} onChange={(v) => !readOnly && updateObjetivo(i, 'calificacion', v)} />
                      </div>
                      <textarea
                        disabled={readOnly} value={o.observaciones} onChange={(e) => updateObjetivo(i, 'observaciones', e.target.value)}
                        placeholder="Observaciones / evidencia" rows={2}
                        className="md:col-span-6 px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
                {!readOnly && (
                  <button type="button" onClick={() => setObjetivos([...objetivos, emptyObjetivo()])} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium">
                    + Agregar objetivo
                  </button>
                )}
                <p className={`mt-3 text-sm font-medium ${totalPonderacion > 100 ? 'text-red-600' : 'text-gray-500'}`}>
                  Suma de ponderaciones: {totalPonderacion}%
                </p>
                </>
                )}
              </Section>

              <Section title="Competencias clave">
                {!hasCompetencias ? (
                  <p className="text-sm text-gray-500 italic">No hay competencias registradas para esta evaluación.</p>
                ) : (
                <div className="space-y-4">
                  {COMPETENCIAS.map((c) => (
                    <div key={c.key} className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{c.label}</p>
                        <p className="text-xs text-gray-500">{c.criterio}</p>
                      </div>
                      <ScoreSelect value={competencias[c.key] || 3} onChange={(v) => !readOnly && setCompetencias({ ...competencias, [c.key]: v })} />
                    </div>
                  ))}
                </div>
                )}
              </Section>

              <Section title="Hábitos de trabajo y desempeño básico">
                {!hasHabitos ? (
                  <p className="text-sm text-gray-500 italic">No hay hábitos registrados para esta evaluación.</p>
                ) : (
                <div className="space-y-4">
                  {HABITOS.map((h) => (
                    <div key={h.key} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{h.label}</p>
                          <p className="text-xs text-gray-500">{h.criterio}</p>
                        </div>
                        <ScoreSelect
                          value={habitos[h.key]?.calificacion || 3}
                          onChange={(v) => !readOnly && setHabitos({ ...habitos, [h.key]: { ...habitos[h.key], calificacion: v } })}
                        />
                      </div>
                      <input
                        disabled={readOnly}
                        value={habitos[h.key]?.comentarios || ''}
                        onChange={(e) => setHabitos({ ...habitos, [h.key]: { ...habitos[h.key], comentarios: e.target.value } })}
                        placeholder="Comentarios"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
                )}
              </Section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Section title="Fortalezas observadas">
                  <ListEditor items={fortalezas} onChange={setFortalezas} placeholder="Ej. Domina el sistema desde el primer mes" />
                </Section>
                <Section title="Áreas de oportunidad y mejora">
                  <ListEditor items={areasMejora} onChange={setAreasMejora} placeholder="Ej. Mejorar tiempos de respuesta" />
                </Section>
              </div>

              <Section title="Plan de acción, desarrollo y compromisos">
                <div className="space-y-3">
                  {planAccion.map((a, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 border border-gray-200 rounded-lg p-3">
                      <input disabled={readOnly} value={a.accion} onChange={(e) => updateAccion(i, 'accion', e.target.value)} placeholder="Acción concreta / capacitación" className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50" />
                      <input disabled={readOnly} value={a.objetivo} onChange={(e) => updateAccion(i, 'objetivo', e.target.value)} placeholder="Objetivo / brecha a resolver" className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50" />
                      <input disabled={readOnly} type="date" value={a.fechaCompromiso} onChange={(e) => updateAccion(i, 'fechaCompromiso', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50" />
                      <input disabled={readOnly} value={a.indicador} onChange={(e) => updateAccion(i, 'indicador', e.target.value)} placeholder="Indicador / evidencia de éxito" className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50" />
                    </div>
                  ))}
                </div>
                {!readOnly && (
                  <button type="button" onClick={() => setPlanAccion([...planAccion, emptyAccion()])} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium">
                    + Agregar compromiso
                  </button>
                )}
              </Section>

              <Section title="Minuta de retroalimentación">
                <textarea
                  disabled={readOnly}
                  value={minuta}
                  onChange={(e) => setMinuta(e.target.value)}
                  rows={4}
                  placeholder="Puntos principales conversados entre el líder y el colaborador..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
                />
              </Section>

              <Section title="Dictamen institucional y estatus de continuidad">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {RESULTADO_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={readOnly}
                      onClick={() => setResultado(opt.value)}
                      className={`text-left p-4 rounded-lg border-2 disabled:cursor-default ${
                        resultado === opt.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900 text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{opt.hint}</p>
                    </button>
                  ))}
                </div>
                <textarea
                  disabled={readOnly}
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  rows={3}
                  placeholder="Observaciones adicionales del evaluador..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
                />
              </Section>

              {!readOnly && (
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => router.push(backTarget)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50">
                    {submitting ? 'Guardando...' : 'Capturar evaluación'}
                  </button>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// Sin allowedRoles/requiredModule a propósito: cualquier jefe directo (no
// solo RH/ADMIN) debe poder capturar la evaluación de su propio subordinado.
// El control de acceso real (RH/ADMIN o jefe directo de ESE empleado) lo
// hace el backend en probationEvaluation.service.js -> getById/capturar.
export default function PeriodoPruebaDetallePageWrapper() {
  return (
    <ProtectedRoute redirectTo="/login">
      <PeriodoPruebaDetallePage />
    </ProtectedRoute>
  );
}
