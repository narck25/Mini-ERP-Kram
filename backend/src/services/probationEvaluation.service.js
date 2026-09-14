const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const hrAudit = require('./hrAudit.service');

const EMPLEADO_SELECT = {
  id: true, nombres: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true,
  fechaAlta: true,
  departamento: { select: { nombre: true } },
  puesto: { select: { nombre: true } }
};

const getPendingForRH = async () => {
  return prisma.probationEvaluation.findMany({
    where: { resultado: 'PENDIENTE' },
    include: { empleado: { select: EMPLEADO_SELECT } },
    orderBy: { fechaProgramada: 'asc' }
  });
};

const getAll = async () => {
  return prisma.probationEvaluation.findMany({
    include: {
      empleado: { select: EMPLEADO_SELECT },
      evaluador: { select: { id: true, name: true, email: true } }
    },
    orderBy: { fechaProgramada: 'desc' }
  });
};

const getPendingForJefe = async (user) => {
  if (!user.employeeId) return [];
  return prisma.probationEvaluation.findMany({
    where: { resultado: 'PENDIENTE', empleado: { reportaAId: user.employeeId } },
    include: { empleado: { select: EMPLEADO_SELECT } },
    orderBy: { fechaProgramada: 'asc' }
  });
};

const capturar = async (id, { resultado, comentarios }, user, req) => {
  if (!['APROBADO', 'NO_APROBADO', 'EXTENDIDO'].includes(resultado)) {
    const err = new Error('Resultado inválido. Debe ser APROBADO, NO_APROBADO o EXTENDIDO');
    err.status = 400;
    throw err;
  }

  const evaluation = await prisma.probationEvaluation.findUnique({
    where: { id },
    include: { empleado: { select: { id: true, reportaAId: true } } }
  });
  if (!evaluation) {
    const err = new Error('Evaluación no encontrada');
    err.status = 404;
    throw err;
  }

  const esRHoAdmin = user.role === 'ADMIN' || user.role === 'RH';
  const esJefeDirecto = !!user.employeeId && evaluation.empleado.reportaAId === user.employeeId;
  if (!esRHoAdmin && !esJefeDirecto) {
    const err = new Error('No tienes permisos para capturar esta evaluación');
    err.status = 403;
    throw err;
  }

  const updated = await prisma.probationEvaluation.update({
    where: { id },
    data: { resultado, comentarios: comentarios || null, evaluadorId: user.id, fechaRealizada: new Date() }
  });

  await hrAudit.logWithReq(
    hrAudit.ENTIDADES.PROBATION_EVALUATION, id, user.id, hrAudit.ACCIONES.EVALUACION_CAPTURADA,
    { resultado: evaluation.resultado }, { resultado: updated.resultado, comentarios: updated.comentarios }, req
  ).catch(err => console.error('Error registrando auditoría de RH:', err.message));

  return updated;
};

module.exports = { getPendingForRH, getAll, getPendingForJefe, capturar };
