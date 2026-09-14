const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const HrAuditController = require('../controllers/hrAudit.controller');

// El control de acceso fino (RH/ADMIN o jefe directo del empleado) se hace dentro del controller.
router.get('/hr-audit/employee/:id', AuthMiddleware.verifyToken, HrAuditController.getByEmployee);

module.exports = router;
