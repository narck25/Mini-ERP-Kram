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

  // Regresión: COMPRAS debe poder reabastecer inventario; alguien con el módulo COMPRAS
  // pero SIN ese rol no debe poder ver/tocar inventario ni entregas. Este bloque hubiera
  // atrapado los 2 bugs de permisos corregidos en uniform.routes.js/stationery.routes.js.
  describe('Permisos de inventario Compras/Uniformes (regresión)', () => {
    let comprasToken = null;
    let noRoleToken = null;
    const createdStationeryIds = [];
    const createdUniformIds = [];

    beforeAll(async () => {
      comprasToken = await getToken('compras@kram.mx', 'Kram2026!');
      noRoleToken = await getToken('nayely.mendez@kram.mx', '123456');
      if (!comprasToken) {
        throw new Error('No se pudo autenticar compras@kram.mx (fixture de prueba). Verifica prisma/seed.js.');
      }
      if (!noRoleToken) {
        throw new Error('No se pudo autenticar nayely.mendez@kram.mx (fixture de prueba). Verifica prisma/seed.js.');
      }
    });

    afterAll(async () => {
      for (const id of createdStationeryIds) {
        await request('DELETE', `/api/stationery/inventory/${id}`, null, token);
      }
      for (const id of createdUniformIds) {
        await request('DELETE', `/api/uniforms/inventory/${id}`, null, token);
      }
    });

    test('COMPRAS puede reabastecer inventario de papelería (200)', async () => {
      const creado = await request('POST', '/api/stationery/inventory', {
        producto: '[TEST-AUTO] Papel carta', cantidadActual: 5, cantidadMinima: 1
      }, token);
      expect(creado.status).toBe(201);
      createdStationeryIds.push(creado.body.data.id);

      const res = await request('POST', `/api/stationery/inventory/${creado.body.data.id}/restock`, { cantidad: 3 }, comprasToken);
      expect(res.status).toBe(200);
    });

    test('COMPRAS puede reabastecer inventario de uniformes (200)', async () => {
      const creado = await request('POST', '/api/uniforms/inventory', {
        tipo: '[TEST-AUTO] CAMISA', talla: 'M', genero: 'UNISEX', cantidadActual: 5, cantidadMinima: 1
      }, token);
      expect(creado.status).toBe(201);
      createdUniformIds.push(creado.body.data.id);

      const res = await request('POST', `/api/uniforms/inventory/${creado.body.data.id}/restock`, { cantidad: 3 }, comprasToken);
      expect(res.status).toBe(200);
    });

    test('sin el rol COMPRAS (solo módulo): 403 en endpoints de uniformes', async () => {
      const casos = [
        ['GET', '/api/uniforms/deliveries'],
        ['GET', '/api/uniforms/deliveries/no-existe'],
        ['GET', '/api/uniforms/employees'],
        ['GET', '/api/uniforms/employees/no-existe/history']
      ];
      for (const [method, path] of casos) {
        const res = await request(method, path, null, noRoleToken);
        expect(res.status).toBe(403);
      }
    });

    test('sin el rol COMPRAS (solo módulo): 403 al reabastecer inventario', async () => {
      const creado = await request('POST', '/api/stationery/inventory', {
        producto: '[TEST-AUTO] Bolígrafos', cantidadActual: 5, cantidadMinima: 1
      }, token);
      createdStationeryIds.push(creado.body.data.id);

      const res = await request('POST', `/api/stationery/inventory/${creado.body.data.id}/restock`, { cantidad: 1 }, noRoleToken);
      expect(res.status).toBe(403);
    });

    test('sin token: 401 en entregas de uniforme', async () => {
      const res = await request('GET', '/api/uniforms/deliveries');
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
