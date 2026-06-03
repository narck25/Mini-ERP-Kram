const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
// CREACIÓN DE VACANTES
// ============================================================

// Crear nueva solicitud de vacante (para jefes de área y RH) - Flujo Estándar
exports.createVacancyRequest = async (req, res) => {
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
      isDirect 
    } = req.body;
    
    const userId = req.user.id;

    let solicitante_id = null;
    
    // Si es jefe de área, buscar el empleado asociado
    if (['SISTEMAS', 'COMPRAS', 'PRODUCCION'].includes(req.user.role)) {
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
        const rhDepartment = await prisma.department.findFirst({
          where: { nombre: { equals: 'RH', mode: 'insensitive' } }
        });
        
        const newRhEmployee = await prisma.employee.create({
          data: {
            nombre: 'RH - Sistema',
            rfc: 'RH000000000',
            curp: 'RH00000000000000',
            nss: '00000000000',
            fecha_ingreso: new Date(),
            estatus: 'Activo',
            puesto: 'Recursos Humanos',
            departamento_id: rhDepartment?.id || '3'
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
    if (['RH', 'ADMIN'].includes(req.user.role) && isDirect === true) {
      estatus = VACANCY_STATUS.APROBADA;
      mensajeComentario = `✅ Vacante creada y aprobada automáticamente por RH (Flujo Directo - Pre-aprobada por Dirección).`;
    } 
    // Si RH crea la vacante sin flujo directo
    else if (['RH', 'ADMIN'].includes(req.user.role)) {
      estatus = VACANCY_STATUS.APROBADA;
      mensajeComentario = `✅ Vacante creada y aprobada automáticamente por RH.`;
    }

    // Crear la solicitud de vacante con todos los campos
    const vacancy = await prisma.jobVacancy.create({
      data: {
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
        fechaAutorizacion: isDirect === true ? new Date() : null,
        autorizadoPorId: isDirect === true ? (req.user.employeeId || null) : null,
        reportaA: '',
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
        },
        jobPosition: true
      }
    });

    // Crear comentario automático
    await prisma.vacancyComment.create({
      data: {
        vacancy_id: vacancy.id,
        user_id: userId,
        mensaje: mensajeComentario
      }
    });

    res.status(201).json({
      message: 'Solicitud de vacante creada exitosamente',
      vacancy,
      isDirect: isDirect === true
    });
  } catch (error) {
    console.error('🔥 ERROR PRISMA createVacancyRequest:', error.message || error);
    console.error('🔥 Error stack:', error.stack);
    console.error('🔥 Request body:', JSON.stringify(req.body, null, 2));
    console.error('🔥 User:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
    res.status(500).json({ error: 'Error al crear la vacante', details: error.message });
  }
};

// Crear vacante directa (Flujo Fast-Track exclusivo para RH)
exports.createDirectVacancy = async (req, res) => {
  try {
    const { 
      titulo, 
      departamento_id, 
      requerimientos_tecnicos,
      actividades,
      perfil_tecnico_detallado 
    } = req.body;
    
    const userId = req.user.id;

    // Buscar un empleado de RH para asociar como solicitante
    let solicitante_id = null;
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
      const rhDepartment = await prisma.department.findFirst({
        where: { nombre: { equals: 'RH', mode: 'insensitive' } }
      });
      
      const newRhEmployee = await prisma.employee.create({
        data: {
          nombre: 'RH - Sistema',
          rfc: 'RH000000000',
          curp: 'RH00000000000000',
          nss: '00000000000',
          fecha_ingreso: new Date(),
          estatus: 'Activo',
          puesto: 'Recursos Humanos',
          departamento_id: rhDepartment?.id || '3'
        }
      });
      solicitante_id = newRhEmployee.id;
    }

    // Verificar que el departamento existe
    const department = await prisma.department.findUnique({
      where: { id: departamento_id }
    });

    if (!department) {
      return res.status(404).json({ error: 'Departamento no encontrado' });
    }

    // Crear la vacante directa (pre-aprobada por dirección)
    const vacancy = await prisma.jobVacancy.create({
      data: {
        titulo,
        departamento_id,
        solicitanteId: solicitante_id,
        reportaA: '',
        numeroVacantes: 1,
        motivoSolicitud: 'NUEVA_CREACION',
        tipoContratacion: 'ADMINISTRATIVO',
        entrevistadorTecnico: '',
        requerimientos_tecnicos: requerimientos_tecnicos || [],
        estatus: VACANCY_STATUS.APROBADA,
        fechaAutorizacion: new Date(),
        autorizadoPorId: req.user.employeeId || null,
        voBoPorId: req.user.employeeId || null
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

    // Si se proporcionan actividades, crearlas
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
    
    await prisma.vacancyComment.create({
      data: {
        vacancy_id: vacancy.id,
        user_id: userId,
        mensaje: `🚀 Vacante creada mediante Flujo Directo (Pre-aprobada por Dirección). ${activityText}Lista para búsqueda inmediata.`
      }
    });

    res.status(201).json({
      message: 'Vacante directa creada exitosamente (Flujo Fast-Track)',
      vacancy,
      isDirect: true
    });
  } catch (error) {
    console.error('Error creating direct vacancy:', error);
    res.status(500).json({ error: 'Error al crear la vacante directa' });
  }
};

// ============================================================
// LISTADO DE VACANTES
// ============================================================

// Obtener mis solicitudes (para jefes de área)
exports.getMyVacancyRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      return res.json({ vacancies: [] });
    }

    const vacancies = await prisma.jobVacancy.findMany({
      where: { solicitanteId: employee.id },
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
    console.error('🔥 ERROR PRISMA getMyVacancyRequests:', error.message || error);
    console.error('🔥 Error stack:', error.stack);
    res.status(500).json({ error: 'Error al obtener las solicitudes de vacantes', details: error.message });
  }
};

// Obtener todas las solicitudes (para ADMIN, SISTEMAS, RH)
exports.getAllVacancyRequests = async (req, res) => {
  try {
    const { estatus, departamento_id } = req.query;
    
    const where = {};
    if (estatus) where.estatus = estatus;
    if (departamento_id) where.departamento_id = departamento_id;

    const vacancies = await prisma.jobVacancy.findMany({
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

// Eliminar vacante completamente (solo RH/ADMIN)
exports.deleteVacancy = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la vacante existe
    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id }
    });

    if (!vacancy) {
      return res.status(404).json({ error: 'Vacante no encontrada' });
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

    // Verificar permisos: jefes de área solo pueden comentar en sus propias solicitudes
    if (['SISTEMAS', 'COMPRAS', 'PRODUCCION'].includes(req.user.role)) {
      const employee = await prisma.employee.findUnique({
        where: { userId }
      });

      if (!employee || vacancy.solicitanteId !== employee.id) {
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

    // Crear directorio para CVs si no existe
    const fs = require('fs');
    const path = require('path');
    const cvsDir = path.join(__dirname, '../../uploads/cvs');
    
    if (!fs.existsSync(cvsDir)) {
      fs.mkdirSync(cvsDir, { recursive: true });
    }

    // Generar nombre único para el CV
    const cvUniqueName = `${Date.now()}_CV_${cvFile.originalname.replace(/\s+/g, '_')}`;
    const cvFilePath = path.join(cvsDir, cvUniqueName);
    
    // Mover el CV del directorio temporal al directorio final
    fs.renameSync(cvFile.path, cvFilePath);
    
    // Guardar la URL relativa del CV
    const cv_url = `/uploads/cvs/${cvUniqueName}`;
    
    // Procesar pruebas psicométricas si se proporcionaron
    let psych_test_url = null;
    if (psychTestFile) {
      const psychTestsDir = path.join(__dirname, '../../uploads/psych-tests');
      if (!fs.existsSync(psychTestsDir)) {
        fs.mkdirSync(psychTestsDir, { recursive: true });
      }
      const psychTestUniqueName = `${Date.now()}_PSYCH_${psychTestFile.originalname.replace(/\s+/g, '_')}`;
      const psychTestFilePath = path.join(psychTestsDir, psychTestUniqueName);
      fs.renameSync(psychTestFile.path, psychTestFilePath);
      psych_test_url = `/uploads/psych-tests/${psychTestUniqueName}`;
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

    res.status(201).json({
      message: 'Candidato registrado exitosamente con CV y pruebas psicométricas',
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

    if (!employee || candidate.vacancy.solicitanteId !== employee.id) {
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
