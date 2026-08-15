const { listMovements } = require('../services/purchases/inventory-movement.service');

class InventoryMovementController {
  static async list(req, res) {
    try {
      const { movements, total } = await listMovements(req.query);
      res.json({ data: movements, total });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = InventoryMovementController;
