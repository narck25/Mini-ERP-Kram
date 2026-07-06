'use client'

import { useAuth } from '@/contexts/AuthContext'

/**
 * Hook para lógica de autorización — separado de UI y estado de autenticación.
 * 
 * Responsabilidades:
 * - Verificar acceso por rol (Nivel C: operaciones críticas)
 * - Verificar acceso por módulo (Nivel A: control de acceso a módulos)
 * - Helpers semánticos (isAdmin, isRH)
 * 
 * No depende de useRouter ni de JSX — es pura lógica.
 */
export function useAuthorization() {
  const { user } = useAuth()

  /**
   * Verifica si el usuario tiene al menos uno de los roles requeridos.
   * Case-insensitive. ADMIN y RH tienen bypass implícito si se incluyen.
   */
  const hasRole = (requiredRoles) => {
    if (!user) return false
    const userRoleUpper = user.role.toUpperCase()
    return requiredRoles.some(role => role.toUpperCase() === userRoleUpper)
  }

  /**
   * Verifica si el usuario tiene acceso a un módulo específico.
   * ADMIN y RH tienen bypass automático.
   */
  const hasModule = (moduleName) => {
    if (!user) return false
    if (user.role === 'ADMIN' || user.role === 'RH') return true
    return user.accessibleModules?.includes(moduleName) ?? false
  }

  /** Helpers semánticos para operaciones de Nivel C */
  const isAdmin = () => user?.role === 'ADMIN'
  const isRH = () => ['ADMIN', 'RH'].includes(user?.role)
  const isSistemas = () => ['ADMIN', 'SISTEMAS'].includes(user?.role)
  const isCompras = () => ['ADMIN', 'COMPRAS'].includes(user?.role)
  const isProduccion = () => ['ADMIN', 'PRODUCCION'].includes(user?.role)

  return {
    hasRole,
    hasModule,
    isAdmin,
    isRH,
    isSistemas,
    isCompras,
    isProduccion
  }
}