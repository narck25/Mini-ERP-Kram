const { PrismaClient } = require('@prisma/client');

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
  static async deliverRequest(id, entregadoPorId) {
    const request = await prisma.stationeryRequest.findUnique({ where: { id } });

    if (!request) throw new Error('Solicitud no encontrada');
    if (request.estatus !== 'PENDIENTE') throw new Error('Solo puedes entregar solicitudes pendientes');

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
  static async addInventoryItem(data) {
    return prisma.stationeryInventory.create({ data });
  }

  /**
   * Actualizar stock de un producto
   */
  static async updateInventoryItem(id, data) {
    return prisma.stationeryInventory.update({
      where: { id },
      data
    });
  }

  /**
   * Eliminar producto del inventario
   */
  static async deleteInventoryItem(id) {
    return prisma.stationeryInventory.delete({ where: { id } });
  }
}

module.exports = StationeryService;
