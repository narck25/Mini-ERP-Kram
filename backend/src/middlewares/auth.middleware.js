const { PrismaClient } = require('@prisma/client');
const AuthUtils = require('../utils/auth.utils');
const PermissionMiddleware = require('./permission.middleware');
const SSEMiddleware = require('./sse.middleware');

const prisma = new PrismaClient();

/**
 * Middleware de autenticación — solo verifyToken.
 * 
 * Los métodos de autorización (requireRole, requireModule, etc.) están delegados
 * a permission.middleware.js y sse.middleware.js.
 * 
 * Se mantienen re-exports para compatibilidad hacia atrás con todas las rutas existentes
 * que importan AuthMiddleware desde este archivo.
 */
class AuthMiddleware {
  /** ─── Autenticación ─── */
  
  static async verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      let token = AuthUtils.extractToken(authHeader);
      
      // Fallback: query param para EventSource/SSE
      if (!token && req.query && req.query.token) {
        token = req.query.token;
      }

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = AuthUtils.verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          accessibleModules: true,
          employee: {
            select: {
              id: true,
              nombre: true,
              puestoId: true,
              departamento_id: true,
              nivelJerarquico: true
            }
          }
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: 'User account is deactivated' });
      }

      req.user = {
        ...user,
        employeeId: user.employee?.id || null,
        employeeNombre: user.employee?.nombre || null,
        employeePuesto: user.employee?.puestoId || null,
        employeeDepartamentoId: user.employee?.departamento_id || null,
        employeeNivelJerarquico: user.employee?.nivelJerarquico || null
      };
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }

  /** ─── Re-exports para compatibilidad hacia atrás ─── */

  static requireRole(...args) {
    return PermissionMiddleware.requireRole(...args);
  }

  static requireAdmin() {
    return PermissionMiddleware.requireAdmin();
  }

  static requireRHOrAdmin() {
    return PermissionMiddleware.requireRHOrAdmin();
  }

  static requireSistemasOrAdmin() {
    return PermissionMiddleware.requireSistemasOrAdmin();
  }

  static requireComprasOrAdmin() {
    return PermissionMiddleware.requireComprasOrAdmin();
  }

  static requireProduccionOrAdmin() {
    return PermissionMiddleware.requireProduccionOrAdmin();
  }

  static requireModule(...args) {
    return PermissionMiddleware.requireModule(...args);
  }

  static verifyTokenFromQuery(...args) {
    return SSEMiddleware.verifyTokenFromQuery(...args);
  }

  static _sendSSEAwareError(...args) {
    return SSEMiddleware._sendSSEAwareError(...args);
  }
}

module.exports = AuthMiddleware;