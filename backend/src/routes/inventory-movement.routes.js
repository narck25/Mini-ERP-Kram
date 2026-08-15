const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const MovementController = require('../controllers/inventory-movement.controller');

// Ver movimientos (kardex de inventario) — ADMIN/RH/COMPRAS
router.get('/inventory-movements',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH', 'COMPRAS']),
  MovementController.list
);

module.exports = router;
