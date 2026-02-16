import { cookies } from 'next/headers'
import { jwtDecode } from 'jwt-decode'

export async function getServerSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return null
  }

  try {
    const decoded = jwtDecode(token)
    
    // Verificar si el token ha expirado
    const currentTime = Date.now() / 1000
    if (decoded.exp < currentTime) {
      return null
    }

    return {
      user: {
        id: decoded.userId,
        role: decoded.role,
        email: decoded.email || '',
      },
      token
    }
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

export async function requireAuth() {
  const session = await getServerSession()
  
  if (!session) {
    throw new Error('Authentication required')
  }

  return session
}

export async function requireRole(allowedRoles) {
  const session = await requireAuth()
  
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Insufficient permissions')
  }

  return session
}

export async function requireAdmin() {
  return await requireRole(['ADMIN'])
}

export async function requireRHOrAdmin() {
  return await requireRole(['RH', 'ADMIN'])
}

export async function requireSistemasOrAdmin() {
  return await requireRole(['SISTEMAS', 'ADMIN'])
}

export async function requireComprasOrAdmin() {
  return await requireRole(['COMPRAS', 'ADMIN'])
}