/**
 * ticket-attachment.service.js
 * ─────────────────────────────────────────────────────────────
 * Guarda los registros TicketAttachment tras subir archivo(s) vía
 * UploadMiddleware.uploadTicketAttachments (ver ticket.routes.js).
 * ─────────────────────────────────────────────────────────────
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ticketService = require('./ticket.service');
const ticketAudit = require('./ticket-audit.service');

const addAttachments = async (ticketId, files, user, req) => {
  if (!files || files.length === 0) {
    const err = new Error('No se recibió ningún archivo');
    err.status = 400;
    throw err;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { solicitante: { select: { userId: true } } },
  });
  if (!ticket) {
    const err = new Error('Ticket no encontrado');
    err.status = 404;
    throw err;
  }

  const isOwner = ticket.solicitante.userId === user.id;
  if (!isOwner && !ticketService.canManage(user)) {
    const err = new Error('No tienes permisos para adjuntar archivos a este ticket');
    err.status = 403;
    throw err;
  }

  const created = await Promise.all(
    files.map((file) =>
      prisma.ticketAttachment.create({
        data: {
          ticketId,
          url: `/uploads/ticket-attachments/${file.filename}`,
          nombreArchivo: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          uploadedById: user.id,
        },
      })
    )
  );

  await ticketAudit
    .logWithReq(ticketId, user.id, ticketAudit.ACCIONES.ADJUNTO_SUBIDO, null, { archivos: created.map((a) => a.nombreArchivo) }, req)
    .catch((err) => console.error('Error registrando auditoría de tickets:', err.message));

  return created;
};

module.exports = { addAttachments };
