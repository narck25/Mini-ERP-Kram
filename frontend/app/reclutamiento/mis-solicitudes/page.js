'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function MisSolicitudesPage() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Formulario de nueva vacante
  const [formData, setFormData] = useState({
    titulo: '',
    departamento_id: '',
    requerimientos_tecnicos: []
  });

  // Nuevo requerimiento temporal
  const [newRequirement, setNewRequirement] = useState('');

  useEffect(() => {
    if (user && ['SISTEMAS', 'COMPRAS', 'PRODUCCION'].includes(user.role)) {
      fetchMyVacancies();
      fetchDepartments();
    }
  }, [user]);

  const fetchMyVacancies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/recruitment/my-vacancies');
      setVacancies(response.data.vacancies);
    } catch (error) {
      console.error('Error fetching vacancies:', error);
      toast.error('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      // En un proyecto real, tendrías un endpoint para departamentos
      const mockDepartments = [
        { id: '1', nombre: 'Sistemas', descripcion: 'Departamento de Sistemas' },
        { id: '2', nombre: 'Compras', descripcion: 'Departamento de Compras' },
        { id: '3', nombre: 'RH', descripcion: 'Recursos Humanos' },
        { id: '4', nombre: 'Administración', descripcion: 'Administración' },
        { id: '5', nombre: 'Finanzas', descripcion: 'Finanzas y Contabilidad' },
        { id: '6', nombre: 'Ventas', descripcion: 'Departamento de Ventas' },
        { id: '7', nombre: 'Marketing', descripcion: 'Marketing' },
        { id: '8', nombre: 'Producción', descripcion: 'Producción' }
      ];
      setDepartments(mockDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleCreateVacancy = async (e) => {
    e.preventDefault();
    try {
      await api.post('/recruitment/vacancies', formData);
      toast.success('Solicitud de vacante creada exitosamente');
      setShowCreateModal(false);
      resetForm();
      fetchMyVacancies();
    } catch (error) {
      console.error('Error creating vacancy:', error);
      toast.error(error.response?.data?.error || 'Error al crear la solicitud');
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim() === '') return;
    
    setFormData(prev => ({
      ...prev,
      requerimientos_tecnicos: [...prev.requerimientos_tecnicos, newRequirement.trim()]
    }));
    setNewRequirement('');
  };

  const removeRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requerimientos_tecnicos: prev.requerimientos_tecnicos.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      departamento_id: '',
      requerimientos_tecnicos: []
    });
    setNewRequirement('');
  };

  const getStatusColor = (estatus) => {
    switch (estatus) {
      case 'Solicitada': return 'bg-yellow-100 text-yellow-800';
      case 'Aprobada': return 'bg-green-100 text-green-800';
      case 'Buscando': return 'bg-blue-100 text-blue-800';
      case 'Cerrada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (estatus) => {
    switch (estatus) {
      case 'Solicitada': return 'En revisión por RH';
      case 'Aprobada': return 'Aprobada - Define perfil técnico';
      case 'Buscando': return 'En búsqueda de candidatos';
      case 'Cerrada': return 'Cerrada';
      default: return estatus;
    }
  };

  if (!user || !['SISTEMAS', 'COMPRAS', 'PRODUCCION'].includes(user.role)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">Solo los jefes de área (Sistemas/Compras/Producción) pueden acceder a esta sección.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Mis Solicitudes de Vacantes</h1>
              <p className="text-gray-600">Gestiona tus solicitudes de nuevas posiciones en tu área</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/reclutamiento/solicitar-vacante"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
              >
                📋 Formulario Digitalizado
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                + Nueva Vacante
              </button>
            </div>
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Nuevo Formulario Digitalizado</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Usa el <span className="font-semibold">Formulario Digitalizado</span> para solicitar vacantes con todos los campos requeridos 
                    (información de la vacante, requerimientos de sistemas, modalidad de contratación, y proceso de entrevista).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Solicitudes */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando solicitudes...</p>
          </div>
        ) : vacancies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes</h3>
            <p className="text-gray-600 mb-4">Crea tu primera solicitud de vacante para tu área.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              + Crear Primera Solicitud
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {vacancies.map((vacancy) => (
              <div key={vacancy.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{vacancy.titulo}</h3>
                      <p className="text-sm text-gray-600">
                        {vacancy.departamento?.nombre} • Solicitado: {new Date(vacancy.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vacancy.estatus)}`}>
                        {getStatusText(vacancy.estatus)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {vacancy._count.comments} comentarios
                      </span>
                    </div>
                  </div>
                  
                  {/* Requerimientos técnicos */}
                  {vacancy.requerimientos_tecnicos && vacancy.requerimientos_tecnicos.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Requerimientos técnicos:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {vacancy.requerimientos_tecnicos.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Link
                      href={`/reclutamiento/vacantes/${vacancy.id}`}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-medium text-sm"
                    >
                      Ver Detalles
                    </Link>
                    
                    {vacancy.estatus === 'Aprobada' && (
                      <Link
                        href={`/reclutamiento/vacantes/${vacancy.id}/perfil-tecnico`}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm"
                      >
                        Definir Perfil Técnico
                      </Link>
                    )}
                    
                    {vacancy.estatus === 'Buscando' && (
                      <Link
                        href={`/reclutamiento/vacantes/${vacancy.id}`}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium text-sm"
                      >
                        Ver Candidatos
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal para crear nueva vacante */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Nueva Solicitud de Vacante</h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleCreateVacancy}>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título de la vacante *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        placeholder="Ej: Desarrollador Full Stack Senior"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departamento *
                      </label>
                      <select
                        required
                        value={formData.departamento_id}
                        onChange={(e) => setFormData({ ...formData, departamento_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar departamento</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Requerimientos técnicos (opcional)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newRequirement}
                          onChange={(e) => setNewRequirement(e.target.value)}
                          placeholder="Ej: 3+ años de experiencia en React"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                        />
                        <button
                          type="button"
                          onClick={addRequirement}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
                        >
                          Agregar
                        </button>
                      </div>
                      
                      {formData.requerimientos_tecnicos.length > 0 && (
                        <div className="mt-2">
                          <ul className="space-y-1">
                            {formData.requerimientos_tecnicos.map((req, index) => (
                              <li key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                                <span className="text-sm text-gray-700">{req}</span>
                                <button
                                  type="button"
                                  onClick={() => removeRequirement(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                      Enviar Solicitud
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}