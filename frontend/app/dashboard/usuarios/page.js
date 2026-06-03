'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';

function UsersManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [stats, setStats] = useState(null);

  // Formularios
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'RH',
    accessibleModules: [],
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'RH',
    accessibleModules: [],
    isActive: true,
  });

  // Módulos disponibles del sistema
  const availableModules = [
    { id: 'EMPLEADOS', name: 'Empleados' },
    { id: 'RECLUTAMIENTO', name: 'Reclutamiento' },
    { id: 'VACACIONES', name: 'Vacaciones' },
    { id: 'INCIDENCIAS', name: 'Incidencias' },
    { id: 'CONFIGURACION', name: 'Configuración' },
    { id: 'REPORTES', name: 'Reportes' },
    { id: 'DASHBOARD', name: 'Dashboard' },
  ];

  // Roles disponibles
  const availableRoles = [
    { id: 'ADMIN', name: 'Administrador' },
    { id: 'RH', name: 'Recursos Humanos' },
    { id: 'SISTEMAS', name: 'Jefe de Sistemas' },
    { id: 'COMPRAS', name: 'Jefe de Compras' },
    { id: 'PRODUCCION', name: 'Jefe de Producción' },
    { id: 'EMPLEADO_BASICO', name: 'Empleado Básico' },
  ];

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchUsers();
      fetchStats();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/users/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleCreateFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      // Manejar módulos accesibles
      if (name === 'accessibleModules') {
        const updatedModules = checked
          ? [...createForm.accessibleModules, value]
          : createForm.accessibleModules.filter(module => module !== value);
        setCreateForm({ ...createForm, accessibleModules: updatedModules });
      }
    } else {
      setCreateForm({ ...createForm, [name]: value });
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'accessibleModules') {
        const updatedModules = checked
          ? [...editForm.accessibleModules, value]
          : editForm.accessibleModules.filter(module => module !== value);
        setEditForm({ ...editForm, accessibleModules: updatedModules });
      } else {
        setEditForm({ ...editForm, [name]: checked });
      }
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.password || !createForm.role) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      await api.post('/users', createForm);
      toast.success('Usuario creado exitosamente');
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        role: 'RH',
        accessibleModules: [],
      });
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.error || 'Error al crear usuario');
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      await api.put(`/users/${selectedUser.id}`, editForm);
      toast.success('Usuario actualizado exitosamente');
      setShowEditModal(false);
      setSelectedUser(null);
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar usuario');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      toast.success('Usuario eliminado exitosamente');
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      accessibleModules: user.accessibleModules || [],
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  // Verificar permisos
  if (!user || user.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">Solo los administradores pueden acceder a esta sección.</p>
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
            <p className="mt-2 text-gray-600">Cargando usuarios...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-gray-600 mt-1">Administra los usuarios del sistema</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              Crear Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700">Total de Usuarios</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700">Usuarios Activos</h3>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeUsers}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700">Usuarios Inactivos</h3>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.inactiveUsers}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700">Roles</h3>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.usersByRole?.length || 0}</p>
            </div>
          </div>
        )}

        {/* Tabla de usuarios */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado Vinculado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Módulos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {userItem.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {userItem.employee ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{userItem.employee.nombre}</div>
                          <div className="text-gray-500 text-xs">
                            {userItem.employee.puesto?.nombre || 'Sin puesto asignado'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No vinculado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        userItem.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800'
                          : userItem.role === 'RH'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {userItem.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        userItem.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {userItem.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {userItem.accessibleModules?.slice(0, 3).map((module) => (
                          <span key={module} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                            {module}
                          </span>
                        ))}
                        {userItem.accessibleModules?.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                            +{userItem.accessibleModules.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(userItem.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal(userItem)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(userItem);
                          setResetPasswordValue('');
                          setShowResetPasswordModal(true);
                        }}
                        className="text-amber-600 hover:text-amber-900 mr-2"
                      >
                        Contraseña
                      </button>
                      <button
                        onClick={() => handleDeleteUser(userItem.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={userItem.id === user.id}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay usuarios registrados.</p>
              <p className="text-gray-400 text-sm mt-2">
                Haz clic en "Crear Nuevo Usuario" para agregar el primer usuario.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Usuario</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Usuario *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={createForm.name}
                    onChange={handleCreateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={createForm.email}
                    onChange={handleCreateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={createForm.password}
                    onChange={handleCreateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol *
                  </label>
                  <select
                    name="role"
                    value={createForm.role}
                    onChange={handleCreateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Módulos Accesibles
                  </label>
                  <div className="space-y-2">
                    {availableModules.map((module) => (
                      <div key={module.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`module-${module.id}`}
                          name="accessibleModules"
                          value={module.id}
                          checked={createForm.accessibleModules.includes(module.id)}
                          onChange={handleCreateFormChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`module-${module.id}`} className="ml-2 text-sm text-gray-700">
                          {module.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateUser}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                  >
                    Crear Usuario
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Restablecer Contraseña */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Restablecer Contraseña</h2>
                <button
                  onClick={() => setShowResetPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Vas a restablecer la contraseña de <strong>{selectedUser.name}</strong> ({selectedUser.email}).
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowResetPasswordModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
                    disabled={resettingPassword}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!resetPasswordValue || resetPasswordValue.length < 6) {
                        toast.error('La contraseña debe tener al menos 6 caracteres');
                        return;
                      }

                      setResettingPassword(true);
                      try {
                        await api.post(`/users/${selectedUser.id}/reset-password`, {
                          newPassword: resetPasswordValue
                        });
                        toast.success(`Contraseña de ${selectedUser.name} restablecida exitosamente`);
                        setShowResetPasswordModal(false);
                        setSelectedUser(null);
                        setResetPasswordValue('');
                      } catch (error) {
                        toast.error(error.response?.data?.error || 'Error al restablecer la contraseña');
                      } finally {
                        setResettingPassword(false);
                      }
                    }}
                    disabled={resettingPassword}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resettingPassword ? 'Restableciendo...' : 'Restablecer Contraseña'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Editar Usuario</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Usuario *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña (dejar vacío para no cambiar)
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={editForm.password}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol *
                  </label>
                  <select
                    name="role"
                    value={editForm.role}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Módulos Accesibles
                  </label>
                  <div className="space-y-2">
                    {availableModules.map((module) => (
                      <div key={module.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`edit-module-${module.id}`}
                          name="accessibleModules"
                          value={module.id}
                          checked={editForm.accessibleModules.includes(module.id)}
                          onChange={handleEditFormChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`edit-module-${module.id}`} className="ml-2 text-sm text-gray-700">
                          {module.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={editForm.isActive}
                    onChange={handleEditFormChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Usuario Activo
                  </label>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEditUser}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function UsersManagementPageWrapper() {
  return (
    <ProtectedRoute>
      <UsersManagementPage />
    </ProtectedRoute>
  );
}
