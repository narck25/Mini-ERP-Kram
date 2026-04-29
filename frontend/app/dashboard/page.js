'use client';

import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

function DashboardPageContent() {
  const { user, loading: authLoading } = useAuth();

  const getRoleName = (role) => {
    const roles = {
      ADMIN: 'Administrador',
      RH: 'Recursos Humanos',
      SISTEMAS: 'Sistemas',
      COMPRAS: 'Compras',
      PRODUCCION: 'Producción'
    };
    return roles[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      ADMIN: 'bg-purple-100 text-purple-800',
      RH: 'bg-blue-100 text-blue-800',
      SISTEMAS: 'bg-green-100 text-green-800',
      COMPRAS: 'bg-yellow-100 text-yellow-800',
      PRODUCCION: 'bg-red-100 text-red-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // Mostrar loading mientras se verifica autenticación
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Verificando autenticación...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Si no hay usuario, mostrar mensaje (ProtectedRoute ya se encargó de redirigir)
  if (!user) {
    return null;
  }

  // Definir módulos dinámicamente basados en accessibleModules y roles
  const getModulesForUser = () => {
    const baseModules = [
      { name: 'Mi Perfil', icon: '👤', path: '/dashboard/profile', color: 'bg-gray-100 hover:bg-gray-200', module: 'DASHBOARD' },
    ];

    const availableModules = [
      // Módulo EMPLEADOS
      { name: 'Mi Equipo', icon: '👥', path: '/rh/empleados', color: 'bg-blue-100 hover:bg-blue-200', module: 'EMPLEADOS' },
      { name: 'Organización', icon: '🏢', path: '/dashboard/organizacion', color: 'bg-blue-50 hover:bg-blue-150', module: 'EMPLEADOS', roles: ['ADMIN'] },
      
      // Módulo RECLUTAMIENTO - Acceso general para todos con el módulo
      { name: 'Mis Vacantes', icon: '📝', path: '/reclutamiento/mis-solicitudes', color: 'bg-green-100 hover:bg-green-200', module: 'RECLUTAMIENTO' },
      { name: 'Solicitar Vacante', icon: '➕', path: '/reclutamiento/solicitar-vacante', color: 'bg-green-50 hover:bg-green-150', module: 'RECLUTAMIENTO' },
      
      // Módulo RECLUTAMIENTO - Solo para RH/ADMIN
      { name: 'RH - Reclutamiento', icon: '📋', path: '/rh/reclutamiento', color: 'bg-green-200 hover:bg-green-300', module: 'RECLUTAMIENTO', roles: ['ADMIN', 'RH'] },
      { name: 'Crear Vacante HR', icon: '📄', path: '/rh/reclutamiento/crear-vacante', color: 'bg-green-300 hover:bg-green-400', module: 'RECLUTAMIENTO', roles: ['ADMIN', 'RH'] },
      { name: 'Dashboard Completo', icon: '📊', path: '/rh/dashboard-completo', color: 'bg-green-400 hover:bg-green-500', module: 'RECLUTAMIENTO', roles: ['ADMIN', 'RH'] },
      
      // Módulo COMPRAS
      { name: 'Mis Compras', icon: '🛒', path: '/compras/mis-solicitudes', color: 'bg-yellow-100 hover:bg-yellow-200', module: 'COMPRAS' },
      { name: 'Nueva Solicitud', icon: '➕', path: '/compras/nueva-solicitud', color: 'bg-yellow-50 hover:bg-yellow-150', module: 'COMPRAS' },
      { name: 'Gestión Global de Compras', icon: '📊', path: '/dashboard/compras', color: 'bg-yellow-200 hover:bg-yellow-300', module: 'COMPRAS', roles: ['ADMIN', 'COMPRAS'] },
      
      // Módulo REPORTES
      { name: 'Reportes', icon: '📈', path: '/dashboard/reports', color: 'bg-purple-100 hover:bg-purple-200', module: 'REPORTES' },
      
      // Módulo CONFIGURACION
      { name: 'Configuración', icon: '⚙️', path: '/dashboard/settings', color: 'bg-gray-200 hover:bg-gray-300', module: 'CONFIGURACION' },
      { name: 'Gestión de Accesos', icon: '🔐', path: '/dashboard/accesos', color: 'bg-gray-300 hover:bg-gray-400', module: 'CONFIGURACION', roles: ['ADMIN'] },
    ];

    // Filtrar módulos basados en accessibleModules y roles del usuario
    const filteredModules = availableModules.filter(module => {
      // Dashboard siempre está disponible
      if (module.module === 'DASHBOARD') return true
      
      // Verificar si el usuario tiene acceso al módulo
      const hasModuleAccess = user?.accessibleModules?.includes(module.module)
      
      // Si el módulo requiere roles específicos, verificar también el rol
      if (module.roles) {
        return hasModuleAccess && module.roles.includes(user?.role)
      }
      
      // Si no requiere roles específicos, solo verificar acceso al módulo
      return hasModuleAccess
    });

    // Combinar módulos base con filtrados
    return [...baseModules, ...filteredModules];
  };

  const modules = getModulesForUser();

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        {/* Header minimalista */}
        <div className="text-center py-12 px-4">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6">
            {user.name?.charAt(0) || 'U'}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{user.name || 'Usuario'}</h1>
          <div className="flex items-center justify-center space-x-3 mb-8">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
              {getRoleName(user.role)}
            </span>
            <span className="text-gray-600 text-sm">{user.email}</span>
          </div>
          <p className="text-gray-600 max-w-md mx-auto">
            Bienvenido al ERP KRAM. Selecciona un módulo para comenzar.
          </p>
        </div>

        {/* Grid de módulos tipo Linktree */}
        <div className="max-w-4xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <Link
                key={index}
                href={module.path}
                className={`${module.color} rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200`}
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">{module.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{module.name}</h3>
                  <p className="text-gray-600 text-sm">Haz clic para acceder</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Información adicional */}
          <div className="mt-12 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">📋 Información del Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Módulos Disponibles</h4>
                  <ul className="text-gray-600 space-y-1">
                    {modules.map((module, index) => (
                      <li key={index} className="flex items-center">
                        <span className="mr-2">{module.icon}</span>
                        {module.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tu Rol</h4>
                  <p className="text-gray-600 mb-4">
                    Tienes acceso a módulos específicos según tu rol de <strong>{getRoleName(user.role)}</strong>.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p>ID: {user.id?.substring(0, 12)}...</p>
                    <p>Último acceso: Hoy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardPageContent />
    </ProtectedRoute>
  );
}