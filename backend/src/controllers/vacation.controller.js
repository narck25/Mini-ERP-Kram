const VacationService = require('../services/vacaciones/vacation.service');

class VacationController {
  static async create(req, res) {
    try {
      const data = await VacationService.create(req.body, req.user);
      res.status(201).json({ data, message: 'Solicitud de vacaciones creada' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async list(req, res) {
    try {
      const data = await VacationService.list(req.query, req.user);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async myRequests(req, res) {
    try {
      const data = await VacationService.myRequests(req.user);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getBalance(req, res) {
    try {
      const employee = await VacationService.getEmployeeByUser(req.user.id);
      if (!employee) return res.status(404).json({ error: 'No tienes un expediente de empleado asociado' });
      const data = await VacationService.getBalance(employee.id);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPendingForJefe(req, res) {
    try {
      const data = await VacationService.getPendingForJefe(req.user);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async authorizeByJefe(req, res) {
    try {
      const data = await VacationService.authorizeByJefe(req.params.id, req.user, req.body?.comentario);
      res.json({ data, message: 'Solicitud autorizada' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const data = await VacationService.getById(req.params.id);
      if (!data) return res.status(404).json({ error: 'Solicitud no encontrada' });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async approve(req, res) {
    try {
      const data = await VacationService.approve(req.params.id, req.user, req.body?.comentario);
      res.json({ data, message: 'Solicitud aprobada' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async reject(req, res) {
    try {
      const data = await VacationService.reject(req.params.id, req.user, req.body?.comentario);
      res.json({ data, message: 'Solicitud rechazada' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async cancel(req, res) {
    try {
      const data = await VacationService.cancel(req.params.id, req.user);
      res.json({ data, message: 'Solicitud cancelada' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = VacationController;
