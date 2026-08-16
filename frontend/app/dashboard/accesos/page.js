'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { permissionApi, systemApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import RoleManager from '@/components/RoleManager';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getRoleName, getRoleColor } from '@/lib/rolesConfig';

// Módulos y presets se cargan desde la API (systemApi.getModules, systemApi.getRolePresets)
// con fallback inline en caso de error de conexión.

function AccesosPageContent() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [allRoles, setAllRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [rolePresets, setRolePresets] = useState({});

  const canManagePermissions = user?.role === 'ADMIN' || user?.role === 'RH';

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await systemApi.getRoles();
        setAllRoles(response.data.roles || []);
      } catch (err) {
        console.error('Error fetching roles:', err);
        setAllRoles([
          { id: 'ADMIN', name: 'Administrador', isCustom: false },
          { id: 'RH', name: 'Recursos Humanos', isCustom: false },
          { id: 'SISTEMAS', name: 'Sistemas', isCustom: false },
          { id: 'COMPRAS', name: 'Compras', isCustom: false },
          { id: 'PRODUCCION', name: 'Producción', isCustom: false },
          { id: 'EMPLEADO_BASICO', name: 'Empleado', isCustom: false }
        ]);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    if (canManagePermissions) fetchUsers();
  }, [canManagePermissions]);

  // Cargar módulos y presets desde la API (systemApi como fuente única)
  useEffect(() => {
    const fetchModulesAndPresets = async () => {
      try {
        const [modulesRes, presetsRes] = await Promise.all([
          systemApi.getModules(),
          systemApi.getRolePresets()
        ]);
        if (modulesRes.data?.modules) {
          // Filtrar DASHBOARD ya que se maneja aparte
          setModules(modulesRes.data.modules.filter(m => m.id !== 'DASHBOARD'));
        }
        if (presetsRes.data?.presets) {
          setRolePresets(presetsRes.data.presets);
        }
      } catch (err) {
        console.warn('Error fetching modules/presets from API:', err);
      }
    };
    fetchModulesAndPresets();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = !searchTerm || 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !roleFilter || u.role === roleFilter;
      const matchesStatus = !statusFilter || 
        (statusFilter === 'active' && u.isActive) || 
        (statusFilter === 'inactive' && !u.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await permissionApi.getAllUsersWithPermissions();
      if (response.data.success) {
        setUsers(response.data.users);
      } else {
        setError('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('No se pudieron cargar los usuarios. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModule = async (userId, moduleId, isChecked) => {
    if (userId === user.id) {
      setError('No puedes modificar tus propios permisos para evitar bloquearte el acceso');
      return;
    }
    try {
      setUpdating(prev => ({ ...prev, [userId]: true }));
      setError(null);
      setSuccessMessage(null);
      const userToUpdate = users.find(u => u.id === userId);
      let newModules = [...(userToUpdate.accessibleModules || [])];
      if (isChecked) {
        if (!newModules.includes(moduleId)) newModules.push(moduleId);
      } else {
        if (moduleId !== 'DASHBOARD') newModules = newModules.filter(m => m !== moduleId);
      }
      if (!newModules.includes('DASHBOARD')) newModules.push('DASHBOARD');
      const response = await permissionApi.updateUserPermissions(userId, newModules);
      if (response.data.success) {
        setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, accessibleModules: newModules } : u));
        setSuccessMessage(`Permisos actualizados para ${userToUpdate.name}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Error al actualizar permisos');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      setError(error.response?.data?.message || 'Error al actualizar permisos');
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleToggleAllModules = async (userId, enableAll) => {
    if (userId === user.id) {
      setError('No puedes modificar tus propios permisos para evitar bloquearte el acceso');
      return;
    }
    try {
      setUpdating(prev => ({ ...prev, [userId]: true }));
      setError(null);
      setSuccessMessage(null);
      const userToUpdate = users.find(u => u.id === userId);
      const newModules = enableAll ? ['DASHBOARD', ...modules.map(m => m.id)] : ['DASHBOARD'];
      const response = await permissionApi.updateUserPermissions(userId, newModules);
      if (response.data.success) {
        setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, accessibleModules: newModules } : u));
        setSuccessMessage(`Todos los permisos ${enableAll ? 'activados' : 'desactivados'} para ${userToUpdate.name}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Error al actualizar permisos');
      }
    } catch (error) {
      console.error('Error updating all permissions:', error);
      setError(error.response?.data?.message || 'Error al actualizar permisos');
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleApplyPreset = async (userId, presetRole) => {
    if (userId === user.id) {
      setError('No puedes modificar tus propios permisos para evitar bloquearte el acceso');
      return;
    }
    if (!confirm(`¿Aplicar el preset "${getRoleName(presetRole)}"? Esto cambiará el rol y los módulos del usuario.`)) return;
    try {
      setUpdating(prev => ({ ...prev, [userId]: true }));
      setError(null);
      setSuccessMessage(null);
      const userToUpdate = users.find(u => u.id === userId);
      // Si el rol tiene preset definido, usar sus módulos; si no (rol personalizado), mantener los módulos actuales
      const presetModules = rolePresets[presetRole] !== undefined
        ? rolePresets[presetRole]
        : (userToUpdate?.accessibleModules || ['DASHBOARD']);
      const response = await permissionApi.updateUserPermissions(userId, presetModules, presetRole);
      if (response.data.success) {
        // Refrescar todos los usuarios desde el backend para asegurar datos consistentes
        await fetchUsers();
        setSuccessMessage(`Preset "${getRoleName(presetRole)}" aplicado a ${userToUpdate.name}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Error al aplicar preset');
      }
    } catch (error) {
      console.error('Error applying preset:', error);
      setError(error.response?.data?.message || 'Error al aplicar preset');
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (!canManagePermissions) {
    return (
      <DashboardLayout>
        <div className="min-h-screen p-6">
          <div className="w-full">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Acceso Denegado</h2>
              <p className="text-red-700">No tienes permisos para acceder a esta sección. Solo ADMIN y RH pueden gestionar permisos.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6">
        <div className="w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Accesos</h1>
            <p className="text-gray-600 mt-2">Administra los módulos a los que tienen acceso los usuarios del sistema.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800">{successMessage}</span>
              </div>
            </div>
          )}

          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar usuario</label>
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nombre o correo..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por rol</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="">Todos los roles</option>
                  {allRoles.map(role => (
                    <option key={role.id} value={role.id}>{role.name || getRoleName(role.id)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por estado</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={() => { setSearchTerm(''); setRoleFilter(''); setStatusFilter(''); }} className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">Limpiar filtros</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Cargando usuarios...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">{users.length === 0 ? 'No hay usuarios para mostrar.' : 'No se encontraron usuarios con los filtros seleccionados.'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Usuario</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Módulos activos</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map(userItem => {
                      const isUpdating = updating[userItem.id];
                      const isExpanded = expandedUser === userItem.id;
                      const activeModules = userItem.accessibleModules || [];
                      const hasAllModules = modules.every(m => activeModules.includes(m.id));
                      return (
                        <tr key={userItem.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">{userItem.name?.charAt(0) || '?'}</span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                                <div className="text-xs text-gray-500">{userItem.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={getRoleColor(userItem.role)}>{getRoleName(userItem.role)}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {userItem.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {activeModules.filter(m => m !== 'DASHBOARD').slice(0, 3).map(module => (
                                <span key={module} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">{modules.find(m => m.id === module)?.name || module}</span>
                              ))}
                              {activeModules.filter(m => m !== 'DASHBOARD').length > 3 && (
                                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">+{activeModules.filter(m => m !== 'DASHBOARD').length - 3}</span>
                              )}
                              {activeModules.filter(m => m !== 'DASHBOARD').length === 0 && (
                                <span className="text-xs text-gray-400">Solo Dashboard</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setExpandedUser(isExpanded ? null : userItem.id)} disabled={isUpdating || !userItem.isActive} className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isExpanded ? 'Contraer' : 'Gestionar'}
                              </button>
                              <button onClick={() => handleToggleAllModules(userItem.id, !hasAllModules)} disabled={isUpdating || !userItem.isActive} className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${hasAllModules ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                {hasAllModules ? 'Quitar todos' : 'Dar todos'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {expandedUser && (
            <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {(() => {
                const userItem = users.find(u => u.id === expandedUser);
                if (!userItem) return null;
                const isUpdating = updating[userItem.id];
                const activeModules = userItem.accessibleModules || [];
                return (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Módulos de: {userItem.name}</h3>
                        <p className="text-sm text-gray-500">Rol actual: {getRoleName(userItem.role)}</p>
                      </div>
                      <button onClick={() => setExpandedUser(null)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {user?.role === 'ADMIN' && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Aplicar preset por rol:</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(rolePresets).map(([roleId, presetModules]) => (
                          <button key={roleId} onClick={() => handleApplyPreset(userItem.id, roleId)} disabled={isUpdating || !userItem.isActive}
                            className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md transition-colors ${
                              userItem.role === roleId ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}>
                            {getRoleName(roleId)}
                          </button>
                        ))}
                        {allRoles.filter(r => r.isCustom).map(role => (
                          <button key={role.id} onClick={() => handleApplyPreset(userItem.id, role.id)} disabled={isUpdating || !userItem.isActive}
                            className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md transition-colors ${
                              userItem.role === role.id ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}>
                            {role.name || getRoleName(role.id)}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Los presets asignan los módulos típicos para cada rol. Puedes personalizarlos después.</p>
                    </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {modules.map(module => {
                        const hasAccess = activeModules.includes(module.id);
                        return (
                          <div key={module.id} onClick={() => { if (!isUpdating && userItem.isActive) handleToggleModule(userItem.id, module.id, !hasAccess); }}
                            className={`relative flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                              hasAccess ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            } ${(isUpdating || !userItem.isActive) ? 'opacity-60 cursor-not-allowed' : ''}`}>
                            <input type="checkbox" checked={hasAccess} onChange={() => {}} disabled={isUpdating || !userItem.isActive} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{module.name}</div>
                              <div className="text-xs text-gray-500">{module.description}</div>
                            </div>
                            {isUpdating && <div className="ml-auto"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div></div>}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Módulos activos: <strong>{activeModules.filter(m => m !== 'DASHBOARD').length} de {modules.length}</strong>{activeModules.includes('DASHBOARD') && ' (+ Dashboard siempre activo)'}</span>
                        <button onClick={() => setExpandedUser(null)} className="text-blue-600 hover:text-blue-800 font-medium">Cerrar</button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {user?.role === 'ADMIN' && <RoleManager onRolesChange={setAllRoles} />}

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Información sobre los permisos</h3>
            <ul className="text-blue-700 space-y-1">
              <li>• El módulo <strong>Dashboard</strong> está siempre activo para todos los usuarios.</li>
              <li>• Solo usuarios <strong>Activos</strong> pueden recibir cambios en sus permisos.</li>
              <li>• Los cambios se guardan automáticamente al hacer clic en los checkboxes.</li>
              <li>• Los <strong>presets</strong> asignan los módulos típicos para cada rol de forma rápida.</li>
              <li>• Los permisos afectan la visibilidad de los módulos en el menú lateral.</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AccesosPage() {
  return (
    <ProtectedRoute>
      <AccesosPageContent />
    </ProtectedRoute>
  );
}
