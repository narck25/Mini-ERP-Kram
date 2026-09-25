/**
 * Auditoría de RH (hrAudit) — sin cobertura automatizada previa (ver
 * PROJECT_CONTEXT.md §12.4/§7.10). Único endpoint: GET /hr-audit/employee/:id.
 * Control de acceso (hrAudit.controller.js#canViewAudit): RH/ADMIN o el jefe
 * directo del empleado — explícitamente NO el propio empleado.
 *
 * En vez de duplicar lógica de negocio, dispara una acción real ya cubierta
 * en otro módulo (registrar una incidencia disciplinaria, que ya llama a
 * hrAudit.logWithReq — ver disciplinaryIncident.service.js) y verifica que
 * quede reflejada en el historial consolidado del empleado.
 */
const { PrismaClient } = require('@prisma/client');
const { request, getToken } = require('./helpers/setup');

const prisma = new PrismaClient();

describe('🧪 Auditoría de RH — historial consolidado por empleado', () => {
  let jefeToken = null;
  let adminToken = null;
  let empleadoToken = null;
  let basicToken = null;
  let jefeUserId = null;
  let originalModules = null;
  let empleadoId = null;
  let incidentId = null;

  beforeAll(async () => {
    adminToken = await getToken();
    jefeToken = await getToken('jefe.vacaciones@kram.mx', 'Kram2026!');
    empleadoToken = await getToken('empleado.vacaciones@kram.mx', 'Kram2026!');
    basicToken = await getToken('nayely.mendez@kram.mx', '123456');

    if (!adminToken || !jefeToken || !empleadoToken || !basicToken) {
      throw new Error('No se pudo autenticar alguno de los fixtures. Verifica prisma/seed.js.');
    }

    const empleado = await prisma.employee.findFirst({ where: { user: { email: 'empleado.vacaciones@kram.mx' } } });
    if (!empleado) throw new Error('Fixture empleado.vacaciones@kram.mx sin Employee asociado.');
    empleadoId = empleado.id;

    const usersRes = await request('GET', '/api/users', null, adminToken);
    const jefeUser = (usersRes.body?.data || []).find((u) => u.email === 'jefe.vacaciones@kram.mx');
    jefeUserId = jefeUser.id;
    originalModules = jefeUser.accessibleModules || [];
    await request('PUT', `/api/users/${jefeUserId}`, { accessibleModules: [...new Set([...originalModules, 'DISCIPLINA'])] }, adminToken);

    // Genera una entrada de auditoría real para tener algo que consultar.
    const createRes = await request('POST', '/api/disciplinary-incidents', {
      empleadoId, tipo: 'RETARDO_FALTA_INJUSTIFICADA', fecha: '2026-09-05', motivo: '[TEST-AUTO] hallazgo auditoría RH'
    }, jefeToken);
    if (createRes.status !== 201) throw new Error(`No se pudo crear la incidencia de prueba (status ${createRes.status})`);
    incidentId = createRes.body.data.id;
  });

  afterAll(async () => {
    if (jefeUserId && originalModules) {
      await request('PUT', `/api/users/${jefeUserId}`, { accessibleModules: originalModules }, adminToken);
    }
    if (incidentId) await prisma.disciplinaryIncident.delete({ where: { id: incidentId } }).catch(() => {});
    await prisma.$disconnect();
  });

  test('El propio empleado NO puede ver su historial de auditoría (403)', async () => {
    const res = await request('GET', `/api/hr-audit/employee/${empleadoId}`, null, empleadoToken);
    expect(res.status).toBe(403);
  });

  test('Un usuario ajeno (ni RH/ADMIN ni jefe directo) no puede ver el historial (403)', async () => {
    const res = await request('GET', `/api/hr-audit/employee/${empleadoId}`, null, basicToken);
    expect(res.status).toBe(403);
  });

  test('El jefe directo ve el historial y contiene la incidencia registrada (200)', async () => {
    const res = await request('GET', `/api/hr-audit/employee/${empleadoId}`, null, jefeToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const entry = res.body.data.find((log) => log.entidadId === incidentId && log.entidadTipo === 'DISCIPLINARY_INCIDENT');
    expect(entry).toBeDefined();
    expect(entry.accion).toBe('CREACION');
    expect(entry.usuario).toBeDefined();
  });

  test('RH/ADMIN también ve el historial completo (200)', async () => {
    const res = await request('GET', `/api/hr-audit/employee/${empleadoId}`, null, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.some((log) => log.entidadId === incidentId)).toBe(true);
  });

  test('Sin token (401)', async () => {
    const res = await request('GET', `/api/hr-audit/employee/${empleadoId}`);
    expect(res.status).toBe(401);
  });
});
