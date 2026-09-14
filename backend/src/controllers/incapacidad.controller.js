const IncapacidadService = require('../services/incapacidades/incapacidad.service');
const hrAudit = require('../services/hrAudit.service');

const auditIncapacidad = (data, userId, accion, req) => {
  hrAudit.logWithReq(hrAudit.ENTIDADES.INCAPACIDAD, data.id, userId, accion, null, { tipo: data.tipo, estatus: data.estatus }, req)
    .catch(err => console.error('Error registrando auditoría de RH:', err.message));
};

class IncapacidadController {
  static async create(req, res) {
    try {
      const data = await IncapacidadService.create(req.body, req.user);
      auditIncapacidad(data, req.user.id, hrAudit.ACCIONES.CREACION, req);
      res.status(201).json({ data, message: 'Incapacidad registrada' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async list(req, res) {
    try {
      const data = await IncapacidadService.list(req.query);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const data = await IncapacidadService.getById(req.params.id);
      if (!data) return res.status(404).json({ error: 'Incapacidad no encontrada' });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const data = await IncapacidadService.update(req.params.id, req.body);
      res.json({ data, message: 'Incapacidad actualizada' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async reincorporar(req, res) {
    try {
      const data = await IncapacidadService.reincorporar(req.params.id);
      auditIncapacidad(data, req.user.id, hrAudit.ACCIONES.REINCORPORACION, req);
      res.json({ data, message: 'Empleado reincorporado' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = IncapacidadController;
