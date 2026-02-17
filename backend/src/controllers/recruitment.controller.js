const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Tipos de estatus del flujo colaborativo
const VACANCY_STATUS = {
  SOLICITADA: 'Solicitada',
  APROBADA: 'Aprobada',
  BUSCANDO: 'Buscando',
  CERRADA: 'Cerrada'
};

// Crear nueva solicitud de vacante (para jefes de área y RH)
exports.createVacancyRequest = async (req, res) => {
  try {
    const { titulo, departamento_id, requerimientos_tecnicos } = req.body;
    const userId = req.user.id;

    // Verificar que el usuario tenga permisos (ADMIN, SISTEMAS, RH)
    if (!['ADMIN', 'SISTEMAS', 'RH'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Solo ADMIN, SISTEMAS y RH pueden crear solicitudes de vacantes' });
    }

    let solicitante_id = null;
    
    // Si es jefe de área, buscar el empleado asociado
    if (['SISTEMAS', 'COMPRAS'].includes(req.user.role)) {
      const employee = await prisma.employee.findUnique({
        where: { userId }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Empleado no encontrado. Contacta a RH para asociar tu usuario.' });
      }
      solicitante_id = employee.id;
    } else {
      // Si es RH, buscar un empleado de RH para asociar como solicitante
      const rhEmployee = await prisma.employee.findFirst({
        where: {
          departamento: {
            nombre: 'RH'
          }
        }
      });
      
      if (rhEmployee) {
        solicitante_id = rhEmployee.id;
      } else {
        // Si no hay empleado de RH, crear uno temporal
        const newRhEmployee = await prisma.employee.create({
          data: {
            nombre: 'RH - Sistema',
            rfc: 'RH000000000',
            curp: 'RH00000000000000',
            nss: '00000000000',
            fecha_ingreso: new Date(),
            estatus: 'Activo',
            puesto: 'Recursos Humanos',
            departamento_id: '3' // ID del departamento RH
          }
        });
        solicitante_id = newRhEmployee.id;
      }
    }

    // Verificar que el departamento existe
    const department = await prisma.department.findUnique({
      where: { id: departamento_id }
    });

    if (!department) {
      return res.status(404).json({ error: 'Departamento no encontrado' });
    }

    // Si RH crea la vacante, automáticamente se aprueba
    const estatus = ['RH', 'ADMIN'].includes(req.user.role) ? VACANCY_STATUS.APROBADA : VACANCY_STATUS.SOLICITADA;

    // Crear la solicitud de vacante
    const vacancy = await prisma.jobVacancyRH.create({
      data: {
        titulo,
        departamento_id,
        solicitante_id,
        requerimientos_tecnicos: requerimientos_tecnicos || [],
        estatus
      },
      include: {
        departamento: true,
        solicitante: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Si RH crea la vacante, crear comentario automático de aprobación
    if (['RH', 'ADMIN'].includes(req.user.role)) {
      await prisma.vacancyComment.create({
        data: {
          vacancy_id: vacancy.id,
          user_id: userId,
          mensaje: `✅ Vacante creada y aprobada automáticamente por RH.`
        }
      });
    }

    res.status(201).json({
      message: 'Solicitud de vacante creada exitosamente',
      vacancy
    });
  } catch (error) {
    console.error('Error creating vacancy request:', error);
    res.status(500).json({ error: 'Error al crear la solicitud de vacante' });
  }
};

// Obtener mis solicitudes (para jefes de área)
exports.getMyVacancyRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar el empleado asociado al usuario
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      return res.json({ vacancies: [] });
    }

    const vacancies = await prisma.jobVacancyRH.findMany({
      where: { solicitante_id: employee.id },
      include: {
        departamento: true,
        solicitante: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            comments: true,
            candidatesRH: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ vacancies });
  } catch (error) {
    console.error('Error getting vacancy requests:', error);
    res.status(500).json({ error: 'Error al obtener las solicitudes de vacantes' });
  }
};

// Obtener todas las solicitudes (para ADMIN, SISTEMAS, RH)
exports.getAllVacancyRequests = async (req, res) => {
  try {
    // Verificar que el usuario tenga permisos
    if (!['ADMIN', 'SISTEMAS', 'RH'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado. Solo ADMIN, SISTEMAS y RH pueden ver todas las solicitudes' });
    }

    const { estatus, departamento_id } = req.query;
    
    const where = {};
    if (estatus) where.estatus = estatus;
    if (departamento_id) where.departamento_id = departamento_id;

    const vacancies = await prisma.jobVacancyRH.findMany({
      where,
      include: {
        departamento: true,
        solicitante: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            comments: true,
            candidatesRH: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ vacancies });
  } catch (error) {
    console.error('Error getting all vacancy requests:', error);
    res.status(500).json({ error: 'Error al obtener las solicitudes de vacantes' });
  }
};

// Aprobar solicitud de vacante (para ADMIN, SISTEMAS, RH)
exports.approveVacancyRequest = async (req, res) => {
  try {
    // Verificar que el usuario tenga permisos
    if (!['ADMIN', 'SISTEMAS', 'RH'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Solo ADMIN, SISTEMAS y RH pueden aprobar solicitudes de vacantes' });
    }

    const { id } = req.params;

    const vacancy = await prisma.jobVacancyRH.update({
      where: { id },
      data: {
        estatus: VACANCY_STATUS.APROBADA
      },
      include: {
        departamento: true,
        solicitante: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Crear comentario automático de aprobación
    await prisma.vacancyComment.create({
      data: {
        vacancy_id: id,
        user_id: req.user.id,
        mensaje: `✅ Solicitud aprobada por RH. El jefe de área puede ahora definir el perfil técnico y actividades.`
      }
    });

    res.json({
      message: 'Solicitud de vacante aprobada exitosamente',
      vacancy
    });
  } catch (error) {
    console.error('Error approving vacancy request:', error);
    res.status(500).json({ error: 'Error al aprobar la solicitud de vacante' });
  }
};

// Actualizar perfil técnico y actividades (para ADMIN, SISTEMAS, RH y jefes de área)
exports.updateTechnicalProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { actividades, perfil_tecnico_detallado } = req.body;
    const userId = req.user.id;

    // Verificar que el usuario tenga permisos
    if (!['ADMIN', 'SISTEMAS', 'RH', 'COMPRAS'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Solo ADMIN, SISTEMAS, RH y jefes de área pueden actualizar el perfil técnico' });
    }

    // Verificar que la vacante existe y está aprobada
    const vacancy = await prisma.jobVacancyRH.findUnique({
      where: { id }
    });

    if (!vacancy) {
      return res.status(404).json({ error: 'Solicitud de vacante no encontrada' });
    }

    if (vacancy.estatus !== VACANCY_STATUS.APROBADA) {
      return res.status(400).json({ 
        error: 'La solicitud debe estar aprobada por RH antes de definir el perfil técnico' 
      });
    }

    // Actualizar la vacante con el perfil técnico detallado
    const updatedVacancy = await prisma.jobVacancyRH.update({
      where: { id },
      data: {
        requerimientos_tecnicos: perfil_tecnico_detallado || vacancy.requerimientos_tecnicos,
        estatus: VACANCY_STATUS.BUSCANDO // Cambiar a estado de búsqueda
      },
      include: {
        departamento: true,
        solicitante: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Crear comentario automático
    await prisma.vacancyComment.create({
      data: {
        vacancy_id: id,
        user_id: userId,
        mensaje: `📋 Perfil técnico y actividades definidas por el jefe de área. La vacante ahora está en estado "Buscando".`
      }
    });

    res.json({
      message: 'Perfil técnico actualizado exitosamente. La vacante ahora está en búsqueda.',
      vacancy: updatedVacancy
    });
  } catch (error) {
    console.error('Error updating technical profile:', error);
    res.status(500).json({ error: 'Error al actualizar el perfil técnico' });
  }
};

// Obtener detalles de una solicitud de vacante
exports.getVacancyRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const vacancy = await prisma.jobVacancyRH.findUnique({
      where: { id },
      include: {
        departamento: true,
        solicitante: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        candidatesRH: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!vacancy) {
      return res.status(404).json({ error: 'Solicitud de vacante no encontrada' });
    }

    res.json({ vacancy });
  } catch (error) {
    console.error('Error getting vacancy request:', error);
    res.status(500).json({ error: 'Error al obtener la solicitud de vacante' });
  }
};

// Agregar comentario a una solicitud de vacante
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { mensaje } = req.body;
    const userId = req.user.id;

    if (!mensaje || mensaje.trim() === '') {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    // Verificar que la vacante existe
    const vacancy = await prisma.jobVacancyRH.findUnique({
      where: { id }
    });

    if (!vacancy) {
      return res.status(404).json({ error: 'Solicitud de vacante no encontrada' });
    }

    // Verificar permisos: jefes de área solo pueden comentar en sus propias solicitudes
    if (['SISTEMAS', 'COMPRAS'].includes(req.user.role)) {
      const employee = await prisma.employee.findUnique({
        where: { userId }
      });

      if (!employee || vacancy.solicitante_id !== employee.id) {
        return res.status(403).json({ error: 'Solo puedes comentar en tus propias solicitudes' });
      }
    }

    const comment = await prisma.vacancyComment.create({
      data: {
        vacancy_id: id,
        user_id: userId,
        mensaje: mensaje.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Comentario agregado exitosamente',
      comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Error al agregar comentario' });
  }
};

// Cerrar solicitud de vacante (para ADMIN, SISTEMAS, RH)
exports.closeVacancyRequest = async (req, res) => {
  try {
    // Verificar que el usuario tenga permisos
    if (!['ADMIN', 'SISTEMAS', 'RH'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Solo ADMIN, SISTEMAS y RH pueden cerrar solicitudes de vacantes' });
    }

    const { id } = req.params;

    const vacancy = await prisma.jobVacancyRH.update({
      where: { id },
      data: {
        estatus: VACANCY_STATUS.CERRADA
      },
      include: {
        departamento: true,
        solicitante: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Crear comentario automático de cierre
    await prisma.vacancyComment.create({
      data: {
        vacancy_id: id,
        user_id: req.user.id,
        mensaje: `🔒 Solicitud de vacante cerrada por RH.`
      }
    });

    res.json({
      message: 'Solicitud de vacante cerrada exitosamente',
      vacancy
    });
  } catch (error) {
    console.error('Error closing vacancy request:', error);
    res.status(500).json({ error: 'Error al cerrar la solicitud de vacante' });
  }
};

// Estadísticas de solicitudes de vacantes
exports.getVacancyRequestStats = async (req, res) => {
  try {
    const total = await prisma.jobVacancyRH.count();
    const solicitadas = await prisma.jobVacancyRH.count({ where: { estatus: VACANCY_STATUS.SOLICITADA } });
    const aprobadas = await prisma.jobVacancyRH.count({ where: { estatus: VACANCY_STATUS.APROBADA } });
    const buscando = await prisma.jobVacancyRH.count({ where: { estatus: VACANCY_STATUS.BUSCANDO } });
    const cerradas = await prisma.jobVacancyRH.count({ where: { estatus: VACANCY_STATUS.CERRADA } });

    res.json({
      total,
      solicitadas,
      aprobadas,
      buscando,
      cerradas
    });
  } catch (error) {
    console.error('Error getting vacancy request stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Tipos de estatus para candidatos
const CANDIDATE_STATUS = {
  EN_REVISION: 'En_Revision',
  DESCARTADO: 'Descartado',
  SELECCIONADO: 'Seleccionado'
};

// Crear nuevo candidato con CV (para ADMIN, SISTEMAS, RH)
exports.createCandidate = async (req, res) => {
  try {
    // Verificar que el usuario tenga permisos
    if (!['ADMIN', 'SISTEMAS', 'RH'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Solo ADMIN, SISTEMAS y RH pueden registrar candidatos' });
    }

    const { vacancy_id } = req.params;
    const { nombre, comentarios_rh } = req.body;
    const cvFile = req.file;

    // Verificar que la vacante existe y está en estado BUSCANDO
    const vacancy = await prisma.jobVacancyRH.findUnique({
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

    // Generar URL del CV (en producción, subir a S3 o similar)
    let cv_url = null;
    if (cvFile) {
      // En un entorno real, aquí subirías el archivo a S3/Cloud Storage
      // Por ahora, simulamos una URL
      cv_url = `/uploads/cvs/${Date.now()}_${cvFile.originalname}`;
    }

    // Crear el candidato
    const candidate = await prisma.candidateRH.create({
      data: {
        vacancy_id,
        nombre,
        cv_url,
        comentarios_rh: comentarios_rh || null,
        estatus: CANDIDATE_STATUS.EN_REVISION
      }
    });

    // Crear comentario automático
    await prisma.vacancyComment.create({
      data: {
        vacancy_id,
        user_id: req.user.id,
        mensaje: `👤 Candidato "${nombre}" registrado por RH. ${cvFile ? 'CV adjunto.' : 'Sin CV adjunto.'}`
      }
    });

    res.status(201).json({
      message: 'Candidato registrado exitosamente',
      candidate
    });
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({ error: 'Error al registrar el candidato' });
  }
};

// Actualizar observaciones de RH en candidato (para ADMIN, SISTEMAS, RH)
exports.updateCandidateObservations = async (req, res) => {
  try {
    // Verificar que el usuario tenga permisos
    if (!['ADMIN', 'SISTEMAS', 'RH'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Solo ADMIN, SISTEMAS y RH pueden actualizar observaciones de candidatos' });
    }

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

    // Buscar el empleado asociado al usuario
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee || candidate.vacancy.solicitante_id !== employee.id) {
      return res.status(403).json({ 
        error: 'Solo el solicitante de la vacante puede votar por candidatos' 
      });
    }

    // Actualizar el estatus basado en el voto
    let newStatus = candidate.estatus;
    if (vote === 'like') {
      newStatus = CANDIDATE_STATUS.SELECCIONADO;
    } else if (vote === 'dislike') {
      newStatus = CANDIDATE_STATUS.DESCARTADO;
    }

    const updatedCandidate = await prisma.candidateRH.update({
      where: { id: candidate_id },
      data: {
        estatus: newStatus
      }
    });

    // Crear comentario automático
    const voteText = vote === 'like' ? '👍 Visto bueno' : '👎 No seleccionado';
    await prisma.vacancyComment.create({
      data: {
        vacancy_id: candidate.vacancy_id,
        user_id: userId,
        mensaje: `${voteText} para el candidato "${candidate.nombre}" por el solicitante.`
      }
    });

    res.json({
      message: 'Voto registrado exitosamente',
      candidate: updatedCandidate
    });
  } catch (error) {
    console.error('Error updating candidate vote:', error);
    res.status(500).json({ error: 'Error al registrar el voto' });
  }
};

// Seleccionar candidato final y cerrar vacante
exports.selectCandidate = async (req, res) => {
  try {
    const { candidate_id } = req.params;
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

    // Buscar el empleado asociado al usuario
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee || candidate.vacancy.solicitante_id !== employee.id) {
      return res.status(403).json({ 
        error: 'Solo el solicitante de la vacante puede seleccionar candidatos' 
      });
    }

    // Verificar que el candidato tenga visto bueno
    if (candidate.estatus !== CANDIDATE_STATUS.SELECCIONADO) {
      return res.status(400).json({ 
        error: 'El candidato debe tener visto bueno antes de ser seleccionado' 
      });
    }

    // Actualizar el candidato como seleccionado
    const updatedCandidate = await prisma.candidateRH.update({
      where: { id: candidate_id },
      data: {
        estatus: CANDIDATE_STATUS.SELECCIONADO
      }
    });

    // Cerrar la vacante
    const updatedVacancy = await prisma.jobVacancyRH.update({
      where: { id: candidate.vacancy_id },
      data: {
        estatus: VACANCY_STATUS.CERRADA
      }
    });

    // Crear comentario automático de selección
    await prisma.vacancyComment.create({
      data: {
        vacancy_id: candidate.vacancy_id,
        user_id: userId,
        mensaje: `🎉 Candidato "${candidate.nombre}" seleccionado para la vacante. Proceso de contratación puede iniciar.`
      }
    });

    res.json({
      message: 'Candidato seleccionado exitosamente. La vacante ha sido cerrada.',
      candidate: updatedCandidate,
      vacancy: updatedVacancy
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

    if (!candidate || !candidate.cv_url) {
      return res.status(404).json({ error: 'CV no encontrado' });
    }

    // En un entorno real, aquí servirías el archivo desde S3/Cloud Storage
    // Por ahora, simulamos una descarga
    res.json({
      message: 'CV disponible para descarga',
      cv_url: candidate.cv_url,
      filename: `CV_${candidate.nombre.replace(/\s+/g, '_')}.pdf`
    });
  } catch (error) {
    console.error('Error downloading candidate CV:', error);
    res.status(500).json({ error: 'Error al descargar el CV' });
  }
};
