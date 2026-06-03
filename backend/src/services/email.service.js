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

module.exports = exports;
