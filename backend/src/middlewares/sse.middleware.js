const { PrismaClient } = require('@prisma/client');
const AuthUtils = require('../utils/auth.utils');

const prisma = new PrismaClient();

/**
 * Helper: Envía una respuesta de error en formato SSE si el cliente
 * espera text/event-stream, o JSON en caso contrario.
 * Esto evita que EventSource (navegador) entre en ciclo de reconexión
 * infinito al recibir un JSON en lugar de SSE.
 */
function sendSSEAwareError(req, res, statusCode, eventName, data) {
  const acceptsSSE = req.headers.accept === 'text/event-stream' ||
                     req.path.includes('/stream') ||
                     req.query.token;

  if (acceptsSSE) {
    if (res.headersSent) {
      try {
        res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
        res.end();
      } catch (e) {
        // Ignorar si ya se cerró
      }
    } else {
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
 * Middleware para autenticación via Server-Sent Events (SSE).
 * 
 * EventSource (navegador) NO soporta headers personalizados,
 * por lo que el token JWT debe pasarse como query param `token`.
 *
 * Uso: router.get('/path', SSEMiddleware.verifyTokenFromQuery, controller.handler)
 * Cliente: new EventSource('/api/path?token=JWT_TOKEN')
 */
class SSEMiddleware {
  static _sendSSEAwareError(req, res, statusCode, eventName, data) {
    return sendSSEAwareError(req, res, statusCode, eventName, data);
  }

  static async verifyTokenFromQuery(req, res, next) {
    try {
      const token = req.query.token || AuthUtils.extractToken(req.headers.authorization);

      if (!token) {
        return sendSSEAwareError(req, res, 401, 'error', {
          error: 'No token provided',
          message: 'Token de autenticación requerido'
        });
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
        return sendSSEAwareError(req, res, 401, 'error', {
          error: 'User not found',
          message: 'Usuario no encontrado'
        });
      }

      if (!user.isActive) {
        return sendSSEAwareError(req, res, 401, 'error', {
          error: 'User account is deactivated',
          message: 'La cuenta de usuario está desactivada'
        });
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
        return sendSSEAwareError(req, res, 401, 'error', {
          error: 'Invalid token',
          message: 'Token inválido'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return sendSSEAwareError(req, res, 401, 'error', {
          error: 'Token expired',
          message: 'Token expirado'
        });
      }
      console.error('Auth middleware (query) error:', error);
      return sendSSEAwareError(req, res, 500, 'error', {
        error: 'Authentication failed',
        message: 'Error de autenticación'
      });
    }
  }
}

module.exports = SSEMiddleware;