'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api, { employeeApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

function EmpleadosPageContent() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availablePositions, setAvailablePositions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [importing, setImporting] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    estatus: '',
    departamento_id: '',
    search: ''
  });

  // Formulario
  const [formData, setFormData] = useState({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    rfc: '',
    curp: '',
    nss: '',
    fecha_ingreso: '',
    estatus: 'Activo',
    puestoId: '',
    departamento_id: '',
    salary: '',
    jefeDirecto: '',
    sd: '',
    sdi: '',
    nivelJerarquico: 'OPERATIVO',
    reportaAId: '',
    userId: ''
  });

  useEffect(() => {
    if (user && (user.role === 'RH' || user.role === 'ADMIN' || user.accessibleModules?.includes('EMPLEADOS'))) {
      fetchEmployees();
      fetchDepartments();
      fetchManagers();
    }
  }, [user, filters]);

  // Efecto para cargar puestos cuando se selecciona un departamento
  useEffect(() => {
    if (formData.departamento_id) {
      fetchPositionsByDepartment(formData.departamento_id);
    } else {
      setAvailablePositions([]);
    }
  }, [formData.departamento_id]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.estatus) params.append('estatus', filters.estatus);
      if (filters.departamento_id) params.append('departamento_id', filters.departamento_id);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/employees?${params.toString()}`);
      setEmployees(response.data.employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Error al cargar los empleados');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Si falla, usar datos por defecto
      const defaultDepartments = [
        { id: '1', nombre: 'SISTEMAS', descripcion: 'Departamento de Sistemas' },
        { id: '2', nombre: 'COMPRAS', descripcion: 'Departamento de Compras' },
        { id: '3', nombre: 'RH', descripcion: 'Recursos Humanos' },
        { id: '4', nombre: 'Administración', descripcion: 'Administración' },
        { id: '5', nombre: 'Finanzas', descripcion: 'Finanzas y Contabilidad' },
        { id: '6', nombre: 'Ventas', descripcion: 'Departamento de Ventas' },
        { id: '7', nombre: 'Marketing', descripcion: 'Marketing' },
        { id: '8', nombre: 'PRODUCCION', descripcion: 'Producción' }
      ];
      setDepartments(defaultDepartments);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await api.get('/managers');
      setManagers(response.data.managers);
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast.error('Error al cargar la lista de jefes directos');
    }
  };

  const fetchPositionsByDepartment = async (departmentId) => {
    try {
      const response = await api.get(`/departments/${departmentId}/job-positions`);
      setAvailablePositions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching positions by department:', error);
      setAvailablePositions([]);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      // Limpiar datos: convertir strings vacíos a null para campos opcionales
      const cleanedData = {
        ...formData,
        apellidoPaterno: formData.apellidoPaterno || null,
        apellidoMaterno: formData.apellidoMaterno || null,
        salary: formData.salary || null,
        jefeDirecto: formData.jefeDirecto || null,
        sd: formData.sd || null,
        sdi: formData.sdi || null,
        reportaAId: formData.reportaAId || null,
        userId: formData.userId || null
      };
      
      console.log('📤 Enviando datos para crear empleado:', cleanedData);
      const response = await api.post('/employees', cleanedData);
      console.log('✅ Respuesta del servidor:', response.data);
      toast.success('Empleado creado exitosamente');
      setShowCreateModal(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error('❌ Error creating employee:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error(error.response?.data?.error || 'Error al crear el empleado');
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/employees/${selectedEmployee.id}`, formData);
      toast.success('Empleado actualizado exitosamente');
      setShowEditModal(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar el empleado');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!confirm('¿Estás seguro de dar de baja a este empleado? Esta acción cambiará su estatus a Inactivo.')) {
      return;
    }

    try {
      await api.delete(`/employees/${id}`);
      toast.success('Empleado dado de baja exitosamente');
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error(error.response?.data?.error || 'Error al dar de baja al empleado');
    }
  };

  const handleDeletePermanently = async (id, employeeName) => {
    if (!confirm(`¿Estás SEGURO de que deseas ELIMINAR PERMANENTEMENTE al empleado "${employeeName}"?\n\n⚠️ ADVERTENCIA: Esta acción es IRREVERSIBLE y eliminará todos los datos del empleado de la base de datos.\n\nSolo se puede eliminar si el empleado no tiene documentos ni vacantes de trabajo asociadas.`)) {
      return;
    }

    try {
      await api.delete(`/employees/${id}/permanent`);
      toast.success('Empleado eliminado permanentemente exitosamente');
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee permanently:', error);
      if (error.response?.data?.error) {
        // Mostrar el mensaje de error específico del backend
        let errorMessage = error.response.data.error;
        
        // Si hay detalles adicionales, mostrarlos también
        if (error.response.data.details) {
          const details = error.response.data.details;
          if (details.documentsCount > 0 || details.jobVacanciesCount > 0) {
            errorMessage += `\n\n📄 Documentos asociados: ${details.documentsCount || 0}\n📋 Vacantes asociadas: ${details.jobVacanciesCount || 0}`;
          }
        }
        
        toast.error(errorMessage, {
          duration: 5000, // Mostrar por más tiempo
          style: {
            maxWidth: '500px',
            whiteSpace: 'pre-line' // Permitir saltos de línea
          }
        });
      } else {
        toast.error('Error al eliminar el empleado permanentemente');
      }
    }
  };

  const handleEditClick = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      nombres: employee.nombres || employee.nombre || '',
      apellidoPaterno: employee.apellidoPaterno || '',
      apellidoMaterno: employee.apellidoMaterno || '',
      rfc: employee.rfc || '',
      curp: employee.curp || '',
      nss: employee.nss || '',
      fecha_ingreso: employee.fecha_ingreso || employee.fechaAlta ? (employee.fecha_ingreso || employee.fechaAlta).split('T')[0] : '',
      estatus: employee.estatus || 'Activo',
      puestoId: employee.puestoId || '',
      departamento_id: employee.departamento_id || '',
      salary: employee.salary || '',
      jefeDirecto: employee.jefeDirecto || '',
      sd: employee.sd || '',
      sdi: employee.sdi || '',
      nivelJerarquico: employee.nivelJerarquico || 'OPERATIVO',
      reportaAId: employee.reportaAId || '',
      userId: employee.userId || ''
    });
    setShowEditModal(true);
  };

  const handleExport = async () => {
    // Verificar que el usuario esté autenticado y tenga acceso al módulo de Empleados
    if (!user || !user.accessibleModules?.includes('EMPLEADOS')) {
      toast.error('No tienes permisos para exportar empleados');
      return;
    }

    try {
      const params = {};
      if (filters.estatus) params.estatus = filters.estatus;
      if (filters.departamento_id) params.departamento_id = filters.departamento_id;

      const response = await employeeApi.export(params);

      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'empleados.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Empleados exportados exitosamente');
    } catch (error) {
      console.error('Error exporting employees:', error);
      if (error.response?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else {
        toast.error('Error al exportar empleados');
      }
    }
  };

  const handleDownloadTemplate = async () => {
    // Verificar que el usuario esté autenticado y tenga acceso al módulo de Empleados
    if (!user || !user.accessibleModules?.includes('EMPLEADOS')) {
      toast.error('No tienes permisos para descargar la plantilla');
      return;
    }

    try {
      const response = await employeeApi.downloadTemplate();

      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_importacion_empleados.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Plantilla descargada exitosamente');
    } catch (error) {
      console.error('Error downloading template:', error);
      if (error.response?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else {
        toast.error('Error al descargar la plantilla');
      }
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('Por favor selecciona un archivo CSV');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      setImporting(true);
      const response = await employeeApi.import(formData);

      setImportResults(response.data);
      
      if (response.data.errors && response.data.errors > 0) {
        toast.error(`Importación completada con ${response.data.errors} errores`);
      } else {
        toast.success(`Importación completada exitosamente: ${response.data.imported} empleados importados`);
        setShowImportModal(false);
        setCsvFile(null);
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error importing employees:', error);
      
      if (error.response?.data?.errors) {
        // Mostrar errores de validación
        setImportResults({
          imported: 0,
          errors: error.response.data.errors.length,
          errorDetails: error.response.data.errors,
          summary: error.response.data.summary
        });
        toast.error(`Errores de validación: ${error.response.data.errors.length} errores encontrados`);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.response?.data?.error || 'Error al importar empleados');
      }
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      rfc: '',
      curp: '',
      nss: '',
      fecha_ingreso: '',
      estatus: 'Activo',
      puestoId: '',
      departamento_id: '',
      salary: '',
      jefeDirecto: '',
      sd: '',
      sdi: '',
      nivelJerarquico: 'OPERATIVO',
      reportaAId: '',
      userId: ''
    });
  };

  const getStatusColor = (estatus) => {
    switch (estatus) {
      case 'Activo': return 'bg-green-100 text-green-800';
      case 'Inactivo': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || !user.accessibleModules?.includes('EMPLEADOS')) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">No tienes permisos para acceder a la sección de Empleados.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Determinar qué información mostrar según el rol
  const isRHOrAdmin = user.role === 'RH' || user.role === 'ADMIN';
  const isJefeArea = ['SISTEMAS', 'COMPRAS', 'PRODUCCION'].includes(user.role);

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Empleados</h1>
              <p className="text-gray-600">
                {isRHOrAdmin 
                  ? 'Administra el expediente digital de los empleados de la empresa' 
                  : 'Consulta la información básica de los empleados de la empresa'}
              </p>
            </div>
            {isRHOrAdmin && (
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                >
                  Descargar Plantilla
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                >
                  Importar CSV
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                >
                  Exportar CSV
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                >
                  + Nuevo Empleado
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Nombre, RFC, CURP, NSS..."
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
              <select
                value={filters.estatus}
                onChange={(e) => handleFilterChange('estatus', e.target.value)}
                className="form-select"
              >
                <option value="">Todos</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
              <select
                value={filters.departamento_id}
                onChange={(e) => handleFilterChange('departamento_id', e.target.value)}
                className="form-select"
              >
                <option value="">Todos</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.nombre}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ estatus: '', departamento_id: '', search: '' })}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Empleados */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando empleados...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay empleados</h3>
            <p className="text-gray-600 mb-4">No se encontraron empleados con los filtros seleccionados.</p>
            {isRHOrAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                + Agregar Primer Empleado
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Información
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estatus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Ingreso
                    </th>
                    {isRHOrAdmin && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Salario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {employee.nombre ? employee.nombre.charAt(0) : '?'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.nombres || ''} {employee.apellidoPaterno || ''} {employee.apellidoMaterno || ''}
                            </div>
                            <div className="text-sm text-gray-500">{employee.puesto?.nombre || 'Sin puesto asignado'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">RFC: {employee.rfc}</div>
                        <div className="text-sm text-gray-500">CURP: {employee.curp}</div>
                        <div className="text-sm text-gray-500">NSS: {employee.nss}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.departamento?.nombre || 'Sin departamento'}</div>
                        <div className="text-sm text-gray-500">
                          {employee.documents?.length || 0} documentos
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(employee.estatus)}`}>
                          {employee.estatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.fecha_ingreso || employee.fechaAlta ? new Date(employee.fecha_ingreso || employee.fechaAlta).toLocaleDateString('es-MX') : 'No especificada'}
                        </div>
                      </td>
                      {isRHOrAdmin && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {employee.salarioMensual || employee.salary ? `$${(employee.salarioMensual || employee.salary).toLocaleString('es-MX')}` : 'Sin salario'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditClick(employee)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(employee.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Baja
                              </button>
                              <button
                                onClick={() => handleDeletePermanently(employee.id, employee.nombres || employee.nombre || 'Empleado')}
                                className="text-red-800 hover:text-red-900 font-bold"
                                title="Eliminar permanentemente"
                              >
                                Eliminar
                              </button>
                              <Link
                                href={`/rh/empleados/${employee.id}`}
                                className="text-green-600 hover:text-green-900"
                              >
                                Ver
                              </Link>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal para crear empleado */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Nuevo Empleado</h3>
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
                <form onSubmit={handleCreateEmployee}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                      <input
                        type="text"
                        required
                        value={formData.nombres}
                        onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno</label>
                      <input
                        type="text"
                        value={formData.apellidoPaterno}
                        onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
                      <input
                        type="text"
                        value={formData.apellidoMaterno}
                        onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RFC *</label>
                      <input
                        type="text"
                        required
                        value={formData.rfc}
                        onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CURP *</label>
                      <input
                        type="text"
                        required
                        value={formData.curp}
                        onChange={(e) => setFormData({ ...formData, curp: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">NSS *</label>
                      <input
                        type="text"
                        required
                        value={formData.nss}
                        onChange={(e) => setFormData({ ...formData, nss: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de ingreso *</label>
                      <input
                        type="date"
                        required
                        value={formData.fecha_ingreso}
                        onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
                      <select
                        value={formData.estatus}
                        onChange={(e) => setFormData({ ...formData, estatus: e.target.value })}
                        className="form-select"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Departamento *</label>
                      <select
                        required
                        value={formData.departamento_id}
                        onChange={(e) => {
                          setFormData({ 
                            ...formData, 
                            departamento_id: e.target.value,
                            puestoId: '' // Reset puesto cuando cambia departamento
                          });
                        }}
                        className="form-select"
                      >
                        <option value="">Seleccionar departamento</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Puesto *</label>
                      <select
                        required
                        value={formData.puestoId}
                        onChange={(e) => setFormData({ ...formData, puestoId: e.target.value })}
                        className="form-select"
                        disabled={!formData.departamento_id || availablePositions.length === 0}
                      >
                        <option value="">{formData.departamento_id ? 'Seleccionar puesto' : 'Seleccione un departamento primero'}</option>
                        {availablePositions.map(position => (
                          <option key={position.id} value={position.id}>{position.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salario</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="hidden">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jefe Directo</label>
                      <select
                        value={formData.reportaAId}
                        onChange={(e) => setFormData({ ...formData, reportaAId: e.target.value })}
                        className="form-select"
                        disabled
                      >
                        <option value="">Sin jefe directo</option>
                        {managers.map(manager => (
                          <option key={manager.id} value={manager.id}>{manager.displayName}</option>
                        ))}
                      </select>
                      <p className="text-sm text-gray-500 mt-1">Campo deshabilitado para la demo</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SD (Sueldo Diario)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.sd}
                        onChange={(e) => setFormData({ ...formData, sd: e.target.value })}
                        className="form-input"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SDI (Sueldo Diario Integrado)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.sdi}
                        onChange={(e) => setFormData({ ...formData, sdi: e.target.value })}
                        className="form-input"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nivel Jerárquico</label>
                      <select
                        value={formData.nivelJerarquico}
                        onChange={(e) => setFormData({ ...formData, nivelJerarquico: e.target.value })}
                        className="form-select"
                      >
                        <option value="OPERATIVO">Operativo</option>
                        <option value="SUPERVISOR">Supervisor</option>
                        <option value="GERENTE">Gerente</option>
                        <option value="DIRECTOR">Director</option>
                        <option value="VICEPRESIDENTE">Vicepresidente</option>
                        <option value="PRESIDENTE">Presidente</option>
                      </select>
                    </div>
                    <div className="hidden">
                      <input
                        type="hidden"
                        value={formData.userId}
                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      />
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
                      Crear Empleado
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar empleado */}
        {showEditModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Editar Empleado</h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
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
                <form onSubmit={handleUpdateEmployee}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                      <input
                        type="text"
                        required
                        value={formData.nombres}
                        onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno</label>
                      <input
                        type="text"
                        value={formData.apellidoPaterno}
                        onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
                      <input
                        type="text"
                        value={formData.apellidoMaterno}
                        onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RFC *</label>
                      <input
                        type="text"
                        required
                        value={formData.rfc}
                        onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CURP *</label>
                      <input
                        type="text"
                        required
                        value={formData.curp}
                        onChange={(e) => setFormData({ ...formData, curp: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">NSS *</label>
                      <input
                        type="text"
                        required
                        value={formData.nss}
                        onChange={(e) => setFormData({ ...formData, nss: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de ingreso *</label>
                      <input
                        type="date"
                        required
                        value={formData.fecha_ingreso}
                        onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
                      <select
                        value={formData.estatus}
                        onChange={(e) => setFormData({ ...formData, estatus: e.target.value })}
                        className="form-select"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Departamento *</label>
                      <select
                        required
                        value={formData.departamento_id}
                        onChange={(e) => {
                          setFormData({ 
                            ...formData, 
                            departamento_id: e.target.value,
                            puestoId: '' // Reset puesto cuando cambia departamento
                          });
                        }}
                        className="form-select"
                      >
                        <option value="">Seleccionar departamento</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Puesto *</label>
                      <select
                        required
                        value={formData.puestoId}
                        onChange={(e) => setFormData({ ...formData, puestoId: e.target.value })}
                        className="form-select"
                        disabled={!formData.departamento_id || availablePositions.length === 0}
                      >
                        <option value="">{formData.departamento_id ? 'Seleccionar puesto' : 'Seleccione un departamento primero'}</option>
                        {availablePositions.map(position => (
                          <option key={position.id} value={position.id}>{position.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salario</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="hidden">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jefe Directo</label>
                      <select
                        value={formData.reportaAId}
                        onChange={(e) => setFormData({ ...formData, reportaAId: e.target.value })}
                        className="form-select"
                        disabled
                      >
                        <option value="">Sin jefe directo</option>
                        {managers.map(manager => (
                          <option key={manager.id} value={manager.id}>{manager.displayName}</option>
                        ))}
                      </select>
                      <p className="text-sm text-gray-500 mt-1">Campo deshabilitado para la demo</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SD (Sueldo Diario)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.sd}
                        onChange={(e) => setFormData({ ...formData, sd: e.target.value })}
                        className="form-input"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SDI (Sueldo Diario Integrado)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.sdi}
                        onChange={(e) => setFormData({ ...formData, sdi: e.target.value })}
                        className="form-input"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nivel Jerárquico</label>
                      <select
                        value={formData.nivelJerarquico}
                        onChange={(e) => setFormData({ ...formData, nivelJerarquico: e.target.value })}
                        className="form-select"
                      >
                        <option value="OPERATIVO">Operativo</option>
                        <option value="SUPERVISOR">Supervisor</option>
                        <option value="GERENTE">Gerente</option>
                        <option value="DIRECTOR">Director</option>
                        <option value="VICEPRESIDENTE">Vicepresidente</option>
                        <option value="PRESIDENTE">Presidente</option>
                      </select>
                    </div>
                    <div className="hidden">
                      <input
                        type="hidden"
                        value={formData.userId}
                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
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
                      Actualizar Empleado
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal para importar CSV */}
        {showImportModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Importar Empleados desde CSV</h3>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setCsvFile(null);
                      setImportResults(null);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleImport}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar archivo CSV
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m0 0a4 4 0 004 4h12m4-24v8m0 0v8m0-8h8m-8 0h-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                            <span>Subir archivo</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              accept=".csv"
                              onChange={(e) => setCsvFile(e.target.files[0])}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">o arrastrar y soltar</p>
                        </div>
                        <p className="text-xs text-gray-500">CSV hasta 5MB</p>
                        {csvFile && (
                          <p className="text-sm text-green-600 mt-2">
                            Archivo seleccionado: {csvFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {importResults && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-md">
                      <h4 className="font-medium text-gray-900 mb-2">Resultados de importación:</h4>
                      <p className="text-sm text-gray-600">
                        Importados: {importResults.imported} | Errores: {importResults.errors}
                      </p>
                      {importResults.errorDetails && importResults.errorDetails.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Detalles de errores:</p>
                          <ul className="text-sm text-red-600 mt-1 max-h-32 overflow-y-auto">
                            {importResults.errorDetails.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowImportModal(false);
                        setCsvFile(null);
                        setImportResults(null);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!csvFile || importing}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {importing ? 'Importando...' : 'Importar'}
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

export default function EmpleadosPage() {
  return (
    <ProtectedRoute requiredModule="EMPLEADOS">
      <EmpleadosPageContent />
    </ProtectedRoute>
  );
}
