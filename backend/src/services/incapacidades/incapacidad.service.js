const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class IncapacidadService {
  static async create(data, user) {
    const { employeeId, tipo, fechaInicio, fechaFin, folioIncapacidad, observaciones } = data || {};

    if (!employeeId || !tipo || !fechaInicio || !fechaFin) {
      throw new Error('employeeId, tipo, fechaInicio y fechaFin son obligatorios');
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) throw new Error('Fechas inválidas');
    if (fin < inicio) throw new Error('La fecha de fin no puede ser anterior a la de inicio');

    const empleado = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!empleado) throw new Error('Empleado no encontrado');

    return prisma.incapacidad.create({
      data: {
        employeeId,
        tipo,
        fechaInicio: inicio,
        fechaFin: fin,
        folioIncapacidad: folioIncapacidad || null,
        observaciones: observaciones || null,
        registradoPorId: user.id
      },
      include: {
        empleado: { select: { id: true, nombres: true, apellidoPaterno: true, clave: true } }
      }
    });
  }

  static async list(filters = {}) {
    const where = {};
    if (filters.estatus) where.estatus = filters.estatus;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    return prisma.incapacidad.findMany({
      where,
      include: {
        empleado: { select: { id: true, nombres: true, apellidoPaterno: true, clave: true, departamento: { select: { nombre: true } } } },
        registradoPor: { select: { id: true, name: true } }
      },
      orderBy: { fechaInicio: 'desc' }
    });
  }

  static async getById(id) {
    return prisma.incapacidad.findUnique({
      where: { id },
      include: {
        empleado: { select: { id: true, nombres: true, apellidoPaterno: true, clave: true, departamento: { select: { nombre: true } } } },
        registradoPor: { select: { id: true, name: true } }
      }
    });
  }

  static async update(id, data) {
    const actual = await prisma.incapacidad.findUnique({ where: { id } });
    if (!actual) throw new Error('Incapacidad no encontrada');

    return prisma.incapacidad.update({
      where: { id },
      data: {
        tipo: data.tipo ?? actual.tipo,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : actual.fechaInicio,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : actual.fechaFin,
        folioIncapacidad: data.folioIncapacidad ?? actual.folioIncapacidad,
        estatus: data.estatus ?? actual.estatus,
        observaciones: data.observaciones ?? actual.observaciones
      }
    });
  }

  static async reincorporar(id) {
    const incapacidad = await prisma.incapacidad.findUnique({ where: { id } });
    if (!incapacidad) throw new Error('Incapacidad no encontrada');
    if (incapacidad.estatus === 'REINCORPORADO') throw new Error('Ya está reincorporado');

    return prisma.incapacidad.update({
      where: { id },
      data: { estatus: 'REINCORPORADO' }
    });
  }

  static async countActivas() {
    return prisma.incapacidad.count({ where: { estatus: 'ACTIVA' } });
  }
}

module.exports = IncapacidadService;
