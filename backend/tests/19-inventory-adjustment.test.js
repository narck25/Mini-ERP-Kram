/**
 * Ajustes de inventario (papelería/uniformes) — sin cobertura automatizada
 * previa (ver PROJECT_CONTEXT.md §12.4). Flujo: cualquiera con módulo
 * COMPRAS solicita -> solo ADMIN/RH aprueba (aplica el ajuste real al
 * inventario) o rechaza.
 *
 * nayely.mendez@kram.mx tiene el módulo COMPRAS pero no el rol (mismo
 * fixture que tests/17-supplier.test.js) — sirve como solicitante no
 * privilegiado. jefe.vacaciones@kram.mx no tiene COMPRAS, sirve para el
 * 403 de Nivel A.
 */
const { PrismaClient } = require('@prisma/client');
const { request, getToken } = require('./helpers/setup');

const prisma = new PrismaClient();

describe('🧪 Ajustes de inventario — solicitud, aprobación y rechazo', () => {
  let comprasToken = null;
  let noComprasToken = null;
  let adminToken = null;
  const createdStationeryIds = [];
  const createdRequestIds = [];

  beforeAll(async () => {
    comprasToken = await getToken('nayely.mendez@kram.mx', '123456');
    noComprasToken = await getToken('jefe.vacaciones@kram.mx', 'Kram2026!');
    adminToken = await getToken();
    if (!comprasToken || !noComprasToken || !adminToken) {
      throw new Error('No se pudo autenticar alguno de los fixtures. Verifica prisma/seed.js.');
    }
  });

  afterAll(async () => {
    for (const id of createdRequestIds) {
      await prisma.inventoryAdjustmentRequest.delete({ where: { id } }).catch(() => {});
    }
    for (const id of createdStationeryIds) {
      await prisma.stationeryInventory.delete({ where: { id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  test('Sin el módulo COMPRAS no puede solicitar (403)', async () => {
    const res = await request('POST', '/api/inventory-adjustments', {
      tipo: 'PAPELERIA', accion: 'AGREGAR', motivo: '[TEST-AUTO] sin modulo',
      detalle: { producto: 'Lápiz', cantidadActual: 10 }
    }, noComprasToken);
    expect(res.status).toBe(403);
  });

  test('Valida tipo, acción y motivo (400 en cada caso)', async () => {
    const sinTipo = await request('POST', '/api/inventory-adjustments', {
      accion: 'AGREGAR', motivo: 'x', detalle: { producto: 'x' }
    }, comprasToken);
    expect(sinTipo.status).toBe(400);

    const accionInvalida = await request('POST', '/api/inventory-adjustments', {
      tipo: 'PAPELERIA', accion: 'BORRAR_TODO', motivo: 'x', detalle: { producto: 'x' }
    }, comprasToken);
    expect(accionInvalida.status).toBe(400);

    const sinMotivo = await request('POST', '/api/inventory-adjustments', {
      tipo: 'PAPELERIA', accion: 'AGREGAR', detalle: { producto: 'x' }
    }, comprasToken);
    expect(sinMotivo.status).toBe(400);
  });

  test('Un usuario no privilegiado solicita agregar un artículo de papelería (201, PENDIENTE)', async () => {
    const res = await request('POST', '/api/inventory-adjustments', {
      tipo: 'PAPELERIA', accion: 'AGREGAR', motivo: '[TEST-AUTO] alta de prueba',
      detalle: { producto: '[TEST-AUTO] Lápiz de prueba', categoria: 'OTRO', cantidadActual: 25, unidad: 'pzas' }
    }, comprasToken);
    expect(res.status).toBe(201);
    expect(res.body.data.estatus).toBe('PENDIENTE');
    createdRequestIds.push(res.body.data.id);
  });

  test('El solicitante ve su propia solicitud pero no las de los demás en la lista', async () => {
    const res = await request('GET', '/api/inventory-adjustments', null, comprasToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every((r) => r.solicitante)).toBe(true);
  });

  test('Un solicitante normal no puede aprobar (403)', async () => {
    const pending = createdRequestIds[0];
    const res = await request('POST', `/api/inventory-adjustments/${pending}/approve`, null, comprasToken);
    expect(res.status).toBe(403);
  });

  test('RH/ADMIN aprueba la solicitud: crea el artículo real en el inventario', async () => {
    const pending = createdRequestIds[0];
    const res = await request('POST', `/api/inventory-adjustments/${pending}/approve`, null, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.estatus).toBe('APROBADA');

    const item = await prisma.stationeryInventory.findFirst({ where: { producto: '[TEST-AUTO] Lápiz de prueba' } });
    expect(item).not.toBeNull();
    expect(item.cantidadActual).toBe(25);
    createdStationeryIds.push(item.id);
  });

  test('No se puede aprobar dos veces la misma solicitud (400)', async () => {
    const pending = createdRequestIds[0];
    const res = await request('POST', `/api/inventory-adjustments/${pending}/approve`, null, adminToken);
    expect(res.status).toBe(400);
  });

  test('RH/ADMIN rechaza una solicitud distinta (200, no toca el inventario)', async () => {
    const created = await request('POST', '/api/inventory-adjustments', {
      tipo: 'PAPELERIA', accion: 'AGREGAR', motivo: '[TEST-AUTO] para rechazar',
      detalle: { producto: '[TEST-AUTO] Producto a rechazar', cantidadActual: 5 }
    }, comprasToken);
    createdRequestIds.push(created.body.data.id);

    const res = await request('POST', `/api/inventory-adjustments/${created.body.data.id}/reject`, {
      comentario: '[TEST-AUTO] no se justifica'
    }, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.estatus).toBe('RECHAZADA');

    const item = await prisma.stationeryInventory.findFirst({ where: { producto: '[TEST-AUTO] Producto a rechazar' } });
    expect(item).toBeNull();
  });

  test('Solicitud inexistente al aprobar (404)', async () => {
    const res = await request('POST', '/api/inventory-adjustments/id-inexistente-99999/approve', null, adminToken);
    expect(res.status).toBe(404);
  });
});
