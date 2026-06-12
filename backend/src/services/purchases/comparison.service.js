/**
 * comparison.service.js
 * ─────────────────────────────────────────────────────────────
 * REFACTORIZADO: Lógica de comparativa de cotizaciones.
 * Responsabilidad: Obtener comparativa de cotizaciones con
 *                  estadísticas (ranking, diferencias, ahorro).
 * ─────────────────────────────────────────────────────────────
 * Antes estaba en: purchase.controller.js (método getQuoteComparison)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { _helpers } = require('./purchase.service');
const { buildFileUrl } = _helpers;

// ─────────────────────────────────────────────────────────────
// 1. Obtener comparativa de cotizaciones
// ─────────────────────────────────────────────────────────────
exports.getQuoteComparison = async (req) => {
  const { id } = req.params;

  const request = await prisma.purchaseRequest.findUnique({
    where: { id },
    include: {
      items: true,
      quotes: { orderBy: { monto: 'asc' } },
      solicitante: { select: { nombre: true } },
      departamento: { select: { nombre: true } }
    }
  });

  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  if (request.quotes.length === 0) {
    return null;
  }

  // Calcular estadísticas de comparativa
  const quotes = request.quotes.map((q, index) => ({
    ...q,
    archivoUrl: buildFileUrl(req, q.archivoUrl),
    rank: index + 1,
    esMejorOpcion: index === 0,
    diferenciaVsMejor: index === 0 ? 0 : q.monto - request.quotes[0].monto,
    diferenciaPorcentual: index === 0 ? 0 :
      ((q.monto - request.quotes[0].monto) / request.quotes[0].monto * 100).toFixed(2)
  }));

  const totalCotizaciones = quotes.length;
  const montoMinimo = request.quotes[0].monto;
  const montoMaximo = request.quotes[request.quotes.length - 1].monto;
  const montoPromedio = request.quotes.reduce((sum, q) => sum + q.monto, 0) / totalCotizaciones;
  const ahorroPotencial = totalCotizaciones > 1 ? montoMaximo - montoMinimo : 0;

  return {
    request: {
      id: request.id,
      folio: request.folio,
      estatus: request.estatus,
      justificacion: request.justificacion,
      solicitante: request.solicitante?.nombre || 'N/A',
      departamento: request.departamento?.nombre || 'N/A',
      items: request.items
    },
    quotes,
    resumen: {
      totalCotizaciones,
      montoMinimo,
      montoMaximo,
      montoPromedio: Math.round(montoPromedio * 100) / 100,
      ahorroPotencial: Math.round(ahorroPotencial * 100) / 100,
      requiereAutorizacion: montoMinimo > 50000
    }
  };
};
