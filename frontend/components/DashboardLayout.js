'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getRoleName } from '@/lib/rolesConfig'

// Sección 1: "Mi Portal" (Autoservicio y Equipo)
const myPortalNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠', module: 'DASHBOARD' },
  { name: 'Mi Espacio', href: '/dashboard/mi-espacio', icon: '🌟', module: 'EMPLEADOS' },
  { name: 'Mi Equipo', href: '/rh/empleados', icon: '👥', module: 'EMPLEADOS' },
  { name: 'Mis Vacantes', href: '/reclutamiento/mis-solicitudes', icon: '📝', module: 'RECLUTAMIENTO' },
  { name: 'Mis Compras', href: '/compras/mis-solicitudes', icon: '🛒', module: 'COMPRAS' },
  { name: 'Papelería', href: '/compras/papeleria', icon: '📄', module: 'COMPRAS' },
]

// Sección 2: "Administración Global" (Gestión Total)
// Nota: Se usa module para control de acceso (Nivel A) y roles como filtro adicional (Nivel C)
const adminNavigation = [
  { name: 'Dashboard RH', href: '/rh/dashboard-completo', icon: '📊', module: 'EMPLEADOS', roles: ['ADMIN', 'RH'] },
  { name: 'Reclutamiento RH', href: '/rh/reclutamiento', icon: '📋', module: 'RECLUTAMIENTO', roles: ['ADMIN', 'RH'] },
  { name: 'Crear Vacante HR', href: '/rh/reclutamiento/crear-vacante', icon: '➕', module: 'RECLUTAMIENTO', roles: ['ADMIN', 'RH'] },
  { name: 'Incidencias', href: '/rh/incidencias', icon: '⏰', module: 'INCIDENCIAS', roles: ['ADMIN', 'RH'] },
  { name: 'Uniformes (RH)', href: '/rh/uniformes', icon: '👕', module: 'COMPRAS', roles: ['ADMIN', 'RH'] },
  { name: 'Gestión de Compras', href: '/dashboard/compras', icon: '📊', module: 'COMPRAS', roles: ['ADMIN', 'COMPRAS'] },
  { name: 'Papelería (Admin)', href: '/dashboard/compras/papeleria', icon: '📄', module: 'COMPRAS', roles: ['ADMIN', 'COMPRAS'] },
  { name: 'Uniformes (Admin)', href: '/dashboard/compras/uniformes', icon: '👕', module: 'COMPRAS', roles: ['ADMIN', 'COMPRAS'] },
  { name: 'Organización', href: '/dashboard/organizacion', icon: '🏢', module: 'EMPLEADOS', roles: ['ADMIN'] },
  { name: 'Gestión de Accesos', href: '/dashboard/accesos', icon: '🔐', module: 'CONFIGURACION', roles: ['ADMIN'] },
  { name: 'Gestión de Usuarios', href: '/dashboard/usuarios', icon: '👤', module: 'CONFIGURACION', roles: ['ADMIN'] },
]

const userNavigation = [
  { name: 'Tu perfil', href: '/dashboard/profile' },
  { name: 'Configuración', href: '/dashboard/usuarios', roles: ['ADMIN'] },
]

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout, hasRole } = useAuth()
  const userMenuRef = useRef(null)

  // Cerrar menú al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  // Filtrar navegación de "Mi Portal" basada en módulos accesibles
  const filteredMyPortal = myPortalNavigation.filter(item => {
    if (item.module === 'DASHBOARD') return true
    return user?.accessibleModules?.includes(item.module)
  })

  // Filtrar navegación de "Administración Global"
  // Nivel A: Verificar acceso al módulo
  // Nivel C: Verificar rol si está especificado
  const filteredAdmin = adminNavigation.filter(item => {
    // Primero verificar acceso al módulo (Nivel A)
    const hasModuleAccess = item.module 
      ? user?.accessibleModules?.includes(item.module)
      : true
    
    if (!hasModuleAccess) return false
    
    // Luego verificar rol si está especificado (Nivel C)
    if (item.roles) {
      return item.roles.includes(user?.role)
    }
    
    return true
  })

  // Filtrar navegación del menú desplegable del usuario
  const filteredUserNav = userNavigation.filter(item => {
    if (item.roles) {
      return item.roles.includes(user?.role)
    }
    return true
  })

  return (
    <div className="min-h-screen">
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
              {/* Sección: Mi Portal */}
              {filteredMyPortal.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mi Portal
                  </div>
                  {filteredMyPortal.map((item) => {
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
                </>
              )}

              {/* Sección: Administración Global */}
              {filteredAdmin.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                    Administración Global
                  </div>
                  {filteredAdmin.map((item) => {
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
                </>
              )}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="ml-3 flex-1">
                <div className="text-base font-medium text-gray-800">{user?.name || 'Usuario'}</div>
                <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                <div className="mt-2">
                  <button
                    onClick={logout}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Cerrar sesión
                  </button>
                </div>
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
              {/* Sección: Mi Portal */}
              {filteredMyPortal.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mi Portal
                  </div>
                  {filteredMyPortal.map((item) => {
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
                </>
              )}

              {/* Sección: Administración Global */}
              {filteredAdmin.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                    Administración Global
                  </div>
                  {filteredAdmin.map((item) => {
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
                </>
              )}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="ml-3 flex-1 relative">
                <div className="text-sm font-medium text-gray-800">{user?.name || 'Usuario'}</div>
                <div className="text-xs font-medium text-gray-500">{getRoleName(user?.role)}</div>
                
                {/* Menú desplegable del usuario - SOLO PARA DESKTOP */}
                <div className="relative mt-2">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center text-sm font-medium text-gray-800 hover:text-blue-600 focus:outline-none px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-150"
                  >
                    <span className="mr-2">👤 Opciones</span>
                    <svg className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {userMenuOpen && (
                    <div ref={userMenuRef} className="absolute left-0 -mt-48 w-56 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-300 origin-bottom-left" style={{outline: '2px solid green'}}>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Opciones</div>
                      </div>
                      {filteredUserNav.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block px-4 py-3 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <div className="flex items-center">
                            {item.name === 'Tu perfil' && (
                              <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            )}
                            {item.name === 'Configuración' && (
                              <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                            {item.name}
                          </div>
                        </Link>
                      ))}
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="block w-full text-left px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors duration-150 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
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
