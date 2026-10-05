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
const notificationCenter = require('../notification-center.service');

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
    const destinatarios = (await getDestinatariosCompras()).filter((d) => d.id !== autorUserId);
    const linkPath = `/dashboard/compras/${request.id}`;
    await Promise.allSettled(
      destinatarios.map((dest) => emailService.sendPurchaseCommentAdded(dest.email, dest.name, requestData, linkPath))
    );
    await notificationCenter.notifyMany({
      userIds: destinatarios.map((d) => d.id),
      tipo: 'COMPRA_COMENTARIO',
      titulo: `Nuevo comentario en la solicitud #${request.folio}`,
      mensaje: request.justificacion || '',
      link: linkPath
    });
  } else {
    const email = request.solicitante.user?.email || request.solicitante.correoElectronico;
    const userId = request.solicitante.user?.id;
    if (!userId || userId === autorUserId) return;
    const nombre = request.solicitante.user?.name || request.solicitante.nombre || 'Solicitante';
    const linkPath = `/compras/mis-solicitudes/${request.id}`;
    if (email) {
      await emailService.sendPurchaseCommentAdded(email, nombre, requestData, linkPath);
    }
    await notificationCenter.notify({
      userId,
      tipo: 'COMPRA_COMENTARIO',
      titulo: `Nuevo comentario en la solicitud #${request.folio}`,
      mensaje: request.justificacion || '',
      link: linkPath
    });
  }
};
