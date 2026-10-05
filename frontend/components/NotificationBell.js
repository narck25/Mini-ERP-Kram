'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/contexts/NotificationContext'

function iconoPorTipo(tipo) {
  if (!tipo) return '🔔'
  if (tipo.startsWith('TICKET_')) return '🎫'
  if (tipo.startsWith('COMPRA_')) return '🛒'
  if (tipo.startsWith('VACACION_')) return '🏖️'
  if (tipo.startsWith('PERIODO_PRUEBA_')) return '📋'
  if (tipo.startsWith('EVAL_OPERATIVA_')) return '📈'
  if (tipo.startsWith('VACANTE_')) return '📝'
  if (tipo.startsWith('CANDIDATO_')) return '🧑‍💼'
  return '🔔'
}

function tiempoRelativo(dateString) {
  const fecha = new Date(dateString)
  const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000)
  if (segundos < 60) return 'ahora'
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias < 7) return `hace ${dias} d`
  return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const router = useRouter()
  const { unreadCount, notifications, loading, fetchAll, markAsRead, markAllAsRead } = useNotifications()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (open && panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next) fetchAll()
  }

  const handleClickNotification = async (notif) => {
    if (!notif.leida) await markAsRead(notif.id)
    setOpen(false)
    if (notif.link) router.push(notif.link)
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-150"
        aria-label="Notificaciones"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute left-0 bottom-full mb-2 w-80 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-300 origin-bottom-left"
        >
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notificaciones</div>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">No tienes notificaciones</div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClickNotification(notif)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 last:border-0 ${
                    notif.leida ? 'opacity-60' : ''
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{iconoPorTipo(notif.tipo)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${notif.leida ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'}`}>
                      {notif.titulo}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{notif.mensaje}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{tiempoRelativo(notif.createdAt)}</p>
                  </div>
                  {!notif.leida && <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
