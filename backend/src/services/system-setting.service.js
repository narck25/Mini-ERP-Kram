/**
 * system-setting.service.js
 * ─────────────────────────────────────────────────────────────
 * Interruptores de configuración administrables desde el sistema
 * (tabla clave/valor). Por ahora solo se usa para controlar si las
 * entregas de papelería/uniformes validan inventario en estricto
 * o permiten quedar en negativo.
 * ─────────────────────────────────────────────────────────────
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INVENTORY_STRICT_MODE_KEY = 'INVENTORY_STRICT_MODE';
const PROBATION_EVALUATIONS_ENABLED_KEY = 'PROBATION_EVALUATIONS_ENABLED';
const OPERATIONAL_EVALUATIONS_ENABLED_KEY = 'OPERATIONAL_EVALUATIONS_ENABLED';

exports.INVENTORY_STRICT_MODE_KEY = INVENTORY_STRICT_MODE_KEY;
exports.PROBATION_EVALUATIONS_ENABLED_KEY = PROBATION_EVALUATIONS_ENABLED_KEY;
exports.OPERATIONAL_EVALUATIONS_ENABLED_KEY = OPERATIONAL_EVALUATIONS_ENABLED_KEY;

exports.getSetting = async (clave, defaultValue = null) => {
  const setting = await prisma.systemSetting.findUnique({ where: { clave } });
  return setting ? setting.valor : defaultValue;
};

exports.setSetting = async (clave, valor) => {
  return prisma.systemSetting.upsert({
    where: { clave },
    update: { valor: String(valor) },
    create: { clave, valor: String(valor) }
  });
};

// Default en falso (permisivo): mientras no se cargue inventario real, las
// entregas de papelería/uniformes no deben bloquearse.
exports.isInventoryStrictMode = async () => {
  const valor = await exports.getSetting(INVENTORY_STRICT_MODE_KEY, 'false');
  return valor === 'true';
};

// Default en verdadero (ambos módulos activos desde que se construyeron) —
// el switch es para que RH pueda pausarlos sin necesitar un deploy, no un
// cambio de comportamiento por defecto.
exports.isProbationEvaluationsEnabled = async () => {
  const valor = await exports.getSetting(PROBATION_EVALUATIONS_ENABLED_KEY, 'true');
  return valor === 'true';
};

exports.isOperationalEvaluationsEnabled = async () => {
  const valor = await exports.getSetting(OPERATIONAL_EVALUATIONS_ENABLED_KEY, 'true');
  return valor === 'true';
};
