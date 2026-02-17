const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { upload, ensureTempDir } = require('../middlewares/upload.middleware');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.verifyToken);

// Rutas para jefes de área (SISTEMAS, COMPRAS)
router.post('/recruitment/vacancies', recruitmentController.createVacancyRequest);
router.get('/recruitment/my-vacancies', recruitmentController.getMyVacancyRequests);
router.put('/recruitment/vacancies/:id/technical-profile', recruitmentController.updateTechnicalProfile);

// Rutas para RH y ADMIN
router.get('/recruitment/vacancies', recruitmentController.getAllVacancyRequests);
router.put('/recruitment/vacancies/:id/approve', recruitmentController.approveVacancyRequest);
router.put('/recruitment/vacancies/:id/close', recruitmentController.closeVacancyRequest);
router.get('/recruitment/vacancies/stats', recruitmentController.getVacancyRequestStats);

// Rutas comunes (accesibles por todos los roles autorizados)
router.get('/recruitment/vacancies/:id', recruitmentController.getVacancyRequestById);
router.post('/recruitment/vacancies/:id/comments', recruitmentController.addComment);

// Rutas para gestión de candidatos
// RH: Registrar candidatos con CV
router.post('/recruitment/vacancies/:vacancy_id/candidates',
  ensureTempDir,
  upload.single('cv'),
  recruitmentController.createCandidate
);

// RH: Actualizar observaciones de candidatos
router.put('/recruitment/candidates/:candidate_id/observations', recruitmentController.updateCandidateObservations);

// Solicitante: Votar por candidatos (like/dislike)
router.put('/recruitment/candidates/:candidate_id/vote', recruitmentController.updateCandidateVote);

// Solicitante: Seleccionar candidato final y cerrar vacante
router.put('/recruitment/candidates/:candidate_id/select', recruitmentController.selectCandidate);

// Descargar CV de candidato
router.get('/recruitment/candidates/:candidate_id/cv', recruitmentController.downloadCandidateCV);

module.exports = router;
