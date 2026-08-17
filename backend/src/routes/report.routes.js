const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const ReportController = require('../controllers/report.controller');

const auth = [AuthMiddleware.verifyToken, AuthMiddleware.requireModule('REPORTES')];

router.get('/reports/empleados', ...auth, ReportController.empleados);
router.get('/reports/empleados/export', ...auth, ReportController.empleadosExport);
router.get('/reports/compras', ...auth, ReportController.compras);
router.get('/reports/compras/export', ...auth, ReportController.comprasExport);
router.get('/reports/inventario', ...auth, ReportController.inventario);
router.get('/reports/inventario/export', ...auth, ReportController.inventarioExport);
router.get('/reports/asistencia', ...auth, ReportController.asistencia);
router.get('/reports/asistencia/export', ...auth, ReportController.asistenciaExport);
router.get('/reports/vacaciones', ...auth, ReportController.vacaciones);
router.get('/reports/vacaciones/export', ...auth, ReportController.vacacionesExport);

module.exports = router;
