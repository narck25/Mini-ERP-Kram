const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { upload, ensureTempDir } = require('../middlewares/upload.middleware');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.verifyToken);

// Rutas para jefes de área (SISTEMAS, COMPRAS, PRODUCCION) - Flujo Estándar
router.post('/recruitment/vacancies', 
  authMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.createVacancyRequest
);
router.get('/recruitment/my-vacancies', 
  authMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.getMyVacancyRequests
);
router.put('/recruitment/vacancies/:id/technical-profile', 
  authMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.updateTechnicalProfile
);

// Rutas para actividades del puesto (Flujo Estándar) - Solo jefes de área
router.post('/recruitment/vacancies/:id/activities', 
  authMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.createJobActivities
);

// Rutas para RH y ADMIN
router.get('/recruitment/vacancies', 
  authMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.getAllVacancyRequests
);
router.put('/recruitment/vacancies/:id/approve', 
  authMiddleware.requireRHOrAdmin(), 
  recruitmentController.approveVacancyRequest
);
router.put('/recruitment/vacancies/:id/close', 
  authMiddleware.requireRHOrAdmin(), 
  recruitmentController.closeVacancyRequest
);
router.get('/recruitment/vacancies/stats', 
  authMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.getVacancyRequestStats
);

// Rutas para Flujo Directo/Fast-Track (exclusivo RH/ADMIN)
router.post('/recruitment/vacancies/direct', 
  authMiddleware.requireRHOrAdmin(), 
  recruitmentController.createDirectVacancy
);

// Rutas comunes (accesibles por todos los roles autorizados)
router.get('/recruitment/vacancies/:id', 
  authMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.getVacancyRequestById
);
router.post('/recruitment/vacancies/:id/comments', 
  authMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.addComment
);

// Rutas para gestión de candidatos
// RH: Registrar candidatos con CV y Pruebas Psicométricas (solo RH/ADMIN)
router.post('/recruitment/vacancies/:vacancy_id/candidates',
  authMiddleware.requireRHOrAdmin(),
  ensureTempDir,
  upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'psychTest', maxCount: 1 }
  ]),
  recruitmentController.createCandidate
);

// RH: Actualizar observaciones de candidatos (solo RH/ADMIN)
router.put('/recruitment/candidates/:candidate_id/observations', 
  authMiddleware.requireRHOrAdmin(), 
  recruitmentController.updateCandidateObservations
);

// Solicitante: Votar por candidatos (like/dislike) - Solo jefes de área
router.put('/recruitment/candidates/:candidate_id/vote', 
  authMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.updateCandidateVote
);

// Solicitante: Seleccionar candidato final y cerrar vacante - Solo jefes de área
router.put('/recruitment/candidates/:candidate_id/select', 
  authMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.selectCandidate
);

// Descargar CV de candidato - Todos los roles autorizados
router.get('/recruitment/candidates/:candidate_id/cv', 
  authMiddleware.requireModule('RECLUTAMIENTO'), 
  recruitmentController.downloadCandidateCV
);

module.exports = router;
