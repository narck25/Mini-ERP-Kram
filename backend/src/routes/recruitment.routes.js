const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { upload, uploadCV, uploadPsychTest, uploadCandidate, ensureUploadDirs, handleMulterError, validateFileContent } = require('../middlewares/upload.middleware');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.verifyToken);

// Cualquier jefe directo (tiene al menos un reporte en Employee.reportaAId)
// puede solicitar/gestionar sus propias vacantes aunque no tenga el módulo
// RECLUTAMIENTO asignado — el puesto y el rol del sistema (accessibleModules)
// son ejes independientes, y usar "¿tiene gente a cargo?" en vez de una lista
// fija de niveles cubre a cualquier COORDINADOR/SUPERVISOR con equipo real.

// Datos para formulario de solicitud de vacante (departamentos + puestos)
router.get('/vacancies/form-data',
  authMiddleware.requireModuleOrHasDirectReports('RECLUTAMIENTO'),
  recruitmentController.getVacancyFormData
);

// Alias cortos para crear vacante (el frontend llama a /api/vacancies/*)
router.post('/vacancies',
  authMiddleware.requireModuleOrHasDirectReports('RECLUTAMIENTO'),
  recruitmentController.createVacancyRequest
);
router.get('/vacancies',
  authMiddleware.requireModule('RECLUTAMIENTO'),
  recruitmentController.getAllVacancyRequests
);
router.get('/vacancies/my',
  authMiddleware.requireModuleOrHasDirectReports('RECLUTAMIENTO'),
  recruitmentController.getMyVacancyRequests
);
router.get('/vacancies/stats',
  authMiddleware.requireModule('RECLUTAMIENTO'),
  recruitmentController.getVacancyRequestStats
);
router.get('/vacancies/:id',
  authMiddleware.requireModuleOrHasDirectReports('RECLUTAMIENTO'),
  recruitmentController.getVacancyRequestById
);


// Rutas para jefes de área (SISTEMAS, COMPRAS, PRODUCCION) - Flujo Estándar
router.post('/recruitment/vacancies',



  authMiddleware.requireModuleOrHasDirectReports('RECLUTAMIENTO'),
  recruitmentController.createVacancyRequest
);
router.get('/recruitment/my-vacancies',
  authMiddleware.requireModuleOrHasDirectReports('RECLUTAMIENTO'),
  recruitmentController.getMyVacancyRequests
);
router.put('/recruitment/vacancies/:id/technical-profile',
  authMiddleware.requireModuleOrHasDirectReports('RECLUTAMIENTO'),
  recruitmentController.updateTechnicalProfile
);

// Rutas para actividades del puesto (Flujo Estándar) - Solo jefes de área
router.post('/recruitment/vacancies/:id/activities',
  authMiddleware.requireModuleOrHasDirectReports('RECLUTAMIENTO'),
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
  authMiddleware.requireModuleOrHasDirectReports('RECLUTAMIENTO'),
  recruitmentController.getVacancyRequestById
);
router.post('/recruitment/vacancies/:id/comments',
  authMiddleware.requireModuleOrHasDirectReports('RECLUTAMIENTO'),
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
  authMiddleware.requireModuleOrHasDirectReports('RECLUTAMIENTO'),
  recruitmentController.updateCandidateVote
);

// Solicitante: Seleccionar candidato final y cerrar vacante - Solo jefes de área
router.put('/recruitment/candidates/:candidate_id/select',
  authMiddleware.requireModuleOrHasDirectReports('RECLUTAMIENTO'),
  recruitmentController.selectCandidate
);

// Descargar CV de candidato - Todos los roles autorizados
router.get('/recruitment/candidates/:candidate_id/cv',
  authMiddleware.requireModuleOrHasDirectReports('RECLUTAMIENTO'),
  recruitmentController.downloadCandidateCV
);

// Eliminar vacante completamente (solo RH/ADMIN)
router.delete('/recruitment/vacancies/:id',
  authMiddleware.requireRHOrAdmin(),
  recruitmentController.deleteVacancy
);

// Actualizar actividad (marcar como completada)
router.put('/recruitment/activities/:activityId',
  authMiddleware.requireModuleOrHasDirectReports('RECLUTAMIENTO'),
  recruitmentController.updateActivity
);

// Cancelar vacante por el solicitante (cambia a estado Cerrada)
router.put('/recruitment/vacancies/:id/cancel',
  authMiddleware.requireModuleOrHasDirectReports('RECLUTAMIENTO'),
  recruitmentController.cancelVacancy
);

module.exports = router;
