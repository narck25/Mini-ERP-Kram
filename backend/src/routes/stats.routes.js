const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.verifyToken);

// Dashboard de RH (nuevo endpoint optimizado)
router.get('/stats/rh/dashboard',
  authMiddleware.requireModule('EMPLEADOS'),
  statsController.getRHDashboardStats
);

// Estadísticas para Mi Espacio (accesible desde EMPLEADOS, RECLUTAMIENTO, o COMPRAS)
router.get('/stats/my-dashboard',
  authMiddleware.verifyToken,
  statsController.getMyDashboardStats
);

// Estadísticas del sistema (solo ADMIN - Nivel C)
router.get('/stats/system',
  authMiddleware.requireModule('CONFIGURACION'),
  statsController.getSystemStats
);

module.exports = router;
