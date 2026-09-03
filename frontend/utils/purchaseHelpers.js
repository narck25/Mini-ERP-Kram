/**
 * purchaseHelpers.js
 * Funciones helper reutilizables para páginas de compras.
 */

export const getStatusColor = (estatus) => {
  switch (estatus) {
    case 'BORRADOR': return 'bg-gray-100 text-gray-600'
    case 'NUEVO': return 'bg-red-100 text-red-800'
    case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800'
    case 'EN_AUTORIZACION': return 'bg-blue-100 text-blue-800'
    case 'APROBADO': return 'bg-green-100 text-green-800'
    case 'ENTREGADO': return 'bg-green-100 text-green-800'
    case 'CANCELADO': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const getStatusText = (estatus) => {
  switch (estatus) {
    case 'BORRADOR': return 'Borrador'
    case 'NUEVO': return 'Nuevo'
    case 'PENDIENTE': return 'Pendiente de cotización'
    case 'EN_AUTORIZACION': return 'En autorización'
    case 'APROBADO': return 'Aprobado'
    case 'ENTREGADO': return 'Entregado'
    case 'CANCELADO': return 'Cancelado'
    default: return estatus
  }
}

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export const formatCurrency = (amount) => {
  if (!amount) return '$0.00'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}