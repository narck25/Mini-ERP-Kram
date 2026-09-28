/**
 * Catálogo de Áreas (/api/areas) — reemplaza el campo de texto libre
 * Employee.area (fragmentaba silenciosamente por typos como "MARKETIG" o
 * variantes de mayúsculas/acentos). Mismo permiso que Departamentos/Puestos:
 * requireModule('EMPLEADOS').
 */
const { PrismaClient } = require('@prisma/client');
const { request, getToken } = require('./helpers/setup');
const prisma = new PrismaClient();

describe('🧪 Catálogo de Áreas', () => {
  let adminToken = null;
  let noEmpleadosToken = null;
  let createdId = null;

  beforeAll(async () => {
    adminToken = await getToken();
    noEmpleadosToken = await getToken('compras@kram.mx', 'Kram2026!');
    if (!adminToken || !noEmpleadosToken) {
      throw new Error('No se pudo autenticar admin/compras. Verifica prisma/seed.js.');
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterAll(async () => {
    if (createdId) {
      await request('DELETE', `/api/areas/${createdId}`, null, adminToken);
    }
  });

  test('Sin el módulo EMPLEADOS no puede listar (403)', async () => {
    const res = await request('GET', '/api/areas', null, noEmpleadosToken);
    expect(res.status).toBe(403);
  });

  test('Con el módulo EMPLEADOS puede listar (200)', async () => {
    const res = await request('GET', '/api/areas', null, adminToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.areas)).toBe(true);
  });

  test('Crea un área nueva (201)', async () => {
    const nombre = `[TEST-AUTO] Area ${Date.now()}`;
    const res = await request('POST', '/api/areas', { nombre }, adminToken);
    expect(res.status).toBe(201);
    expect(res.body.area.nombre).toBe(nombre);
    expect(res.body.area.estado).toBe('Activo');
    createdId = res.body.area.id;
  });

  test('No permite crear un área sin nombre (400)', async () => {
    const res = await request('POST', '/api/areas', { nombre: '' }, adminToken);
    expect(res.status).toBe(400);
  });

  test('No permite crear un área duplicada (400)', async () => {
    const get = await request('GET', '/api/areas', null, adminToken);
    const existente = get.body.areas[0];
    const res = await request('POST', '/api/areas', { nombre: existente.nombre }, adminToken);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ya existe/i);
  });

  test('Actualiza el nombre y estado de un área (200)', async () => {
    const nuevoNombre = `[TEST-AUTO] Renombrada ${Date.now()}`;
    const res = await request('PUT', `/api/areas/${createdId}`, { nombre: nuevoNombre, estado: 'Inactivo' }, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.area.nombre).toBe(nuevoNombre);
    expect(res.body.area.estado).toBe('Inactivo');
  });

  test('No se puede eliminar un área en uso por al menos un empleado (400)', async () => {
    const empleado = await prisma.employee.findFirst({ select: { id: true, areaId: true } });
    if (!empleado) return; // sin empleados en este entorno, la prueba no aplica

    await prisma.employee.update({ where: { id: empleado.id }, data: { areaId: createdId } });
    try {
      const res = await request('DELETE', `/api/areas/${createdId}`, null, adminToken);
      expect(res.status).toBe(400);
    } finally {
      await prisma.employee.update({ where: { id: empleado.id }, data: { areaId: empleado.areaId } });
    }
  });

  test('Elimina un área sin empleados asignados (200)', async () => {
    const res = await request('DELETE', `/api/areas/${createdId}`, null, adminToken);
    expect(res.status).toBe(200);
    createdId = null;
  });
});
