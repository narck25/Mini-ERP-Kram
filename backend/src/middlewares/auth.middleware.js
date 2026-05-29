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

      // Find user in database with accessible modules and employee info
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

      // Attach user to request with employee info
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

  /**
   * Middleware to check if user has required role
   * @param {string[]} allowedRoles - Array of allowed roles
   */
  static requireRole(allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Debe iniciar sesión para acceder a este recurso'
        });
      }

      if (!AuthUtils.hasRole(req.user.role, allowedRoles)) {
        const roleNames = {
          'ADMIN': 'Administrador',
          'RH': 'Recursos Humanos',
          'SISTEMAS': 'Jefe de Sistemas',
          'COMPRAS': 'Jefe de Compras',
          'PRODUCCION': 'Jefe de Producción'
        };
        
        const userRoleName = roleNames[req.user.role] || req.user.role;
        const requiredRolesNames = allowedRoles.map(role => roleNames[role] || role).join(', ');
        
        return res.status(403).json({ 
          error: 'Acceso denegado',
          message: `Su rol (${userRoleName}) no tiene permisos para acceder a esta función.`,
          details: `Roles permitidos: ${requiredRolesNames}`,
          userRole: req.user.role,
          requiredRoles: allowedRoles
        });
      }

      next();
    };
  }

  /**
   * Middleware to check if user is admin
   */
  static requireAdmin() {
    return AuthMiddleware.requireRole(['ADMIN']);
  }

  /**
   * Middleware to check if user is RH or Admin
   */
  static requireRHOrAdmin() {
    return (req, res, next) => {
      try {
        return AuthMiddleware.requireRole(['ADMIN', 'RH'])(req, res, next);
      } catch (error) {
        console.error('Error en requireRHOrAdmin:', error);
        return res.status(500).json({ error: 'Error interno en middleware de autenticación' });
      }
    };
  }

  /**
   * Middleware to check if user is Sistemas or Admin
   */
  static requireSistemasOrAdmin() {
    return AuthMiddleware.requireRole(['ADMIN', 'SISTEMAS']);
  }

  /**
   * Middleware to check if user is Compras or Admin
   */
  static requireComprasOrAdmin() {
    return AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']);
  }

  /**
   * Middleware to check if user is Produccion or Admin
   */
  static requireProduccionOrAdmin() {
    return AuthMiddleware.requireRole(['ADMIN', 'PRODUCCION']);
  }

  /**
   * Middleware to check if user has access to a specific module
   * @param {string} moduleName - Name of the required module
   */
  static requireModule(moduleName) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Debe iniciar sesión para acceder a este recurso'
        });
      }

      // Check if user has the required module
      if (!req.user.accessibleModules || !req.user.accessibleModules.includes(moduleName)) {
        const moduleNames = {
          'EMPLEADOS': 'Empleados',
          'RECLUTAMIENTO': 'Reclutamiento',
          'VACACIONES': 'Vacaciones',
          'INCIDENCIAS': 'Incidencias',
          'CONFIGURACION': 'Configuración',
          'REPORTES': 'Reportes',
          'DASHBOARD': 'Dashboard'
        };
        
        const moduleDisplayName = moduleNames[moduleName] || moduleName;
        
        return res.status(403).json({ 
          error: 'Acceso denegado',
          message: `No tiene acceso al módulo de ${moduleDisplayName}.`,
          details: `Contacte al administrador o al departamento de RH para solicitar acceso.`,
          requiredModule: moduleName,
          userModules: req.user.accessibleModules || []
        });
      }

      next();
    };
  }
}

module.exports = AuthMiddleware;