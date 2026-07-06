/**
 * status-templates.service.js
 * Plantillas HTML y configuración para notificaciones de cambio de estado.
 * Extraído de status-notification.service.js.
 */
const FRONTEND_URL = process.env.SERVICE_FQDN_FRONTEND ? `https://${process.env.SERVICE_FQDN_FRONTEND}` : 'http://localhost:3000';

const STATUS_CONFIG = {
  NUEVO:    { emoji:'\u{1F4DD}', label:'Nueva Solicitud',        color:'#fef3c7', textColor:'#92400e', title:'Solicitud de Compra Creada' },
  PENDIENTE:{ emoji:'\u23F3', label:'Pendiente',                color:'#dbeafe', textColor:'#1e40af', title:'Solicitud en Proceso' },
  EN_AUTORIZACION:{ emoji:'\u{1F510}', label:'En Autorizacion', color:'#f3e8ff', textColor:'#6b21a8', title:'Solicitud en Espera de Autorizacion' },
  APROBADO: { emoji:'\u2705', label:'Aprobado',                  color:'#d1fae5', textColor:'#065f46', title:'Solicitud Aprobada' },
  ENTREGADO:{ emoji:'\u{1F4E6}', label:'Entregado',              color:'#d1fae5', textColor:'#065f46', title:'Solicitud Entregada' },
  CANCELADO:{ emoji:'\u274C', label:'Cancelado',                 color:'#fee2e2', textColor:'#991b1b', title:'Solicitud Cancelada' }
};

const emailLayout = (title, content) => [
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>',
  'body{font-family:Segoe UI,Tahoma,Geneva,sans-serif;margin:0;padding:0;background:#f4f4f5}',
  '.container{max-width:600px;margin:0 auto;padding:20px}',
  '.header{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:30px 20px;text-align:center;border-radius:8px 8px 0 0}',
  '.body{background:#fff;padding:30px 20px;border-radius:0 0 8px 8px;box-shadow:0 2px 4px rgba(0,0,0,.1)}',
  '.footer{text-align:center;padding:20px;color:#71717a;font-size:12px}',
  '.button{display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;text-decoration:none;border-radius:6px;font-weight:600;margin:16px 0}',
  '.info-box{background:#f8fafc;border-left:4px solid #3b82f6;padding:12px 16px;margin:12px 0;border-radius:4px}',
  '.sb{display:inline-block;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600}',
  '.st{text-align:center;padding:16px;margin:16px 0;background:#f8fafc;border-radius:8px}',
  '.ar{font-size:24px;color:#3b82f6;margin:8px 0}',
  'table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid #e5e7eb}',
  '</style></head><body><div class="container"><div class="header"><h1>ERP KRAM</h1><p>Sistema de Gestion de Compras</p></div>',
  '<div class="body"><h2 style="color:#1e40af">'+title+'</h2>'+content+'<hr><p style="color:#71717a;font-size:13px">Mensaje automatico. No responder.</p></div>',
  '<div class="footer"><p>ERP KRAM &copy; '+new Date().getFullYear()+'</p></div></div></body></html>'
].join('');

const fmt = (n) => Number(n||0).toLocaleString('es-MX',{minimumFractionDigits:2});
const badge = (cfg) => `<span class="sb" style="background:${cfg.color};color:${cfg.textColor}">${cfg.emoji} ${cfg.label}</span>`;
const trans = (from,to) => `<div class="st">${badge(from)}<div class="ar">→</div>${badge(to)}</div>`;

const templatePendiente = (s, f, items, quotes) => {
  const ih = items.map(i => `<tr><td>${i.productoServicio}</td><td>${i.cantidad}</td></tr>`).join('');
  const qh = quotes.map(q => `<tr><td>${q.proveedor}</td><td>$${fmt(q.monto)}MXN</td></tr>`).join('');
  return `<p>Hola <strong>${s}</strong>,</p><p><strong>${quotes.length} cotizacion(es)</strong> recibidas.</p>${trans(STATUS_CONFIG.NUEVO,STATUS_CONFIG.PENDIENTE)}<div class="info-box"><strong>Folio:</strong> #${f}</div><h3>Articulos</h3><table>${ih}</table><h3>Cotizaciones</h3><table>${qh}</table><center><a href="${FRONTEND_URL}/dashboard/compras" class="button">Ver Solicitudes</a></center>`;
};

const templateEnAutorizacion = (s, f, monto, prov) =>
  `<p>Hola <strong>${s}</strong>,</p><p>Solicitud requiere <strong>autorizacion</strong> (>$50K).</p>${trans(STATUS_CONFIG.PENDIENTE,STATUS_CONFIG.EN_AUTORIZACION)}<div class="info-box"><strong>Folio:</strong> #${f}<br><strong>Proveedor:</strong> ${prov}<br><strong>Monto:</strong> $${fmt(monto)}MXN</div><center><a href="${FRONTEND_URL}/dashboard/compras" class="button">Dar Seguimiento</a></center>`;

const templateAprobado = (s, f, autorizadoPor, monto, prov) =>
  `<p>Hola <strong>${s}</strong>,</p><p>¡Solicitud <strong>aprobada</strong>!</p>${trans(STATUS_CONFIG.EN_AUTORIZACION,STATUS_CONFIG.APROBADO)}<div class="info-box"><strong>Folio:</strong> #${f}<br><strong>Proveedor:</strong> ${prov}<br><strong>Monto:</strong> $${fmt(monto)}MXN<br><strong>Autorizado por:</strong> ${autorizadoPor}</div><center><a href="${FRONTEND_URL}/dashboard/compras" class="button">Ver Solicitud</a></center>`;

const templateEntregado = (s, f, prov) =>
  `<p>Hola <strong>${s}</strong>,</p><p>Solicitud <strong>entregada</strong>.</p>${trans(STATUS_CONFIG.APROBADO,STATUS_CONFIG.ENTREGADO)}<div class="info-box"><strong>Folio:</strong> #${f}<br><strong>Proveedor:</strong> ${prov}</div><center><a href="${FRONTEND_URL}/dashboard/compras" class="button">Ver Detalles</a></center>`;

const templateCancelado = (s, f, prev) => {
  if (prev === newStatus) return templateGenerico(s, f, prev, 'CANCELADO');
  const pc = STATUS_CONFIG[prev] || {color:'#e5e7eb',textColor:'#374151',emoji:'',label:prev};
  return `<p>Hola <strong>${s}</strong>,</p><p>Solicitud <strong>cancelada</strong>.</p><div class="st"><span class="sb" style="background:${pc.color};color:${pc.textColor}">${pc.emoji}${pc.label}</span><div class="ar">→</div>${badge(STATUS_CONFIG.CANCELADO)}</div><div class="info-box"><strong>Folio:</strong> #${f}</div><center><a href="${FRONTEND_URL}/dashboard/compras" class="button">Ver Detalles</a></center>`;
};

const templateGenerico = (s, f, prev, next) => {
  const pc = STATUS_CONFIG[prev] || {emoji:'',label:prev,color:'#e5e7eb',textColor:'#374151'};
  const nc = STATUS_CONFIG[next] || {emoji:'',label:next,color:'#e5e7eb',textColor:'#374151'};
  return `<p>Hola <strong>${s}</strong>,</p><p>Estado actualizado.</p><div class="st"><span class="sb" style="background:${pc.color};color:${pc.textColor}">${pc.emoji}${pc.label}</span><div class="ar">→</div><span class="sb" style="background:${nc.color};color:${nc.textColor}">${nc.emoji}${nc.label}</span></div><div class="info-box"><strong>Folio:</strong> #${f}</div><center><a href="${FRONTEND_URL}/dashboard/compras" class="button">Ver Solicitud</a></center>`;
};

const getTemplate = (prev, next, data) => {
  const { solicitante, folio, items, quotes, monto, proveedor, autorizadoPor } = data;
  const t = `${prev}→${next}`;
  if (t === 'NUEVO→PENDIENTE') return templatePendiente(solicitante, folio, items, quotes);
  if (t === 'PENDIENTE→EN_AUTORIZACION') return templateEnAutorizacion(solicitante, folio, monto, proveedor);
  if (t === 'EN_AUTORIZACION→APROBADO') return templateAprobado(solicitante, folio, autorizadoPor, monto, proveedor);
  if (t === 'APROBADO→ENTREGADO') return templateEntregado(solicitante, folio, proveedor);
  if (next === 'CANCELADO') return templateCancelado(solicitante, folio, prev);
  return templateGenerico(solicitante, folio, prev, next);
};

const getSubject = (status, folio) => {
  const s = { PENDIENTE:`Solicitud #${folio} - Cotizaciones Recibidas`, EN_AUTORIZACION:`Solicitud #${folio} - Requiere Autorizacion`, APROBADO:`Solicitud #${folio} - Aprobada`, ENTREGADO:`Solicitud #${folio} - Entregada`, CANCELADO:`Solicitud #${folio} - Cancelada` };
  return s[status] || `Solicitud #${folio} - ${STATUS_CONFIG[status]?.label||status}`;
};

module.exports = { STATUS_CONFIG, emailLayout, getTemplate, getSubject, FRONTEND_URL };