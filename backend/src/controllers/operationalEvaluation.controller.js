const OperationalEvaluationService = require('../services/operationalEvaluation.service');
const { PUESTOS_ELEGIBLES, PUESTOS } = require('../config/operationalEvaluationCriteria.config');

class OperationalEvaluationController {
  static async list(req, res) {
    try {
      const data = await OperationalEvaluationService.getAll();
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPendingForJefe(req, res) {
    try {
      const data = await OperationalEvaluationService.getPendingForJefe(req.user);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const data = await OperationalEvaluationService.getById(req.params.id, req.user);
      res.json({ data });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async capture(req, res) {
    try {
      const data = await OperationalEvaluationService.capturar(req.params.id, req.body, req.user, req);
      res.json({ data, message: 'Evaluación capturada' });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  // Plantillas fijas de criterios (los 6 puestos), para que el frontend no
  // las duplique a mano — es la misma constante que usa el backend.
  static async getCriteriaTemplates(req, res) {
    res.json({ data: { puestos: PUESTOS_ELEGIBLES, templates: PUESTOS } });
  }
}

module.exports = OperationalEvaluationController;
