const AuthUtils = require('../utils/auth.utils');
const SSEMiddleware = require('./sse.middleware');

/**
 * Middleware para control de acceso (Nivel A y Nivel C).
 * 
 * Responsabilidades:
 * - requireModule: Verifica acceso a módulos (Nivel A). ADMIN/RH bypass automático.
 * - requireRole: Verifica rol del usuario (Nivel C: operaciones críticas).
 * - Helpers semánticos: requireAdmin, requireRHOrAdmin, etc.
 */
class PermissionMiddleware {
  /**
   * Middleware to check if user has required role (Nivel C)
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

  static requireAdmin() {
    return PermissionMiddleware.requireRole(['ADMIN']);
  }

  static requireRHOrAdmin() {
    return (req, res, next) => {
      try {
        return PermissionMiddleware.requireRole(['ADMIN', 'RH'])(req, res, next);
      } catch (error) {
        console.error('Error en requireRHOrAdmin:', error);
        return res.status(500).json({ error: 'Error interno en middleware de autenticación' });
      }
    };
  }

  static requireSistemasOrAdmin() {
    return PermissionMiddleware.requireRole(['ADMIN', 'SISTEMAS']);
  }

  static requireComprasOrAdmin() {
    return PermissionMiddleware.requireRole(['ADMIN', 'COMPRAS']);
  }

  static requireProduccionOrAdmin() {
    return PermissionMiddleware.requireRole(['ADMIN', 'PRODUCCION']);
  }

  /**
   * Middleware to check if user has access to a specific module (Nivel A)
   * @param {string} moduleName - Name of the required module
   */
  static requireModule(moduleName) {
    return (req, res, next) => {
      if (!req.user) {
        return SSEMiddleware._sendSSEAwareError(req, res, 401, 'error', {
          error: 'Authentication required',
          message: 'Debe iniciar sesión para acceder a este recurso'
        });
      }

      // ADMIN y RH tienen bypass total en acceso a módulos
      if (req.user.role === 'ADMIN' || req.user.role === 'RH') {
        return next();
      }

      if (!req.user.accessibleModules || !req.user.accessibleModules.includes(moduleName)) {
        const moduleNames = {
          'EMPLEADOS': 'Empleados',
          'RECLUTAMIENTO': 'Reclutamiento',
          'VACACIONES': 'Vacaciones',
          'INCIDENCIAS': 'Incidencias',
          'CONFIGURACION': 'Configuración',
          'REPORTES': 'Reportes',
          'DASHBOARD': 'Dashboard',
          'COMPRAS': 'Compras'
        };

        const moduleDisplayName = moduleNames[moduleName] || moduleName;
        
        return SSEMiddleware._sendSSEAwareError(req, res, 403, 'error', {
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

module.exports = PermissionMiddleware;