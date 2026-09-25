const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const hrAudit = require('./hrAudit.service');
const emailService = require('./email.service');

const TIPO_LABEL = { DIA_30: '30 días', DIA_60: '60 días', DIA_90: '90 días' };

function getNombreCompleto(emp) {
  return `${emp.nombres || emp.nombre || ''} ${emp.apellidoPaterno || ''} ${emp.apellidoMaterno || ''}`.trim();
}

async function getDestinatariosEvaluador(empleadoId) {
  const [rhUsers, empleado] = await Promise.all([
    prisma.user.findMany({ where: { role: 'RH', isActive: true }, select: { email: true, name: true } }),
    prisma.employee.findUnique({
      where: { id: empleadoId },
      select: { reportaA: { select: { user: { select: { email: true, name: true } } } } }
    })
  ]);
  const destinatarios = [...rhUsers];
  if (empleado?.reportaA?.user?.email) destinatarios.push(empleado.reportaA.user);
  return destinatarios;
}

const EMPLEADO_SELECT = {
  id: true, nombres: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true,
  fechaAlta: true, reportaAId: true,
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

// Detalle completo de una evaluación (autoevaluación + captura), para la
// página de captura del evaluador. Mismo control de acceso que `capturar`.
const getById = async (id, user) => {
  const evaluation = await prisma.probationEvaluation.findUnique({
    where: { id },
    include: {
      empleado: { select: EMPLEADO_SELECT },
      evaluador: { select: { id: true, name: true, email: true } }
    }
  });
  if (!evaluation) {
    const err = new Error('Evaluación no encontrada');
    err.status = 404;
    throw err;
  }

  const esRHoAdmin = user.role === 'ADMIN' || user.role === 'RH';
  const esJefeDirecto = !!user.employeeId && evaluation.empleado.reportaAId === user.employeeId;
  if (!esRHoAdmin && !esJefeDirecto) {
    const err = new Error('No tienes permisos para ver esta evaluación');
    err.status = 403;
    throw err;
  }

  return evaluation;
};

// El propio colaborador: sus evaluaciones ya creadas (30/60/90) a las que
// todavía no les envía su autoevaluación (paso 1 del formato de RH).
const getPendingForColaborador = async (user) => {
  if (!user.employeeId) return [];
  return prisma.probationEvaluation.findMany({
    where: { empleadoId: user.employeeId, resultado: 'PENDIENTE', autoevaluacionCompletadaAt: null },
    orderBy: { fechaProgramada: 'asc' }
  });
};

// Paso 1 — el colaborador llena su propia autoevaluación (sección 5 del PDF).
const submitAutoevaluacion = async (id, payload, user, req) => {
  const { logros, retos, apoyo, integracion, claridadFunciones, climaLaboral } = payload;

  const evaluation = await prisma.probationEvaluation.findUnique({
    where: { id },
    include: {
      empleado: { select: { id: true, userId: true, nombres: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true } }
    }
  });
  if (!evaluation) {
    const err = new Error('Evaluación no encontrada');
    err.status = 404;
    throw err;
  }
  if (evaluation.empleado.userId !== user.id) {
    const err = new Error('No tienes permisos para llenar esta autoevaluación');
    err.status = 403;
    throw err;
  }
  if (evaluation.autoevaluacionCompletadaAt) {
    const err = new Error('Ya enviaste tu autoevaluación para este periodo');
    err.status = 400;
    throw err;
  }

  const escalas = { integracion, claridadFunciones, climaLaboral };
  for (const [key, val] of Object.entries(escalas)) {
    const n = Number(val);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      const err = new Error(`El valor de "${key}" debe ser un entero entre 1 y 5`);
      err.status = 400;
      throw err;
    }
  }

  const updated = await prisma.probationEvaluation.update({
    where: { id },
    data: {
      autoevaluacion: {
        logros: logros || '',
        retos: retos || '',
        apoyo: apoyo || '',
        integracion: Number(integracion),
        claridadFunciones: Number(claridadFunciones),
        climaLaboral: Number(climaLaboral)
      },
      autoevaluacionCompletadaAt: new Date()
    }
  });

  await hrAudit.logWithReq(
    hrAudit.ENTIDADES.PROBATION_EVALUATION, id, user.id, hrAudit.ACCIONES.ACTUALIZACION,
    null, { autoevaluacionCompletadaAt: updated.autoevaluacionCompletadaAt }, req
  ).catch(err => console.error('Error registrando auditoría de RH:', err.message));

  const nombreEmpleado = getNombreCompleto(evaluation.empleado);
  const destinatarios = await getDestinatariosEvaluador(evaluation.empleado.id);
  for (const dest of destinatarios) {
    try {
      await emailService.sendProbationSelfEvalCompleted(dest.email, dest.name, nombreEmpleado, TIPO_LABEL[evaluation.tipo]);
    } catch (err) {
      console.error('Error enviando correo de autoevaluación completada:', err.message);
    }
  }

  return updated;
};

// Paso 2 — el evaluador (RH/ADMIN o jefe directo) captura el resto del
// formato: objetivos, competencias, hábitos, diagnóstico, plan de acción y
// dictamen institucional (reutiliza `resultado`, ver probationCriteria.config.js).
const capturar = async (id, payload, user, req) => {
  const {
    resultado, comentarios,
    objetivos, competencias, habitos,
    fortalezas, areasMejora, planAccion,
    minutaRetroalimentacion
  } = payload;

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

  if (!evaluation.autoevaluacionCompletadaAt) {
    const err = new Error('El colaborador todavía no completa su autoevaluación. Espera a que la envíe antes de capturar el resultado.');
    err.status = 400;
    throw err;
  }

  const updated = await prisma.probationEvaluation.update({
    where: { id },
    data: {
      resultado,
      comentarios: comentarios || null,
      objetivos: objetivos ?? undefined,
      competencias: competencias ?? undefined,
      habitos: habitos ?? undefined,
      fortalezas: fortalezas ?? undefined,
      areasMejora: areasMejora ?? undefined,
      planAccion: planAccion ?? undefined,
      minutaRetroalimentacion: minutaRetroalimentacion || null,
      evaluadorId: user.id,
      fechaRealizada: new Date()
    }
  });

  await hrAudit.logWithReq(
    hrAudit.ENTIDADES.PROBATION_EVALUATION, id, user.id, hrAudit.ACCIONES.EVALUACION_CAPTURADA,
    { resultado: evaluation.resultado }, { resultado: updated.resultado, comentarios: updated.comentarios }, req
  ).catch(err => console.error('Error registrando auditoría de RH:', err.message));

  return updated;
};

module.exports = {
  getPendingForRH, getAll, getPendingForJefe, capturar, getById,
  getPendingForColaborador, submitAutoevaluacion
};
