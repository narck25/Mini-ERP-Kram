/**
 * ticket-audit.service.js
 * ─────────────────────────────────────────────────────────────
 * Auditoría del módulo de Tickets de TI — mismo patrón que
 * audit.service.js (Compras): tabla propia por módulo, no el
 * HrAuditLog genérico (que es específico de RH).
 * ─────────────────────────────────────────────────────────────
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ACCIONES = {
  CREACION: 'CREACION',
  CAMBIO_ESTATUS: 'CAMBIO_ESTATUS',
  ASIGNACION: 'ASIGNACION',
  CANCELACION: 'CANCELACION',
  ADJUNTO_SUBIDO: 'ADJUNTO_SUBIDO',
};

const extractRequestMeta = (req) => {
  if (!req) return { ip: null, userAgent: null };
  const ip = req.ip ||
    req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    null;
  const userAgent = req.headers?.['user-agent'] || null;
  return { ip, userAgent };
};

const log = async (ticketId, userId, accion, valorAnterior = null, valorNuevo = null, req = null) => {
  const { ip, userAgent } = extractRequestMeta(req);
  return prisma.ticketAuditLog.create({
    data: {
      ticketId,
      userId,
      accion,
      valorAnterior: valorAnterior ? JSON.parse(JSON.stringify(valorAnterior)) : null,
      valorNuevo: valorNuevo ? JSON.parse(JSON.stringify(valorNuevo)) : null,
      ip,
      userAgent,
    },
  });
};

const logWithReq = async (ticketId, userId, accion, valorAnterior, valorNuevo, req) => {
  return log(ticketId, userId, accion, valorAnterior, valorNuevo, req);
};

const getHistory = async (ticketId) => {
  const logs = await prisma.ticketAuditLog.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
  });

  const userIds = [...new Set(logs.map((l) => l.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return logs.map((entry) => ({
    ...entry,
    usuario: userMap.get(entry.userId) || { id: entry.userId, name: 'Desconocido', email: '' },
  }));
};

module.exports = { ACCIONES, log, logWithReq, getHistory };
