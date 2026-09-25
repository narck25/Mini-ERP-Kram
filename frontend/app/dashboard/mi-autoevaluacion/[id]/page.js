'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { probationApi } from '@/lib/api/probation';
import { toast } from 'react-hot-toast';

const TIPO_LABELS = { DIA_30: '30 días', DIA_60: '60 días', DIA_90: '90 días' };

const ESCALAS = [
  { key: 'integracion', label: 'Integración al equipo' },
  { key: 'claridadFunciones', label: 'Claridad en tus funciones' },
  { key: 'climaLaboral', label: 'Clima laboral percibido' },
];

/**
 * Autoevaluación del colaborador — paso 1 del formato de RH "Evaluación
 * Desempeño 30/60/90". Se llena antes de la reunión de retroalimentación
 * con el jefe/RH (que completa el resto en rh/periodo-prueba/[id]).
 */
export default function MiAutoevaluacionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    logros: '', retos: '', apoyo: '',
    integracion: 3, claridadFunciones: 3, climaLaboral: 3,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await probationApi.getMyPending();
        const found = (res.data?.data || []).find((ev) => ev.id === id);
        if (!found) {
          toast.error('No tienes una autoevaluación pendiente con ese identificador');
          router.push('/dashboard/mi-espacio');
          return;
        }
        setEvaluation(found);
      } catch (error) {
        toast.error('Error al cargar tu autoevaluación');
        router.push('/dashboard/mi-espacio');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.logros.trim() || !form.retos.trim() || !form.apoyo.trim()) {
      toast.error('Completa las tres preguntas abiertas antes de enviar');
      return;
    }
    setSubmitting(true);
    try {
      await probationApi.submitSelfEvaluation(id, form);
      toast.success('Autoevaluación enviada. Tu jefe/RH ya puede completar tu evaluación.');
      router.push('/dashboard/mi-espacio');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al enviar tu autoevaluación');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-gray-500">Cargando...</div>
      </DashboardLayout>
    );
  }

  if (!evaluation) return null;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Mi autoevaluación</h1>
        <p className="text-gray-600 mt-1">
          Evaluación de {TIPO_LABELS[evaluation.tipo] || evaluation.tipo}. Complétala antes de tu reunión de
          retroalimentación con tu jefe o RH.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              A. Logros principales: ¿cuáles consideras que han sido tus mayores aciertos y contribuciones en este periodo? *
            </label>
            <textarea
              value={form.logros}
              onChange={(e) => setForm({ ...form, logros: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              B. Retos y dificultades: ¿qué obstáculos o procesos complejos has experimentado y cómo los has gestionado? *
            </label>
            <textarea
              value={form.retos}
              onChange={(e) => setForm({ ...form, retos: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              C. Apoyo y recursos: ¿qué herramientas, capacitación adicional o apoyo del equipo requieres para optimizar tu trabajo? *
            </label>
            <textarea
              value={form.apoyo}
              onChange={(e) => setForm({ ...form, apoyo: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              D. Nivel de satisfacción e integración (evaluando tu experiencia general hasta hoy):
            </p>
            <div className="space-y-3">
              {ESCALAS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-700">{label}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm({ ...form, [key]: n })}
                        className={`w-9 h-9 rounded-md text-sm font-medium border ${
                          form[key] === n
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/dashboard/mi-espacio')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Enviar autoevaluación'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
