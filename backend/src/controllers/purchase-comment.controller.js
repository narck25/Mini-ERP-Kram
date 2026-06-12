const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Gestor de conexiones SSE para comentarios en tiempo real.
 * Permite que múltiples clientes se suscriban a los comentarios
 * de una solicitud de compra y reciban actualizaciones instantáneas.
 */
const sseManager = require('../services/sse-manager.service');

class PurchaseCommentController {
  /**
   * Endpoint SSE: Transmitir comentarios en tiempo real.
   * ─────────────────────────────────────────────────────────────
   * Los clientes se conectan via EventSource (navegador) y reciben
   * automáticamente los nuevos comentarios sin necesidad de polling.
   *
   * Autenticación: El token JWT se pasa como query param `token`
   *                porque EventSource no soporta headers personalizados.
   *
   * Eventos emitidos:
   *   - 'new-comment': Cuando se agrega un nuevo comentario.
   *                    payload: { comment: {...} }
   *   - 'connected':   Cuando el cliente se conecta exitosamente.
   *                    payload: { requestId, timestamp }
   *   - 'heartbeat':   Cada 30s para mantener viva la conexión.
   *   - 'shutdown':    Cuando el servidor se apaga.
   * ─────────────────────────────────────────────────────────────
   */
  static async streamComments(req, res) {
    try {
      const { id } = req.params;

      // ── 1. Verificar que la solicitud exista ──
      const request = await prisma.purchaseRequest.findUnique({
        where: { id }
      });

      if (!request) {
        return res.status(404).json({
          error: 'Solicitud no encontrada',
          message: 'La solicitud de compra no existe'
        });
      }

      // ── 2. Configurar headers SSE ──
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',  // Deshabilitar buffering de Nginx
        'Access-Control-Allow-Origin': '*'
      });

      // ── 3. Enviar evento de conexión exitosa ──
      const connectedEvent = {
        requestId: id,
        timestamp: new Date().toISOString(),
        message: 'Conectado al stream de comentarios'
      };
      res.write(`event: connected\ndata: ${JSON.stringify(connectedEvent)}\n\n`);

      // ── 4. Registrar este cliente en la sala SSE ──
      sseManager.addClient(id, res);

      // NOTA: No llamamos a next() ni res.json() porque
      //       la conexión SSE se mantiene abierta indefinidamente.
      //       El cleanup se maneja automáticamente en sseManager
      //       cuando el cliente se desconecta.
    } catch (error) {
      console.error("🔥 ERROR SSE:", error);
      // Si ya se enviaron headers, intentar enviar error como evento
      if (res.headersSent) {
        try {
          res.write(`event: error\ndata: ${JSON.stringify({ error: 'Error interno del servidor' })}\n\n`);
          res.end();
        } catch (e) {
          // Ignorar si ya se cerró
        }
      } else {
        res.status(500).json({
          error: 'Error interno del servidor',
          message: 'No se pudo establecer la conexión SSE'
        });
      }
    }
  }

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
   * Cualquier usuario con acceso a la solicitud puede comentar
   *
   * Además de crear el comentario en BD, emite un evento SSE
   * 'new-comment' a todos los clientes suscritos a esta solicitud.
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

      // ── Emitir evento SSE 'new-comment' a los clientes suscritos ──
      // Esto actualiza en tiempo real la lista de comentarios en todos
      // los navegadores que tengan abierta esta solicitud.
      // Fire & forget: si no hay clientes conectados, no hace nada.
      sseManager.broadcast(id, 'new-comment', { comment });

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
