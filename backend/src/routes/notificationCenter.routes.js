const { Router } = require('express');
const router = Router();
const AuthMiddleware = require('../middlewares/auth.middleware');
const NotificationCenterController = require('../controllers/notification-center.controller');

// Sin requireModule a propósito: cada usuario ve únicamente sus propias
// notificaciones (scoping por req.user.id dentro del servicio), igual que
// GET /api/notifications/upcoming. Nombre de ruta distinto de /api/notifications
// (ya ocupado por el cron de cumpleaños/aniversario) para no mezclar ambos.
router.use(AuthMiddleware.verifyToken);

router.get('/notification-center', NotificationCenterController.getAll);
router.get('/notification-center/unread-count', NotificationCenterController.getUnreadCount);
router.patch('/notification-center/:id/read', NotificationCenterController.markAsRead);
router.post('/notification-center/read-all', NotificationCenterController.markAllAsRead);

module.exports = router;
