/**
 * Servicio de Notificaciones de Cumpleaños y Aniversarios
 * 
 * Verifica diariamente qué empleados cumplen años o aniversario laboral
 * y envía notificaciones por email.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('./email.service');

/**
 * Obtiene el nombre completo del empleado
 */
function getNombreCompleto(emp) {
  return `${emp.nombres || emp.nombre || ''} ${emp.apellidoPaterno || ''} ${emp.apellidoMaterno || ''}`.trim();
}

/**
 * Calcula la antigüedad en años a partir de la fecha de alta
 * Usa UTC para evitar bug de zona horaria
 */
function calcularAntiguedad(fechaAlta) {
  if (!fechaAlta) return 0;
  const alta = new Date(fechaAlta);
  const altaAnio = alta.getUTCFullYear();
  const altaMes = alta.getUTCMonth() + 1;
  const altaDia = alta.getUTCDate();

  const hoy = new Date();
  const hoyAnio = hoy.getFullYear();
  const hoyMes = hoy.getMonth() + 1;
  const hoyDia = hoy.getDate();

  let años = hoyAnio - altaAnio;
  if (hoyMes < altaMes || (hoyMes === altaMes && hoyDia < altaDia)) años--;
  return años;
}

/**
 * Verifica si ya se envió notificación de un tipo específico para un empleado hoy
 */
async function yaNotificadoHoy(employeeId, tipo) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  const existente = await prisma.notificationLog.findFirst({
    where: {
      employeeId,
      tipo,
      enviadoA: {
        gte: hoy,
        lt: manana
      },
      estatus: 'ENVIADO'
    }
  });

  return !!existente;
}

/**
 * Registra una notificación en el log de auditoría
 */
async function registrarLog(tipo, employeeId, employeeName, email, estatus, errorMsg = null) {
  try {
    await prisma.notificationLog.create({
      data: {
        tipo,
        employeeId,
        employeeName,
        email,
        estatus,
        errorMsg
      }
    });
  } catch (err) {
    console.error(`❌ Error al registrar log de notificación:`, err.message);
  }
}

/**
 * Obtiene los usuarios RH y ADMIN para enviar resumen
 */
async function getDestinatariosRH() {
  return prisma.user.findMany({
    where: {
      role: { in: ['RH', 'ADMIN'] },
      isActive: true
    },
    select: {
      email: true,
      name: true,
      role: true
    }
  });
}

/**
 * Verifica y envía notificaciones de cumpleaños y aniversarios
 * @returns {Object} Resumen de lo procesado
 */
async function checkAndNotify() {
  const resultado = {
    cumpleaños: { enviados: 0, fallidos: 0, empleados: [] },
    aniversarios: { enviados: 0, fallidos: 0, empleados: [] },
    resumenRH: { enviado: false, destinatarios: 0 }
  };

  try {
    const hoy = new Date();
    const hoyMes = hoy.getMonth() + 1; // 1-12
    const hoyDia = hoy.getDate();

    console.log(`\n🔍 Verificando cumpleaños y aniversarios para ${hoyDia}/${hoyMes}...`);

    // ============================================================
    // 1. Buscar empleados que cumplen años hoy
    // ============================================================
    // PostgreSQL: EXTRACT(MONTH FROM fecha_nacimiento) = mes AND EXTRACT(DAY FROM fecha_nacimiento) = dia
    const cumpleañeros = await prisma.$queryRaw`
      SELECT e.*, d.nombre as departamento_nombre, jp.nombre as puesto_nombre
      FROM employees e
      LEFT JOIN departments d ON d.id = e.departamento_id
      LEFT JOIN job_positions jp ON jp.id = e."puestoId"
      WHERE e.estatus = 'Activo'
        AND EXTRACT(MONTH FROM e.fecha_nacimiento) = ${hoyMes}
        AND EXTRACT(DAY FROM e.fecha_nacimiento) = ${hoyDia}
    `;

    console.log(`   🎂 Cumpleañeros encontrados: ${cumpleañeros.length}`);

    // ============================================================
    // 2. Buscar empleados que cumplen aniversario hoy
    // ============================================================
    const aniversarios = await prisma.$queryRaw`
      SELECT e.*, d.nombre as departamento_nombre, jp.nombre as puesto_nombre
      FROM employees e
      LEFT JOIN departments d ON d.id = e.departamento_id
      LEFT JOIN job_positions jp ON jp.id = e."puestoId"
      WHERE e.estatus = 'Activo'
        AND EXTRACT(MONTH FROM e.fecha_ingreso) = ${hoyMes}
        AND EXTRACT(DAY FROM e.fecha_ingreso) = ${hoyDia}
    `;

    console.log(`   🎊 Aniversarios encontrados: ${aniversarios.length}`);

    // ============================================================
    // 3. Enviar emails a cada empleado
    // ============================================================

    // Cumpleaños
    for (const emp of cumpleañeros) {
      const email = emp.correo_electronico || emp.correo_empresa;
      if (!email) {
        console.warn(`   ⚠️ ${getNombreCompleto(emp)} no tiene email registrado`);
        continue;
      }

      const yaNotificado = await yaNotificadoHoy(emp.id, 'CUMPLEANOS');
      if (yaNotificado) {
        console.log(`   ⏭️ ${getNombreCompleto(emp)} ya notificado hoy`);
        continue;
      }

      const enviado = await emailService.sendBirthdayWish(email, getNombreCompleto(emp));
      await registrarLog(
        'CUMPLEANOS', emp.id, getNombreCompleto(emp), email,
        enviado ? 'ENVIADO' : 'FALLIDO',
        enviado ? null : 'Error al enviar email'
      );

      if (enviado) {
        resultado.cumpleaños.enviados++;
        resultado.cumpleaños.empleados.push(getNombreCompleto(emp));
      } else {
        resultado.cumpleaños.fallidos++;
      }
    }

    // Aniversarios
    for (const emp of aniversarios) {
      const email = emp.correo_electronico || emp.correo_empresa;
      if (!email) {
        console.warn(`   ⚠️ ${getNombreCompleto(emp)} no tiene email registrado`);
        continue;
      }

      const yaNotificado = await yaNotificadoHoy(emp.id, 'ANIVERSARIO');
      if (yaNotificado) {
        console.log(`   ⏭️ ${getNombreCompleto(emp)} ya notificado hoy`);
        continue;
      }

      const antiguedad = calcularAntiguedad(emp.fecha_ingreso);
      const enviado = await emailService.sendAnniversaryWish(email, getNombreCompleto(emp), antiguedad);
      await registrarLog(
        'ANIVERSARIO', emp.id, getNombreCompleto(emp), email,
        enviado ? 'ENVIADO' : 'FALLIDO',
        enviado ? null : 'Error al enviar email'
      );

      if (enviado) {
        resultado.aniversarios.enviados++;
        resultado.aniversarios.empleados.push(getNombreCompleto(emp));
      } else {
        resultado.aniversarios.fallidos++;
      }
    }

    // ============================================================
    // 4. Enviar resumen a RH/ADMIN
    // ============================================================
    const destinatariosRH = await getDestinatariosRH();

    if (destinatariosRH.length > 0 && (cumpleañeros.length > 0 || aniversarios.length > 0)) {
      const birthdayList = cumpleañeros.map(emp => ({
        nombreCompleto: getNombreCompleto(emp),
        departamento: emp.departamento_nombre || '—',
        puesto: emp.puesto_nombre || '—'
      }));

      const anniversaryList = aniversarios.map(emp => ({
        nombreCompleto: getNombreCompleto(emp),
        departamento: emp.departamento_nombre || '—',
        antiguedad: calcularAntiguedad(emp.fecha_ingreso)
      }));

      for (const rh of destinatariosRH) {
        const enviado = await emailService.sendDailySummaryToRH(
          rh.email,
          rh.name,
          birthdayList,
          anniversaryList
        );

        if (enviado) {
          resultado.resumenRH.enviado = true;
          resultado.resumenRH.destinatarios++;
        }
      }
    }

    console.log(`\n✅ Procesamiento completado:`);
    console.log(`   🎂 Cumpleaños: ${resultado.cumpleaños.enviados} enviados, ${resultado.cumpleaños.fallidos} fallidos`);
    console.log(`   🎊 Aniversarios: ${resultado.aniversarios.enviados} enviados, ${resultado.aniversarios.fallidos} fallidos`);
    console.log(`   📧 Resumen RH: ${resultado.resumenRH.destinatarios} destinatarios`);

    return resultado;

  } catch (err) {
    console.error('❌ Error en checkAndNotify:', err.message);
    console.error(err.stack?.substring(0, 500));
    throw err;
  }
}

/**
 * Obtiene los próximos cumpleaños y aniversarios (próximos N días)
 * @param {number} dias - Número de días a futuro (default: 30)
 * @returns {Object} { cumpleaños: [], aniversarios: [] }
 */
async function getUpcomingEvents(dias = 30) {
  try {
    const hoy = new Date();
    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    const hoyMes = hoy.getMonth() + 1;
    const hoyDia = hoy.getDate();
    const finMes = fechaLimite.getMonth() + 1;
    const finDia = fechaLimite.getDate();

    // Para simplificar, obtenemos todos los empleados activos y filtramos por mes/día
    const empleados = await prisma.employee.findMany({
      where: { estatus: 'Activo' },
      include: {
        departamento: { select: { nombre: true } },
        puesto: { select: { nombre: true } }
      }
    });

    const cumpleaños = [];
    const aniversarios = [];

    for (const emp of empleados) {
      if (emp.fechaNacimiento) {
        // Extraer mes/día usando UTC para evitar el bug del día anterior por zona horaria
        const nac = new Date(emp.fechaNacimiento);
        const nacMes = nac.getUTCMonth() + 1;
        const nacDia = nac.getUTCDate();

        // Verificar si está en el rango de los próximos N días
        if (estaEnRango(nacMes, nacDia, hoyMes, hoyDia, finMes, finDia)) {
          cumpleaños.push({
            id: emp.id,
            nombreCompleto: getNombreCompleto(emp),
            departamento: emp.departamento?.nombre || '—',
            puesto: emp.puesto?.nombre || '—',
            fecha: `${nacDia.toString().padStart(2, '0')}/${nacMes.toString().padStart(2, '0')}`,
            fotoUrl: emp.fotoUrl
          });
        }
      }

      if (emp.fechaAlta) {
        // Extraer mes/día usando UTC para evitar el bug del día anterior por zona horaria
        const alta = new Date(emp.fechaAlta);
        const altaMes = alta.getUTCMonth() + 1;
        const altaDia = alta.getUTCDate();

        if (estaEnRango(altaMes, altaDia, hoyMes, hoyDia, finMes, finDia)) {
          aniversarios.push({
            id: emp.id,
            nombreCompleto: getNombreCompleto(emp),
            departamento: emp.departamento?.nombre || '—',
            antiguedad: calcularAntiguedad(emp.fechaAlta),
            fecha: `${altaDia.toString().padStart(2, '0')}/${altaMes.toString().padStart(2, '0')}`,
            fotoUrl: emp.fotoUrl
          });
        }
      }
    }

    // Ordenar por fecha (día/mes)
    cumpleaños.sort((a, b) => {
      const [dA, mA] = a.fecha.split('/').map(Number);
      const [dB, mB] = b.fecha.split('/').map(Number);
      return mA - mB || dA - dB;
    });

    aniversarios.sort((a, b) => {
      const [dA, mA] = a.fecha.split('/').map(Number);
      const [dB, mB] = b.fecha.split('/').map(Number);
      return mA - mB || dA - dB;
    });

    return { cumpleaños, aniversarios };

  } catch (err) {
    console.error('❌ Error en getUpcomingEvents:', err.message);
    return { cumpleaños: [], aniversarios: [] };
  }
}

/**
 * Verifica si una fecha (mes/día) está en el rango entre dos fechas
 * Maneja cruce de año (ej: del 15/12 al 15/01)
 */
function estaEnRango(mes, dia, desdeMes, desdeDia, hastaMes, hastaDia) {
  const fecha = mes * 100 + dia;
  const desde = desdeMes * 100 + desdeDia;
  const hasta = hastaMes * 100 + hastaDia;

  if (desde <= hasta) {
    return fecha >= desde && fecha <= hasta;
  } else {
    // Cruce de año (ej: diciembre a enero)
    return fecha >= desde || fecha <= hasta;
  }
}

module.exports = {
  checkAndNotify,
  getUpcomingEvents
};
