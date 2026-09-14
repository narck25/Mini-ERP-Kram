const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const SystemSettingController = require('../controllers/system-setting.controller');

// Cualquiera con módulo COMPRAS puede ver si el modo estricto está activo
// (lo necesitan las pantallas de papelería/uniformes para mostrar el aviso).
router.get('/settings/inventory-strict-mode',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('COMPRAS'),
  SystemSettingController.getInventoryStrictMode
);

// Solo ADMIN puede prender/apagar el interruptor.
router.put('/settings/inventory-strict-mode',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole(['ADMIN']),
  SystemSettingController.setInventoryStrictMode
);

module.exports = router;
