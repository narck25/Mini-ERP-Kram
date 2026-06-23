const StationeryService = require('../services/purchases/stationery.service');

class StationeryController {
  // ─── SOLICITUDES (USUARIO) ───

  static async getMyRequests(req, res) {
    try {
      const employeeId = req.user.employeeId;
      if (!employeeId) {
        return res.status(400).json({ error: 'No tienes un empleado asociado' });
      }
      const requests = await StationeryService.getMyRequests(employeeId);
      res.json({ data: requests });
    } catch (error) {
      console.error('Error al obtener mis solicitudes de papelería:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async createRequest(req, res) {
    try {
      const employeeId = req.user.employeeId;
      if (!employeeId) {
        return res.status(400).json({ error: 'No tienes un empleado asociado' });
      }
      const request = await StationeryService.createRequest(req.body, employeeId);
      res.status(201).json({ data: request, message: 'Solicitud creada exitosamente' });
    } catch (error) {
      console.error('Error al crear solicitud de papelería:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async cancelRequest(req, res) {
    try {
      const employeeId = req.user.employeeId;
      if (!employeeId) {
        return res.status(400).json({ error: 'No tienes un empleado asociado' });
      }
      const request = await StationeryService.cancelRequest(req.params.id, employeeId);
      res.json({ data: request, message: 'Solicitud cancelada' });
    } catch (error) {
      console.error('Error al cancelar solicitud:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // ─── GESTIÓN (ADMIN/COMPRAS) ───

  static async getAllRequests(req, res) {
    try {
      const { estatus, departamentoId } = req.query;
      const requests = await StationeryService.getAllRequests({ estatus, departamentoId });
      res.json({ data: requests });
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getRequestById(req, res) {
    try {
      const request = await StationeryService.getRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }
      res.json({ data: request });
    } catch (error) {
      console.error('Error al obtener solicitud:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async deliverRequest(req, res) {
    try {
      const entregadoPorId = req.user.employeeId;
      if (!entregadoPorId) {
        return res.status(400).json({ error: 'No tienes un empleado asociado' });
      }
      const request = await StationeryService.deliverRequest(req.params.id, entregadoPorId);
      res.json({ data: request, message: 'Solicitud marcada como entregada' });
    } catch (error) {
      console.error('Error al entregar solicitud:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // ─── INVENTARIO ───

  static async getInventory(req, res) {
    try {
      const { categoria } = req.query;
      const inventory = await StationeryService.getInventory({ categoria });
      res.json({ data: inventory });
    } catch (error) {
      console.error('Error al obtener inventario:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async addInventoryItem(req, res) {
    try {
      const item = await StationeryService.addInventoryItem(req.body);
      res.status(201).json({ data: item, message: 'Producto agregado al inventario' });
    } catch (error) {
      console.error('Error al agregar producto:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async updateInventoryItem(req, res) {
    try {
      const item = await StationeryService.updateInventoryItem(req.params.id, req.body);
      res.json({ data: item, message: 'Producto actualizado' });
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteInventoryItem(req, res) {
    try {
      await StationeryService.deleteInventoryItem(req.params.id);
      res.json({ message: 'Producto eliminado del inventario' });
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = StationeryController;
