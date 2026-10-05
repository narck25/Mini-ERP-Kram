/**
 * ticketHelpers.js
 * Funciones helper reutilizables para páginas de Tickets de TI.
 */

export const getStatusColor = (estatus) => {
  switch (estatus) {
    case 'ABIERTO': return 'bg-red-100 text-red-800'
    case 'EN_PROCESO': return 'bg-blue-100 text-blue-800'
    case 'EN_ESPERA': return 'bg-yellow-100 text-yellow-800'
    case 'RESUELTO': return 'bg-green-100 text-green-800'
    case 'CERRADO': return 'bg-green-100 text-green-800'
    case 'CANCELADO': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const getStatusText = (estatus) => {
  switch (estatus) {
    case 'ABIERTO': return 'Abierto'
    case 'EN_PROCESO': return 'En proceso'
    case 'EN_ESPERA': return 'En espera de tu respuesta'
    case 'RESUELTO': return 'Resuelto'
    case 'CERRADO': return 'Cerrado'
    case 'CANCELADO': return 'Cancelado'
    default: return estatus
  }
}

export const getCategoriaLabel = (categoria) => {
  switch (categoria) {
    case 'PROBLEMA_TECNICO': return 'Problema técnico'
    case 'SOLICITUD_INFORME': return 'Solicitud de informe'
    case 'SOLICITUD_ACCESO': return 'Solicitud de acceso'
    case 'SOLICITUD_EQUIPO': return 'Solicitud de equipo'
    case 'OTRO': return 'Otro'
    default: return categoria
  }
}

export const getPrioridadColor = (prioridad) => {
  switch (prioridad) {
    case 'BAJA': return 'bg-gray-100 text-gray-700'
    case 'MEDIA': return 'bg-blue-100 text-blue-700'
    case 'ALTA': return 'bg-orange-100 text-orange-700'
    case 'URGENTE': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export const getPrioridadText = (prioridad) => {
  switch (prioridad) {
    case 'BAJA': return 'Baja'
    case 'MEDIA': return 'Media'
    case 'ALTA': return 'Alta'
    case 'URGENTE': return 'Urgente'
    default: return prioridad
  }
}

// createdAt/fechaResolucion/fechaCierre son timestamps reales (no fechas
// de calendario puras) — se muestran en la zona horaria local a propósito,
// sin forzar timeZone: 'UTC'.
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
