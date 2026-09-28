'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'

/**
 * Interruptor genérico (RH/ADMIN) para pausar/reanudar un módulo que corre
 * por cron sin necesitar un deploy. Reutilizado por Periodo de Prueba y
 * Evaluación Operativa — mismo patrón que InventoryStrictModeToggle.js pero
 * parametrizado, en vez de duplicar el componente para cada interruptor.
 */
export default function FeatureToggle({ title, onDescription, offDescription, getFn, setFn }) {
  const { user } = useAuth()
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    getFn()
      .then(res => { if (mounted) setEnabled(!!res.data.data.enabled) })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [getFn])

  if (loading) return null

  const handleToggle = async () => {
    const next = !enabled
    try {
      setSaving(true)
      await setFn(next)
      setEnabled(next)
      toast.success(next ? `${title}: activado` : `${title}: desactivado`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const canToggle = user?.role === 'ADMIN' || user?.role === 'RH'

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2">
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{enabled ? onDescription : offDescription}</p>
      </div>
      <button
        onClick={handleToggle}
        disabled={!canToggle || saving}
        title={canToggle ? '' : 'Solo RH o un Admin puede cambiar esto'}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${enabled ? 'bg-green-600' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}
