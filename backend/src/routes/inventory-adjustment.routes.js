const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const AdjustmentController = require('../controllers/inventory-adjustment.controller');

// Solicitar ajuste (cualquier usuario con módulo COMPRAS)
router.post('/inventory-adjustments',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AdjustmentController.create
);

// Listar solicitudes (ADMIN/RH ven todas; otros solo las propias)
router.get('/inventory-adjustments',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AdjustmentController.list
);

// Aprobar (solo ADMIN/RH) — aplica el ajuste al inventario
router.post('/inventory-adjustments/:id/approve',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole(['ADMIN', 'RH']),
  AdjustmentController.approve
);

// Rechazar (solo ADMIN/RH)
router.post('/inventory-adjustments/:id/reject',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole(['ADMIN', 'RH']),
  AdjustmentController.reject
);

module.exports = router;
