const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const hrAudit = require('./hrAudit.service');
const { getTemplateByPuestoNombre, calcularResultado } = require('../config/operationalEvaluationCriteria.config');

const EMPLEADO_SELECT = {
  id: true, nombres: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true,
  fechaAlta: true, reportaAId: true,
  departamento: { select: { nombre: true } },
  puesto: { select: { nombre: true } }
};

const getPendingForRH = async () => {
  return prisma.operationalEvaluation.findMany({
    where: { resultado: 'PENDIENTE' },
    include: { empleado: { select: EMPLEADO_SELECT } },
    orderBy: { fechaProgramada: 'asc' }
  });
};

const getAll = async () => {
  return prisma.operationalEvaluation.findMany({
    include: {
      empleado: { select: EMPLEADO_SELECT },
      evaluador: { select: { id: true, name: true, email: true } }
    },
    orderBy: { fechaProgramada: 'desc' }
  });
};

const getPendingForJefe = async (user) => {
  if (!user.employeeId) return [];
  return prisma.operationalEvaluation.findMany({
    where: { resultado: 'PENDIENTE', empleado: { reportaAId: user.employeeId } },
    include: { empleado: { select: EMPLEADO_SELECT } },
    orderBy: { fechaProgramada: 'asc' }
  });
};

const getById = async (id, user) => {
  const evaluation = await prisma.operationalEvaluation.findUnique({
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

// Calcula subtotales por sección y calificación final (0-100) a partir de
// las calificaciones 1-5 capturadas, validando contra la plantilla fija del
// puesto (ver operationalEvaluationCriteria.config.js).
function calcularPuntaje(template, criteriosCapturados) {
  const secciones = ['rh', 'actitud', 'desempeno'];
  const subtotales = {};

  for (const seccion of secciones) {
    let subtotal = 0;
    for (const item of template[seccion]) {
      const calif = Number(criteriosCapturados?.[seccion]?.[item.key]);
      if (!Number.isInteger(calif) || calif < 1 || calif > 5) {
        const err = new Error(`Falta o es inválida la calificación de "${item.label}" (sección ${seccion})`);
        err.status = 400;
        throw err;
      }
      subtotal += (calif / 5) * item.peso;
    }
    subtotales[seccion] = Math.round(subtotal * 100) / 100;
  }

  const calificacionFinal = Math.round((subtotales.rh + subtotales.actitud + subtotales.desempeno) * 100) / 100;
  return { subtotales, calificacionFinal };
}

// Captura del jefe directo (o RH/ADMIN): sin autoevaluación previa — el
// formato de RH solo contempla al jefe directo como evaluador. El resultado
// (dictamen) se calcula automáticamente a partir del % logrado, no lo
// elige el evaluador (la tabla del PDF es una regla numérica, no un juicio).
const capturar = async (id, payload, user, req) => {
  const { criterios, fortalezas, areasMejora, compromisos, observaciones } = payload;

  const evaluation = await prisma.operationalEvaluation.findUnique({
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

  const template = getTemplateByPuestoNombre(evaluation.puesto);
  if (!template) {
    const err = new Error(`No hay una plantilla de criterios definida para el puesto "${evaluation.puesto}"`);
    err.status = 400;
    throw err;
  }

  const { subtotales, calificacionFinal } = calcularPuntaje(template, criterios);
  const resultado = calcularResultado(calificacionFinal);

  const updated = await prisma.operationalEvaluation.update({
    where: { id },
    data: {
      criterios,
      subtotalRH: subtotales.rh,
      subtotalActitud: subtotales.actitud,
      subtotalDesempeno: subtotales.desempeno,
      calificacionFinal,
      resultado,
      fortalezas: fortalezas || null,
      areasMejora: areasMejora || null,
      compromisos: compromisos || null,
      observaciones: observaciones || null,
      evaluadorId: user.id,
      fechaRealizada: new Date()
    }
  });

  await hrAudit.logWithReq(
    hrAudit.ENTIDADES.OPERATIONAL_EVALUATION, id, user.id, hrAudit.ACCIONES.EVALUACION_CAPTURADA,
    { resultado: evaluation.resultado }, { resultado: updated.resultado, calificacionFinal: updated.calificacionFinal }, req
  ).catch(err => console.error('Error registrando auditoría de RH:', err.message));

  return updated;
};

module.exports = { getPendingForRH, getAll, getPendingForJefe, getById, capturar };
