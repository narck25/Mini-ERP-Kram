const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { upload, uploadCV, uploadPsychTest, uploadCandidate, ensureUploadDirs, handleMulterError, validateFileContent } = require('../middlewares/upload.middleware');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.verifyToken);

// Jefe de área, Gerente, Director o Presidente: pueden solicitar/gestionar sus
// propias vacantes aunque no tengan el módulo RECLUTAMIENTO asignado — el puesto
// (nivelJerarquico) y el rol del sistema (accessibleModules) son ejes independientes.
const NIVELES_SOLICITANTE = ['JEFE', 'GERENTE', 'DIRECTOR', 'PRESIDENTE'];

// Datos para formulario de solicitud de vacante (departamentos + puestos)
router.get('/vacancies/form-data',
  authMiddleware.requireModuleOrNivel('RECLUTAMIENTO', NIVELES_SOLICITANTE),
  recruitmentController.getVacancyFormData
);

// Alias cortos para crear vacante (el frontend llama a /api/vacancies/*)
router.post('/vacancies',
  authMiddleware.requireModuleOrNivel('RECLUTAMIENTO', NIVELES_SOLICITANTE),
  recruitmentController.createVacancyRequest
);
router.get('/vacancies',
  authMiddleware.requireModule('RECLUTAMIENTO'),
  recruitmentController.getAllVacancyRequests
);
router.get('/vacancies/my',
  authMiddleware.requireModuleOrNivel('RECLUTAMIENTO', NIVELES_SOLICITANTE),
  recruitmentController.getMyVacancyRequests
);
router.get('/vacancies/stats',
  authMiddleware.requireModule('RECLUTAMIENTO'),
  recruitmentController.getVacancyRequestStats
);
router.get('/vacancies/:id',
  authMiddleware.requireModuleOrNivel('RECLUTAMIENTO', NIVELES_SOLICITANTE),
  recruitmentController.getVacancyRequestById
);


// Rutas para jefes de área (SISTEMAS, COMPRAS, PRODUCCION) - Flujo Estándar
router.post('/recruitment/vacancies',



  authMiddleware.requireModuleOrNivel('RECLUTAMIENTO', NIVELES_SOLICITANTE),
  recruitmentController.createVacancyRequest
);
router.get('/recruitment/my-vacancies',
  authMiddleware.requireModuleOrNivel('RECLUTAMIENTO', NIVELES_SOLICITANTE),
  recruitmentController.getMyVacancyRequests
);
router.put('/recruitment/vacancies/:id/technical-profile',
  authMiddleware.requireModuleOrNivel('RECLUTAMIENTO', NIVELES_SOLICITANTE),
  recruitmentController.updateTechnicalProfile
);

// Rutas para actividades del puesto (Flujo Estándar) - Solo jefes de área
router.post('/recruitment/vacancies/:id/activities',
  authMiddleware.requireModuleOrNivel('RECLUTAMIENTO', NIVELES_SOLICITANTE),
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
  authMiddleware.requireModuleOrNivel('RECLUTAMIENTO', NIVELES_SOLICITANTE),
  recruitmentController.getVacancyRequestById
);
router.post('/recruitment/vacancies/:id/comments',
  authMiddleware.requireModuleOrNivel('RECLUTAMIENTO', NIVELES_SOLICITANTE),
  recruitmentController.addComment
);

// Rutas para gestión de candidatos
// RH: Registrar candidatos con CV y Pruebas Psicométricas (solo RH/ADMIN)
router.post('/recruitment/vacancies/:vacancy_id/candidates',
  authMiddleware.requireRHOrAdmin(),
  ensureUploadDirs,
  uploadCandidate.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'psychTest', maxCount: 1 }
  ]),
  validateFileContent,
  (req, res, next) => {
    // Mover psychTest a la carpeta psych-tests si existe
    if (req.files?.psychTest?.[0]) {
      const psychFile = req.files.psychTest[0];
      const fs = require('fs');
      const path = require('path');
      const oldPath = psychFile.path;
      const newPath = path.join(path.dirname(oldPath).replace('cvs', 'psych-tests'), psychFile.filename);
      const newDir = path.dirname(newPath);
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
      }
      fs.renameSync(oldPath, newPath);
      psychFile.path = newPath;
      psychFile.destination = newDir;
    }
    next();
  },
  recruitmentController.createCandidate
);

// RH: Actualizar observaciones de candidatos (solo RH/ADMIN)
router.put('/recruitment/candidates/:candidate_id/observations', 
  authMiddleware.requireRHOrAdmin(), 
  recruitmentController.updateCandidateObservations
);

// RH: Actualizar documentos de candidatos (CV y/o pruebas psicométricas) - Solo RH/ADMIN
router.put('/recruitment/candidates/:candidate_id/documents',
  authMiddleware.requireRHOrAdmin(),
  ensureUploadDirs,
  uploadCandidate.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'psychTest', maxCount: 1 }
  ]),
  validateFileContent,
  (req, res, next) => {
    // Mover psychTest a la carpeta psych-tests si existe
    if (req.files?.psychTest?.[0]) {
      const psychFile = req.files.psychTest[0];
      const fs = require('fs');
      const path = require('path');
      const oldPath = psychFile.path;
      const newPath = path.join(path.dirname(oldPath).replace('cvs', 'psych-tests'), psychFile.filename);
      const newDir = path.dirname(newPath);
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
      }
      fs.renameSync(oldPath, newPath);
      psychFile.path = newPath;
      psychFile.destination = newDir;
    }
    next();
  },
  recruitmentController.updateCandidateDocuments
);

// Solicitante: Votar por candidatos (like/dislike) - Solo jefes de área
router.put('/recruitment/candidates/:candidate_id/vote',
  authMiddleware.requireModuleOrNivel('RECLUTAMIENTO', NIVELES_SOLICITANTE),
  recruitmentController.updateCandidateVote
);

// Solicitante: Seleccionar candidato final y cerrar vacante - Solo jefes de área
router.put('/recruitment/candidates/:candidate_id/select',
  authMiddleware.requireModuleOrNivel('RECLUTAMIENTO', NIVELES_SOLICITANTE),
  recruitmentController.selectCandidate
);

// Descargar CV de candidato - Todos los roles autorizados
router.get('/recruitment/candidates/:candidate_id/cv',
  authMiddleware.requireModuleOrNivel('RECLUTAMIENTO', NIVELES_SOLICITANTE),
  recruitmentController.downloadCandidateCV
);

// Eliminar vacante completamente (solo RH/ADMIN)
router.delete('/recruitment/vacancies/:id',
  authMiddleware.requireRHOrAdmin(),
  recruitmentController.deleteVacancy
);

// Actualizar actividad (marcar como completada)
router.put('/recruitment/activities/:activityId',
  authMiddleware.requireModuleOrNivel('RECLUTAMIENTO', NIVELES_SOLICITANTE),
  recruitmentController.updateActivity
);

// Cancelar vacante por el solicitante (cambia a estado Cerrada)
router.put('/recruitment/vacancies/:id/cancel',
  authMiddleware.requireModuleOrNivel('RECLUTAMIENTO', NIVELES_SOLICITANTE),
  recruitmentController.cancelVacancy
);

module.exports = router;
