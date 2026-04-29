'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { permissionApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

// Módulos disponibles con sus nombres en español
const MODULES = [
  { id: 'EMPLEADOS', name: 'Empleados', description: 'Gestión de empleados y expedientes' },
  { id: 'RECLUTAMIENTO', name: 'Reclutamiento', description: 'Gestión de vacantes y candidatos' },
  { id: 'VACACIONES', name: 'Vacaciones', description: 'Solicitud y aprobación de vacaciones' },
  { id: 'INCIDENCIAS', name: 'Incidencias', description: 'Reporte y seguimiento de incidencias' },
  { id: 'CONFIGURACION', name: 'Configuración', description: 'Configuración del sistema' },
  { id: 'REPORTES', name: 'Reportes', description: 'Generación de reportes y estadísticas' },
  { id: 'COMPRAS', name: 'Compras', description: 'Solicitud y gestión de compras' }
];

// Nombres de roles en español
const ROLE_NAMES = {
  'ADMIN': 'Administrador',
  'RH': 'Recursos Humanos',
  'SISTEMAS': 'Jefe de Sistemas',
  'COMPRAS': 'Jefe de Compras',
  'PRODUCCION': 'Jefe de Producción'
};

export default function AccesosPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Verificar permisos del usuario actual
  const canManagePermissions = user?.role === 'ADMIN' || user?.role === 'RH';

  useEffect(() => {
    if (canManagePermissions) {
      fetchUsers();
    }
  }, [canManagePermissions]);

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
    try {
      setUpdating(prev => ({ ...prev, [userId]: true }));
      setError(null);
      setSuccessMessage(null);

      const userToUpdate = users.find(u => u.id === userId);
      let newModules = [...(userToUpdate.accessibleModules || [])];

      if (isChecked) {
        // Agregar módulo
        if (!newModules.includes(moduleId)) {
          newModules.push(moduleId);
        }
      } else {
        // Remover módulo (excepto DASHBOARD que siempre debe estar)
        if (moduleId !== 'DASHBOARD') {
          newModules = newModules.filter(m => m !== moduleId);
        }
      }

      // Asegurar que DASHBOARD siempre esté incluido
      if (!newModules.includes('DASHBOARD')) {
        newModules.push('DASHBOARD');
      }

      const response = await permissionApi.updateUserPermissions(userId, newModules);

      if (response.data.success) {
        // Actualizar estado local
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === userId
              ? { ...u, accessibleModules: newModules }
              : u
          )
        );
        setSuccessMessage(`Permisos actualizados para ${userToUpdate.name}`);
        
        // Limpiar mensaje después de 3 segundos
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
    try {
      setUpdating(prev => ({ ...prev, [userId]: true }));
      setError(null);
      setSuccessMessage(null);

      const userToUpdate = users.find(u => u.id === userId);
      const newModules = enableAll 
        ? ['DASHBOARD', ...MODULES.map(m => m.id)]
        : ['DASHBOARD'];

      const response = await permissionApi.updateUserPermissions(userId, newModules);

      if (response.data.success) {
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === userId
              ? { ...u, accessibleModules: newModules }
              : u
          )
        );
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

  if (!canManagePermissions) {
    return (
      <DashboardLayout>
        <div className="min-h-screen p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Acceso Denegado</h2>
              <p className="text-red-700">
                No tienes permisos para acceder a esta sección. Solo ADMIN y RH pueden gestionar permisos.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Accesos</h1>
            <p className="text-gray-600 mt-2">
              Administra los módulos a los que tienen acceso los usuarios del sistema.
            </p>
          </div>

          {/* Mensajes de estado */}
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

          {/* Tabla de usuarios */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Cargando usuarios...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">No hay usuarios para mostrar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Departamento
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      {MODULES.map(module => (
                        <th key={module.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {module.name}
                        </th>
                      ))}
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(userItem => {
                      const isUpdating = updating[userItem.id];
                      const hasAllModules = MODULES.every(module => 
                        userItem.accessibleModules?.includes(module.id)
                      );
                      
                      return (
                        <tr key={userItem.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                              <div className="text-sm text-gray-500">{userItem.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              userItem.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                              userItem.role === 'RH' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {ROLE_NAMES[userItem.role] || userItem.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {userItem.departamento || 'No asignado'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              userItem.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {userItem.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          
                          {/* Checkboxes para cada módulo */}
                          {MODULES.map(module => {
                            const hasAccess = userItem.accessibleModules?.includes(module.id);
                            return (
                              <td key={module.id} className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={hasAccess}
                                    onChange={(e) => handleToggleModule(userItem.id, module.id, e.target.checked)}
                                    disabled={isUpdating || !userItem.isActive}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    title={module.description}
                                  />
                                  {isUpdating && (
                                    <div className="ml-2 inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          
                          {/* Acciones rápidas */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleToggleAllModules(userItem.id, !hasAllModules)}
                                disabled={isUpdating || !userItem.isActive}
                                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                                  hasAllModules
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                } ${(isUpdating || !userItem.isActive) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {hasAllModules ? 'Desactivar todos' : 'Activar todos'}
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

          {/* Información adicional */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Información sobre los permisos</h3>
            <ul className="text-blue-700 space-y-1">
              <li>• El módulo <strong>Dashboard</strong> está siempre activo para todos los usuarios.</li>
              <li>• Solo usuarios <strong>Activos</strong> pueden recibir cambios en sus permisos.</li>
              <li>• Los cambios se guardan automáticamente al hacer clic en los checkboxes.</li>
              <li>• Los permisos afectan la visibilidad de los módulos en el menú lateral.</li>
            </ul>
          </div>

          {/* Leyenda de módulos */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map(module => (
              <div key={module.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{module.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{module.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}