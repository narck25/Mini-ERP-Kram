const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const purchaseCommentNotification = require('../services/purchases/purchase-comment-notification.service');
const audit = require('../services/audit.service');

class PurchaseCommentController {
  /**
   * Obtener todos los comentarios de una solicitud de compra
   * Ordenados cronológicamente (más antiguos primero)
   */
  static async getComments(req, res) {
    try {
      const { id } = req.params;

      // Verificar que la solicitud exista
      const request = await prisma.purchaseRequest.findUnique({
        where: { id }
      });

      if (!request) {
        return res.status(404).json({
          error: 'Solicitud no encontrada',
          message: 'La solicitud de compra no existe'
        });
      }

      // Obtener comentarios con información del usuario
      const comments = await prisma.purchaseComment.findMany({
        where: { requestId: id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              employee: {
                select: {
                  id: true,
                  nombre: true,
                  fotoUrl: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      res.json({ comments });
    } catch (error) {
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los comentarios'
      });
    }
  }

  /**
   * Agregar un comentario a una solicitud de compra
   * Cualquier usuario con acceso a la solicitud puede comentar.
   * Notifica por correo a "la otra parte" (solicitante <-> Compras),
   * nunca al propio autor.
   */
  static async addComment(req, res) {
    try {
      const { id } = req.params;
      const { mensaje } = req.body;
      const userId = req.user.id;

      // Validar mensaje
      if (!mensaje || !mensaje.trim()) {
        return res.status(400).json({
          error: 'Mensaje requerido',
          message: 'El comentario no puede estar vacío'
        });
      }

      // Verificar que la solicitud exista
      const request = await prisma.purchaseRequest.findUnique({
        where: { id },
        include: {
          solicitante: {
            select: { userId: true }
          }
        }
      });

      if (!request) {
        return res.status(404).json({
          error: 'Solicitud no encontrada',
          message: 'La solicitud de compra no existe'
        });
      }

      // Verificar permisos: solo el solicitante o Admin/Compras pueden comentar
      const isSolicitante = request.solicitante.userId === userId;
      const isAdminOrCompras = ['ADMIN', 'COMPRAS'].includes(req.user.role);

      if (!isSolicitante && !isAdminOrCompras) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'No tiene permisos para comentar en esta solicitud'
        });
      }

      // Cuando Compras/Admin comenta por primera vez una solicitud NUEVA,
      // pasa a EN_PROCESO — señal de que Compras ya empezó a atenderla
      // (el comentario del propio solicitante no la mueve: "en proceso"
      // significa que Compras la está trabajando, no solo que existe
      // actividad en el hilo).
      if (isAdminOrCompras && request.estatus === 'NUEVO') {
        await prisma.purchaseRequest.update({
          where: { id },
          data: { estatus: 'EN_PROCESO' }
        });
        audit.logWithReq(id, userId, audit.ACCIONES.ACTUALIZACION, { estatus: 'NUEVO' }, { estatus: 'EN_PROCESO' }, req)
          .catch(err => console.error('Error registrando auditoría NUEVO->EN_PROCESO:', err.message));
      }

      // Crear el comentario
      const comment = await prisma.purchaseComment.create({
        data: {
          requestId: id,
          userId,
          mensaje: mensaje.trim()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              employee: {
                select: {
                  id: true,
                  nombre: true,
                  fotoUrl: true
                }
              }
            }
          }
        }
      });

      try {
        await purchaseCommentNotification.notifyNewComment(id, userId);
      } catch (notifErr) {
        console.warn('No se pudo notificar el comentario nuevo por correo:', notifErr.message);
      }

      res.status(201).json({
        message: 'Comentario agregado exitosamente',
        data: comment
      });
    } catch (error) {
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo agregar el comentario'
      });
    }
  }
}

module.exports = PurchaseCommentController;
