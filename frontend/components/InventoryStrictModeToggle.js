'use client'

import { useState, useEffect } from 'react'
import { systemApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'

/**
 * Interruptor global (solo ADMIN) que controla si las entregas de
 * papelería/uniformes exigen inventario suficiente o se registran igual
 * dejando el stock en negativo. Se usa igual en ambas pantallas de gestión.
 */
export default function InventoryStrictModeToggle() {
  const { user } = useAuth()
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    systemApi.getInventoryStrictMode()
      .then(res => { if (mounted) setEnabled(!!res.data.data.enabled) })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  if (loading) return null

  const handleToggle = async () => {
    const next = !enabled
    try {
      setSaving(true)
      await systemApi.setInventoryStrictMode(next)
      setEnabled(next)
      toast.success(next ? 'Modo estricto activado' : 'Modo estricto desactivado')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2">
      <div>
        <p className="text-sm font-medium text-gray-900">Modo estricto de inventario</p>
        <p className="text-xs text-gray-500">
          {enabled
            ? 'Bloquea entregas si no hay inventario o no alcanza el stock.'
            : 'Permite entregar aunque no haya inventario cargado (queda en negativo).'}
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={!isAdmin || saving}
        title={isAdmin ? '' : 'Solo un Admin puede cambiar esto'}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${enabled ? 'bg-green-600' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}
