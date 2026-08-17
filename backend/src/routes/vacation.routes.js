const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const VacationController = require('../controllers/vacation.controller');

router.post('/vacations',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('VACACIONES'),
  VacationController.create
);

// IMPORTANTE: /my debe ir antes de /:id para evitar conflicto de rutas.
router.get('/vacations/my',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('VACACIONES'),
  VacationController.myRequests
);

router.get('/vacations',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('VACACIONES'),
  VacationController.list
);

// IMPORTANTE: /balance debe ir antes de /:id para evitar conflicto de rutas.
router.get('/vacations/balance',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('VACACIONES'),
  VacationController.getBalance
);

// Solicitudes pendientes de autorizar por el jefe directo.
router.get('/vacations/pending-for-jefe',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('VACACIONES'),
  VacationController.getPendingForJefe
);

router.get('/vacations/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('VACACIONES'),
  VacationController.getById
);

// Autorización del jefe directo (PENDIENTE → AUTORIZADA).
router.post('/vacations/:id/authorize-jefe',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('VACACIONES'),
  VacationController.authorizeByJefe
);

router.post('/vacations/:id/approve',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole(['ADMIN', 'RH']),
  VacationController.approve
);

// Rechazo: jefe directo (PENDIENTE) o RH/ADMIN (PENDIENTE/AUTORIZADA).
router.post('/vacations/:id/reject',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('VACACIONES'),
  VacationController.reject
);

router.post('/vacations/:id/cancel',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('VACACIONES'),
  VacationController.cancel
);

module.exports = router;
