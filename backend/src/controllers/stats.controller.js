const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener estadísticas para RH (endpoint antiguo - mantener compatibilidad)
exports.getRHStats = async (req, res) => {
  try {
    // Verificar que el usuario tenga acceso a al menos uno de los módulos relevantes
    const hasAccess = req.user.accessibleModules?.some(m => ['EMPLEADOS', 'RECLUTAMIENTO', 'COMPRAS'].includes(m));
    if (!hasAccess) {
      return res.status(403).json({ error: 'Acceso denegado. No tienes acceso a este panel.' });
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
    if (!req.user.accessibleModules?.includes('EMPLEADOS')) {
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

// Obtener estadísticas para el dashboard "Mi Espacio" (panel personal)
exports.getMyDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar que el usuario tenga acceso a al menos uno de los módulos relevantes
    const hasAccess = req.user.accessibleModules?.some(m => ['EMPLEADOS', 'RECLUTAMIENTO', 'COMPRAS'].includes(m));
    if (!hasAccess) {
      return res.status(403).json({ error: 'Acceso denegado. No tienes acceso a este panel.' });
    }

    // ── Nivel B: Scoping de datos por jerarquía ──
    const userRole = req.user.role;
    const isAdminOrRH = ['ADMIN', 'RH'].includes(userRole);

    // Buscar el empleado asociado al usuario
    const employee = await prisma.employee.findUnique({
      where: { userId: userId }
    });

    if (!employee) {
      return res.json({
        myVacancies: { total: 0, active: 0, latest: [] },
        myPurchases: { total: 0, active: 0, latest: [] },
        pendingActivities: { total: 0, activities: [] },
        candidates: { total: 0, enRevision: 0 },
        lastUpdated: new Date().toISOString()
      });
    }

    // Determinar el alcance de datos según jerarquía (Nivel B)
    // ADMIN y RH: bypass total — ven todos los datos
    // PRESIDENTE, DIRECTOR, GERENTE, JEFE, COORDINADOR: ven todo su departamento
    // Otros niveles (ANALISTA, SUPERVISOR, AUX_ADMINISTRATIVO): solo sus propios datos
    const NIVELES_DEPARTAMENTO = ['PRESIDENTE', 'DIRECTOR', 'GERENTE', 'JEFE', 'COORDINADOR'];
    const veTodoDepartamento = NIVELES_DEPARTAMENTO.includes(employee.nivelJerarquico);

    let vacancyWhere = {};
    let purchaseWhere = {};

    if (isAdminOrRH) {
      // ADMIN/RH: sin filtro — ven todo
      vacancyWhere = {};
      purchaseWhere = {};
    } else if (veTodoDepartamento) {
      // Jefes/Gerentes: ven todas las solicitudes de su departamento
      vacancyWhere = { departamento_id: employee.departamento_id };
      purchaseWhere = { departamentoId: employee.departamento_id };
    } else {
      // Empleados regulares: solo sus propias solicitudes
      vacancyWhere = { solicitanteId: employee.id };
      purchaseWhere = { solicitanteId: employee.id };
    }

    // 1. Vacantes
    const myJobVacancies = await prisma.jobVacancy.findMany({
      where: vacancyWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        departamento: { select: { nombre: true } },
        solicitante: { select: { id: true, nombre: true } }
      }
    });

    const activeVacancies = myJobVacancies.filter(v => v.estatus !== 'Cerrada');

    // 2. Solicitudes de compra
    let myPurchases = { total: 0, active: 0, latest: [] };
    try {
      if (prisma.purchaseRequest) {
        const purchaseRequests = await prisma.purchaseRequest.findMany({
          where: purchaseWhere,
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            solicitante: { select: { id: true, nombre: true } }
          }
        });
        myPurchases = {
          total: purchaseRequests.length,
          active: purchaseRequests.filter(p => !['ENTREGADO', 'CANCELADO'].includes(p.estatus)).length,
          latest: purchaseRequests.slice(0, 3).map(p => ({
            id: p.id,
            folio: p.folio,
            estatus: p.estatus,
            createdAt: p.createdAt,
            solicitante: p.solicitante?.nombre
          }))
        };
      }
    } catch (e) {
      // Modelo no existe, ignorar
    }

    // 3. Actividades pendientes
    const pendingActivities = await prisma.jobActivity.findMany({
      where: {
        vacancyId: { in: myJobVacancies.map(v => v.id) }
      },
      include: {
        vacancy: { select: { titulo: true } }
      }
    });

    // 4. Candidatos en revisión
    const myCandidates = await prisma.candidateRH.findMany({
      where: {
        vacancy_id: { in: myJobVacancies.map(v => v.id) }
      }
    });

    res.json({
      myVacancies: {
        total: myJobVacancies.length,
        active: activeVacancies.length,
        latest: myJobVacancies.slice(0, 3).map(v => ({
          id: v.id,
          titulo: v.titulo,
          estatus: v.estatus,
          departamento: v.departamento?.nombre,
          createdAt: v.createdAt
        }))
      },
      myPurchases,
      pendingActivities: {
        total: pendingActivities.length,
        activities: pendingActivities.slice(0, 5).map(a => ({
          id: a.id,
          description: a.description,
          vacancyTitle: a.vacancy?.titulo || 'Sin título',
          activityType: a.activityType
        }))
      },
      candidates: {
        total: myCandidates.length,
        enRevision: myCandidates.filter(c => c.estatus === 'En_Revision').length
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting my dashboard stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de Mi Espacio', details: error.message });
  }
};

// Obtener estadísticas para jefes de departamento (legacy)
exports.getDepartmentStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verificar que el usuario tenga acceso al módulo RECLUTAMIENTO
    if (!req.user.accessibleModules?.includes('RECLUTAMIENTO')) {
      return res.status(403).json({ error: 'Acceso denegado. No tienes acceso al módulo de Reclutamiento.' });
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
    // Verificar que el usuario sea ADMIN (operación crítica del sistema)
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
