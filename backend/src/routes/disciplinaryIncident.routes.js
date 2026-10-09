const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const { uploadDisciplinaryIncident, handleMulterError, validateFileContent } = require('../middlewares/upload.middleware');
const DisciplinaryIncidentController = require('../controllers/disciplinaryIncident.controller');

// requireModuleOrHasDirectReports('DISCIPLINA') es la puerta de entrada de nivel A
// (deja pasar también a cualquier jefe directo aunque no tenga el módulo asignado
// a mano); el control fino (RH/ADMIN o jefe directo del empleado puntual) se
// valida dentro del servicio.
const auth = [AuthMiddleware.verifyToken, AuthMiddleware.requireModuleOrHasDirectReports('DISCIPLINA')];

router.post(
  '/disciplinary-incidents',
  ...auth,
  uploadDisciplinaryIncident.single('archivo'),
  handleMulterError,
  validateFileContent,
  DisciplinaryIncidentController.create
);
router.put('/disciplinary-incidents/:id', ...auth, DisciplinaryIncidentController.update);
router.get('/disciplinary-incidents/employee/:employeeId', ...auth, DisciplinaryIncidentController.listByEmployee);

module.exports = router;
