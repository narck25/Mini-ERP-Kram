'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';

export default function VacancyActivitiesPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [vacancy, setVacancy] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    activityType: '',
    description: '',
    duration: '',
    priority: 1
  });

  useEffect(() => {
    if (user && id) {
      fetchVacancy();
      fetchActivities();
    }
  }, [user, id]);

  const fetchVacancy = async () => {
    try {
      const response = await api.get(`/recruitment/vacancies/${id}`);
      setVacancy(response.data.vacancy);
    } catch (error) {
      console.error('Error fetching vacancy:', error);
      toast.error('Error al cargar la vacante');
      router.push('/rh-dashboard');
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await api.get(`/recruitment/vacancies/${id}`);
      setActivities(response.data.vacancy.JobActivity || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'priority' ? parseInt(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/recruitment/vacancies/${id}/activities`, formData);
      toast.success('Actividad agregada exitosamente');
      setFormData({
        activityType: '',
        description: '',
        duration: '',
        priority: 1
      });
      fetchActivities();
    } catch (error) {
      console.error('Error adding activity:', error);
      toast.error(error.response?.data?.error || 'Error al agregar la actividad');
    }
  };

  const handleCompleteActivity = async (activityId) => {
    try {
      await api.put(`/recruitment/activities/${activityId}`, { isCompleted: true });
      toast.success('Actividad marcada como completada');
      fetchActivities();
    } catch (error) {
      console.error('Error completing activity:', error);
      toast.error('Error al actualizar la actividad');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 1: return 'Baja';
      case 2: return 'Media';
      case 3: return 'Alta';
      default: return `Prioridad ${priority}`;
    }
  };

  if (!user || !user.accessibleModules?.includes('RECLUTAMIENTO')) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">No tienes acceso al módulo de Reclutamiento.</p>
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
            <p className="mt-2 text-gray-600">Cargando...</p>
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
            <h2 className="text-red-800 font-semibold">Vacante no encontrada</h2>
            <p className="text-red-600 mt-1">La vacante solicitada no existe o no tienes acceso.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Actividades del Puesto</h1>
              <p className="text-gray-600">
                {vacancy.title} • {vacancy.department} • {vacancy.position}
              </p>
            </div>
            <button
              onClick={() => router.push('/rh-dashboard')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario para agregar actividad */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Agregar Nueva Actividad</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Actividad *
                  </label>
                  <input
                    type="text"
                    name="activityType"
                    value={formData.activityType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Entrevista técnica, Prueba práctica"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe la actividad en detalle"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duración
                    </label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 2 horas"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridad
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">Baja</option>
                      <option value="2">Media</option>
                      <option value="3">Alta</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    Agregar Actividad
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Lista de actividades */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Actividades Registradas</h2>
                <span className="text-sm text-gray-600">
                  {activities.length} actividad{activities.length !== 1 ? 'es' : ''}
                </span>
              </div>

              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay actividades</h3>
                  <p className="text-gray-600">Agrega la primera actividad para este puesto.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{activity.activityType}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(activity.priority)}`}>
                              {getPriorityText(activity.priority)}
                            </span>
                            {activity.duration && (
                              <span className="text-xs text-gray-500">Duración: {activity.duration}</span>
                            )}
                            {activity.isCompleted && (
                              <span className="text-xs text-green-600">✓ Completada</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const dateStr = activity.createdAt.split('T')[0];
                            const [y, m, d] = dateStr.split('-');
                            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString();
                          })()}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-3">{activity.description}</p>
                      
                      {!activity.isCompleted && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleCompleteActivity(activity.id)}
                            className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-md hover:bg-green-200"
                          >
                            Marcar como Completada
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Información de la vacante */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Vacante</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Título:</span>
                  <p className="text-sm text-gray-600">{vacancy.title}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Departamento:</span>
                  <p className="text-sm text-gray-600">{vacancy.department}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Posición:</span>
                  <p className="text-sm text-gray-600">{vacancy.position}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Rango Salarial:</span>
                  <p className="text-sm text-gray-600">{vacancy.salaryRange || 'No especificado'}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Descripción:</span>
                  <p className="text-sm text-gray-600 mt-1">{vacancy.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}