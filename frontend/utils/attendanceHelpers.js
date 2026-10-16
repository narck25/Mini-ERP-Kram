/**
 * attendanceHelpers.js
 * Funciones helper compartidas entre la Vista Detallada (export CSV) y la
 * Vista Matriz Quincenal de /rh/incidencias, para que ambas lean/formateen
 * exactamente igual los datos que arma procesarAsistencia().
 */

// 24h, nunca AM/PM (el checador y el CSV de referencia siempre usan 24h).
export const fHoraStr = (date) =>
  date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'

// 'YYYY-MM-DD' -> 'DD/MM/YYYY'
export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

// Mismo estatus corto que se usa en pantalla ('Normal'/'Atención'/'Crítico'/
// 'Información'), con el detalle entre paréntesis que piden los reportes exportados.
export const getEstadoDescriptivo = (estatus) => {
  switch (estatus) {
    case 'Atención': return 'Atención (descansos excedidos)'
    case 'Crítico': return 'Crítico (registros faltantes)'
    case 'Información': return 'Información (turno corto)'
    default: return 'Normal'
  }
}

// Sin ceros decimales de sobra: 10 en vez de 10.0, 10.8 se queda igual.
export const formatDuracion = (horas) => {
  const num = parseFloat(horas)
  if (Number.isNaN(num)) return '0'
  return Number.isInteger(num) ? String(num) : num.toFixed(1)
}
