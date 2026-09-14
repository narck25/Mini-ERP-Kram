const DisciplinaryIncidentService = require('../services/disciplinaryIncident.service');

class DisciplinaryIncidentController {
  static async create(req, res) {
    try {
      const archivoUrl = req.file ? `/uploads/disciplinary-incidents/${req.file.filename}` : null;
      const incident = await DisciplinaryIncidentService.create(req.body, req.user, archivoUrl, req);
      res.status(201).json({ data: incident, message: 'Incidencia registrada' });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const incident = await DisciplinaryIncidentService.update(req.params.id, req.body, req.user, req);
      res.json({ data: incident, message: 'Incidencia actualizada' });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async listByEmployee(req, res) {
    try {
      const data = await DisciplinaryIncidentService.listByEmployee(req.params.employeeId, req.user);
      res.json(data);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
}

module.exports = DisciplinaryIncidentController;
