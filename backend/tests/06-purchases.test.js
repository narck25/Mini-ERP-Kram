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

  describe('Flujos de escritura (crear/cancelar/eliminar)', () => {
    let comprasToken = null;
    const createdIds = [];

    beforeAll(async () => {
      // Requiere un usuario de prueba con empleado asociado y módulo COMPRAS.
      comprasToken = await getToken('compras@kram.mx', 'Kram2026!');
      if (!comprasToken) {
        throw new Error('No se pudo autenticar compras@kram.mx (usuario de prueba con empleado). Verifica la BD de pruebas.');
      }
    });

    afterAll(async () => {
      // Limpieza de solicitudes residuales
      for (const id of createdIds) {
        await request('DELETE', `/api/purchases/${id}`, null, comprasToken);
      }
    });

    const crearSolicitud = async () => request('POST', '/api/purchases', {
      justificacion: '[TEST-AUTO] Solicitud de prueba',
      items: [{ productoServicio: 'Producto de prueba', cantidad: 1 }]
    }, comprasToken);

    test('POST /api/purchases crea una solicitud (201)', async () => {
      const res = await crearSolicitud();
      expect(res.status).toBe(201);
      expect(res.body.data.request.estatus).toBe('NUEVO');
      createdIds.push(res.body.data.request.id);
    });

    test('POST /api/purchases/:id/cancel cancela la solicitud (200)', async () => {
      const created = await crearSolicitud();
      createdIds.push(created.body.data.request.id);
      const res = await request('POST', `/api/purchases/${created.body.data.request.id}/cancel`, null, comprasToken);
      expect(res.status).toBe(200);
      expect(res.body.data.estatus).toBe('CANCELADO');
    });

    test('DELETE /api/purchases/:id elimina la solicitud (200)', async () => {
      const created = await crearSolicitud();
      const id = created.body.data.request.id;
      const res = await request('DELETE', `/api/purchases/${id}`, null, comprasToken);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('eliminada');
    });
  });
});
