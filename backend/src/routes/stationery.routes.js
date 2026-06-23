const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const StationeryController = require('../controllers/stationery.controller');

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

// ─── Rutas de inventario (Admin/Compras) ───
// IMPORTANTE: Las rutas fijas (/inventory) deben ir ANTES que las rutas con parámetros (/:id)
router.get('/stationery/inventory',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  StationeryController.getInventory
);

router.post('/stationery/inventory',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  StationeryController.addInventoryItem
);

router.put('/stationery/inventory/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  StationeryController.updateInventoryItem
);

router.delete('/stationery/inventory/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  StationeryController.deleteInventoryItem
);

// ─── Rutas de gestión (Admin/Compras) - con parámetro :id ───
router.get('/stationery',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  StationeryController.getAllRequests
);

router.get('/stationery/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  StationeryController.getRequestById
);

router.post('/stationery/:id/deliver',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  StationeryController.deliverRequest
);

module.exports = router;
