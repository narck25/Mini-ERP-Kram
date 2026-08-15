const AdjustmentService = require('../services/purchases/inventory-adjustment.service');

class InventoryAdjustmentController {
  static async create(req, res) {
    try {
      const request = await AdjustmentService.createAdjustment(req.user.id, req.body);
      res.status(201).json({ data: request, message: 'Solicitud de ajuste enviada para aprobación' });
    } catch (error) {
      res.status(error.status || 400).json({ error: error.error || 'Error', message: error.message });
    }
  }

  static async list(req, res) {
    try {
      const requests = await AdjustmentService.listAdjustments(req);
      res.json({ data: requests });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async approve(req, res) {
    try {
      const request = await AdjustmentService.approveAdjustment(req.params.id, req.user.id);
      res.json({ data: request, message: 'Solicitud aprobada y ajuste aplicado' });
    } catch (error) {
      res.status(error.status || 400).json({ error: error.error || 'Error', message: error.message });
    }
  }

  static async reject(req, res) {
    try {
      const request = await AdjustmentService.rejectAdjustment(req.params.id, req.user.id, req.body.comentario);
      res.json({ data: request, message: 'Solicitud rechazada' });
    } catch (error) {
      res.status(error.status || 400).json({ error: error.error || 'Error', message: error.message });
    }
  }
}

module.exports = InventoryAdjustmentController;
