const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación y rol ADMIN
router.use(AuthMiddleware.verifyToken);
router.use(AuthMiddleware.requireRole(['ADMIN']));

// Obtener todos los usuarios
router.get('/', UserController.getAllUsers);

// Obtener estadísticas de usuarios
router.get('/stats', UserController.getUserStats);

// Obtener un usuario por ID
router.get('/:id', UserController.getUserById);

// Crear un nuevo usuario
router.post('/', UserController.createUser);

// Actualizar usuario
router.put('/:id', UserController.updateUser);

// Eliminar usuario
router.delete('/:id', UserController.deleteUser);

module.exports = router;