/**
 * notification-center.service.js
 * ─────────────────────────────────────────────────────────────
 * Escritura y lectura del centro de notificaciones en la app (la
 * "campanita"). Se llama en paralelo a cada correo que ya se manda
 * (ver tabla de puntos conectados en el plan) — nunca lo reemplaza.
 * ─────────────────────────────────────────────────────────────
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const notify = async ({ userId, tipo, titulo, mensaje, link = null }) => {
  if (!userId) return null;
  return prisma.userNotification.create({
    data: { userId, tipo, titulo, mensaje, link },
  });
};

// `userIds` puede traer duplicados (ej. RH + jefe coincidiendo) y al propio
// autor de la acción (ej. un comentario) — se filtran ambos casos aquí para
// que cada caller no tenga que hacerlo por separado.
const notifyMany = async ({ userIds, tipo, titulo, mensaje, link = null, excludeUserId = null }) => {
  const unicos = [...new Set((userIds || []).filter((id) => id && id !== excludeUserId))];
  if (unicos.length === 0) return { count: 0 };
  return prisma.userNotification.createMany({
    data: unicos.map((userId) => ({ userId, tipo, titulo, mensaje, link })),
  });
};

const getAll = async (userId, limit = 30) => {
  return prisma.userNotification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

const getUnreadCount = async (userId) => {
  return prisma.userNotification.count({ where: { userId, leida: false } });
};

const markAsRead = async (id, userId) => {
  const existing = await prisma.userNotification.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    const err = new Error('Notificación no encontrada');
    err.status = 404;
    throw err;
  }
  if (existing.leida) return existing;
  return prisma.userNotification.update({
    where: { id },
    data: { leida: true, leidaAt: new Date() },
  });
};

const markAllAsRead = async (userId) => {
  return prisma.userNotification.updateMany({
    where: { userId, leida: false },
    data: { leida: true, leidaAt: new Date() },
  });
};

module.exports = { notify, notifyMany, getAll, getUnreadCount, markAsRead, markAllAsRead };
