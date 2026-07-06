const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('../services/email.service');

const VACANCY_STATUS = {
  SOLICITADA: 'Solicitada',
  APROBADA: 'Aprobada',
  BUSCANDO: 'Buscando',
  CERRADA: 'Cerrada'
};

const CANDIDATE_STATUS = {
  EN_REVISION: 'En_Revision',
  DESCARTADO: 'Descartado',
  SELECCIONADO: 'Seleccionado'
};

const buildFileUrl = (req, filePath) => {
  if (!filePath) return null;
  if (process.env.BASE_URL) return process.env.BASE_URL + filePath;
  return req.protocol + '://' + req.get('host') + filePath;
};

const deleteFileFromDisk = (filePath) => {
  if (!filePath) return;
  const path = require('path');
  const a = path.join(__dirname, '../..', filePath);
  try {
    if (require('fs').existsSync(a)) {
      require('fs').unlinkSync(a);
    }
  } catch (err) {
    console.warn('deleteFileFromDisk warn:', err.message);
  }
};
// CANDIDATOS
// ============================================================

// Crear nuevo candidato con CV y Pruebas Psicométricas (para ADMIN, SISTEMAS, RH)
exports.createCandidate = async (req, res) => {
  try {
    const { vacancy_id } = req.params;
    const { nombre, comentarios_rh } = req.body;
    const cvFile = req.files?.cv?.[0];
    const psychTestFile = req.files?.psychTest?.[0];

    // Verificar que la vacante existe y está en estado BUSCANDO
    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id: vacancy_id }
    });

    if (!vacancy) {
      return res.status(404).json({ error: 'Vacante no encontrada' });
    }

    if (vacancy.estatus !== VACANCY_STATUS.BUSCANDO) {
      return res.status(400).json({ 
        error: 'La vacante debe estar en estado "Buscando" para registrar candidatos' 
      });
    }

    // Validar que el CV sea obligatorio
    if (!cvFile) {
      return res.status(400).json({ error: 'El CV es obligatorio' });
    }

    // Validar que el CV sea PDF
    if (cvFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'El CV debe ser un archivo PDF' });
    }

    // Validar pruebas psicométricas si se proporcionan
    if (psychTestFile && psychTestFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Las pruebas psicométricas deben ser un archivo PDF' });
    }

    // El middleware uploadCV ya guardó los archivos en disco con nombres únicos
    // Solo necesitamos construir las URLs relativas
    const cv_url = `/uploads/cvs/${cvFile.filename}`;
    
    // Procesar pruebas psicométricas si se proporcionaron
    let psych_test_url = null;
    if (psychTestFile) {
      psych_test_url = `/uploads/psych-tests/${psychTestFile.filename}`;
    }

    // Crear el candidato
    const candidate = await prisma.candidateRH.create({
      data: {
        vacancy_id,
        nombre,
        cv_url,
        psych_test_url,
        comentarios_rh: comentarios_rh || null,
        estatus: CANDIDATE_STATUS.EN_REVISION
      }
    });

    // Crear comentario automático
    await prisma.vacancyComment.create({
      data: {
        vacancy_id,
        user_id: req.user.id,
        mensaje: `👤 Candidato "${nombre}" registrado por RH. CV y pruebas psicométricas adjuntas.`
      }
    });

    // Notificar al solicitante que hay un nuevo candidato para revisar
    try {
      const fullVacancy = await prisma.jobVacancy.findUnique({
        where: { id: vacancy_id },
        include: {
          solicitante: {
            include: {
              user: { select: { email: true, name: true } }
            }
          }
        }
      });
      const solicitanteEmail = fullVacancy?.solicitante?.user?.email;
      const solicitanteNombre = fullVacancy?.solicitante?.user?.name || 'Solicitante';
      if (solicitanteEmail) {
        emailService.sendCandidateReviewRequest(solicitanteEmail, solicitanteNombre, fullVacancy, nombre);
      }
    } catch (emailErr) {
      console.warn('⚠️ Error al enviar notificación de nuevo candidato:', emailErr.message);
    }

    res.status(201).json({
      message: 'Candidato registrado exitosamente con CV y pruebas psicométricas',
      candidate
    });
  } catch (error) {
    // Si falla la creación, limpiar los archivos subidos
    if (cvFile) deleteFileFromDisk(`/uploads/cvs/${cvFile.filename}`);
    if (psychTestFile) deleteFileFromDisk(`/uploads/psych-tests/${psychTestFile.filename}`);
    console.error('Error creating candidate:', error);
    res.status(500).json({ error: 'Error al registrar el candidato' });
  }
};

// Actualizar observaciones de RH en candidato (para ADMIN, SISTEMAS, RH)
exports.updateCandidateObservations = async (req, res) => {
  try {
    const { candidate_id } = req.params;
    const { comentarios_rh } = req.body;

    const candidate = await prisma.candidateRH.update({
      where: { id: candidate_id },
      data: {
        comentarios_rh: comentarios_rh || null
      }
    });

    res.json({
      message: 'Observaciones actualizadas exitosamente',
      candidate
    });
  } catch (error) {
    console.error('Error updating candidate observations:', error);
    res.status(500).json({ error: 'Error al actualizar observaciones' });
  }
};

// Marcar visto bueno del solicitante (pulgar arriba/abajo)
exports.updateCandidateVote = async (req, res) => {
  try {
    const { candidate_id } = req.params;
    const { vote } = req.body; // 'like' o 'dislike'
    const userId = req.user.id;

    // Verificar que el usuario sea el solicitante de la vacante
    const candidate = await prisma.candidateRH.findUnique({
      where: { id: candidate_id },
      include: {
        vacancy: {
          include: {
            solicitante: true
          }
        }
      }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidato no encontrado' });
    }

    // Si es reset, permitir a usuarios con acceso a RECLUTAMIENTO sin validar solicitante
    if (vote === 'reset') {
      if (!req.user.accessibleModules?.includes('RECLUTAMIENTO')) {
        return res.status(403).json({ 
          error: 'No tienes permiso para devolver candidatos a revisión' 
        });
      }
    } else {
      // Para like/dislike, validar que sea el solicitante
      const employee = await prisma.employee.findUnique({
        where: { userId }
      });

      if (!employee || candidate.vacancy.solicitanteId !== employee.id) {
        return res.status(403).json({ 
          error: 'Solo el solicitante de la vacante puede votar por candidatos' 
        });
      }
    }

    // Actualizar el estatus basado en el voto
    let newStatus = candidate.estatus;
    if (vote === 'like') {
      newStatus = CANDIDATE_STATUS.SELECCIONADO;
    } else if (vote === 'dislike') {
      newStatus = CANDIDATE_STATUS.DESCARTADO;
    } else if (vote === 'reset') {
      newStatus = CANDIDATE_STATUS.EN_REVISION;
    }

    const updatedCandidate = await prisma.candidateRH.update({
      where: { id: candidate_id },
      data: {
        estatus: newStatus
      }
    });

    // Crear comentario automático
    let voteText = '';
    if (vote === 'like') {
      voteText = '👍 Visto bueno';
    } else if (vote === 'dislike') {
      voteText = '👎 No seleccionado';
    } else if (vote === 'reset') {
      voteText = '🔄 Devuelto a revisión';
    }
    await prisma.vacancyComment.create({
      data: {
        vacancy_id: candidate.vacancy_id,
        user_id: userId,
        mensaje: `${voteText} para el candidato "${candidate.nombre}" por ${vote === 'reset' ? 'RH' : 'el solicitante'}.`
      }
    });

    // Notificar a RH del voto (solo si no es reset)
    if (vote !== 'reset') {
      try {
        const rhUsers = await prisma.user.findMany({
          where: { role: { in: ['RH', 'ADMIN'] } },
          select: { email: true, name: true }
        });
        for (const rhUser of rhUsers) {
          emailService.sendCandidateVoted(
            rhUser.email,
            rhUser.name,
            candidate.vacancy,
            candidate.nombre,
            vote
          );
        }
      } catch (emailErr) {
        console.warn('⚠️ Error al enviar notificación de voto:', emailErr.message);
      }
    }

    res.json({
      message: vote === 'reset' ? 'Candidato devuelto a revisión' : 'Voto registrado exitosamente',
      candidate: updatedCandidate
    });
  } catch (error) {
    console.error('Error updating candidate vote:', error);
    res.status(500).json({ error: 'Error al registrar el voto' });
  }
};

// Seleccionar candidato final y cerrar vacante (para jefes de área)
exports.selectCandidate = async (req, res) => {
  try {
    const { candidate_id } = req.params;
    const userId = req.user.id;

    // Verificar que el candidato existe
    const candidate = await prisma.candidateRH.findUnique({
      where: { id: candidate_id },
      include: {
        vacancy: {
          include: {
            solicitante: true
          }
        }
      }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidato no encontrado' });
    }

    // Verificar que el usuario sea el solicitante de la vacante
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee || candidate.vacancy.solicitanteId !== employee.id) {
      return res.status(403).json({ 
        error: 'Solo el solicitante de la vacante puede seleccionar el candidato final' 
      });
    }

    // Marcar al candidato como seleccionado
    const updatedCandidate = await prisma.candidateRH.update({
      where: { id: candidate_id },
      data: {
        estatus: CANDIDATE_STATUS.SELECCIONADO
      }
    });

    // Cerrar la vacante
    const closedVacancy = await prisma.jobVacancy.update({
      where: { id: candidate.vacancy_id },
      data: {
        estatus: VACANCY_STATUS.CERRADA,
        closedAt: new Date()
      }
    });

    // Crear comentario automático
    await prisma.vacancyComment.create({
      data: {
        vacancy_id: candidate.vacancy_id,
        user_id: userId,
        mensaje: `🎯 Candidato "${candidate.nombre}" seleccionado como final. La vacante ha sido cerrada.`
      }
    });

    // Notificar a RH que se seleccionó candidato final
    try {
      const rhUsers = await prisma.user.findMany({
        where: { role: { in: ['RH', 'ADMIN'] } },
        select: { email: true, name: true }
      });
      for (const rhUser of rhUsers) {
        emailService.sendCandidateSelected(
          rhUser.email,
          rhUser.name,
          candidate.vacancy,
          candidate.nombre
        );
      }
    } catch (emailErr) {
      console.warn('⚠️ Error al enviar notificación de selección:', emailErr.message);
    }

    res.json({
      message: 'Candidato seleccionado y vacante cerrada exitosamente',
      candidate: updatedCandidate,
      vacancy: closedVacancy
    });
  } catch (error) {
    console.error('Error selecting candidate:', error);
    res.status(500).json({ error: 'Error al seleccionar el candidato' });
  }
};

// Descargar CV de candidato
exports.downloadCandidateCV = async (req, res) => {
  try {
    const { candidate_id } = req.params;

    const candidate = await prisma.candidateRH.findUnique({
      where: { id: candidate_id }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidato no encontrado' });
    }

    if (!candidate.cv_url) {
      return res.status(404).json({ error: 'El candidato no tiene CV adjunto' });
    }

    const fs = require('fs');
    const path = require('path');
    const cvPath = path.join(__dirname, '../..', candidate.cv_url);

    if (!fs.existsSync(cvPath)) {
      return res.status(404).json({ error: 'Archivo de CV no encontrado en el servidor' });
    }

    res.download(cvPath);
  } catch (error) {
    console.error('Error downloading CV:', error);
    res.status(500).json({ error: 'Error al descargar el CV' });
  }
};

// ============================================================
// FUNCIONES MIGRADAS DESDE vacancy.controller.js
// ============================================================

// Actualizar actividad (completar/descompletar)
exports.updateActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { isCompleted } = req.body;

    const activity = await prisma.jobActivity.update({
      where: { id: activityId },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      }
    });

    res.json({
      message: 'Actividad actualizada exitosamente',
      activity
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Error al actualizar la actividad' });
  }
};

// Obtener departamentos y puestos para formulario de vacante
exports.getVacancyFormData = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      where: { estado: 'Activo' },
      include: {
        jobPositions: {
          where: { estado: 'Activo' },
          select: {
            id: true,
            nombre: true,
            nivelJerarquico: true,
            descripcion: true
          },
          orderBy: { nombre: 'asc' }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Error getting vacancy form data:', error);
    res.status(500).json({ success: false, error: 'Error al obtener datos para el formulario de vacante' });
  }
};

// Actualizar documentos de un candidato (CV y/o pruebas psicométricas)
exports.updateCandidateDocuments = async (req, res) => {
  try {
    const { candidate_id } = req.params;
    const cvFile = req.files?.cv?.[0];
    const psychTestFile = req.files?.psychTest?.[0];

    // Verificar que el candidato existe
    const candidate = await prisma.candidateRH.findUnique({
      where: { id: candidate_id }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidato no encontrado' });
    }

    // Validar que al menos un archivo se haya subido
    if (!cvFile && !psychTestFile) {
      return res.status(400).json({ error: 'Debe subir al menos un archivo (CV o pruebas psicométricas)' });
    }

    // Validar que los archivos sean PDF
    if (cvFile && cvFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'El CV debe ser un archivo PDF' });
    }
    if (psychTestFile && psychTestFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Las pruebas psicométricas deben ser un archivo PDF' });
    }

    // Preparar datos de actualización
    const updateData = {};

    if (cvFile) {
      // Eliminar CV anterior del disco
      deleteFileFromDisk(candidate.cv_url);
      updateData.cv_url = `/uploads/cvs/${cvFile.filename}`;
    }

    if (psychTestFile) {
      // Eliminar prueba anterior del disco
      deleteFileFromDisk(candidate.psych_test_url);
      updateData.psych_test_url = `/uploads/psych-tests/${psychTestFile.filename}`;
    }

    // Actualizar el candidato
    const updatedCandidate = await prisma.candidateRH.update({
      where: { id: candidate_id },
      data: updateData
    });

    // Crear comentario automático
    let mensajeDocs = '📎 Documentos actualizados:';
    if (cvFile) mensajeDocs += ' CV reemplazado';
    if (cvFile && psychTestFile) mensajeDocs += ' y';
    if (psychTestFile) mensajeDocs += ' pruebas psicométricas actualizadas';
    mensajeDocs += `.`;

    await prisma.vacancyComment.create({
      data: {
        vacancy_id: candidate.vacancy_id,
        user_id: req.user.id,
        mensaje: mensajeDocs
      }
    });

    res.json({
      message: 'Documentos del candidato actualizados exitosamente',
      candidate: updatedCandidate
    });
  } catch (error) {
    // Si falla, limpiar archivos recién subidos
    if (cvFile) deleteFileFromDisk(`/uploads/cvs/${cvFile.filename}`);
    if (psychTestFile) deleteFileFromDisk(`/uploads/psych-tests/${psychTestFile.filename}`);
    console.error('Error updating candidate documents:', error);
    res.status(500).json({ error: 'Error al actualizar los documentos del candidato' });
  }
};
