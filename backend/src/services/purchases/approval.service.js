/**
 * approval.service.js
 * ─────────────────────────────────────────────────────────────
 * REFACTORIZADO: Lógica de negocio para aprobaciones.
 * Responsabilidad: Obtener aprobadores potenciales, asignar
 *                  aprobadores a una solicitud.
 * ─────────────────────────────────────────────────────────────
 * Antes estaba en: purchase.controller.js (métodos
 *   getPotentialApprovers, assignApprovers)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// 1. Obtener empleados con roles gerenciales (posibles aprobadores)
// ─────────────────────────────────────────────────────────────
exports.getPotentialApprovers = async (requestId) => {
  const request = await prisma.purchaseRequest.findUnique({
    where: { id: requestId },
    select: { departamentoId: true }
  });

  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada' };
  }

  // Buscar empleados con nivel jerárquico gerencial
  const gerentes = await prisma.employee.findMany({
    where: {
      nivelJerarquico: { in: ['GERENTE', 'DIRECTOR', 'PRESIDENTE'] },
      estatus: 'Activo'
    },
    select: {
      id: true,
      nombres: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      nombre: true,
      nivelJerarquico: true,
      departamento_id: true,
      departamento: { select: { nombre: true } },
      user: { select: { id: true, email: true, role: true } }
    },
    orderBy: [
      { nivelJerarquico: 'asc' },
      { nombre: 'asc' }
    ]
  });

  // También buscar usuarios ADMIN/RH que no estén en la lista
  const adminRHUsers = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'RH'] },
      employee: { isNot: null }
    },
    select: {
      employee: {
        select: {
          id: true,
          nombres: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          nombre: true,
          nivelJerarquico: true,
          departamento_id: true,
          departamento: { select: { nombre: true } }
        }
      }
    }
  });

  // Combinar y deduplicar
  const gerentesMap = new Map();
  gerentes.forEach(g => gerentesMap.set(g.id, g));
  adminRHUsers.forEach(u => {
    if (u.employee && !gerentesMap.has(u.employee.id)) {
      gerentesMap.set(u.employee.id, u.employee);
    }
  });

  return Array.from(gerentesMap.values()).map(e => ({
    id: e.id,
    nombre: e.nombre || `${e.nombres || ''} ${e.apellidoPaterno || ''} ${e.apellidoMaterno || ''}`.trim(),
    nivelJerarquico: e.nivelJerarquico,
    departamento: e.departamento?.nombre || '',
    departamento_id: e.departamento_id,
    email: e.user?.email || ''
  }));
};

// ─────────────────────────────────────────────────────────────
// 2. Asignar aprobadores a una solicitud
// ─────────────────────────────────────────────────────────────
exports.assignApprovers = async (requestId, approverIds) => {
  if (!approverIds || !Array.isArray(approverIds) || approverIds.length === 0) {
    throw { status: 400, error: 'Datos inválidos', message: 'Debe seleccionar al menos un aprobador' };
  }

  const request = await prisma.purchaseRequest.findUnique({
    where: { id: requestId },
    select: { id: true, estatus: true }
  });

  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada' };
  }

  // Eliminar aprobadores anteriores y crear los nuevos
  await prisma.$transaction([
    prisma.purchaseApprover.deleteMany({ where: { requestId } }),
    ...approverIds.map(employeeId =>
      prisma.purchaseApprover.create({
        data: { requestId, employeeId, estatus: 'PENDIENTE' }
      })
    )
  ]);

  // Cambiar estatus a EN_AUTORIZACION
  await prisma.purchaseRequest.update({
    where: { id: requestId },
    data: { estatus: 'EN_AUTORIZACION', requiereAutorizacion: true }
  });

  // Obtener aprobadores asignados con datos
  return prisma.purchaseApprover.findMany({
    where: { requestId },
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
  });
};
