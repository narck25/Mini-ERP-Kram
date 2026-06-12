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

  return {
    sent: sentCount,
    failed: failedCount,
    total: approverEmails.length
  };
};
