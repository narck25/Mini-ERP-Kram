/**
 * inventory-adjustment.service.js
 * Lógica de negocio para solicitudes de ajuste de inventario
 * (papelería y uniformes). Flujo: usuario solicita → ADMIN/RH aprueba/rechaza.
 */
const { PrismaClient } = require('@prisma/client');
const { recordMovement } = require('./inventory-movement.service');
const prisma = new PrismaClient();

const getEmployeeByUserId = (userId) => prisma.employee.findUnique({ where: { userId } });

// ─── 1. Crear solicitud de ajuste ───
exports.createAdjustment = async (userId, data) => {
  const { tipo, accion, itemId, detalle, motivo } = data;

  if (!tipo || !['PAPELERIA', 'UNIFORMES'].includes(tipo)) {
    throw { status: 400, error: 'Datos inválidos', message: 'El tipo debe ser PAPELERIA o UNIFORMES' };
  }
  if (!accion || !['AGREGAR', 'ACTUALIZAR', 'ELIMINAR'].includes(accion)) {
    throw { status: 400, error: 'Datos inválidos', message: 'La acción debe ser AGREGAR, ACTUALIZAR o ELIMINAR' };
  }
  if (!motivo || !motivo.trim()) {
    throw { status: 400, error: 'Datos inválidos', message: 'El motivo es obligatorio' };
  }
  if (!detalle || typeof detalle !== 'object') {
    throw { status: 400, error: 'Datos inválidos', message: 'El detalle del ajuste es obligatorio' };
  }
  if ((accion === 'ACTUALIZAR' || accion === 'ELIMINAR') && !itemId) {
    throw { status: 400, error: 'Datos inválidos', message: 'Se requiere itemId para ACTUALIZAR o ELIMINAR' };
  }

  const employee = await getEmployeeByUserId(userId);
  if (!employee) {
    throw { status: 404, error: 'Empleado no encontrado', message: 'El usuario no tiene un empleado asociado' };
  }

  return prisma.inventoryAdjustmentRequest.create({
    data: {
      tipo, accion,
      itemId: itemId || null,
      detalle, motivo,
      estatus: 'PENDIENTE',
      solicitanteId: employee.id
    },
    include: { solicitante: { select: { id: true, nombre: true } } }
  });
};

// ─── 2. Listar solicitudes ───
exports.listAdjustments = async (req) => {
  const userRole = req.user.role;
  const userId = req.user.id;
  const { estatus } = req.query;
  const where = {};
  if (estatus) where.estatus = estatus;

  if (userRole !== 'ADMIN' && userRole !== 'RH') {
    const employee = await getEmployeeByUserId(userId);
    where.solicitanteId = employee ? employee.id : '__none__';
  }

  return prisma.inventoryAdjustmentRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      solicitante: { select: { id: true, nombre: true } },
      aprobadoPorUser: { select: { id: true, name: true, email: true } }
    }
  });
};

// ─── 3. Aprobar y aplicar el ajuste ───
exports.approveAdjustment = async (adjustmentId, approverUserId) => {
  const request = await prisma.inventoryAdjustmentRequest.findUnique({ where: { id: adjustmentId } });
  if (!request) throw { status: 404, error: 'No encontrado', message: 'La solicitud no existe' };
  if (request.estatus !== 'PENDIENTE') {
    throw { status: 400, error: 'Estado inválido', message: 'Solo se pueden aprobar solicitudes pendientes' };
  }

  return prisma.$transaction(async (tx) => {
    if (request.tipo === 'PAPELERIA') {
      await applyStationeryAdjustment(tx, request, approverUserId);
    } else if (request.tipo === 'UNIFORMES') {
      await applyUniformAdjustment(tx, request, approverUserId);
    }

    return tx.inventoryAdjustmentRequest.update({
      where: { id: adjustmentId },
      data: { estatus: 'APROBADA', aprobadoPorId: approverUserId, aprobadoAt: new Date() }
    });
  });
};

// ─── 4. Rechazar la solicitud ───
exports.rejectAdjustment = async (adjustmentId, approverUserId, comentario) => {
  const request = await prisma.inventoryAdjustmentRequest.findUnique({ where: { id: adjustmentId } });
  if (!request) throw { status: 404, error: 'No encontrado', message: 'La solicitud no existe' };
  if (request.estatus !== 'PENDIENTE') {
    throw { status: 400, error: 'Estado inválido', message: 'Solo se pueden rechazar solicitudes pendientes' };
  }

  return prisma.inventoryAdjustmentRequest.update({
    where: { id: adjustmentId },
    data: {
      estatus: 'RECHAZADA',
      aprobadoPorId: approverUserId,
      aprobadoAt: new Date(),
      comentarioAprobacion: comentario || null
    }
  });
};

// ─── Helpers: aplicar el ajuste por tipo ───
async function applyStationeryAdjustment(tx, request, userId) {
  const d = request.detalle || {};
  if (request.accion === 'AGREGAR') {
    const item = await tx.stationeryInventory.create({
      data: {
        producto: d.producto,
        categoria: d.categoria || 'OTRO',
        cantidadActual: d.cantidadActual || 0,
        cantidadMinima: d.cantidadMinima ?? 5,
        unidad: d.unidad || 'pzas'
      }
    });
    await recordMovement(tx, {
      tipo: 'PAPELERIA', tipoMovimiento: 'ENTRADA',
      itemId: item.id, itemDescripcion: item.producto,
      cantidad: item.cantidadActual || 0, stockAnterior: 0, stockNuevo: item.cantidadActual || 0,
      referencia: 'Ajuste aprobado (AGREGAR)', usuarioId: userId
    });
  } else if (request.accion === 'ACTUALIZAR') {
    const anterior = await tx.stationeryInventory.findUnique({ where: { id: request.itemId } });
    const item = await tx.stationeryInventory.update({
      where: { id: request.itemId },
      data: {
        ...(d.producto ? { producto: d.producto } : {}),
        ...(d.categoria ? { categoria: d.categoria } : {}),
        ...(d.cantidadActual != null ? { cantidadActual: d.cantidadActual } : {}),
        ...(d.cantidadMinima != null ? { cantidadMinima: d.cantidadMinima } : {}),
        ...(d.unidad ? { unidad: d.unidad } : {})
      }
    });
    if (anterior && d.cantidadActual != null) {
      await recordMovement(tx, {
        tipo: 'PAPELERIA', tipoMovimiento: 'AJUSTE',
        itemId: item.id, itemDescripcion: item.producto,
        cantidad: Math.abs(item.cantidadActual - anterior.cantidadActual),
        stockAnterior: anterior.cantidadActual, stockNuevo: item.cantidadActual,
        referencia: 'Ajuste aprobado (ACTUALIZAR)', usuarioId: userId
      });
    }
  } else if (request.accion === 'ELIMINAR') {
    const item = await tx.stationeryInventory.findUnique({ where: { id: request.itemId } });
    await tx.stationeryInventory.delete({ where: { id: request.itemId } });
    if (item) {
      await recordMovement(tx, {
        tipo: 'PAPELERIA', tipoMovimiento: 'SALIDA',
        itemId: item.id, itemDescripcion: item.producto,
        cantidad: item.cantidadActual, stockAnterior: item.cantidadActual, stockNuevo: 0,
        referencia: 'Ajuste aprobado (ELIMINAR)', usuarioId: userId
      });
    }
  }
}

async function applyUniformAdjustment(tx, request, userId) {
  const d = request.detalle || {};
  if (request.accion === 'AGREGAR') {
    const item = await tx.uniformInventory.create({
      data: {
        tipo: d.tipo,
        talla: d.talla,
        genero: d.genero || null,
        cantidadActual: d.cantidadActual || 0,
        cantidadMinima: d.cantidadMinima ?? 2
      }
    });
    await recordMovement(tx, {
      tipo: 'UNIFORMES', tipoMovimiento: 'ENTRADA',
      itemId: item.id, itemDescripcion: `${item.tipo} ${item.talla} ${item.genero || ''}`.trim(),
      cantidad: item.cantidadActual || 0, stockAnterior: 0, stockNuevo: item.cantidadActual || 0,
      referencia: 'Ajuste aprobado (AGREGAR)', usuarioId: userId
    });
  } else if (request.accion === 'ACTUALIZAR') {
    const anterior = await tx.uniformInventory.findUnique({ where: { id: request.itemId } });
    const item = await tx.uniformInventory.update({
      where: { id: request.itemId },
      data: {
        ...(d.tipo ? { tipo: d.tipo } : {}),
        ...(d.talla ? { talla: d.talla } : {}),
        ...(d.genero !== undefined ? { genero: d.genero || null } : {}),
        ...(d.cantidadActual != null ? { cantidadActual: d.cantidadActual } : {}),
        ...(d.cantidadMinima != null ? { cantidadMinima: d.cantidadMinima } : {})
      }
    });
    if (anterior && d.cantidadActual != null) {
      await recordMovement(tx, {
        tipo: 'UNIFORMES', tipoMovimiento: 'AJUSTE',
        itemId: item.id, itemDescripcion: `${item.tipo} ${item.talla} ${item.genero || ''}`.trim(),
        cantidad: Math.abs(item.cantidadActual - anterior.cantidadActual),
        stockAnterior: anterior.cantidadActual, stockNuevo: item.cantidadActual,
        referencia: 'Ajuste aprobado (ACTUALIZAR)', usuarioId: userId
      });
    }
  } else if (request.accion === 'ELIMINAR') {
    const item = await tx.uniformInventory.findUnique({ where: { id: request.itemId } });
    await tx.uniformInventory.delete({ where: { id: request.itemId } });
    if (item) {
      await recordMovement(tx, {
        tipo: 'UNIFORMES', tipoMovimiento: 'SALIDA',
        itemId: item.id, itemDescripcion: `${item.tipo} ${item.talla} ${item.genero || ''}`.trim(),
        cantidad: item.cantidadActual, stockAnterior: item.cantidadActual, stockNuevo: 0,
        referencia: 'Ajuste aprobado (ELIMINAR)', usuarioId: userId
      });
    }
  }
}

