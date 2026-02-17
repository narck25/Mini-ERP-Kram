'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { name: 'Usuarios', href: '/dashboard/users', icon: '👥', roles: ['ADMIN'] },
  { name: 'Inventario', href: '/dashboard/inventory', icon: '📦', roles: ['ADMIN', 'COMPRAS', 'SISTEMAS'] },
  { name: 'Compras', href: '/dashboard/purchases', icon: '🛒', roles: ['ADMIN', 'COMPRAS'] },
  { name: 'Ventas', href: '/dashboard/sales', icon: '💰', roles: ['ADMIN'] },
  { name: 'RH - Dashboard', href: '/rh-dashboard', icon: '📋', roles: ['ADMIN', 'RH'] },
  { name: 'RH - Empleados', href: '/rh/empleados', icon: '👨‍💼', roles: ['ADMIN', 'RH'] },
  { name: 'RH - Reclutamiento', href: '/rh/reclutamiento', icon: '📝', roles: ['ADMIN', 'RH'] },
  { name: 'Mis Solicitudes', href: '/reclutamiento/mis-solicitudes', icon: '📋', roles: ['SISTEMAS', 'COMPRAS'] },
  { name: 'Reportes', href: '/dashboard/reports', icon: '📊', roles: ['ADMIN', 'RH', 'SISTEMAS', 'COMPRAS'] },
  { name: 'Configuración', href: '/dashboard/settings', icon: '⚙️', roles: ['ADMIN', 'SISTEMAS'] },
]

const userNavigation = [
  { name: 'Tu perfil', href: '/dashboard/profile' },
  { name: 'Configuración', href: '/dashboard/settings' },
]

export default function DashboardLayout({ children, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { logout, hasRole } = useAuth()

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true
    return hasRole(item.roles)
  })

  const getRoleName = (role) => {
    const roles = {
      ADMIN: 'Administrador',
      RH: 'Recursos Humanos',
      SISTEMAS: 'Sistemas',
      COMPRAS: 'Compras'
    }
    return roles[role] || role
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para móviles */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Cerrar sidebar</span>
              <span className="text-white text-2xl">×</span>
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">ERP KRAM</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div>
                <div className="text-base font-medium text-gray-800">{user?.name || 'Usuario'}</div>
                <div className="text-sm font-medium text-gray-500">{user?.email}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar para desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-gray-900">ERP KRAM</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="ml-3 flex-1">
                <div className="text-sm font-medium text-gray-800">{user?.name || 'Usuario'}</div>
                <div className="text-xs font-medium text-gray-500">{getRoleName(user?.role)}</div>
                <button
                  onClick={logout}
                  className="mt-2 text-sm text-danger-600 hover:text-danger-800"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Abrir sidebar</span>
            <span className="text-2xl">☰</span>
          </button>
        </div>
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}