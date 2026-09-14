const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const StationeryController = require('../controllers/stationery.controller');
const StationeryCommentController = require('../controllers/stationery-comment.controller');

// ─── Rutas de usuario (cualquier empleado autenticado) ───
router.get('/stationery/my',
  AuthMiddleware.verifyToken,
  StationeryController.getMyRequests
);

router.post('/stationery',
  AuthMiddleware.verifyToken,
  StationeryController.createRequest
);

router.post('/stationery/:id/cancel',
  AuthMiddleware.verifyToken,
  StationeryController.cancelRequest
);

router.post('/stationery/:id/close',
  AuthMiddleware.verifyToken,
  StationeryController.closeRequest
);

// ─── Comentarios (solicitante o módulo COMPRAS) ───
router.get('/stationery/:id/comments',
  AuthMiddleware.verifyToken,
  StationeryCommentController.getComments
);

router.post('/stationery/:id/comments',
  AuthMiddleware.verifyToken,
  StationeryCommentController.addComment
);

// ─── Rutas de inventario (módulo COMPRAS) ───
// IMPORTANTE: Las rutas fijas (/inventory) deben ir ANTES que las rutas con parámetros (/:id)
router.get('/stationery/inventory',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH', 'COMPRAS']),
  StationeryController.getInventory
);

router.post('/stationery/inventory',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH']),
  StationeryController.addInventoryItem
);

router.put('/stationery/inventory/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH']),
  StationeryController.updateInventoryItem
);

router.delete('/stationery/inventory/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH']),
  StationeryController.deleteInventoryItem
);

router.post('/stationery/inventory/:id/restock',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH', 'COMPRAS']),
  StationeryController.restockInventoryItem
);

// ─── Rutas de gestión (módulo COMPRAS) - con parámetro :id ───
router.get('/stationery',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  StationeryController.getAllRequests
);

// Sin requireModule('COMPRAS'): el propio solicitante debe poder ver su
// solicitud aunque no tenga ese módulo asignado. El controller valida que
// sea el dueño o tenga rol ADMIN/COMPRAS.
router.get('/stationery/:id',
  AuthMiddleware.verifyToken,
  StationeryController.getRequestById
);

router.post('/stationery/:id/deliver',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  StationeryController.deliverRequest
);

module.exports = router;
