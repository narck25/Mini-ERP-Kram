const ReportService = require('../services/reportes/report.service');
const XLSX = require('xlsx');

const fmt = (d) => (d ? new Date(d).toISOString().substring(0, 10) : '');
const nombre = (e) => [e?.nombres, e?.apellidoPaterno].filter(Boolean).join(' ');

function sendXlsx(res, rows, filename) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  res.send(buffer);
}

class ReportController {
  static async empleados(req, res) {
    try { res.json({ data: await ReportService.reporteEmpleados(req.query) }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  }
  static async empleadosExport(req, res) {
    try {
      const { list } = await ReportService.reporteEmpleados(req.query);
      sendXlsx(res, list.map((e) => ({
        Clave: e.clave || '',
        Nombre: nombre(e),
        ApellidoMaterno: e.apellidoMaterno || '',
        Estatus: e.estatus,
        Nivel: e.nivelJerarquico || '',
        Departamento: e.departamento?.nombre || '',
        Puesto: e.puesto?.nombre || '',
        FechaIngreso: fmt(e.fechaAlta),
        SalarioMensual: e.salarioMensual || 0
      })), 'reporte_empleados');
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  static async compras(req, res) {
    try { res.json({ data: await ReportService.reporteCompras(req.query) }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  }
  static async comprasExport(req, res) {
    try {
      const { list } = await ReportService.reporteCompras(req.query);
      sendXlsx(res, list.map((r) => ({
        Folio: r.folio,
        Fecha: fmt(r.fechaSolicitud),
        Estatus: r.estatus,
        Solicitante: nombre(r.solicitante),
        Departamento: r.departamento?.nombre || '',
        Partidas: r._count?.items || 0,
        Cotizaciones: r._count?.quotes || 0,
        Justificacion: r.justificacion || ''
      })), 'reporte_compras');
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  static async inventario(req, res) {
    try { res.json({ data: await ReportService.reporteInventario() }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  }
  static async inventarioExport(req, res) {
    try {
      const data = await ReportService.reporteInventario();
      const papeleria = data.papeleria.items.map((i) => ({
        Tipo: 'PAPELERIA', Producto: i.producto, Categoria: i.categoria,
        Actual: i.cantidadActual, Minimo: i.cantidadMinima, Unidad: i.unidad
      }));
      const uniformes = data.uniformes.items.map((i) => ({
        Tipo: 'UNIFORME', Producto: `${i.tipo} ${i.talla}${i.genero ? ' ' + i.genero : ''}`.trim(), Categoria: i.genero || '',
        Actual: i.cantidadActual, Minimo: i.cantidadMinima, Unidad: 'pzas'
      }));
      sendXlsx(res, [...papeleria, ...uniformes], 'reporte_inventario');
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  static async asistencia(req, res) {
    try { res.json({ data: await ReportService.reporteAsistencia(req.query) }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  }
  static async asistenciaExport(req, res) {
    try {
      const { list } = await ReportService.reporteAsistencia(req.query);
      sendXlsx(res, list.map((r) => ({
        NumeroEmpleado: r.numeroEmpleado,
        Nombre: r.nombreEmpleado,
        FechaHora: r.fechaHora ? new Date(r.fechaHora).toISOString() : '',
        Tipo: r.tipo,
        Dispositivo: r.dispositivo || ''
      })), 'reporte_asistencia');
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  static async vacaciones(req, res) {
    try { res.json({ data: await ReportService.reporteVacaciones(req.query) }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  }
  static async vacacionesExport(req, res) {
    try {
      const { list } = await ReportService.reporteVacaciones(req.query);
      sendXlsx(res, list.map((r) => ({
        Empleado: nombre(r.empleado),
        Clave: r.empleado?.clave || '',
        Inicio: fmt(r.fechaInicio),
        Fin: fmt(r.fechaFin),
        Estatus: r.estatus,
        Motivo: r.motivo || ''
      })), 'reporte_vacaciones');
    } catch (e) { res.status(500).json({ error: e.message }); }
  }
}

module.exports = ReportController;
