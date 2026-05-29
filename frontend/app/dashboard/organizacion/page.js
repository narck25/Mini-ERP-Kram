'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';

export default function OrganizacionPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('departments');
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [showJobPositionForm, setShowJobPositionForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: 'Activo'
  });
  const [jobPositionFormData, setJobPositionFormData] = useState({
    nombre: '',
    descripcion: '',
    nivelJerarquico: 'OPERATIVO',
    departamentoId: '',
    estado: 'Activo'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptsRes, positionsRes] = await Promise.all([
        api.get('/departments'),
        api.get('/job-positions')
      ]);
      // El endpoint /departments devuelve { departments: [...] }
      // El endpoint /job-positions devuelve { data: [...] }
      setDepartments(deptsRes.data?.departments || []);
      setJobPositions(positionsRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/departments', formData);
      setShowDepartmentForm(false);
      setFormData({ nombre: '', descripcion: '', estado: 'Activo' });
      fetchData();
    } catch (error) {
      console.error('Error creating department:', error);
      console.error('Detalles del error:', error.response?.data);
      alert(`Error al crear departamento: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleJobPositionSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/job-positions', jobPositionFormData);
      setShowJobPositionForm(false);
      setJobPositionFormData({
        nombre: '',
        descripcion: '',
        nivelJerarquico: 'OPERATIVO',
        departamentoId: '',
        estado: 'Activo'
      });
      fetchData();
    } catch (error) {
      console.error('Error creating job position:', error);
      alert('Error al crear puesto');
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!confirm('¿Está seguro de eliminar este departamento?')) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Error al eliminar departamento');
    }
  };

  const handleDeleteJobPosition = async (id) => {
    if (!confirm('¿Está seguro de eliminar este puesto?')) return;
    try {
      await api.delete(`/job-positions/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting job position:', error);
      alert('Error al eliminar puesto');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute requiredModule="EMPLEADOS">
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Estructura Organizacional</h1>
            <p className="text-gray-600 mt-2">
              Administra los departamentos y puestos de trabajo de la empresa
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('departments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'departments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Departamentos ({departments.length})
              </button>
              <button
                onClick={() => setActiveTab('jobPositions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'jobPositions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Puestos de Trabajo ({jobPositions.length})
              </button>
            </nav>
          </div>

          {/* Departments Tab */}
          {activeTab === 'departments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Departamentos</h2>
                <button
                  onClick={() => setShowDepartmentForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  + Nuevo Departamento
                </button>
              </div>

              {showDepartmentForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Nuevo Departamento</h3>
                  <form onSubmit={handleDepartmentSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estado
                        </label>
                        <select
                          value={formData.estado}
                          onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Activo">Activo</option>
                          <option value="Inactivo">Inactivo</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          value={formData.descripcion}
                          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                      <button
                        type="button"
                        onClick={() => setShowDepartmentForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Guardar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {departments.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No hay departamentos registrados</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {(departments || []).map((dept) => (
                      <li key={dept.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{dept.nombre}</h3>
                            <p className="text-sm text-gray-500 mt-1">{dept.descripcion || 'Sin descripción'}</p>
                            <div className="flex items-center mt-2 space-x-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                dept.estado === 'Activo' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {dept.estado}
                              </span>
                              <span className="text-sm text-gray-600">
                                {(jobPositions || []).filter(p => p.departamentoId === dept.id).length} puestos
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDeleteDepartment(dept.id)}
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Job Positions Tab */}
          {activeTab === 'jobPositions' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Puestos de Trabajo</h2>
                <button
                  onClick={() => setShowJobPositionForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  + Nuevo Puesto
                </button>
              </div>

              {showJobPositionForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Nuevo Puesto de Trabajo</h3>
                  <form onSubmit={handleJobPositionSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          required
                          value={jobPositionFormData.nombre}
                          onChange={(e) => setJobPositionFormData({ ...jobPositionFormData, nombre: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Departamento *
                        </label>
                        <select
                          required
                          value={jobPositionFormData.departamentoId}
                          onChange={(e) => setJobPositionFormData({ ...jobPositionFormData, departamentoId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar departamento</option>
                          {(departments || []).map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nivel Jerárquico
                        </label>
                        <select
                          value={jobPositionFormData.nivelJerarquico}
                          onChange={(e) => setJobPositionFormData({ ...jobPositionFormData, nivelJerarquico: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="OPERATIVO">Operativo</option>
                          <option value="COORDINADOR">Coordinador</option>
                          <option value="SUPERVISOR">Supervisor</option>
                          <option value="GERENTE">Gerente</option>
                          <option value="DIRECTOR">Director</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estado
                        </label>
                        <select
                          value={jobPositionFormData.estado}
                          onChange={(e) => setJobPositionFormData({ ...jobPositionFormData, estado: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Activo">Activo</option>
                          <option value="Inactivo">Inactivo</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          value={jobPositionFormData.descripcion}
                          onChange={(e) => setJobPositionFormData({ ...jobPositionFormData, descripcion: e.target.value })}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                      <button
                        type="button"
                        onClick={() => setShowJobPositionForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Guardar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {jobPositions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No hay puestos de trabajo registrados</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {(jobPositions || []).map((position) => {
                      const department = (departments || []).find(d => d.id === position.departamentoId);
                      return (
                        <li key={position.id} className="px-6 py-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{position.nombre}</h3>
                              <div className="flex items-center mt-1 space-x-4">
                                <span className="text-sm text-gray-600">
                                  {department?.nombre || 'Departamento no encontrado'}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {position.nivelJerarquico}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-2">
                                {position.descripcion || 'Sin descripción'}
                              </p>
                              <div className="flex items-center mt-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  position.estado === 'Activo' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {position.estado}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDeleteJobPosition(position.id)}
                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}