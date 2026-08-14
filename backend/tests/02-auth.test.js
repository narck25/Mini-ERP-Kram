/**
 * Authentication Tests
 */
const { request } = require('./helpers/setup');

describe('🔐 Autenticación', () => {
  let adminToken = null;

  test('POST /api/auth/login - ADMIN exitoso', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'admin@kram.com',
      password: 'password123'
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('role', 'ADMIN');
    expect(res.body.user).toHaveProperty('accessibleModules');
    expect(Array.isArray(res.body.user.accessibleModules)).toBe(true);
    adminToken = res.body.token;
  });

  test('POST /api/auth/login - credenciales inválidas (401)', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'noexiste@test.com',
      password: 'wrong'
    });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login - usuario inactivo (401)', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'inactivo@kram.com',
      password: 'password123'
    });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me - sin token (401)', async () => {
    const res = await request('GET', '/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('Token JWT tiene estructura válida', async () => {
    if (!adminToken) return;
    // El token debe tener 3 partes separadas por puntos
    const parts = adminToken.split('.');
    expect(parts.length).toBe(3);
  });
});
