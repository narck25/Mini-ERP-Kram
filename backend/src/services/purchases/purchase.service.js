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
  const userRole = req.user.role;

  // ADMIN y RH tienen bypass total: no necesitan empleado asociado ni verificación de propiedad
  const isAdminOrRH = ['ADMIN', 'RH'].includes(userRole);

  if (!isAdminOrRH) {
    const employee = await getEmployeeByUserId(userId);
    if (!employee) {
      throw { status: 404, error: 'Empleado no encontrado', message: 'El usuario no tiene un empleado asociado' };
    }
    req.user.employeeData = employee;
  }

  const request = await prisma.purchaseRequest.findUnique({
    where: { id },
    include: REQUEST_INCLUDE
  });

  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  // Para ADMIN/RH: acceso total a cualquier solicitud
  // Para COMPRAS: acceso si es el solicitante o tiene rol COMPRAS
  // Para otros roles: solo si es el solicitante
  if (!isAdminOrRH) {
    const employee = req.user.employeeData;
    const isSolicitante = request.solicitanteId === employee.id;
    const isComprasRole = userRole === 'COMPRAS';

    if (!isSolicitante && !isComprasRole) {
      throw { status: 403, error: 'Acceso denegado', message: 'No tiene permisos para ver esta solicitud' };
    }
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
// 9. Actualizar datos de una cotización (proveedor, monto, archivo)
// ─────────────────────────────────────────────────────────────
exports.updateQuote = async (requestId, quoteId, data) => {
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

  // Construir objeto de actualización solo con campos proporcionados
  const updateData = {};

  if (data.proveedor !== undefined) {
    if (!data.proveedor || !data.proveedor.trim()) {
      throw { status: 400, error: 'Datos inválidos', message: 'El nombre del proveedor no puede estar vacío' };
    }
    updateData.proveedor = data.proveedor.trim();
  }

  if (data.monto !== undefined) {
    const nuevoMonto = parseFloat(data.monto);
    if (isNaN(nuevoMonto) || nuevoMonto <= 0) {
      throw { status: 400, error: 'Monto inválido', message: 'El monto debe ser un número mayor a 0' };
    }
    updateData.monto = nuevoMonto;
  }

  if (data.archivoUrl !== undefined) {
    updateData.archivoUrl = data.archivoUrl || null;
  }

  // Si no hay nada que actualizar, devolver la cotización actual
  if (Object.keys(updateData).length === 0) {
    return quote;
  }

  // Siempre actualizar fecha de cotización al editar
  updateData.fechaCotizacion = new Date();

  const updatedQuote = await prisma.purchaseQuote.update({
    where: { id: quoteId },
    data: updateData
  });

  // Si se actualizó el monto y la cotización está seleccionada, reevaluar estado
  if (data.monto !== undefined && updatedQuote.isSelected) {
    const nuevoMonto = parseFloat(data.monto);
    const UMBRAL = 50000;
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

// Mantener compatibilidad con el nombre anterior
exports.updateQuoteAmount = exports.updateQuote;


// ─────────────────────────────────────────────────────────────
// 10. Obtener detalles de solicitud (público, sin validación de módulo)
//     → Solo verifica que la solicitud existe
//     → NO valida permisos de módulo (para página pública de autorización)
// ─────────────────────────────────────────────────────────────
exports.getPublicRequestDetails = async (req) => {
  const { id } = req.params;

  const request = await prisma.purchaseRequest.findUnique({
    where: { id },
    include: REQUEST_INCLUDE
  });

  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  return {
    ...request,
    quotes: transformQuoteUrls(req, request.quotes)
  };
};

// ─────────────────────────────────────────────────────────────
// 11. Autorizar solicitud (Admin/Gerente)
//     → Solo cambia estado a APROBADO.
//     → El área de Compras genera la Orden de Compra manualmente.
// ─────────────────────────────────────────────────────────────
exports.authorizeRequest = async (userId, requestId) => {

  const employee = await getEmployeeByUserId(userId);

  const request = await prisma.purchaseRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  if (request.estatus !== 'EN_AUTORIZACION') {
    throw { status: 400, error: 'Estado inválido', message: 'Solo se pueden autorizar solicitudes en estado EN_AUTORIZACION' };
  }

  // ── Actualizar estado del aprobador (PurchaseApprover) ──
  // Solo si el usuario tiene un empleado asociado (ADMIN puede no tenerlo)
  if (employee) {
    await prisma.purchaseApprover.updateMany({
      where: {
        requestId,
        employeeId: employee.id
      },
      data: {
        estatus: 'APROBADO',
        fechaRespuesta: new Date()
      }
    });
  }

  // ── Actualizar estado de la solicitud a APROBADO ──
  const updatedRequest = await prisma.purchaseRequest.update({
    where: { id: requestId },
    data: {
      estatus: 'APROBADO',
      autorizadoPorId: employee ? employee.id : null,
      fechaAutorizacion: new Date()
    },
    include: {
      autorizadoPor: { select: { id: true, nombre: true } }
    }
  });

  return updatedRequest;

};



// ─────────────────────────────────────────────────────────────
// 11. Eliminar solicitud de compra (Admin/Compras)
//     → Elimina la solicitud y todo lo relacionado (cascada)
// ─────────────────────────────────────────────────────────────
exports.deleteRequest = async (userId, userRole, requestId) => {
  const isAdminOrCompras = ['ADMIN', 'COMPRAS'].includes(userRole);
  if (!isAdminOrCompras) {
    throw { status: 403, error: 'Acceso denegado', message: 'Solo ADMIN o COMPRAS pueden eliminar solicitudes' };
  }

  const request = await prisma.purchaseRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  // Eliminar la solicitud (onDelete: Cascade eliminará items, quotes, comments, approvers, purchaseOrder, etc.)
  await prisma.purchaseRequest.delete({ where: { id: requestId } });

  return { message: 'Solicitud eliminada exitosamente' };
};

// ─────────────────────────────────────────────────────────────
// 12. Actualizar items de una solicitud (solicitante o Admin/Compras)
//     → Solo en estado NUEVO
//     → Reemplaza todos los items existentes
// ─────────────────────────────────────────────────────────────
exports.updateItems = async (userId, userRole, requestId, items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw { status: 400, error: 'Datos inválidos', message: 'Debe incluir al menos un ítem en la solicitud' };
  }

  for (const item of items) {
    if (!item.productoServicio || !item.cantidad) {
      throw { status: 400, error: 'Datos inválidos', message: 'Cada ítem debe tener productoServicio y cantidad' };
    }
  }

  const employee = await getEmployeeByUserId(userId);
  if (!employee) {
    throw { status: 404, error: 'Empleado no encontrado', message: 'El usuario no tiene un empleado asociado' };
  }

  const request = await prisma.purchaseRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  // Validar permisos: solo el solicitante o Admin/Compras
  const isSolicitante = request.solicitanteId === employee.id;
  const isAdminOrCompras = ['ADMIN', 'COMPRAS'].includes(userRole);

  if (!isSolicitante && !isAdminOrCompras) {
    throw { status: 403, error: 'Acceso denegado', message: 'No tiene permisos para modificar esta solicitud' };
  }

  // Solo permitir en estado NUEVO
  if (request.estatus !== 'NUEVO') {
    throw { status: 400, error: 'Estado inválido', message: 'Solo se pueden modificar items en solicitudes en estado NUEVO' };
  }

  return prisma.$transaction(async (tx) => {
    // Eliminar items existentes
    await tx.purchaseItem.deleteMany({ where: { requestId } });

    // Crear nuevos items
    const newItems = await Promise.all(
      items.map(item =>
        tx.purchaseItem.create({
          data: {
            requestId,
            productoServicio: item.productoServicio,
            cantidad: parseFloat(item.cantidad),
            descripcion: item.descripcion || null
          }
        })
      )
    );

    return newItems;
  });
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
