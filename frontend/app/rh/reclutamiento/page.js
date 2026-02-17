 'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function RHReclutamientoPage() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filters, setFilters] = useState({
    estatus: '',
    departamento_id: ''
  });

  useEffect(() => {
    if (user && ['RH', 'ADMIN'].includes(user.role)) {
      fetchVacancies();
      fetchStats();
      fetchDepartments();
    }
  }, [user, filters]);

  const fetchVacancies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.estatus) params.append('estatus', filters.estatus);
      if (filters.departamento_id) params.append('departamento_id', filters.departamento_id);
      
      const response = await api.get(`/recruitment/vacancies?${params.toString()}`);
      setVacancies(response.data.vacancies);
    } catch (error) {
      console.error('Error fetching vacancies:', error);
      toast.error('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/recruitment/vacancies/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApprove = async (id) => {
    if (!confirm('¿Estás seguro de aprobar esta solicitud de vacante?')) {
      return;
    }

    try {
      await api.put(`/recruitment/vacancies/${id}/approve`);
      toast.success('Solicitud aprobada exitosamente');
      fetchVacancies();
      fetchStats();
    } catch (error) {
      console.error('Error approving vacancy:', error);
      toast.error(error.response?.data?.error || 'Error al aprobar la solicitud');
    }
  };

  const handleClose = async (id) => {
    if (!confirm('¿Estás seguro de cerrar esta solicitud de vacante?')) {
      return;
    }

    try {
      await api.put(`/recruitment/vacancies/${id}/close`);
      toast.success('Solicitud cerrada exitosamente');
      fetchVacancies();
      fetchStats();
    } catch (error) {
      console.error('Error closing vacancy:', error);
      toast.error(error.response?.data?.error || 'Error al cerrar la solicitud');
    }
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
      case 'Solicitada': return 'Solicitada';
      case 'Aprobada': return 'Aprobada';
      case 'Buscando': return 'Buscando';
      case 'Cerrada': return 'Cerrada';
      default: return estatus;
    }
  };

  if (!user || !['RH', 'ADMIN'].includes(user.role)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">Solo el personal de RH puede acceder a esta sección.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Dashboard de Reclutamiento Colaborativo</h1>
              <p className="text-gray-600">Gestiona todas las solicitudes de vacantes de los jefes de área</p>
            </div>
            <button
              onClick={() => window.location.href = '/rh/reclutamiento/crear-vacante'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              + Crear Vacante Pre-Aprobada
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Solicitudes</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-yellow-600">{stats.solicitadas}</div>
              <div className="text-sm text-gray-600">Solicitadas</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-green-600">{stats.aprobadas}</div>
              <div className="text-sm text-gray-600">Aprobadas</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-blue-600">{stats.buscando}</div>
              <div className="text-sm text-gray-600">Buscando</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-gray-600">{stats.cerradas}</div>
              <div className="text-sm text-gray-600">Cerradas</div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filters.estatus}
                onChange={(e) => handleFilterChange('estatus', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="Solicitada">Solicitada</option>
                <option value="Aprobada">Aprobada</option>
                <option value="Buscando">Buscando</option>
                <option value="Cerrada">Cerrada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
              <select
                value={filters.departamento_id}
                onChange={(e) => handleFilterChange('departamento_id', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los departamentos</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.nombre}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ estatus: '', departamento_id: '' })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Limpiar Filtros
              </button>
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
            <p className="text-gray-600">No se encontraron solicitudes con los filtros seleccionados.</p>
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
                        {vacancy.departamento?.nombre} • Solicitado por: {vacancy.solicitante?.user?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vacancy.estatus)}`}>
                        {getStatusText(vacancy.estatus)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(vacancy.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Requerimientos técnicos */}
                  {vacancy.requerimientos_tecnicos && vacancy.requerimientos_tecnicos.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Requerimientos técnicos iniciales:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {vacancy.requerimientos_tecnicos.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Solicitante:</span>
                      <p className="text-sm text-gray-600">{vacancy.solicitante?.user?.email}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Comentarios:</span>
                      <p className="text-sm text-gray-600">{vacancy._count.comments}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Candidatos:</span>
                      <p className="text-sm text-gray-600">{vacancy._count.candidatesRH}</p>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Link
                      href={`/reclutamiento/vacantes/${vacancy.id}`}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-medium text-sm"
                    >
                      Ver Detalles
                    </Link>
                    
                    {vacancy.estatus === 'Solicitada' && (
                      <button
                        onClick={() => handleApprove(vacancy.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm"
                      >
                        Aprobar Solicitud
                      </button>
                    )}
                    
                    {vacancy.estatus === 'Aprobada' && (
                      <Link
                        href={`/reclutamiento/vacantes/${vacancy.id}`}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium text-sm"
                      >
                        Esperando Perfil Técnico
                      </Link>
                    )}
                    
                    {vacancy.estatus === 'Buscando' && (
                      <Link
                        href={`/reclutamiento/vacantes/${vacancy.id}`}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium text-sm"
                      >
                        Gestionar Candidatos
                      </Link>
                    )}
                    
                    {vacancy.estatus !== 'Cerrada' && (
                      <button
                        onClick={() => handleClose(vacancy.id)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium text-sm"
                      >
                        Cerrar Solicitud
                      </button>
                    )}
                    
                    {vacancy.estatus === 'Cerrada' && (
                      <button
                        onClick={() => handleApprove(vacancy.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm"
                      >
                        Reabrir Solicitud
                      </button>
                    )}
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