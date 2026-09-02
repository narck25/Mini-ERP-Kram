'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';

function ProfilePageContent() {
  const { user, changePassword } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    telefonoMovil: '',
    correoElectronico: '',
    direccionCompleta: '',
    estadoCivil: '',
    nivelAcademico: ''
  });

  useEffect(() => {
    if (user) {
      fetchEmployeeProfile();
    }
  }, [user]);

  const fetchEmployeeProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees/me');
      setEmployee(response.data.employee);
      
      // Preparar datos para el formulario de edición
      if (response.data.employee) {
        const emp = response.data.employee;
        setFormData({
          nombres: emp.nombres || emp.nombre || '',
          apellidoPaterno: emp.apellidoPaterno || '',
          apellidoMaterno: emp.apellidoMaterno || '',
          fechaNacimiento: emp.fechaNacimiento ? new Date(emp.fechaNacimiento).toISOString().split('T')[0] : '',
          telefonoMovil: emp.telefonoMovil || '',
          correoElectronico: emp.correoElectronico || '',
          direccionCompleta: emp.direccionCompleta || '',
          estadoCivil: emp.estadoCivil || '',
          nivelAcademico: emp.nivelAcademico || ''
        });
      }
    } catch (error) {
      console.error('Error fetching employee profile:', error);
      if (error.response?.status === 404) {
        toast.error('No se encontró información de empleado asociada a tu usuario');
      } else {
        toast.error('Error al cargar la información del perfil');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/employees/${employee.id}`, formData);
      toast.success('Perfil actualizado exitosamente');
      setShowEditModal(false);
      fetchEmployeeProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar el perfil');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando información del perfil...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-600">Información personal y laboral</p>
            </div>
            {employee && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                Editar Perfil
              </button>
            )}
          </div>
        </div>

        {!employee ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay información de empleado</h3>
            <p className="text-gray-600 mb-4">No se encontró información de empleado asociada a tu usuario.</p>
            <p className="text-sm text-gray-500">Contacta al departamento de Recursos Humanos para asociar tu usuario con un empleado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda - Información personal */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start mb-6">
                    <div className="flex-shrink-0 h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-2xl font-bold">
                        {employee.nombres ? employee.nombres.charAt(0) : employee.nombre ? employee.nombre.charAt(0) : '?'}
                      </span>
                    </div>
                    <div className="ml-6">
                      <h2 className="text-xl font-bold text-gray-900">
                        {employee.nombres || employee.nombre || ''} {employee.apellidoPaterno || ''} {employee.apellidoMaterno || ''}
                      </h2>
                      <p className="text-gray-600">{employee.puesto?.nombre || 'Sin puesto asignado'}</p>
                      <div className="flex items-center mt-2">
                        {/* No se muestra el rol aquí: evita comparaciones/jerarquías entre empleados. */}
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${employee.estatus === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {employee.estatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Información Personal */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Información Personal</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Fecha de Nacimiento</p>
                          <p className="text-gray-900">{formatDate(employee.fechaNacimiento)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Estado Civil</p>
                          <p className="text-gray-900">{employee.estadoCivil || 'No especificado'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Nivel Académico</p>
                          <p className="text-gray-900">{employee.nivelAcademico || 'No especificado'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Nacionalidad</p>
                          <p className="text-gray-900">{employee.nacionalidad || 'No especificado'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Información de Contacto */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Información de Contacto</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Teléfono Móvil</p>
                          <p className="text-gray-900">{employee.telefonoMovil || 'No especificado'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Teléfono Casa</p>
                          <p className="text-gray-900">{employee.telefonoCasa || 'No especificado'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Correo Electrónico</p>
                          <p className="text-gray-900">{employee.correoElectronico || 'No especificado'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Correo Empresa</p>
                          <p className="text-gray-900">{employee.correoEmpresa || 'No especificado'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Dirección</p>
                          <p className="text-gray-900">{employee.direccionCompleta || 'No especificada'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Información Laboral</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Departamento</p>
                        <p className="text-gray-900">{employee.departamento?.nombre || 'No especificado'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Fecha de Ingreso</p>
                        <p className="text-gray-900">{formatDate(employee.fechaAlta || employee.fecha_ingreso)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Sucursal</p>
                        <p className="text-gray-900">{employee.sucursal || 'No especificada'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Área</p>
                        <p className="text-gray-900">{employee.area || 'No especificada'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Región</p>
                        <p className="text-gray-900">{employee.region || 'No especificada'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Contrato</p>
                        <p className="text-gray-900">{employee.contrato || 'No especificado'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Horario</p>
                        <p className="text-gray-900">{employee.horario || 'No especificado'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Salario Mensual</p>
                        <p className="text-gray-900">
                          {employee.salarioMensual || employee.salary ? `$${(employee.salarioMensual || employee.salary).toLocaleString('es-MX')}` : 'No especificado'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Información adicional */}
            <div className="space-y-6">
              {/* Información de Usuario */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Información de Usuario</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nombre de Usuario</p>
                      <p className="text-gray-900">{user?.name || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Correo Electrónico</p>
                      <p className="text-gray-900">{user?.email || 'No especificado'}</p>
                    </div>
                    {/* No se muestra el rol aquí: evita comparaciones/jerarquías entre empleados. */}
                    <div>
                      <p className="text-sm font-medium text-gray-500">Estado de Cuenta</p>
                      <p className="text-gray-900">{user?.isActive ? 'Activa' : 'Inactiva'}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <button
                      onClick={() => {
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setShowPasswordModal(true);
                      }}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium text-sm transition-colors"
                    >
                      Cambiar Contraseña
                    </button>
                  </div>
                </div>
              </div>

              {/* Documentos */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Documentos</h3>
                  {employee.documents && employee.documents.length > 0 ? (
                    <div className="space-y-2">
                      {employee.documents.slice(0, 5).map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.tipo_documento}</p>
                            <p className="text-xs text-gray-500">
                              {(() => { const d = doc.createdAt.split('T')[0].split('-'); return `${d[2]}/${d[1]}/${d[0]}`; })()}
                            </p>
                          </div>
                          <a
                            href={doc.url_archivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Ver
                          </a>
                        </div>
                      ))}
                      {employee.documents.length > 5 && (
                        <p className="text-sm text-gray-500 text-center mt-2">
                          +{employee.documents.length - 5} documentos más
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No hay documentos registrados</p>
                  )}
                </div>
              </div>

              {/* Vacantes Solicitadas */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Vacantes Solicitadas</h3>
                  {employee.jobVacancies && employee.jobVacancies.length > 0 ? (
                    <div className="space-y-2">
                      {employee.jobVacancies.slice(0, 3).map((vacancy) => (
                        <div key={vacancy.id} className="p-2 hover:bg-gray-50 rounded">
                          <p className="text-sm font-medium text-gray-900">{vacancy.nombrePuesto}</p>
                          <p className="text-xs text-gray-500">
                            {(() => { const d = vacancy.createdAt.split('T')[0].split('-'); return `${d[2]}/${d[1]}/${d[0]}`; })()}
                          </p>
                        </div>
                      ))}
                      {employee.jobVacancies.length > 3 && (
                        <p className="text-sm text-gray-500 text-center mt-2">
                          +{employee.jobVacancies.length - 3} vacantes más
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No hay vacantes solicitadas</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Cambio de Contraseña */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Cambiar Contraseña</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                
                // Validar que la nueva contraseña coincida
                if (passwordData.newPassword !== passwordData.confirmPassword) {
                  toast.error('Las contraseñas nuevas no coinciden');
                  return;
                }
                
                // Validar longitud mínima
                if (passwordData.newPassword.length < 6) {
                  toast.error('La nueva contraseña debe tener al menos 6 caracteres');
                  return;
                }

                setChangingPassword(true);
                try {
                  const result = await changePassword({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                  });
                  
                  if (result.success) {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }
                } finally {
                  setChangingPassword(false);
                }
              }}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña Actual *
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      placeholder="Ingresa tu contraseña actual"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nueva Contraseña *
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar Nueva Contraseña *
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      minLength={6}
                      placeholder="Repite la nueva contraseña"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={changingPassword}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Edición */}
        {showEditModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Editar Perfil</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      value={formData.nombres}
                      onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido Paterno
                    </label>
                    <input
                      type="text"
                      value={formData.apellidoPaterno}
                      onChange={(e) => setFormData({...formData, apellidoPaterno: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido Materno
                    </label>
                    <input
                      type="text"
                      value={formData.apellidoMaterno}
                      onChange={(e) => setFormData({...formData, apellidoMaterno: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={formData.fechaNacimiento}
                      onChange={(e) => setFormData({...formData, fechaNacimiento: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono Móvil
                    </label>
                    <input
                      type="tel"
                      value={formData.telefonoMovil}
                      onChange={(e) => setFormData({...formData, telefonoMovil: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={formData.correoElectronico}
                      onChange={(e) => setFormData({...formData, correoElectronico: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección Completa
                    </label>
                    <textarea
                      value={formData.direccionCompleta}
                      onChange={(e) => setFormData({...formData, direccionCompleta: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado Civil
                    </label>
                    <select
                      value={formData.estadoCivil}
                      onChange={(e) => setFormData({...formData, estadoCivil: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="Soltero(a)">Soltero(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viudo(a)">Viudo(a)</option>
                      <option value="Unión Libre">Unión Libre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nivel Académico
                    </label>
                    <select
                      value={formData.nivelAcademico}
                      onChange={(e) => setFormData({...formData, nivelAcademico: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="Primaria">Primaria</option>
                      <option value="Secundaria">Secundaria</option>
                      <option value="Preparatoria">Preparatoria</option>
                      <option value="Técnico">Técnico</option>
                      <option value="Licenciatura">Licenciatura</option>
                      <option value="Maestría">Maestría</option>
                      <option value="Doctorado">Doctorado</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute requiredModule="DASHBOARD">
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
