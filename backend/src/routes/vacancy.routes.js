const express = require('express');
const router = express.Router();
const vacancyController = require('../controllers/vacancy.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(AuthMiddleware.verifyToken);

// Ruta para obtener datos del formulario de vacante (accesible para todos los roles que pueden crear vacantes)
router.get('/vacancies/form-data', 
  AuthMiddleware.requireRole(['ADMIN', 'RH', 'SISTEMAS', 'COMPRAS', 'PRODUCCION']), 
  vacancyController.getVacancyFormData
);

// Rutas para jefes de área (SISTEMAS, COMPRAS, PRODUCCION)
router.post('/vacancies', 
  AuthMiddleware.requireRole(['SISTEMAS', 'COMPRAS', 'PRODUCCION']), 
  vacancyController.createVacancy
);
router.get('/vacancies/my', 
  AuthMiddleware.requireRole(['SISTEMAS', 'COMPRAS', 'PRODUCCION']), 
  vacancyController.getMyVacancies
);

// Rutas para RH/Admin
router.get('/vacancies', 
  AuthMiddleware.requireRole(['ADMIN', 'RH']), 
  vacancyController.getAllVacancies
);
router.get('/vacancies/stats', 
  AuthMiddleware.requireRole(['ADMIN', 'RH']), 
  vacancyController.getVacancyStats
);
router.put('/vacancies/:id/approve', 
  AuthMiddleware.requireRole(['ADMIN', 'RH']), 
  vacancyController.approveVacancy
);
router.post('/vacancies/:id/activities', 
  AuthMiddleware.requireRole(['ADMIN', 'RH']), 
  vacancyController.addActivity
);
router.put('/activities/:activityId', 
  AuthMiddleware.requireRole(['ADMIN', 'RH']), 
  vacancyController.updateActivity
);

// Rutas públicas (requieren autenticación) - Todos los roles
router.get('/vacancies/:id', 
  AuthMiddleware.requireRole(['ADMIN', 'RH', 'SISTEMAS', 'COMPRAS', 'PRODUCCION']), 
  vacancyController.getVacancyById
);

module.exports = router;
