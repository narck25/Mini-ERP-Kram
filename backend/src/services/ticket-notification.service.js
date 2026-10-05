/**
 * ticket-notification.service.js
 * ─────────────────────────────────────────────────────────────
 * Resuelve destinatarios y envía los correos del módulo de Tickets
 * de TI. Mismo molde que purchase-notification.service.js: el
 * equipo de TI se resuelve por rol (SISTEMAS + ADMIN activos), no
 * por un Department, igual que Compras resuelve por role: 'COMPRAS'.
 * ─────────────────────────────────────────────────────────────
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('./email.service');

const CATEGORIA_LABELS = {
  PROBLEMA_TECNICO: 'Problema técnico',
  SOLICITUD_INFORME: 'Solicitud de informe',
  SOLICITUD_ACCESO: 'Solicitud de acceso',
  SOLICITUD_EQUIPO: 'Solicitud de equipo',
  OTRO: 'Otro',
};

const PRIORIDAD_LABELS = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta', URGENTE: 'Urgente' };

const ESTATUS_LABELS = {
  ABIERTO: 'Abierto',
  EN_PROCESO: 'En proceso',
  EN_ESPERA: 'En espera de tu respuesta',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
  CANCELADO: 'Cancelado',
};

function getNombreCompleto(emp) {
  if (!emp) return '—';
  return `${emp.nombres || emp.nombre || ''} ${emp.apellidoPaterno || ''} ${emp.apellidoMaterno || ''}`.trim();
}

async function getDestinatariosTI() {
  return prisma.user.findMany({
    where: { role: { in: ['SISTEMAS', 'ADMIN'] }, isActive: true },
    select: { id: true, email: true, name: true },
  });
}

const notifyNewTicket = async (ticket) => {
  const destinatarios = await getDestinatariosTI();
  const emailData = {
    id: ticket.id,
    folio: ticket.folio,
    asunto: ticket.asunto,
    solicitanteNombre: getNombreCompleto(ticket.solicitante),
    categoriaLabel: CATEGORIA_LABELS[ticket.categoria] || ticket.categoria,
    prioridadLabel: PRIORIDAD_LABELS[ticket.prioridad] || ticket.prioridad,
  };
  await Promise.allSettled(
    destinatarios.map((dest) => emailService.sendTicketCreated(dest.email, dest.name, emailData))
  );
};

const notifyStatusChanged = async (ticket) => {
  const email = ticket.solicitante?.user?.email;
  if (!email) return;
  const nombre = ticket.solicitante?.user?.name || getNombreCompleto(ticket.solicitante);
  const estatusLabel = ESTATUS_LABELS[ticket.estatus] || ticket.estatus;
  await emailService.sendTicketStatusChanged(email, nombre, { id: ticket.id, folio: ticket.folio, asunto: ticket.asunto }, estatusLabel);
};

// Avisa a "la otra parte" de un comentario nuevo: si comentó el solicitante,
// avisa a TI (asignado si existe, si no a todo el equipo); si comentó
// alguien de TI, avisa al solicitante. Nunca notifica al propio autor.
const notifyNewComment = async (ticket, autorUserId) => {
  const esAutorSolicitante = ticket.solicitante?.user?.id === autorUserId;

  if (esAutorSolicitante) {
    const destinatarios = ticket.asignado ? [ticket.asignado] : await getDestinatariosTI();
    const linkPath = `/dashboard/ti/${ticket.id}`;
    await Promise.allSettled(
      destinatarios
        .filter((d) => d.id !== autorUserId)
        .map((dest) => emailService.sendTicketCommentAdded(dest.email, dest.name, { id: ticket.id, folio: ticket.folio, asunto: ticket.asunto }, linkPath))
    );
  } else {
    const email = ticket.solicitante?.user?.email;
    if (!email || ticket.solicitante.user.id === autorUserId) return;
    const nombre = ticket.solicitante?.user?.name || getNombreCompleto(ticket.solicitante);
    const linkPath = `/ti/mis-tickets/${ticket.id}`;
    await emailService.sendTicketCommentAdded(email, nombre, { id: ticket.id, folio: ticket.folio, asunto: ticket.asunto }, linkPath);
  }
};

module.exports = {
  CATEGORIA_LABELS,
  PRIORIDAD_LABELS,
  ESTATUS_LABELS,
  notifyNewTicket,
  notifyStatusChanged,
  notifyNewComment,
};
