const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Crear nueva vacante (para jefes de área)
exports.createVacancy = async (req, res) => {
  try {
    const { title, description, department, position, salaryRange, requirements, responsibilities } = req.body;
    const userId = req.user.id;

    // Verificar que el usuario sea un jefe de área (SISTEMAS o COMPRAS)
    if (!['SISTEMAS', 'COMPRAS'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Solo los jefes de área pueden crear vacantes' });
    }

    // Buscar o crear el empleado asociado al usuario
    let employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      // Crear empleado si no existe
      employee = await prisma.employee.create({
        data: {
          userId,
          department: req.user.role === 'SISTEMAS' ? 'Sistemas' : 'Compras',
          position: 'Jefe de Área',
          hireDate: new Date()
        }
      });
    }

    // Crear la vacante
    const vacancy = await prisma.jobVacancy.create({
      data: {
        title,
        description,
        department,
        position,
        salaryRange,
        requirements: requirements || [],
        responsibilities: responsibilities || [],
        createdById: employee.id,
        status: 'PENDIENTE'
      },
      include: {
        createdBy: {
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

    res.status(201).json({
      message: 'Vacante creada exitosamente',
      vacancy
    });
  } catch (error) {
    console.error('Error creating vacancy:', error);
    res.status(500).json({ error: 'Error al crear la vacante' });
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
      where: { createdById: employee.id },
      include: {
        createdBy: {
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
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            candidates: true,
            activities: true
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
    // Verificar que el usuario sea RH o ADMIN
    if (!['RH', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { status, department } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (department) where.department = department;

    const vacancies = await prisma.jobVacancy.findMany({
      where,
      include: {
        createdBy: {
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
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            candidates: true,
            activities: true
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
    // Verificar que el usuario sea RH o ADMIN
    if (!['RH', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Solo RH puede aprobar vacantes' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['APROBADA', 'BUSCANDO', 'CERRADA'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const updateData = {
      status,
      approvedById: req.user.id,
      approvedAt: new Date()
    };

    if (status === 'CERRADA') {
      updateData.closedAt = new Date();
    }

    const vacancy = await prisma.jobVacancy.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
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
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true
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
        createdBy: {
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
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        activities: {
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
    // Verificar que el usuario sea RH o ADMIN
    if (!['RH', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Solo RH puede agregar actividades' });
    }

    const { id } = req.params;
    const { activityType, description, duration, priority } = req.body;

    // Verificar que la vacante esté aprobada
    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id }
    });

    if (!vacancy) {
      return res.status(404).json({ error: 'Vacante no encontrada' });
    }

    if (vacancy.status !== 'APROBADA' && vacancy.status !== 'BUSCANDO') {
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
    if (vacancy.status === 'APROBADA') {
      await prisma.jobVacancy.update({
        where: { id },
        data: { status: 'BUSCANDO' }
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
      by: ['status'],
      _count: {
        id: true
      }
    });

    const total = await prisma.jobVacancy.count();
    const pending = await prisma.jobVacancy.count({ where: { status: 'PENDIENTE' } });
    const approved = await prisma.jobVacancy.count({ where: { status: 'APROBADA' } });
    const searching = await prisma.jobVacancy.count({ where: { status: 'BUSCANDO' } });
    const closed = await prisma.jobVacancy.count({ where: { status: 'CERRADA' } });

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