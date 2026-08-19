/**
 * audit.service.js
 * ─────────────────────────────────────────────────────────────
 * Sistema de auditoría genérico y extensible.
 *
 * Responsabilidad: Registrar cambios en operaciones críticas
 *                  del sistema. Diseñado para ser reutilizado
 *                  por cualquier módulo (Compras, RH, etc.).
 *
 * Uso:
 *   const audit = require('../services/audit.service');
 *
 *   // Auditoría simple (sin req)
 *   await audit.log('request-id', 'user-id', 'CREACION', null, { estatus: 'NUEVO' });
 *
 *   // Auditoría con datos de request (ip, userAgent)
 *   await audit.logWithReq('request-id', 'user-id', 'APROBACION',
 *     { estatus: 'EN_AUTORIZACION' }, { estatus: 'APROBADO', autorizadoPor: '...' }, req);
 *
 *   // Consultar historial
 *   const historial = await audit.getHistory('request-id');
 * ─────────────────────────────────────────────────────────────
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// Constantes: acciones auditables
// ─────────────────────────────────────────────────────────────
const ACCIONES = {
  CREACION: 'CREACION',
  ACTUALIZACION: 'ACTUALIZACION',
  COTIZACION_SUBIDA: 'COTIZACION_SUBIDA',
  MONTO_EDITADO: 'MONTO_EDITADO',
  COTIZACION_SELECCIONADA: 'COTIZACION_SELECCIONADA',
  ENVIO_AUTORIZACION: 'ENVIO_AUTORIZACION',
  APROBACION: 'APROBACION',
  ENTREGA: 'ENTREGA',
  CANCELACION: 'CANCELACION',
  ORDEN_COMPRA_GENERADA: 'ORDEN_COMPRA_GENERADA',
  ORDEN_COMPRA_REGENERADA: 'ORDEN_COMPRA_REGENERADA'
};

// ─────────────────────────────────────────────────────────────
// Extraer IP y User-Agent del objeto req de Express
// ─────────────────────────────────────────────────────────────
const extractRequestMeta = (req) => {
  if (!req) return { ip: null, userAgent: null };

  const ip = req.ip ||
    req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    null;

  const userAgent = req.headers?.['user-agent'] || null;

  return { ip, userAgent };
};

// ─────────────────────────────────────────────────────────────
// 1. Registrar auditoría (función base)
// ─────────────────────────────────────────────────────────────
const log = async (requestId, userId, accion, valorAnterior = null, valorNuevo = null, req = null) => {
  const { ip, userAgent } = extractRequestMeta(req);

  return prisma.purchaseAuditLog.create({
    data: {
      requestId,
      userId,
      accion,
      valorAnterior: valorAnterior ? JSON.parse(JSON.stringify(valorAnterior)) : null,
      valorNuevo: valorNuevo ? JSON.parse(JSON.stringify(valorNuevo)) : null,
      ip,
      userAgent
    }
  });
};

// ─────────────────────────────────────────────────────────────
// 2. Registrar auditoría con objeto req (ip + userAgent automáticos)
// ─────────────────────────────────────────────────────────────
const logWithReq = async (requestId, userId, accion, valorAnterior, valorNuevo, req) => {
  return log(requestId, userId, accion, valorAnterior, valorNuevo, req);
};

// ─────────────────────────────────────────────────────────────
// 3. Obtener historial completo de una solicitud
// ─────────────────────────────────────────────────────────────
const getHistory = async (requestId) => {
  const logs = await prisma.purchaseAuditLog.findMany({
    where: { requestId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      accion: true,
      valorAnterior: true,
      valorNuevo: true,
      ip: true,
      userAgent: true,
      createdAt: true,
      userId: true
    }
  });

  // Enriquecer con nombre de usuario
  const userIds = [...new Set(logs.map(l => l.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  return logs.map(log => ({
    ...log,
    usuario: userMap.get(log.userId) || { id: log.userId, name: 'Desconocido', email: '' }
  }));
};

// ─────────────────────────────────────────────────────────────
// 4. Obtener historial con filtros (paginación)
// ─────────────────────────────────────────────────────────────
const getHistoryFiltered = async (filters = {}) => {
  const { requestId, userId, accion, startDate, endDate, limit = 50, offset = 0 } = filters;
  const where = {};

  if (requestId) where.requestId = requestId;
  if (userId) where.userId = userId;
  if (accion) where.accion = accion;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.purchaseAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.purchaseAuditLog.count({ where })
  ]);

  return { logs, total, limit, offset };
};

// ─────────────────────────────────────────────────────────────
// 5. Función helper para auditoría dentro de transacciones Prisma
// ─────────────────────────────────────────────────────────────
const logInTransaction = async (tx, requestId, userId, accion, valorAnterior, valorNuevo, req = null) => {
  const { ip, userAgent } = extractRequestMeta(req);

  return tx.purchaseAuditLog.create({
    data: {
      requestId,
      userId,
      accion,
      valorAnterior: valorAnterior ? JSON.parse(JSON.stringify(valorAnterior)) : null,
      valorNuevo: valorNuevo ? JSON.parse(JSON.stringify(valorNuevo)) : null,
      ip,
      userAgent
    }
  });
};

module.exports = {
  ACCIONES,
  log,
  logWithReq,
  getHistory,
  getHistoryFiltered,
  logInTransaction
};
