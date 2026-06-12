/**
 * status-notification.service.js
 * ─────────────────────────────────────────────────────────────
 * Notificaciones automáticas al solicitante cuando cambia
 * el estado de su solicitud de compra.
 *
 * Responsabilidad: Enviar email al solicitante informando
 *                  sobre cambios de estado en su solicitud.
 *
 * Uso:
 *   const statusNotif = require('./status-notification.service');
 *   await statusNotif.notifyStatusChange(requestId, 'NUEVO', 'PENDIENTE');
 *
 * Diseñado para ejecutarse de manera asíncrona (fire & forget)
 * sin afectar el flujo principal de la operación.
 * ─────────────────────────────────────────────────────────────
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('../email.service');

// ─────────────────────────────────────────────────────────────
// Constantes: configuración de estados
// ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  NUEVO: {
    emoji: '📝',
    label: 'Nueva Solicitud',
    color: '#fef3c7',
    textColor: '#92400e',
    title: 'Solicitud de Compra Creada'
  },
  PENDIENTE: {
    emoji: '⏳',
    label: 'Pendiente',
    color: '#dbeafe',
    textColor: '#1e40af',
    title: 'Solicitud en Proceso'
  },
  EN_AUTORIZACION: {
    emoji: '🔐',
    label: 'En Autorización',
    color: '#f3e8ff',
    textColor: '#6b21a8',
    title: 'Solicitud en Espera de Autorización'
  },
  APROBADO: {
    emoji: '✅',
    label: 'Aprobado',
    color: '#d1fae5',
    textColor: '#065f46',
    title: 'Solicitud Aprobada'
  },
  ENTREGADO: {
    emoji: '📦',
    label: 'Entregado',
    color: '#d1fae5',
    textColor: '#065f46',
    title: 'Solicitud Entregada'
  },
  CANCELADO: {
    emoji: '❌',
    label: 'Cancelado',
    color: '#fee2e2',
    textColor: '#991b1b',
    title: 'Solicitud Cancelada'
  }
};

// ─────────────────────────────────────────────────────────────
// Plantilla base con estilos del ERP (reutiliza emailLayout)
// ─────────────────────────────────────────────────────────────
const FRONTEND_URL = process.env.SERVICE_FQDN_FRONTEND
  ? `https://${process.env.SERVICE_FQDN_FRONTEND}`
  : 'http://localhost:3000';

const emailLayout = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 8px 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .body {
      background: white;
      padding: 30px 20px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #71717a;
      font-size: 12px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 16px 0;
    }
    .info-box {
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      padding: 12px 16px;
      margin: 12px 0;
      border-radius: 4px;
    }
    .info-box strong {
      color: #1e40af;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }
    .status-transition {
      text-align: center;
      padding: 16px;
      margin: 16px 0;
      background: #f8fafc;
      border-radius: 8px;
    }
    .status-transition .arrow {
      font-size: 24px;
      color: #3b82f6;
      margin: 8px 0;
    }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
    td:first-child { font-weight: 600; color: #1e40af; width: 40%; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ERP KRAM</h1>
      <p>Sistema de Gestión de Compras</p>
    </div>
    <div class="body">
      <h2 style="color: #1e40af; margin-top: 0;">${title}</h2>
      ${content}
      <hr>
      <p style="color: #71717a; font-size: 13px;">
        Este es un mensaje automático del Sistema ERP KRAM. Por favor no respondas a este correo.
      </p>
    </div>
    <div class="footer">
      <p>ERP KRAM &copy; ${new Date().getFullYear()} - Todos los derechos reservados</p>
      <p>Este correo fue enviado automáticamente por el sistema.</p>
    </div>
  </div>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────────
// Plantillas HTML por estado
// ─────────────────────────────────────────────────────────────

/**
 * Plantilla para NUEVO → PENDIENTE (cotizaciones subidas)
 */
const templatePendiente = (solicitante, folio, items, quotes) => {
  const itemsHtml = items.map(i =>
    `<tr><td>${i.productoServicio}</td><td>${i.cantidad}</td></tr>`
  ).join('');

  const quotesHtml = quotes.map(q =>
    `<tr><td>${q.proveedor}</td><td>$${Number(q.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</td></tr>`
  ).join('');

  return `
    <p>Hola <strong>${solicitante}</strong>,</p>
    <p>Se han subido <strong>${quotes.length} cotización(es)</strong> a tu solicitud de compra.</p>

    <div class="status-transition">
      <span class="status-badge" style="background: #fef3c7; color: #92400e;">📝 Nueva Solicitud</span>
      <div class="arrow">→</div>
      <span class="status-badge" style="background: #dbeafe; color: #1e40af;">⏳ Pendiente</span>
    </div>

    <div class="info-box">
      <strong>Folio:</strong> #${folio}<br>
      <strong>Nuevo estatus:</strong> <span class="status-badge" style="background: #dbeafe; color: #1e40af;">PENDIENTE</span>
    </div>

    <h3 style="color: #1e40af; margin-bottom: 4px;">📋 Artículos Solicitados</h3>
    <table>
      <tr style="background: #f1f5f9;"><th style="padding: 8px; text-align: left;">Producto/Servicio</th><th style="padding: 8px; text-align: left;">Cantidad</th></tr>
      ${itemsHtml}
    </table>

    <h3 style="color: #1e40af; margin: 16px 0 4px;">💰 Cotizaciones Recibidas</h3>
    <table>
      <tr style="background: #f1f5f9;"><th style="padding: 8px; text-align: left;">Proveedor</th><th style="padding: 8px; text-align: left;">Monto</th></tr>
      ${quotesHtml}
    </table>

    <p style="margin-top: 16px;">El equipo de Compras está revisando las cotizaciones. Te notificaremos cuando haya una actualización.</p>

    <center>
      <a href="${FRONTEND_URL}/dashboard/compras" class="button">
        Ver Mis Solicitudes
      </a>
    </center>
  `;
};

/**
 * Plantilla para PENDIENTE → EN_AUTORIZACION
 */
const templateEnAutorizacion = (solicitante, folio, monto, proveedor) => `
  <p>Hola <strong>${solicitante}</strong>,</p>
  <p>Tu solicitud de compra ha sido enviada a <strong>autorización</strong> porque supera el límite de $50,000 MXN.</p>

  <div class="status-transition">
    <span class="status-badge" style="background: #dbeafe; color: #1e40af;">⏳ Pendiente</span>
    <div class="arrow">→</div>
    <span class="status-badge" style="background: #f3e8ff; color: #6b21a8;">🔐 En Autorización</span>
  </div>

  <div class="info-box">
    <strong>Folio:</strong> #${folio}<br>
    <strong>Proveedor seleccionado:</strong> ${proveedor}<br>
    <strong>Monto:</strong> $${Number(monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN<br>
    <strong>Estatus:</strong> <span class="status-badge" style="background: #f3e8ff; color: #6b21a8;">EN AUTORIZACIÓN</span>
  </div>

  <p>Se ha notificado a los aprobadores correspondientes. En cuanto recibamos una respuesta, te informaremos.</p>

  <center>
    <a href="${FRONTEND_URL}/dashboard/compras" class="button">
      Dar Seguimiento
    </a>
  </center>
`;

/**
 * Plantilla para EN_AUTORIZACION → APROBADO
 */
const templateAprobado = (solicitante, folio, autorizadoPor, monto, proveedor) => `
  <p>Hola <strong>${solicitante}</strong>,</p>
  <p>¡Tu solicitud de compra ha sido <strong>aprobada</strong>!</p>

  <div class="status-transition">
    <span class="status-badge" style="background: #f3e8ff; color: #6b21a8;">🔐 En Autorización</span>
    <div class="arrow">→</div>
    <span class="status-badge" style="background: #d1fae5; color: #065f46;">✅ Aprobado</span>
  </div>

  <div class="info-box">
    <strong>Folio:</strong> #${folio}<br>
    <strong>Proveedor:</strong> ${proveedor}<br>
    <strong>Monto autorizado:</strong> $${Number(monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN<br>
    <strong>Autorizado por:</strong> ${autorizadoPor}<br>
    <strong>Estatus:</strong> <span class="status-badge" style="background: #d1fae5; color: #065f46;">APROBADO</span>
  </div>

  <p>La solicitud está lista para que el proveedor realice la entrega. Te notificaremos cuando se marque como entregada.</p>

  <center>
    <a href="${FRONTEND_URL}/dashboard/compras" class="button">
      Ver Solicitud
    </a>
  </center>
`;

/**
 * Plantilla para APROBADO → ENTREGADO
 */
const templateEntregado = (solicitante, folio, proveedor) => `
  <p>Hola <strong>${solicitante}</strong>,</p>
  <p>¡Tu solicitud de compra ha sido <strong>marcada como entregada</strong>!</p>

  <div class="status-transition">
    <span class="status-badge" style="background: #d1fae5; color: #065f46;">✅ Aprobado</span>
    <div class="arrow">→</div>
    <span class="status-badge" style="background: #d1fae5; color: #065f46;">📦 Entregado</span>
  </div>

  <div class="info-box">
    <strong>Folio:</strong> #${folio}<br>
    <strong>Proveedor:</strong> ${proveedor}<br>
    <strong>Estatus:</strong> <span class="status-badge" style="background: #d1fae5; color: #065f46;">ENTREGADO</span>
  </div>

  <p>Si tienes alguna duda sobre la entrega, contacta al departamento de Compras.</p>

  <center>
    <a href="${FRONTEND_URL}/dashboard/compras" class="button">
      Ver Detalles
    </a>
  </center>
`;

/**
 * Plantilla para cualquier estado → CANCELADO
 */
const templateCancelado = (solicitante, folio, estatusAnterior) => `
  <p>Hola <strong>${solicitante}</strong>,</p>
  <p>Tu solicitud de compra ha sido <strong>cancelada</strong>.</p>

  <div class="status-transition">
    <span class="status-badge" style="background: ${STATUS_CONFIG[estatusAnterior]?.color || '#e5e7eb'}; color: ${STATUS_CONFIG[estatusAnterior]?.textColor || '#374151'};">${STATUS_CONFIG[estatusAnterior]?.emoji || ''} ${STATUS_CONFIG[estatusAnterior]?.label || estatusAnterior}</span>
    <div class="arrow">→</div>
    <span class="status-badge" style="background: #fee2e2; color: #991b1b;">❌ Cancelado</span>
  </div>

  <div class="info-box">
    <strong>Folio:</strong> #${folio}<br>
    <strong>Estatus anterior:</strong> ${estatusAnterior}<br>
    <strong>Estatus actual:</strong> <span class="status-badge" style="background: #fee2e2; color: #991b1b;">CANCELADO</span>
  </div>

  <p>Si crees que esto es un error o necesitas más información, contacta al departamento de Compras.</p>

  <center>
    <a href="${FRONTEND_URL}/dashboard/compras" class="button">
      Ver Detalles
    </a>
  </center>
`;

/**
 * Plantilla genérica para otros cambios de estado
 */
const templateGenerico = (solicitante, folio, previousStatus, newStatus) => {
  const prevConfig = STATUS_CONFIG[previousStatus] || { emoji: '', label: previousStatus, color: '#e5e7eb', textColor: '#374151' };
  const newConfig = STATUS_CONFIG[newStatus] || { emoji: '', label: newStatus, color: '#e5e7eb', textColor: '#374151' };

  return `
    <p>Hola <strong>${solicitante}</strong>,</p>
    <p>El estado de tu solicitud de compra ha sido actualizado.</p>

    <div class="status-transition">
      <span class="status-badge" style="background: ${prevConfig.color}; color: ${prevConfig.textColor};">${prevConfig.emoji} ${prevConfig.label}</span>
      <div class="arrow">→</div>
      <span class="status-badge" style="background: ${newConfig.color}; color: ${newConfig.textColor};">${newConfig.emoji} ${newConfig.label}</span>
    </div>

    <div class="info-box">
      <strong>Folio:</strong> #${folio}<br>
      <strong>Estatus anterior:</strong> ${previousStatus}<br>
      <strong>Estatus actual:</strong> <span class="status-badge" style="background: ${newConfig.color}; color: ${newConfig.textColor};">${newStatus}</span>
    </div>

    <center>
      <a href="${FRONTEND_URL}/dashboard/compras" class="button">
        Ver Solicitud
      </a>
    </center>
  `;
};

// ─────────────────────────────────────────────────────────────
// Mapa de plantillas por transición de estado
// ─────────────────────────────────────────────────────────────
const getTemplate = (previousStatus, newStatus, data) => {
  const { solicitante, folio, items, quotes, monto, proveedor, autorizadoPor } = data;

  const transition = `${previousStatus}→${newStatus}`;

  switch (transition) {
    case 'NUEVO→PENDIENTE':
      return templatePendiente(solicitante, folio, items, quotes);
    case 'PENDIENTE→EN_AUTORIZACION':
      return templateEnAutorizacion(solicitante, folio, monto, proveedor);
    case 'EN_AUTORIZACION→APROBADO':
      return templateAprobado(solicitante, folio, autorizadoPor, monto, proveedor);
    case 'APROBADO→ENTREGADO':
      return templateEntregado(solicitante, folio, proveedor);
    default:
      // Cancelación desde cualquier estado
      if (newStatus === 'CANCELADO') {
        return templateCancelado(solicitante, folio, previousStatus);
      }
      // Cualquier otra transición
      return templateGenerico(solicitante, folio, previousStatus, newStatus);
  }
};

// ─────────────────────────────────────────────────────────────
// Obtener asunto del email según el nuevo estado
// ─────────────────────────────────────────────────────────────
const getSubject = (newStatus, folio) => {
  const config = STATUS_CONFIG[newStatus];
  if (!config) return `🔄 Solicitud #${folio} - Cambio de Estado`;

  switch (newStatus) {
    case 'PENDIENTE':
      return `⏳ Solicitud #${folio} - Cotizaciones Recibidas`;
    case 'EN_AUTORIZACION':
      return `🔐 Solicitud #${folio} - Requiere Autorización`;
    case 'APROBADO':
      return `✅ Solicitud #${folio} - Aprobada`;
    case 'ENTREGADO':
      return `📦 Solicitud #${folio} - Entregada`;
    case 'CANCELADO':
      return `❌ Solicitud #${folio} - Cancelada`;
    default:
      return `🔄 Solicitud #${folio} - ${config.label}`;
  }
};

// ─────────────────────────────────────────────────────────────
// Función principal: notificar cambio de estado
// ─────────────────────────────────────────────────────────────
exports.notifyStatusChange = async (purchaseRequestId, previousStatus, newStatus) => {
  // Validar que el estado realmente cambió
  if (previousStatus === newStatus) {
    console.log(`⚠️ StatusNotification: Sin cambio de estado (${previousStatus} → ${newStatus}) para solicitud ${purchaseRequestId}. Omitiendo notificación.`);
    return { sent: false, reason: 'Sin cambio de estado' };
  }

  try {
    // Obtener datos de la solicitud con relaciones
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: purchaseRequestId },
      include: {
        solicitante: {
          select: {
            nombre: true,
            correoElectronico: true,
            user: { select: { email: true } }
          }
        },
        items: {
          select: { productoServicio: true, cantidad: true }
        },
        quotes: {
          where: { isSelected: true },
          select: { proveedor: true, monto: true }
        },
        autorizadoPor: {
          select: { nombre: true }
        }
      }
    });

    if (!request) {
      console.error(`❌ StatusNotification: Solicitud ${purchaseRequestId} no encontrada`);
      return { sent: false, reason: 'Solicitud no encontrada' };
    }

    // Obtener email del solicitante
    const solicitanteEmail = request.solicitante?.user?.email || request.solicitante?.correoElectronico;
    const solicitanteNombre = request.solicitante?.nombre || 'Solicitante';

    if (!solicitanteEmail) {
      console.warn(`⚠️ StatusNotification: Solicitante sin email para solicitud ${purchaseRequestId}`);
      return { sent: false, reason: 'Solicitante sin email' };
    }

    // Preparar datos para la plantilla
    const templateData = {
      solicitante: solicitanteNombre,
      folio: request.folio,
      items: request.items || [],
      quotes: request.quotes || [],
      monto: request.quotes?.[0]?.monto || 0,
      proveedor: request.quotes?.[0]?.proveedor || 'N/A',
      autorizadoPor: request.autorizadoPor?.nombre || 'N/A'
    };

    // Generar contenido HTML
    const title = STATUS_CONFIG[newStatus]?.title || `Cambio de Estado: ${newStatus}`;
    const content = getTemplate(previousStatus, newStatus, templateData);
    const html = emailLayout(title, content);
    const subject = getSubject(newStatus, request.folio);

    // Enviar email (asíncrono, no bloqueante)
    const sent = await emailService.sendEmail(solicitanteEmail, subject, html);

    if (sent) {
      console.log(`✅ StatusNotification: Email enviado a ${solicitanteEmail} para solicitud #${request.folio} (${previousStatus} → ${newStatus})`);
    } else {
      console.warn(`⚠️ StatusNotification: Falló envío a ${solicitanteEmail} para solicitud #${request.folio}`);
    }

    return { sent, email: solicitanteEmail, folio: request.folio };
  } catch (error) {
    // Nunca lanzar error para no afectar el flujo principal
    console.error(`❌ StatusNotification: Error al notificar cambio de estado para solicitud ${purchaseRequestId}:`, error.message);
    return { sent: false, reason: error.message };
  }
};

// ─────────────────────────────────────────────────────────────
// Versión fire-and-forget (no await, no afecta flujo principal)
// ─────────────────────────────────────────────────────────────
exports.notifyStatusChangeAsync = (purchaseRequestId, previousStatus, newStatus) => {
  // Ejecutar en segundo plano sin await
  exports.notifyStatusChange(purchaseRequestId, previousStatus, newStatus)
    .then(result => {
      if (!result.sent) {
        console.warn(`⚠️ StatusNotification (async): No se pudo notificar - ${result.reason}`);
      }
    })
    .catch(err => {
      console.error(`❌ StatusNotification (async): Error no capturado:`, err.message);
    });
};
