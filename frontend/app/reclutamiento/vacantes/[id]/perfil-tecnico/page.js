'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function TechnicalProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Formulario de perfil técnico detallado
  const [formData, setFormData] = useState({
    perfil_tecnico_detallado: [],
    actividades: []
  });

  // Nuevo requerimiento temporal
  const [newRequirement, setNewRequirement] = useState('');
  // Nueva actividad temporal
  const [newActivity, setNewActivity] = useState('');

  useEffect(() => {
    if (user && id) {
      fetchVacancy();
    }
  }, [user, id]);

  const fetchVacancy = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/recruitment/vacancies/${id}`);
      const vacancyData = response.data.vacancy;
      
      setVacancy(vacancyData);
      
      // Inicializar el formulario con los datos existentes
      setFormData({
        perfil_tecnico_detallado: vacancyData.requerimientos_tecnicos || [],
        actividades: []
      });
    } catch (error) {
      console.error('Error fetching vacancy:', error);
      toast.error('Error al cargar la solicitud de vacante');
    } finally {
      setLoading(false);
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim() === '') return;
    
    setFormData(prev => ({
      ...prev,
      perfil_tecnico_detallado: [...prev.perfil_tecnico_detallado, newRequirement.trim()]
    }));
    setNewRequirement('');
  };

  const removeRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      perfil_tecnico_detallado: prev.perfil_tecnico_detallado.filter((_, i) => i !== index)
    }));
  };

  const addActivity = () => {
    if (newActivity.trim() === '') return;
    
    setFormData(prev => ({
      ...prev,
      actividades: [...prev.actividades, newActivity.trim()]
    }));
    setNewActivity('');
  };

  const removeActivity = (index) => {
    setFormData(prev => ({
      ...prev,
      actividades: prev.actividades.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.perfil_tecnico_detallado.length === 0) {
      toast.error('Debes agregar al menos un requerimiento técnico');
      return;
    }

    try {
      setSubmitting(true);
      await api.put(`/recruitment/vacancies/${id}/technical-profile`, formData);
      
      toast.success('Perfil técnico definido exitosamente. La vacante ahora está en estado "Buscando".');
      router.push(`/reclutamiento/vacantes/${id}`);
    } catch (error) {
      console.error('Error updating technical profile:', error);
      toast.error(error.response?.data?.error || 'Error al definir el perfil técnico');
    } finally {
      setSubmitting(false);
    }
  };

  const canDefineTechnicalProfile = () => {
    if (!user || !vacancy) return false;
    
    return user && ['SISTEMAS', 'COMPRAS'].includes(user.role) && 
           vacancy.estatus === 'Aprobada' && 
           vacancy.solicitante?.user?.id === user.id;
  };

  if (!user || !['SISTEMAS', 'COMPRAS'].includes(user.role)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">Solo los jefes de área pueden acceder a esta sección.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando información de la vacante...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!vacancy) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Solicitud no encontrada</h2>
            <p className="text-red-600 mt-1">La solicitud de vacante que buscas no existe o no tienes permisos para verla.</p>
            <button
              onClick={() => router.back()}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              Volver
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canDefineTechnicalProfile()) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acción no permitida</h2>
            <p className="text-red-600 mt-1">
              {vacancy.estatus !== 'Aprobada' 
                ? 'Esta solicitud debe ser aprobada por RH antes de definir el perfil técnico.'
                : 'Solo el solicitante original puede definir el perfil técnico.'}
            </p>
            <Link
              href={`/reclutamiento/vacantes/${id}`}
              className="mt-3 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              Volver a la solicitud
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Encabezado */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Definir Perfil Técnico y Actividades</h1>
              <div className="flex items-center space-x-4 mt-2">
                <Link
                  href={`/reclutamiento/vacantes/${id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Volver a la solicitud
                </Link>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Aprobada por RH
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Información de la vacante */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Vacante</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-700">Título:</span>
              <p className="text-sm text-gray-600">{vacancy.titulo}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Departamento:</span>
              <p className="text-sm text-gray-600">{vacancy.departamento?.nombre}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Solicitante:</span>
              <p className="text-sm text-gray-600">{vacancy.solicitante?.user?.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Fecha de aprobación:</span>
              <p className="text-sm text-gray-600">
                {new Date(vacancy.updatedAt).toLocaleDateString('es-MX')}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Perfil técnico detallado */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Perfil Técnico Detallado *</h3>
              <p className="text-sm text-gray-600 mb-4">
                Define los requerimientos técnicos específicos para esta posición. Estos serán utilizados por RH para evaluar candidatos.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agregar requerimiento técnico
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder="Ej: Experiencia en React 3+ años, conocimientos en TypeScript, etc."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  />
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md font-medium"
                  >
                    Agregar
                  </button>
                </div>
              </div>
              
              {formData.perfil_tecnico_detallado.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Requerimientos definidos:</h4>
                  <ul className="space-y-2">
                    {formData.perfil_tecnico_detallado.map((req, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-gray-700">{req}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">No hay requerimientos técnicos definidos aún.</p>
                </div>
              )}
            </div>

            {/* Actividades (opcional) */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividades Principales (Opcional)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Describe las principales actividades y responsabilidades del puesto.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agregar actividad
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    placeholder="Ej: Desarrollo de nuevas funcionalidades, mantenimiento de sistemas existentes, etc."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addActivity())}
                  />
                  <button
                    type="button"
                    onClick={addActivity}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium"
                  >
                    Agregar
                  </button>
                </div>
              </div>
              
              {formData.actividades.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Actividades definidas:</h4>
                  <ul className="space-y-2">
                    {formData.actividades.map((activity, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-gray-700">{activity}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeActivity(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Instrucciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">⚠️ Importante</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Una vez que envíes este formulario, la vacante cambiará a estado "Buscando" y RH comenzará a buscar candidatos.</li>
                <li>• Los requerimientos técnicos que definas serán utilizados para evaluar a los candidatos.</li>
                <li>• Puedes comunicarte con RH a través del sistema de comentarios si necesitas ajustar algún requerimiento.</li>
                <li>• Asegúrate de que los requerimientos sean claros y específicos para facilitar la búsqueda de candidatos adecuados.</li>
              </ul>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Link
                href={`/reclutamiento/vacantes/${id}`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={submitting || formData.perfil_tecnico_detallado.length === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Enviando...' : 'Definir Perfil y Comenzar Búsqueda'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}