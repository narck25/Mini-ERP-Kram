const express = require('express');
const router = express.Router();
const employeeDocumentController = require('../controllers/employeeDocument.controller');
const { upload, ensureUploadDirs } = require('../middlewares/upload.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.verifyToken);

// Obtener documentos de un empleado (RH/ADMIN ven cualquiera; el propio
// empleado ve los suyos aunque no tenga el módulo EMPLEADOS — el
// controller valida la propiedad).
router.get('/employee/:employeeId/documents',
  employeeDocumentController.getEmployeeDocuments
);

// Obtener tipos de documentos permitidos (cualquier usuario autenticado)
router.get('/employee-documents/allowed-types',
  employeeDocumentController.getAllowedDocumentTypes
);

// Subir documento para un empleado (RH/ADMIN suben para cualquiera; el
// propio empleado puede subir los suyos — el controller valida la
// propiedad).
router.post('/employee/:employeeId/documents',
  ensureUploadDirs,
  upload.single('document'),
  employeeDocumentController.uploadEmployeeDocument
);

// Descargar documento (RH/ADMIN descargan cualquiera; el propio empleado
// descarga los suyos — el controller valida la propiedad).
router.get('/employee-documents/:documentId/download',
  employeeDocumentController.downloadEmployeeDocument
);

// Eliminar documento (escritura - requiere RH o Admin)
router.delete('/employee-documents/:documentId',
  authMiddleware.requireRHOrAdmin(),
  employeeDocumentController.deleteEmployeeDocument
);

module.exports = router;
