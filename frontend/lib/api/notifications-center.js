import api from './client'

// Centro de notificaciones en la app (campanita) — mismo molde plano que
// tickets.js. Distinto de systemApi (que cubre /notifications, el endpoint
// de cumpleaños/aniversario).
export const notificationCenterApi = {
  getAll: () => api.get('/notification-center'),
  getUnreadCount: () => api.get('/notification-center/unread-count'),
  markAsRead: (id) => api.patch(`/notification-center/${id}/read`),
  markAllAsRead: () => api.post('/notification-center/read-all'),
}
