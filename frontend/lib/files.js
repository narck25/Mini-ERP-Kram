import api from './api/client'
import toast from 'react-hot-toast'

/**
 * Utilidades para leer archivos protegidos bajo /uploads (hallazgo de
 * seguridad #1, docs/PROJECT_CONTEXT.md §13). El backend ya no sirve esos
 * archivos públicamente — hay que pedirlos con el mismo token que el resto
 * de la API (vía el interceptor de `api`) y convertir la respuesta binaria
 * en una URL de objeto que sí se puede usar como `src`/`href`.
 *
 * `baseURL: ''` es necesario en cada llamada: la instancia `api` usa
 * baseURL '/api' por defecto, y una ruta relativa como "/uploads/..." NO
 * se reconoce como absoluta, así que sin este override se pediría
 * "/api/uploads/..." (incorrecto). Cuando el backend ya devuelve una URL
 * absoluta (como pasa con las cotizaciones de compras, ver
 * purchase.service.js buildFileUrl), axios ignora baseURL de todos modos,
 * así que la misma llamada funciona para ambas formas.
 */
async function fetchProtectedFileBlobUrl(rawUrl) {
  const response = await api.get(rawUrl, { responseType: 'blob', baseURL: '' })
  return URL.createObjectURL(response.data)
}

/**
 * Descarga forzada de un archivo protegido (equivalente a lo que antes
 * hacía un <a download href="/uploads/..."> directo).
 */
async function downloadProtectedFile(rawUrl, filename) {
  try {
    const blobUrl = await fetchProtectedFileBlobUrl(rawUrl)
    const link = document.createElement('a')
    link.href = blobUrl
    link.setAttribute('download', filename || '')
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Error descargando archivo:', error)
    toast.error('No se pudo descargar el archivo')
  }
}

/**
 * Abre un archivo protegido en una pestaña nueva (equivalente a lo que
 * antes hacía un <a target="_blank" href="/uploads/..."> directo).
 */
async function openProtectedFile(rawUrl) {
  try {
    const blobUrl = await fetchProtectedFileBlobUrl(rawUrl)
    window.open(blobUrl, '_blank', 'noopener,noreferrer')
  } catch (error) {
    console.error('Error abriendo archivo:', error)
    toast.error('No se pudo abrir el archivo')
  }
}

export { fetchProtectedFileBlobUrl, downloadProtectedFile, openProtectedFile }
