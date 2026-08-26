const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const UniformController = require('../controllers/uniform.controller');

// ─── Inventario (Admin/Compras) ───
router.get('/uniforms/inventory',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH', 'COMPRAS']),
  UniformController.getInventory
);

router.post('/uniforms/inventory',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH']),
  UniformController.addInventoryItem
);

router.put('/uniforms/inventory/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH']),
  UniformController.updateInventoryItem
);

router.delete('/uniforms/inventory/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH']),
  UniformController.deleteInventoryItem
);

router.post('/uniforms/inventory/:id/restock',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH', 'COMPRAS']),
  UniformController.restockInventoryItem
);

// ─── Entregas (Admin/RH/Compras) ───
// Solo RH y Compras asignan uniformes; un empleado sin estos roles no debe acceder.
router.post('/uniforms/deliveries',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH', 'COMPRAS']),
  UniformController.createDelivery
);

router.get('/uniforms/deliveries',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH', 'COMPRAS']),
  UniformController.getDeliveries
);

router.get('/uniforms/deliveries/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH', 'COMPRAS']),
  UniformController.getDeliveryById
);

// Empleados disponibles para el selector de entrega (Admin/RH/Compras).
router.get('/uniforms/employees',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH', 'COMPRAS']),
  UniformController.listEmployees
);

// ─── Historial por empleado (Admin/RH/Compras) ───
router.get('/uniforms/employees/:empleadoId/history',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'RH', 'COMPRAS']),
  UniformController.getEmployeeHistory
);

module.exports = router;
