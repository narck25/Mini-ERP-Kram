const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Servicio de notificaciones por email
const emailService = require('../services/email.service');

// Función auxiliar para construir URLs correctamente
const buildFileUrl = (req, filePath) => {
  if (!filePath) return null;
  
  // Si tenemos BASE_URL configurado, usarlo
  if (process.env.BASE_URL) {
    return `${process.env.BASE_URL}${filePath}`;
  }
  
  // Si no, usar el método tradicional
  return `${req.protocol}://${req.get('host')}${filePath}`;
};

// Tipos de estatus del flujo colaborativo (deben coincidir con el enum VacancyStatus en schema.prisma)
const VACANCY_STATUS = {
  SOLICITADA: 'Solicitada',
  APROBADA: 'Aprobada',
  BUSCANDO: 'Buscando',
  CERRADA: 'Cerrada'
};

// Tipos de estatus para candidatos
const CANDIDATE_STATUS = {
  EN_REVISION: 'En_Revision',
  DESCARTADO: 'Descartado',
  SELECCIONADO: 'Seleccionado'
};

// ============================================================
// HELPER: Obtener o crear solicitante (empleado asociado al usuario)
// ============================================================

/**
 * Obtiene el empleado asociado al usuario, o crea uno temporal de RH si no existe.
 * @param {string} userId - ID del usuario
 * @param {string} role - Rol del usuario (SISTEMAS, COMPRAS, PRODUCCION, RH, ADMIN)
 * @returns {Promise<string>} ID del empleado (solicitante_id)
 */
async function getOrCreateSolicitante(userId, role) {
  // Primero buscar si el usuario ya tiene un empleado asociado
  const employee = await prisma.employee.findUnique({
    where: { userId }
  });

  if (employee) {
    return employee.id;
  }

  // Si no tiene empleado asociado, buscar un empleado de RH para asociar como solicitante
  const rhEmployee = await prisma.employee.findFirst({
    where: {
      departamento: {
        nombre: { in: ['RH', 'RECURSOS HUMANOS'] }
      }
    }
  });

  if (rhEmployee) {
    return rhEmployee.id;
  }

  // Si no hay empleado de RH, crear uno temporal
  const rhDepartment = await prisma.department.findFirst({
    where: { nombre: { in: ['RH', 'RECURSOS HUMANOS'] } }
  });

  if (!rhDepartment) {
    throw Object.assign(new Error('No se encontró el departamento de RH. Debe existir al menos un departamento RH en el sistema.'), { statusCode: 500 });
  }

  const newRhEmployee = await prisma.employee.create({
    data: {
      nombre: 'RH - Sistema',
      rfc: 'RH000000000',
      curp: 'RH00000000000000',
      nss: '00000000000',
      fecha_ingreso: new Date(),
      estatus: 'Activo',
      puesto: 'Recursos Humanos',
      departamento_id: rhDepartment.id
    }
  });

  return newRhEmployee.id;
}

// ============================================================
// CREACIÓN DE VACANTES (UNIFICADA)
// ============================================================

// Función unificada para crear vacantes (flujo estándar y directo)
exports.createVacancy = async (req, res) => {
  try {
    const { 
      titulo, 
      departamento_id, 
      jobPositionId,
      numeroVacantes,
      motivoSolicitud,
      personaAReemplazarNombre,
      personaAReemplazarCargo,
      noAceptanReingresos,
      reqComputadoraEscritorio,
      reqLaptop,
      reqTelefonoMovil,
      reqExtensionTelefonica,
      ubicacionFisica,
      otrosRequerimientosFisicos,
      tipoContratacion,
      consideraPromocionInterna,
      candidatosInternosPropuestos,
      observacionesPromocion,
      entrevistadorTecnico,
      entrevistadorRespaldo,
      conocimientosAdicionales,
      requerimientos_tecnicos,
      actividades,
      isDirect 
    } = req.body;
    
    const userId = req.user.id;
    const role = req.user.role;

    // Obtener o crear el solicitante usando el helper
    let solicitante_id;
    try {
      solicitante_id = await getOrCreateSolicitante(userId, role);
    } catch (err) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }

    // Verificar que el departamento existe
    const department = await prisma.department.findUnique({
      where: { id: departamento_id }
    });

    if (!department) {
      return res.status(404).json({ error: 'Departamento no encontrado' });
    }

    // Verificar que el puesto existe si se proporciona
    if (jobPositionId) {
      const jobPosition = await prisma.jobPosition.findUnique({
        where: { id: jobPositionId }
      });

      if (!jobPosition) {
        return res.status(404).json({ error: 'Puesto no encontrado' });
      }
    }

    // Determinar el estado basado en el flujo
    let estatus = VACANCY_STATUS.SOLICITADA;
    let mensajeComentario = 'Solicitud de vacante creada.';
    
    // Si RH crea la vacante con flujo directo
    if (['RH', 'ADMIN'].includes(role) && isDirect === true) {
      estatus = VACANCY_STATUS.APROBADA;
      mensajeComentario = `✅ Vacante creada y aprobada automáticamente por RH (Flujo Directo - Pre-aprobada por Dirección).`;
    } 
    // Si RH crea la vacante sin flujo directo
    else if (['RH', 'ADMIN'].includes(role)) {
      estatus = VACANCY_STATUS.APROBADA;
      mensajeComentario = `✅ Vacante creada y aprobada automáticamente por RH.`;
    }

    // Construir datos de creación
    const createData = {
      titulo,
      departamento_id,
      jobPositionId,
      solicitanteId: solicitante_id,
      numeroVacantes: numeroVacantes || 1,
      motivoSolicitud: motivoSolicitud || 'NUEVA_CREACION',
      personaAReemplazarNombre: personaAReemplazarNombre || null,
      personaAReemplazarCargo: personaAReemplazarCargo || null,
      noAceptanReingresos: noAceptanReingresos || false,
      reqComputadoraEscritorio: reqComputadoraEscritorio || false,
      reqLaptop: reqLaptop || false,
      reqTelefonoMovil: reqTelefonoMovil || false,
      reqExtensionTelefonica: reqExtensionTelefonica || false,
      ubicacionFisica: ubicacionFisica || null,
      otrosRequerimientosFisicos: otrosRequerimientosFisicos || null,
      tipoContratacion: tipoContratacion || 'ADMINISTRATIVO',
      consideraPromocionInterna: consideraPromocionInterna || false,
      candidatosInternosPropuestos: candidatosInternosPropuestos || null,
      observacionesPromocion: observacionesPromocion || null,
      entrevistadorTecnico: entrevistadorTecnico || '',
      entrevistadorRespaldo: entrevistadorRespaldo || null,
      conocimientosAdicionales: conocimientosAdicionales || null,
      requerimientos_tecnicos: requerimientos_tecnicos || [],
      estatus,
      reportaA: '',
    };

    // Campos específicos para flujo directo
    if (isDirect === true) {
      createData.fechaAutorizacion = new Date();
      createData.autorizadoPorId = req.user.employeeId || null;
      createData.voBoPorId = req.user.employeeId || null;
    }

    // Crear la solicitud de vacante
    const vacancy = await prisma.jobVacancy.create({
      data: createData,
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
        jobPosition: true
      }
    });

    // Si se proporcionan actividades (flujo directo), crearlas
    if (actividades && Array.isArray(actividades) && actividades.length > 0) {
      for (const actividad of actividades) {
        if (actividad.activityType && actividad.description) {
          await prisma.jobActivity.create({
            data: {
              vacancyId: vacancy.id,
              activityType: actividad.activityType,
              description: actividad.description,
              duration: actividad.duration || null,
              priority: actividad.priority || 1
            }
          });
        }
      }
    }

    // Crear comentario automático
    const activityText = actividades && actividades.length > 0 ? 
      `${actividades.length} actividades definidas. ` : '';
    if (isDirect === true) {
      mensajeComentario = `🚀 Vacante creada mediante Flujo Directo (Pre-aprobada por Dirección). ${activityText}Lista para búsqueda inmediata.`;
    }
    
    await prisma.vacancyComment.create({
      data: {
        vacancy_id: vacancy.id,
        user_id: userId,
        mensaje: mensajeComentario
      }
    });

    // Notificar por email según el flujo
    try {
      if (['SISTEMAS', 'COMPRAS', 'PRODUCCION'].includes(role)) {
        // Jefe de área creó solicitud → notificar a RH
        const rhUsers = await prisma.user.findMany({
          where: { role: { in: ['RH', 'ADMIN'] } },
          select: { email: true, name: true }
        });
        const solicitanteNombre = vacancy.solicitante?.user?.name || req.user.name;
        for (const rhUser of rhUsers) {
          emailService.sendVacancyApprovalRequired(
            rhUser.email,
            rhUser.name,
            vacancy,
            solicitanteNombre
          );
        }
      } else if (isDirect === true) {
        // Flujo directo → notificar al solicitante
        const solicitanteEmail = vacancy.solicitante?.user?.email;
        const solicitanteNombre = vacancy.solicitante?.user?.name || 'Usuario';
        if (solicitanteEmail) {
          emailService.sendVacancyDirectCreated(solicitanteEmail, solicitanteNombre, vacancy);
        }
      }
    } catch (emailErr) {
      console.warn('⚠️ Error al enviar notificación por email:', emailErr.message);
    }

    res.status(201).json({
      message: isDirect === true ? 'Vacante directa creada exitosamente (Flujo Fast-Track)' : 'Solicitud de vacante creada exitosamente',
      vacancy,
      isDirect: isDirect === true
    });
  } catch (error) {
    console.error('🔥 ERROR PRISMA createVacancy:', error.message || error);
    console.error('🔥 Error stack:', error.stack);
    console.error('🔥 Request body:', JSON.stringify(req.body, null, 2));
    console.error('🔥 User:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
    res.status(500).json({ error: 'Error al crear la vacante', details: error.message });
  }
};

// Wrapper para compatibilidad: createVacancyRequest llama a createVacancy
exports.createVacancyRequest = async (req, res) => {
  return exports.createVacancy(req, res);
};

// Wrapper para compatibilidad: createDirectVacancy llama a createVacancy con isDirect=true
exports.createDirectVacancy = async (req, res) => {
  req.body.isDirect = true;
  return exports.createVacancy(req, res);
};

// ============================================================
// LISTADO DE VACANTES
// ============================================================

// Obtener mis solicitudes (para jefes de área) - CON PAGINACIÓN
exports.getMyVacancyRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      return res.json({ vacancies: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } });
    }

    const where = { solicitanteId: employee.id };

    const [vacancies, total] = await Promise.all([
      prisma.jobVacancy.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.jobVacancy.count({ where })
    ]);

    res.json({
      vacancies,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('🔥 ERROR PRISMA getMyVacancyRequests:', error.message || error);
    console.error('🔥 Error stack:', error.stack);
    res.status(500).json({ error: 'Error al obtener las solicitudes de vacantes', details: error.message });
  }
};

// Obtener todas las solicitudes (para ADMIN, SISTEMAS, RH) - CON PAGINACIÓN Y FILTROS COMBINADOS
exports.getAllVacancyRequests = async (req, res) => {
  try {
    const { estatus, departamento_id, search, fecha_desde, fecha_hasta } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const where = {};
    if (estatus) where.estatus = estatus;
    if (departamento_id) where.departamento_id = departamento_id;
    
    // Filtro por búsqueda de texto en título
    if (search) {
      where.titulo = { contains: search, mode: 'insensitive' };
    }
    
    // Filtro por rango de fechas
    if (fecha_desde || fecha_hasta) {
      where.createdAt = {};
      if (fecha_desde) where.createdAt.gte = new Date(fecha_desde);
      if (fecha_hasta) {
        // Incluir todo el día de fecha_hasta
        const endDate = new Date(fecha_hasta);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const [vacancies, total] = await Promise.all([
      prisma.jobVacancy.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.jobVacancy.count({ where })
    ]);

    res.json({
      vacancies,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting all vacancy requests:', error);
    res.status(500).json({ error: 'Error al obtener las solicitudes de vacantes' });
  }
};

// ============================================================
// APROBACIÓN Y CIERRE DE VACANTES
// ============================================================

// Aprobar solicitud de vacante (para ADMIN, SISTEMAS, RH) - Flujo Estándar
exports.approveVacancyRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const vacancy = await prisma.jobVacancy.update({
      where: { id },
      data: {
        estatus: VACANCY_STATUS.APROBADA,
        fechaAutorizacion: new Date(),
        autorizadoPorId: req.user.employeeId || null
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
        mensaje: `✅ Solicitud aprobada por RH. El jefe de área debe ahora definir las actividades del puesto.`
      }
    });

    // Notificar al solicitante por email
    try {
      const solicitanteEmail = vacancy.solicitante?.user?.email;
      const solicitanteNombre = vacancy.solicitante?.user?.name || 'Usuario';
      if (solicitanteEmail) {
        emailService.sendVacancyApproved(solicitanteEmail, solicitanteNombre, vacancy);
      }
    } catch (emailErr) {
      console.warn('⚠️ Error al enviar notificación de aprobación:', emailErr.message);
    }

    res.json({
      message: 'Solicitud de vacante aprobada exitosamente. El jefe de área debe definir las actividades del puesto.',
      vacancy
    });
  } catch (error) {
    console.error('Error approving vacancy request:', error);
    res.status(500).json({ error: 'Error al aprobar la solicitud de vacante' });
  }
};

// Cerrar solicitud de vacante (para ADMIN, SISTEMAS, RH)
exports.closeVacancyRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const vacancy = await prisma.jobVacancy.update({
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

// Función auxiliar para eliminar archivos del disco
const deleteFileFromDisk = (filePath) => {
  if (!filePath) return;
  const fs = require('fs');
  const path = require('path');
  const absolutePath = path.join(__dirname, '../..', filePath);
  try {
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log(`🗑️ Archivo eliminado: ${absolutePath}`);
    }
  } catch (err) {
    console.warn(`⚠️ No se pudo eliminar archivo ${absolutePath}: ${err.message}`);
  }
};

// Eliminar vacante completamente (solo usuarios con acceso a RECLUTAMIENTO)
exports.deleteVacancy = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la vacante existe
    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id },
      include: {
        candidatesRH: true
      }
    });

    if (!vacancy) {
      return res.status(404).json({ error: 'Vacante no encontrada' });
    }

    // Eliminar archivos del disco de todos los candidatos asociados
    for (const candidate of vacancy.candidatesRH) {
      deleteFileFromDisk(candidate.cv_url);
      deleteFileFromDisk(candidate.psych_test_url);
    }

    // Eliminar registros relacionados en orden
    await prisma.vacancyComment.deleteMany({ where: { vacancy_id: id } });
    await prisma.jobActivity.deleteMany({ where: { vacancyId: id } });
    await prisma.candidateRH.deleteMany({ where: { vacancy_id: id } });
    await prisma.jobVacancy.delete({ where: { id } });

    res.json({
      message: 'Vacante eliminada permanentemente'
    });
  } catch (error) {
    console.error('Error deleting vacancy:', error);
    res.status(500).json({ error: 'Error al eliminar la vacante' });
  }
};

// Cancelar vacante por el solicitante (cambia a estado Cerrada)
exports.cancelVacancy = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que la vacante existe
    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id },
      include: {
        solicitante: true
      }
    });

    if (!vacancy) {
      return res.status(404).json({ error: 'Vacante no encontrada' });
    }

    // Verificar que el usuario sea el solicitante
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee || vacancy.solicitanteId !== employee.id) {
      return res.status(403).json({ error: 'Solo el solicitante puede cancelar esta vacante' });
    }

    // Cambiar estado a Cerrada
    const updatedVacancy = await prisma.jobVacancy.update({
      where: { id },
      data: {
        estatus: VACANCY_STATUS.CERRADA
      }
    });

    // Crear comentario automático de cancelación
    await prisma.vacancyComment.create({
      data: {
        vacancy_id: id,
        user_id: userId,
        mensaje: `🚫 Vacante cancelada por el solicitante.`
      }
    });

    res.json({
      message: 'Vacante cancelada exitosamente',
      vacancy: updatedVacancy
    });
  } catch (error) {
    console.error('Error cancelling vacancy:', error);
    res.status(500).json({ error: 'Error al cancelar la vacante' });
  }
};

// ============================================================
// ACTIVIDADES DEL PUESTO
// ============================================================

// Crear actividades del puesto (para jefes de área - Flujo Estándar)
exports.createJobActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const { actividades } = req.body;
    const userId = req.user.id;

    // Verificar que la vacante existe y está en estado APROBADA
    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id }
    });

    if (!vacancy) {
      return res.status(404).json({ error: 'Solicitud de vacante no encontrada' });
    }

    if (vacancy.estatus !== VACANCY_STATUS.APROBADA) {
      return res.status(400).json({ 
        error: 'La solicitud debe estar en estado "Aprobada" para definir actividades' 
      });
    }

    // Verificar que el usuario sea el solicitante de la vacante
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee || vacancy.solicitanteId !== employee.id) {
      return res.status(403).json({ 
        error: 'Solo el solicitante de la vacante puede definir las actividades' 
      });
    }

    // Validar que se proporcionen actividades
    if (!actividades || !Array.isArray(actividades) || actividades.length === 0) {
      return res.status(400).json({ 
        error: 'Debe proporcionar al menos una actividad del puesto' 
      });
    }

    // Crear las actividades en la base de datos
    const createdActivities = [];
    for (const actividad of actividades) {
      if (!actividad.activityType || !actividad.description) {
        continue;
      }

      const createdActivity = await prisma.jobActivity.create({
        data: {
          vacancyId: id,
          activityType: actividad.activityType,
          description: actividad.description,
          duration: actividad.duration || null,
          priority: actividad.priority || 1
        }
      });
      createdActivities.push(createdActivity);
    }

    // Actualizar la vacante a estado APROBADA (lista para búsqueda)
    const updatedVacancy = await prisma.jobVacancy.update({
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

    // Crear comentario automático
    await prisma.vacancyComment.create({
      data: {
        vacancy_id: id,
        user_id: userId,
        mensaje: `📋 ${createdActivities.length} actividades del puesto definidas por el jefe de área. La vacante ahora está lista para búsqueda.`
      }
    });

    // Notificar a RH que se definieron las actividades
    try {
      const rhUsers = await prisma.user.findMany({
        where: { role: { in: ['RH', 'ADMIN'] } },
        select: { email: true, name: true }
      });
      const solicitanteNombre = updatedVacancy.solicitante?.user?.name || req.user.name;
      for (const rhUser of rhUsers) {
        emailService.sendActivitiesDefined(
          rhUser.email,
          rhUser.name,
          updatedVacancy,
          solicitanteNombre,
          createdActivities.length
        );
      }
    } catch (emailErr) {
      console.warn('⚠️ Error al enviar notificación de actividades:', emailErr.message);
    }

    res.json({
      message: `Actividades del puesto creadas exitosamente. La vacante ahora está lista para búsqueda.`,
      activities: createdActivities,
      vacancy: updatedVacancy
    });
  } catch (error) {
    console.error('Error creating job activities:', error);
    res.status(500).json({ error: 'Error al crear las actividades del puesto' });
  }
};

// Actualizar perfil técnico y actividades (para ADMIN, SISTEMAS, RH y jefes de área) - Flujo Directo
exports.updateTechnicalProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { actividades, perfil_tecnico_detallado } = req.body;
    const userId = req.user.id;

    // Verificar que la vacante existe y está aprobada
    const vacancy = await prisma.jobVacancy.findUnique({
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

    // Si se proporcionan actividades, crearlas
    if (actividades && Array.isArray(actividades) && actividades.length > 0) {
      for (const actividad of actividades) {
        if (actividad.activityType && actividad.description) {
          await prisma.jobActivity.create({
            data: {
              vacancyId: id,
              activityType: actividad.activityType,
              description: actividad.description,
              duration: actividad.duration || null,
              priority: actividad.priority || 1
            }
          });
        }
      }
    }

    // Actualizar la vacante con el perfil técnico detallado
    const updatedVacancy = await prisma.jobVacancy.update({
      where: { id },
      data: {
        requerimientos_tecnicos: perfil_tecnico_detallado || vacancy.requerimientos_tecnicos,
        estatus: VACANCY_STATUS.BUSCANDO
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
    const activityText = actividades && actividades.length > 0 ? 
      `${actividades.length} actividades definidas. ` : '';
    
    await prisma.vacancyComment.create({
      data: {
        vacancy_id: id,
        user_id: userId,
        mensaje: `📋 ${activityText}Perfil técnico actualizado. La vacante ahora está en estado "Buscando".`
      }
    });

    res.json({
      message: 'Perfil técnico actualizado exitosamente. La vacante ahora está en búsqueda.',
      vacancy: updatedVacancy
    });
  } catch (error) {
    console.error('Error updating technical profile:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Error al actualizar el perfil técnico' });
  }
};

// ============================================================
// DETALLES DE VACANTE
// ============================================================

// Obtener detalles de una solicitud de vacante
exports.getVacancyRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const vacancy = await prisma.jobVacancy.findUnique({
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
        autorizadoPor: {
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
        voBoPor: {
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
        },
        JobActivity: {
          orderBy: { priority: 'desc' }
        }
      }
    });

    if (!vacancy) {
      return res.status(404).json({ error: 'Solicitud de vacante no encontrada' });
    }

    // Transformar las URLs de los candidatos a URLs completas
    const transformedVacancy = {
      ...vacancy,
      candidatesRH: vacancy.candidatesRH.map(candidate => ({
        ...candidate,
        cv_url: buildFileUrl(req, candidate.cv_url),
        psych_test_url: buildFileUrl(req, candidate.psych_test_url)
      }))
    };

    res.json({ vacancy: transformedVacancy });
  } catch (error) {
    console.error('Error getting vacancy request:', error);
    res.status(500).json({ error: 'Error al obtener la solicitud de vacante' });
  }
};

// ============================================================
// COMENTARIOS
// ============================================================

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
    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id }
    });

    if (!vacancy) {
      return res.status(404).json({ error: 'Solicitud de vacante no encontrada' });
    }

    // Verificar permisos: usuarios con empleado asociado solo pueden comentar en sus propias solicitudes
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (employee && vacancy.solicitanteId !== employee.id) {
      return res.status(403).json({ error: 'Solo puedes comentar en tus propias solicitudes' });
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

// ============================================================
// ESTADÍSTICAS
// ============================================================

// Estadísticas de solicitudes de vacantes
exports.getVacancyRequestStats = async (req, res) => {
  try {
    const total = await prisma.jobVacancy.count();
    const solicitadas = await prisma.jobVacancy.count({ where: { estatus: VACANCY_STATUS.SOLICITADA } });
    const aprobadas = await prisma.jobVacancy.count({ where: { estatus: VACANCY_STATUS.APROBADA } });
    const buscando = await prisma.jobVacancy.count({ where: { estatus: VACANCY_STATUS.BUSCANDO } });
    const cerradas = await prisma.jobVacancy.count({ where: { estatus: VACANCY_STATUS.CERRADA } });

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

// ============================================================
// CANDIDATES AND MIGRATED — delegated to candidate.controller.js
const cc = require('./candidate.controller');
exports.createCandidate = cc.createCandidate;
exports.updateCandidateObservations = cc.updateCandidateObservations;
exports.updateCandidateVote = cc.updateCandidateVote;
exports.selectCandidate = cc.selectCandidate;
exports.downloadCandidateCV = cc.downloadCandidateCV;
exports.updateCandidateDocuments = cc.updateCandidateDocuments;
exports.updateActivity = cc.updateActivity;
exports.getVacancyFormData = cc.getVacancyFormData;
