const express = require('express');
const router = express.Router();
const employeeDocumentController = require('../controllers/employeeDocument.controller');
const { upload, ensureTempDir } = require('../middlewares/upload.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.verifyToken);

// Obtener documentos de un empleado
router.get('/employee/:employeeId/documents', employeeDocumentController.getEmployeeDocuments);

// Obtener tipos de documentos permitidos
router.get('/employee-documents/allowed-types', employeeDocumentController.getAllowedDocumentTypes);

// Subir documento para un empleado
router.post('/employee/:employeeId/documents',
  ensureTempDir,
  upload.single('document'),
  employeeDocumentController.uploadEmployeeDocument
);

// Descargar documento
router.get('/employee-documents/:documentId/download', employeeDocumentController.downloadEmployeeDocument);

// Eliminar documento
router.delete('/employee-documents/:documentId', employeeDocumentController.deleteEmployeeDocument);

module.exports = router;