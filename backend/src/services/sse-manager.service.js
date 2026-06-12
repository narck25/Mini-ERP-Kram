/**
 * sse-manager.service.js
 * ─────────────────────────────────────────────────────────────
 * Gestor de conexiones Server-Sent Events (SSE).
 *
 * Responsabilidad: Mantener un mapa de conexiones SSE activas
 *                  agrupadas por requestId, y emitir eventos
 *                  a los clientes suscritos.
 *
 * Uso:
 *   const sseManager = require('../services/sse-manager.service');
 *
 *   // En el endpoint SSE:
 *   sseManager.addClient(requestId, res);
 *
 *   // Al crear un comentario:
 *   sseManager.broadcast(requestId, 'new-comment', commentData);
 *
 *   // Al cerrar conexión:
 *   sseManager.removeClient(requestId, res);
 *
 * Thread-safe: Cada conexión tiene su propio objeto res.
 * No usa dependencias externas.
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Mapa de conexiones activas.
 * Estructura: Map<requestId, Set<response>>
 * Cada solicitud de compra tiene un Set de respuestas SSE activas.
 */
const clients = new Map();

/**
 * Contador de conexiones activas (para monitoreo)
 */
let totalConnections = 0;

// ─────────────────────────────────────────────────────────────
// 1. Agregar un cliente SSE a una sala (requestId)
// ─────────────────────────────────────────────────────────────
const addClient = (requestId, res) => {
  if (!clients.has(requestId)) {
    clients.set(requestId, new Set());
  }

  const room = clients.get(requestId);
  room.add(res);
  totalConnections++;

  console.log(
    `🔌 SSE: Cliente conectado a sala "${requestId}" ` +
    `(sala: ${room.size} conexiones, total: ${totalConnections})`
  );

  // Enviar heartbeat cada 30 segundos para mantener viva la conexión
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`:heartbeat ${new Date().toISOString()}\n\n`);
    } catch (err) {
      // Si falla el heartbeat, la conexión probablemente se perdió
      clearInterval(heartbeatInterval);
      removeClient(requestId, res);
    }
  }, 30000);

  // Almacenar el intervalo en la respuesta para limpiarlo después
  res._sseHeartbeat = heartbeatInterval;

  // Evento 'close' de la conexión HTTP
  res.on('close', () => {
    clearInterval(heartbeatInterval);
    removeClient(requestId, res);
  });
};

// ─────────────────────────────────────────────────────────────
// 2. Remover un cliente SSE de una sala
// ─────────────────────────────────────────────────────────────
const removeClient = (requestId, res) => {
  const room = clients.get(requestId);
  if (!room) return;

  room.delete(res);
  totalConnections--;

  // Limpiar heartbeat si existe
  if (res._sseHeartbeat) {
    clearInterval(res._sseHeartbeat);
    delete res._sseHeartbeat;
  }

  console.log(
    `🔌 SSE: Cliente desconectado de sala "${requestId}" ` +
    `(sala: ${room.size} restantes, total: ${totalConnections})`
  );

  // Si la sala quedó vacía, eliminarla del mapa
  if (room.size === 0) {
    clients.delete(requestId);
    console.log(`🔌 SSE: Sala "${requestId}" eliminada (sin clientes)`);
  }
};

// ─────────────────────────────────────────────────────────────
// 3. Emitir un evento a todos los clientes de una sala
// ─────────────────────────────────────────────────────────────
const broadcast = (requestId, eventName, data) => {
  const room = clients.get(requestId);
  if (!room || room.size === 0) {
    // Sin clientes suscritos, no hay nada que emitir
    return;
  }

  const payload = JSON.stringify(data);
  const message = `event: ${eventName}\ndata: ${payload}\n\n`;

  let sentCount = 0;
  const deadConnections = [];

  room.forEach((res) => {
    try {
      res.write(message);
      sentCount++;
    } catch (err) {
      // Conexión muerta, marcar para limpieza
      console.warn(`⚠️ SSE: Error al escribir a cliente, marcando para limpieza:`, err.message);
      deadConnections.push(res);
    }
  });

  // Limpiar conexiones muertas
  deadConnections.forEach((deadRes) => {
    removeClient(requestId, deadRes);
  });

  if (sentCount > 0) {
    console.log(
      `📡 SSE: Evento "${eventName}" emitido a ${sentCount} cliente(s) ` +
      `en sala "${requestId}"` +
      (deadConnections.length > 0 ? ` (${deadConnections.length} conexiones muertas limpiadas)` : '')
    );
  }
};

// ─────────────────────────────────────────────────────────────
// 4. Obtener estadísticas de conexiones (para monitoreo)
// ─────────────────────────────────────────────────────────────
const getStats = () => {
  const rooms = [];
  clients.forEach((room, requestId) => {
    rooms.push({
      requestId,
      connections: room.size
    });
  });

  return {
    totalConnections,
    activeRooms: clients.size,
    rooms: rooms.sort((a, b) => b.connections - a.connections)
  };
};

// ─────────────────────────────────────────────────────────────
// 5. Limpiar todas las conexiones (para graceful shutdown)
// ─────────────────────────────────────────────────────────────
const cleanup = () => {
  console.log(`🧹 SSE: Limpiando ${totalConnections} conexiones activas...`);

  clients.forEach((room, requestId) => {
    room.forEach((res) => {
      try {
        // Enviar evento de cierre
        res.write(`event: shutdown\ndata: {"message":"Server shutting down"}\n\n`);
        res.end();
      } catch (err) {
        // Ignorar errores en cleanup
      }
    });
    room.clear();
  });

  clients.clear();
  totalConnections = 0;
  console.log('🧹 SSE: Todas las conexiones limpiadas');
};

module.exports = {
  addClient,
  removeClient,
  broadcast,
  getStats,
  cleanup
};
