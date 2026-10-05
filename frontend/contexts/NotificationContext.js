'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { notificationCenterApi } from '@/lib/api'

const NotificationContext = createContext({})

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

const POLL_INTERVAL_MS = 30000

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationCenterApi.getUnreadCount()
      setUnreadCount(res.data?.count || 0)
    } catch (error) {
      console.error('Error fetching unread notification count:', error)
    }
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const res = await notificationCenterApi.getAll()
      setNotifications(res.data?.data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationCenterApi.markAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationCenterApi.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [])

  // Poll solo mientras haya sesión iniciada — primer uso de setInterval en
  // el frontend, se limpia en el cleanup igual que el listener de
  // click-outside de DashboardLayout.js.
  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      setNotifications([])
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    fetchUnreadCount()
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [user, fetchUnreadCount])

  const value = { unreadCount, notifications, loading, fetchAll, markAsRead, markAllAsRead }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
