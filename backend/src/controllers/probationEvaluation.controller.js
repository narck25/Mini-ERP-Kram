const ProbationEvaluationService = require('../services/probationEvaluation.service');

class ProbationEvaluationController {
  static async list(req, res) {
    try {
      const data = await ProbationEvaluationService.getAll();
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPendingForJefe(req, res) {
    try {
      const data = await ProbationEvaluationService.getPendingForJefe(req.user);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async capture(req, res) {
    try {
      const data = await ProbationEvaluationService.capturar(req.params.id, req.body, req.user, req);
      res.json({ data, message: 'Evaluación capturada' });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
}

module.exports = ProbationEvaluationController;
