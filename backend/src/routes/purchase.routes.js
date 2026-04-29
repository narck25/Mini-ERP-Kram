const express = require('express');
const router = express.Router();
const PurchaseController = require('../controllers/purchase.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');
const UploadMiddleware = require('../middlewares/upload.middleware');

// Todas las rutas requieren autenticación
router.use(AuthMiddleware.verifyToken);

// Ruta para crear una nueva solicitud de compra (cualquier usuario con módulo COMPRAS)
router.post('/purchases',
  AuthMiddleware.requireModule('COMPRAS'),
  PurchaseController.createRequest
);

// Ruta para obtener las solicitudes del usuario autenticado
router.get('/purchases/my',
  AuthMiddleware.requireModule('COMPRAS'),
  PurchaseController.getMyRequests
);

// Ruta para obtener los detalles de una solicitud específica
router.get('/purchases/:id',
  AuthMiddleware.requireModule('COMPRAS'),
  PurchaseController.getRequestDetails
);

// Ruta para obtener todas las solicitudes (solo Admin/Compras)
router.get('/purchases',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.getAllRequests
);

// Ruta para subir cotizaciones a una solicitud (solo Admin/Compras)
router.post('/purchases/:id/quotes',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.uploadQuotes
);

// Ruta para seleccionar una cotización (solo el solicitante)
router.post('/purchases/:id/select-quote',
  AuthMiddleware.requireModule('COMPRAS'),
  PurchaseController.selectQuote
);

// Ruta para autorizar una solicitud (solo Admin/Gerente)
router.post('/purchases/:id/authorize',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.authorizeRequest
);

// Ruta para marcar una solicitud como entregada
router.post('/purchases/:id/deliver',
  AuthMiddleware.requireModule('COMPRAS'),
  PurchaseController.markAsDelivered
);

// Ruta para cancelar una solicitud
router.post('/purchases/:id/cancel',
  AuthMiddleware.requireModule('COMPRAS'),
  PurchaseController.cancelRequest
);

// Ruta para subir archivo a una cotización existente (solo Admin/Compras)
router.post('/purchases/:id/quotes/:quoteId/upload',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  UploadMiddleware.uploadPurchaseQuotes.single('file'),
  PurchaseController.uploadQuoteFile
);

// Ruta para subir archivo para una nueva cotización (antes de crear la cotización)
router.post('/purchases/:id/upload-quote-file',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  UploadMiddleware.uploadPurchaseQuotes.single('file'),
  PurchaseController.uploadQuoteFileForNewQuote
);

// Ruta para actualizar el monto de una cotización (solo Admin/Compras)
router.put('/purchases/:id/quotes/:quoteId/amount',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.updateQuoteAmount
);

module.exports = router;
