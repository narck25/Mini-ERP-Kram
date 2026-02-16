const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const csv = require('csv-parser');
const { Readable } = require('stream');

// Obtener todos los empleados (solo para RH y ADMIN)
exports.getAllEmployees = async (req, res) => {
  try {
    // Verificar que el usuario sea RH o ADMIN
    if (!['RH', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado. Solo RH y ADMIN pueden ver empleados.' });
    }

    const { estatus, departamento_id, search } = req.query;
    
    const where = {};
    
    if (estatus) where.estatus = estatus;
    if (departamento_id) where.departamento_id = departamento_id;
    
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { rfc: { contains: search, mode: 'insensitive' } },
        { curp: { contains: search, mode: 'insensitive' } },
        { nss: { contains: search, mode: 'insensitive' } },
        { puesto: { contains: search, mode: 'insensitive' } }
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        departamento: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true
          }
        },
        documents: {
          select: {
            id: true,
            tipo_documento: true,
            url_archivo: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            documents: true,
            jobVacancies: true,
            jobVacanciesRH: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ employees });
  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({ error: 'Error al obtener los empleados' });
  }
};

// Obtener un empleado por ID
exports.getEmployeeById = async (req, res) => {
  try {
    // Verificar que el usuario sea RH o ADMIN
    if (!['RH', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado. Solo RH y ADMIN pueden ver empleados.' });
    }

    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        departamento: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true
          }
        },
        documents: {
          select: {
            id: true,
            tipo_documento: true,
            url_archivo: true,
            createdAt: true
          }
        },
        jobVacancies: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true
          }
        },
        jobVacanciesRH: {
          select: {
            id: true,
            titulo: true,
            estatus: true,
            createdAt: true
          }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    res.json({ employee });
  } catch (error) {
    console.error('Error getting employee:', error);
    res.status(500).json({ error: 'Error al obtener el empleado' });
  }
};

// Crear un nuevo empleado
exports.createEmployee = async (req, res) => {
  try {
    // Verificar que el usuario sea RH o ADMIN
    if (!['RH', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado. Solo RH y ADMIN pueden crear empleados.' });
    }

    const {
      nombre,
      rfc,
      curp,
      nss,
      fecha_ingreso,
      estatus,
      puesto,
      departamento_id,
      userId,
      salary
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !rfc || !curp || !nss || !fecha_ingreso || !puesto || !departamento_id) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Verificar si ya existe un empleado con el mismo RFC, CURP o NSS
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { rfc },
          { curp },
          { nss }
        ]
      }
    });

    if (existingEmployee) {
      return res.status(400).json({ 
        error: 'Ya existe un empleado con el mismo RFC, CURP o NSS' 
      });
    }

    // Si se proporciona userId, verificar que exista
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(400).json({ error: 'El usuario especificado no existe' });
      }

      // Verificar que el usuario no tenga ya un empleado asociado
      const existingEmployeeWithUser = await prisma.employee.findUnique({
        where: { userId }
      });

      if (existingEmployeeWithUser) {
        return res.status(400).json({ error: 'El usuario ya tiene un empleado asociado' });
      }
    }

    const employee = await prisma.employee.create({
      data: {
        nombre,
        rfc,
        curp,
        nss,
        fecha_ingreso: new Date(fecha_ingreso),
        estatus: estatus || 'Activo',
        puesto,
        departamento_id,
        userId,
        salary: salary ? parseFloat(salary) : null
      },
      include: {
        departamento: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Empleado creado exitosamente',
      employee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Error al crear el empleado' });
  }
};

// Actualizar un empleado
exports.updateEmployee = async (req, res) => {
  try {
    // Verificar que el usuario sea RH o ADMIN
    if (!['RH', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado. Solo RH y ADMIN pueden actualizar empleados.' });
    }

    const { id } = req.params;
    const {
      nombre,
      rfc,
      curp,
      nss,
      fecha_ingreso,
      estatus,
      puesto,
      departamento_id,
      userId,
      salary
    } = req.body;

    // Verificar si el empleado existe
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Verificar unicidad de RFC, CURP y NSS (excluyendo el empleado actual)
    if (rfc && rfc !== existingEmployee.rfc) {
      const existingRFC = await prisma.employee.findFirst({
        where: {
          rfc,
          NOT: { id }
        }
      });
      if (existingRFC) {
        return res.status(400).json({ error: 'Ya existe otro empleado con el mismo RFC' });
      }
    }

    if (curp && curp !== existingEmployee.curp) {
      const existingCURP = await prisma.employee.findFirst({
        where: {
          curp,
          NOT: { id }
        }
      });
      if (existingCURP) {
        return res.status(400).json({ error: 'Ya existe otro empleado con el mismo CURP' });
      }
    }

    if (nss && nss !== existingEmployee.nss) {
      const existingNSS = await prisma.employee.findFirst({
        where: {
          nss,
          NOT: { id }
        }
      });
      if (existingNSS) {
        return res.status(400).json({ error: 'Ya existe otro empleado con el mismo NSS' });
      }
    }

    // Si se cambia userId, verificar que no esté ya asociado a otro empleado
    if (userId && userId !== existingEmployee.userId) {
      const existingEmployeeWithUser = await prisma.employee.findFirst({
        where: {
          userId,
          NOT: { id }
        }
      });
      if (existingEmployeeWithUser) {
        return res.status(400).json({ error: 'El usuario ya está asociado a otro empleado' });
      }
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        nombre: nombre || existingEmployee.nombre,
        rfc: rfc || existingEmployee.rfc,
        curp: curp || existingEmployee.curp,
        nss: nss || existingEmployee.nss,
        fecha_ingreso: fecha_ingreso ? new Date(fecha_ingreso) : existingEmployee.fecha_ingreso,
        estatus: estatus || existingEmployee.estatus,
        puesto: puesto || existingEmployee.puesto,
        departamento_id: departamento_id || existingEmployee.departamento_id,
        userId: userId !== undefined ? userId : existingEmployee.userId,
        salary: salary !== undefined ? parseFloat(salary) : existingEmployee.salary
      },
      include: {
        departamento: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    res.json({
      message: 'Empleado actualizado exitosamente',
      employee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Error al actualizar el empleado' });
  }
};

// Eliminar un empleado (baja lógica)
exports.deleteEmployee = async (req, res) => {
  try {
    // Verificar que el usuario sea RH o ADMIN
    if (!['RH', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado. Solo RH y ADMIN pueden eliminar empleados.' });
    }

    const { id } = req.params;

    // Verificar si el empleado existe
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Realizar baja lógica (cambiar estatus a Inactivo)
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        estatus: 'Inactivo'
      }
    });

    res.json({
      message: 'Empleado dado de baja exitosamente',
      employee
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Error al dar de baja al empleado' });
  }
};

// Importar empleados desde CSV
exports.importEmployees = async (req, res) => {
  try {
    // Verificar que el usuario sea RH o ADMIN
    if (!['RH', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado. Solo RH y ADMIN pueden importar empleados.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo CSV' });
    }

    const results = [];
    const errors = [];
    const buffer = req.file.buffer;
    const stream = Readable.from(buffer.toString());

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    const importedEmployees = [];
    
    for (const row of results) {
      try {
        // Validar campos requeridos
        if (!row.nombre || !row.rfc || !row.curp || !row.nss || !row.fecha_ingreso || !row.puesto || !row.departamento_id) {
          errors.push(`Fila ${results.indexOf(row) + 1}: Faltan campos requeridos`);
          continue;
        }

        // Verificar si ya existe un empleado con el mismo RFC, CURP o NSS
        const existingEmployee = await prisma.employee.findFirst({
          where: {
            OR: [
              { rfc: row.rfc },
              { curp: row.curp },
              { nss: row.nss }
            ]
          }
        });

        if (existingEmployee) {
          errors.push(`Fila ${results.indexOf(row) + 1}: Ya existe un empleado con el mismo RFC, CURP o NSS`);
          continue;
        }

        // Buscar departamento por nombre si no se proporciona ID
        let departamento_id = row.departamento_id;
        if (!departamento_id && row.departamento_nombre) {
          const departamento = await prisma.department.findFirst({
            where: { nombre: row.departamento_nombre }
          });
          if (departamento) {
            departamento_id = departamento.id;
          } else {
            errors.push(`Fila ${results.indexOf(row) + 1}: Departamento no encontrado`);
            continue;
          }
        }

        const employee = await prisma.employee.create({
          data: {
            nombre: row.nombre,
            rfc: row.rfc,
            curp: row.curp,
            nss: row.nss,
            fecha_ingreso: new Date(row.fecha_ingreso),
            estatus: row.estatus || 'Activo',
            puesto: row.puesto,
            departamento_id,
            salary: row.salary ? parseFloat(row.salary) : null
          }
        });

        importedEmployees.push(employee);
      } catch (error) {
        errors.push(`Fila ${results.indexOf(row) + 1}: ${error.message}`);
      }
    }

    res.json({
      message: `Importación completada. ${importedEmployees.length} empleados importados exitosamente.`,
      imported: importedEmployees.length,
      errors: errors.length,
      errorDetails: errors
    });
  } catch (error) {
    console.error('Error importing employees:', error);
    res.status(500).json({ error: 'Error al importar empleados' });
  }
};

// Exportar empleados a CSV
exports.exportEmployees = async (req, res) => {
  try {
    // Verificar que el usuario sea RH o ADMIN
    if (!['RH', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado. Solo RH y ADMIN pueden exportar empleados.' });
    }

    const { estatus, departamento_id } = req.query;
    
    const where = {};
    if (estatus) where.estatus = estatus;
    if (departamento_id) where.departamento_id = departamento_id;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        departamento: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    // Convertir a CSV
    const csvData = [];
    
    // Encabezados
    csvData.push([
      'nombre',
      'rfc',
      'curp',
      'nss',
      'fecha_ingreso',
      'estatus',
      'puesto',
      'departamento',
      'salary'
    ].join(','));

    // Datos
    employees.forEach(employee => {
      csvData.push([
        `"${employee.nombre}"`,
        `"${employee.rfc}"`,
        `"${employee.curp}"`,
        `"${employee.nss}"`,
        `"${employee.fecha_ingreso.toISOString().split('T')[0]}"`,
        `"${employee.estatus}"`,
        `"${employee.puesto}"`,
        `"${employee.departamento?.nombre || ''}"`,
        employee.salary || ''
      ].join(','));
    });

    const csvString = csvData.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=empleados.csv');
    res.send(csvString);
  } catch (error) {
    console.error('Error exporting employees:', error);
    res.status(500).json({ error: 'Error al exportar empleados' });
  }
};

// Obtener estadísticas de empleados
exports.getEmployeeStats = async (req, res) => {
  try {
    // Verificar que el usuario sea RH o ADMIN
    if (!['RH', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado. Solo RH y ADMIN pueden ver estadísticas.' });
    }

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
