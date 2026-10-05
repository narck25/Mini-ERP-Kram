/**
 * ticket.service.js
 * ─────────────────────────────────────────────────────────────
 * CRUD y transiciones de estatus del módulo de Tickets de TI.
 * Autorización de grano fino (dueño vs. Sistemas/Admin) resuelta
 * aquí, no en las rutas — mismo patrón que disciplinaryIncident.service.js.
 * ─────────────────────────────────────────────────────────────
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ticketAudit = require('./ticket-audit.service');

const ESTATUS_VALIDOS = ['ABIERTO', 'EN_PROCESO', 'EN_ESPERA', 'RESUELTO', 'CERRADO', 'CANCELADO'];
const ESTATUS_CANCELABLES = ['ABIERTO', 'EN_PROCESO', 'EN_ESPERA'];

const EMPLEADO_SELECT = {
  id: true,
  nombres: true,
  nombre: true,
  apellidoPaterno: true,
  apellidoMaterno: true,
  userId: true,
  correoElectronico: true,
  correoEmpresa: true,
  departamento: { select: { nombre: true } },
  user: { select: { id: true, email: true, name: true } },
};

const TICKET_INCLUDE = {
  solicitante: { select: EMPLEADO_SELECT },
  asignado: { select: { id: true, name: true, email: true } },
  attachments: true,
  _count: { select: { comments: true } },
};

function getNombreCompleto(emp) {
  if (!emp) return '—';
  return `${emp.nombres || emp.nombre || ''} ${emp.apellidoPaterno || ''} ${emp.apellidoMaterno || ''}`.trim();
}

// Sistemas y Admin gestionan cualquier ticket; el resto solo ve/actúa sobre los propios.
const canManage = (user) => user.role === 'ADMIN' || user.role === 'SISTEMAS';

const canView = (user, ticket) => {
  if (canManage(user)) return true;
  return !!ticket?.solicitante && ticket.solicitante.userId === user.id;
};

const create = async (user, data, req) => {
  const { asunto, descripcion, categoria, prioridad } = data;

  if (!user.employeeId) {
    const err = new Error('Tu usuario no está vinculado a un expediente de empleado');
    err.status = 400;
    throw err;
  }
  if (!asunto?.trim() || !descripcion?.trim() || !categoria) {
    const err = new Error('Faltan campos requeridos: asunto, descripcion, categoria');
    err.status = 400;
    throw err;
  }

  const ticket = await prisma.ticket.create({
    data: {
      solicitanteId: user.employeeId,
      asunto: asunto.trim(),
      descripcion: descripcion.trim(),
      categoria,
      prioridad: prioridad || 'MEDIA',
    },
    include: TICKET_INCLUDE,
  });

  await ticketAudit
    .logWithReq(ticket.id, user.id, ticketAudit.ACCIONES.CREACION, null, { asunto: ticket.asunto, categoria, prioridad: ticket.prioridad }, req)
    .catch((err) => console.error('Error registrando auditoría de tickets:', err.message));

  return ticket;
};

const getMy = async (user) => {
  if (!user.employeeId) return [];
  return prisma.ticket.findMany({
    where: { solicitante: { userId: user.id } },
    include: TICKET_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
};

const getAll = async (filters = {}) => {
  const where = {};
  if (filters.estatus) where.estatus = filters.estatus;
  if (filters.categoria) where.categoria = filters.categoria;
  if (filters.prioridad) where.prioridad = filters.prioridad;

  return prisma.ticket.findMany({
    where,
    include: TICKET_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
};

const getById = async (id, user) => {
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: TICKET_INCLUDE });
  if (!ticket) {
    const err = new Error('Ticket no encontrado');
    err.status = 404;
    throw err;
  }
  if (!canView(user, ticket)) {
    const err = new Error('No tienes permisos para ver este ticket');
    err.status = 403;
    throw err;
  }
  return ticket;
};

const updateStatus = async (id, nuevoEstatus, user, req) => {
  if (!canManage(user)) {
    const err = new Error('No tienes permisos para cambiar el estatus de este ticket');
    err.status = 403;
    throw err;
  }
  if (!ESTATUS_VALIDOS.includes(nuevoEstatus)) {
    const err = new Error('Estatus inválido');
    err.status = 400;
    throw err;
  }

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Ticket no encontrado');
    err.status = 404;
    throw err;
  }

  const data = { estatus: nuevoEstatus };
  if (nuevoEstatus === 'RESUELTO' && !existing.fechaResolucion) data.fechaResolucion = new Date();
  if (nuevoEstatus === 'CERRADO' && !existing.fechaCierre) data.fechaCierre = new Date();

  const ticket = await prisma.ticket.update({ where: { id }, data, include: TICKET_INCLUDE });

  await ticketAudit
    .logWithReq(id, user.id, ticketAudit.ACCIONES.CAMBIO_ESTATUS, { estatus: existing.estatus }, { estatus: nuevoEstatus }, req)
    .catch((err) => console.error('Error registrando auditoría de tickets:', err.message));

  return ticket;
};

const assign = async (id, asignadoId, user, req) => {
  if (!canManage(user)) {
    const err = new Error('No tienes permisos para asignar este ticket');
    err.status = 403;
    throw err;
  }

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Ticket no encontrado');
    err.status = 404;
    throw err;
  }

  const data = { asignadoId: asignadoId || null };
  // Al asignar un ticket recién abierto, se asume que se empieza a atender.
  if (asignadoId && existing.estatus === 'ABIERTO') data.estatus = 'EN_PROCESO';

  const ticket = await prisma.ticket.update({ where: { id }, data, include: TICKET_INCLUDE });

  await ticketAudit
    .logWithReq(id, user.id, ticketAudit.ACCIONES.ASIGNACION, { asignadoId: existing.asignadoId }, { asignadoId: asignadoId || null }, req)
    .catch((err) => console.error('Error registrando auditoría de tickets:', err.message));

  return ticket;
};

const cancel = async (id, user, req) => {
  const existing = await prisma.ticket.findUnique({
    where: { id },
    include: { solicitante: { select: { userId: true } } },
  });
  if (!existing) {
    const err = new Error('Ticket no encontrado');
    err.status = 404;
    throw err;
  }

  const isOwner = existing.solicitante.userId === user.id;
  if (!isOwner && !canManage(user)) {
    const err = new Error('No tienes permisos para cancelar este ticket');
    err.status = 403;
    throw err;
  }
  if (!ESTATUS_CANCELABLES.includes(existing.estatus)) {
    const err = new Error('Solo se puede cancelar un ticket que sigue abierto');
    err.status = 400;
    throw err;
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: { estatus: 'CANCELADO' },
    include: TICKET_INCLUDE,
  });

  await ticketAudit
    .logWithReq(id, user.id, ticketAudit.ACCIONES.CANCELACION, { estatus: existing.estatus }, { estatus: 'CANCELADO' }, req)
    .catch((err) => console.error('Error registrando auditoría de tickets:', err.message));

  return ticket;
};

module.exports = {
  ESTATUS_VALIDOS,
  canManage,
  canView,
  create,
  getMy,
  getAll,
  getById,
  updateStatus,
  assign,
  cancel,
  getNombreCompleto,
};
