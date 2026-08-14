/**
 * Unit Tests: AuthMiddleware
 * Pruebas unitarias para el middleware de autenticación
 */
const AuthMiddleware = require('../../../src/middlewares/auth.middleware');

// Mock de AuthUtils
jest.mock('../../../src/utils/auth.utils', () => ({
  extractToken: jest.fn(),
  verifyToken: jest.fn(),
  hasRole: jest.fn()
}));

const AuthUtils = require('../../../src/utils/auth.utils');

// Mock de Prisma
const { PrismaClient } = require('@prisma/client');
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn()
    }
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

const prisma = new PrismaClient();

describe('🔒 AuthMiddleware - Pruebas Unitarias', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      query: {},
      path: '/api/test',
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  // ========== VERIFY TOKEN ==========
  describe('verifyToken', () => {
    test('debe retornar 401 si no hay token', async () => {
      AuthUtils.extractToken.mockReturnValue(null);

      await AuthMiddleware.verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    test('debe retornar 401 si el token es inválido', async () => {
      AuthUtils.extractToken.mockReturnValue('invalid-token');
      AuthUtils.verifyToken.mockImplementation(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await AuthMiddleware.verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    test('debe retornar 401 si el token expiró', async () => {
      AuthUtils.extractToken.mockReturnValue('expired-token');
      AuthUtils.verifyToken.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await AuthMiddleware.verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
    });

    test('debe retornar 401 si el usuario no existe', async () => {
      AuthUtils.extractToken.mockReturnValue('valid-token');
      AuthUtils.verifyToken.mockReturnValue({ userId: 999 });
      prisma.user.findUnique.mockResolvedValue(null);

      await AuthMiddleware.verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    test('debe retornar 401 si el usuario está inactivo', async () => {
      AuthUtils.extractToken.mockReturnValue('valid-token');
      AuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        name: 'Test',
        role: 'EMPLEADO_BASICO',
        isActive: false,
        accessibleModules: ['DASHBOARD'],
        employee: null
      });

      await AuthMiddleware.verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User account is deactivated' });
    });

    test('debe llamar next() si el token es válido', async () => {
      AuthUtils.extractToken.mockReturnValue('valid-token');
      AuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'admin@test.com',
        name: 'Admin',
        role: 'ADMIN',
        isActive: true,
        accessibleModules: ['DASHBOARD', 'EMPLEADOS'],
        employee: {
          id: 10,
          nombre: 'Admin User',
          puestoId: 1,
          departamento_id: 1,
          nivelJerarquico: 'DIRECTOR'
        }
      });

      await AuthMiddleware.verifyToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.role).toBe('ADMIN');
      expect(req.user.employeeId).toBe(10);
      expect(req.user.employeeNombre).toBe('Admin User');
      expect(req.user.employeeNivelJerarquico).toBe('DIRECTOR');
    });
  });

  // ========== REQUIRE ROLE ==========
  describe('requireRole', () => {
    test('debe retornar 401 si no hay usuario autenticado', () => {
      const middleware = AuthMiddleware.requireRole(['ADMIN']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Authentication required' })
      );
    });

    test('debe retornar 403 si el rol no está permitido', () => {
      req.user = { role: 'EMPLEADO_BASICO' };
      AuthUtils.hasRole.mockReturnValue(false);

      const middleware = AuthMiddleware.requireRole(['ADMIN', 'RH']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Acceso denegado' })
      );
    });

    test('debe llamar next() si el rol está permitido', () => {
      req.user = { role: 'ADMIN' };
      AuthUtils.hasRole.mockReturnValue(true);

      const middleware = AuthMiddleware.requireRole(['ADMIN']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ========== REQUIRE MODULE ==========
  describe('requireModule', () => {
    test('debe retornar 401 si no hay usuario autenticado', () => {
      const middleware = AuthMiddleware.requireModule('EMPLEADOS');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('ADMIN debe tener bypass (no verificar módulos)', () => {
      req.user = { role: 'ADMIN', accessibleModules: [] };
      const middleware = AuthMiddleware.requireModule('EMPLEADOS');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('RH debe tener bypass (no verificar módulos)', () => {
      req.user = { role: 'RH', accessibleModules: [] };
      const middleware = AuthMiddleware.requireModule('EMPLEADOS');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('debe retornar 403 si el usuario no tiene el módulo', () => {
      req.user = { role: 'EMPLEADO_BASICO', accessibleModules: ['DASHBOARD'] };
      const middleware = AuthMiddleware.requireModule('EMPLEADOS');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('debe llamar next() si el usuario tiene el módulo', () => {
      req.user = { role: 'EMPLEADO_BASICO', accessibleModules: ['EMPLEADOS'] };
      const middleware = AuthMiddleware.requireModule('EMPLEADOS');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ========== REQUIRE ADMIN ==========
  describe('requireAdmin', () => {
    test('debe llamar next() para ADMIN', () => {
      req.user = { role: 'ADMIN' };
      AuthUtils.hasRole.mockReturnValue(true);

      const middleware = AuthMiddleware.requireAdmin();
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('debe denegar para no ADMIN', () => {
      req.user = { role: 'EMPLEADO_BASICO' };
      AuthUtils.hasRole.mockReturnValue(false);

      const middleware = AuthMiddleware.requireAdmin();
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ========== REQUIRE RH OR ADMIN ==========
  describe('requireRHOrAdmin', () => {
    test('debe llamar next() para ADMIN', () => {
      req.user = { role: 'ADMIN' };
      AuthUtils.hasRole.mockReturnValue(true);

      const middleware = AuthMiddleware.requireRHOrAdmin();
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('debe llamar next() para RH', () => {
      req.user = { role: 'RH' };
      AuthUtils.hasRole.mockReturnValue(true);

      const middleware = AuthMiddleware.requireRHOrAdmin();
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('debe denegar para EMPLEADO_BASICO', () => {
      req.user = { role: 'EMPLEADO_BASICO' };
      AuthUtils.hasRole.mockReturnValue(false);

      const middleware = AuthMiddleware.requireRHOrAdmin();
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
