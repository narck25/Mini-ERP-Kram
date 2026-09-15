const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');
const { loginLimiter } = require('../middlewares/rate-limit.middleware');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('email').isEmail(),
  body('password').notEmpty()
];

const changePasswordValidation = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
];

// Public routes
// NOTA (hallazgo de seguridad #2): el registro público se eliminó — las
// cuentas las crean RH/TI mediante la importación CSV de empleados. El
// registro público permitía vincularse al expediente de otro empleado
// con solo conocer su correo. Ver docs/PROJECT_CONTEXT.md §6.1 y §13.
router.post('/login', loginLimiter, loginValidation, AuthController.login);

// Protected routes (require authentication)
router.get('/profile', AuthMiddleware.verifyToken, AuthController.getProfile);
router.put('/profile', AuthMiddleware.verifyToken, AuthController.updateProfile);
router.post('/logout', AuthMiddleware.verifyToken, AuthController.logout);
router.post('/change-password', 
  AuthMiddleware.verifyToken, 
  changePasswordValidation, 
  AuthController.changePassword
);

// Admin only routes
router.get('/admin/users',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireAdmin(),
  async (req, res) => {
    // This would be implemented in a separate controller
    res.json({ message: 'Admin users endpoint - to be implemented' });
  }
);

// Test role-based access
router.get('/test/admin',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireAdmin(),
  (req, res) => {
    res.json({ message: 'Admin access granted', user: req.user });
  }
);

router.get('/test/rh',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRHOrAdmin(),
  (req, res) => {
    res.json({ message: 'RH or Admin access granted', user: req.user });
  }
);

router.get('/test/sistemas',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSistemasOrAdmin(),
  (req, res) => {
    res.json({ message: 'Sistemas or Admin access granted', user: req.user });
  }
);

router.get('/test/compras',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireComprasOrAdmin(),
  (req, res) => {
    res.json({ message: 'Compras or Admin access granted', user: req.user });
  }
);

router.get('/test/produccion',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireProduccionOrAdmin(),
  (req, res) => {
    res.json({ message: 'Produccion or Admin access granted', user: req.user });
  }
);

module.exports = router;
