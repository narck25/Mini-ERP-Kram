/**
 * Incidencias Module Tests
 */
const { request, getToken } = require('./helpers/setup');

describe('⚠️ Módulo Incidencias', () => {
  let token = null;

  beforeAll(async () => {
    token = await getToken();
  });

  test('GET /api/incidencias - lista incidencias', async () => {
    const res = await request('GET', '/api/incidencias?startDate=2026-01-01&endDate=2026-12-31', null, token);
    expect(res.status).toBe(200);
  });

  test('GET /api/incidencias sin token (401)', async () => {
    const res = await request('GET', '/api/incidencias');
    expect(res.status).toBe(401);
  });
});
