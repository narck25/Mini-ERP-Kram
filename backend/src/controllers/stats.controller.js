const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener estadísticas para RH (endpoint antiguo - mantener compatibilidad)
exports.getRHStats = async (req, res) => {
  try {
    // Verificar que el usuario sea RH o ADMIN
    if (!['RH', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado. Solo RH y ADMIN pueden ver estas estadísticas.' });
    }

    // Estadísticas de empleados
    const totalEmployees = await prisma.employee.count();
    const activeEmployees = await prisma.employee.count({ where: { estatus: 'Activo' } });
    const inactiveEmployees = await prisma.employee.count({ where: { estatus: 'Inactivo' } });

    // Estadísticas de vacantes (solo JobVacancy)
    const jobVacancies = await prisma.jobVacancy.findMany();
    const vacancyStats = {
      total: jobVacancies.length,
      solicitadas: jobVacancies.filter(v => v.estatus === 'Solicitada').length,
      aprobadas: jobVacancies.filter(v => v.estatus === 'Aprobada').length,
      buscando: jobVacancies.filter(v => v.estatus === 'Buscando').length,
      cerradas: jobVacancies.filter(v => v.estatus === 'Cerrada').length
    };

    // Estadísticas de candidatos
    const totalCandidates = await prisma.candidateRH.count();
    const candidatesByStatus = await prisma.candidateRH.groupBy({
      by: ['estatus'],
      _count: {
        id: true
      }
    });

    // Convertir a objeto más legible
    const candidateStats = {};
    candidatesByStatus.forEach(stat => {
      candidateStats[stat.estatus] = stat._count.id;
    });

    res.json({
      employees: {
        total: totalEmployees,
        activos: activeEmployees,
        inactivos: inactiveEmployees
      },
      vacancies: vacancyStats,
      candidates: {
        total: totalCandidates,
        byStatus: candidateStats
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting RH stats:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Error al obtener estadísticas de RH', details: error.message });
  }
};

// Obtener estadísticas para el dashboard de RH (nuevo endpoint optimizado)
exports.getRHDashboardStats = async (req, res) => {
  try {
    // Verificar que el usuario tenga acceso al módulo EMPLEADOS
    if (!req.user.accessibleModules?.includes('EMPLEADOS') && !['RH', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado. No tienes acceso al módulo de Empleados.' });
    }

    // Obtener fecha actual y fecha de inicio del mes
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 1. Estadísticas de empleados
    const totalEmployees = await prisma.employee.count();
    const activeEmployees = await prisma.employee.count({ where: { estatus: 'Activo' } });
    
    // Por ahora, establecer valores por defecto para vacaciones e incapacidades
    // TODO: Implementar lógica real cuando existan los modelos correspondientes
    const employeesOnVacation = 0;
    const employeesOnLeave = 0;

    // 2. Estadísticas de vacantes (solo JobVacancy, no existe vacancyRequest)
    const totalVacancies = await prisma.jobVacancy.count();
    
    const openVacancies = await prisma.jobVacancy.count({ 
      where: { estatus: { in: ['Aprobada', 'Buscando'] } } 
    });
    
    const inProgressVacancies = await prisma.jobVacancy.count({ 
      where: { estatus: 'Buscando' } 
    });
    
    const closedVacancies = await prisma.jobVacancy.count({ 
      where: { estatus: 'Cerrada' } 
    });

    // 3. Estadísticas de reclutamiento
    const totalCandidates = await prisma.candidateRH.count();
    
    const hiresThisMonth = await prisma.employee.count({
      where: {
        fechaAlta: {
          gte: startOfMonth,
          lte: now
        }
      }
    });
    
    const pendingVacancies = await prisma.jobVacancy.count({ 
      where: { estatus: 'Solicitada' } 
    });

    // 4. Contrataciones recientes (últimos 5 empleados contratados)
    const recentHires = await prisma.employee.findMany({
      where: {
        fechaAlta: {
          gte: startOfMonth,
          lte: now
        }
      },
      orderBy: {
        fechaAlta: 'desc'
      },
      take: 5,
      include: {
        departamento: {
          select: {
            nombre: true
          }
        },
        puesto: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            nivelJerarquico: true
          }
        }
      }
    });

    const responseData = {
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        onVacation: employeesOnVacation,
        onLeave: employeesOnLeave,
      },
      vacancies: {
        total: totalVacancies,
        open: openVacancies,
        inProgress: inProgressVacancies,
        closed: closedVacancies,
      },
      recruitment: {
        total: totalCandidates,
        thisMonth: hiresThisMonth,
        pending: pendingVacancies,
      },
      recentHires: recentHires.map(hire => ({
        id: hire.id,
        clave: hire.clave,
        nombres: hire.nombres,
        puesto: hire.puesto,
        fechaAlta: hire.fechaAlta,
        estatus: hire.estatus,
        departamento: hire.departamento
      })),
      lastUpdated: new Date().toISOString()
    };

    res.json(responseData);
  } catch (error) {
    console.error('❌ Error getting RH dashboard stats:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas del dashboard de RH',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Obtener estadísticas para jefes de departamento
exports.getDepartmentStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verificar que el usuario sea jefe de área
    if (!['SISTEMAS', 'COMPRAS', 'PRODUCCION'].includes(userRole)) {
      return res.status(403).json({ error: 'Acceso denegado. Solo jefes de área pueden ver estas estadísticas.' });
    }

    // Buscar el empleado asociado al usuario
    const employee = await prisma.employee.findUnique({
      where: { userId: userId }
    });

    if (!employee) {
      return res.json({
        vacancyRequests: {
          total: 0,
          solicitadas: 0,
          aprobadas: 0,
          buscando: 0,
          cerradas: 0
        },
        pendingActivities: {
          total: 0,
          activities: []
        },
        candidates: {
          total: 0,
          enRevision: 0,
          descartados: 0,
          seleccionados: 0
        },
        lastUpdated: new Date().toISOString()
      });
    }

    // Obtener vacantes solicitadas por el usuario
    const myJobVacancies = await prisma.jobVacancy.findMany({
      where: {
        solicitanteId: employee.id
      }
    });

    // Estadísticas de vacantes
    const vacancyStats = {
      total: myJobVacancies.length,
      solicitadas: myJobVacancies.filter(v => v.estatus === 'Solicitada').length,
      aprobadas: myJobVacancies.filter(v => v.estatus === 'Aprobada').length,
      buscando: myJobVacancies.filter(v => v.estatus === 'Buscando').length,
      cerradas: myJobVacancies.filter(v => v.estatus === 'Cerrada').length
    };

    // Obtener actividades pendientes
    const pendingActivities = await prisma.jobActivity.findMany({
      where: {
        vacancyId: {
          in: myJobVacancies.map(v => v.id)
        }
      },
      include: {
        vacancy: {
          select: {
            titulo: true
          }
        }
      }
    });

    // Obtener candidatos para mis vacantes
    const myCandidates = await prisma.candidateRH.findMany({
      where: {
        vacancy_id: {
          in: myJobVacancies.map(v => v.id)
        }
      }
    });

    const candidateStats = {
      total: myCandidates.length,
      enRevision: myCandidates.filter(c => c.estatus === 'En_Revision').length,
      descartados: myCandidates.filter(c => c.estatus === 'Descartado').length,
      seleccionados: myCandidates.filter(c => c.estatus === 'Seleccionado').length
    };

    res.json({
      vacancyRequests: vacancyStats,
      pendingActivities: {
        total: pendingActivities.length,
        activities: pendingActivities.map(activity => ({
          id: activity.id,
          description: activity.description,
          vacancyTitle: activity.vacancy?.titulo || 'Sin título',
          activityType: activity.activityType
        }))
      },
      candidates: candidateStats,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting department stats:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Error al obtener estadísticas del departamento', details: error.message });
  }
};

// Obtener estadísticas generales del sistema
exports.getSystemStats = async (req, res) => {
  try {
    // Verificar que el usuario sea ADMIN
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado. Solo ADMIN puede ver estas estadísticas.' });
    }

    // Total de usuarios
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });

    // Usuarios por rol
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    });

    // Total de empleados
    const totalEmployees = await prisma.employee.count();

    // Total de vacantes (solo JobVacancy)
    const totalVacancies = await prisma.jobVacancy.count();

    // Total de candidatos
    const totalCandidates = await prisma.candidateRH.count();

    // Actividades pendientes
    const pendingActivities = await prisma.jobActivity.count();

    // Documentos subidos
    const totalDocuments = await prisma.employeeDocument.count();

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        byRole: usersByRole.reduce((acc, stat) => {
          acc[stat.role] = stat._count.id;
          return acc;
        }, {})
      },
      employees: {
        total: totalEmployees
      },
      vacancies: {
        total: totalVacancies
      },
      candidates: {
        total: totalCandidates
      },
      activities: {
        total: pendingActivities
      },
      documents: {
        total: totalDocuments
      },
      system: {
        uptime: process.uptime(),
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error getting system stats:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Error al obtener estadísticas del sistema', details: error.message });
  }
};
