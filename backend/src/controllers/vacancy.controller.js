const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Crear nueva vacante (formulario digitalizado)
exports.createVacancy = async (req, res) => {
  try {
    const {
      // Información de la Vacante
      titulo,
      nombrePuesto,
      departamento_id, // Cambiado de 'departamento' a 'departamento_id'
      reportaA,
      numeroVacantes,
      motivoSolicitud,
      personaAReemplazar,
      
      // Requerimientos de Sistemas (Infraestructura)
      requiereLaptop,
      requierePC,
      requiereMovil,
      requiereExtension,
      ubicacionFisica,
      otrosRequerimientos,
      
      // Modalidad y Promoción Interna
      tipoContratacion,
      candidatoPromocion,
      cargoPromocion,
      observaciones,
      
      // Proceso de Entrevista
      entrevistadorTecnico,
      entrevistadorRespaldo,
      conocimientosExtra,
      
      // ID del solicitante
      solicitanteId
    } = req.body;

    const userId = req.user.id;

    // Verificar que el usuario esté autenticado
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Si el usuario es RH o ADMIN, puede crear vacantes en nombre de cualquier empleado
    // Si no es RH/ADMIN, solo puede crear vacantes para sí mismo
    if (!['RH', 'ADMIN'].includes(req.user.role)) {
      // Verificar que el solicitanteId coincida con el empleado del usuario
      const employee = await prisma.employee.findUnique({
        where: { userId }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      if (employee.id !== solicitanteId) {
        return res.status(403).json({ error: 'No autorizado para crear vacantes en nombre de otro empleado' });
      }
    } else {
      // Para RH/ADMIN, verificar que el solicitanteId exista
      const solicitante = await prisma.employee.findUnique({
        where: { id: solicitanteId }
      });

      if (!solicitante) {
        return res.status(404).json({ error: 'Empleado solicitante no encontrado' });
      }
    }

    // Validar campos requeridos según el nuevo schema
    // titulo ya no es requerido (es opcional en el schema)
    // departamento_id puede ser un ID o un nombre de departamento
    // Verificar que no sean strings vacíos
    if (!departamento_id || !departamento_id.trim() || !motivoSolicitud || !motivoSolicitud.trim() || !tipoContratacion || !tipoContratacion.trim()) {
      return res.status(400).json({ error: 'Faltan campos requeridos: departamento_id, motivo de solicitud, tipo de contratación' });
    }

    // Manejar departamento_id: puede ser un ID de departamento o un nombre
    let departamento_id_final = null;
    
    // Primero intentar buscar por ID (si parece un UUID/CUID)
    if (departamento_id.match(/^[a-z0-9]{25}$/)) { // CUID típico
      const departmentById = await prisma.department.findUnique({
        where: { id: departamento_id }
      });
      
      if (departmentById) {
        departamento_id_final = departmentById.id;
      }
    }
    
    // Si no se encontró por ID, buscar por nombre
    if (!departamento_id_final) {
      const departmentByName = await prisma.department.findFirst({
        where: { nombre: { equals: departamento_id, mode: 'insensitive' } }
      });
      
      if (departmentByName) {
        departamento_id_final = departmentByName.id;
      } else {
        // Crear nuevo departamento si no existe
        const newDepartment = await prisma.department.create({
          data: {
            nombre: departamento_id,
            descripcion: `Departamento creado automáticamente para vacante`
          }
        });
        departamento_id_final = newDepartment.id;
      }
    }

    // Crear la vacante con los nuevos campos
    const vacancy = await prisma.jobVacancy.create({
      data: {
        // Información de la Vacante (campos requeridos por Prisma)
        titulo: titulo || nombrePuesto || 'Vacante sin título', // Usar titulo o nombrePuesto como fallback
        departamento_id: departamento_id_final, // Usar el ID final (puede ser el original o uno nuevo)
        reportaA,
        numeroVacantes: parseInt(numeroVacantes) || 1,
        motivoSolicitud,
        personaAReemplazar: personaAReemplazar || null,
        
        // Requerimientos de Sistemas (Infraestructura)
        requiereLaptop: Boolean(requiereLaptop),
        requierePC: Boolean(requierePC),
        requiereMovil: Boolean(requiereMovil),
        requiereExtension: Boolean(requiereExtension),
        ubicacionFisica: ubicacionFisica || null,
        otrosRequerimientos: otrosRequerimientos || null,
        
        // Modalidad y Promoción Interna
        tipoContratacion,
        candidatoPromocion: candidatoPromocion || null,
        cargoPromocion: cargoPromocion || null,
        observaciones: observaciones || null,
        
        // Proceso de Entrevista
        entrevistadorTecnico,
        entrevistadorRespaldo: entrevistadorRespaldo || null,
        conocimientosExtra: conocimientosExtra || null,
        
        // Relaciones
        solicitanteId,
        // Estado por defecto - no necesario porque tiene @default(Solicitada) en schema.prisma
      },
      include: {
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
        departamento: true
      }
    });

    res.status(201).json({
      message: 'Solicitud de vacante creada exitosamente',
      vacancy
    });
  } catch (error) {
    console.error('Error creating vacancy:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    res.status(500).json({ error: 'Error al crear la solicitud de vacante', details: error.message });
  }
};

// Obtener vacantes del usuario (mis solicitudes)
exports.getMyVacancies = async (req, res) => {
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
        departamento: true,
        autorizadoPor: {
          select: {
            id: true,
            nombre: true
          }
        },
        voBoPor: {
          select: {
            id: true,
            nombre: true
          }
        },
        JobActivity: {
          orderBy: { priority: 'desc' }
        },
        _count: {
          select: {
            Candidate: true,
            JobActivity: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ vacancies });
  } catch (error) {
    console.error('Error getting vacancies:', error);
    res.status(500).json({ error: 'Error al obtener las vacantes' });
  }
};

// Obtener todas las vacantes (para RH)
exports.getAllVacancies = async (req, res) => {
  try {
    const { status, department } = req.query;
    
    const where = {};
    if (status) where.estatus = status;
    if (department) {
      // Buscar departamento por nombre para obtener su ID
      const dept = await prisma.department.findFirst({
        where: { nombre: { equals: department, mode: 'insensitive' } }
      });
      if (dept) {
        where.departamento_id = dept.id;
      }
    }

    const vacancies = await prisma.jobVacancy.findMany({
      where,
      include: {
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
        departamento: true,
        autorizadoPor: {
          select: {
            id: true,
            nombre: true
          }
        },
        voBoPor: {
          select: {
            id: true,
            nombre: true
          }
        },
        JobActivity: {
          orderBy: { priority: 'desc' }
        },
        _count: {
          select: {
            Candidate: true,
            JobActivity: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ vacancies });
  } catch (error) {
    console.error('Error getting all vacancies:', error);
    res.status(500).json({ error: 'Error al obtener las vacantes' });
  }
};

// Aprobar vacante (para RH)
exports.approveVacancy = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, autorizadoPorId, voBoPorId } = req.body;

    // Convertir los estados del frontend a los valores del enum
    let estatus;
    if (status === 'APROBADA') estatus = 'Aprobada';
    else if (status === 'BUSCANDO') estatus = 'Buscando';
    else if (status === 'CERRADA') estatus = 'Cerrada';
    else {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const updateData = {
      estatus,
      fechaAutorizacion: new Date()
    };

    // Si es aprobación por Director de Área
    if (autorizadoPorId) {
      updateData.autorizadoPorId = autorizadoPorId;
    }

    // Si es Visto Bueno por Director RH
    if (voBoPorId) {
      updateData.voBoPorId = voBoPorId;
    }

    if (status === 'CERRADA') {
      updateData.closedAt = new Date();
    }

    const vacancy = await prisma.jobVacancy.update({
      where: { id },
      data: updateData,
      include: {
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
        departamento: true,
        autorizadoPor: {
          select: {
            id: true,
            nombre: true
          }
        },
        voBoPor: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    res.json({
      message: `Vacante ${status.toLowerCase()} exitosamente`,
      vacancy
    });
  } catch (error) {
    console.error('Error approving vacancy:', error);
    res.status(500).json({ error: 'Error al actualizar la vacante' });
  }
};

// Obtener detalles de una vacante
exports.getVacancyById = async (req, res) => {
  try {
    const { id } = req.params;

    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id },
      include: {
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
        departamento: true,
        autorizadoPor: {
          select: {
            id: true,
            nombre: true
          }
        },
        voBoPor: {
          select: {
            id: true,
            nombre: true
          }
        },
        JobActivity: {
          orderBy: { priority: 'desc' }
        },
        candidates: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!vacancy) {
      return res.status(404).json({ error: 'Vacante no encontrada' });
    }

    res.json({ vacancy });
  } catch (error) {
    console.error('Error getting vacancy:', error);
    res.status(500).json({ error: 'Error al obtener la vacante' });
  }
};

// Agregar actividades a una vacante (para RH)
exports.addActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { activityType, description, duration, priority } = req.body;

    // Verificar que la vacante esté aprobada
    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id }
    });

    if (!vacancy) {
      return res.status(404).json({ error: 'Vacante no encontrada' });
    }

    if (vacancy.estatus !== 'Aprobada' && vacancy.estatus !== 'Buscando') {
      return res.status(400).json({ error: 'Solo se pueden agregar actividades a vacantes aprobadas' });
    }

    const activity = await prisma.jobActivity.create({
      data: {
        vacancyId: id,
        activityType,
        description,
        duration,
        priority: priority || 1
      }
    });

    // Actualizar estado a BUSCANDO si es la primera actividad
    if (vacancy.estatus === 'Aprobada') {
      await prisma.jobVacancy.update({
        where: { id },
        data: { estatus: 'Buscando' }
      });
    }

    res.status(201).json({
      message: 'Actividad agregada exitosamente',
      activity
    });
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({ error: 'Error al agregar la actividad' });
  }
};

// Actualizar actividad
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

// Estadísticas de vacantes
exports.getVacancyStats = async (req, res) => {
  try {
    const stats = await prisma.jobVacancy.groupBy({
      by: ['estatus'],
      _count: {
        id: true
      }
    });

    const total = await prisma.jobVacancy.count();
    const pending = await prisma.jobVacancy.count({ where: { estatus: 'Solicitada' } });
    const approved = await prisma.jobVacancy.count({ where: { estatus: 'Aprobada' } });
    const searching = await prisma.jobVacancy.count({ where: { estatus: 'Buscando' } });
    const closed = await prisma.jobVacancy.count({ where: { estatus: 'Cerrada' } });

    res.json({
      total,
      pending,
      approved,
      searching,
      closed,
      byStatus: stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
