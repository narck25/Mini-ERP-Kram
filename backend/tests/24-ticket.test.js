/**
 * Tickets de TI — sin cobertura previa (módulo nuevo). Nivel A:
 * requireModule('TICKETS') para autoservicio, requireSistemasOrAdmin() para
 * la cola de gestión. Nivel fino: dueño del ticket o Sistemas/Admin
 * (ticket.service.js#canView/canManage).
 *
 * Usa empleado.vacaciones@kram.mx como solicitante, nayely.mendez@kram.mx
 * como tercero ajeno, y sistemas@kram.com como personal de TI — ninguno
 * trae el módulo TICKETS por preset todavía (son fixtures ya existentes
 * de antes de este módulo), así que se les otorga temporalmente y se
 * revierte en afterAll, mismo patrón que tests/15-disciplinary-incident.test.js.
 */
const { PrismaClient } = require('@prisma/client');
const { request, getToken } = require('./helpers/setup');

const prisma = new PrismaClient();

async function grantModule(adminToken, email, moduleKey) {
  const usersRes = await request('GET', '/api/users', null, adminToken);
  const user = (usersRes.body?.data || []).find((u) => u.email === email);
  if (!user) throw new Error(`No se encontró el fixture ${email} en /api/users.`);
  const originalModules = user.accessibleModules || [];
  await request('PUT', `/api/users/${user.id}`, { accessibleModules: [...new Set([...originalModules, moduleKey])] }, adminToken);
  return { userId: user.id, originalModules };
}

async function revertModules(adminToken, grant) {
  if (grant?.userId) {
    await request('PUT', `/api/users/${grant.userId}`, { accessibleModules: grant.originalModules }, adminToken);
  }
}

describe('🧪 Tickets de TI — permisos y flujo de reportes/solicitudes a Sistemas', () => {
  let adminToken = null;
  let empleadoToken = null;
  let nayelyToken = null;
  let sistemasToken = null;
  let jefeTokenSinModulo = null;
  let empleadoGrant = null;
  let nayelyGrant = null;
  let sistemasGrant = null;
  let sistemasUserId = null;
  let ticketId = null;
  let ticketCancelableId = null;

  beforeAll(async () => {
    adminToken = await getToken();
    empleadoToken = await getToken('empleado.vacaciones@kram.mx', 'Kram2026!');
    nayelyToken = await getToken('nayely.mendez@kram.mx', '123456');
    sistemasToken = await getToken('sistemas@kram.com', 'password123');
    // jefe.vacaciones nunca recibe el módulo TICKETS en este archivo — se usa
    // exactamente para probar el bloqueo de Nivel A (sin él).
    jefeTokenSinModulo = await getToken('jefe.vacaciones@kram.mx', 'Kram2026!');

    if (!adminToken || !empleadoToken || !nayelyToken || !sistemasToken || !jefeTokenSinModulo) {
      throw new Error('No se pudo autenticar alguno de los fixtures (admin / empleado.vacaciones / nayely.mendez / sistemas). Verifica prisma/seed.js.');
    }

    empleadoGrant = await grantModule(adminToken, 'empleado.vacaciones@kram.mx', 'TICKETS');
    nayelyGrant = await grantModule(adminToken, 'nayely.mendez@kram.mx', 'TICKETS');
    sistemasGrant = await grantModule(adminToken, 'sistemas@kram.com', 'TICKETS');
    sistemasUserId = sistemasGrant.userId;
  });

  afterAll(async () => {
    await revertModules(adminToken, empleadoGrant);
    await revertModules(adminToken, nayelyGrant);
    await revertModules(adminToken, sistemasGrant);
    if (ticketId) await prisma.ticket.delete({ where: { id: ticketId } }).catch(() => {});
    if (ticketCancelableId) await prisma.ticket.delete({ where: { id: ticketCancelableId } }).catch(() => {});
    await prisma.$disconnect();
  });

  test('Un usuario sin el módulo TICKETS no puede crear un ticket (403, Nivel A)', async () => {
    const res = await request('POST', '/api/tickets', {
      asunto: '[TEST-AUTO] sin módulo', descripcion: 'No debería crearse', categoria: 'OTRO'
    }, jefeTokenSinModulo);
    expect(res.status).toBe(403);
  });

  test('Faltan campos requeridos (400)', async () => {
    const res = await request('POST', '/api/tickets', { categoria: 'OTRO' }, empleadoToken);
    expect(res.status).toBe(400);
  });

  test('Un empleado con el módulo crea un ticket (201, estatus ABIERTO)', async () => {
    const res = await request('POST', '/api/tickets', {
      asunto: '[TEST-AUTO] No prende el monitor', descripcion: 'Probé otro cable y sigue sin encender.', categoria: 'PROBLEMA_TECNICO', prioridad: 'ALTA'
    }, empleadoToken);
    expect(res.status).toBe(201);
    expect(res.body.data.estatus).toBe('ABIERTO');
    expect(res.body.data.folio).toEqual(expect.any(Number));
    ticketId = res.body.data.id;
  });

  test('El solicitante ve el detalle de su propio ticket (200)', async () => {
    const res = await request('GET', `/api/tickets/${ticketId}`, null, empleadoToken);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(ticketId);
  });

  test('Un empleado ajeno (con módulo, sin relación con el ticket) no puede verlo (403, Nivel fino)', async () => {
    const res = await request('GET', `/api/tickets/${ticketId}`, null, nayelyToken);
    expect(res.status).toBe(403);
  });

  test('Un empleado normal no puede listar la cola completa de TI (403, Nivel A — requireSistemasOrAdmin)', async () => {
    const res = await request('GET', '/api/tickets', null, empleadoToken);
    expect(res.status).toBe(403);
  });

  test('Sistemas ve la cola completa y encuentra el ticket (200)', async () => {
    const res = await request('GET', '/api/tickets', null, sistemasToken);
    expect(res.status).toBe(200);
    expect(res.body.data.some((t) => t.id === ticketId)).toBe(true);
  });

  test('Un empleado normal no puede cambiar el estatus de un ticket (403)', async () => {
    const res = await request('PATCH', `/api/tickets/${ticketId}/status`, { estatus: 'EN_PROCESO' }, empleadoToken);
    expect(res.status).toBe(403);
  });

  test('Sistemas se autoasigna el ticket (200) — pasa automáticamente a EN_PROCESO', async () => {
    const res = await request('PATCH', `/api/tickets/${ticketId}/assign`, { asignadoId: sistemasUserId }, sistemasToken);
    expect(res.status).toBe(200);
    expect(res.body.data.asignadoId).toBe(sistemasUserId);
    expect(res.body.data.estatus).toBe('EN_PROCESO');
  });

  test('Sistemas marca el ticket como RESUELTO (200) y registra fechaResolucion', async () => {
    const res = await request('PATCH', `/api/tickets/${ticketId}/status`, { estatus: 'RESUELTO' }, sistemasToken);
    expect(res.status).toBe(200);
    expect(res.body.data.estatus).toBe('RESUELTO');
    expect(res.body.data.fechaResolucion).toBeTruthy();
  });

  test('Comentarios: el solicitante comenta (201) y un ajeno no puede (403)', async () => {
    const own = await request('POST', `/api/tickets/${ticketId}/comments`, { mensaje: '[TEST-AUTO] gracias por la ayuda' }, empleadoToken);
    expect(own.status).toBe(201);

    const ajeno = await request('POST', `/api/tickets/${ticketId}/comments`, { mensaje: '[TEST-AUTO] no debería poder' }, nayelyToken);
    expect(ajeno.status).toBe(403);

    const list = await request('GET', `/api/tickets/${ticketId}/comments`, null, sistemasToken);
    expect(list.status).toBe(200);
    expect(list.body.comments.some((c) => c.mensaje.includes('gracias por la ayuda'))).toBe(true);
  });

  test('El solicitante puede cancelar un ticket propio mientras sigue abierto (200)', async () => {
    const createRes = await request('POST', '/api/tickets', {
      asunto: '[TEST-AUTO] solicitud a cancelar', descripcion: 'Ya no la necesito.', categoria: 'OTRO'
    }, empleadoToken);
    expect(createRes.status).toBe(201);
    ticketCancelableId = createRes.body.data.id;

    const cancelRes = await request('POST', `/api/tickets/${ticketCancelableId}/cancel`, null, empleadoToken);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.estatus).toBe('CANCELADO');
  });

  test('Un ticket ya RESUELTO no se puede cancelar (400)', async () => {
    const res = await request('POST', `/api/tickets/${ticketId}/cancel`, null, empleadoToken);
    expect(res.status).toBe(400);
  });

  test('Admin puede ver cualquier ticket sin depender del módulo ni de la cola (bypass Nivel A)', async () => {
    const res = await request('GET', `/api/tickets/${ticketId}`, null, adminToken);
    expect(res.status).toBe(200);
  });
});
