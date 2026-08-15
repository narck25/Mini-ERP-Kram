const { PrismaClient } = require('@prisma/client');
const { recordMovement } = require('./inventory-movement.service');

const prisma = new PrismaClient();

class StationeryService {
  /**
   * Obtener solicitudes del empleado actual
   */
  static async getMyRequests(employeeId) {
    return prisma.stationeryRequest.findMany({
      where: { solicitanteId: employeeId },
      include: {
        items: true,
        departamento: { select: { id: true, nombre: true } },
        entregadoPor: { select: { id: true, nombres: true, apellidoPaterno: true } }
      },
      orderBy: { fechaSolicitud: 'desc' }
    });
  }

  /**
   * Obtener todas las solicitudes (Admin/Compras)
   */
  static async getAllRequests(filters = {}) {
    const where = {};
    if (filters.estatus) where.estatus = filters.estatus;
    if (filters.departamentoId) where.departamentoId = filters.departamentoId;

    return prisma.stationeryRequest.findMany({
      where,
      include: {
        items: true,
        solicitante: { select: { id: true, nombres: true, apellidoPaterno: true, clave: true } },
        departamento: { select: { id: true, nombre: true } },
        entregadoPor: { select: { id: true, nombres: true, apellidoPaterno: true } }
      },
      orderBy: { fechaSolicitud: 'desc' }
    });
  }

  /**
   * Obtener detalle de una solicitud
   */
  static async getRequestById(id) {
    return prisma.stationeryRequest.findUnique({
      where: { id },
      include: {
        items: true,
        solicitante: { select: { id: true, nombres: true, apellidoPaterno: true, clave: true } },
        departamento: { select: { id: true, nombre: true } },
        entregadoPor: { select: { id: true, nombres: true, apellidoPaterno: true } }
      }
    });
  }

  /**
   * Crear solicitud de papelería
   */
  static async createRequest(data, employeeId) {
    const { items, justificacion, departamentoId } = data;

    if (!items || items.length === 0) {
      throw new Error('Debe agregar al menos un artículo');
    }

    return prisma.stationeryRequest.create({
      data: {
        solicitanteId: employeeId,
        departamentoId,
        justificacion,
        items: {
          create: items.map(item => ({
            producto: item.producto,
            cantidad: parseInt(item.cantidad) || 1,
            unidad: item.unidad || 'pzas'
          }))
        }
      },
      include: {
        items: true,
        solicitante: { select: { id: true, nombres: true, apellidoPaterno: true } },
        departamento: { select: { id: true, nombre: true } }
      }
    });
  }

  /**
   * Cancelar solicitud (solo si es PENDIENTE y es del solicitante)
   */
  static async cancelRequest(id, employeeId) {
    const request = await prisma.stationeryRequest.findUnique({ where: { id } });

    if (!request) throw new Error('Solicitud no encontrada');
    if (request.solicitanteId !== employeeId) throw new Error('No puedes cancelar una solicitud que no te pertenece');
    if (request.estatus !== 'PENDIENTE') throw new Error('Solo puedes cancelar solicitudes pendientes');

    return prisma.stationeryRequest.update({
      where: { id },
      data: { estatus: 'CANCELADO' }
    });
  }

  /**
   * Marcar solicitud como entregada (Admin/Compras)
   */
  static async deliverRequest(id, entregadoPorId, userId) {
    const request = await prisma.stationeryRequest.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!request) throw new Error('Solicitud no encontrada');
    if (request.estatus !== 'PENDIENTE') throw new Error('Solo puedes entregar solicitudes pendientes');

    // Descontar stock de papelería + registrar salida (kardex)
    for (const item of request.items) {
      const inv = await prisma.stationeryInventory.findUnique({ where: { producto: item.producto } });
      if (inv) {
        const nuevo = Math.max(0, inv.cantidadActual - item.cantidad);
        await prisma.stationeryInventory.update({ where: { id: inv.id }, data: { cantidadActual: nuevo } });
        await recordMovement(null, {
          tipo: 'PAPELERIA', tipoMovimiento: 'SALIDA',
          itemId: inv.id, itemDescripcion: inv.producto,
          cantidad: item.cantidad, stockAnterior: inv.cantidadActual, stockNuevo: nuevo,
          referencia: 'Entrega de papelería', usuarioId: userId
        });
      }
    }

    return prisma.stationeryRequest.update({
      where: { id },
      data: {
        estatus: 'ENTREGADO',
        fechaEntrega: new Date(),
        entregadoPorId
      },
      include: {
        items: true,
        solicitante: { select: { id: true, nombres: true, apellidoPaterno: true } },
        entregadoPor: { select: { id: true, nombres: true, apellidoPaterno: true } }
      }
    });
  }

  // ─── INVENTARIO ───

  /**
   * Obtener inventario de papelería
   */
  static async getInventory(filters = {}) {
    const where = {};
    if (filters.categoria) where.categoria = filters.categoria;

    return prisma.stationeryInventory.findMany({
      where,
      orderBy: { producto: 'asc' }
    });
  }

  /**
   * Agregar producto al inventario
   */
  static async addInventoryItem(data, userId) {
    const item = await prisma.stationeryInventory.create({ data });
    await recordMovement(null, {
      tipo: 'PAPELERIA', tipoMovimiento: 'ENTRADA',
      itemId: item.id, itemDescripcion: item.producto,
      cantidad: item.cantidadActual || 0, stockAnterior: 0, stockNuevo: item.cantidadActual || 0,
      referencia: 'Alta manual de inventario', usuarioId: userId
    });
    return item;
  }

  /**
   * Actualizar stock de un producto
   */
  static async updateInventoryItem(id, data, userId) {
    const anterior = await prisma.stationeryInventory.findUnique({ where: { id } });
    const item = await prisma.stationeryInventory.update({
      where: { id },
      data
    });
    if (anterior && data.cantidadActual != null) {
      await recordMovement(null, {
        tipo: 'PAPELERIA', tipoMovimiento: 'AJUSTE',
        itemId: item.id, itemDescripcion: item.producto,
        cantidad: Math.abs(item.cantidadActual - anterior.cantidadActual),
        stockAnterior: anterior.cantidadActual, stockNuevo: item.cantidadActual,
        referencia: 'Ajuste manual de inventario', usuarioId: userId
      });
    }
    return item;
  }

  /**
   * Eliminar producto del inventario
   */
  static async deleteInventoryItem(id, userId) {
    const item = await prisma.stationeryInventory.findUnique({ where: { id } });
    const deleted = await prisma.stationeryInventory.delete({ where: { id } });
    if (item) {
      await recordMovement(null, {
        tipo: 'PAPELERIA', tipoMovimiento: 'SALIDA',
        itemId: item.id, itemDescripcion: item.producto,
        cantidad: item.cantidadActual, stockAnterior: item.cantidadActual, stockNuevo: 0,
        referencia: 'Eliminación de inventario', usuarioId: userId
      });
    }
    return deleted;
  }

  static async restockInventoryItem(id, cantidad, userId) {
    const item = await prisma.stationeryInventory.findUnique({ where: { id } });
    if (!item) throw new Error('Producto no encontrado');
    const nuevo = item.cantidadActual + (parseInt(cantidad) || 0);
    const updated = await prisma.stationeryInventory.update({ where: { id }, data: { cantidadActual: nuevo } });
    await recordMovement(null, {
      tipo: 'PAPELERIA', tipoMovimiento: 'ENTRADA',
      itemId: updated.id, itemDescripcion: updated.producto,
      cantidad: parseInt(cantidad) || 0, stockAnterior: item.cantidadActual, stockNuevo: nuevo,
      referencia: 'Reabastecimiento (restock)', usuarioId: userId
    });
    return updated;
  }
}

module.exports = StationeryService;
