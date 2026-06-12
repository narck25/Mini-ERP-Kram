/**
 * purchase.controller.js
 * ─────────────────────────────────────────────────────────────
 * REFACTORIZADO: ORQUESTADOR + AUDITORÍA.
 * Toda la lógica de negocio fue delegada a servicios en:
 *   src/services/purchases/
 *     ├── purchase.service.js          → CRUD, estados, archivos
 *     ├── quote.service.js             → Cotizaciones
 *     ├── approval.service.js          → Aprobadores
 *     ├── purchase-notification.service.js → Notificaciones email
 *     └── comparison.service.js        → Comparativa
 *
 * Responsabilidad: Manejar request/response, delegar en servicios,
 *                  registrar auditoría en cada acción crítica,
 *                  mantener compatibilidad total con frontend.
 * ─────────────────────────────────────────────────────────────
 */

const PurchaseService = require('../services/purchases/purchase.service');
const QuoteService = require('../services/purchases/quote.service');
const ApprovalService = require('../services/purchases/approval.service');
const NotificationService = require('../services/purchases/purchase-notification.service');
const ComparisonService = require('../services/purchases/comparison.service');
const PurchaseOrderService = require('../services/purchases/purchase-order.service');
const audit = require('../services/audit.service');
const statusNotif = require('../services/purchases/status-notification.service');


class PurchaseController {
  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → purchase.service.js :: createRequest
  // AUDITORÍA: CREACION
  // ───────────────────────────────────────────────────────────
  static async createRequest(req, res) {
    try {
      const { justificacion, items } = req.body;
      const result = await PurchaseService.createRequest(req.user.id, justificacion, items);

      // Auditoría: creación de solicitud
      await audit.logWithReq(
        result.purchaseRequest.id,
        req.user.id,
        audit.ACCIONES.CREACION,
        null,
        {
          estatus: 'NUEVO',
          justificacion,
          items: items.map(i => ({ productoServicio: i.productoServicio, cantidad: i.cantidad }))
        },
        req
      );

      res.status(201).json({
        message: 'Solicitud de compra creada exitosamente',
        data: {
          request: result.purchaseRequest,
          items: result.purchaseItems
        }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo crear la solicitud de compra'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → purchase.service.js :: getMyRequests
  // ───────────────────────────────────────────────────────────
  static async getMyRequests(req, res) {
    try {
      const requests = await PurchaseService.getMyRequests(req);
      res.json({ requests });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las solicitudes'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → purchase.service.js :: getRequestDetails
  // ───────────────────────────────────────────────────────────
  static async getRequestDetails(req, res) {
    try {
      const request = await PurchaseService.getRequestDetails(req);
      res.json({ request });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los detalles de la solicitud'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → purchase.service.js :: getAllRequests
  // ───────────────────────────────────────────────────────────
  static async getAllRequests(req, res) {
    try {
      const requests = await PurchaseService.getAllRequests(req);
      res.json({ requests });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las solicitudes'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → quote.service.js :: uploadQuotes
  // AUDITORÍA: COTIZACION_SUBIDA
  // ───────────────────────────────────────────────────────────
  static async uploadQuotes(req, res) {
    try {
      const { id } = req.params;
      const result = await QuoteService.uploadQuotes(req);

      // Auditoría: subida de cotizaciones
      await audit.logWithReq(
        id,
        req.user.id,
        audit.ACCIONES.COTIZACION_SUBIDA,
        null,
        {
          estatus: 'PENDIENTE',
          quotes: result.quotes.map(q => ({
            id: q.id,
            proveedor: q.proveedor,
            monto: q.monto
          }))
        },
        req
      );

      // Notificación: NUEVO → PENDIENTE (fire & forget)
      statusNotif.notifyStatusChangeAsync(id, 'NUEVO', 'PENDIENTE');

      res.json({
        message: 'Cotizaciones subidas exitosamente',
        data: {
          request: result.request,
          quotes: result.quotes
        }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron subir las cotizaciones'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → quote.service.js :: selectQuote
  // AUDITORÍA: COTIZACION_SELECCIONADA
  // ───────────────────────────────────────────────────────────
  static async selectQuote(req, res) {
    try {
      const { id } = req.params;
      const result = await QuoteService.selectQuote(req);

      // Auditoría: selección de cotización
      await audit.logWithReq(
        id,
        req.user.id,
        audit.ACCIONES.COTIZACION_SELECCIONADA,
        null,
        {
          quoteId: result.quote?.id,
          proveedor: result.quote?.proveedor,
          monto: result.quote?.monto,
          estatus: result.request?.estatus,
          requiereAutorizacion: result.requiereAutorizacion
        },
        req
      );

      // Notificación: PENDIENTE → APROBADO o PENDIENTE → EN_AUTORIZACION (fire & forget)
      if (result.requiereAutorizacion) {
        statusNotif.notifyStatusChangeAsync(id, 'PENDIENTE', 'EN_AUTORIZACION');
      } else {
        statusNotif.notifyStatusChangeAsync(id, 'PENDIENTE', 'APROBADO');
      }

      res.json({
        message: result.requiereAutorizacion
          ? 'Cotización seleccionada. Esta solicitud supera los $50,000 MXN y requiere asignar aprobadores.'
          : 'Cotización seleccionada exitosamente. Solicitud aprobada.',
        data: {
          request: result.request,
          quote: result.quote,
          requiereAutorizacion: result.requiereAutorizacion
        }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo seleccionar la cotización'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → purchase.service.js :: authorizeRequest
  // AUDITORÍA: APROBACION
  // ───────────────────────────────────────────────────────────
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
          fechaAutorizacion: updatedRequest.fechaAutorizacion
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
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo autorizar la solicitud'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → purchase.service.js :: markAsDelivered
  // AUDITORÍA: ENTREGA
  // ───────────────────────────────────────────────────────────
  static async markAsDelivered(req, res) {
    try {
      const { id } = req.params;
      const updatedRequest = await PurchaseService.markAsDelivered(id);

      // Auditoría: entrega
      await audit.logWithReq(
        id,
        req.user.id,
        audit.ACCIONES.ENTREGA,
        { estatus: 'APROBADO' },
        { estatus: 'ENTREGADO' },
        req
      );

      // Notificación: APROBADO → ENTREGADO (fire & forget)
      statusNotif.notifyStatusChangeAsync(id, 'APROBADO', 'ENTREGADO');

      res.json({
        message: 'Solicitud marcada como entregada exitosamente',
        data: updatedRequest
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo marcar la solicitud como entregada'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → purchase.service.js :: uploadQuoteFile
  // ───────────────────────────────────────────────────────────
  static async uploadQuoteFile(req, res) {
    try {
      const { id, quoteId } = req.params;

      if (!req.file) {
        return res.status(400).json({
          error: 'Archivo requerido',
          message: 'Debe seleccionar un archivo para subir'
        });
      }

      const updatedQuote = await PurchaseService.uploadQuoteFile(id, quoteId, req.file.filename);

      res.json({
        message: 'Archivo subido exitosamente',
        data: {
          fileUrl: `/uploads/purchase-quotes/${req.file.filename}`,
          quote: updatedQuote
        }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo subir el archivo'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → quote.service.js :: uploadQuoteWithFile
  // AUDITORÍA: COTIZACION_SUBIDA
  // ───────────────────────────────────────────────────────────
  static async uploadQuoteWithFile(req, res) {
    try {
      const { id } = req.params;
      const result = await QuoteService.uploadQuoteWithFile(req);

      // Auditoría: subida de cotización con archivo
      await audit.logWithReq(
        id,
        req.user.id,
        audit.ACCIONES.COTIZACION_SUBIDA,
        null,
        {
          estatus: 'PENDIENTE',
          quotes: result.quotes.map(q => ({
            id: q.id,
            proveedor: q.proveedor,
            monto: q.monto,
            archivoUrl: q.archivoUrl
          }))
        },
        req
      );

      res.json({
        message: 'Cotización subida exitosamente',
        data: {
          request: result.request,
          quotes: result.quotes
        }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo subir la cotización'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → purchase.service.js :: uploadQuoteFileForNewQuote
  // ───────────────────────────────────────────────────────────
  static async uploadQuoteFileForNewQuote(req, res) {
    try {
      const { id } = req.params;
      const { quoteIndex } = req.query;

      if (!req.file) {
        return res.status(400).json({
          error: 'Archivo requerido',
          message: 'Debe seleccionar un archivo para subir'
        });
      }

      const result = await PurchaseService.uploadQuoteFileForNewQuote(id, req.file.filename, quoteIndex);

      res.json({
        message: 'Archivo subido exitosamente',
        data: result
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo subir el archivo'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → purchase.service.js :: updateQuoteAmount
  // AUDITORÍA: MONTO_EDITADO
  // ───────────────────────────────────────────────────────────
  static async updateQuoteAmount(req, res) {
    try {
      const { id, quoteId } = req.params;
      const { monto } = req.body;

      // Obtener valor anterior antes de actualizar
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const quoteAnterior = await prisma.purchaseQuote.findUnique({ where: { id: quoteId } });

      const updatedQuote = await PurchaseService.updateQuoteAmount(id, quoteId, monto);

      // Auditoría: edición de monto
      await audit.logWithReq(
        id,
        req.user.id,
        audit.ACCIONES.MONTO_EDITADO,
        { quoteId, montoAnterior: quoteAnterior?.monto, proveedor: quoteAnterior?.proveedor },
        { quoteId, montoNuevo: updatedQuote.monto, proveedor: updatedQuote.proveedor },
        req
      );

      res.json({
        message: 'Monto actualizado exitosamente',
        data: updatedQuote
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el monto'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → comparison.service.js :: getQuoteComparison
  // ───────────────────────────────────────────────────────────
  static async getQuoteComparison(req, res) {
    try {
      const comparison = await ComparisonService.getQuoteComparison(req);

      if (comparison === null) {
        return res.json({
          comparison: null,
          message: 'No hay cotizaciones para comparar'
        });
      }

      res.json({ comparison });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener la comparativa'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → approval.service.js :: getPotentialApprovers
  // ───────────────────────────────────────────────────────────
  static async getPotentialApprovers(req, res) {
    try {
      const { id } = req.params;
      const potentialApprovers = await ApprovalService.getPotentialApprovers(id);

      res.json({ data: potentialApprovers });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error });
      }
      console.error("🔥 ERROR al obtener aprobadores potenciales:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los aprobadores'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → approval.service.js :: assignApprovers
  // AUDITORÍA: ENVIO_AUTORIZACION
  // ───────────────────────────────────────────────────────────
  static async assignApprovers(req, res) {
    try {
      const { id } = req.params;
      const { approverIds } = req.body;

      const approvers = await ApprovalService.assignApprovers(id, approverIds);

      // Auditoría: envío a autorización (asignación de aprobadores)
      await audit.logWithReq(
        id,
        req.user.id,
        audit.ACCIONES.ENVIO_AUTORIZACION,
        null,
        {
          estatus: 'EN_AUTORIZACION',
          approvers: approvers.map(a => ({
            employeeId: a.employeeId,
            nombre: a.employee?.nombre || 'N/A',
            estatus: a.estatus
          }))
        },
        req
      );

      res.json({
        message: 'Aprobadores asignados exitosamente',
        data: { approvers }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR al asignar aprobadores:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron asignar los aprobadores'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → purchase.service.js :: cancelRequest
  // AUDITORÍA: CANCELACION
  // ───────────────────────────────────────────────────────────
  static async cancelRequest(req, res) {
    try {
      const { id } = req.params;
      const updatedRequest = await PurchaseService.cancelRequest(req.user.id, req.user.role, id);

      // Auditoría: cancelación
      await audit.logWithReq(
        id,
        req.user.id,
        audit.ACCIONES.CANCELACION,
        { estatus: updatedRequest.estatus },
        { estatus: 'CANCELADO' },
        req
      );

      // Notificación: cualquier estado → CANCELADO (fire & forget)
      statusNotif.notifyStatusChangeAsync(id, updatedRequest.estatus, 'CANCELADO');

      res.json({
        message: 'Solicitud cancelada exitosamente',
        data: updatedRequest
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo cancelar la solicitud'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // REFACTORIZADO → purchase-notification.service.js :: sendAuthorization
  // AUDITORÍA: ENVIO_AUTORIZACION (reenvío)
  // ───────────────────────────────────────────────────────────
  static async sendAuthorization(req, res) {
    try {
      const { id } = req.params;
      const { approverEmails } = req.body;

      const result = await NotificationService.sendAuthorization(id, approverEmails);

      // Auditoría: envío de autorización por email
      await audit.logWithReq(
        id,
        req.user.id,
        audit.ACCIONES.ENVIO_AUTORIZACION,
        null,
        {
          approverEmails,
          sent: result.sent,
          failed: result.failed,
          total: result.total
        },
        req
      );

      res.json({
        message: `Autorización enviada a ${result.sent} aprobador(es)${result.failed > 0 ? `. ${result.failed} fallaron.` : ''}`,
        data: result
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo enviar la autorización'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // ORDEN DE COMPRA: Obtener OC de una solicitud
  // ───────────────────────────────────────────────────────────
  static async getPurchaseOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await PurchaseOrderService.getOrderByRequestId(id);

      if (!order) {
        return res.json({ order: null, message: 'Esta solicitud aún no tiene una orden de compra generada' });
      }

      res.json({ order });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR al obtener orden de compra:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener la orden de compra'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // ORDEN DE COMPRA: Listar todas las OC
  // ───────────────────────────────────────────────────────────
  static async getAllPurchaseOrders(req, res) {
    try {
      const orders = await PurchaseOrderService.getAllOrders();
      res.json({ orders });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR al listar órdenes de compra:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las órdenes de compra'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // ORDEN DE COMPRA: Generar OC manual (con partidas)
  // ───────────────────────────────────────────────────────────
  static async generatePurchaseOrder(req, res) {
    try {
      const { id } = req.params;
      const { items } = req.body; // Items personalizados desde el modal (con precioUnitario)
      const result = await PurchaseOrderService.generateOrder(id, req.user.id, items);

      // Auditoría
      await audit.logWithReq(
        id,
        req.user.id,
        audit.ACCIONES.ORDEN_COMPRA_GENERADA,
        null,
        {
          orderId: result.order.id,
          numero: result.order.numero,
          proveedor: result.order.proveedor,
          monto: result.order.monto,
          subtotal: result.order.subtotal,
          iva: result.order.iva,
          itemsCount: result.order.items?.length || 0,
          pdfUrl: result.pdfUrl
        },
        req
      );

      res.status(201).json({
        message: `Orden de compra ${result.order.numero} generada exitosamente con ${result.order.items?.length || 0} partida(s)`,
        data: result
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR al generar orden de compra:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo generar la orden de compra'
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // ORDEN DE COMPRA: Regenerar PDF de OC existente
  // ───────────────────────────────────────────────────────────
  static async regeneratePurchaseOrder(req, res) {
    try {
      const { id } = req.params;
      const result = await PurchaseOrderService.regeneratePdf(id, req.user.id);

      res.json({
        message: `PDF de orden de compra ${result.order.numero} regenerado exitosamente`,
        data: result
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error("🔥 ERROR al regenerar orden de compra:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo regenerar la orden de compra'
      });
    }
  }


  // ───────────────────────────────────────────────────────────
  // ENDPOINT DE AUDITORÍA: Obtener historial de una solicitud
  // ───────────────────────────────────────────────────────────
  static async getAuditHistory(req, res) {
    try {
      const { id } = req.params;

      const history = await audit.getHistory(id);

      res.json({ history });
    } catch (error) {
      console.error("🔥 ERROR al obtener historial de auditoría:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el historial de auditoría'
      });
    }
  }
}

module.exports = PurchaseController;
