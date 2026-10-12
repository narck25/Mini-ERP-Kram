/**
 * recruitment-comment-notification.service.js
 * ─────────────────────────────────────────────────────────────
 * Notifica por correo y campanita cuando se agrega un comentario a una
 * vacante — mismo criterio que ticket-notification.service.js /
 * purchase-comment-notification.service.js (notifyNewComment): avisa a
 * "la otra parte", nunca al propio autor. Si comenta el solicitante,
 * avisa a todo RH (mismo destinatario que el resto de las notificaciones
 * de Reclutamiento, p. ej. VACANTE_SOLICITADA); si comenta RH/ADMIN,
 * avisa solo al solicitante de esa vacante.
 * ─────────────────────────────────────────────────────────────
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('./email.service');
const notificationCenter = require('./notification-center.service');

async function getDestinatariosRH() {
  return prisma.user.findMany({
    where: { role: 'RH' },
    select: { id: true, email: true, name: true }
  });
}

exports.notifyNewComment = async (vacancyId, autorUserId) => {
  const vacancy = await prisma.jobVacancy.findUnique({
    where: { id: vacancyId },
    include: {
      solicitante: {
        select: {
          nombre: true,
          user: { select: { id: true, email: true, name: true } }
        }
      }
    }
  });
  if (!vacancy) return;

  const vacancyData = { id: vacancy.id, titulo: vacancy.titulo };
  const esAutorSolicitante = vacancy.solicitante?.user?.id === autorUserId;

  if (esAutorSolicitante) {
    const destinatarios = (await getDestinatariosRH()).filter((d) => d.id !== autorUserId);
    const linkPath = `/reclutamiento/vacantes/${vacancy.id}`;
    await Promise.allSettled(
      destinatarios.map((dest) => emailService.sendVacancyCommentAdded(dest.email, dest.name, vacancyData, linkPath))
    );
    await notificationCenter.notifyMany({
      userIds: destinatarios.map((d) => d.id),
      tipo: 'VACANTE_COMENTARIO',
      titulo: 'Nuevo comentario en una vacante',
      mensaje: vacancy.titulo || '',
      link: linkPath
    }).catch(() => {});
  } else {
    const email = vacancy.solicitante?.user?.email;
    const userId = vacancy.solicitante?.user?.id;
    if (!userId || userId === autorUserId) return;
    const nombre = vacancy.solicitante?.user?.name || vacancy.solicitante?.nombre || 'Solicitante';
    const linkPath = `/reclutamiento/vacantes/${vacancy.id}`;
    if (email) {
      await emailService.sendVacancyCommentAdded(email, nombre, vacancyData, linkPath);
    }
    await notificationCenter.notify({
      userId,
      tipo: 'VACANTE_COMENTARIO',
      titulo: 'Nuevo comentario en tu vacante',
      mensaje: vacancy.titulo || '',
      link: linkPath
    }).catch(() => {});
  }
};
