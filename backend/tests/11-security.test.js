/**
 * Security Tests - Modelo de 3 Niveles
 */
const { request, getToken } = require('./helpers/setup');

describe('🔒 Seguridad - Modelo de 3 Niveles', () => {
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

  // Nivel A: Control de Acceso a Módulos
  describe('Nivel A - Acceso a Módulos', () => {
    test('Endpoint protegido sin token (401)', async () => {
      const res = await request('GET', '/api/employees');
      expect(res.status).toBe(401);
    });

    test('Endpoint protegido con token ADMIN (200)', async () => {
      const res = await request('GET', '/api/employees', null, adminToken);
      expect(res.status).toBe(200);
    });
  });

  // Nivel C: Operaciones Críticas
  describe('Nivel C - Operaciones Críticas', () => {
    test('GET /api/permissions/users sin token (401)', async () => {
      const res = await request('GET', '/api/permissions/users');
      expect(res.status).toBe(401);
    });

    test('GET /api/users/stats sin token (401)', async () => {
      const res = await request('GET', '/api/users/stats');
      expect(res.status).toBe(401);
    });
  });

  // Rutas inexistentes
  describe('404 Handling', () => {
    test('Ruta inexistente (404)', async () => {
      const res = await request('GET', '/api/nonexistent', null, adminToken);
      expect(res.status).toBe(404);
    });

    test('Recurso inexistente (404)', async () => {
      const res = await request('GET', '/api/employees/id-inexistente', null, adminToken);
      expect(res.status).toBe(404);
    });
  });
});
