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

exports.INVENTORY_STRICT_MODE_KEY = INVENTORY_STRICT_MODE_KEY;

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
