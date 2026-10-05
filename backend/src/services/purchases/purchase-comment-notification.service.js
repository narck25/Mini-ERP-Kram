/**
 * purchase-comment-notification.service.js
 * ─────────────────────────────────────────────────────────────
 * Notifica por correo cuando se agrega un comentario a una solicitud
 * de compra — mismo criterio que ticket-notification.service.js
 * (notifyNewComment): avisa a "la otra parte", nunca al propio autor.
 * Si comenta el solicitante, avisa al equipo de Compras (role COMPRAS,
 * mismo destinatario que notifyComprasNewRequest); si comenta Compras,
 * avisa al solicitante.
 * ─────────────────────────────────────────────────────────────
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('../email.service');

async function getDestinatariosCompras() {
  return prisma.user.findMany({
    where: { role: 'COMPRAS', isActive: true },
    select: { id: true, email: true, name: true }
  });
}

exports.notifyNewComment = async (requestId, autorUserId) => {
  const request = await prisma.purchaseRequest.findUnique({
    where: { id: requestId },
    include: {
      solicitante: {
        select: {
          nombre: true,
          correoElectronico: true,
          user: { select: { id: true, email: true, name: true } }
        }
      }
    }
  });
  if (!request) return;

  const requestData = { id: request.id, folio: request.folio };
  const esAutorSolicitante = request.solicitante.user?.id === autorUserId;

  if (esAutorSolicitante) {
    const destinatarios = await getDestinatariosCompras();
    await Promise.allSettled(
      destinatarios
        .filter((d) => d.id !== autorUserId)
        .map((dest) => emailService.sendPurchaseCommentAdded(dest.email, dest.name, requestData, `/dashboard/compras/${request.id}`))
    );
  } else {
    const email = request.solicitante.user?.email || request.solicitante.correoElectronico;
    if (!email || request.solicitante.user?.id === autorUserId) return;
    const nombre = request.solicitante.user?.name || request.solicitante.nombre || 'Solicitante';
    await emailService.sendPurchaseCommentAdded(email, nombre, requestData, `/compras/mis-solicitudes/${request.id}`);
  }
};
