const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener estadísticas de empleados
exports.getEmployeeStats = async (req, res) => {
  try {
    const total = await prisma.employee.count();
    const activos = await prisma.employee.count({ where: { estatus: 'Activo' } });
    const inactivos = await prisma.employee.count({ where: { estatus: 'Inactivo' } });

    // Estadísticas por departamento
    const byDepartment = await prisma.employee.groupBy({
      by: ['departamento_id'],
      _count: {
        id: true
      },
      where: {
        departamento_id: {
          not: null
        }
      }
    });

    // Obtener nombres de departamentos
    const departmentStats = await Promise.all(
      byDepartment.map(async (stat) => {
        const departamento = await prisma.department.findUnique({
          where: { id: stat.departamento_id },
          select: { nombre: true }
        });
        return {
          departamento_id: stat.departamento_id,
          departamento_nombre: departamento?.nombre || 'Sin departamento',
          count: stat._count.id
        };
      })
    );

    // Estadísticas por puesto (top 10)
    const byPosition = await prisma.employee.groupBy({
      by: ['puesto'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    res.json({
      total,
      activos,
      inactivos,
      byDepartment: departmentStats,
      byPosition
    });
  } catch (error) {
    console.error('Error getting employee stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de empleados' });
  }
};

// Obtener todos los departamentos
exports.getDepartments = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const departments = await prisma.department.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    res.json({ departments });
  } catch (error) {
    console.error('Error getting departments:', error);
    res.status(500).json({ error: 'Error al obtener los departamentos' });
  }
};

// Obtener jefes directos (empleados con nivel jerárquico GERENTE, DIRECTOR, SUPERVISOR, COORDINADOR)
exports.getManagers = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const managers = await prisma.employee.findMany({
      where: {
        nivelJerarquico: {
          in: ['GERENTE', 'DIRECTOR', 'SUPERVISOR', 'COORDINADOR']
        },
        estatus: 'Activo'
      },
      select: {
        id: true,
        nombre: true,
        nivelJerarquico: true,
        puesto: {
          select: {
            nombre: true
          }
        },
        departamento: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: [
        { nivelJerarquico: 'desc' },
        { nombre: 'asc' }
      ]
    });

    // Formatear los resultados para el frontend
    const formattedManagers = managers.map(manager => ({
      id: manager.id,
      nombre: manager.nombre || 'Sin nombre',
      nivelJerarquico: manager.nivelJerarquico,
      puesto: manager.puesto?.nombre || 'Sin puesto',
      departamento: manager.departamento?.nombre || 'Sin departamento',
      displayName: `${manager.nombre || 'Sin nombre'} - ${manager.puesto?.nombre || 'Sin puesto'} (${manager.nivelJerarquico})`
    }));

    res.json({ managers: formattedManagers });
  } catch (error) {
    console.error('Error getting managers:', error);
    res.status(500).json({ error: 'Error al obtener la lista de jefes directos' });
  }
};

// Obtener puestos por departamento
exports.getJobPositionsByDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID de departamento requerido' });
    }

    const positions = await prisma.jobPosition.findMany({
      where: {
        departamentoId: id,
        estado: 'Activo'
      },
      select: {
        id: true,
        nombre: true,
        nivelJerarquico: true,
        descripcion: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    res.json({ data: positions });
  } catch (error) {
    console.error('Error getting job positions by department:', error);
    res.status(500).json({ error: 'Error al obtener los puestos del departamento' });
  }
};
