const SupplierService = require('../services/purchases/supplier.service');

class SupplierController {
  static async list(req, res) {
    try {
      const { activo } = req.query;
      const suppliers = await SupplierService.list({ activo });
      res.json({ data: suppliers });
    } catch (error) {
      console.error('Error al listar proveedores:', error);
      res.status(error.status || 500).json({ error: error.message || 'Error al listar proveedores' });
    }
  }

  static async create(req, res) {
    try {
      const supplier = await SupplierService.create(req.body);
      res.status(201).json({ data: supplier, message: 'Proveedor agregado al catálogo' });
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      res.status(error.status || 400).json({ error: error.message || 'Error al crear proveedor' });
    }
  }

  static async update(req, res) {
    try {
      const supplier = await SupplierService.update(req.params.id, req.body);
      res.json({ data: supplier, message: 'Proveedor actualizado' });
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      res.status(error.status || 400).json({ error: error.message || 'Error al actualizar proveedor' });
    }
  }
}

module.exports = SupplierController;
