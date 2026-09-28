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

// RH/ADMIN puede ver y prender/apagar el módulo de Periodo de Prueba (mismo
// nivel de permiso que ya tienen sobre el módulo en sí, ver probationEvaluation.routes.js).
router.get('/settings/probation-evaluations-enabled',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRHOrAdmin(),
  SystemSettingController.getProbationEvaluationsEnabled
);
router.put('/settings/probation-evaluations-enabled',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRHOrAdmin(),
  SystemSettingController.setProbationEvaluationsEnabled
);

// RH/ADMIN puede ver y prender/apagar el módulo de Evaluación Operativa Trimestral.
router.get('/settings/operational-evaluations-enabled',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRHOrAdmin(),
  SystemSettingController.getOperationalEvaluationsEnabled
);
router.put('/settings/operational-evaluations-enabled',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRHOrAdmin(),
  SystemSettingController.setOperationalEvaluationsEnabled
);

module.exports = router;
