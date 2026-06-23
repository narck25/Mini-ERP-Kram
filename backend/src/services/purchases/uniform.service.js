const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class UniformService {
  // ─── INVENTARIO ───

  static async getInventory(filters = {}) {
    const where = {};
    if (filters.tipo) where.tipo = filters.tipo;
    if (filters.talla) where.talla = filters.talla;

    return prisma.uniformInventory.findMany({
      where,
      orderBy: [{ tipo: 'asc' }, { talla: 'asc' }]
    });
  }

  static async addInventoryItem(data) {
    return prisma.uniformInventory.create({ data });
  }

  static async updateInventoryItem(id, data) {
    return prisma.uniformInventory.update({ where: { id }, data });
  }

  static async deleteInventoryItem(id) {
    return prisma.uniformInventory.delete({ where: { id } });
  }

  // ─── ENTREGAS ───

  static async createDelivery(data, entregadoPorId) {
    const { empleadoId, items, observaciones } = data;

    if (!items || items.length === 0) {
      throw new Error('Debe agregar al menos un artículo');
    }

    // Validar que el empleado existe
    const empleado = await prisma.employee.findUnique({ where: { id: empleadoId } });
    if (!empleado) throw new Error('Empleado no encontrado');

    // Crear la entrega
    const delivery = await prisma.uniformDelivery.create({
      data: {
        empleadoId,
        items,
        entregadoPorId,
        observaciones
      },
      include: {
        empleado: { select: { id: true, nombres: true, apellidoPaterno: true, clave: true } },
        entregadoPor: { select: { id: true, nombres: true, apellidoPaterno: true } }
      }
    });

    // Descontar del inventario
    for (const item of items) {
      const inventoryItem = await prisma.uniformInventory.findFirst({
        where: {
          tipo: item.tipo,
          talla: item.talla,
          genero: item.genero || undefined
        }
      });

      if (inventoryItem) {
        await prisma.uniformInventory.update({
          where: { id: inventoryItem.id },
          data: { cantidadActual: Math.max(0, inventoryItem.cantidadActual - (item.cantidad || 1)) }
        });
      }
    }

    return delivery;
  }

  static async getDeliveries(filters = {}) {
    const where = {};
    if (filters.empleadoId) where.empleadoId = filters.empleadoId;

    return prisma.uniformDelivery.findMany({
      where,
      include: {
        empleado: { select: { id: true, nombres: true, apellidoPaterno: true, clave: true } },
        entregadoPor: { select: { id: true, nombres: true, apellidoPaterno: true } }
      },
      orderBy: { fechaEntrega: 'desc' }
    });
  }

  static async getDeliveryById(id) {
    return prisma.uniformDelivery.findUnique({
      where: { id },
      include: {
        empleado: { select: { id: true, nombres: true, apellidoPaterno: true, clave: true, tallaCamisa: true, tallaPantalon: true, tallaPlayera: true, tallaZapatos: true } },
        entregadoPor: { select: { id: true, nombres: true, apellidoPaterno: true } }
      }
    });
  }

  // ─── HISTORIAL POR EMPLEADO (RH) ───

  static async getEmployeeHistory(empleadoId) {
    return prisma.uniformDelivery.findMany({
      where: { empleadoId },
      include: {
        entregadoPor: { select: { id: true, nombres: true, apellidoPaterno: true } }
      },
      orderBy: { fechaEntrega: 'desc' }
    });
  }
}

module.exports = UniformService;
