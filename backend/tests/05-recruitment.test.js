/**
 * Recruitment Module Tests
 */
const { request, getToken } = require('./helpers/setup');

describe('📋 Módulo Reclutamiento', () => {
  let token = null;

  beforeAll(async () => {
    token = await getToken();
  });

  describe('Vacantes', () => {
    test('GET /api/vacancies - lista vacantes', async () => {
      const res = await request('GET', '/api/vacancies', null, token);
      expect(res.status).toBe(200);
    });

    test('GET /api/vacancies/my - vacantes del usuario', async () => {
      const res = await request('GET', '/api/vacancies/my', null, token);
      expect(res.status).toBe(200);
    });

    test('GET /api/vacancies/stats - estadísticas', async () => {
      const res = await request('GET', '/api/vacancies/stats', null, token);
      expect(res.status).toBe(200);
    });

    test('GET /api/vacancies/form-data - datos para formulario', async () => {
      const res = await request('GET', '/api/vacancies/form-data', null, token);
      expect(res.status).toBe(200);
    });
  });

  describe('Seguridad', () => {
    test('GET /api/vacancies sin token (401)', async () => {
      const res = await request('GET', '/api/vacancies');
      expect(res.status).toBe(401);
    });
  });
});
