/**
 * purchase-notification.service.js
 * ─────────────────────────────────────────────────────────────
 * REFACTORIZADO: Lógica de notificaciones para compras.
 * Responsabilidad: Enviar autorización a aprobadores por email.
 * ─────────────────────────────────────────────────────────────
 * Antes estaba en: purchase.controller.js (método sendAuthorization
 *   - lógica de envío de correos)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificationCenter = require('../notification-center.service');

// ─────────────────────────────────────────────────────────────
// 0. Notificar a Compras que se creó/envió una nueva solicitud
// ─────────────────────────────────────────────────────────────
exports.notifyComprasNewRequest = async (requestId) => {
  const request = await prisma.purchaseRequest.findUnique({
    where: { id: requestId },
    include: {
      solicitante: { select: { nombre: true } },
      departamento: { select: { nombre: true } }
    }
  });

  if (!request) return;

  const destinatarios = await prisma.user.findMany({
    where: { role: 'COMPRAS', isActive: true },
    select: { id: true, email: true, name: true }
  });

  if (destinatarios.length === 0) return;

  const emailService = require('../email.service');
  await Promise.allSettled(
    destinatarios.map(u =>
      emailService.sendPurchaseRequestCreated(u.email, u.name || 'Usuario', {
        id: request.id,
        folio: request.folio,
        solicitante: request.solicitante?.nombre || 'N/A',
        departamento: request.departamento?.nombre || 'N/A',
        justificacion: request.justificacion || ''
      })
    )
  );
  await notificationCenter.notifyMany({
    userIds: destinatarios.map(u => u.id),
    tipo: 'COMPRA_CREADA',
    titulo: `Nueva solicitud de compra #${request.folio}`,
    mensaje: `${request.solicitante?.nombre || 'Alguien'} solicitó: ${request.justificacion || 'sin justificación'}`,
    link: `/dashboard/compras/${request.id}`
  });
};

// ─────────────────────────────────────────────────────────────
// 1. Enviar autorización manual a aprobadores seleccionados
// ─────────────────────────────────────────────────────────────
exports.sendAuthorization = async (requestId, approverEmails) => {
  if (!approverEmails || !Array.isArray(approverEmails) || approverEmails.length === 0) {
    throw { status: 400, error: 'Datos inválidos', message: 'Debe seleccionar al menos un aprobador' };
  }

  // Buscar la solicitud con datos necesarios para el email
  const request = await prisma.purchaseRequest.findUnique({
    where: { id: requestId },
    include: {
      quotes: { where: { isSelected: true } },
      solicitante: {
        select: {
          nombre: true,
          correoElectronico: true,
          user: { select: { email: true } }
        }
      },
      departamento: { select: { nombre: true } }
    }
  });

  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  if (request.estatus !== 'PENDIENTE' && request.estatus !== 'EN_AUTORIZACION') {
    throw { status: 400, error: 'Estado inválido', message: 'Solo se puede enviar autorización en solicitudes PENDIENTE o EN_AUTORIZACION' };
  }

  const selectedQuote = request.quotes.find(q => q.isSelected);
  if (!selectedQuote) {
    throw { status: 400, error: 'Sin cotización seleccionada', message: 'Debe seleccionar una cotización antes de enviar a autorización' };
  }

  // Cambiar estado a EN_AUTORIZACION
  await prisma.purchaseRequest.update({
    where: { id: requestId },
    data: { estatus: 'EN_AUTORIZACION' }
  });

  // Enviar correos a los aprobadores
  const emailService = require('../email.service');
  const results = await Promise.allSettled(
    approverEmails.map(email =>
      emailService.sendPurchaseAuthorizationRequired(
        email,
        email.split('@')[0] || 'Usuario',
        {
          id: request.id,
          folio: request.folio,
          solicitante: request.solicitante?.nombre || 'N/A',
          departamento: request.departamento?.nombre || 'N/A',
          justificacion: request.justificacion || ''
        },
        selectedQuote
      )

    )
  );

  const sentCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failedCount = results.filter(r => r.status === 'rejected' || !r.value).length;

  // Los aprobadores llegan como correos sueltos (elegidos en el formulario),
  // no como User ya resueltos — se buscan los que sí correspondan a una
  // cuenta real del sistema para la notificación en la app (el correo ya
  // se manda arriba a todos, tengan cuenta o no).
  const aprobadoresUsuarios = await prisma.user.findMany({
    where: { email: { in: approverEmails } },
    select: { id: true }
  });
  await notificationCenter.notifyMany({
    userIds: aprobadoresUsuarios.map(u => u.id),
    tipo: 'COMPRA_AUTORIZACION',
    titulo: `Autorización requerida — solicitud #${request.folio}`,
    mensaje: `${request.solicitante?.nombre || 'Alguien'} necesita tu autorización para una compra de $${Number(selectedQuote.monto).toLocaleString('es-MX')} MXN`,
    link: `/autorizar-compra/${request.id}`
  });

  return {
    sent: sentCount,
    failed: failedCount,
    total: approverEmails.length
  };
};
