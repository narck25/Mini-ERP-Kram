const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Tipos de estatus del flujo colaborativo (deben coincidir con el enum VacancyStatus en schema.prisma)
const VACANCY_STATUS = {
  SOLICITADA: 'Solicitada',
  APROBADA: 'Aprobada',
  BUSCANDO: 'Buscando',
  CERRADA: 'Cerrada'
};

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
        // Si es flujo directo, marcar como pre-aprobada por dirección
        fechaAutorizacion: isDirect === true ? new Date() : null,
        autorizadoPorId: isDirect === true ? (req.user.employeeId || null) : null,
        // Campos legacy que se mantienen por compatibilidad
        reportaA: '', // Valor por defecto
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
        reportaA: '', // Valor por defecto
        numeroVacantes: 1, // Valor por defecto
        motivoSolicitud: 'NUEVA_CREACION', // Valor por defecto
        tipoContratacion: 'ADMINISTRATIVO', // Valor por defecto
        entrevistadorTecnico: '', // Valor por defecto
        requerimientos_tecnicos: requerimientos_tecnicos || [],
        estatus: VACANCY_STATUS.APROBADA,
        fechaAutorizacion: new Date(),
        autorizadoPorId: req.user.employeeId || null,
        voBoPorId: req.user.employeeId || null // RH también da VoBo
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
        continue; // Saltar actividades inválidas
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

    console.log('=== DEBUG updateTechnicalProfile ===');
    console.log('Vacancy ID:', id);
    console.log('User ID:', userId);
    console.log('Perfil técnico recibido:', perfil_tecnico_detallado);
    console.log('Actividades recibidas:', actividades);
    console.log('Tipo de actividades:', typeof actividades);
    console.log('Es array?', Array.isArray(actividades));
    console.log('=== FIN DEBUG ===');

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
      console.log('Creando actividades...');
      for (const actividad of actividades) {
        console.log('Procesando actividad:', actividad);
        if (actividad.activityType && actividad.description) {
          console.log('Creando actividad en BD:', actividad);
          await prisma.jobActivity.create({
            data: {
              vacancyId: id,
              activityType: actividad.activityType,
              description: actividad.description,
              duration: actividad.duration || null,
              priority: actividad.priority || 1
            }
          });
          console.log('Actividad creada exitosamente');
        } else {
          console.log('Actividad inválida, falta activityType o description:', actividad);
        }
      }
      console.log('Total actividades creadas:', actividades.length);
    } else {
      console.log('No se recibieron actividades o no es un array válido');
    }

    // Actualizar la vacante con el perfil técnico detallado
    const updatedVacancy = await prisma.jobVacancy.update({
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

// Tipos de estatus para candidatos
const CANDIDATE_STATUS = {
  EN_REVISION: 'En_Revision',
  DESCARTADO: 'Descartado',
  SELECCIONADO: 'Seleccionado'
};

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

    // Validar que se suban ambos archivos
    if (!cvFile) {
      return res.status(400).json({ error: 'El CV es obligatorio' });
    }
    
    if (!psychTestFile) {
      return res.status(400).json({ error: 'Las pruebas psicométricas son obligatorias' });
    }

    // Validar que sean archivos PDF
    if (cvFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'El CV debe ser un archivo PDF' });
    }
    
    if (psychTestFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Las pruebas psicométricas deben ser un archivo PDF' });
    }

    // Crear directorio para CVs si no existe
    const fs = require('fs');
    const path = require('path');
    const cvsDir = path.join(__dirname, '../../uploads/cvs');
    const psychTestsDir = path.join(__dirname, '../../uploads/psych-tests');
    
    if (!fs.existsSync(cvsDir)) {
      fs.mkdirSync(cvsDir, { recursive: true });
    }
    
    if (!fs.existsSync(psychTestsDir)) {
      fs.mkdirSync(psychTestsDir, { recursive: true });
    }

    // Generar nombres únicos para los archivos
    const cvUniqueName = `${Date.now()}_CV_${cvFile.originalname.replace(/\s+/g, '_')}`;
    const cvFilePath = path.join(cvsDir, cvUniqueName);
    
    const psychTestUniqueName = `${Date.now()}_PSYCH_${psychTestFile.originalname.replace(/\s+/g, '_')}`;
    const psychTestFilePath = path.join(psychTestsDir, psychTestUniqueName);
    
    // Mover los archivos del directorio temporal al directorio final
    fs.renameSync(cvFile.path, cvFilePath);
    fs.renameSync(psychTestFile.path, psychTestFilePath);
    
    // Guardar las URLs relativas
    const cv_url = `/uploads/cvs/${cvUniqueName}`;
    const psych_test_url = `/uploads/psych-tests/${psychTestUniqueName}`;

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
    const updatedVacancy = await prisma.jobVacancy.update({
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
