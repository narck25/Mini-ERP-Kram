'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Dashboard landing page.
 * 
 * Redirige automáticamente a "Mi Espacio" que es el panel personalizado
 * del usuario con métricas reales. El grid de botones anterior era redundante
 * con el sidebar.
 */
export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/mi-espacio')
  }, [router])

  return null
}