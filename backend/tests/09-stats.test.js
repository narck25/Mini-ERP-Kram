/**
 * Statistics Module Tests
 */
const { request, getToken } = require('./helpers/setup');

describe('📊 Módulo Estadísticas', () => {
  let token = null;

  beforeAll(async () => {
    token = await getToken();
  });

  test('GET /api/stats/rh/dashboard - dashboard RH', async () => {
    const res = await request('GET', '/api/stats/rh/dashboard', null, token);
    expect(res.status).toBe(200);
  });

  test('GET /api/stats/my-dashboard - dashboard personal', async () => {
    const res = await request('GET', '/api/stats/my-dashboard', null, token);
    expect(res.status).toBe(200);
  });

  test('GET /api/stats/system - estadísticas del sistema', async () => {
    const res = await request('GET', '/api/stats/system', null, token);
    expect(res.status).toBe(200);
  });

  test('GET /api/stats/system sin token (401)', async () => {
    const res = await request('GET', '/api/stats/system');
    expect(res.status).toBe(401);
  });
});
