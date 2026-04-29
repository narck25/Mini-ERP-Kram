const express = require('express');
const router = express.Router();
const PermissionController = require('../controllers/permission.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.verifyToken);

// Obtener todos los usuarios con sus permisos (solo ADMIN y RH)
router.get('/permissions/users', 
  authMiddleware.requireRole(['ADMIN', 'RH']),
  PermissionController.getAllUsersWithPermissions
);

// Obtener módulos disponibles (solo ADMIN y RH)
router.get('/permissions/modules',
  authMiddleware.requireRole(['ADMIN', 'RH']),
  PermissionController.getAvailableModules
);

// Actualizar permisos de un usuario (solo ADMIN y RH)
router.put('/permissions/users/:id',
  authMiddleware.requireRole(['ADMIN', 'RH']),
  PermissionController.updateUserPermissions
);

// Obtener permisos del usuario actual (todos los usuarios autenticados)
router.get('/permissions/me',
  PermissionController.getCurrentUserPermissions
);

module.exports = router;