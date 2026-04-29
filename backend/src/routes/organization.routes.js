const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organization.controller');
const { requireModule } = require('../middlewares/auth.middleware');

// ==================== RUTAS DE DEPARTAMENTOS ====================

// Obtener todos los departamentos
router.get('/departments', 
  requireModule('EMPLEADOS'),
  organizationController.getAllDepartments
);

// Obtener un departamento por ID
router.get('/departments/:id',
  requireModule('EMPLEADOS'),
  organizationController.getDepartmentById
);

// Crear un nuevo departamento
router.post('/departments',
  requireModule('EMPLEADOS'),
  organizationController.createDepartment
);

// Actualizar un departamento
router.put('/departments/:id',
  requireModule('EMPLEADOS'),
  organizationController.updateDepartment
);

// Eliminar un departamento
router.delete('/departments/:id',
  requireModule('EMPLEADOS'),
  organizationController.deleteDepartment
);

// ==================== RUTAS DE PUESTOS DE TRABAJO ====================

// Obtener todos los puestos de trabajo
router.get('/job-positions',
  requireModule('EMPLEADOS'),
  organizationController.getAllJobPositions
);

// Obtener un puesto de trabajo por ID
router.get('/job-positions/:id',
  requireModule('EMPLEADOS'),
  organizationController.getJobPositionById
);

// Crear un nuevo puesto de trabajo
router.post('/job-positions',
  requireModule('EMPLEADOS'),
  organizationController.createJobPosition
);

// Actualizar un puesto de trabajo
router.put('/job-positions/:id',
  requireModule('EMPLEADOS'),
  organizationController.updateJobPosition
);

// Eliminar un puesto de trabajo
router.delete('/job-positions/:id',
  requireModule('EMPLEADOS'),
  organizationController.deleteJobPosition
);

// Obtener puestos de trabajo por departamento
router.get('/departments/:departmentId/job-positions',
  requireModule('EMPLEADOS'),
  organizationController.getJobPositionsByDepartment
);

// ==================== RUTAS DE ESTADÍSTICAS ====================

// Obtener estadísticas de la organización
router.get('/organization/stats',
  requireModule('EMPLEADOS'),
  organizationController.getOrganizationStats
);

module.exports = router;