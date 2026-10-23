const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Comprobante opcional (EmployeeDocument ya subido vía POST /employee/:id/documents).
// Debe pertenecer al mismo empleado de la incapacidad — evita enlazar por error (o a
// propósito) el comprobante de alguien más a esta incapacidad.
async function validarDocumento(documentoId, employeeId) {
  if (!documentoId) return null;
  const documento = await prisma.employeeDocument.findUnique({ where: { id: documentoId } });
  if (!documento) throw new Error('El documento adjunto no existe');
  if (documento.employee_id !== employeeId) {
    throw new Error('El documento adjunto no pertenece a este empleado');
  }
  return documentoId;
}

const DOCUMENTO_SELECT = { id: true, nombre_archivo: true, url_archivo: true, tipo_documento: true };

const SUBTIPOS_RIESGO = ['ACCIDENTE_TRABAJO', 'ACCIDENTE_TRAYECTO', 'ENFERMEDAD_TRABAJO'];

// Solo tiene sentido (y es obligatorio) cuando tipo === RIESGO_TRABAJO — es la
// sub-clasificación que distingue accidentes en planta (sí cuentan para la
// Prima de Riesgo ante IMSS) de los de trayecto (no cuentan). Para cualquier
// otro tipo, se limpia a null para no dejar datos inconsistentes.
function resolverSubtipoRiesgo(tipo, subtipoRiesgo) {
  if (tipo !== 'RIESGO_TRABAJO') return null;
  if (!subtipoRiesgo || !SUBTIPOS_RIESGO.includes(subtipoRiesgo)) {
    throw new Error('Para Riesgo de Trabajo debes indicar el subtipo: Accidente de Trabajo, Accidente en Trayecto o Enfermedad de Trabajo');
  }
  return subtipoRiesgo;
}

class IncapacidadService {
  static async create(data, user) {
    const { employeeId, tipo, fechaInicio, fechaFin, folioIncapacidad, observaciones, documentoId, subtipoRiesgo } = data || {};

    if (!employeeId || !tipo || !fechaInicio || !fechaFin) {
      throw new Error('employeeId, tipo, fechaInicio y fechaFin son obligatorios');
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) throw new Error('Fechas inválidas');
    if (fin < inicio) throw new Error('La fecha de fin no puede ser anterior a la de inicio');

    const empleado = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!empleado) throw new Error('Empleado no encontrado');

    const documentoValidado = await validarDocumento(documentoId, employeeId);
    const subtipoValidado = resolverSubtipoRiesgo(tipo, subtipoRiesgo);

    return prisma.incapacidad.create({
      data: {
        employeeId,
        tipo,
        subtipoRiesgo: subtipoValidado,
        fechaInicio: inicio,
        fechaFin: fin,
        folioIncapacidad: folioIncapacidad || null,
        observaciones: observaciones || null,
        documentoId: documentoValidado,
        registradoPorId: user.id
      },
      include: {
        empleado: { select: { id: true, nombres: true, apellidoPaterno: true, clave: true } },
        documento: { select: DOCUMENTO_SELECT }
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
        registradoPor: { select: { id: true, name: true } },
        documento: { select: DOCUMENTO_SELECT }
      },
      orderBy: { fechaInicio: 'desc' }
    });
  }

  static async getById(id) {
    return prisma.incapacidad.findUnique({
      where: { id },
      include: {
        empleado: { select: { id: true, nombres: true, apellidoPaterno: true, clave: true, departamento: { select: { nombre: true } } } },
        registradoPor: { select: { id: true, name: true } },
        documento: { select: DOCUMENTO_SELECT }
      }
    });
  }

  static async update(id, data) {
    const actual = await prisma.incapacidad.findUnique({ where: { id } });
    if (!actual) throw new Error('Incapacidad no encontrada');

    const documentoId = data.documentoId !== undefined
      ? await validarDocumento(data.documentoId, actual.employeeId)
      : actual.documentoId;

    const tipo = data.tipo ?? actual.tipo;
    // Solo se revalida el subtipo si esta edición toca tipo o subtipoRiesgo —
    // así no se bloquea editar otros campos (observaciones, folio, etc.) en
    // registros viejos de RIESGO_TRABAJO que quedaron sin sub-clasificar.
    const subtipoRiesgo = (data.tipo !== undefined || data.subtipoRiesgo !== undefined)
      ? resolverSubtipoRiesgo(tipo, data.subtipoRiesgo !== undefined ? data.subtipoRiesgo : actual.subtipoRiesgo)
      : actual.subtipoRiesgo;

    return prisma.incapacidad.update({
      where: { id },
      data: {
        tipo,
        subtipoRiesgo,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : actual.fechaInicio,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : actual.fechaFin,
        folioIncapacidad: data.folioIncapacidad ?? actual.folioIncapacidad,
        estatus: data.estatus ?? actual.estatus,
        observaciones: data.observaciones ?? actual.observaciones,
        documentoId
      },
      include: {
        documento: { select: DOCUMENTO_SELECT }
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
