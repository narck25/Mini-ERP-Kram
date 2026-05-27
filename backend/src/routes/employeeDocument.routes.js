const express = require('express');
const router = express.Router();
const employeeDocumentController = require('../controllers/employeeDocument.controller');
const { upload, ensureUploadDirs } = require('../middlewares/upload.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.verifyToken);

// Obtener documentos de un empleado (lectura - requiere módulo EMPLEADOS)
router.get('/employee/:employeeId/documents', 
  authMiddleware.requireModule('EMPLEADOS'),
  employeeDocumentController.getEmployeeDocuments
);

// Obtener tipos de documentos permitidos (lectura - requiere módulo EMPLEADOS)
router.get('/employee-documents/allowed-types', 
  authMiddleware.requireModule('EMPLEADOS'),
  employeeDocumentController.getAllowedDocumentTypes
);

// Subir documento para un empleado (escritura - requiere RH o Admin)
router.post('/employee/:employeeId/documents',
  authMiddleware.requireRHOrAdmin(),
  ensureUploadDirs,
  upload.single('document'),
  employeeDocumentController.uploadEmployeeDocument
);

// Descargar documento (lectura - requiere módulo EMPLEADOS)
router.get('/employee-documents/:documentId/download', 
  authMiddleware.requireModule('EMPLEADOS'),
  employeeDocumentController.downloadEmployeeDocument
);

// Eliminar documento (escritura - requiere RH o Admin)
router.delete('/employee-documents/:documentId',
  authMiddleware.requireRHOrAdmin(),
  employeeDocumentController.deleteEmployeeDocument
);

module.exports = router;
