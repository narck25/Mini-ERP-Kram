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
      by: ['puestoId'],
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

// Obtener jefes directos (empleados con nivel jerárquico PRESIDENTE, DIRECTOR, GERENTE, JEFE, COORDINADOR, SUPERVISOR)
exports.getManagers = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const managers = await prisma.employee.findMany({
      where: {
        nivelJerarquico: {
          in: ['PRESIDENTE', 'DIRECTOR', 'GERENTE', 'JEFE', 'COORDINADOR', 'SUPERVISOR']
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

// ===== CRUD DEPARTAMENTOS =====

// Crear departamento
exports.createDepartment = async (req, res) => {
  try {
    const { nombre, descripcion, estado } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del departamento es requerido' });
    }

    const existing = await prisma.department.findUnique({ where: { nombre: nombre.trim() } });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un departamento con ese nombre' });
    }

    const department = await prisma.department.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        estado: estado || 'Activo'
      }
    });

    res.status(201).json({ department, message: 'Departamento creado exitosamente' });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Error al crear el departamento' });
  }
};

// Actualizar departamento
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, estado } = req.body;

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Departamento no encontrado' });
    }

    if (nombre && nombre.trim() !== existing.nombre) {
      const duplicate = await prisma.department.findUnique({ where: { nombre: nombre.trim() } });
      if (duplicate) {
        return res.status(409).json({ error: 'Ya existe otro departamento con ese nombre' });
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(nombre && { nombre: nombre.trim() }),
        ...(descripcion !== undefined && { descripcion }),
        ...(estado && { estado })
      }
    });

    res.json({ department, message: 'Departamento actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Error al actualizar el departamento' });
  }
};

// Eliminar departamento
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Departamento no encontrado' });
    }

    // Verificar si tiene empleados asociados
    const employeeCount = await prisma.employee.count({ where: { departamento_id: id } });
    if (employeeCount > 0) {
      return res.status(409).json({
        error: `No se puede eliminar el departamento porque tiene ${employeeCount} empleado(s) asociado(s)`
      });
    }

    // Verificar si tiene puestos asociados
    const positionCount = await prisma.jobPosition.count({ where: { departamentoId: id } });
    if (positionCount > 0) {
      return res.status(409).json({
        error: `No se puede eliminar el departamento porque tiene ${positionCount} puesto(s) de trabajo asociado(s)`
      });
    }

    await prisma.department.delete({ where: { id } });

    res.json({ message: 'Departamento eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Error al eliminar el departamento' });
  }
};

// ===== CRUD PUESTOS DE TRABAJO =====

// Obtener todos los puestos de trabajo
exports.getAllJobPositions = async (req, res) => {
  try {
    const positions = await prisma.jobPosition.findMany({
      include: {
        departamento: {
          select: { id: true, nombre: true }
        }
      },
      orderBy: [
        { departamento: { nombre: 'asc' } },
        { nombre: 'asc' }
      ]
    });

    res.json({ data: positions });
  } catch (error) {
    console.error('Error getting job positions:', error);
    res.status(500).json({ error: 'Error al obtener los puestos de trabajo' });
  }
};

// Crear puesto de trabajo
exports.createJobPosition = async (req, res) => {
  try {
    const { nombre, descripcion, nivelJerarquico, departamentoId, estado } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del puesto es requerido' });
    }
    if (!departamentoId) {
      return res.status(400).json({ error: 'El departamento es requerido' });
    }

    // Verificar que el departamento existe
    const dept = await prisma.department.findUnique({ where: { id: departamentoId } });
    if (!dept) {
      return res.status(404).json({ error: 'El departamento seleccionado no existe' });
    }

    // Verificar unique compuesto [nombre, departamentoId]
    const existing = await prisma.jobPosition.findFirst({
      where: { nombre: nombre.trim(), departamentoId }
    });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un puesto con ese nombre en el mismo departamento' });
    }

    const position = await prisma.jobPosition.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        nivelJerarquico: nivelJerarquico || 'OPERATIVO',
        departamentoId,
        estado: estado || 'Activo'
      },
      include: {
        departamento: { select: { id: true, nombre: true } }
      }
    });

    res.status(201).json({ data: position, message: 'Puesto creado exitosamente' });
  } catch (error) {
    console.error('Error creating job position:', error);
    res.status(500).json({ error: 'Error al crear el puesto de trabajo' });
  }
};

// Actualizar puesto de trabajo
exports.updateJobPosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, nivelJerarquico, departamentoId, estado } = req.body;

    const existing = await prisma.jobPosition.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Puesto no encontrado' });
    }

    // Si cambia nombre o departamento, verificar unique compuesto
    const newNombre = nombre ? nombre.trim() : existing.nombre;
    const newDeptoId = departamentoId || existing.departamentoId;

    if (newNombre !== existing.nombre || newDeptoId !== existing.departamentoId) {
      const duplicate = await prisma.jobPosition.findFirst({
        where: {
          nombre: newNombre,
          departamentoId: newDeptoId,
          id: { not: id }
        }
      });
      if (duplicate) {
        return res.status(409).json({ error: 'Ya existe otro puesto con ese nombre en el mismo departamento' });
      }
    }

    const position = await prisma.jobPosition.update({
      where: { id },
      data: {
        ...(nombre && { nombre: nombre.trim() }),
        ...(descripcion !== undefined && { descripcion }),
        ...(nivelJerarquico && { nivelJerarquico }),
        ...(departamentoId && { departamentoId }),
        ...(estado && { estado })
      },
      include: {
        departamento: { select: { id: true, nombre: true } }
      }
    });

    res.json({ data: position, message: 'Puesto actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating job position:', error);
    res.status(500).json({ error: 'Error al actualizar el puesto de trabajo' });
  }
};

// Eliminar puesto de trabajo
exports.deleteJobPosition = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.jobPosition.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Puesto no encontrado' });
    }

    // Verificar si tiene empleados asociados
    const employeeCount = await prisma.employee.count({ where: { puestoId: id } });
    if (employeeCount > 0) {
      return res.status(409).json({
        error: `No se puede eliminar el puesto porque tiene ${employeeCount} empleado(s) asignado(s)`
      });
    }

    await prisma.jobPosition.delete({ where: { id } });

    res.json({ message: 'Puesto eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting job position:', error);
    res.status(500).json({ error: 'Error al eliminar el puesto de trabajo' });
  }
};
