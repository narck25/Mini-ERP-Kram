/**
 * Utilidad para cálculo de SD (Sueldo Diario) y SDI (Sueldo Diario Integrado)
 * basado en la tabla de factores de integración por antigüedad.
 */

// Tabla de factores de integración (año -> { diasAguinaldo, diasVacaciones, primaVacacional, factor })
const FACTORES_POR_ANIO = {
  1:  { diasAguinaldo: 15, diasVacaciones: 12, primaVacacional: 0.25, factor: 1.0493 },
  2:  { diasAguinaldo: 15, diasVacaciones: 14, primaVacacional: 0.25, factor: 1.0507 },
  3:  { diasAguinaldo: 15, diasVacaciones: 16, primaVacacional: 0.25, factor: 1.0521 },
  4:  { diasAguinaldo: 15, diasVacaciones: 18, primaVacacional: 0.25, factor: 1.0534 },
  5:  { diasAguinaldo: 15, diasVacaciones: 20, primaVacacional: 0.25, factor: 1.0548 },
  6:  { diasAguinaldo: 15, diasVacaciones: 22, primaVacacional: 0.25, factor: 1.0562 },
  7:  { diasAguinaldo: 15, diasVacaciones: 22, primaVacacional: 0.25, factor: 1.0562 },
  8:  { diasAguinaldo: 15, diasVacaciones: 22, primaVacacional: 0.25, factor: 1.0562 },
  9:  { diasAguinaldo: 15, diasVacaciones: 22, primaVacacional: 0.25, factor: 1.0562 },
  10: { diasAguinaldo: 15, diasVacaciones: 22, primaVacacional: 0.25, factor: 1.0562 },
  11: { diasAguinaldo: 15, diasVacaciones: 24, primaVacacional: 0.25, factor: 1.0575 },
  12: { diasAguinaldo: 15, diasVacaciones: 24, primaVacacional: 0.25, factor: 1.0575 },
  13: { diasAguinaldo: 15, diasVacaciones: 24, primaVacacional: 0.25, factor: 1.0575 },
  14: { diasAguinaldo: 15, diasVacaciones: 24, primaVacacional: 0.25, factor: 1.0575 },
  15: { diasAguinaldo: 15, diasVacaciones: 24, primaVacacional: 0.25, factor: 1.0575 },
  16: { diasAguinaldo: 15, diasVacaciones: 26, primaVacacional: 0.25, factor: 1.0589 },
  17: { diasAguinaldo: 15, diasVacaciones: 26, primaVacacional: 0.25, factor: 1.0589 },
  18: { diasAguinaldo: 15, diasVacaciones: 26, primaVacacional: 0.25, factor: 1.0589 },
  19: { diasAguinaldo: 15, diasVacaciones: 26, primaVacacional: 0.25, factor: 1.0589 },
  20: { diasAguinaldo: 15, diasVacaciones: 26, primaVacacional: 0.25, factor: 1.0589 },
  21: { diasAguinaldo: 15, diasVacaciones: 28, primaVacacional: 0.25, factor: 1.0603 },
  22: { diasAguinaldo: 15, diasVacaciones: 28, primaVacacional: 0.25, factor: 1.0603 },
  23: { diasAguinaldo: 15, diasVacaciones: 28, primaVacacional: 0.25, factor: 1.0603 },
  24: { diasAguinaldo: 15, diasVacaciones: 28, primaVacacional: 0.25, factor: 1.0603 },
  25: { diasAguinaldo: 15, diasVacaciones: 28, primaVacacional: 0.25, factor: 1.0603 },
  26: { diasAguinaldo: 15, diasVacaciones: 30, primaVacacional: 0.25, factor: 1.0616 },
  27: { diasAguinaldo: 15, diasVacaciones: 30, primaVacacional: 0.25, factor: 1.0616 },
  28: { diasAguinaldo: 15, diasVacaciones: 30, primaVacacional: 0.25, factor: 1.0616 },
  29: { diasAguinaldo: 15, diasVacaciones: 30, primaVacacional: 0.25, factor: 1.0616 },
  30: { diasAguinaldo: 15, diasVacaciones: 30, primaVacacional: 0.25, factor: 1.0616 }
};

/**
 * Calcula la antigüedad en años completos desde una fecha hasta hoy
 * @param {string|Date} fechaIngreso - Fecha de ingreso del empleado
 * @returns {number} Años completos de antigüedad (mínimo 1, máximo 30)
 */
function calcularAntiguedad(fechaIngreso) {
  if (!fechaIngreso) return 1;
  
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  
  let años = hoy.getFullYear() - ingreso.getFullYear();
  const mes = hoy.getMonth() - ingreso.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < ingreso.getDate())) {
    años--;
  }
  
  // Mínimo 1 año, máximo 30
  return Math.max(1, Math.min(años, 30));
}

/**
 * Obtiene el factor de integración según la antigüedad
 * @param {number} antiguedad - Años de antigüedad
 * @returns {object} { diasAguinaldo, diasVacaciones, primaVacacional, factor }
 */
function obtenerFactorPorAntiguedad(antiguedad) {
  const anio = Math.max(1, Math.min(antiguedad, 30));
  return FACTORES_POR_ANIO[anio] || FACTORES_POR_ANIO[1];
}

/**
 * Calcula el Sueldo Diario (SD)
 * @param {number} salarioMensual - Salario mensual del empleado
 * @returns {number} Sueldo diario redondeado a 2 decimales
 */
function calcularSD(salarioMensual) {
  if (!salarioMensual || salarioMensual <= 0) return null;
  return Math.round((salarioMensual / 30) * 100) / 100;
}

/**
 * Calcula el Sueldo Diario Integrado (SDI)
 * @param {number} sd - Sueldo diario
 * @param {number} factor - Factor de integración
 * @returns {number} SDI redondeado a 2 decimales
 */
function calcularSDI(sd, factor) {
  if (!sd || !factor) return null;
  return Math.round(sd * factor * 100) / 100;
}

/**
 * Calcula SD y SDI completos a partir del salario mensual y fecha de ingreso
 * @param {number} salarioMensual - Salario mensual
 * @param {string|Date} fechaIngreso - Fecha de ingreso
 * @returns {object} { sd, sdi, factor, antiguedad, diasVacaciones }
 */
function calcularTodo(salarioMensual, fechaIngreso) {
  if (!salarioMensual || salarioMensual <= 0) {
    return { sd: null, sdi: null, factor: null, antiguedad: null, diasVacaciones: null };
  }
  
  const antiguedad = calcularAntiguedad(fechaIngreso);
  const factorInfo = obtenerFactorPorAntiguedad(antiguedad);
  const sd = calcularSD(salarioMensual);
  const sdi = calcularSDI(sd, factorInfo.factor);
  
  return {
    sd,
    sdi,
    factor: factorInfo.factor,
    antiguedad,
    diasVacaciones: factorInfo.diasVacaciones
  };
}

module.exports = {
  calcularAntiguedad,
  obtenerFactorPorAntiguedad,
  calcularSD,
  calcularSDI,
  calcularTodo,
  FACTORES_POR_ANIO
};
