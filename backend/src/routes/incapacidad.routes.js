const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const IncapacidadController = require('../controllers/incapacidad.controller');

// Solo RH/ADMIN gestionan incapacidades (Nivel C).
const auth = [AuthMiddleware.verifyToken, AuthMiddleware.requireRole(['ADMIN', 'RH'])];

router.post('/incapacidades', ...auth, IncapacidadController.create);
router.get('/incapacidades', ...auth, IncapacidadController.list);
router.get('/incapacidades/:id', ...auth, IncapacidadController.getById);
router.put('/incapacidades/:id', ...auth, IncapacidadController.update);
router.post('/incapacidades/:id/reincorporar', ...auth, IncapacidadController.reincorporar);

module.exports = router;
