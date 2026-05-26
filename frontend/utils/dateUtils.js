/**
 * Utilidades para manejo de fechas que evitan el bug de zona horaria (-1 día)
 * 
 * Problema: Prisma/PostgreSQL guarda fechas como "2025-05-04T00:00:00.000Z" (UTC).
 * Al hacer new Date("2025-05-04T00:00:00.000Z") en zonas horarias negativas (ej. GMT-6),
 * JS resta 6 horas, resultando en "2025-05-03" - el famoso bug del día anterior.
 * 
 * Solución: Extraer solo la parte de fecha (YYYY-MM-DD) y trabajar con ella
 * sin convertir a objeto Date cuando solo necesitamos la fecha.
 */

/**
 * Extrae la fecha en formato YYYY-MM-DD de un string ISO o Date, ignorando zona horaria
 * @param {string|Date} fecha - Fecha en formato ISO, Date, o cualquier formato
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function extractDate(fecha) {
  if (!fecha) return '';
  
  // Si es string ISO, extraer solo la parte de fecha
  if (typeof fecha === 'string') {
    // Si ya viene en formato YYYY-MM-DD, devolver tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
    // Extraer parte de fecha de ISO string
    return fecha.split('T')[0] || fecha.substring(0, 10);
  }
  
  // Si es Date, convertir a ISO y extraer fecha
  if (fecha instanceof Date && !isNaN(fecha)) {
    return fecha.toISOString().split('T')[0];
  }
  
  return '';
}

/**
 * Formatea una fecha para mostrar en UI (DD/MM/YYYY)
 * @param {string|Date} fecha - Fecha en cualquier formato
 * @returns {string} Fecha formateada como DD/MM/YYYY o 'No especificada'
 */
export function formatDateDisplay(fecha) {
  if (!fecha) return 'No especificada';
  
  const dateStr = extractDate(fecha);
  if (!dateStr) return 'No especificada';
  
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Formatea una fecha en formato largo en español (ej. "lunes, 4 de mayo de 2025")
 * @param {string|Date} fecha - Fecha en cualquier formato
 * @returns {string} Fecha en formato largo
 */
export function formatDateLong(fecha) {
  if (!fecha) return 'No especificada';
  
  const dateStr = extractDate(fecha);
  if (!dateStr) return 'No especificada';
  
  const [year, month, day] = dateStr.split('-').map(Number);
  // Crear fecha usando UTC para evitar corrimiento
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  
  return dateObj.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Calcula la edad a partir de una fecha de nacimiento
 * @param {string|Date} fechaNacimiento - Fecha de nacimiento
 * @returns {string} Edad en años o 'No especificada'
 */
export function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return 'No especificada';
  
  const dateStr = extractDate(fechaNacimiento);
  if (!dateStr) return 'No especificada';
  
  const [year, month, day] = dateStr.split('-').map(Number);
  const nacimiento = new Date(Date.UTC(year, month - 1, day));
  const hoy = new Date();
  
  let edad = hoy.getFullYear() - nacimiento.getUTCFullYear();
  const mes = hoy.getMonth() - nacimiento.getUTCMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getUTCDate())) {
    edad--;
  }
  return `${edad} años`;
}

/**
 * Calcula la antigüedad con días a partir de una fecha de alta
 * @param {string|Date} fechaAlta - Fecha de ingreso
 * @returns {string} Antigüedad formateada o 'No especificada'
 */
export function calcularAntiguedad(fechaAlta) {
  if (!fechaAlta) return 'No especificada';
  
  const dateStr = extractDate(fechaAlta);
  if (!dateStr) return 'No especificada';
  
  const [year, month, day] = dateStr.split('-').map(Number);
  const ingreso = new Date(Date.UTC(year, month - 1, day));
  const hoy = new Date();
  
  let años = hoy.getFullYear() - ingreso.getUTCFullYear();
  let meses = hoy.getMonth() - ingreso.getUTCMonth();
  let días = hoy.getDate() - ingreso.getUTCDate();
  
  if (días < 0) {
    meses--;
    const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
    días += ultimoDiaMesAnterior;
  }
  
  if (meses < 0) {
    años--;
    meses += 12;
  }
  
  const partes = [];
  if (años > 0) partes.push(`${años} ${años === 1 ? 'año' : 'años'}`);
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`);
  if (días > 0) partes.push(`${días} ${días === 1 ? 'día' : 'días'}`);
  
  if (partes.length === 0) return '0 días';
  return partes.join(', ');
}

/**
 * Convierte un valor de fecha a string YYYY-MM-DD para usar en input type="date"
 * @param {string|Date} fecha - Fecha en cualquier formato
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function toDateInputValue(fecha) {
  return extractDate(fecha);
}
