const express = require('express');
const router = express.Router();
const vacancyController = require('../controllers/vacancy.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(AuthMiddleware.verifyToken);

// Rutas para jefes de área
router.post('/vacancies', vacancyController.createVacancy);
router.get('/vacancies/my', vacancyController.getMyVacancies);

// Rutas para RH/Admin
router.get('/vacancies', vacancyController.getAllVacancies);
router.get('/vacancies/stats', vacancyController.getVacancyStats);
router.put('/vacancies/:id/approve', vacancyController.approveVacancy);
router.post('/vacancies/:id/activities', vacancyController.addActivity);
router.put('/activities/:activityId', vacancyController.updateActivity);

// Rutas públicas (requieren autenticación)
router.get('/vacancies/:id', vacancyController.getVacancyById);

module.exports = router;
