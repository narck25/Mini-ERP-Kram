/**
 * purchase-public.controller.js
 * ─────────────────────────────────────────────────────────────
 * Controlador público para autorización de compras.
 * Estos endpoints NO requieren el módulo COMPRAS, solo autenticación.
 * Permiten que Gerentes/Directores/Presidente puedan:
 *   - Ver detalles de una solicitud de compra
 *   - Autorizar una solicitud
 * ─────────────────────────────────────────────────────────────
 */

const PurchaseService = require('../services/purchases/purchase.service');
const audit = require('../services/audit.service');
const statusNotif = require('../services/purchases/status-notification.service');

class PurchasePublicController {

  /**
   * Obtener detalles de una solicitud de compra (público, solo autenticación)
   * GET /api/purchases/public/:id
   */
  static async getRequestDetails(req, res) {
    try {
      // Usar getPublicRequestDetails que NO valida permisos de módulo
      // Solo verifica que la solicitud existe
      const request = await PurchaseService.getPublicRequestDetails(req);


      res.json({ request });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los detalles de la solicitud'
      });
    }
  }


  /**
   * Autorizar una solicitud de compra (público, solo autenticación)
   * POST /api/purchases/public/:id/authorize
   */
  static async authorizeRequest(req, res) {
    try {
      const { id } = req.params;
      const updatedRequest = await PurchaseService.authorizeRequest(req.user.id, id);

      // Auditoría: aprobación
      await audit.logWithReq(
        id,
        req.user.id,
        audit.ACCIONES.APROBACION,
        { estatus: 'EN_AUTORIZACION' },
        {
          estatus: 'APROBADO',
          autorizadoPorId: updatedRequest.autorizadoPorId,
          fechaAutorizacion: updatedRequest.fechaAutorizacion,
          via: 'public-link'
        },
        req
      );

      // Notificación: EN_AUTORIZACION → APROBADO (fire & forget)
      statusNotif.notifyStatusChangeAsync(id, 'EN_AUTORIZACION', 'APROBADO');

      res.json({
        message: 'Solicitud autorizada exitosamente',
        data: updatedRequest
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo autorizar la solicitud'
      });
    }
  }
}

module.exports = PurchasePublicController;
