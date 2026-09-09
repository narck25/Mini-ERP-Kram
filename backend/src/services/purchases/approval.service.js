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

  const EMPLOYEE_SELECT = {
    id: true,
    nombres: true,
    apellidoPaterno: true,
    apellidoMaterno: true,
    nombre: true,
    nivelJerarquico: true,
    departamento_id: true,
    departamento: { select: { nombre: true } },
    user: { select: { id: true, email: true, role: true } }
  };

  // Director general: nivel DIRECTOR que reporta directamente al Presidente.
  // (Excluye subdirecciones, que en la captura también quedan marcadas como DIRECTOR
  // pero reportan al Director general, no al Presidente.)
  const directores = await prisma.employee.findMany({
    where: {
      nivelJerarquico: 'DIRECTOR',
      estatus: 'Activo',
      reportaA: { nivelJerarquico: 'PRESIDENTE' }
    },
    select: EMPLOYEE_SELECT
  });

  // Presidente: siempre elegible, además cubre el hueco cuando no hay nadie
  // en nivel DIRECTOR (p. ej. si la captura de RH aún no tiene un Director real).
  const presidentes = await prisma.employee.findMany({
    where: {
      nivelJerarquico: 'PRESIDENTE',
      estatus: 'Activo'
    },
    select: EMPLOYEE_SELECT
  });

  // Gerente de Finanzas: nivel GERENTE dentro del área de Finanzas
  // (el nivel GERENTE por sí solo incluye también Ventas, Operaciones, etc.)
  const gerentesFinanzas = await prisma.employee.findMany({
    where: {
      nivelJerarquico: 'GERENTE',
      estatus: 'Activo',
      area: { contains: 'FINANZAS', mode: 'insensitive' }
    },
    select: EMPLOYEE_SELECT
  });

  // Usuarios ADMIN (pueden aprobar cualquier compra, tengan o no empleado asociado)
  const adminUsers = await prisma.user.findMany({
    where: {
      role: 'ADMIN',
      employee: { isNot: null }
    },
    select: {
      employee: { select: EMPLOYEE_SELECT }
    }
  });

  // Jefe de Compras: rol COMPRAS + nivel JEFE (no el resto del equipo de Compras,
  // que también tiene rol COMPRAS pero nivel OPERATIVO/ANALISTA)
  const jefesCompras = await prisma.user.findMany({
    where: {
      role: 'COMPRAS',
      employee: { nivelJerarquico: 'JEFE' }
    },
    select: {
      employee: { select: EMPLOYEE_SELECT }
    }
  });

  // Combinar y deduplicar
  const gerentesMap = new Map();
  [...directores, ...presidentes, ...gerentesFinanzas].forEach(g => gerentesMap.set(g.id, g));
  [...adminUsers, ...jefesCompras].forEach(u => {
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
