/**
 * Purchases Module Tests
 * Rutas reales: /api/purchase-orders, /api/purchases
 */
const { request, getToken } = require('./helpers/setup');

describe('🛒 Módulo Compras', () => {
  let token = null;

  beforeAll(async () => {
    token = await getToken();
  });

  describe('Solicitudes de Compra', () => {
    test('GET /api/purchase-orders - lista solicitudes', async () => {
      const res = await request('GET', '/api/purchase-orders', null, token);
      expect(res.status).toBe(200);
    });

    test('GET /api/purchases - lista compras (alternativo)', async () => {
      const res = await request('GET', '/api/purchases', null, token);
      expect(res.status).toBe(200);
    });
  });

  describe('Seguridad', () => {
    test('GET /api/purchase-orders sin token (401)', async () => {
      const res = await request('GET', '/api/purchase-orders');
      expect(res.status).toBe(401);
    });
  });
});
