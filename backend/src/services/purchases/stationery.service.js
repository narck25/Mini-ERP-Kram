const { PrismaClient } = require('@prisma/client');
const { recordMovement } = require('./inventory-movement.service');
const { isInventoryStrictMode } = require('../system-setting.service');

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
        solicitante: { select: { id: true, userId: true, nombres: true, apellidoPaterno: true, clave: true } },
        departamento: { select: { id: true, nombre: true } },
        entregadoPor: { select: { id: true, nombres: true, apellidoPaterno: true } }
      }
    });
  }

  /**
   * Crear solicitud de papelería
   */
  static async createRequest(data, employeeId) {
    const { items, justificacion, observaciones, departamentoId } = data;

    if (!items || items.length === 0) {
      throw new Error('Debe agregar al menos un artículo');
    }

    // El departamento es obligatorio en el modelo; si el formulario no lo manda
    // (caso de "mi solicitud"), se toma el del propio solicitante.
    let departamento_id = departamentoId;
    if (!departamento_id) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { departamento_id: true }
      });
      departamento_id = employee?.departamento_id;
    }

    if (!departamento_id) {
      throw new Error('No se pudo determinar el departamento de la solicitud');
    }

    return prisma.stationeryRequest.create({
      data: {
        solicitanteId: employeeId,
        departamentoId: departamento_id,
        justificacion: justificacion || observaciones || null,
        items: {
          create: items.map(item => ({
            producto: item.nombre || item.producto,
            categoria: item.categoria || 'OTRO',
            cantidad: parseInt(item.cantidad) || 1,
            unidad: item.unidad || 'pzas',
            observaciones: item.observaciones || null
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
   * Marcar solicitud como entregada, total o parcialmente (Admin/Compras).
   * @param {string} id
   * @param {string} entregadoPorId
   * @param {string} userId
   * @param {Array<{itemId: string, cantidad: number}>} entregas - cantidad que se entrega
   *   EN ESTA RONDA por cada ítem (no el acumulado). Los ítems que no aparezcan aquí, o
   *   con cantidad 0, no se tocan. Se puede llamar varias veces sobre la misma solicitud
   *   mientras queden ítems con saldo pendiente.
   */
  static async deliverRequest(id, entregadoPorId, userId, entregas) {
    const request = await prisma.stationeryRequest.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!request) throw new Error('Solicitud no encontrada');
    if (!['PENDIENTE', 'ENTREGADO_PARCIAL'].includes(request.estatus)) {
      throw new Error('Solo puedes entregar solicitudes pendientes o parcialmente entregadas');
    }
    if (!entregas || entregas.length === 0) {
      throw new Error('Debe indicar la cantidad a entregar de al menos un artículo');
    }

    const itemsById = new Map(request.items.map(item => [item.id, item]));
    const entregasValidas = entregas.filter(e => e && parseInt(e.cantidad) > 0);

    if (entregasValidas.length === 0) {
      throw new Error('Debe indicar la cantidad a entregar de al menos un artículo');
    }

    // Validar que cada entrega no exceda el saldo pendiente del ítem
    for (const entrega of entregasValidas) {
      const item = itemsById.get(entrega.itemId);
      if (!item) throw new Error(`El artículo ${entrega.itemId} no pertenece a esta solicitud`);
      const saldo = item.cantidad - item.cantidadEntregada;
      const cantidad = parseInt(entrega.cantidad);
      if (cantidad > saldo) {
        throw new Error(`No puedes entregar ${cantidad} de "${item.producto}", solo quedan ${saldo} pendientes`);
      }
    }

    // Modo estricto (interruptor de Admin): bloquea si falta inventario o no
    // alcanza el stock. Modo permisivo (default): registra la entrega igual,
    // crea el renglón de inventario si no existe y deja el stock en negativo
    // si hace falta — al cargar inventario real, el negativo se corrige solo.
    const strict = await isInventoryStrictMode();

    if (strict) {
      for (const entrega of entregasValidas) {
        const item = itemsById.get(entrega.itemId);
        const cantidad = parseInt(entrega.cantidad);
        const inv = await prisma.stationeryInventory.findUnique({ where: { producto: item.producto } });
        if (!inv) {
          throw new Error(`No existe en inventario: ${item.producto}`);
        }
        if (inv.cantidadActual < cantidad) {
          throw new Error(`Stock insuficiente de ${item.producto}: hay ${inv.cantidadActual}, se requieren ${cantidad}`);
        }
      }
    }

    // Descontar stock de papelería + registrar salida (kardex) solo por lo entregado en esta ronda
    for (const entrega of entregasValidas) {
      const item = itemsById.get(entrega.itemId);
      const cantidad = parseInt(entrega.cantidad);

      await prisma.stationeryItem.update({
        where: { id: item.id },
        data: { cantidadEntregada: { increment: cantidad } }
      });

      const inv = await prisma.stationeryInventory.findUnique({ where: { producto: item.producto } });
      if (inv) {
        const nuevo = inv.cantidadActual - cantidad;
        await prisma.stationeryInventory.update({ where: { id: inv.id }, data: { cantidadActual: nuevo } });
        await recordMovement(null, {
          tipo: 'PAPELERIA', tipoMovimiento: 'SALIDA',
          itemId: inv.id, itemDescripcion: inv.producto,
          cantidad, stockAnterior: inv.cantidadActual, stockNuevo: nuevo,
          referencia: 'Entrega de papelería', usuarioId: userId
        });
      } else {
        const nuevoInv = await prisma.stationeryInventory.create({
          data: { producto: item.producto, categoria: item.categoria || 'OTRO', cantidadActual: -cantidad }
        });
        await recordMovement(null, {
          tipo: 'PAPELERIA', tipoMovimiento: 'SALIDA',
          itemId: nuevoInv.id, itemDescripcion: nuevoInv.producto,
          cantidad, stockAnterior: 0, stockNuevo: nuevoInv.cantidadActual,
          referencia: 'Entrega de papelería (sin inventario previo, modo permisivo)', usuarioId: userId
        });
      }
    }

    // Recalcular el estatus general de la solicitud según lo entregado a la fecha
    const itemsActualizados = await prisma.stationeryItem.findMany({ where: { requestId: id } });
    const todoEntregado = itemsActualizados.every(item => item.cantidadEntregada >= item.cantidad);

    return prisma.stationeryRequest.update({
      where: { id },
      data: {
        estatus: todoEntregado ? 'ENTREGADO' : 'ENTREGADO_PARCIAL',
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

  /**
   * El solicitante cierra su propia solicitud parcialmente entregada,
   * aceptando lo recibido sin esperar el resto.
   */
  static async closeRequest(id, employeeId) {
    const request = await prisma.stationeryRequest.findUnique({ where: { id } });

    if (!request) throw new Error('Solicitud no encontrada');
    if (request.solicitanteId !== employeeId) throw new Error('No puedes cerrar una solicitud que no te pertenece');
    if (request.estatus !== 'ENTREGADO_PARCIAL') {
      throw new Error('Solo puedes cerrar solicitudes con entrega parcial');
    }

    return prisma.stationeryRequest.update({
      where: { id },
      data: { estatus: 'ENTREGADO' },
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
