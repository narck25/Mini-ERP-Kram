const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organization.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');

// ==================== RUTAS DE DEPARTAMENTOS ====================

// Obtener todos los departamentos
router.get('/departments', 
  AuthMiddleware.requireModule('EMPLEADOS'),
  organizationController.getAllDepartments
);

// Obtener un departamento por ID
router.get('/departments/:id',
  AuthMiddleware.requireModule('EMPLEADOS'),
  organizationController.getDepartmentById
);

// Crear un nuevo departamento
router.post('/departments',
  AuthMiddleware.requireModule('EMPLEADOS'),
  organizationController.createDepartment
);

// Actualizar un departamento
router.put('/departments/:id',
  AuthMiddleware.requireModule('EMPLEADOS'),
  organizationController.updateDepartment
);

// Eliminar un departamento
router.delete('/departments/:id',
  AuthMiddleware.requireModule('EMPLEADOS'),
  organizationController.deleteDepartment
);

// ==================== RUTAS DE PUESTOS DE TRABAJO ====================

// Obtener todos los puestos de trabajo
router.get('/job-positions',
  AuthMiddleware.requireModule('EMPLEADOS'),
  organizationController.getAllJobPositions
);

// Obtener un puesto de trabajo por ID
router.get('/job-positions/:id',
  AuthMiddleware.requireModule('EMPLEADOS'),
  organizationController.getJobPositionById
);

// Crear un nuevo puesto de trabajo
router.post('/job-positions',
  AuthMiddleware.requireModule('EMPLEADOS'),
  organizationController.createJobPosition
);

// Actualizar un puesto de trabajo
router.put('/job-positions/:id',
  AuthMiddleware.requireModule('EMPLEADOS'),
  organizationController.updateJobPosition
);

// Eliminar un puesto de trabajo
router.delete('/job-positions/:id',
  AuthMiddleware.requireModule('EMPLEADOS'),
  organizationController.deleteJobPosition
);

// Obtener puestos de trabajo por departamento
router.get('/departments/:departmentId/job-positions',
  AuthMiddleware.requireModule('EMPLEADOS'),
  organizationController.getJobPositionsByDepartment
);

// ==================== RUTAS DE ESTADÍSTICAS ====================

// Obtener estadísticas de la organización
router.get('/organization/stats',
  AuthMiddleware.requireModule('EMPLEADOS'),
  organizationController.getOrganizationStats
);

module.exports = router;
