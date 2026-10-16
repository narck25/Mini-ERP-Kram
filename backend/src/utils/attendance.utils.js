/**
 * Funciones puras de fechas para el módulo de Incidencias (checador ZKTeco).
 * Extraídas de attendance.controller.js para poder probarlas por separado
 * sin necesidad de mockear Express/Prisma (jest.unit.config.js solo mide
 * cobertura de src/utils|middlewares|services, no de src/controllers).
 */

/**
 * LÓGICA CRÍTICA DE FECHAS: el CSV trae el header "Tiempo" en uno de dos formatos
 * según la fuente —
 *   - Export manual de ZKTime.Net Lite: "25/02/2026 08:26:17 a. m." (con segundos y AM/PM en español)
 *   - bot_asistencias_zk/descargar_asistencias.py: "05/10/2026 08:47" (24h, sin segundos, sin AM/PM)
 * Si ninguno de los dos coincide, regresa null — nunca debe inventar una fecha
 * (antes regresaba `new Date()` en silencio, lo que corrompía el timestamp de
 * TODOS los registros de un CSV con formato no reconocido sin que nadie se
 * diera cuenta, ya que el mensaje de "CSV procesado" seguía saliendo exitoso).
 */
function parseZKTecoDate(dateStr) {
  if (!dateStr) return null;

  // Formato ZKTime.Net: con segundos y "a. m."/"p. m."
  const conAmPm = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2}) (a\. m\.|p\. m\.)/);
  if (conAmPm) {
    let [, day, month, year, hours, minutes, seconds, ampm] = conAmPm;
    hours = parseInt(hours);
    if (ampm === 'p. m.' && hours < 12) hours += 12;
    if (ampm === 'a. m.' && hours === 12) hours = 0;
    return new Date(`${year}-${month}-${day}T${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`);
  }

  // Formato del bot: 24h, sin segundos ni AM/PM
  const formato24h = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (formato24h) {
    const [, day, month, year, hours, minutes] = formato24h;
    return new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);
  }

  return null;
}

/**
 * Construye el filtro de rango de fechas para AttendanceRecord.findMany a partir de
 * startDate/endDate en formato YYYY-MM-DD. Extraído tal cual de getRecords — no agrega
 * validaciones nuevas (ej. no valida end < start, porque el código original tampoco lo hacía).
 * @returns {{valid: true, filter: object} | {valid: false}}
 */
function buildDateFilter(startDate, endDate) {
  // Al concatenar 'T00:00:00' Node lo interpreta en la zona horaria local del servidor
  const start = new Date(`${startDate}T00:00:00.000`);
  const end = new Date(`${endDate}T23:59:59.999`);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false };
  }

  return {
    valid: true,
    filter: {
      fechaHora: { gte: start, lte: end }
    }
  };
}

module.exports = { parseZKTecoDate, buildDateFilter };
