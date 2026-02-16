'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await authApi.getProfile()
      setUser(response.data.user)
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setLoading(true)
      console.log('Attempting login with:', { email })
      const response = await authApi.login({ email, password })
      console.log('Login response:', response.data)
      
      const { user, token } = response.data
      console.log('Token received:', token ? 'Yes' : 'No')
      console.log('User received:', user)
      
      // Guardar token en localStorage (para cliente)
      localStorage.setItem('token', token)
      
      // Guardar token en cookie (para servidor)
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`
      
      setUser(user)
      
      toast.success('¡Inicio de sesión exitoso!')
      console.log('Redirecting to dashboard...')
      router.push('/dashboard')
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      const message = error.response?.data?.error || 'Error al iniciar sesión'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      const response = await authApi.register(userData)
      
      const { user, token } = response.data
      localStorage.setItem('token', token)
      setUser(user)
      
      toast.success('¡Registro exitoso!')
      router.push('/dashboard')
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Error al registrarse'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Eliminar token de localStorage
      localStorage.removeItem('token')
      
      // Eliminar cookie
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict'
      
      setUser(null)
      toast.success('Sesión cerrada correctamente')
      router.push('/')
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authApi.updateProfile(profileData)
      setUser(response.data.user)
      toast.success('Perfil actualizado correctamente')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Error al actualizar perfil'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const changePassword = async (passwordData) => {
    try {
      await authApi.changePassword(passwordData)
      toast.success('Contraseña cambiada correctamente')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Error al cambiar contraseña'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const hasRole = (requiredRoles) => {
    if (!user) return false
    return requiredRoles.includes(user.role)
  }

  const isAdmin = () => hasRole(['ADMIN'])
  const isRH = () => hasRole(['RH', 'ADMIN'])
  const isSistemas = () => hasRole(['SISTEMAS', 'ADMIN'])
  const isCompras = () => hasRole(['COMPRAS', 'ADMIN'])

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    hasRole,
    isAdmin,
    isRH,
    isSistemas,
    isCompras,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}