/**
 * Servicio de Alertas y Evaluaciones de Periodo de Prueba
 *
 * Verifica diariamente la antigüedad exacta (en días) de cada empleado activo:
 * - A los 20/50/80 días: recordatorio por correo a RH y al jefe directo, avisando
 *   que se acerca la evaluación de 30/60/90 días.
 * - A los 30/60/90 días exactos: crea (si no existe) el registro ProbationEvaluation
 *   en estatus PENDIENTE para que RH/jefe lo capturen en el sistema.
 *
 * Calca el patrón de birthdayAnniversary.service.js (cálculo en UTC, deduplicación
 * vía NotificationLog, resolución de destinatarios RH).
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('./email.service');

function getNombreCompleto(emp) {
  return `${emp.nombres || emp.nombre || ''} ${emp.apellidoPaterno || ''} ${emp.apellidoMaterno || ''}`.trim();
}

// Días exactos transcurridos desde fechaAlta, en UTC (evita el bug de zona horaria
// del resto del proyecto).
function diasTranscurridos(fechaAlta) {
  const altaDate = new Date(fechaAlta);
  const altaUTC = Date.UTC(altaDate.getUTCFullYear(), altaDate.getUTCMonth(), altaDate.getUTCDate());
  const hoy = new Date();
  const hoyUTC = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.floor((hoyUTC - altaUTC) / 86400000);
}

async function yaNotificadoHoy(employeeId, tipo) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  const existente = await prisma.notificationLog.findFirst({
    where: { employeeId, tipo, enviadoA: { gte: hoy, lt: manana }, estatus: 'ENVIADO' }
  });
  return !!existente;
}

async function registrarLog(tipo, employeeId, employeeName, email, estatus, errorMsg = null) {
  try {
    await prisma.notificationLog.create({ data: { tipo, employeeId, employeeName, email, estatus, errorMsg } });
  } catch (err) {
    console.error('❌ Error al registrar log de notificación:', err.message);
  }
}

async function getDestinatariosRH() {
  return prisma.user.findMany({
    where: { role: 'RH', isActive: true },
    select: { email: true, name: true }
  });
}

const RECORDATORIOS = [
  { dias: 20, tipoLog: 'PRUEBA_RECORDATORIO_20', tipoEvaluacion: 'DIA_30' },
  { dias: 50, tipoLog: 'PRUEBA_RECORDATORIO_50', tipoEvaluacion: 'DIA_60' },
  { dias: 80, tipoLog: 'PRUEBA_RECORDATORIO_80', tipoEvaluacion: 'DIA_90' }
];

const EVALUACIONES = [
  { dias: 30, tipo: 'DIA_30' },
  { dias: 60, tipo: 'DIA_60' },
  { dias: 90, tipo: 'DIA_90' }
];

const TIPO_LABEL = { DIA_30: '30 días', DIA_60: '60 días', DIA_90: '90 días' };

async function enviarRecordatorio(emp, recordatorio, resultado) {
  const yaNotificado = await yaNotificadoHoy(emp.id, recordatorio.tipoLog);
  if (yaNotificado) return;

  const nombreEmpleado = getNombreCompleto(emp);
  const destinatarios = await getDestinatariosRH();
  if (emp.reportaA?.user?.email) {
    destinatarios.push({ email: emp.reportaA.user.email, name: emp.reportaA.user.name });
  }

  let algunEnviado = false;
  for (const dest of destinatarios) {
    const enviado = await emailService.sendProbationReminder(
      dest.email, dest.name, nombreEmpleado, recordatorio.dias, TIPO_LABEL[recordatorio.tipoEvaluacion]
    );
    if (enviado) algunEnviado = true;
  }

  await registrarLog(
    recordatorio.tipoLog, emp.id, nombreEmpleado,
    destinatarios.map(d => d.email).join(', '),
    algunEnviado ? 'ENVIADO' : 'FALLIDO',
    algunEnviado ? null : 'Error al enviar email'
  );

  if (algunEnviado) {
    resultado.recordatorios.enviados++;
    resultado.recordatorios.empleados.push(`${nombreEmpleado} (${recordatorio.dias} días)`);
  } else {
    resultado.recordatorios.fallidos++;
  }
}

async function crearEvaluacionPendiente(emp, evalCfg, resultado) {
  const { evaluation, created } = await prisma.$transaction(async (tx) => {
    const existing = await tx.probationEvaluation.findUnique({
      where: { empleadoId_tipo: { empleadoId: emp.id, tipo: evalCfg.tipo } }
    });
    if (existing) return { evaluation: existing, created: false };

    const nueva = await tx.probationEvaluation.create({
      data: { empleadoId: emp.id, tipo: evalCfg.tipo, fechaProgramada: new Date(), resultado: 'PENDIENTE' }
    });
    return { evaluation: nueva, created: true };
  });

  if (!created) return;

  resultado.evaluacionesCreadas.push(`${getNombreCompleto(emp)} (${TIPO_LABEL[evalCfg.tipo]})`);

  const nombreEmpleado = getNombreCompleto(emp);
  const destinatarios = await getDestinatariosRH();
  if (emp.reportaA?.user?.email) {
    destinatarios.push({ email: emp.reportaA.user.email, name: emp.reportaA.user.name });
  }
  for (const dest of destinatarios) {
    await emailService.sendProbationEvaluationDue(dest.email, dest.name, nombreEmpleado, TIPO_LABEL[evalCfg.tipo]);
  }
}

async function checkAndNotify() {
  const resultado = {
    recordatorios: { enviados: 0, fallidos: 0, empleados: [] },
    evaluacionesCreadas: []
  };

  try {
    console.log('\n🔍 Verificando periodos de prueba (30/60/90 días)...');

    const empleados = await prisma.employee.findMany({
      where: { estatus: 'Activo' },
      include: { reportaA: { include: { user: { select: { email: true, name: true } } } } }
    });

    for (const emp of empleados) {
      if (!emp.fechaAlta) continue;
      const dias = diasTranscurridos(emp.fechaAlta);

      const recordatorio = RECORDATORIOS.find(r => r.dias === dias);
      if (recordatorio) await enviarRecordatorio(emp, recordatorio, resultado);

      const evalCfg = EVALUACIONES.find(e => e.dias === dias);
      if (evalCfg) await crearEvaluacionPendiente(emp, evalCfg, resultado);
    }

    console.log(`✅ Periodo de prueba: ${resultado.recordatorios.enviados} recordatorios enviados, ${resultado.evaluacionesCreadas.length} evaluaciones creadas`);
    return resultado;
  } catch (err) {
    console.error('❌ Error en checkAndNotify (periodo de prueba):', err.message);
    throw err;
  }
}

module.exports = { checkAndNotify, diasTranscurridos };
