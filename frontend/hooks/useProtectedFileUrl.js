'use client'

import { useEffect, useRef, useState } from 'react'
import { fetchProtectedFileBlobUrl } from '@/lib/files'

/**
 * Resuelve una URL protegida bajo /uploads (hallazgo de seguridad #1,
 * docs/PROJECT_CONTEXT.md §13) a una URL de objeto (blob) que sí puede
 * usarse como `src` de <img>/<iframe> — un <img src="/uploads/..."> directo
 * ya no funciona porque el backend exige el token de autenticación, que
 * un tag HTML no puede mandar por sí solo.
 *
 * @param {string|null|undefined} rawUrl - valor tal como lo devuelve la API
 *   (ruta relativa "/uploads/..." o, en el caso de cotizaciones de compra,
 *   una URL absoluta ya armada por el backend — ambas funcionan igual).
 * @returns {{ blobUrl: string|null, loading: boolean, error: boolean }}
 */
export function useProtectedFileUrl(rawUrl) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const previousBlobUrl = useRef(null)

  useEffect(() => {
    let cancelled = false

    // Libera la URL de objeto anterior antes de pedir la nueva.
    if (previousBlobUrl.current) {
      URL.revokeObjectURL(previousBlobUrl.current)
      previousBlobUrl.current = null
    }
    setBlobUrl(null)
    setError(false)

    if (!rawUrl) {
      return undefined
    }

    setLoading(true)
    fetchProtectedFileBlobUrl(rawUrl)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url)
          return
        }
        previousBlobUrl.current = url
        setBlobUrl(url)
      })
      .catch((err) => {
        console.error('Error cargando archivo protegido:', err)
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [rawUrl])

  // Libera la última URL de objeto al desmontar el componente.
  useEffect(() => {
    return () => {
      if (previousBlobUrl.current) {
        URL.revokeObjectURL(previousBlobUrl.current)
        previousBlobUrl.current = null
      }
    }
  }, [])

  return { blobUrl, loading, error }
}
