const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');
const { upload, uploadPhoto, handleMulterError } = require('../middlewares/upload.middleware');

// Todas las rutas requieren autenticación
router.use(AuthMiddleware.verifyToken);

// Rutas para importar/exportar empleados (deben estar ANTES de las rutas dinámicas)
router.get('/employees/template', AuthMiddleware.requireRHOrAdmin(), employeeController.downloadImportTemplate);
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
  employeeController.importEmployees
);
router.get('/employees/export', AuthMiddleware.requireRHOrAdmin(), employeeController.exportEmployees);

// Rutas CRUD para empleados
router.get('/employees', AuthMiddleware.requireModule('EMPLEADOS'), employeeController.getAllEmployees);
router.get('/employees/me', employeeController.getCurrentEmployee);
router.get('/employees/stats', AuthMiddleware.requireRHOrAdmin(), employeeController.getEmployeeStats);
router.post('/employees', AuthMiddleware.requireRHOrAdmin(), employeeController.createEmployee);
router.get('/employees/:id', AuthMiddleware.requireRHOrAdmin(), employeeController.getEmployeeById);
router.put('/employees/:id', AuthMiddleware.requireRHOrAdmin(), employeeController.updateEmployee);
router.delete('/employees/:id', AuthMiddleware.requireRHOrAdmin(), employeeController.deleteEmployee);
router.delete('/employees/:id/permanent', AuthMiddleware.requireRHOrAdmin(), employeeController.deleteEmployeePermanently);

// Ruta para obtener departamentos (accesible para todos los usuarios autenticados)
router.get('/departments', employeeController.getDepartments);

// Ruta para obtener jefes directos (accesible para todos los usuarios autenticados que pueden crear vacantes)
router.get('/managers', employeeController.getManagers);

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
  employeeController.uploadProfilePhoto
);

// Ruta para obtener puestos por departamento
router.get('/departments/:id/job-positions', employeeController.getJobPositionsByDepartment);

module.exports = router;
