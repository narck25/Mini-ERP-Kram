const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const OperationalEvaluationController = require('../controllers/operationalEvaluation.controller');

// Vista completa: solo RH/ADMIN.
router.get('/operational-evaluations', AuthMiddleware.verifyToken, AuthMiddleware.requireRHOrAdmin(), OperationalEvaluationController.list);

// Cualquier jefe con subordinados debe poder ver sus pendientes, sin depender de accessibleModules.
router.get('/operational-evaluations/pending-for-jefe', AuthMiddleware.verifyToken, OperationalEvaluationController.getPendingForJefe);

// Plantillas fijas de criterios por puesto (para renderizar el formulario de captura).
router.get('/operational-evaluations/criteria-templates', AuthMiddleware.verifyToken, OperationalEvaluationController.getCriteriaTemplates);

// El control de acceso fino (RH/ADMIN o jefe directo) se valida dentro del servicio.
router.post('/operational-evaluations/:id/capture', AuthMiddleware.verifyToken, OperationalEvaluationController.capture);

// Detalle de una evaluación (para la página de captura). Debe ir DESPUÉS de
// las rutas literales de arriba — Express matchea en orden y ":id" atraparía
// esos literales (pending-for-jefe, criteria-templates) si se registrara antes.
router.get('/operational-evaluations/:id', AuthMiddleware.verifyToken, OperationalEvaluationController.getById);

module.exports = router;
