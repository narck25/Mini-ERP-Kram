const { PrismaClient } = require('@prisma/client');
const AuthUtils = require('../utils/auth.utils');

const prisma = new PrismaClient();

class AuthMiddleware {
  /**
   * Middleware to verify JWT token
   */
  static async verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      const token = AuthUtils.extractToken(authHeader);

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      // Verify JWT token
      const decoded = AuthUtils.verifyToken(token);

      // Find user in database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: 'User account is deactivated' });
      }

      // Attach user to request
      req.user = user;
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

  /**
   * Middleware to check if user has required role
   * @param {string[]} allowedRoles - Array of allowed roles
   */
  static requireRole(allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!AuthUtils.hasRole(req.user.role, allowedRoles)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          requiredRoles: allowedRoles,
          userRole: req.user.role
        });
      }

      next();
    };
  }

  /**
   * Middleware to check if user is admin
   */
  static requireAdmin(req, res, next) {
    return AuthMiddleware.requireRole(['ADMIN'])(req, res, next);
  }

  /**
   * Middleware to check if user is RH or Admin
   */
  static requireRHOrAdmin(req, res, next) {
    return AuthMiddleware.requireRole(['ADMIN', 'RH'])(req, res, next);
  }

  /**
   * Middleware to check if user is Sistemas or Admin
   */
  static requireSistemasOrAdmin(req, res, next) {
    return AuthMiddleware.requireRole(['ADMIN', 'SISTEMAS'])(req, res, next);
  }

  /**
   * Middleware to check if user is Compras or Admin
   */
  static requireComprasOrAdmin(req, res, next) {
    return AuthMiddleware.requireRole(['ADMIN', 'COMPRAS'])(req, res, next);
  }
}

module.exports = AuthMiddleware;