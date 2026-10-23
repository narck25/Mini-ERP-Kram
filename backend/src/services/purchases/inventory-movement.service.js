/**
 * inventory-movement.service.js
 * ─────────────────────────────────────────────────────────────
 * Kardex de inventario: registro de ingresos, salidas y ajustes.
 * Cada cambio de stock en papelería o uniformes queda auditado.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Registrar un movimiento de inventario.
 * @param {object|null} tx - Transacción Prisma (opcional)
 * @param {object} data - { tipo, tipoMovimiento, itemId, itemDescripcion,
 *                          cantidad, stockAnterior, stockNuevo, referencia, usuarioId }
 */
async function recordMovement(tx, data) {
  const db = tx || prisma;
  return db.inventoryMovement.create({
    data: {
      tipo: data.tipo,
      tipoMovimiento: data.tipoMovimiento,
      itemId: data.itemId || null,
      itemDescripcion: data.itemDescripcion,
      cantidad: data.cantidad,
      stockAnterior: data.stockAnterior,
      stockNuevo: data.stockNuevo,
      referencia: data.referencia || null,
      usuarioId: data.usuarioId || null
    }
  });
}

/**
 * Listar movimientos (kardex) con filtros.
 */
async function listMovements(filters = {}) {
  const where = {};
  if (filters.tipo) where.tipo = filters.tipo;
  if (filters.tipoMovimiento) where.tipoMovimiento = filters.tipoMovimiento;
  if (filters.itemId) where.itemId = filters.itemId;

  // Antes solo existía `take` (tope de 500) sin `skip`, por lo que la UI
  // nunca podía avanzar más allá de los movimientos más recientes. Se agrega
  // page/skip con la misma fórmula usada en el resto de módulos de Compras,
  // manteniendo el tope de 500 en el límite.
  const pageNum = Math.max(1, parseInt(filters.page) || 1);
  const limitNum = Math.min(500, Math.max(1, parseInt(filters.limit) || 100));
  const skip = (pageNum - 1) * limitNum;

  const [movements, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      include: {
        usuario: { select: { id: true, name: true, email: true } }
      }
    }),
    prisma.inventoryMovement.count({ where })
  ]);

  return {
    movements,
    total,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
  };
}

module.exports = { recordMovement, listMovements };
