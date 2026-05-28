const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitment.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(AuthMiddleware.verifyToken);

// Ruta para obtener datos del formulario de vacante (accesible para todos los roles que pueden crear vacantes)
router.get('/vacancies/form-data', 
  AuthMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.getVacancyFormData
);

// Rutas para jefes de área (SISTEMAS, COMPRAS, PRODUCCION)
router.post('/vacancies', 
  AuthMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.createVacancyRequest
);
router.get('/vacancies/my', 
  AuthMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.getMyVacancyRequests
);

// Rutas para RH/Admin
router.get('/vacancies', 
  AuthMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.getAllVacancyRequests
);
router.get('/vacancies/stats', 
  AuthMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.getVacancyRequestStats
);
router.put('/vacancies/:id/approve', 
  AuthMiddleware.requireRHOrAdmin(), 
  recruitmentController.approveVacancyRequest
);
router.post('/vacancies/:id/activities', 
  AuthMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.createJobActivities
);
router.put('/activities/:activityId', 
  AuthMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.updateActivity
);

// Rutas públicas (requieren autenticación) - Todos los roles
router.get('/vacancies/:id', 
  AuthMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.getVacancyRequestById
);

module.exports = router;
