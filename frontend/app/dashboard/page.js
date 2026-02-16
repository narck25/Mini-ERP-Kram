
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'

export default async function DashboardPage() {
  const session = await getServerSession()
  
  // Si no hay sesión, redirigir al login
  if (!session) {
    redirect('/login')
  }

  const { user } = session

  const getRoleName = (role) => {
    const roles = {
      ADMIN: 'Administrador',
      RH: 'Recursos Humanos',
      SISTEMAS: 'Sistemas',
      COMPRAS: 'Compras'
    }
    return roles[role] || role
  }

  const getRoleColor = (role) => {
    const colors = {
      ADMIN: 'bg-purple-100 text-purple-800',
      RH: 'bg-blue-100 text-blue-800',
      SISTEMAS: 'bg-green-100 text-green-800',
      COMPRAS: 'bg-yellow-100 text-yellow-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Bienvenido al panel de control del ERP KRAM
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.name || 'Usuario'}</h2>
              <div className="mt-2 flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                  {getRoleName(user.role)}
                </span>
                <span className="text-gray-600">{user.email}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">ID: {user.id.substring(0, 8)}...</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-primary-600 text-2xl">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Reportes</h3>
                <p className="text-sm text-gray-500">Acceso a reportes del sistema</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-2xl">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Usuarios</h3>
                <p className="text-sm text-gray-500">Gestión de usuarios del sistema</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 text-2xl">📦</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Inventario</h3>
                <p className="text-sm text-gray-500">Control de stock y productos</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-2xl">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Finanzas</h3>
                <p className="text-sm text-gray-500">Gestión financiera y contable</p>
              </div>
            </div>
          </div>
        </div>

        {/* Role-based Content */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Funcionalidades según tu rol</h3>
          
          <div className="space-y-4">
            {user.role === 'ADMIN' && (
              <div className="p-4 bg-primary-50 rounded-lg">
                <h4 className="font-medium text-primary-800">Administrador</h4>
                <p className="text-primary-600 mt-1">
                  Tienes acceso completo a todas las funcionalidades del sistema: gestión de usuarios, 
                  configuración del sistema, reportes avanzados y auditoría.
                </p>
              </div>
            )}

            {user.role === 'RH' && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800">Recursos Humanos</h4>
                <p className="text-blue-600 mt-1">
                  Acceso a módulos de gestión de personal, nóminas, vacaciones, capacitaciones, 
                  evaluación de desempeño y <strong>reclutamiento de personal</strong>.
                </p>
                <div className="mt-3">
                  <a href="/rh-dashboard" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                    Ir al Dashboard de Reclutamiento
                  </a>
                </div>
              </div>
            )}

            {user.role === 'SISTEMAS' && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800">Sistemas</h4>
                <p className="text-green-600 mt-1">
                  Acceso a configuración del sistema, mantenimiento, backups, monitoreo, 
                  gestión de tickets de soporte y <strong>solicitud de vacantes</strong>.
                </p>
                <div className="mt-3">
                  <a href="/my-vacancies" className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                    Mis Solicitudes de Vacantes
                  </a>
                </div>
              </div>
            )}

            {user.role === 'COMPRAS' && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800">Compras</h4>
                <p className="text-yellow-600 mt-1">
                  Acceso a módulos de gestión de proveedores, órdenes de compra, inventario, 
                  cotizaciones, control de gastos y <strong>solicitud de vacantes</strong>.
                </p>
                <div className="mt-3">
                  <a href="/my-vacancies" className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm">
                    Mis Solicitudes de Vacantes
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['SISTEMAS', 'COMPRAS'].includes(user.role) && (
              <a href="/my-vacancies" className="btn-primary py-3 text-center">
                Nueva Vacante
              </a>
            )}
            {['RH', 'ADMIN'].includes(user.role) && (
              <a href="/rh-dashboard" className="btn-primary py-3 text-center">
                Dashboard RH
              </a>
            )}
            <button className="btn-secondary py-3">
              Ver Inventario
            </button>
            <button className="btn-secondary py-3">
              Calendario
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}