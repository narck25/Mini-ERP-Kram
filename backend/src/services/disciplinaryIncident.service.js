const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const hrAudit = require('./hrAudit.service');

// RH/ADMIN siempre pueden gestionar. Cualquier otro usuario solo si es el jefe
// directo del empleado (mismo patrón usado en vacation.service.js).
const canManage = async (user, employeeId) => {
  if (user.role === 'ADMIN' || user.role === 'RH') return true;
  if (!user.employeeId) return false;
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { reportaAId: true } });
  return !!employee && employee.reportaAId === user.employeeId;
};

const create = async (data, user, archivoUrl, req) => {
  const { empleadoId, tipo, fecha, motivo } = data;

  if (!empleadoId || !tipo || !fecha || !motivo) {
    const err = new Error('Faltan campos requeridos: empleadoId, tipo, fecha, motivo');
    err.status = 400;
    throw err;
  }

  if (!(await canManage(user, empleadoId))) {
    const err = new Error('No tienes permisos para registrar incidencias de este empleado');
    err.status = 403;
    throw err;
  }

  const incident = await prisma.disciplinaryIncident.create({
    data: {
      empleadoId,
      tipo,
      fecha: new Date(fecha),
      motivo,
      registradoPorId: user.id,
      archivoUrl: archivoUrl || null
    }
  });

  await hrAudit.logWithReq(
    hrAudit.ENTIDADES.DISCIPLINARY_INCIDENT, incident.id, user.id, hrAudit.ACCIONES.CREACION,
    null, { empleadoId, tipo, fecha: incident.fecha, motivo }, req
  ).catch(err => console.error('Error registrando auditoría de RH:', err.message));

  return incident;
};

const update = async (id, data, user, req) => {
  const existing = await prisma.disciplinaryIncident.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Incidencia no encontrada');
    err.status = 404;
    throw err;
  }

  if (!(await canManage(user, existing.empleadoId))) {
    const err = new Error('No tienes permisos para editar esta incidencia');
    err.status = 403;
    throw err;
  }

  const { tipo, fecha, motivo } = data;
  const incident = await prisma.disciplinaryIncident.update({
    where: { id },
    data: {
      tipo: tipo || existing.tipo,
      fecha: fecha ? new Date(fecha) : existing.fecha,
      motivo: motivo || existing.motivo
    }
  });

  await hrAudit.logWithReq(
    hrAudit.ENTIDADES.DISCIPLINARY_INCIDENT, incident.id, user.id, hrAudit.ACCIONES.ACTUALIZACION,
    { tipo: existing.tipo, fecha: existing.fecha, motivo: existing.motivo },
    { tipo: incident.tipo, fecha: incident.fecha, motivo: incident.motivo },
    req
  ).catch(err => console.error('Error registrando auditoría de RH:', err.message));

  return incident;
};

const listByEmployee = async (employeeId, user) => {
  if (!(await canManage(user, employeeId))) {
    const err = new Error('No tienes permisos para ver las incidencias de este empleado');
    err.status = 403;
    throw err;
  }

  const [incidents, ultimos6Meses] = await Promise.all([
    prisma.disciplinaryIncident.findMany({
      where: { empleadoId: employeeId },
      orderBy: { fecha: 'desc' },
      include: { registradoPor: { select: { id: true, name: true, email: true } } }
    }),
    countLast6Months(employeeId)
  ]);

  return { incidents, resumen: { ultimos6Meses } };
};

const countLast6Months = async (employeeId) => {
  const hace6Meses = new Date();
  hace6Meses.setMonth(hace6Meses.getMonth() - 6);
  return prisma.disciplinaryIncident.count({
    where: { empleadoId: employeeId, fecha: { gte: hace6Meses } }
  });
};

module.exports = { canManage, create, update, listByEmployee, countLast6Months };
