const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const { uploadDisciplinaryIncident, handleMulterError } = require('../middlewares/upload.middleware');
const DisciplinaryIncidentController = require('../controllers/disciplinaryIncident.controller');

// requireModule('DISCIPLINA') es la puerta de entrada de nivel A; el control fino
// (RH/ADMIN o jefe directo del empleado) se valida dentro del servicio.
const auth = [AuthMiddleware.verifyToken, AuthMiddleware.requireModule('DISCIPLINA')];

router.post(
  '/disciplinary-incidents',
  ...auth,
  uploadDisciplinaryIncident.single('archivo'),
  handleMulterError,
  DisciplinaryIncidentController.create
);
router.put('/disciplinary-incidents/:id', ...auth, DisciplinaryIncidentController.update);
router.get('/disciplinary-incidents/employee/:employeeId', ...auth, DisciplinaryIncidentController.listByEmployee);

module.exports = router;
