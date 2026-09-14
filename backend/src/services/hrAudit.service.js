/**
 * hrAudit.service.js
 * ─────────────────────────────────────────────────────────────
 * Sistema de auditoría genérico de RH. Calca el patrón de
 * audit.service.js (Compras), generalizado con entidadTipo para
 * poder auditar Employee, VacationRequest, Incapacidad,
 * DisciplinaryIncident y ProbationEvaluation con el mismo modelo.
 *
 * Uso:
 *   const hrAudit = require('../services/hrAudit.service');
 *   await hrAudit.logWithReq('EMPLOYEE', employee.id, req.user.id,
 *     hrAudit.ACCIONES.ACTUALIZACION, valorAnterior, valorNuevo, req);
 * ─────────────────────────────────────────────────────────────
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ACCIONES = {
  CREACION: 'CREACION',
  ACTUALIZACION: 'ACTUALIZACION',
  BAJA: 'BAJA',
  APROBACION: 'APROBACION',
  RECHAZO: 'RECHAZO',
  CANCELACION: 'CANCELACION',
  AUTORIZACION_JEFE: 'AUTORIZACION_JEFE',
  REINCORPORACION: 'REINCORPORACION',
  EVALUACION_CAPTURADA: 'EVALUACION_CAPTURADA'
};

const ENTIDADES = {
  EMPLOYEE: 'EMPLOYEE',
  VACATION: 'VACATION',
  INCAPACIDAD: 'INCAPACIDAD',
  DISCIPLINARY_INCIDENT: 'DISCIPLINARY_INCIDENT',
  PROBATION_EVALUATION: 'PROBATION_EVALUATION'
};

const extractRequestMeta = (req) => {
  if (!req) return { ip: null, userAgent: null };

  const ip = req.ip ||
    req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    null;

  const userAgent = req.headers?.['user-agent'] || null;

  return { ip, userAgent };
};

const log = async (entidadTipo, entidadId, userId, accion, valorAnterior = null, valorNuevo = null, req = null) => {
  const { ip, userAgent } = extractRequestMeta(req);

  return prisma.hrAuditLog.create({
    data: {
      entidadTipo,
      entidadId,
      userId,
      accion,
      valorAnterior: valorAnterior ? JSON.parse(JSON.stringify(valorAnterior)) : null,
      valorNuevo: valorNuevo ? JSON.parse(JSON.stringify(valorNuevo)) : null,
      ip,
      userAgent
    }
  });
};

const logWithReq = async (entidadTipo, entidadId, userId, accion, valorAnterior, valorNuevo, req) => {
  return log(entidadTipo, entidadId, userId, accion, valorAnterior, valorNuevo, req);
};

const enrichWithUsers = async (logs) => {
  const userIds = [...new Set(logs.map(l => l.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  return logs.map(l => ({
    ...l,
    usuario: userMap.get(l.userId) || { id: l.userId, name: 'Desconocido', email: '' }
  }));
};

// Historial de una sola entidad (p.ej. una VacationRequest o una Incapacidad puntual)
const getHistory = async (entidadTipo, entidadId) => {
  const logs = await prisma.hrAuditLog.findMany({
    where: { entidadTipo, entidadId },
    orderBy: { createdAt: 'asc' }
  });
  return enrichWithUsers(logs);
};

// Historial consolidado del expediente de un empleado: junta EMPLOYEE (entidadId = employeeId)
// con VACATION/INCAPACIDAD/DISCIPLINARY_INCIDENT/PROBATION_EVALUATION (entidadId = id del
// registro correspondiente, resueltos primero ya que no son el id del empleado).
const getHistoryByEmployee = async (employeeId) => {
  const [vacations, incapacidades, incidents, evaluations] = await Promise.all([
    prisma.vacationRequest.findMany({ where: { employeeId }, select: { id: true } }),
    prisma.incapacidad.findMany({ where: { employeeId }, select: { id: true } }),
    prisma.disciplinaryIncident.findMany({ where: { empleadoId: employeeId }, select: { id: true } }),
    prisma.probationEvaluation.findMany({ where: { empleadoId: employeeId }, select: { id: true } })
  ]);

  const where = {
    OR: [
      { entidadTipo: ENTIDADES.EMPLOYEE, entidadId: employeeId },
      { entidadTipo: ENTIDADES.VACATION, entidadId: { in: vacations.map(v => v.id) } },
      { entidadTipo: ENTIDADES.INCAPACIDAD, entidadId: { in: incapacidades.map(i => i.id) } },
      { entidadTipo: ENTIDADES.DISCIPLINARY_INCIDENT, entidadId: { in: incidents.map(i => i.id) } },
      { entidadTipo: ENTIDADES.PROBATION_EVALUATION, entidadId: { in: evaluations.map(e => e.id) } }
    ]
  };

  const logs = await prisma.hrAuditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  return enrichWithUsers(logs);
};

module.exports = {
  ACCIONES,
  ENTIDADES,
  log,
  logWithReq,
  getHistory,
  getHistoryByEmployee
};
