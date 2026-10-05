const notificationCenter = require('../services/notification-center.service');

class NotificationCenterController {
  static async getAll(req, res) {
    try {
      const data = await notificationCenter.getAll(req.user.id);
      res.json({ data });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async getUnreadCount(req, res) {
    try {
      const count = await notificationCenter.getUnreadCount(req.user.id);
      res.json({ count });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async markAsRead(req, res) {
    try {
      const data = await notificationCenter.markAsRead(req.params.id, req.user.id);
      res.json({ data });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  static async markAllAsRead(req, res) {
    try {
      const result = await notificationCenter.markAllAsRead(req.user.id);
      res.json({ data: result });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
}

module.exports = NotificationCenterController;
