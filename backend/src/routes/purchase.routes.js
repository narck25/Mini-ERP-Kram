const express = require('express');
const router = express.Router();
const PurchaseController = require('../controllers/purchase.controller');
const PurchaseCommentController = require('../controllers/purchase-comment.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');
const UploadMiddleware = require('../middlewares/upload.middleware');

// ===== RUTAS SSE (DEBEN IR ANTES DE verifyToken GLOBAL) =====
// NOTA: EventSource (navegador) NO soporta headers personalizados,
//       por lo que el token JWT se pasa como query param `token`.
//       Estas rutas usan verifyTokenFromQuery en lugar de verifyToken.
//       DEBEN ir ANTES de router.use(AuthMiddleware.verifyToken) para
//       evitar que el middleware global intente leer el token de headers.

// ── Endpoint SSE: Stream de comentarios en tiempo real ──
router.get('/purchases/:id/comments/stream',
  AuthMiddleware.verifyTokenFromQuery,
  AuthMiddleware.requireModule('COMPRAS'),
  PurchaseCommentController.streamComments
);

// Todas las rutas requieren autenticación
router.use(AuthMiddleware.verifyToken);

// Ruta para crear una nueva solicitud de compra (cualquier usuario con módulo COMPRAS)
router.post('/purchases',
  AuthMiddleware.requireModule('COMPRAS'),
  PurchaseController.createRequest
);


// Ruta para obtener las solicitudes del usuario autenticado
// IMPORTANTE: Debe ir ANTES de /purchases/:id para evitar conflicto
router.get('/purchases/my',
  AuthMiddleware.requireModule('COMPRAS'),
  PurchaseController.getMyRequests
);

// Ruta para obtener todas las solicitudes (solo Admin/Compras)
router.get('/purchases',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.getAllRequests
);

// Ruta para obtener los detalles de una solicitud específica
router.get('/purchases/details/:id',
  AuthMiddleware.requireModule('COMPRAS'),
  PurchaseController.getRequestDetails
);

// Ruta para subir cotizaciones a una solicitud (solo Admin/Compras)
router.post('/purchases/:id/quotes',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.uploadQuotes
);

// Ruta para seleccionar una cotización (solo Admin/Compras)
router.post('/purchases/:id/select-quote',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
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

// Ruta para obtener aprobadores potenciales (empleados con roles gerenciales)
router.get('/purchases/:id/potential-approvers',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.getPotentialApprovers
);

// Ruta para asignar aprobadores a una solicitud
router.post('/purchases/:id/assign-approvers',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.assignApprovers
);

// Ruta para enviar autorización manual (solo Admin/Compras)
router.post('/purchases/:id/send-authorization',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.sendAuthorization
);

// Ruta para eliminar una solicitud (Admin/Compras)
router.delete('/purchases/:id',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.deleteRequest
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

// Ruta para subir cotización con archivo en una sola llamada (multipart)
router.post('/purchases/:id/quotes/upload-with-file',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  UploadMiddleware.uploadPurchaseQuotes.single('file'),
  PurchaseController.uploadQuoteWithFile
);

// Ruta para subir archivo para una nueva cotización (antes de crear la cotización)
router.post('/purchases/:id/upload-quote-file',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  UploadMiddleware.uploadPurchaseQuotes.single('file'),
  PurchaseController.uploadQuoteFileForNewQuote
);

// Ruta para actualizar una cotización (proveedor, monto, archivo) — solo Admin/Compras
router.put('/purchases/:id/quotes/:quoteId',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.updateQuote
);

// Mantener compatibilidad con la ruta anterior (solo monto)
router.put('/purchases/:id/quotes/:quoteId/amount',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.updateQuote
);


// Ruta para obtener la comparativa de cotizaciones de una solicitud
router.get('/purchases/:id/comparison',
  AuthMiddleware.requireModule('COMPRAS'),
  PurchaseController.getQuoteComparison
);

// ===== RUTAS DE ÓRDENES DE COMPRA =====

// Obtener la orden de compra de una solicitud
router.get('/purchases/:id/purchase-order',
  AuthMiddleware.requireModule('COMPRAS'),
  PurchaseController.getPurchaseOrder
);

// Generar orden de compra manual (POST, con partidas)
router.post('/purchases/:id/purchase-order',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.generatePurchaseOrder
);

// Listar todas las órdenes de compra
router.get('/purchase-orders',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.getAllPurchaseOrders
);

// Regenerar orden de compra manualmente (legacy)
router.post('/purchases/:id/regenerate-order',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.regeneratePurchaseOrder
);

// ===== RUTA DE AUDITORÍA =====


// Ruta para obtener el historial de auditoría de una solicitud
router.get('/purchases/:id/audit',
  AuthMiddleware.requireModule('COMPRAS'),
  AuthMiddleware.requireRole(['ADMIN', 'COMPRAS']),
  PurchaseController.getAuditHistory
);

// ===== RUTAS DE COMENTARIOS (tipo chat/blog) =====

// Obtener todos los comentarios de una solicitud

router.get('/purchases/:id/comments',
  AuthMiddleware.requireModule('COMPRAS'),
  PurchaseCommentController.getComments
);

// Agregar un comentario a una solicitud
router.post('/purchases/:id/comments',
  AuthMiddleware.requireModule('COMPRAS'),
  PurchaseCommentController.addComment
);

module.exports = router;


