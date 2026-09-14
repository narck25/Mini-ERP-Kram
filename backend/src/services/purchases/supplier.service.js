const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Normaliza para comparar duplicados ignorando mayúsculas/minúsculas y acentos
// ("González" y "gonzalez" deben detectarse como el mismo proveedor). El filtro
// `mode: 'insensitive'` de Prisma/Postgres solo ignora mayúsculas, no acentos,
// así que la comparación final se hace en JS sobre el resultado normalizado.
const normalizeName = (str) => str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const findDuplicate = async (nombre, excludeId = null) => {
  const nombreNormalizado = normalizeName(nombre);
  const candidatos = await prisma.supplier.findMany({
    where: excludeId ? { NOT: { id: excludeId } } : {}
  });
  return candidatos.find(s => normalizeName(s.nombre) === nombreNormalizado) || null;
};

// ─────────────────────────────────────────────────────────────
// 1. Listar proveedores
// ─────────────────────────────────────────────────────────────
exports.list = async ({ activo } = {}) => {
  const where = {};
  if (activo !== undefined) where.activo = activo === 'true' || activo === true;

  return prisma.supplier.findMany({
    where,
    orderBy: { nombre: 'asc' }
  });
};

// ─────────────────────────────────────────────────────────────
// 2. Crear proveedor
// ─────────────────────────────────────────────────────────────
exports.create = async (data) => {
  const { nombre, rfc, contacto, telefono, email } = data;

  if (!nombre || !nombre.trim()) {
    throw { status: 400, error: 'Datos inválidos', message: 'El nombre del proveedor es obligatorio' };
  }

  const existente = await findDuplicate(nombre.trim());
  if (existente) {
    throw { status: 400, error: 'Proveedor duplicado', message: `Ya existe un proveedor registrado como "${existente.nombre}"` };
  }

  return prisma.supplier.create({
    data: {
      nombre: nombre.trim(),
      rfc: rfc?.trim() || null,
      contacto: contacto?.trim() || null,
      telefono: telefono?.trim() || null,
      email: email?.trim() || null
    }
  });
};

// ─────────────────────────────────────────────────────────────
// 3. Actualizar proveedor (incluye activar/desactivar)
// ─────────────────────────────────────────────────────────────
exports.update = async (id, data) => {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, error: 'Proveedor no encontrado' };
  }

  const { nombre, rfc, contacto, telefono, email, activo } = data;

  if (nombre !== undefined && nombre.trim() && normalizeName(nombre) !== normalizeName(existing.nombre)) {
    const duplicado = await findDuplicate(nombre.trim(), id);
    if (duplicado) {
      throw { status: 400, error: 'Proveedor duplicado', message: `Ya existe un proveedor registrado como "${duplicado.nombre}"` };
    }
  }

  return prisma.supplier.update({
    where: { id },
    data: {
      nombre: nombre !== undefined ? nombre.trim() : undefined,
      rfc: rfc !== undefined ? (rfc?.trim() || null) : undefined,
      contacto: contacto !== undefined ? (contacto?.trim() || null) : undefined,
      telefono: telefono !== undefined ? (telefono?.trim() || null) : undefined,
      email: email !== undefined ? (email?.trim() || null) : undefined,
      activo: activo !== undefined ? activo : undefined
    }
  });
};
