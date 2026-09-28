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

  static async getProbationEvaluationsEnabled(req, res) {
    try {
      const enabled = await SystemSettingService.isProbationEvaluationsEnabled();
      res.json({ data: { enabled } });
    } catch (error) {
      console.error('Error al obtener configuración de periodo de prueba:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async setProbationEvaluationsEnabled(req, res) {
    try {
      const { enabled } = req.body;
      await SystemSettingService.setSetting(
        SystemSettingService.PROBATION_EVALUATIONS_ENABLED_KEY,
        enabled ? 'true' : 'false'
      );
      res.json({ data: { enabled: !!enabled }, message: 'Configuración actualizada' });
    } catch (error) {
      console.error('Error al actualizar configuración de periodo de prueba:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getOperationalEvaluationsEnabled(req, res) {
    try {
      const enabled = await SystemSettingService.isOperationalEvaluationsEnabled();
      res.json({ data: { enabled } });
    } catch (error) {
      console.error('Error al obtener configuración de evaluación operativa:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async setOperationalEvaluationsEnabled(req, res) {
    try {
      const { enabled } = req.body;
      await SystemSettingService.setSetting(
        SystemSettingService.OPERATIONAL_EVALUATIONS_ENABLED_KEY,
        enabled ? 'true' : 'false'
      );
      res.json({ data: { enabled: !!enabled }, message: 'Configuración actualizada' });
    } catch (error) {
      console.error('Error al actualizar configuración de evaluación operativa:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = SystemSettingController;
