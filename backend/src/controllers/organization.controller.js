const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== DEPARTAMENTOS ====================

// Obtener todos los departamentos
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        jobPositions: {
          select: {
            id: true,
            nombre: true,
            nivelJerarquico: true,
            estado: true
          },
          orderBy: { nombre: 'asc' }
        },
        _count: {
          select: {
            employees: true,
            jobPositions: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Error getting departments:', error);
    res.status(500).json({ success: false, error: 'Error al obtener los departamentos' });
  }
};

// Obtener un departamento por ID
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            nombre: true,
            puesto: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                nivelJerarquico: true
              }
            },
            estatus: true
          }
        },
        jobPositions: {
          select: {
            id: true,
            nombre: true,
            nivelJerarquico: true,
            estado: true
          }
        }
      }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Departamento no encontrado' });
    }

    res.json({ success: true, data: department });
  } catch (error) {
    console.error('Error getting department:', error);
    res.status(500).json({ success: false, error: 'Error al obtener el departamento' });
  }
};

// Crear un nuevo departamento
exports.createDepartment = async (req, res) => {
  try {
    const { nombre, descripcion, estado = 'Activo' } = req.body;

    // Validar campos requeridos
    if (!nombre) {
      return res.status(400).json({ success: false, error: 'El nombre del departamento es requerido' });
    }

    // Verificar si ya existe un departamento con el mismo nombre
    const existingDepartment = await prisma.department.findUnique({
      where: { nombre }
    });

    if (existingDepartment) {
      return res.status(400).json({ success: false, error: 'Ya existe un departamento con ese nombre' });
    }

    const department = await prisma.department.create({
      data: {
        nombre,
        descripcion,
        estado
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Departamento creado exitosamente',
      data: department 
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ success: false, error: 'Error al crear el departamento' });
  }
};

// Actualizar un departamento
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, estado } = req.body;

    // Verificar si el departamento existe
    const existingDepartment = await prisma.department.findUnique({
      where: { id }
    });

    if (!existingDepartment) {
      return res.status(404).json({ success: false, error: 'Departamento no encontrado' });
    }

    // Si se cambia el nombre, verificar que no exista otro con el mismo nombre
    if (nombre && nombre !== existingDepartment.nombre) {
      const departmentWithSameName = await prisma.department.findUnique({
        where: { nombre }
      });

      if (departmentWithSameName) {
        return res.status(400).json({ success: false, error: 'Ya existe otro departamento con ese nombre' });
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        nombre: nombre || existingDepartment.nombre,
        descripcion: descripcion !== undefined ? descripcion : existingDepartment.descripcion,
        estado: estado || existingDepartment.estado
      }
    });

    res.json({ 
      success: true, 
      message: 'Departamento actualizado exitosamente',
      data: department 
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el departamento' });
  }
};

// Eliminar un departamento
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el departamento existe
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
            jobPositions: true
          }
        }
      }
    });

    if (!existingDepartment) {
      return res.status(404).json({ success: false, error: 'Departamento no encontrado' });
    }

    // Verificar si el departamento tiene empleados o puestos asociados
    if (existingDepartment._count.employees > 0 || existingDepartment._count.jobPositions > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se puede eliminar el departamento porque tiene empleados o puestos asociados',
        details: {
          employeesCount: existingDepartment._count.employees,
          jobPositionsCount: existingDepartment._count.jobPositions
        }
      });
    }

    await prisma.department.delete({
      where: { id }
    });

    res.json({ 
      success: true, 
      message: 'Departamento eliminado exitosamente',
      deletedDepartment: {
        id: existingDepartment.id,
        nombre: existingDepartment.nombre
      }
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar el departamento' });
  }
};

// ==================== PUESTOS DE TRABAJO ====================

// Obtener todos los puestos de trabajo
exports.getAllJobPositions = async (req, res) => {
  try {
    const jobPositions = await prisma.jobPosition.findMany({
      include: {
        departamento: {
          select: {
            id: true,
            nombre: true
          }
        },
        _count: {
          select: {
            employees: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    res.json({ success: true, data: jobPositions });
  } catch (error) {
    console.error('Error getting job positions:', error);
    res.status(500).json({ success: false, error: 'Error al obtener los puestos de trabajo' });
  }
};

// Obtener un puesto de trabajo por ID
exports.getJobPositionById = async (req, res) => {
  try {
    const { id } = req.params;

    const jobPosition = await prisma.jobPosition.findUnique({
      where: { id },
      include: {
        departamento: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        },
        employees: {
          select: {
            id: true,
            nombre: true,
            estatus: true,
            fechaAlta: true
          }
        }
      }
    });

    if (!jobPosition) {
      return res.status(404).json({ success: false, error: 'Puesto de trabajo no encontrado' });
    }

    res.json({ success: true, data: jobPosition });
  } catch (error) {
    console.error('Error getting job position:', error);
    res.status(500).json({ success: false, error: 'Error al obtener el puesto de trabajo' });
  }
};

// Crear un nuevo puesto de trabajo
exports.createJobPosition = async (req, res) => {
  try {
    const { 
      nombre, 
      descripcion, 
      nivelJerarquico = 'OPERATIVO', 
      estado = 'Activo', 
      departamentoId 
    } = req.body;

    // Validar campos requeridos
    if (!nombre) {
      return res.status(400).json({ success: false, error: 'El nombre del puesto es requerido' });
    }

    if (!departamentoId) {
      return res.status(400).json({ success: false, error: 'El departamento es requerido' });
    }

    // Verificar si el departamento existe
    const department = await prisma.department.findUnique({
      where: { id: departamentoId }
    });

    if (!department) {
      return res.status(400).json({ success: false, error: 'El departamento especificado no existe' });
    }

    // Verificar si ya existe un puesto con el mismo nombre en el mismo departamento
    const existingJobPosition = await prisma.jobPosition.findFirst({
      where: {
        nombre,
        departamentoId
      }
    });

    if (existingJobPosition) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ya existe un puesto con ese nombre en este departamento' 
      });
    }

    const jobPosition = await prisma.jobPosition.create({
      data: {
        nombre,
        descripcion,
        nivelJerarquico,
        estado,
        departamentoId
      },
      include: {
        departamento: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Puesto de trabajo creado exitosamente',
      data: jobPosition 
    });
  } catch (error) {
    console.error('Error creating job position:', error);
    res.status(500).json({ success: false, error: 'Error al crear el puesto de trabajo' });
  }
};

// Actualizar un puesto de trabajo
exports.updateJobPosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, nivelJerarquico, estado, departamentoId } = req.body;

    // Verificar si el puesto existe
    const existingJobPosition = await prisma.jobPosition.findUnique({
      where: { id }
    });

    if (!existingJobPosition) {
      return res.status(404).json({ success: false, error: 'Puesto de trabajo no encontrado' });
    }

    // Si se cambia el departamento, verificar que exista
    if (departamentoId && departamentoId !== existingJobPosition.departamentoId) {
      const department = await prisma.department.findUnique({
        where: { id: departamentoId }
      });

      if (!department) {
        return res.status(400).json({ success: false, error: 'El departamento especificado no existe' });
      }
    }

    // Si se cambia el nombre, verificar que no exista otro puesto con el mismo nombre en el mismo departamento
    const targetDepartamentoId = departamentoId || existingJobPosition.departamentoId;
    const targetNombre = nombre || existingJobPosition.nombre;

    if (targetNombre !== existingJobPosition.nombre || targetDepartamentoId !== existingJobPosition.departamentoId) {
      const jobPositionWithSameName = await prisma.jobPosition.findFirst({
        where: {
          nombre: targetNombre,
          departamentoId: targetDepartamentoId,
          NOT: { id }
        }
      });

      if (jobPositionWithSameName) {
        return res.status(400).json({ 
          success: false, 
          error: 'Ya existe otro puesto con ese nombre en este departamento' 
        });
      }
    }

    const jobPosition = await prisma.jobPosition.update({
      where: { id },
      data: {
        nombre: nombre || existingJobPosition.nombre,
        descripcion: descripcion !== undefined ? descripcion : existingJobPosition.descripcion,
        nivelJerarquico: nivelJerarquico || existingJobPosition.nivelJerarquico,
        estado: estado || existingJobPosition.estado,
        departamentoId: departamentoId || existingJobPosition.departamentoId
      },
      include: {
        departamento: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    res.json({ 
      success: true, 
      message: 'Puesto de trabajo actualizado exitosamente',
      data: jobPosition 
    });
  } catch (error) {
    console.error('Error updating job position:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el puesto de trabajo' });
  }
};

// Eliminar un puesto de trabajo
exports.deleteJobPosition = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el puesto existe
    const existingJobPosition = await prisma.jobPosition.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true
          }
        }
      }
    });

    if (!existingJobPosition) {
      return res.status(404).json({ success: false, error: 'Puesto de trabajo no encontrado' });
    }

    // Verificar si el puesto tiene empleados asociados
    if (existingJobPosition._count.employees > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se puede eliminar el puesto porque tiene empleados asociados',
        details: {
          employeesCount: existingJobPosition._count.employees
        }
      });
    }

    await prisma.jobPosition.delete({
      where: { id }
    });

    res.json({ 
      success: true, 
      message: 'Puesto de trabajo eliminado exitosamente',
      deletedJobPosition: {
        id: existingJobPosition.id,
        nombre: existingJobPosition.nombre
      }
    });
  } catch (error) {
    console.error('Error deleting job position:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar el puesto de trabajo' });
  }
};

// Obtener puestos de trabajo por departamento
exports.getJobPositionsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    // Verificar si el departamento existe
    const department = await prisma.department.findUnique({
      where: { id: departmentId }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: 'Departamento no encontrado' });
    }

    const jobPositions = await prisma.jobPosition.findMany({
      where: { 
        departamentoId: departmentId,
        estado: 'Activo'
      },
      select: {
        id: true,
        nombre: true,
        nivelJerarquico: true,
        descripcion: true
      },
      orderBy: { nombre: 'asc' }
    });

    res.json({ success: true, data: jobPositions });
  } catch (error) {
    console.error('Error getting job positions by department:', error);
    res.status(500).json({ success: false, error: 'Error al obtener los puestos de trabajo' });
  }
};

// Obtener estadísticas de la estructura organizacional
exports.getOrganizationStats = async (req, res) => {
  try {
    const [departmentsCount, jobPositionsCount, employeesCount] = await Promise.all([
      prisma.department.count(),
      prisma.jobPosition.count(),
      prisma.employee.count()
    ]);

    // Departamentos con más empleados
    const topDepartments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            employees: true
          }
        }
      },
      orderBy: {
        employees: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // Puestos más comunes
    const topJobPositions = await prisma.jobPosition.findMany({
      include: {
        _count: {
          select: {
            employees: true
          }
        },
        departamento: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        employees: {
          _count: 'desc'
        }
      },
      take: 5
    });

    res.json({
      success: true,
      data: {
        departmentsCount,
        jobPositionsCount,
        employeesCount,
        topDepartments,
        topJobPositions
      }
    });
  } catch (error) {
    console.error('Error getting organization stats:', error);
    res.status(500).json({ success: false, error: 'Error al obtener estadísticas de la organización' });
  }
};