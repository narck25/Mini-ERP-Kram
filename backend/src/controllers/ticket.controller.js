const TicketService = require('../services/ticket.service');
const TicketAttachmentService = require('../services/ticket-attachment.service');
const TicketNotificationService = require('../services/ticket-notification.service');

class TicketController {
  static async create(req, res) {
    try {
      const ticket = await TicketService.create(req.user, req.body, req);

      if (req.files?.length) {
        await TicketAttachmentService.addAttachments(ticket.id, req.files, req.user, req);
      }

      try {
        await TicketNotificationService.notifyNewTicket(ticket);
      } catch (notifErr) {
        console.warn('No se pudo notificar el ticket nuevo por correo:', notifErr.message);
      }

      const data = req.files?.length ? await TicketService.getById(ticket.id, req.user) : ticket;
      res.status(201).json({ data, message: 'Ticket creado' });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async getMy(req, res) {
    try {
      const data = await TicketService.getMy(req.user);
      res.json({ data });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { estatus, categoria, prioridad } = req.query;
      const data = await TicketService.getAll({ estatus, categoria, prioridad });
      res.json({ data });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const data = await TicketService.getById(req.params.id, req.user);
      res.json({ data });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async updateStatus(req, res) {
    try {
      const ticket = await TicketService.updateStatus(req.params.id, req.body.estatus, req.user, req);

      try {
        await TicketNotificationService.notifyStatusChanged(ticket);
      } catch (notifErr) {
        console.warn('No se pudo notificar el cambio de estatus por correo:', notifErr.message);
      }

      res.json({ data: ticket, message: 'Estatus actualizado' });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async assign(req, res) {
    try {
      const data = await TicketService.assign(req.params.id, req.body.asignadoId, req.user, req);
      res.json({ data, message: 'Ticket asignado' });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async cancel(req, res) {
    try {
      const data = await TicketService.cancel(req.params.id, req.user, req);
      res.json({ data, message: 'Ticket cancelado' });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async addAttachments(req, res) {
    try {
      const data = await TicketAttachmentService.addAttachments(req.params.id, req.files, req.user, req);
      res.status(201).json({ data, message: 'Adjuntos agregados' });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
}

module.exports = TicketController;
