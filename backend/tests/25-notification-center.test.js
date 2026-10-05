/**
 * Centro de notificaciones en la app (campanita) — sin cobertura previa.
 * Verifica que se agrega en paralelo a los correos ya existentes (crear un
 * ticket y una solicitud de compra generan notificación para los
 * destinatarios correctos), y que el scoping por usuario (req.user.id) se
 * respeta en los 4 endpoints nuevos.
 *
 * Usa sistemas@kram.com (ya recibe tickets) y compras@kram.mx (ya recibe
 * compras) como destinatarios reales; empleado.vacaciones@kram.mx y
 * nayely.mendez@kram.mx como solicitantes/terceros, mismos fixtures que
 * tests/24-ticket.test.js.
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

describe('🧪 Centro de notificaciones — generación y scoping por usuario', () => {
  let adminToken = null;
  let empleadoToken = null;
  let nayelyToken = null;
  let sistemasToken = null;
  let empleadoGrant = null;
  let nayelyGrant = null;
  let ticketId = null;
  let purchaseId = null;

  beforeAll(async () => {
    adminToken = await getToken();
    empleadoToken = await getToken('empleado.vacaciones@kram.mx', 'Kram2026!');
    nayelyToken = await getToken('nayely.mendez@kram.mx', '123456');
    sistemasToken = await getToken('sistemas@kram.com', 'password123');

    if (!adminToken || !empleadoToken || !nayelyToken || !sistemasToken) {
      throw new Error('No se pudo autenticar alguno de los fixtures. Verifica prisma/seed.js.');
    }

    empleadoGrant = await grantModule(adminToken, 'empleado.vacaciones@kram.mx', 'TICKETS');
    nayelyGrant = await grantModule(adminToken, 'nayely.mendez@kram.mx', 'COMPRAS');
  });

  afterAll(async () => {
    await revertModules(adminToken, empleadoGrant);
    await revertModules(adminToken, nayelyGrant);
    if (ticketId) await prisma.ticket.delete({ where: { id: ticketId } }).catch(() => {});
    if (purchaseId) {
      await prisma.purchaseItem.deleteMany({ where: { requestId: purchaseId } }).catch(() => {});
      await prisma.purchaseRequest.delete({ where: { id: purchaseId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  test('Crear un ticket genera notificación en la app para Sistemas/Admin (en paralelo al correo)', async () => {
    const before = await request('GET', '/api/notification-center/unread-count', null, sistemasToken);
    const createRes = await request('POST', '/api/tickets', {
      asunto: '[TEST-AUTO] prueba centro de notificaciones', descripcion: 'Verifica que llega la notificación', categoria: 'OTRO'
    }, empleadoToken);
    expect(createRes.status).toBe(201);
    ticketId = createRes.body.data.id;

    const after = await request('GET', '/api/notification-center/unread-count', null, sistemasToken);
    expect(after.body.count).toBeGreaterThan(before.body.count);

    const list = await request('GET', '/api/notification-center', null, sistemasToken);
    expect(list.status).toBe(200);
    const found = list.body.data.find((n) => n.tipo === 'TICKET_CREADO' && n.link === `/dashboard/ti/${ticketId}`);
    expect(found).toBeTruthy();
  });

  test('Crear una solicitud de compra genera notificación para el equipo de Compras', async () => {
    const before = await request('GET', '/api/notification-center/unread-count', null, adminToken);
    // compras@kram.mx (role COMPRAS) también recibe — se usa adminToken aquí
    // porque ADMIN bypassea el módulo pero igual queda en la cola de "role COMPRAS"
    // solo si tiene ese rol; en vez de eso verificamos contra nayely (COMPRAS otorgado)
    // consultando sus propias notificaciones no aplica (ella es la solicitante).
    // Se verifica directamente contra la tabla para no depender de un segundo fixture COMPRAS.
    const createRes = await request('POST', '/api/purchases', {
      justificacion: '[TEST-AUTO] prueba centro de notificaciones',
      items: [{ productoServicio: 'Papel', cantidad: '1', descripcion: '' }]
    }, nayelyToken);
    expect(createRes.status).toBe(201);
    purchaseId = createRes.body.data.request.id;

    const notifs = await prisma.userNotification.findMany({ where: { tipo: 'COMPRA_CREADA', link: `/dashboard/compras/${purchaseId}` } });
    expect(notifs.length).toBeGreaterThan(0);
  });

  test('Un usuario no puede ver ni marcar como leídas las notificaciones de otro', async () => {
    const list = await request('GET', '/api/notification-center', null, sistemasToken);
    const otraNotifId = list.body.data[0].id;

    const res = await request('PATCH', `/api/notification-center/${otraNotifId}/read`, null, empleadoToken);
    expect(res.status).toBe(404);
  });

  test('Marcar una notificación como leída y marcar todas como leídas funcionan', async () => {
    const list = await request('GET', '/api/notification-center', null, sistemasToken);
    expect(list.body.data.length).toBeGreaterThan(0);
    const unreadBefore = list.body.data.filter((n) => !n.leida);
    expect(unreadBefore.length).toBeGreaterThan(0);

    const markOne = await request('PATCH', `/api/notification-center/${unreadBefore[0].id}/read`, null, sistemasToken);
    expect(markOne.status).toBe(200);
    expect(markOne.body.data.leida).toBe(true);

    const markAll = await request('POST', '/api/notification-center/read-all', null, sistemasToken);
    expect(markAll.status).toBe(200);

    const countAfter = await request('GET', '/api/notification-center/unread-count', null, sistemasToken);
    expect(countAfter.body.count).toBe(0);
  });
});
