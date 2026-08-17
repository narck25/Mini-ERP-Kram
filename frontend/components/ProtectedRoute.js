'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useAuthorization } from '@/hooks/useAuthorization'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Componente para proteger rutas basadas en módulos accesibles.
 * Delega la lógica de autorización al hook useAuthorization().
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido a renderizar si el usuario tiene acceso
 * @param {string} props.requiredModule - Nombre del módulo requerido (Nivel A)
 * @param {string[]} props.allowedRoles - [DEPRECADO] Usar requiredModule en su lugar. Solo para Nivel C.
 * @param {boolean} props.requireAuth - Si es true, requiere autenticación (por defecto: true)
 * @param {string} props.redirectTo - Ruta a la que redirigir si no tiene acceso (por defecto: '/')
 * @param {React.ReactNode} props.loadingComponent - Componente a mostrar mientras se verifica autenticación
 * @param {React.ReactNode} props.unauthorizedComponent - Componente a mostrar si no tiene permisos
 */
export default function ProtectedRoute({
  children,
  allowedRoles = [],
  requiredModule = null,
  requireAuth = true,
  redirectTo = '/',
  forbiddenRedirectTo = '/403',
  loadingComponent = null,
  unauthorizedComponent = null
}) {
  const { user, loading, authChecked } = useAuth()
  const { hasRole, hasModule } = useAuthorization()
  const router = useRouter()

  useEffect(() => {
    if (!authChecked || loading) return

    if (requireAuth && !user) {
      router.push(redirectTo)
      return
    }

    // Nivel C: verificación por rol (solo para operaciones críticas)
    if (user && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
      if (unauthorizedComponent) return
      router.push(forbiddenRedirectTo)
      return
    }

    // Nivel A: verificación por módulo (método principal de control de acceso)
    if (user && requiredModule && !hasModule(requiredModule)) {
      if (unauthorizedComponent) return
      router.push(forbiddenRedirectTo)
    }
  }, [user, loading, authChecked, allowedRoles, requiredModule, requireAuth, redirectTo, forbiddenRedirectTo, hasRole, hasModule, router, unauthorizedComponent])

  if (loading || !authChecked) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!requireAuth) return <>{children}</>
  if (!user) return null

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return unauthorizedComponent ? <>{unauthorizedComponent}</> : null
  }

  if (requiredModule && !hasModule(requiredModule)) {
    return unauthorizedComponent ? <>{unauthorizedComponent}</> : null
  }

  return <>{children}</>
}

// ─── Componentes de ayuda (wrappers delgados) ───

export function UnauthorizedMessage({ message = 'Acceso denegado', details = '' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-6a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{message}</h2>
        {details && <p className="text-gray-600 mb-6">{details}</p>}
        <p className="text-gray-500">No tienes los permisos necesarios para acceder a esta sección.</p>
        <button
          onClick={() => window.history.back()}
          className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
        >
          Volver atrás
        </button>
      </div>
    </div>
  )
}

/**
 * Wrapper para rutas de RH (Nivel C).
 * @deprecated Preferir requiredModule sobre allowedRoles para Nivel A.
 */
export function RHProtectedRoute({ children, ...props }) {
  return (
    <ProtectedRoute allowedRoles={['RH', 'ADMIN']} unauthorizedComponent={<UnauthorizedMessage message="Acceso restringido a RH" />} {...props}>
      {children}
    </ProtectedRoute>
  )
}

/**
 * Wrapper para rutas de Sistemas (Nivel C).
 * @deprecated Preferir requiredModule sobre allowedRoles para Nivel A.
 */
export function SistemasProtectedRoute({ children, ...props }) {
  return (
    <ProtectedRoute allowedRoles={['SISTEMAS', 'ADMIN']} unauthorizedComponent={<UnauthorizedMessage message="Acceso restringido a Sistemas" />} {...props}>
      {children}
    </ProtectedRoute>
  )
}

/**
 * Wrapper para rutas de Compras (Nivel C).
 * @deprecated Preferir requiredModule='COMPRAS' para Nivel A.
 */
export function ComprasProtectedRoute({ children, ...props }) {
  return (
    <ProtectedRoute allowedRoles={['COMPRAS', 'ADMIN']} unauthorizedComponent={<UnauthorizedMessage message="Acceso restringido a Compras" />} {...props}>
      {children}
    </ProtectedRoute>
  )
}

/**
 * Wrapper para rutas de Producción (Nivel C).
 * @deprecated Preferir requiredModule sobre allowedRoles para Nivel A.
 */
export function ProduccionProtectedRoute({ children, ...props }) {
  return (
    <ProtectedRoute allowedRoles={['PRODUCCION', 'ADMIN']} unauthorizedComponent={<UnauthorizedMessage message="Acceso restringido a Producción" />} {...props}>
      {children}
    </ProtectedRoute>
  )
}

/**
 * Wrapper para rutas de Admin (Nivel C).
 */
export function AdminProtectedRoute({ children, ...props }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']} unauthorizedComponent={<UnauthorizedMessage message="Acceso restringido a Administradores" />} {...props}>
      {children}
    </ProtectedRoute>
  )
}