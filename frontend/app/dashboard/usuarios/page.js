'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api, { systemApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getAllRoles, getRoleName, getRoleColor } from '@/lib/rolesConfig';

const ITEMS_PER_PAGE = 10;

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
  const [submitting, setSubmitting] = useState(false);

  // Roles dinámicos
  const [availableRoles, setAvailableRoles] = useState([]);

  // Búsqueda y filtros
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(1);

  // Formularios
  const [createForm, setCreateForm] = useState({
    name: '', email: '', password: '', role: 'RH',
  });

  const [editForm, setEditForm] = useState({
    name: '', email: '', password: '', role: 'RH', isActive: true,
  });

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchUsers();
      fetchStats();
      fetchRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchRoles = async () => {
    try {
      const response = await systemApi.getRoles();
      setAvailableRoles(response.data.roles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setAvailableRoles(getAllRoles()); // fallback estático
    }
  };

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

  // ===== Filtrado y paginación =====
  const filteredUsers = useMemo(() => {
    let result = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.employee?.nombre || '').toLowerCase().includes(q)
      );
    }
    if (filterRole) {
      result = result.filter(u => u.role === filterRole);
    }
    return result;
  }, [users, search, filterRole]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  useEffect(() => { setPage(1); }, [search, filterRole]);

  // ===== Handlers =====
  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setCreateForm({ ...createForm, [name]: value });
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setEditForm({ ...editForm, [name]: checked });
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.password || !createForm.role) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/users', createForm);
      toast.success('Usuario creado exitosamente');
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', role: 'RH' });
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.put(`/users/${selectedUser.id}`, editForm);
      toast.success('Usuario actualizado exitosamente');
      setShowEditModal(false);
      setSelectedUser(null);
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('Usuario eliminado exitosamente');
      await fetchUsers();
      await fetchStats();
    } catch (error) {
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
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  // ===== Componente Paginación =====
  const Pagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Página <span className="font-medium">{page}</span> de{' '}
          <span className="font-medium">{totalPages}</span>
          <span className="ml-2 text-gray-400">({filteredUsers.length} resultados)</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >← Anterior</button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >Siguiente →</button>
        </div>
      </div>
    );
  };

  // ===== Verificar permisos =====
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
              <p className="text-gray-600 mt-1">Administra las cuentas de usuario del sistema</p>
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
              <h3 className="text-sm font-medium text-gray-500">Total</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Activos</h3>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeUsers}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Inactivos</h3>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.inactiveUsers}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Roles</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {stats.usersByRole?.map(r => (
                  <span key={r.role} className={`px-2 py-0.5 text-xs rounded-full ${getRoleColor(r.role)}`}>
                    {getRoleName(r.role)}: {r.count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Búsqueda y filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar por nombre, email o empleado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Todos los roles</option>
            {availableRoles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <div className="text-sm text-gray-500 self-center">
            {filteredUsers.length} de {users.length} usuarios
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado Vinculado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{userItem.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {userItem.employee ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{userItem.employee.nombre}</div>
                          <div className="text-gray-500 text-xs">
                            {userItem.employee.puesto?.nombre || 'Sin puesto'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No vinculado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(userItem.role)}`}>
                        {getRoleName(userItem.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        userItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {userItem.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        const d = userItem.createdAt.split('T')[0].split('-');
                        return `${d[2]}/${d[1]}/${d[0]}`;
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => openEditModal(userItem)}
                        className="text-blue-600 hover:text-blue-900 mr-2">Editar</button>
                      <button onClick={() => {
                        setSelectedUser(userItem);
                        setResetPasswordValue('');
                        setShowResetPasswordModal(true);
                      }} className="text-amber-600 hover:text-amber-900 mr-2">Contraseña</button>
                      <button onClick={() => handleDeleteUser(userItem.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={userItem.id === user.id}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {search || filterRole ? 'No se encontraron usuarios con esos criterios' : 'No hay usuarios registrados.'}
              </p>
            </div>
          )}

          <Pagination />
        </div>
      </div>

      {/* Modal de Creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Usuario</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario *</label>
                  <input type="text" name="name" value={createForm.name} onChange={handleCreateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
                  <input type="email" name="email" value={createForm.email} onChange={handleCreateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                  <input type="password" name="password" value={createForm.password} onChange={handleCreateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                  <select name="role" value={createForm.role} onChange={handleCreateFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleCreateUser} disabled={submitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50">
                    {submitting ? 'Creando...' : 'Crear Usuario'}
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
                <button onClick={() => setShowResetPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña *</label>
                  <input type="password" value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required minLength={6} placeholder="Mínimo 6 caracteres" />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button onClick={() => setShowResetPasswordModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
                    disabled={resettingPassword}>Cancelar</button>
                  <button onClick={async () => {
                    if (!resetPasswordValue || resetPasswordValue.length < 6) {
                      toast.error('La contraseña debe tener al menos 6 caracteres');
                      return;
                    }
                    setResettingPassword(true);
                    try {
                      await api.post(`/users/${selectedUser.id}/reset-password`, { newPassword: resetPasswordValue });
                      toast.success(`Contraseña de ${selectedUser.name} restablecida exitosamente`);
                      setShowResetPasswordModal(false);
                      setSelectedUser(null);
                      setResetPasswordValue('');
                    } catch (error) {
                      toast.error(error.response?.data?.error || 'Error al restablecer la contraseña');
                    } finally {
                      setResettingPassword(false);
                    }
                  }} disabled={resettingPassword}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-medium disabled:opacity-50">
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Editar Usuario</h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario *</label>
                  <input type="text" name="name" value={editForm.name} onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
                  <input type="email" name="email" value={editForm.email} onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña (dejar vacío para no cambiar)</label>
                  <input type="password" name="password" value={editForm.password} onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                  <select name="role" value={editForm.role} onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="isActive" name="isActive"
                    checked={editForm.isActive} onChange={handleEditFormChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">Usuario Activo</label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleEditUser} disabled={submitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50">
                    {submitting ? 'Guardando...' : 'Guardar Cambios'}
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
