/**
 * Other Modules Tests (Papelería, Uniformes, Notificaciones)
 * Rutas reales: /api/stationery (papelería)
 * Uniformes y Notificaciones no tienen rutas montadas actualmente
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

  describe('Uniformes (ruta no montada - 404 esperado)', () => {
    test('GET /api/uniform-deliveries - ruta no existe (404)', async () => {
      const res = await request('GET', '/api/uniform-deliveries', null, token);
      expect(res.status).toBe(404);
    });
  });

  describe('Notificaciones (ruta no montada - 404 esperado)', () => {
    test('GET /api/notifications - ruta no existe (404)', async () => {
      const res = await request('GET', '/api/notifications', null, token);
      expect(res.status).toBe(404);
    });
  });
});
