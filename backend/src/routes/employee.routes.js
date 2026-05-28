const express = require('express');
const router = express.Router();
const employeeCoreController = require('../controllers/employee-core.controller');
const employeeCsvController = require('../controllers/employee-csv.controller');
const employeeOrgController = require('../controllers/employee-org.controller');
const employeePhotoController = require('../controllers/employee-photo.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');
const { upload, uploadPhoto, handleMulterError } = require('../middlewares/upload.middleware');

// Todas las rutas requieren autenticación
router.use(AuthMiddleware.verifyToken);

// Rutas para importar/exportar empleados (deben estar ANTES de las rutas dinámicas)
router.get('/employees/template', AuthMiddleware.requireRHOrAdmin(), employeeCsvController.downloadImportTemplate);
router.post('/employees/import', 
  AuthMiddleware.requireRHOrAdmin(), 
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ 
          error: 'Error al procesar el archivo',
          message: err.message 
        });
      }
      next();
    });
  }, 
  employeeCsvController.importEmployees
);
router.get('/employees/export', AuthMiddleware.requireRHOrAdmin(), employeeCsvController.exportEmployees);

// Rutas CRUD para empleados
router.get('/employees', AuthMiddleware.requireModule('EMPLEADOS'), employeeCoreController.getAllEmployees);
router.get('/employees/me', employeeCoreController.getCurrentEmployee);
router.get('/employees/stats', AuthMiddleware.requireRHOrAdmin(), employeeOrgController.getEmployeeStats);
router.post('/employees', AuthMiddleware.requireRHOrAdmin(), employeeCoreController.createEmployee);
router.get('/employees/:id', AuthMiddleware.requireRHOrAdmin(), employeeCoreController.getEmployeeById);
router.put('/employees/:id', AuthMiddleware.requireRHOrAdmin(), employeeCoreController.updateEmployee);
router.delete('/employees/:id', AuthMiddleware.requireRHOrAdmin(), employeeCoreController.deleteEmployee);
router.delete('/employees/:id/permanent', AuthMiddleware.requireRHOrAdmin(), employeeCoreController.deleteEmployeePermanently);

// Ruta para obtener departamentos (accesible para todos los usuarios autenticados)
router.get('/departments', employeeOrgController.getDepartments);

// Ruta para obtener jefes directos (accesible para todos los usuarios autenticados que pueden crear vacantes)
router.get('/managers', employeeOrgController.getManagers);

// Ruta para subir foto de perfil
router.post('/employees/:id/photo',
  AuthMiddleware.requireRHOrAdmin(),
  (req, res, next) => {
    uploadPhoto.single('photo')(req, res, (err) => {
      if (err) {
        console.error('Photo upload error:', err);
        return res.status(400).json({
          error: 'Error al subir la foto',
          message: err.message
        });
      }
      next();
    });
  },
  employeePhotoController.uploadProfilePhoto
);

// Ruta para obtener puestos por departamento
router.get('/departments/:id/job-positions', employeeOrgController.getJobPositionsByDepartment);

module.exports = router;
