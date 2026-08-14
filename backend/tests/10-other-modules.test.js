/**
 * Other Modules Tests (Papelería, Uniformes, Notificaciones)
 * Rutas reales:
 *   - /api/stationery (papelería)
 *   - /api/uniforms/inventory, /api/uniforms/deliveries (uniformes)
 *   - /api/notifications/upcoming, /api/notifications/logs (notificaciones)
 */
const { request, getToken } = require('./helpers/setup');

describe('📎 Módulos Adicionales', () => {
  let token = null;

  beforeAll(async () => {
    token = await getToken();
  });

  describe('Papelería', () => {
    test('GET /api/stationery - lista solicitudes', async () => {
      const res = await request('GET', '/api/stationery', null, token);
      expect(res.status).toBe(200);
    });

    test('GET /api/stationery sin token (401)', async () => {
      const res = await request('GET', '/api/stationery');
      expect(res.status).toBe(401);
    });
  });

  describe('Uniformes', () => {
    test('GET /api/uniforms/inventory - lista inventario', async () => {
      const res = await request('GET', '/api/uniforms/inventory', null, token);
      expect(res.status).toBe(200);
    });

    test('GET /api/uniforms/inventory sin token (401)', async () => {
      const res = await request('GET', '/api/uniforms/inventory');
      expect(res.status).toBe(401);
    });
  });

  describe('Notificaciones', () => {
    test('GET /api/notifications/upcoming - próximos eventos', async () => {
      const res = await request('GET', '/api/notifications/upcoming', null, token);
      expect(res.status).toBe(200);
    });

    test('GET /api/notifications/upcoming sin token (401)', async () => {
      const res = await request('GET', '/api/notifications/upcoming');
      expect(res.status).toBe(401);
    });
  });
});
