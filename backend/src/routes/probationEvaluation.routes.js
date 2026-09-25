const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const ProbationEvaluationController = require('../controllers/probationEvaluation.controller');

// Vista completa: solo RH/ADMIN.
router.get('/probation-evaluations', AuthMiddleware.verifyToken, AuthMiddleware.requireRHOrAdmin(), ProbationEvaluationController.list);

// Cualquier jefe con subordinados debe poder ver sus pendientes, sin depender de accessibleModules.
router.get('/probation-evaluations/pending-for-jefe', AuthMiddleware.verifyToken, ProbationEvaluationController.getPendingForJefe);

// El propio colaborador: sus autoevaluaciones pendientes (paso 1 del formato 30/60/90).
router.get('/probation-evaluations/my-pending', AuthMiddleware.verifyToken, ProbationEvaluationController.getMyPending);
router.post('/probation-evaluations/:id/self-evaluation', AuthMiddleware.verifyToken, ProbationEvaluationController.submitSelfEvaluation);

// El control de acceso fino (RH/ADMIN o jefe directo) se valida dentro del servicio.
router.post('/probation-evaluations/:id/capture', AuthMiddleware.verifyToken, ProbationEvaluationController.capture);

// Detalle de una evaluación (para la página de captura). Debe ir DESPUÉS de
// las rutas literales de arriba (pending-for-jefe, my-pending) — Express
// matchea en orden y ":id" atraparía esos literales si se registrara antes.
router.get('/probation-evaluations/:id', AuthMiddleware.verifyToken, ProbationEvaluationController.getById);

module.exports = router;
