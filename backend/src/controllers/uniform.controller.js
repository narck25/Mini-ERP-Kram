const UniformService = require('../services/purchases/uniform.service');

class UniformController {
  // ─── INVENTARIO ───

  static async getInventory(req, res) {
    try {
      const { tipo, talla } = req.query;
      const inventory = await UniformService.getInventory({ tipo, talla });
      res.json({ data: inventory });
    } catch (error) {
      console.error('Error al obtener inventario de uniformes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async addInventoryItem(req, res) {
    try {
      const item = await UniformService.addInventoryItem(req.body, req.user.id);
      res.status(201).json({ data: item, message: 'Producto agregado al inventario' });
    } catch (error) {
      console.error('Error al agregar producto:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async updateInventoryItem(req, res) {
    try {
      const item = await UniformService.updateInventoryItem(req.params.id, req.body, req.user.id);
      res.json({ data: item, message: 'Producto actualizado' });
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteInventoryItem(req, res) {
    try {
      await UniformService.deleteInventoryItem(req.params.id, req.user.id);
      res.json({ message: 'Producto eliminado del inventario' });
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // ─── ENTREGAS ───

  static async listEmployees(req, res) {
    try {
      const employees = await UniformService.listEmployees();
      res.json({ data: employees });
    } catch (error) {
      console.error('Error al listar empleados:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async createDelivery(req, res) {
    try {
      const entregadoPorId = req.user.employeeId;
      if (!entregadoPorId) {
        return res.status(400).json({ error: 'No tienes un empleado asociado. Contacta a RH para que te asignen uno.' });
      }
      const delivery = await UniformService.createDelivery(req.body, entregadoPorId, req.user.id);
      res.status(201).json({ data: delivery, message: 'Entrega registrada exitosamente' });
    } catch (error) {
      console.error('Error al crear entrega:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getDeliveries(req, res) {
    try {
      const { empleadoId } = req.query;
      const deliveries = await UniformService.getDeliveries({ empleadoId });
      res.json({ data: deliveries });
    } catch (error) {
      console.error('Error al obtener entregas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getDeliveryById(req, res) {
    try {
      const delivery = await UniformService.getDeliveryById(req.params.id);
      if (!delivery) {
        return res.status(404).json({ error: 'Entrega no encontrada' });
      }
      res.json({ data: delivery });
    } catch (error) {
      console.error('Error al obtener entrega:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ─── HISTORIAL POR EMPLEADO (RH) ───

  static async getEmployeeHistory(req, res) {
    try {
      const { empleadoId } = req.params;
      const history = await UniformService.getEmployeeHistory(empleadoId);
      res.json({ data: history });
    } catch (error) {
      console.error('Error al obtener historial:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async restockInventoryItem(req, res) {
    try {
      const item = await UniformService.restockInventoryItem(req.params.id, req.body.cantidad, req.user.id);
      res.json({ data: item, message: 'Stock reabastecido' });
    } catch (error) {
      console.error('Error al reabastecer:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = UniformController;
