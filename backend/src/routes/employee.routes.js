const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');
const multer = require('multer');

// Configurar multer para manejar archivos CSV
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  }
});

// Todas las rutas requieren autenticación
router.use(AuthMiddleware.verifyToken);

// Rutas CRUD para empleados (solo RH y ADMIN)
router.get('/employees', employeeController.getAllEmployees);
router.get('/employees/stats', employeeController.getEmployeeStats);
router.post('/employees', employeeController.createEmployee);
router.get('/employees/:id', employeeController.getEmployeeById);
router.put('/employees/:id', employeeController.updateEmployee);
router.delete('/employees/:id', employeeController.deleteEmployee);

// Rutas para importar/exportar empleados
router.post('/employees/import', upload.single('file'), employeeController.importEmployees);
router.get('/employees/export', employeeController.exportEmployees);

// Ruta para obtener departamentos
router.get('/departments', employeeController.getDepartments);

module.exports = router;
