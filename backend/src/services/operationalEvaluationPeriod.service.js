/**
 * Servicio de Alertas de Evaluación Operativa Trimestral
 *
 * A diferencia del periodo de prueba (30/60/90 días, con fecha de corte),
 * esta evaluación es continua: cada 90 días desde la fecha de contratación,
 * mientras el empleado siga activo en uno de los 6 puestos operativos
 * elegibles (ver operationalEvaluationCriteria.config.js), se genera un
 * nuevo registro OperationalEvaluation pendiente de captura por su jefe
 * directo. No hay autoevaluación del colaborador — el formato de RH solo
 * contempla al "Jefe Directo" como evaluador.
 *
 * Calca el patrón de diasTranscurridos/dedupe de probationPeriod.service.js.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('./email.service');
const { getTemplateByPuestoNombre } = require('../config/operationalEvaluationCriteria.config');

const TRIMESTRE_DIAS = 90;

function getNombreCompleto(emp) {
  return `${emp.nombres || emp.nombre || ''} ${emp.apellidoPaterno || ''} ${emp.apellidoMaterno || ''}`.trim();
}

// Días exactos transcurridos desde fechaAlta, en UTC (mismo cálculo que
// probationPeriod.service.js, evita el bug de zona horaria del proyecto).
function diasTranscurridos(fechaAlta) {
  const altaDate = new Date(fechaAlta);
  const altaUTC = Date.UTC(altaDate.getUTCFullYear(), altaDate.getUTCMonth(), altaDate.getUTCDate());
  const hoy = new Date();
  const hoyUTC = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.floor((hoyUTC - altaUTC) / 86400000);
}

async function getDestinatariosRH() {
  return prisma.user.findMany({
    where: { role: 'RH', isActive: true },
    select: { email: true, name: true }
  });
}

async function crearEvaluacionPendiente(emp, periodo, resultado) {
  const { evaluation, created } = await prisma.$transaction(async (tx) => {
    const existing = await tx.operationalEvaluation.findUnique({
      where: { empleadoId_periodo: { empleadoId: emp.id, periodo } }
    });
    if (existing) return { evaluation: existing, created: false };

    const nueva = await tx.operationalEvaluation.create({
      data: {
        empleadoId: emp.id,
        puesto: emp.puesto.nombre,
        periodo,
        fechaProgramada: new Date(),
        resultado: 'PENDIENTE'
      }
    });
    return { evaluation: nueva, created: true };
  });

  if (!created) return;

  const nombreEmpleado = getNombreCompleto(emp);
  resultado.evaluacionesCreadas.push(`${nombreEmpleado} (${emp.puesto.nombre}, trimestre ${periodo})`);

  const destinatarios = await getDestinatariosRH();
  if (emp.reportaA?.user?.email) {
    destinatarios.push({ email: emp.reportaA.user.email, name: emp.reportaA.user.name });
  }
  for (const dest of destinatarios) {
    await emailService.sendOperationalEvaluationDue(dest.email, dest.name, nombreEmpleado, emp.puesto.nombre, periodo);
  }
}

async function checkAndNotify() {
  const resultado = { evaluacionesCreadas: [] };

  try {
    console.log('\n🔍 Verificando evaluaciones operativas trimestrales...');

    const empleados = await prisma.employee.findMany({
      where: { estatus: 'Activo' },
      include: {
        puesto: true,
        reportaA: { include: { user: { select: { email: true, name: true } } } }
      }
    });

    for (const emp of empleados) {
      if (!emp.fechaAlta || !emp.puesto) continue;
      if (!getTemplateByPuestoNombre(emp.puesto.nombre)) continue; // no es uno de los 6 puestos elegibles

      const dias = diasTranscurridos(emp.fechaAlta);
      if (dias <= 0 || dias % TRIMESTRE_DIAS !== 0) continue;

      const periodo = dias / TRIMESTRE_DIAS;
      await crearEvaluacionPendiente(emp, periodo, resultado);
    }

    console.log(`✅ Evaluación operativa: ${resultado.evaluacionesCreadas.length} evaluaciones creadas`);
    return resultado;
  } catch (err) {
    console.error('❌ Error en checkAndNotify (evaluación operativa):', err.message);
    throw err;
  }
}

module.exports = { checkAndNotify, diasTranscurridos, TRIMESTRE_DIAS };
