const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ReportService {
  // ─── EMPLEADOS ───
  static async reporteEmpleados(filters = {}) {
    const where = {};
    if (filters.estatus) where.estatus = filters.estatus;
    if (filters.departamentoId) where.departamento_id = filters.departamentoId;

    const list = await prisma.employee.findMany({
      where,
      select: {
        clave: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        estatus: true,
        nivelJerarquico: true,
        fechaAlta: true,
        salarioMensual: true,
        departamento: { select: { nombre: true } },
        puesto: { select: { nombre: true } }
      },
      orderBy: { nombres: 'asc' }
    });

    const activos = list.filter((e) => e.estatus === 'Activo').length;
    const inactivos = list.filter((e) => e.estatus === 'Inactivo').length;
    const porDepartamento = list.reduce((acc, e) => {
      const d = e.departamento?.nombre || 'Sin departamento';
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});

    return { total: list.length, activos, inactivos, porDepartamento, list };
  }

  // ─── COMPRAS ───
  static async reporteCompras(filters = {}) {
    const where = {};
    if (filters.estatus) where.estatus = filters.estatus;
    if (filters.fechaDesde || filters.fechaHasta) {
      where.fechaSolicitud = {};
      if (filters.fechaDesde) where.fechaSolicitud.gte = new Date(filters.fechaDesde);
      if (filters.fechaHasta) where.fechaSolicitud.lte = new Date(`${filters.fechaHasta}T23:59:59`);
    }

    const list = await prisma.purchaseRequest.findMany({
      where,
      select: {
        folio: true,
        fechaSolicitud: true,
        estatus: true,
        justificacion: true,
        solicitante: { select: { nombres: true, apellidoPaterno: true } },
        departamento: { select: { nombre: true } },
        _count: { select: { items: true, quotes: true } }
      },
      orderBy: { fechaSolicitud: 'desc' }
    });

    const porEstatus = list.reduce((acc, r) => {
      acc[r.estatus] = (acc[r.estatus] || 0) + 1;
      return acc;
    }, {});

    return { total: list.length, porEstatus, list };
  }

  // ─── INVENTARIO ───
  static async reporteInventario() {
    const [papeleria, uniformes] = await Promise.all([
      prisma.stationeryInventory.findMany({ orderBy: { producto: 'asc' } }),
      prisma.uniformInventory.findMany({ orderBy: [{ tipo: 'asc' }, { talla: 'asc' }] })
    ]);

    const papeleriaBaja = papeleria.filter((i) => i.cantidadActual <= i.cantidadMinima);
    const uniformesBaja = uniformes.filter((i) => i.cantidadActual <= i.cantidadMinima);

    return {
      papeleria: { items: papeleria, bajos: papeleriaBaja.length },
      uniformes: { items: uniformes, bajos: uniformesBaja.length }
    };
  }

  // ─── ASISTENCIA ───
  static async reporteAsistencia(filters = {}) {
    const where = {};
    if (filters.fechaDesde || filters.fechaHasta) {
      where.fechaHora = {};
      if (filters.fechaDesde) where.fechaHora.gte = new Date(filters.fechaDesde);
      if (filters.fechaHasta) where.fechaHora.lte = new Date(`${filters.fechaHasta}T23:59:59`);
    }

    const list = await prisma.attendanceRecord.findMany({
      where,
      select: { numeroEmpleado: true, nombreEmpleado: true, fechaHora: true, tipo: true, dispositivo: true },
      orderBy: { fechaHora: 'desc' },
      take: 2000
    });

    return { total: list.length, list };
  }

  // ─── VACACIONES ───
  static async reporteVacaciones(filters = {}) {
    const where = {};
    if (filters.estatus) where.estatus = filters.estatus;

    const list = await prisma.vacationRequest.findMany({
      where,
      select: {
        fechaInicio: true,
        fechaFin: true,
        estatus: true,
        motivo: true,
        empleado: { select: { nombres: true, apellidoPaterno: true, clave: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const porEstatus = list.reduce((acc, r) => {
      acc[r.estatus] = (acc[r.estatus] || 0) + 1;
      return acc;
    }, {});

    return { total: list.length, porEstatus, list };
  }
}

module.exports = ReportService;
