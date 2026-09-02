/**
 * Funciones puras de fechas para el módulo de Incidencias (checador ZKTeco).
 * Extraídas de attendance.controller.js para poder probarlas por separado
 * sin necesidad de mockear Express/Prisma (jest.unit.config.js solo mide
 * cobertura de src/utils|middlewares|services, no de src/controllers).
 */

/**
 * LÓGICA CRÍTICA DE FECHAS: El CSV viene con el header "Tiempo" y valores como "25/02/2026 08:26:17 a. m."
 * Usa esta lógica exacta para convertirlo antes de guardarlo en Prisma.
 * Si el formato no coincide, regresa la fecha/hora actual (comportamiento existente, sin cambios).
 */
function parseZKTecoDate(dateStr) {
  // Espera formato: "25/02/2026 08:26:17 a. m." o "p. m."
  const parts = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2}) (a\. m\.|p\. m\.)/);
  if (!parts) return new Date();
  let [_, day, month, year, hours, minutes, seconds, ampm] = parts;
  hours = parseInt(hours);
  if (ampm === 'p. m.' && hours < 12) hours += 12;
  if (ampm === 'a. m.' && hours === 12) hours = 0;
  return new Date(`${year}-${month}-${day}T${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`);
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
