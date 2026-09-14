const { PrismaClient } = require('@prisma/client');
const { recordMovement } = require('./inventory-movement.service');
const { isInventoryStrictMode } = require('../system-setting.service');

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

  static async addInventoryItem(data, userId) {
    const item = await prisma.uniformInventory.create({ data });
    await recordMovement(null, {
      tipo: 'UNIFORMES', tipoMovimiento: 'ENTRADA',
      itemId: item.id, itemDescripcion: `${item.tipo} ${item.talla} ${item.genero || ''}`.trim(),
      cantidad: item.cantidadActual || 0, stockAnterior: 0, stockNuevo: item.cantidadActual || 0,
      referencia: 'Alta manual de inventario', usuarioId: userId
    });
    return item;
  }

  static async updateInventoryItem(id, data, userId) {
    const anterior = await prisma.uniformInventory.findUnique({ where: { id } });
    const item = await prisma.uniformInventory.update({ where: { id }, data });
    if (anterior && data.cantidadActual != null) {
      await recordMovement(null, {
        tipo: 'UNIFORMES', tipoMovimiento: 'AJUSTE',
        itemId: item.id, itemDescripcion: `${item.tipo} ${item.talla} ${item.genero || ''}`.trim(),
        cantidad: Math.abs(item.cantidadActual - anterior.cantidadActual),
        stockAnterior: anterior.cantidadActual, stockNuevo: item.cantidadActual,
        referencia: 'Ajuste manual de inventario', usuarioId: userId
      });
    }
    return item;
  }

  static async deleteInventoryItem(id, userId) {
    const item = await prisma.uniformInventory.findUnique({ where: { id } });
    const deleted = await prisma.uniformInventory.delete({ where: { id } });
    if (item) {
      await recordMovement(null, {
        tipo: 'UNIFORMES', tipoMovimiento: 'SALIDA',
        itemId: item.id, itemDescripcion: `${item.tipo} ${item.talla} ${item.genero || ''}`.trim(),
        cantidad: item.cantidadActual, stockAnterior: item.cantidadActual, stockNuevo: 0,
        referencia: 'Eliminación de inventario', usuarioId: userId
      });
    }
    return deleted;
  }

  // ─── ENTREGAS ───

  // Lista ligera de empleados activos para el selector de entrega (módulo COMPRAS).
  static async listEmployees() {
    return prisma.employee.findMany({
      where: { estatus: 'Activo' },
      select: { id: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, clave: true },
      orderBy: [{ apellidoPaterno: 'asc' }, { nombres: 'asc' }]
    });
  }

  static async createDelivery(data, entregadoPorId, userId) {
    const { empleadoId, items, observaciones } = data;

    if (!items || items.length === 0) {
      throw new Error('Debe agregar al menos un artículo');
    }

    // Validar que el empleado existe
    const empleado = await prisma.employee.findUnique({ where: { id: empleadoId } });
    if (!empleado) throw new Error('Empleado no encontrado');

    // Modo estricto (interruptor de Admin): bloquea si falta inventario o no
    // alcanza el stock. Modo permisivo (default): registra la entrega igual,
    // crea el renglón de inventario si no existe y deja el stock en negativo
    // si hace falta — al cargar inventario real, el negativo se corrige solo.
    const strict = await isInventoryStrictMode();

    const entregas = [];
    for (const item of items) {
      const cantidad = parseFloat(item.cantidad) || 1;
      const inventoryItem = await prisma.uniformInventory.findFirst({
        where: {
          tipo: item.tipo,
          talla: item.talla,
          genero: item.genero || undefined
        }
      });

      if (!inventoryItem) {
        if (strict) {
          throw new Error(`No existe en inventario: ${item.tipo} talla ${item.talla}${item.genero ? ` (${item.genero})` : ''}`);
        }
        entregas.push({ inventoryItem: null, item, cantidad });
        continue;
      }
      if (strict && inventoryItem.cantidadActual < cantidad) {
        throw new Error(`Stock insuficiente de ${inventoryItem.tipo} talla ${inventoryItem.talla}: hay ${inventoryItem.cantidadActual}, se requieren ${cantidad}`);
      }

      entregas.push({ inventoryItem, item, cantidad });
    }

    return prisma.$transaction(async (tx) => {
      // Crear la entrega
      const delivery = await tx.uniformDelivery.create({
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

      // Descontar del inventario (o crearlo en negativo si no existía y estamos en modo permisivo)
      for (const { inventoryItem, item, cantidad } of entregas) {
        if (!inventoryItem) {
          const nuevo = await tx.uniformInventory.create({
            data: {
              tipo: item.tipo,
              talla: item.talla,
              genero: item.genero || null,
              cantidadActual: -cantidad
            }
          });
          await recordMovement(tx, {
            tipo: 'UNIFORMES', tipoMovimiento: 'SALIDA',
            itemId: nuevo.id, itemDescripcion: `${nuevo.tipo} ${nuevo.talla} ${nuevo.genero || ''}`.trim(),
            cantidad, stockAnterior: 0, stockNuevo: nuevo.cantidadActual,
            referencia: 'Entrega de uniforme (sin inventario previo, modo permisivo)', usuarioId: userId
          });
          continue;
        }

        const nuevo = inventoryItem.cantidadActual - cantidad;
        await tx.uniformInventory.update({
          where: { id: inventoryItem.id },
          data: { cantidadActual: nuevo }
        });
        await recordMovement(tx, {
          tipo: 'UNIFORMES', tipoMovimiento: 'SALIDA',
          itemId: inventoryItem.id, itemDescripcion: `${inventoryItem.tipo} ${inventoryItem.talla} ${inventoryItem.genero || ''}`.trim(),
          cantidad, stockAnterior: inventoryItem.cantidadActual, stockNuevo: nuevo,
          referencia: 'Entrega de uniforme', usuarioId: userId
        });
      }

      return delivery;
    });
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

  static async restockInventoryItem(id, cantidad, userId) {
    const item = await prisma.uniformInventory.findUnique({ where: { id } });
    if (!item) throw new Error('Artículo no encontrado');
    const nuevo = item.cantidadActual + (parseInt(cantidad) || 0);
    const updated = await prisma.uniformInventory.update({ where: { id }, data: { cantidadActual: nuevo } });
    await recordMovement(null, {
      tipo: 'UNIFORMES', tipoMovimiento: 'ENTRADA',
      itemId: updated.id, itemDescripcion: `${updated.tipo} ${updated.talla} ${updated.genero || ''}`.trim(),
      cantidad: parseInt(cantidad) || 0, stockAnterior: item.cantidadActual, stockNuevo: nuevo,
      referencia: 'Reabastecimiento (restock)', usuarioId: userId
    });
    return updated;
  }
}

module.exports = UniformService;
