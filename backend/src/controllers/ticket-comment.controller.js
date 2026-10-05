const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ticketService = require('../services/ticket.service');
const ticketNotification = require('../services/ticket-notification.service');

// Mismo include que ticket.service.js (TICKET_INCLUDE) para que la
// notificación de "nuevo comentario" tenga todo lo que necesita.
const TICKET_WITH_RELATIONS = {
  solicitante: {
    select: {
      id: true, nombres: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true,
      userId: true, user: { select: { id: true, email: true, name: true } },
    },
  },
  asignado: { select: { id: true, email: true, name: true } },
};

class TicketCommentController {
  static async getComments(req, res) {
    try {
      const { id } = req.params;
      const ticket = await prisma.ticket.findUnique({ where: { id } });
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket no encontrado' });
      }

      const comments = await prisma.ticketComment.findMany({
        where: { ticketId: id },
        include: {
          user: {
            select: {
              id: true, name: true, role: true,
              employee: { select: { id: true, nombre: true, fotoUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      res.json({ comments });
    } catch (error) {
      console.error('🔥 ERROR PRISMA (tickets):', error);
      res.status(500).json({ error: 'No se pudieron obtener los comentarios' });
    }
  }

  static async addComment(req, res) {
    try {
      const { id } = req.params;
      const { mensaje } = req.body;
      const userId = req.user.id;

      if (!mensaje || !mensaje.trim()) {
        return res.status(400).json({ error: 'El comentario no puede estar vacío' });
      }

      const ticket = await prisma.ticket.findUnique({ where: { id }, include: TICKET_WITH_RELATIONS });
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket no encontrado' });
      }

      const isSolicitante = ticket.solicitante.userId === userId;
      if (!isSolicitante && !ticketService.canManage(req.user)) {
        return res.status(403).json({ error: 'No tiene permisos para comentar en este ticket' });
      }

      const comment = await prisma.ticketComment.create({
        data: { ticketId: id, userId, mensaje: mensaje.trim() },
        include: {
          user: {
            select: {
              id: true, name: true, role: true,
              employee: { select: { id: true, nombre: true, fotoUrl: true } },
            },
          },
        },
      });

      try {
        await ticketNotification.notifyNewComment(ticket, userId);
      } catch (notifErr) {
        console.warn('No se pudo notificar el comentario nuevo por correo:', notifErr.message);
      }

      res.status(201).json({ message: 'Comentario agregado', data: comment });
    } catch (error) {
      console.error('🔥 ERROR PRISMA (tickets):', error);
      res.status(500).json({ error: 'No se pudo agregar el comentario' });
    }
  }
}

module.exports = TicketCommentController;
