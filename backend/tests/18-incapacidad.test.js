/**
 * Incapacidades — sin cobertura automatizada previa (ver PROJECT_CONTEXT.md
 * §12.4). Nivel C puro: requireRole(['ADMIN','RH']), sin módulo ni control
 * fino adicional — ni el empleado ni su jefe pueden verlo.
 */
const { PrismaClient } = require('@prisma/client');
const { request, getToken } = require('./helpers/setup');

const prisma = new PrismaClient();

describe('🧪 Incapacidades — Nivel C (solo RH/ADMIN)', () => {
  let adminToken = null;
  let basicToken = null;
  let empleadoId = null;
  let incapacidadId = null;

  beforeAll(async () => {
    adminToken = await getToken();
    basicToken = await getToken('nayely.mendez@kram.mx', '123456');
    if (!adminToken || !basicToken) {
      throw new Error('No se pudo autenticar admin/nayely.mendez. Verifica prisma/seed.js.');
    }

    const empleado = await prisma.employee.findFirst({ where: { user: { email: 'empleado.vacaciones@kram.mx' } } });
    if (!empleado) throw new Error('Fixture empleado.vacaciones@kram.mx sin Employee asociado.');
    empleadoId = empleado.id;
  });

  afterAll(async () => {
    if (incapacidadId) await prisma.incapacidad.delete({ where: { id: incapacidadId } }).catch(() => {});
    await prisma.$disconnect();
  });

  test('Un usuario sin rol ADMIN/RH no puede crear (403)', async () => {
    const res = await request('POST', '/api/incapacidades', {
      employeeId: empleadoId, tipo: 'ENFERMEDAD_GENERAL', fechaInicio: '2026-09-01', fechaFin: '2026-09-05'
    }, basicToken);
    expect(res.status).toBe(403);
  });

  test('Faltan campos requeridos (400)', async () => {
    const res = await request('POST', '/api/incapacidades', { employeeId: empleadoId }, adminToken);
    expect(res.status).toBe(400);
  });

  test('Rechaza fechaFin anterior a fechaInicio (400)', async () => {
    const res = await request('POST', '/api/incapacidades', {
      employeeId: empleadoId, tipo: 'ENFERMEDAD_GENERAL', fechaInicio: '2026-09-10', fechaFin: '2026-09-01'
    }, adminToken);
    expect(res.status).toBe(400);
  });

  test('Rechaza un empleado inexistente (400)', async () => {
    const res = await request('POST', '/api/incapacidades', {
      employeeId: 'id-inexistente-99999', tipo: 'ENFERMEDAD_GENERAL', fechaInicio: '2026-09-01', fechaFin: '2026-09-05'
    }, adminToken);
    expect(res.status).toBe(400);
  });

  test('RH/ADMIN crea una incapacidad (201)', async () => {
    const res = await request('POST', '/api/incapacidades', {
      employeeId: empleadoId, tipo: 'ENFERMEDAD_GENERAL', fechaInicio: '2026-09-01', fechaFin: '2026-09-05', folioIncapacidad: '[TEST-AUTO] FOLIO-001'
    }, adminToken);
    expect(res.status).toBe(201);
    expect(res.body.data.estatus).toBe('ACTIVA');
    incapacidadId = res.body.data.id;
  });

  test('Un usuario ajeno no puede listar ni consultar el detalle (403)', async () => {
    const listRes = await request('GET', '/api/incapacidades', null, basicToken);
    expect(listRes.status).toBe(403);
    const getRes = await request('GET', `/api/incapacidades/${incapacidadId}`, null, basicToken);
    expect(getRes.status).toBe(403);
  });

  test('RH/ADMIN lista y consulta el detalle (200)', async () => {
    const listRes = await request('GET', '/api/incapacidades', null, adminToken);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((i) => i.id === incapacidadId)).toBe(true);

    const getRes = await request('GET', `/api/incapacidades/${incapacidadId}`, null, adminToken);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.folioIncapacidad).toBe('[TEST-AUTO] FOLIO-001');
  });

  test('Incapacidad inexistente (404)', async () => {
    const res = await request('GET', '/api/incapacidades/id-inexistente-99999', null, adminToken);
    expect(res.status).toBe(404);
  });

  test('RH/ADMIN edita la incapacidad (200)', async () => {
    const res = await request('PUT', `/api/incapacidades/${incapacidadId}`, {
      observaciones: '[TEST-AUTO] editado'
    }, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.observaciones).toBe('[TEST-AUTO] editado');
  });

  test('Reincorpora al empleado (200)', async () => {
    const res = await request('POST', `/api/incapacidades/${incapacidadId}/reincorporar`, null, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.estatus).toBe('REINCORPORADO');
  });

  test('No se puede reincorporar dos veces (400)', async () => {
    const res = await request('POST', `/api/incapacidades/${incapacidadId}/reincorporar`, null, adminToken);
    expect(res.status).toBe(400);
  });
});
