const OperationalEvaluationService = require('../services/operationalEvaluation.service');
const { PUESTOS_ELEGIBLES, PUESTOS, CANONICAL_BY_ALIAS } = require('../config/operationalEvaluationCriteria.config');

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
  // las duplique a mano — es la misma constante que usa el backend. También
  // se manda el mapa de alias (puesto real del CSV -> puesto canónico) para
  // que el frontend resuelva la plantilla igual que getTemplateByPuestoNombre,
  // en vez de buscar la clave exacta y fallar con puestos como "AYUDANTE DE
  // ALMACEN CUN" que no coinciden letra por letra con el nombre canónico.
  static async getCriteriaTemplates(req, res) {
    res.json({ data: { puestos: PUESTOS_ELEGIBLES, templates: PUESTOS, aliases: CANONICAL_BY_ALIAS } });
  }
}

module.exports = OperationalEvaluationController;
