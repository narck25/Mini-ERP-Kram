/**
 * Proveedores (Compras) — sin cobertura automatizada previa (ver
 * PROJECT_CONTEXT.md §12.4). Nivel A: requireModule('COMPRAS'). Sin control
 * fino adicional (no hay concepto de "dueño" de un proveedor).
 *
 * nayely.mendez@kram.mx tiene el módulo COMPRAS pero no el rol (fixture ya
 * usado en tests/11-security.test.js) — sirve para probar el camino
 * "con módulo, sin ser del área". jefe.vacaciones@kram.mx no trae COMPRAS,
 * sirve para el 403 de Nivel A.
 */
const { PrismaClient } = require('@prisma/client');
const { request, getToken } = require('./helpers/setup');

const prisma = new PrismaClient();

describe('🧪 Proveedores — alta, edición y detección de duplicados', () => {
  let comprasToken = null;
  let noComprasToken = null;
  const createdIds = [];

  beforeAll(async () => {
    comprasToken = await getToken('nayely.mendez@kram.mx', '123456');
    noComprasToken = await getToken('jefe.vacaciones@kram.mx', 'Kram2026!');
    if (!comprasToken || !noComprasToken) {
      throw new Error('No se pudo autenticar alguno de los fixtures (nayely.mendez / jefe.vacaciones). Verifica prisma/seed.js.');
    }
  });

  afterAll(async () => {
    for (const id of createdIds) {
      await prisma.supplier.delete({ where: { id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  test('Sin token (401)', async () => {
    const res = await request('GET', '/api/suppliers');
    expect(res.status).toBe(401);
  });

  test('Sin el módulo COMPRAS (403)', async () => {
    const res = await request('POST', '/api/suppliers', { nombre: '[TEST-AUTO] Proveedor Sin Modulo' }, noComprasToken);
    expect(res.status).toBe(403);
  });

  test('El nombre es obligatorio (400)', async () => {
    const res = await request('POST', '/api/suppliers', { rfc: 'XXX010101AAA' }, comprasToken);
    expect(res.status).toBe(400);
  });

  test('Crea un proveedor nuevo (201)', async () => {
    const res = await request('POST', '/api/suppliers', {
      nombre: `[TEST-AUTO] Proveedor González ${Date.now()}`,
      rfc: 'GON010101AAA',
      contacto: 'Juan González',
      telefono: '5555555555',
      email: 'contacto@proveedorgonzalez.test'
    }, comprasToken);
    expect(res.status).toBe(201);
    expect(res.body.data.activo).toBe(true);
    createdIds.push(res.body.data.id);
  });

  test('Rechaza un duplicado exacto del nombre (400)', async () => {
    const nombre = `[TEST-AUTO] Proveedor Duplicado ${Date.now()}`;
    const first = await request('POST', '/api/suppliers', { nombre }, comprasToken);
    expect(first.status).toBe(201);
    createdIds.push(first.body.data.id);

    const second = await request('POST', '/api/suppliers', { nombre }, comprasToken);
    expect(second.status).toBe(400);
  });

  test('Detecta duplicados ignorando mayúsculas y acentos', async () => {
    const base = `Distribuidora ${Date.now()}`;
    const first = await request('POST', '/api/suppliers', { nombre: `${base} González` }, comprasToken);
    expect(first.status).toBe(201);
    createdIds.push(first.body.data.id);

    // Mismo nombre sin acento y en minúsculas: debe detectarse como el mismo proveedor.
    const second = await request('POST', '/api/suppliers', { nombre: `${base} gonzalez` }, comprasToken);
    expect(second.status).toBe(400);
  });

  test('Lista proveedores y respeta el filtro ?activo=', async () => {
    const nombre = `[TEST-AUTO] Proveedor Para Desactivar ${Date.now()}`;
    const created = await request('POST', '/api/suppliers', { nombre }, comprasToken);
    createdIds.push(created.body.data.id);

    await request('PUT', `/api/suppliers/${created.body.data.id}`, { activo: false }, comprasToken);

    const activos = await request('GET', '/api/suppliers?activo=true', null, comprasToken);
    expect(activos.status).toBe(200);
    expect(activos.body.data.some((s) => s.id === created.body.data.id)).toBe(false);

    const inactivos = await request('GET', '/api/suppliers?activo=false', null, comprasToken);
    expect(inactivos.status).toBe(200);
    expect(inactivos.body.data.some((s) => s.id === created.body.data.id)).toBe(true);
  });

  test('Edita un proveedor existente sin cambiar el nombre (200)', async () => {
    const created = await request('POST', '/api/suppliers', { nombre: `[TEST-AUTO] Editable ${Date.now()}` }, comprasToken);
    createdIds.push(created.body.data.id);

    const res = await request('PUT', `/api/suppliers/${created.body.data.id}`, { telefono: '5511112222' }, comprasToken);
    expect(res.status).toBe(200);
    expect(res.body.data.telefono).toBe('5511112222');
  });

  test('Renombrar a un nombre ya usado por otro proveedor se rechaza (400)', async () => {
    const nombreExistente = `[TEST-AUTO] Nombre Ocupado ${Date.now()}`;
    const existente = await request('POST', '/api/suppliers', { nombre: nombreExistente }, comprasToken);
    createdIds.push(existente.body.data.id);

    const otro = await request('POST', '/api/suppliers', { nombre: `[TEST-AUTO] Otro Proveedor ${Date.now()}` }, comprasToken);
    createdIds.push(otro.body.data.id);

    const res = await request('PUT', `/api/suppliers/${otro.body.data.id}`, { nombre: nombreExistente }, comprasToken);
    expect(res.status).toBe(400);
  });

  test('Proveedor inexistente al editar (404)', async () => {
    const res = await request('PUT', '/api/suppliers/id-inexistente-99999', { nombre: 'x' }, comprasToken);
    expect(res.status).toBe(404);
  });
});
