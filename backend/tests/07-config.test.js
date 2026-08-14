/**
 * Configuration Module Tests
 */
const { request, getToken } = require('./helpers/setup');

describe('⚙️ Módulo Configuración', () => {
  let adminToken = null;
  let basicToken = null;

  beforeAll(async () => {
    adminToken = await getToken();
    // Intentar obtener token de EMPLEADO_BASICO
    const basicRes = await request('POST', '/api/auth/login', {
      email: 'nayely.mendez@kram.mx',
      password: '123456'
    });
    if (basicRes.status === 200) {
      basicToken = basicRes.body.token;
    }
  });

  describe('Usuarios', () => {
    test('GET /api/users - ADMIN puede listar usuarios', async () => {
      const res = await request('GET', '/api/users', null, adminToken);
      expect(res.status).toBe(200);
      const data = res.body.data || res.body.users || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(1);
    });

    test('GET /api/users - sin token (401)', async () => {
      const res = await request('GET', '/api/users');
      expect(res.status).toBe(401);
    });
  });

  describe('Permisos', () => {
    test('GET /api/permissions/users - ADMIN puede ver permisos', async () => {
      const res = await request('GET', '/api/permissions/users', null, adminToken);
      expect(res.status).toBe(200);
    });

    test('GET /api/permissions/modules - módulos de permisos', async () => {
      const res = await request('GET', '/api/permissions/modules', null, adminToken);
      expect(res.status).toBe(200);
    });

    test('GET /api/permissions/me - permisos del usuario actual', async () => {
      const res = await request('GET', '/api/permissions/me', null, adminToken);
      expect(res.status).toBe(200);
    });
  });

  describe('Seguridad (Nivel C)', () => {
    test('GET /api/permissions/users sin token (401)', async () => {
      const res = await request('GET', '/api/permissions/users');
      expect(res.status).toBe(401);
    });

    test('GET /api/users/stats sin token (401)', async () => {
      const res = await request('GET', '/api/users/stats');
      expect(res.status).toBe(401);
    });
  });
});
