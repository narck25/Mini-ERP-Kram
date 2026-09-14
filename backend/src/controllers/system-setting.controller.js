const SystemSettingService = require('../services/system-setting.service');

class SystemSettingController {
  static async getInventoryStrictMode(req, res) {
    try {
      const enabled = await SystemSettingService.isInventoryStrictMode();
      res.json({ data: { enabled } });
    } catch (error) {
      console.error('Error al obtener configuración de inventario:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async setInventoryStrictMode(req, res) {
    try {
      const { enabled } = req.body;
      await SystemSettingService.setSetting(
        SystemSettingService.INVENTORY_STRICT_MODE_KEY,
        enabled ? 'true' : 'false'
      );
      res.json({ data: { enabled: !!enabled }, message: 'Configuración actualizada' });
    } catch (error) {
      console.error('Error al actualizar configuración de inventario:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = SystemSettingController;
