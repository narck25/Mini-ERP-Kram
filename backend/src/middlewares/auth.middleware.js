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
      // Intentar extraer token de headers primero, luego de query param (para SSE)
      let token = AuthUtils.extractToken(authHeader);
      
      // Fallback: si no hay token en headers, buscar en query param (para EventSource/SSE)
      if (!token && req.query && req.query.token) {
        token = req.query.token;
      }

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
   * Middleware to verify JWT token from query parameter (for SSE).
   * ─────────────────────────────────────────────────────────────
   * EventSource (navegador) NO soporta headers personalizados,
   * por lo que el token JWT debe pasarse como query param `token`.
   *
   * Uso en rutas SSE:
   *   router.get('/purchases/:id/comments/stream',
   *     AuthMiddleware.verifyTokenFromQuery,
   *     AuthMiddleware.requireModule('COMPRAS'),
   *     PurchaseCommentController.streamComments
   *   );
   *
   * El cliente se conecta con:
   *   new EventSource('/api/purchases/123/comments/stream?token=JWT_TOKEN')
   * ─────────────────────────────────────────────────────────────
   */
  /**
   * Helper: Envía una respuesta de error en formato SSE si el cliente
   * espera text/event-stream, o JSON en caso contrario.
   * Esto evita que EventSource (navegador) entre en ciclo de reconexión
   * infinito al recibir un JSON en lugar de SSE.
   * @param {Object} req - Request de Express
   * @param {Object} res - Response de Express
   * @param {number} statusCode - Código HTTP de error
   * @param {string} eventName - Nombre del evento SSE (ej. 'error')
   * @param {Object} data - Datos del error
   */
  static _sendSSEAwareError(req, res, statusCode, eventName, data) {
    const acceptsSSE = req.headers.accept === 'text/event-stream' ||
                       req.path.includes('/stream') ||
                       req.query.token;

    if (acceptsSSE) {
      // Si el cliente ya envió headers (conexión SSE iniciada), escribir evento
      if (res.headersSent) {
        try {
          res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
          res.end();
        } catch (e) {
          // Ignorar si ya se cerró
        }
      } else {
        // Si no se han enviado headers, enviar como SSE
        res.writeHead(statusCode, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'close'
        });
        res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
        res.end();
      }
    } else {
      res.status(statusCode).json(data);
    }
  }

  /**
   * Middleware to verify JWT token from query parameter (for SSE).
   * ─────────────────────────────────────────────────────────────
   * EventSource (navegador) NO soporta headers personalizados,
   * por lo que el token JWT debe pasarse como query param `token`.
   *
   * Uso en rutas SSE:
   *   router.get('/purchases/:id/comments/stream',
   *     AuthMiddleware.verifyTokenFromQuery,
   *     AuthMiddleware.requireModule('COMPRAS'),
   *     PurchaseCommentController.streamComments
   *   );
   *
   * El cliente se conecta con:
   *   new EventSource('/api/purchases/123/comments/stream?token=JWT_TOKEN')
   * ─────────────────────────────────────────────────────────────
   */
  static async verifyTokenFromQuery(req, res, next) {
    try {
      // Extraer token del query param (para SSE)
      const token = req.query.token || AuthUtils.extractToken(req.headers.authorization);

      if (!token) {

        return AuthMiddleware._sendSSEAwareError(req, res, 401, 'error', {
          error: 'No token provided',
          message: 'Token de autenticación requerido'
        });
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
        return AuthMiddleware._sendSSEAwareError(req, res, 401, 'error', {
          error: 'User not found',
          message: 'Usuario no encontrado'
        });
      }

      if (!user.isActive) {
        return AuthMiddleware._sendSSEAwareError(req, res, 401, 'error', {
          error: 'User account is deactivated',
          message: 'La cuenta de usuario está desactivada'
        });
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
        return AuthMiddleware._sendSSEAwareError(req, res, 401, 'error', {
          error: 'Invalid token',
          message: 'Token inválido'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return AuthMiddleware._sendSSEAwareError(req, res, 401, 'error', {
          error: 'Token expired',
          message: 'Token expirado'
        });
      }
      console.error('Auth middleware (query) error:', error);
      return AuthMiddleware._sendSSEAwareError(req, res, 500, 'error', {
        error: 'Authentication failed',
        message: 'Error de autenticación'
      });
    }
  }


  /**
   * Middleware to check if user has access to a specific module
   * @param {string} moduleName - Name of the required module
   */
  static requireModule(moduleName) {

    return (req, res, next) => {
      if (!req.user) {
        return AuthMiddleware._sendSSEAwareError(req, res, 401, 'error', {
          error: 'Authentication required',
          message: 'Debe iniciar sesión para acceder a este recurso'
        });
      }

      // ADMIN y RH tienen bypass total en acceso a módulos
      if (req.user.role === 'ADMIN' || req.user.role === 'RH') {
        return next();
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
          'DASHBOARD': 'Dashboard',
          'COMPRAS': 'Compras'
        };

        
        const moduleDisplayName = moduleNames[moduleName] || moduleName;
        
        return AuthMiddleware._sendSSEAwareError(req, res, 403, 'error', {
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