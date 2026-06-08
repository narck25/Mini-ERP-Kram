'use client';

import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getRoleName, getRoleColor } from '@/lib/rolesConfig';

function DashboardPageContent() {
  const { user, loading: authLoading } = useAuth();

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
      { name: 'Mi Espacio', icon: '🌟', path: '/dashboard/mi-espacio', color: 'bg-indigo-100 hover:bg-indigo-200', module: 'EMPLEADOS' },
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
        {/* Header compacto */}
        <div className="flex items-center gap-4 mb-8 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0">
            {user.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{user.name || 'Usuario'}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                {getRoleName(user.role)}
              </span>
              <span className="text-gray-500 text-xs truncate">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Grid de módulos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-8">
          {modules.map((module, index) => (
            <Link
              key={index}
              href={module.path}
              className={`${module.color} rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-gray-200 text-center`}
            >
              <div className="text-3xl mb-2">{module.icon}</div>
              <h3 className="text-sm font-semibold text-gray-900">{module.name}</h3>
              <p className="text-xs text-gray-500 mt-1">Acceder</p>
            </Link>
          ))}
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
