/**
 * Health Check Tests
 */
const { request } = require('./helpers/setup');

describe('🔍 Health Check', () => {
  test('GET /api/health debe responder OK', async () => {
    const res = await request('GET', '/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('message');
  });
});
