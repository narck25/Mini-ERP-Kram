/**
 * Unit Tests: AuthUtils
 * Pruebas unitarias para el servicio de autenticación (sin base de datos)
 */
const AuthUtils = require('../../../src/utils/auth.utils');

// Mock de JWT_SECRET
process.env.JWT_SECRET = 'test-secret-key-for-jwt';
process.env.JWT_EXPIRES_IN = '1h';

describe('🔐 AuthUtils - Pruebas Unitarias', () => {
  // ========== HASH PASSWORD ==========
  describe('hashPassword', () => {
    test('debe generar un hash para una contraseña', async () => {
      const hash = await AuthUtils.hashPassword('password123');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(20);
    });

    test('hashes diferentes para la misma contraseña (salt aleatorio)', async () => {
      const hash1 = await AuthUtils.hashPassword('password123');
      const hash2 = await AuthUtils.hashPassword('password123');
      expect(hash1).not.toBe(hash2);
    });
  });

  // ========== COMPARE PASSWORD ==========
  describe('comparePassword', () => {
    test('debe retornar true para contraseña correcta', async () => {
      const hash = await AuthUtils.hashPassword('password123');
      const result = await AuthUtils.comparePassword('password123', hash);
      expect(result).toBe(true);
    });

    test('debe retornar false para contraseña incorrecta', async () => {
      const hash = await AuthUtils.hashPassword('password123');
      const result = await AuthUtils.comparePassword('wrongpassword', hash);
      expect(result).toBe(false);
    });
  });

  // ========== GENERATE TOKEN ==========
  describe('generateToken', () => {
    test('debe generar un token JWT válido', () => {
      const token = AuthUtils.generateToken({ userId: 1, role: 'ADMIN' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      // JWT tiene 3 partes separadas por puntos
      expect(token.split('.')).toHaveLength(3);
    });

    test('debe incluir el payload en el token', () => {
      const token = AuthUtils.generateToken({ userId: 123, role: 'RH' });
      const decoded = AuthUtils.verifyToken(token);
      expect(decoded.userId).toBe(123);
      expect(decoded.role).toBe('RH');
    });
  });

  // ========== VERIFY TOKEN ==========
  describe('verifyToken', () => {
    test('debe verificar un token válido', () => {
      const token = AuthUtils.generateToken({ userId: 1 });
      const decoded = AuthUtils.verifyToken(token);
      expect(decoded).toHaveProperty('userId', 1);
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('debe lanzar error para token inválido', () => {
      expect(() => {
        AuthUtils.verifyToken('invalid-token');
      }).toThrow();
    });

    test('debe lanzar error para token mal formado', () => {
      expect(() => {
        AuthUtils.verifyToken('not-a-jwt');
      }).toThrow();
    });
  });

  // ========== EXTRACT TOKEN ==========
  describe('extractToken', () => {
    test('debe extraer token de header Bearer', () => {
      const token = AuthUtils.generateToken({ userId: 1 });
      const result = AuthUtils.extractToken(`Bearer ${token}`);
      expect(result).toBe(token);
    });

    test('debe retornar null si no hay header', () => {
      const result = AuthUtils.extractToken(null);
      expect(result).toBeNull();
    });

    test('debe retornar null si no es Bearer', () => {
      const result = AuthUtils.extractToken('Basic xyz123');
      expect(result).toBeNull();
    });

    test('debe retornar null si el header está vacío', () => {
      const result = AuthUtils.extractToken('');
      expect(result).toBeNull();
    });
  });

  // ========== HAS ROLE ==========
  describe('hasRole', () => {
    test('debe retornar true si el rol está en la lista', () => {
      expect(AuthUtils.hasRole('ADMIN', ['ADMIN', 'RH'])).toBe(true);
    });

    test('debe retornar false si el rol no está en la lista', () => {
      expect(AuthUtils.hasRole('EMPLEADO_BASICO', ['ADMIN', 'RH'])).toBe(false);
    });

    test('debe ser case-insensitive', () => {
      expect(AuthUtils.hasRole('admin', ['ADMIN'])).toBe(true);
      expect(AuthUtils.hasRole('ADMIN', ['admin'])).toBe(true);
    });
  });

  // ========== GENERATE SESSION TOKEN ==========
  describe('generateSessionToken', () => {
    test('debe generar un token de sesión hexadecimal', () => {
      const token = AuthUtils.generateSessionToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      // 32 bytes = 64 caracteres hex
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    test('debe generar tokens únicos', () => {
      const token1 = AuthUtils.generateSessionToken();
      const token2 = AuthUtils.generateSessionToken();
      expect(token1).not.toBe(token2);
    });
  });
});
