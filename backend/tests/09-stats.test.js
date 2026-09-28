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

  test('GET /api/stats/rh/dashboard incluye rotación, evaluaciones pendientes, departamentos e incidencias', async () => {
    const res = await request('GET', '/api/stats/rh/dashboard', null, token);
    expect(res.status).toBe(200);
    expect(typeof res.body.turnover.hiresThisMonth).toBe('number');
    expect(typeof res.body.turnover.dischargesThisMonth).toBe('number');
    expect(typeof res.body.pendingEvaluations.total).toBe('number');
    expect(Array.isArray(res.body.departmentDistribution)).toBe(true);
    expect(typeof res.body.disciplinaryIncidents.thisMonth).toBe('number');
    expect(Array.isArray(res.body.disciplinaryIncidents.recent)).toBe(true);
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
