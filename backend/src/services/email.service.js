const { Resend } = require('resend');

// Inicializar Resend solo si hay API key configurada
let resend = null;
try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend email service initialized');
  } else {
    console.warn('⚠️ RESEND_API_KEY no configurada. Los emails no se enviarán.');
  }
} catch (err) {
  console.warn('⚠️ Error al inicializar Resend:', err.message);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@pid.kramhub.site';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.SERVICE_FQDN_FRONTEND 
  ? `https://${process.env.SERVICE_FQDN_FRONTEND}` 
  : 'http://localhost:3000';

/**
 * Enviar email usando Resend
 * @param {string} to - Destinatario
 * @param {string} subject - Asunto
 * @param {string} html - Contenido HTML
 * @returns {Promise<boolean>} - true si se envió correctamente
 */
const sendEmail = async (to, subject, html) => {
  if (!resend) {
    console.warn(`⚠️ Email no enviado a ${to}: Resend no configurado`);
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `ERP KRAM <${FROM_EMAIL}>`,
      to,
      subject,
      html
    });

    if (error) {
      console.error(`❌ Error al enviar email a ${to}:`, error);
      return false;
    }

    console.log(`✅ Email enviado a ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error(`❌ Error al enviar email a ${to}:`, err.message);
    return false;
  }
};

// ============================================================
// PLANTILLAS DE EMAIL
// ============================================================

/**
 * Plantilla base con estilos del ERP
 */
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
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-solicitada { background: #fef3c7; color: #92400e; }
    .status-aprobada { background: #dbeafe; color: #1e40af; }
    .status-buscando { background: #d1fae5; color: #065f46; }
    .status-cerrada { background: #e5e7eb; color: #374151; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ERP KRAM</h1>
      <p>Sistema de Gestión Empresarial</p>
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

/**
 * Notificar al solicitante que su vacante fue aprobada
 */
exports.sendVacancyApproved = async (email, nombreSolicitante, vacancy) => {
  const title = '✅ Solicitud de Vacante Aprobada';
  const content = `
    <p>Hola <strong>${nombreSolicitante}</strong>,</p>
    <p>Tu solicitud de vacante ha sido <strong>aprobada</strong> por RH.</p>
    
    <div class="info-box">
      <strong>Vacante:</strong> ${vacancy.titulo}<br>
      <strong>Departamento:</strong> ${vacancy.departamento?.nombre || 'N/A'}<br>
      <strong>Estatus:</strong> <span class="status-badge status-aprobada">Aprobada</span>
    </div>

    <p>Ahora debes <strong>definir las actividades del puesto</strong> para que RH pueda iniciar la búsqueda de candidatos.</p>
    
    <center>
      <a href="${FRONTEND_URL}/reclutamiento/vacantes/${vacancy.id}" class="button">
        Ver Vacante
      </a>
    </center>
  `;

  return sendEmail(email, title, emailLayout(title, content));
};

/**
 * Notificar al solicitante que su vacante fue creada (flujo directo)
 */
exports.sendVacancyDirectCreated = async (email, nombreSolicitante, vacancy) => {
  const title = '🚀 Vacante Creada - Flujo Directo';
  const content = `
    <p>Hola <strong>${nombreSolicitante}</strong>,</p>
    <p>Se ha creado una nueva vacante mediante <strong>Flujo Directo</strong> (pre-aprobada por Dirección).</p>
    
    <div class="info-box">
      <strong>Vacante:</strong> ${vacancy.titulo}<br>
      <strong>Departamento:</strong> ${vacancy.departamento?.nombre || 'N/A'}<br>
      <strong>Estatus:</strong> <span class="status-badge status-aprobada">Aprobada</span>
    </div>

    <p>La vacante está lista para búsqueda inmediata de candidatos.</p>
    
    <center>
      <a href="${FRONTEND_URL}/reclutamiento/vacantes/${vacancy.id}" class="button">
        Ver Vacante
      </a>
    </center>
  `;

  return sendEmail(email, title, emailLayout(title, content));
};

/**
 * Notificar que se registró un nuevo candidato
 */
exports.sendNewCandidateRegistered = async (email, nombreReceptor, vacancy, candidateName) => {
  const title = '👤 Nuevo Candidato Registrado';
  const content = `
    <p>Hola <strong>${nombreReceptor}</strong>,</p>
    <p>Se ha registrado un nuevo candidato para la vacante:</p>
    
    <div class="info-box">
      <strong>Vacante:</strong> ${vacancy.titulo}<br>
      <strong>Candidato:</strong> ${candidateName}<br>
      <strong>Estatus:</strong> <span class="status-badge status-solicitada">En Revisión</span>
    </div>

    <p>Puedes revisar el CV y las pruebas psicométricas del candidato en el sistema.</p>
    
    <center>
      <a href="${FRONTEND_URL}/reclutamiento/vacantes/${vacancy.id}" class="button">
        Ver Candidato
      </a>
    </center>
  `;

  return sendEmail(email, title, emailLayout(title, content));
};

/**
 * Notificar al solicitante que un candidato requiere su revisión
 */
exports.sendCandidateReviewRequest = async (email, nombreSolicitante, vacancy, candidateName) => {
  const title = '👁️ Revisión de Candidato Solicitada';
  const content = `
    <p>Hola <strong>${nombreSolicitante}</strong>,</p>
    <p>RH ha registrado un candidato para tu vacante y requiere tu revisión:</p>
    
    <div class="info-box">
      <strong>Vacante:</strong> ${vacancy.titulo}<br>
      <strong>Candidato:</strong> ${candidateName}<br>
      <strong>Acción requerida:</strong> Revisar CV y dar visto bueno
    </div>

    <p>Por favor ingresa al sistema para revisar el perfil del candidato y emitir tu voto.</p>
    
    <center>
      <a href="${FRONTEND_URL}/reclutamiento/vacantes/${vacancy.id}" class="button">
        Revisar Candidato
      </a>
    </center>
  `;

  return sendEmail(email, title, emailLayout(title, content));
};

/**
 * Notificar que un candidato fue seleccionado
 */
exports.sendCandidateSelected = async (email, nombreReceptor, vacancy, candidateName) => {
  const title = '🎯 Candidato Seleccionado';
  const content = `
    <p>Hola <strong>${nombreReceptor}</strong>,</p>
    <p>El candidato <strong>${candidateName}</strong> ha sido seleccionado para la vacante:</p>
    
    <div class="info-box">
      <strong>Vacante:</strong> ${vacancy.titulo}<br>
      <strong>Candidato:</strong> ${candidateName}<br>
      <strong>Estatus:</strong> <span class="status-badge status-cerrada">Vacante Cerrada</span>
    </div>

    <p>La vacante ha sido cerrada exitosamente.</p>
    
    <center>
      <a href="${FRONTEND_URL}/reclutamiento/vacantes/${vacancy.id}" class="button">
        Ver Detalles
      </a>
    </center>
  `;

  return sendEmail(email, title, emailLayout(title, content));
};

/**
 * Notificar que la vacante fue cerrada
 */
exports.sendVacancyClosed = async (email, nombreReceptor, vacancy) => {
  const title = '🔒 Vacante Cerrada';
  const content = `
    <p>Hola <strong>${nombreReceptor}</strong>,</p>
    <p>La siguiente vacante ha sido cerrada:</p>
    
    <div class="info-box">
      <strong>Vacante:</strong> ${vacancy.titulo}<br>
      <strong>Departamento:</strong> ${vacancy.departamento?.nombre || 'N/A'}<br>
      <strong>Estatus:</strong> <span class="status-badge status-cerrada">Cerrada</span>
    </div>

    <p>Si tienes alguna duda, contacta al departamento de RH.</p>
    
    <center>
      <a href="${FRONTEND_URL}/reclutamiento/vacantes/${vacancy.id}" class="button">
        Ver Detalles
      </a>
    </center>
  `;

  return sendEmail(email, title, emailLayout(title, content));
};

/**
 * Notificar que se requiere aprobación de una vacante
 */
exports.sendVacancyApprovalRequired = async (email, nombreRH, vacancy, solicitanteNombre) => {
  const title = '📋 Nueva Solicitud de Vacante - Requiere Aprobación';
  const content = `
    <p>Hola <strong>${nombreRH}</strong>,</p>
    <p>Se ha recibido una nueva solicitud de vacante que requiere tu aprobación:</p>
    
    <div class="info-box">
      <strong>Vacante:</strong> ${vacancy.titulo}<br>
      <strong>Solicitante:</strong> ${solicitanteNombre}<br>
      <strong>Departamento:</strong> ${vacancy.departamento?.nombre || 'N/A'}<br>
      <strong>Estatus:</strong> <span class="status-badge status-solicitada">Solicitada</span>
    </div>

    <p>Por favor ingresa al sistema para revisar y aprobar la solicitud.</p>
    
    <center>
      <a href="${FRONTEND_URL}/reclutamiento/vacantes/${vacancy.id}" class="button">
        Revisar Solicitud
      </a>
    </center>
  `;

  return sendEmail(email, title, emailLayout(title, content));
};

/**
 * Notificar que se definieron las actividades del puesto
 */
exports.sendActivitiesDefined = async (email, nombreRH, vacancy, solicitanteNombre, numActividades) => {
  const title = '📋 Actividades del Puesto Definidas';
  const content = `
    <p>Hola <strong>${nombreRH}</strong>,</p>
    <p>El solicitante <strong>${solicitanteNombre}</strong> ha definido <strong>${numActividades} actividades</strong> para la vacante:</p>
    
    <div class="info-box">
      <strong>Vacante:</strong> ${vacancy.titulo}<br>
      <strong>Departamento:</strong> ${vacancy.departamento?.nombre || 'N/A'}<br>
      <strong>Actividades definidas:</strong> ${numActividades}
    </div>

    <p>La vacante ahora está lista para iniciar la búsqueda de candidatos.</p>
    
    <center>
      <a href="${FRONTEND_URL}/reclutamiento/vacantes/${vacancy.id}" class="button">
        Ver Vacante
      </a>
    </center>
  `;

  return sendEmail(email, title, emailLayout(title, content));
};

/**
 * Notificar que un candidato recibió visto bueno del solicitante
 */
exports.sendCandidateVoted = async (email, nombreRH, vacancy, candidateName, vote) => {
  const emoji = vote === 'like' ? '👍' : '👎';
  const voteText = vote === 'like' ? 'Visto Bueno' : 'No Seleccionado';
  const title = `${emoji} Candidato: ${voteText}`;
  const content = `
    <p>Hola <strong>${nombreRH}</strong>,</p>
    <p>El solicitante ha emitido su voto para el candidato <strong>${candidateName}</strong>:</p>
    
    <div class="info-box">
      <strong>Vacante:</strong> ${vacancy.titulo}<br>
      <strong>Candidato:</strong> ${candidateName}<br>
      <strong>Voto:</strong> ${vote === 'like' ? '✅ Aprobado' : '❌ Descartado'}
    </div>

    <center>
      <a href="${FRONTEND_URL}/reclutamiento/vacantes/${vacancy.id}" class="button">
        Ver Detalles
      </a>
    </center>
  `;

  return sendEmail(email, title, emailLayout(title, content));
};

/**
 * Enviar felicitación de cumpleaños al empleado
 */
exports.sendBirthdayWish = async (email, employeeName) => {
  const title = '🎂 ¡Feliz Cumpleaños!';
  const content = `
    <p>Hola <strong>${employeeName}</strong>,</p>
    <p>En nombre de todo el equipo de <strong>KRAM</strong>, queremos desearte un <strong>¡Feliz Cumpleaños!</strong></p>
    
    <div style="text-align: center; font-size: 48px; margin: 20px 0;">🎉🎂🎉</div>

    <p>Esperamos que tengas un día maravilloso lleno de alegría y bendiciones. Agradecemos tu dedicación y esfuerzo día con día.</p>
    
    <p style="text-align: center; font-style: italic; color: #1e40af; font-size: 16px;">
      "El éxito es la suma de pequeños esfuerzos repetidos día tras día"
    </p>

    <p>¡Que este nuevo año de vida esté lleno de éxitos y momentos inolvidables!</p>
    
    <p style="text-align: center; font-weight: bold; color: #1e40af;">Atentamente,<br>Dirección de RH - KRAM</p>
  `;

  return sendEmail(email, title, emailLayout(title, content));
};

/**
 * Enviar felicitación de aniversario laboral al empleado
 */
exports.sendAnniversaryWish = async (email, employeeName, antiguedad) => {
  const title = `🎊 ¡${antiguedad} Aniversario en KRAM!`;
  const content = `
    <p>Hola <strong>${employeeName}</strong>,</p>
    <p>Hoy celebras <strong>${antiguedad} años</strong> de formar parte de la familia <strong>KRAM</strong>. ¡Felicidades!</p>
    
    <div style="text-align: center; font-size: 48px; margin: 20px 0;">🎊🏆🎊</div>

    <p>Queremos agradecerte por tu compromiso, lealtad y dedicación durante todos estos años. Tu esfuerzo y profesionalismo han sido fundamentales para el crecimiento de nuestra empresa.</p>
    
    <p>Es un orgullo contar con personas como tú en nuestro equipo. ¡Esperamos seguir compartiendo muchos éxitos más juntos!</p>
    
    <div class="info-box">
      <strong>Fecha de Ingreso:</strong> ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}<br>
      <strong>Antigüedad:</strong> ${antiguedad} años
    </div>

    <p style="text-align: center; font-weight: bold; color: #1e40af;">¡Gracias por ser parte de esta gran familia!</p>
    
    <p style="text-align: center; font-weight: bold; color: #1e40af;">Atentamente,<br>Dirección de RH - KRAM</p>
  `;

  return sendEmail(email, title, emailLayout(title, content));
};

/**
 * Enviar resumen diario a RH con cumpleaños y aniversarios del día
 */
exports.sendDailySummaryToRH = async (email, rhName, birthdayList, anniversaryList) => {
  const hasBirthdays = birthdayList.length > 0;
  const hasAnniversaries = anniversaryList.length > 0;

  if (!hasBirthdays && !hasAnniversaries) return false;

  const title = '📅 Resumen Diario - Cumpleaños y Aniversarios';
  
  let birthdaySection = '';
  if (hasBirthdays) {
    birthdaySection = `
      <h3 style="color: #1e40af; margin-bottom: 8px;">🎂 Cumpleaños del Día</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr style="background: #dbeafe;">
          <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Nombre</th>
          <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Departamento</th>
          <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Puesto</th>
        </tr>
        ${birthdayList.map(emp => `
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${emp.nombreCompleto}</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${emp.departamento || '—'}</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${emp.puesto || '—'}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  let anniversarySection = '';
  if (hasAnniversaries) {
    anniversarySection = `
      <h3 style="color: #1e40af; margin-bottom: 8px;">🎊 Aniversarios del Día</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr style="background: #d1fae5;">
          <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Nombre</th>
          <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Departamento</th>
          <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Años</th>
        </tr>
        ${anniversaryList.map(emp => `
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${emp.nombreCompleto}</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${emp.departamento || '—'}</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${emp.antiguedad} años</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  const content = `
    <p>Hola <strong>${rhName}</strong>,</p>
    <p>A continuación se muestran los eventos del día de hoy:</p>
    ${birthdaySection}
    ${anniversarySection}
    <hr>
    <p style="color: #71717a; font-size: 13px;">
      Puedes consultar más detalles en el módulo de Empleados del sistema ERP.
    </p>
  `;

  return sendEmail(email, title, emailLayout(title, content));
};

/**
 * Notificar a Compras que se creó una nueva solicitud de compra.
 */
exports.sendPurchaseRequestCreated = async (email, nombreCompras, request) => {
  const title = '🛒 Nueva solicitud de compra';
  const content = `
    <p>Hola <strong>${nombreCompras}</strong>,</p>
    <p>Se ha creado una nueva solicitud de compra:</p>

    <div class="info-box">
      <strong>Folio:</strong> #${request.folio}<br>
      <strong>Solicitante:</strong> ${request.solicitante}<br>
      <strong>Departamento:</strong> ${request.departamento}<br>
      <strong>Justificación:</strong> ${request.justificacion || 'Sin justificación'}<br>
      <strong>Estatus:</strong> <span class="status-badge status-solicitada">Nueva</span>
    </div>

    <center>
      <a href="${FRONTEND_URL}/dashboard/compras/${request.id}" class="button">
        Ver Solicitud
      </a>
    </center>
    <p style="color: #71717a; font-size: 13px; text-align: center;">
      O copia este enlace en tu navegador:<br>
      <span style="font-size: 11px;">${FRONTEND_URL}/dashboard/compras/${request.id}</span>
    </p>
  `;

  return sendEmail(email, title, emailLayout(title, content));
};

/**
 * Notificar que se requiere autorización para una compra > $50,000
 * El link apunta a la página pública de autorización (no requiere módulo COMPRAS)
 */
exports.sendPurchaseAuthorizationRequired = async (email, nombreAdmin, request, quote) => {
  const title = '💰 Autorización de Compra Requerida';
  const content = `
    <p>Hola <strong>${nombreAdmin}</strong>,</p>
    <p>Se requiere tu autorización para la siguiente solicitud de compra:</p>
    
    <div class="info-box">
      <strong>Folio:</strong> #${request.folio}<br>
      <strong>Solicitante:</strong> ${request.solicitante}<br>
      <strong>Departamento:</strong> ${request.departamento}<br>
      <strong>Justificación:</strong> ${request.justificacion || 'Sin justificación'}<br>
      <strong>Proveedor seleccionado:</strong> ${quote.proveedor}<br>
      <strong>Monto:</strong> $${Number(quote.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN<br>
      <strong>Comentarios:</strong> ${quote.comentarios}<br>
      <strong>Estatus:</strong> <span class="status-badge status-solicitada">Pendiente de Autorización</span>
    </div>

    <p>Esta compra supera el límite de $50,000 MXN y requiere autorización de Dirección o RH.</p>
    
    <center>
      <a href="${FRONTEND_URL}/autorizar-compra/${request.id}" class="button">
        Revisar y Autorizar Compra
      </a>
    </center>
    <p style="color: #71717a; font-size: 13px; text-align: center;">
      O copia este enlace en tu navegador:<br>
      <span style="font-size: 11px;">${FRONTEND_URL}/autorizar-compra/${request.id}</span>
    </p>
  `;

  return sendEmail(email, title, emailLayout(title, content));
};


/**
 * Notificar al jefe directo que un empleado solicitó vacaciones.
 */
exports.sendVacationRequestToJefe = async (email, jefeName, request) => {
  const title = '🏖️ Nueva solicitud de vacaciones para autorizar';
  const content = `
    <p>Hola <strong>${jefeName}</strong>,</p>
    <p><strong>${request.empleadoNombre}</strong> ha solicitado vacaciones y requiere tu autorización:</p>
    <div class="info-box">
      <strong>Periodo:</strong> ${request.fechaInicio} al ${request.fechaFin} (${request.dias} días)<br>
      <strong>Motivo:</strong> ${request.motivo || 'Sin motivo'}
    </div>
    <center>
      <a href="${FRONTEND_URL}/vacaciones/mis-solicitudes" class="button">Revisar y autorizar</a>
    </center>
  `;
  return sendEmail(email, title, emailLayout(title, content));
};

/**
 * Notificar a RH que una solicitud está lista para su aprobación (autorizada por jefe o sin jefe).
 */
exports.sendVacationPendingRH = async (email, rhName, request) => {
  const title = '🏖️ Solicitud de vacaciones lista para aprobar';
  const content = `
    <p>Hola <strong>${rhName}</strong>,</p>
    <p>La solicitud de vacaciones de <strong>${request.empleadoNombre}</strong> está lista para tu aprobación:</p>
    <div class="info-box">
      <strong>Periodo:</strong> ${request.fechaInicio} al ${request.fechaFin} (${request.dias} días)<br>
      <strong>Motivo:</strong> ${request.motivo || 'Sin motivo'}
    </div>
    <center>
      <a href="${FRONTEND_URL}/rh/vacaciones" class="button">Revisar y aprobar</a>
    </center>
  `;
  return sendEmail(email, title, emailLayout(title, content));
};

/**
 * Notificar al empleado el resultado de su solicitud (aprobada/rechazada).
 */
exports.sendVacationResultToEmployee = async (email, employeeName, request, decision, comentario) => {
  const isApproved = decision === 'APROBADA';
  const title = isApproved ? '✅ Tus vacaciones fueron aprobadas' : '❌ Tu solicitud de vacaciones fue rechazada';
  const content = `
    <p>Hola <strong>${employeeName}</strong>,</p>
    <p>Tu solicitud de vacaciones fue <strong>${isApproved ? 'APROBADA' : 'RECHAZADA'}</strong>:</p>
    <div class="info-box">
      <strong>Periodo:</strong> ${request.fechaInicio} al ${request.fechaFin} (${request.dias} días)<br>
      ${comentario ? `<strong>Comentario:</strong> ${comentario}` : ''}
    </div>
  `;
  return sendEmail(email, title, emailLayout(title, content));
};


// Exportar sendEmail como función pública para otros servicios
exports.sendEmail = sendEmail;

module.exports = exports;
