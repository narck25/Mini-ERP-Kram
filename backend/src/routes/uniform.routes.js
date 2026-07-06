const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const UniformController = require('../controllers/uniform.controller');

// ─── Inventario (Admin/Compras) ───
router.get('/uniforms/inventory',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  UniformController.getInventory
);

router.post('/uniforms/inventory',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  UniformController.addInventoryItem
);

router.put('/uniforms/inventory/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  UniformController.updateInventoryItem
);

router.delete('/uniforms/inventory/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  UniformController.deleteInventoryItem
);

// ─── Entregas (Admin/Compras) ───
router.post('/uniforms/deliveries',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  UniformController.createDelivery
);

router.get('/uniforms/deliveries',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  UniformController.getDeliveries
);

router.get('/uniforms/deliveries/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  UniformController.getDeliveryById
);

// ─── Historial por empleado (módulo COMPRAS) ───
router.get('/uniforms/employees/:empleadoId/history',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  UniformController.getEmployeeHistory
);

module.exports = router;
