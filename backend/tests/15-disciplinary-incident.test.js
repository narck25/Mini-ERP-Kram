/**
 * Disciplina (incidencias disciplinarias) — sin cobertura automatizada
 * previa (ver PROJECT_CONTEXT.md §12.4/§7.7). Nivel A: requireModule('DISCIPLINA').
 * Nivel fino: RH/ADMIN o el jefe directo del empleado (disciplinaryIncident.service.js#canManage).
 *
 * Usa jefe.vacaciones@kram.mx / empleado.vacaciones@kram.mx (relación real de
 * reportaA, ver tests/12-vacaciones.test.js) y nayely.mendez@kram.mx como
 * tercero ajeno. jefe.vacaciones no trae el módulo DISCIPLINA por preset, así
 * que se le otorga temporalmente (y se revierte en afterAll), mismo patrón
 * que el Hallazgo #7 de tests/11-security.test.js.
 */
const { PrismaClient } = require('@prisma/client');
const { request, getToken } = require('./helpers/setup');

const prisma = new PrismaClient();

describe('🧪 Disciplina — permisos y flujo de incidencias disciplinarias', () => {
  let jefeToken = null;
  let adminToken = null;
  let basicToken = null;
  let jefeUserId = null;
  let originalModules = null;
  let empleadoId = null;
  let incidentId = null;

  beforeAll(async () => {
    adminToken = await getToken();
    jefeToken = await getToken('jefe.vacaciones@kram.mx', 'Kram2026!');
    basicToken = await getToken('nayely.mendez@kram.mx', '123456');

    if (!adminToken || !jefeToken || !basicToken) {
      throw new Error('No se pudo autenticar alguno de los fixtures (admin / jefe.vacaciones / nayely.mendez). Verifica prisma/seed.js.');
    }

    const empleado = await prisma.employee.findFirst({ where: { user: { email: 'empleado.vacaciones@kram.mx' } } });
    if (!empleado) throw new Error('Fixture empleado.vacaciones@kram.mx sin Employee asociado.');
    empleadoId = empleado.id;

    const usersRes = await request('GET', '/api/users', null, adminToken);
    const jefeUser = (usersRes.body?.data || []).find((u) => u.email === 'jefe.vacaciones@kram.mx');
    if (!jefeUser) throw new Error('No se encontró jefe.vacaciones@kram.mx en /api/users.');
    jefeUserId = jefeUser.id;
    originalModules = jefeUser.accessibleModules || [];

    const grant = await request(
      'PUT', `/api/users/${jefeUserId}`,
      { accessibleModules: [...new Set([...originalModules, 'DISCIPLINA'])] },
      adminToken
    );
    if (grant.status !== 200) throw new Error(`No se pudo otorgar el módulo DISCIPLINA de prueba (status ${grant.status})`);
  });

  afterAll(async () => {
    if (jefeUserId && originalModules) {
      await request('PUT', `/api/users/${jefeUserId}`, { accessibleModules: originalModules }, adminToken);
    }
    if (incidentId) await prisma.disciplinaryIncident.delete({ where: { id: incidentId } }).catch(() => {});
    await prisma.$disconnect();
  });

  test('Un usuario sin el módulo DISCIPLINA no puede crear (403, Nivel A)', async () => {
    const res = await request('POST', '/api/disciplinary-incidents', {
      empleadoId, tipo: 'RETARDO_FALTA_INJUSTIFICADA', fecha: '2026-09-01', motivo: '[TEST-AUTO] intento sin módulo'
    }, basicToken);
    expect(res.status).toBe(403);
  });

  test('Faltan campos requeridos (400)', async () => {
    const res = await request('POST', '/api/disciplinary-incidents', {
      empleadoId, tipo: 'RETARDO_FALTA_INJUSTIFICADA'
      // faltan fecha y motivo
    }, jefeToken);
    expect(res.status).toBe(400);
  });

  test('El jefe directo (con módulo) registra una incidencia (201)', async () => {
    const res = await request('POST', '/api/disciplinary-incidents', {
      empleadoId, tipo: 'RETARDO_FALTA_INJUSTIFICADA', fecha: '2026-09-01', motivo: '[TEST-AUTO] retardo sin justificar'
    }, jefeToken);
    expect(res.status).toBe(201);
    expect(res.body.data.empleadoId).toBe(empleadoId);
    incidentId = res.body.data.id;
  });

  test('Un usuario ajeno (ni RH/ADMIN ni jefe directo) no puede registrar incidencias (403, Nivel fino)', async () => {
    // nayely no es jefe directo de empleado.vacaciones ni RH/ADMIN — aunque
    // tuviera el módulo, el service.canManage debe bloquearla igual. Se le
    // otorga el módulo solo para aislar esta prueba del Nivel A.
    const usersRes = await request('GET', '/api/users', null, adminToken);
    const nayelyUser = (usersRes.body?.data || []).find((u) => u.email === 'nayely.mendez@kram.mx');
    const nayelyOriginalModules = nayelyUser.accessibleModules || [];
    await request('PUT', `/api/users/${nayelyUser.id}`, { accessibleModules: [...new Set([...nayelyOriginalModules, 'DISCIPLINA'])] }, adminToken);

    const res = await request('POST', '/api/disciplinary-incidents', {
      empleadoId, tipo: 'RETARDO_FALTA_INJUSTIFICADA', fecha: '2026-09-02', motivo: '[TEST-AUTO] no debería crearse'
    }, basicToken);
    expect(res.status).toBe(403);

    await request('PUT', `/api/users/${nayelyUser.id}`, { accessibleModules: nayelyOriginalModules }, adminToken);
  });

  test('El jefe directo lista las incidencias de su subordinado (200) con resumen de últimos 6 meses', async () => {
    const res = await request('GET', `/api/disciplinary-incidents/employee/${empleadoId}`, null, jefeToken);
    expect(res.status).toBe(200);
    expect(res.body.incidents.some((i) => i.id === incidentId)).toBe(true);
    expect(res.body.resumen.ultimos6Meses).toBeGreaterThanOrEqual(1);
  });

  test('Un usuario ajeno no puede listar las incidencias (403)', async () => {
    const res = await request('GET', `/api/disciplinary-incidents/employee/${empleadoId}`, null, basicToken);
    expect(res.status).toBe(403);
  });

  test('El jefe directo edita la incidencia (200)', async () => {
    const res = await request('PUT', `/api/disciplinary-incidents/${incidentId}`, {
      motivo: '[TEST-AUTO] retardo sin justificar (editado)'
    }, jefeToken);
    expect(res.status).toBe(200);
    expect(res.body.data.motivo).toBe('[TEST-AUTO] retardo sin justificar (editado)');
  });

  test('RH/ADMIN también puede crear, listar y editar sin depender del módulo (bypass Nivel A)', async () => {
    const createRes = await request('POST', '/api/disciplinary-incidents', {
      empleadoId, tipo: 'ACTA_ADMINISTRATIVA', fecha: '2026-09-03', motivo: '[TEST-AUTO] acta administrativa RH'
    }, adminToken);
    expect(createRes.status).toBe(201);
    const adminIncidentId = createRes.body.data.id;

    const listRes = await request('GET', `/api/disciplinary-incidents/employee/${empleadoId}`, null, adminToken);
    expect(listRes.status).toBe(200);
    expect(listRes.body.incidents.some((i) => i.id === adminIncidentId)).toBe(true);

    await prisma.disciplinaryIncident.delete({ where: { id: adminIncidentId } }).catch(() => {});
  });
});
