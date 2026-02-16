'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function MyVacanciesPage() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: user?.role === 'SISTEMAS' ? 'Sistemas' : 'Compras',
    position: '',
    salaryRange: '',
    requirements: [''],
    responsibilities: ['']
  });

  useEffect(() => {
    if (user) {
      fetchMyVacancies();
    }
  }, [user]);

  const fetchMyVacancies = async () => {
    try {
      const response = await api.get('/vacancies/my');
      setVacancies(response.data.vacancies);
    } catch (error) {
      console.error('Error fetching vacancies:', error);
      toast.error('Error al cargar las vacantes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        responsibilities: formData.responsibilities.filter(resp => resp.trim() !== '')
      };

      await api.post('/vacancies', payload);
      toast.success('Vacante creada exitosamente');
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        department: user?.role === 'SISTEMAS' ? 'Sistemas' : 'Compras',
        position: '',
        salaryRange: '',
        requirements: [''],
        responsibilities: ['']
      });
      fetchMyVacancies();
    } catch (error) {
      console.error('Error creating vacancy:', error);
      toast.error(error.response?.data?.error || 'Error al crear la vacante');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800';
      case 'APROBADA': return 'bg-green-100 text-green-800';
      case 'BUSCANDO': return 'bg-blue-100 text-blue-800';
      case 'CERRADA': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDIENTE': return 'Pendiente de aprobación';
      case 'APROBADA': return 'Aprobada';
      case 'BUSCANDO': return 'Buscando candidatos';
      case 'CERRADA': return 'Cerrada';
      default: return status;
    }
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

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Solicitudes de Vacantes</h1>
            <p className="text-gray-600">Gestiona las vacantes que has solicitado para tu área</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            + Nueva Vacante
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Crear Nueva Vacante</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título del Puesto *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Posición *
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rango Salarial
                  </label>
                  <input
                    type="text"
                    name="salaryRange"
                    value={formData.salaryRange}
                    onChange={handleInputChange}
                    placeholder="Ej: $30,000 - $40,000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción del Puesto *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requisitos
                </label>
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                      placeholder={`Requisito ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('requirements', index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('requirements')}
                  className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  + Agregar Requisito
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsabilidades
                </label>
                {formData.responsibilities.map((resp, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={resp}
                      onChange={(e) => handleArrayChange('responsibilities', index, e.target.value)}
                      placeholder={`Responsabilidad ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.responsibilities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('responsibilities', index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('responsibilities')}
                  className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  + Agregar Responsabilidad
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Crear Vacante
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando vacantes...</p>
          </div>
        ) : vacancies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay vacantes creadas</h3>
            <p className="text-gray-600 mb-4">Comienza creando tu primera solicitud de vacante.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Crear Primera Vacante
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vacancies.map((vacancy) => (
              <div key={vacancy.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{vacancy.title}</h3>
                      <p className="text-sm text-gray-600">{vacancy.department} • {vacancy.position}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vacancy.status)}`}>
                      {getStatusText(vacancy.status)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-4 line-clamp-3">{vacancy.description}</p>
                  
                  {vacancy.salaryRange && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-700">Salario:</span>
                      <span className="ml-2 text-sm text-gray-600">{vacancy.salaryRange}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <div>
                      <span className="font-medium">Creada:</span>{' '}
                      {new Date(vacancy.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-4">
                      <span>Candidatos: {vacancy._count.candidates}</span>
                      <span>Actividades: {vacancy._count.activities}</span>
                    </div>
                  </div>
                  
                  {vacancy.approvedBy && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Aprobada por:</span>{' '}
                        {vacancy.approvedBy.name} ({vacancy.approvedBy.email})
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Fecha:</span>{' '}
                        {new Date(vacancy.approvedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <Link
                      href={`/vacancies/${vacancy.id}`}
                      className="block w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-md font-medium"
                    >
                      Ver Detalles
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}