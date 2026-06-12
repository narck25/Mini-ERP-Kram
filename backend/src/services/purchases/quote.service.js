/**
 * quote.service.js
 * ─────────────────────────────────────────────────────────────
 * REFACTORIZADO: Lógica de negocio para cotizaciones.
 * Responsabilidad: Subir cotizaciones (batch e individual),
 *                  seleccionar cotización, subir cotización con archivo.
 * ─────────────────────────────────────────────────────────────
 * Antes estaba en: purchase.controller.js (métodos uploadQuotes,
 *   selectQuote, uploadQuoteWithFile)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { _helpers } = require('./purchase.service');
const { buildFileUrl, getEmployeeByUserId } = _helpers;

const UMBRAL_AUTORIZACION = 50000;

// ─────────────────────────────────────────────────────────────
// 1. Subir cotizaciones en batch (hasta 3)
// ─────────────────────────────────────────────────────────────
exports.uploadQuotes = async (req) => {
  const { id } = req.params;
  const { quotes } = req.body;

  // Validar solicitud
  const request = await prisma.purchaseRequest.findUnique({ where: { id } });
  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  if (request.estatus !== 'NUEVO') {
    throw { status: 400, error: 'Estado inválido', message: 'Solo se pueden subir cotizaciones a solicitudes en estado NUEVO' };
  }

  if (!quotes || !Array.isArray(quotes) || quotes.length === 0 || quotes.length > 3) {
    throw { status: 400, error: 'Datos inválidos', message: 'Debe proporcionar entre 1 y 3 cotizaciones' };
  }

  for (const quote of quotes) {
    if (!quote.proveedor || !quote.monto) {
      throw { status: 400, error: 'Datos inválidos', message: 'Cada cotización debe tener proveedor y monto' };
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingQuotes = await tx.purchaseQuote.findMany({
      where: { requestId: id }
    });

    const purchaseQuotes = await Promise.all(
      quotes.map(quote =>
        tx.purchaseQuote.create({
          data: {
            requestId: id,
            proveedor: quote.proveedor,
            monto: parseFloat(quote.monto),
            archivoUrl: quote.archivoUrl || null,
            fechaCotizacion: new Date(),
            isSelected: false
          }
        })
      )
    );

    const updatedRequest = await tx.purchaseRequest.update({
      where: { id },
      data: { estatus: 'PENDIENTE' }
    });

    return { request: updatedRequest, quotes: purchaseQuotes };
  });

  return {
    request: result.request,
    quotes: result.quotes.map(quote => ({
      ...quote,
      archivoUrl: buildFileUrl(req, quote.archivoUrl)
    }))
  };
};

// ─────────────────────────────────────────────────────────────
// 2. Seleccionar una cotización
// ─────────────────────────────────────────────────────────────
exports.selectQuote = async (req) => {
  const { id } = req.params;
  const { quoteId, comentarios, fechaEstimadaEntrega } = req.body;
  const userId = req.user.id;

  const employee = await getEmployeeByUserId(userId);
  if (!employee) {
    throw { status: 404, error: 'Empleado no encontrado', message: 'El usuario no tiene un empleado asociado' };
  }

  const request = await prisma.purchaseRequest.findUnique({
    where: { id },
    include: {
      quotes: true,
      solicitante: {
        select: {
          id: true,
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

  if (request.estatus !== 'PENDIENTE') {
    throw { status: 400, error: 'Estado inválido', message: 'Solo se puede seleccionar una cotización en solicitudes PENDIENTE' };
  }

  const selectedQuote = request.quotes.find(q => q.id === quoteId);
  if (!selectedQuote) {
    throw { status: 404, error: 'Cotización no encontrada', message: 'La cotización especificada no existe para esta solicitud' };
  }

  const monto = selectedQuote.monto;
  const requiereAutorizacion = monto > UMBRAL_AUTORIZACION;

  const result = await prisma.$transaction(async (tx) => {
    await tx.purchaseQuote.updateMany({
      where: { requestId: id },
      data: { isSelected: false }
    });

    const updatedQuote = await tx.purchaseQuote.update({
      where: { id: quoteId },
      data: {
        isSelected: true,
        comentarios: comentarios || null,
        fechaEstimadaEntrega: fechaEstimadaEntrega ? new Date(fechaEstimadaEntrega) : null
      }
    });

    const updatedRequest = await tx.purchaseRequest.update({
      where: { id },
      data: {
        estatus: requiereAutorizacion ? 'PENDIENTE' : 'APROBADO',
        requiereAutorizacion
      }
    });

    return { request: updatedRequest, quote: updatedQuote };
  });

  return {
    ...result,
    requiereAutorizacion
  };
};

// ─────────────────────────────────────────────────────────────
// 3. Subir cotización con archivo en una sola llamada
// ─────────────────────────────────────────────────────────────
exports.uploadQuoteWithFile = async (req) => {
  const { id } = req.params;
  const { proveedor, monto, archivoUrl: bodyArchivoUrl } = req.body;

  const request = await prisma.purchaseRequest.findUnique({ where: { id } });
  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  if (request.estatus !== 'NUEVO' && request.estatus !== 'PENDIENTE') {
    throw { status: 400, error: 'Estado inválido', message: 'Solo se pueden subir cotizaciones a solicitudes en estado NUEVO o PENDIENTE' };
  }

  if (!proveedor || !monto) {
    throw { status: 400, error: 'Datos inválidos', message: 'Debe proporcionar proveedor y monto' };
  }

  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    throw { status: 400, error: 'Monto inválido', message: 'El monto debe ser un número mayor a 0' };
  }

  let archivoUrl = null;
  if (req.file) {
    archivoUrl = `/uploads/purchase-quotes/${req.file.filename}`;
  } else if (bodyArchivoUrl) {
    archivoUrl = bodyArchivoUrl;
  }

  const result = await prisma.$transaction(async (tx) => {
    const purchaseQuote = await tx.purchaseQuote.create({
      data: {
        requestId: id,
        proveedor: proveedor.trim(),
        monto: montoNum,
        archivoUrl,
        fechaCotizacion: new Date(),
        isSelected: false
      }
    });

    const updatedRequest = await tx.purchaseRequest.update({
      where: { id },
      data: { estatus: 'PENDIENTE' }
    });

    return { request: updatedRequest, quotes: [purchaseQuote] };
  });

  return {
    request: result.request,
    quotes: result.quotes.map(quote => ({
      ...quote,
      archivoUrl: buildFileUrl(req, quote.archivoUrl)
    }))
  };
};
