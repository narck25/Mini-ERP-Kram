const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const ProbationEvaluationController = require('../controllers/probationEvaluation.controller');

// Vista completa: solo RH/ADMIN.
router.get('/probation-evaluations', AuthMiddleware.verifyToken, AuthMiddleware.requireRHOrAdmin(), ProbationEvaluationController.list);

// Cualquier jefe con subordinados debe poder ver sus pendientes, sin depender de accessibleModules.
router.get('/probation-evaluations/pending-for-jefe', AuthMiddleware.verifyToken, ProbationEvaluationController.getPendingForJefe);

// El control de acceso fino (RH/ADMIN o jefe directo) se valida dentro del servicio.
router.post('/probation-evaluations/:id/capture', AuthMiddleware.verifyToken, ProbationEvaluationController.capture);

module.exports = router;
