/**
 * Rutas de Notificaciones del Sistema
 * 
 * Endpoints para gestionar notificaciones de cumpleaños y aniversarios.
 */

const { Router } = require('express');
const router = Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AuthMiddleware = require('../middlewares/auth.middleware');
const { checkAndNotify, getUpcomingEvents } = require('../services/birthdayAnniversary.service');

/**
 * Middleware: Solo ADMIN y RH pueden acceder
 */
const requireAdminOrRH = (req, res, next) => {
  if (req.user.role === 'ADMIN' || req.user.role === 'RH') {
    return next();
  }
  return res.status(403).json({ error: 'Solo ADMIN o RH pueden acceder a este recurso' });
};

/**
 * GET /api/notifications/upcoming
 * Obtiene próximos cumpleaños y aniversarios
 * Query params: dias (default: 30)
 */
router.get('/notifications/upcoming', AuthMiddleware.verifyToken, async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 30;
    const events = await getUpcomingEvents(dias);
    res.json({ data: events });
  } catch (err) {
    console.error('❌ Error al obtener próximos eventos:', err.message);
    res.status(500).json({ error: 'Error al obtener próximos eventos' });
  }
});

/**
 * POST /api/notifications/check-now
 * Ejecuta manualmente la verificación de cumpleaños/aniversarios
 * Solo ADMIN y RH
 */
router.post('/notifications/check-now', AuthMiddleware.verifyToken, requireAdminOrRH, async (req, res) => {
  try {
    console.log('🚀 Ejecución manual de verificación de cumpleaños/aniversarios...');
    const resultado = await checkAndNotify();
    res.json({
      message: 'Verificación completada',
      data: resultado
    });
  } catch (err) {
    console.error('❌ Error en verificación manual:', err.message);
    res.status(500).json({ error: 'Error al ejecutar verificación' });
  }
});

/**
 * GET /api/notifications/logs
 * Obtiene el historial de notificaciones enviadas
 * Solo ADMIN y RH
 * Query params: page, limit, tipo (CUMPLEANOS|ANIVERSARIO)
 */
router.get('/notifications/logs', AuthMiddleware.verifyToken, requireAdminOrRH, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const tipo = req.query.tipo;

    const where = {};
    if (tipo && ['CUMPLEANOS', 'ANIVERSARIO'].includes(tipo)) {
      where.tipo = tipo;
    }

    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        orderBy: { enviadoA: 'desc' },
        skip,
        take: limit
      }),
      prisma.notificationLog.count({ where })
    ]);

    res.json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('❌ Error al obtener logs:', err.message);
    res.status(500).json({ error: 'Error al obtener historial de notificaciones' });
  }
});

module.exports = router;
