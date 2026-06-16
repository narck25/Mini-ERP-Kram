/**
 * purchase-public.routes.js
 * ─────────────────────────────────────────────────────────────
 * Rutas públicas para autorización de compras.
 * Estas rutas NO requieren el módulo COMPRAS, solo autenticación.
 * Permiten que Gerentes/Directores/Presidente puedan:
 *   - Ver detalles de una solicitud de compra
 *   - Autorizar una solicitud
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const PurchasePublicController = require('../controllers/purchase-public.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación (pero NO el módulo COMPRAS)
router.use(AuthMiddleware.verifyToken);

// Obtener detalles de una solicitud de compra (público)
router.get('/purchases/public/:id',
  PurchasePublicController.getRequestDetails
);

// Autorizar una solicitud de compra (público)
router.post('/purchases/public/:id/authorize',
  PurchasePublicController.authorizeRequest
);

module.exports = router;
