const IncapacidadService = require('../services/incapacidades/incapacidad.service');

class IncapacidadController {
  static async create(req, res) {
    try {
      const data = await IncapacidadService.create(req.body, req.user);
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
      res.json({ data, message: 'Empleado reincorporado' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = IncapacidadController;
