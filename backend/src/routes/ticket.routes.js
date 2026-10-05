const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const { uploadTicketAttachments, handleMulterError, validateFileContent } = require('../middlewares/upload.middleware');
const TicketController = require('../controllers/ticket.controller');
const TicketCommentController = require('../controllers/ticket-comment.controller');

// Comentarios estilo blog (sin tiempo real) a propósito: en un ticket de
// soporte lo normal es comentar y que la otra parte responda más tarde, no
// ambos viendo la pantalla a la vez — no amerita la complejidad de SSE.
router.use(AuthMiddleware.verifyToken);

// Crear ticket (con o sin adjuntos en la misma llamada) — cualquier empleado
// con el módulo TICKETS, que lo tienen todos los roles por defecto.
router.post(
  '/tickets',
  AuthMiddleware.requireModule('TICKETS'),
  uploadTicketAttachments.array('files', 5),
  handleMulterError,
  validateFileContent,
  TicketController.create
);

// IMPORTANTE: debe ir antes de /tickets/:id para evitar conflicto de rutas.
router.get('/tickets/my', AuthMiddleware.requireModule('TICKETS'), TicketController.getMy);

// Cola completa de TI — solo Sistemas/Admin.
router.get('/tickets', AuthMiddleware.requireSistemasOrAdmin(), TicketController.getAll);

router.get('/tickets/:id', AuthMiddleware.requireModule('TICKETS'), TicketController.getById);

router.patch('/tickets/:id/status', AuthMiddleware.requireSistemasOrAdmin(), TicketController.updateStatus);
router.patch('/tickets/:id/assign', AuthMiddleware.requireSistemasOrAdmin(), TicketController.assign);

// Cancelar — el propio solicitante o Sistemas/Admin (ownership validado en el servicio).
router.post('/tickets/:id/cancel', AuthMiddleware.requireModule('TICKETS'), TicketController.cancel);

router.post(
  '/tickets/:id/attachments',
  AuthMiddleware.requireModule('TICKETS'),
  uploadTicketAttachments.array('files', 5),
  handleMulterError,
  validateFileContent,
  TicketController.addAttachments
);

router.get('/tickets/:id/comments', AuthMiddleware.requireModule('TICKETS'), TicketCommentController.getComments);
router.post('/tickets/:id/comments', AuthMiddleware.requireModule('TICKETS'), TicketCommentController.addComment);

module.exports = router;
