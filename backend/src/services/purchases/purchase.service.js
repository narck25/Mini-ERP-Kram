/**
 * purchase.service.js
 * ─────────────────────────────────────────────────────────────
 * REFACTORIZADO: Lógica de negocio para solicitudes de compra.
 * Responsabilidad: CRUD de solicitudes, cambios de estado básicos,
 *                  subida de archivos a cotizaciones.
 * ─────────────────────────────────────────────────────────────
 * Antes estaba en: purchase.controller.js (métodos createRequest,
 *   getMyRequests, getRequestDetails, getAllRequests, cancelRequest,
 *   markAsDelivered, uploadQuoteFile, uploadQuoteFileForNewQuote,
 *   updateQuoteAmount)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const audit = require('../audit.service');

// ─────────────────────────────────────────────────────────────
// Función auxiliar para construir URLs completas de archivos
// ─────────────────────────────────────────────────────────────
const buildFileUrl = (req, filePath) => {
  if (!filePath) return null;
  if (process.env.BASE_URL) {
    return `${process.env.BASE_URL}${filePath}`;
  }
  return `${req.protocol}://${req.get('host')}${filePath}`;
};

// ─────────────────────────────────────────────────────────────
// Función auxiliar: obtener empleado por userId
// ─────────────────────────────────────────────────────────────
const getEmployeeByUserId = async (userId) => {
  return prisma.employee.findUnique({ where: { userId } });
};

// ─────────────────────────────────────────────────────────────
// Función auxiliar: transformar URLs de cotizaciones
// ─────────────────────────────────────────────────────────────
const transformQuoteUrls = (req, quotes) => {
  return quotes.map(quote => ({
    ...quote,
    archivoUrl: buildFileUrl(req, quote.archivoUrl)
  }));
};

// ─────────────────────────────────────────────────────────────
// Función auxiliar: incluir relaciones comunes de solicitud
// ─────────────────────────────────────────────────────────────
const REQUEST_INCLUDE = {
  solicitante: {
    select: {
      id: true,
      nombre: true,
      user: { select: { id: true, name: true, email: true } }
    }
  },
  departamento: {
    select: { id: true, nombre: true }
  },
  items: true,
  quotes: true,
  autorizadoPor: {
    select: { id: true, nombre: true }
  },
  approvers: {
    include: {
      employee: {
        select: {
          id: true,
          nombre: true,
          nombres: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          nivelJerarquico: true,
          departamento: { select: { nombre: true } }
        }
      }
    }
  }
};

// ─────────────────────────────────────────────────────────────
// 1. Crear una nueva solicitud de compra
// ─────────────────────────────────────────────────────────────
exports.createRequest = async (userId, justificacion, items) => {
  const employee = await getEmployeeByUserId(userId);
  if (!employee) {
    throw { status: 404, error: 'Empleado no encontrado', message: 'El usuario no tiene un empleado asociado' };
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw { status: 400, error: 'Datos inválidos', message: 'Debe incluir al menos un ítem en la solicitud' };
  }

  for (const item of items) {
    if (!item.productoServicio || !item.cantidad) {
      throw { status: 400, error: 'Datos inválidos', message: 'Cada ítem debe tener productoServicio y cantidad' };
    }
  }

  return prisma.$transaction(async (tx) => {
    const purchaseRequest = await tx.purchaseRequest.create({
      data: {
        solicitanteId: employee.id,
        departamentoId: employee.departamento_id,
        justificacion: justificacion || null,
        estatus: 'NUEVO',
        fechaSolicitud: new Date(),
        requiereAutorizacion: false
      }
    });

    const purchaseItems = await Promise.all(
      items.map(item =>
        tx.purchaseItem.create({
          data: {
            requestId: purchaseRequest.id,
            productoServicio: item.productoServicio,
            cantidad: parseFloat(item.cantidad),
            descripcion: item.descripcion || null
          }
        })
      )
    );

    return { purchaseRequest, purchaseItems };
  });
};

// ─────────────────────────────────────────────────────────────
// 2. Obtener solicitudes del usuario autenticado
// ─────────────────────────────────────────────────────────────
exports.getMyRequests = async (req) => {
  const userId = req.user.id;
  const employee = await getEmployeeByUserId(userId);
  if (!employee) return [];

  const requests = await prisma.purchaseRequest.findMany({
    where: { solicitanteId: employee.id },
    include: REQUEST_INCLUDE,
    orderBy: { createdAt: 'desc' }
  });

  return requests.map(request => ({
    ...request,
    quotes: transformQuoteUrls(req, request.quotes)
  }));
};

// ─────────────────────────────────────────────────────────────
// 3. Obtener detalles de una solicitud específica
// ─────────────────────────────────────────────────────────────
exports.getRequestDetails = async (req) => {
  const { id } = req.params;
  const userId = req.user.id;

  const employee = await getEmployeeByUserId(userId);
  if (!employee) {
    throw { status: 404, error: 'Empleado no encontrado', message: 'El usuario no tiene un empleado asociado' };
  }

  const request = await prisma.purchaseRequest.findUnique({
    where: { id },
    include: REQUEST_INCLUDE
  });

  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  const isSolicitante = request.solicitanteId === employee.id;
  const isAdminOrCompras = ['ADMIN', 'COMPRAS'].includes(req.user.role);

  if (!isSolicitante && !isAdminOrCompras) {
    throw { status: 403, error: 'Acceso denegado', message: 'No tiene permisos para ver esta solicitud' };
  }

  return {
    ...request,
    quotes: transformQuoteUrls(req, request.quotes)
  };
};

// ─────────────────────────────────────────────────────────────
// 4. Obtener todas las solicitudes (Admin/Compras)
// ─────────────────────────────────────────────────────────────
exports.getAllRequests = async (req) => {
  const { status, department } = req.query;
  const where = {};

  if (status) where.estatus = status;
  if (department) {
    const dept = await prisma.department.findFirst({
      where: { nombre: { equals: department, mode: 'insensitive' } }
    });
    if (dept) where.departamentoId = dept.id;
  }

  const requests = await prisma.purchaseRequest.findMany({
    where,
    include: {
      solicitante: {
        select: {
          id: true,
          nombre: true,
          user: { select: { id: true, name: true, email: true } }
        }
      },
      departamento: { select: { id: true, nombre: true } },
      items: true,
      quotes: true,
      autorizadoPor: { select: { id: true, nombre: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return requests.map(request => ({
    ...request,
    quotes: transformQuoteUrls(req, request.quotes)
  }));
};

// ─────────────────────────────────────────────────────────────
// 5. Cancelar una solicitud de compra
// ─────────────────────────────────────────────────────────────
exports.cancelRequest = async (userId, userRole, requestId) => {
  const employee = await getEmployeeByUserId(userId);
  if (!employee) {
    throw { status: 404, error: 'Empleado no encontrado', message: 'El usuario no tiene un empleado asociado' };
  }

  const request = await prisma.purchaseRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  const isSolicitante = request.solicitanteId === employee.id;
  const isAdminOrCompras = ['ADMIN', 'COMPRAS'].includes(userRole);

  if (!isSolicitante && !isAdminOrCompras) {
    throw { status: 403, error: 'Acceso denegado', message: 'No tiene permisos para cancelar esta solicitud' };
  }

  if (request.estatus === 'CANCELADO') {
    throw { status: 400, error: 'Solicitud ya cancelada', message: 'La solicitud ya está cancelada' };
  }

  if (request.estatus === 'ENTREGADO') {
    throw { status: 400, error: 'No se puede cancelar', message: 'No se pueden cancelar solicitudes ya entregadas' };
  }

  return prisma.purchaseRequest.update({
    where: { id: requestId },
    data: { estatus: 'CANCELADO' }
  });
};

// ─────────────────────────────────────────────────────────────
// 6. Marcar solicitud como ENTREGADA
// ─────────────────────────────────────────────────────────────
exports.markAsDelivered = async (requestId) => {
  const request = await prisma.purchaseRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  if (request.estatus !== 'APROBADO') {
    throw { status: 400, error: 'Estado inválido', message: 'Solo se pueden marcar como entregadas solicitudes en estado APROBADO' };
  }

  return prisma.purchaseRequest.update({
    where: { id: requestId },
    data: { estatus: 'ENTREGADO' }
  });
};

// ─────────────────────────────────────────────────────────────
// 7. Subir archivo a una cotización existente
// ─────────────────────────────────────────────────────────────
exports.uploadQuoteFile = async (requestId, quoteId, filename) => {
  const request = await prisma.purchaseRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  const quote = await prisma.purchaseQuote.findFirst({
    where: { id: quoteId, requestId }
  });

  if (!quote) {
    throw { status: 404, error: 'Cotización no encontrada', message: 'La cotización no existe o no pertenece a esta solicitud' };
  }

  const fileUrl = `/uploads/purchase-quotes/${filename}`;

  return prisma.purchaseQuote.update({
    where: { id: quoteId },
    data: { archivoUrl: fileUrl }
  });
};

// ─────────────────────────────────────────────────────────────
// 8. Subir archivo para nueva cotización (pre-creación)
// ─────────────────────────────────────────────────────────────
exports.uploadQuoteFileForNewQuote = async (requestId, filename, quoteIndex) => {
  const request = await prisma.purchaseRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  if (request.estatus !== 'NUEVO' && request.estatus !== 'PENDIENTE') {
    throw { status: 400, error: 'Estado inválido', message: 'Solo se pueden subir archivos para cotizaciones en solicitudes NUEVO o PENDIENTE' };
  }

  const index = parseInt(quoteIndex);
  if (isNaN(index) || index < 0 || index > 2) {
    throw { status: 400, error: 'Índice inválido', message: 'El índice de cotización debe ser 0, 1 o 2' };
  }

  return {
    fileUrl: `/uploads/purchase-quotes/${filename}`,
    fileName: filename,
    quoteIndex: index
  };
};

// ─────────────────────────────────────────────────────────────
// 9. Actualizar monto de una cotización
// ─────────────────────────────────────────────────────────────
exports.updateQuoteAmount = async (requestId, quoteId, monto) => {
  if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
    throw { status: 400, error: 'Monto inválido', message: 'El monto debe ser un número mayor a 0' };
  }

  const request = await prisma.purchaseRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  if (request.estatus === 'ENTREGADO' || request.estatus === 'CANCELADO') {
    throw { status: 400, error: 'Estado inválido', message: 'No se puede modificar cotizaciones en solicitudes ENTREGADAS o CANCELADAS' };
  }

  const quote = await prisma.purchaseQuote.findFirst({
    where: { id: quoteId, requestId }
  });

  if (!quote) {
    throw { status: 404, error: 'Cotización no encontrada', message: 'La cotización no existe o no pertenece a esta solicitud' };
  }

  const nuevoMonto = parseFloat(monto);
  const UMBRAL = 50000;

  // Actualizar monto y fecha de cotización
  const updatedQuote = await prisma.purchaseQuote.update({
    where: { id: quoteId },
    data: { monto: nuevoMonto, fechaCotizacion: new Date() }
  });

  // Si la cotización está seleccionada, reevaluar estado
  if (updatedQuote.isSelected) {
    let nuevoEstatus = request.estatus;
    let requiereAutorizacion = request.requiereAutorizacion;

    if (nuevoMonto > UMBRAL && request.estatus === 'APROBADO') {
      nuevoEstatus = 'EN_AUTORIZACION';
      requiereAutorizacion = true;
    } else if (nuevoMonto <= UMBRAL && request.estatus === 'EN_AUTORIZACION') {
      nuevoEstatus = 'APROBADO';
      requiereAutorizacion = false;
    }

    if (nuevoEstatus !== request.estatus) {
      await prisma.purchaseRequest.update({
        where: { id: requestId },
        data: { estatus: nuevoEstatus, requiereAutorizacion }
      });
    }
  }

  return updatedQuote;
};

// ─────────────────────────────────────────────────────────────
// 10. Autorizar solicitud (Admin/Gerente)
//     → Genera automáticamente la Orden de Compra
// ─────────────────────────────────────────────────────────────
exports.authorizeRequest = async (userId, requestId) => {
  const employee = await getEmployeeByUserId(userId);
  if (!employee) {
    throw { status: 404, error: 'Empleado no encontrado', message: 'El usuario no tiene un empleado asociado' };
  }

  const request = await prisma.purchaseRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  if (request.estatus !== 'EN_AUTORIZACION') {
    throw { status: 400, error: 'Estado inválido', message: 'Solo se pueden autorizar solicitudes en estado EN_AUTORIZACION' };
  }

  // ── 10.1 Actualizar estado a APROBADO ──
  const updatedRequest = await prisma.purchaseRequest.update({
    where: { id: requestId },
    data: {
      estatus: 'APROBADO',
      autorizadoPorId: employee.id,
      fechaAutorizacion: new Date()
    },
    include: {
      autorizadoPor: { select: { id: true, nombre: true } }
    }
  });

  // ── 10.2 Generar Orden de Compra automáticamente ──
  // Fire & forget: la generación de OC se ejecuta en segundo plano
  // para no bloquear la respuesta al frontend.
  // Si falla, se loggea el error pero la solicitud ya quedó aprobada.
  try {
    const orderService = require('./purchase-order.service');
    const result = await orderService.generateOrder(requestId);
    console.log(`📄 OC generada: ${result.order.numero} → ${result.pdfUrl}`);
  } catch (orderError) {
    // Si la OC ya existe (409) o no hay cotización seleccionada,
    // no es crítico: la solicitud ya está aprobada.
    console.warn(`⚠️ No se pudo generar OC automática para ${requestId}:`, orderError.message);
  }

  return updatedRequest;
};


// ─────────────────────────────────────────────────────────────
// Exportar helpers para uso en otros servicios
// ─────────────────────────────────────────────────────────────
exports._helpers = {
  buildFileUrl,
  getEmployeeByUserId,
  transformQuoteUrls,
  REQUEST_INCLUDE
};
