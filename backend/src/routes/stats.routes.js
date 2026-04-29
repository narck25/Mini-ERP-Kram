const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.verifyToken);

// Estadísticas para RH (endpoint antiguo - mantener compatibilidad)
router.get('/stats/rh',
  authMiddleware.requireRole(['ADMIN', 'RH']),
  statsController.getRHStats
);

// Dashboard de RH (nuevo endpoint optimizado)
router.get('/stats/rh/dashboard',
  authMiddleware.requireModule('EMPLEADOS'),
  statsController.getRHDashboardStats
);

// Estadísticas para jefes de departamento
router.get('/stats/department',
  authMiddleware.requireRole(['SISTEMAS', 'COMPRAS', 'PRODUCCION']),
  statsController.getDepartmentStats
);

// Estadísticas del sistema (solo ADMIN)
router.get('/stats/system',
  authMiddleware.requireRole(['ADMIN']),
  statsController.getSystemStats
);

module.exports = router;
