const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const SupplierController = require('../controllers/supplier.controller');

const auth = [AuthMiddleware.verifyToken, AuthMiddleware.requireModule('COMPRAS')];

router.get('/suppliers', ...auth, SupplierController.list);
router.post('/suppliers', ...auth, SupplierController.create);
router.put('/suppliers/:id', ...auth, SupplierController.update);

module.exports = router;
