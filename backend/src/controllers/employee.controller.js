const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const csv = require('csv-parser');
const { Readable } = require('stream');
const { mapEmployeeFromCsv, validateEmployeeData, prepareForPrisma } = require('../utils/csvMapper');

// Obtener todos los empleados con reglas de visibilidad basadas en jerarquía
exports.getAllEmployees = async (req, res) => {
  try {
    const { estatus, departamento_id, search } = req.query;
    const user = req.user;
    
    // Inicializar objeto where
    const where = {};
    
    // Aplicar reglas de visibilidad basadas en jerarquía
    if (user.role === 'ADMIN' || user.role === 'RH') {
      // ADMIN o Recursos Humanos: Ver todos los empleados
      // No se aplican restricciones adicionales
      console.log(`🔍 ADMIN/RH (${user.role}): Mostrando todos los empleados`);
    } else if (user.employeeNivelJerarquico && user.employeeId) {
      // Usuario tiene empleado asociado y nivel jerárquico
      const nivelJerarquico = user.employeeNivelJerarquico;
      const employeeId = user.employeeId;
      const departamentoId = user.employeeDepartamentoId;
      
      console.log(`🔍 Usuario ${user.name} (${user.role}) - Empleado ID: ${employeeId}, Nivel: ${nivelJerarquico}, Depto: ${departamentoId}`);
      
      if (nivelJerarquico === 'GERENTE' || nivelJerarquico === 'DIRECTOR' || 
          nivelJerarquico === 'VICEPRESIDENTE' || nivelJerarquico === 'PRESIDENTE') {
        // GERENTE / DIRECTOR o superior: Ver empleados de su mismo departamento
        if (departamentoId) {
          where.departamento_id = departamentoId;
          console.log(`🔍 ${nivelJerarquico}: Mostrando empleados del departamento ${departamentoId}`);
        } else {
          // Si no tiene departamento asignado, solo ver su propio registro
          where.id = employeeId;
          console.log(`🔍 ${nivelJerarquico} sin departamento: Mostrando solo su propio registro`);
        }
      } else if (nivelJerarquico === 'SUPERVISOR') {
        // SUPERVISOR: Ver su propio registro y empleados que le reportan directamente
        where.OR = [
          { id: employeeId }, // Su propio registro
          { reportaAId: employeeId } // Empleados que le reportan
        ];
        console.log(`🔍 SUPERVISOR: Mostrando su registro (${employeeId}) y empleados que le reportan`);
      } else if (nivelJerarquico === 'OPERATIVO') {
        // OPERATIVO: Solo ver su propio registro
        where.id = employeeId;
        console.log(`🔍 OPERATIVO: Mostrando solo su propio registro (${employeeId})`);
      } else {
        // Nivel no reconocido: Por seguridad, solo ver su propio registro
        where.id = employeeId;
        console.log(`🔍 Nivel no reconocido (${nivelJerarquico}): Mostrando solo su propio registro`);
      }
    } else {
      // Usuario sin empleado asociado: Por seguridad, no mostrar nada
      where.id = null; // Esto no devolverá resultados
      console.log(`🔍 Usuario sin empleado asociado: No mostrando empleados`);
    }
    
    // Aplicar filtros adicionales del usuario (si existen)
    if (estatus) where.estatus = estatus;
    if (departamento_id) where.departamento_id = departamento_id;
    
    // Aplicar búsqueda si se proporciona
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { rfc: { contains: search, mode: 'insensitive' } },
        { curp: { contains: search, mode: 'insensitive' } },
        { nss: { contains: search, mode: 'insensitive' } },
        { puesto: { nombre: { contains: search, mode: 'insensitive' } } }
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
        puesto: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            nivelJerarquico: true
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
            jobVacancies: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`🔍 Total empleados encontrados: ${employees.length}`);
    res.json({ employees });
  } catch (error) {
    console.error('Error getting employees:', error);
    console.error('Error Prisma:', error);
    res.status(500).json({ error: 'Error al obtener los empleados' });
  }
};

// Obtener el empleado actual (basado en el usuario autenticado)
exports.getCurrentEmployee = async (req, res) => {
  try {
    const userId = req.user.id;

    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: {
        departamento: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        },
        puesto: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            nivelJerarquico: true
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
            titulo: true,
            createdAt: true,
            jobPosition: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Empleado no encontrado para el usuario actual' });
    }

    res.json({ employee });
  } catch (error) {
    console.error('Error getting current employee:', error);
    console.error('Error Prisma:', error);
    res.status(500).json({ error: 'Error al obtener el empleado actual' });
  }
};

// Obtener un empleado por ID
exports.getEmployeeById = async (req, res) => {
  try {
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
        puesto: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            nivelJerarquico: true
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
            titulo: true,
            createdAt: true,
            jobPosition: {
              select: {
                nombre: true
              }
            }
          }
        },
        // Información de jerarquía (NUEVO)
        reportaA: {
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
            nivelJerarquico: true
          }
        },
        subordinados: {
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
            nivelJerarquico: true
          }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    res.json({ employee });
  } catch (error) {
    console.error('🔥 ERROR PRISMA getEmployeeById:', error.message || error);
    console.error('🔥 Error stack:', error.stack);
    console.error('🔥 Employee ID requested:', req.params.id);
    res.status(500).json({ error: 'Error al obtener el empleado', details: error.message });
  }
};

// Crear un nuevo empleado
exports.createEmployee = async (req, res) => {
  try {
    console.log("📥 Payload recibido en createEmployee:", JSON.stringify(req.body, null, 2));
    
    const {
      // Datos Personales
      clave,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      fechaNacimiento,
      lugarNacimiento,
      estadoCivil,
      nacionalidad,
      sexo,
      nivelAcademico,
      
      // Contacto y Dirección
      telefonoCasa,
      telefonoMovil,
      correoElectronico,
      correoEmpresa,
      direccionCompleta,
      estado,
      cpFiscal,
      
      // Datos Legales
      rfc,
      curp,
      nss,
      
      // Datos Laborales
      fecha_ingreso,
      fechaBaja,
      estatus,
      sucursal,
      area,
      region,
      contrato,
      horario,
      puestoId,
      departamento_id,
      
      // Datos Financieros
      salary,
      clabe,
      numeroCuenta,
      banco,
      
      // Nuevos campos: Jefe Directo, SD, SDI
      jefeDirecto,
      sd,
      sdi,
      
      // Campos de jerarquía (NUEVOS)
      nivelJerarquico,
      reportaAId,
      
      // Uniformes y Extras
      tallaCamisa,
      tallaPlayera,
      tallaPantalon,
      tallaZapatos,
      nombreConyuge,
      
      // Beneficiarios
      beneficiario1,
      fechaNacBeneficiario1,
      porcentaje1,
      beneficiario2,
      fechaNacBeneficiario2,
      porcentaje2,
      
      // Relación con usuario
      userId
    } = req.body;

    // Validar campos requeridos
    if (!rfc || !curp || !nss || !fecha_ingreso || !puestoId || !departamento_id) {
      return res.status(400).json({ error: 'Faltan campos requeridos: RFC, CURP, NSS, fecha_ingreso, puestoId, departamento_id' });
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
    if (userId && userId.trim() !== '') {
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

    // Preparar datos para creación
    const employeeData = {
      // Datos Personales
      clave: clave || null,
      nombre: nombres || null, // Cambiado de nombres a nombre
      nombres: nombres || null,
      apellidoPaterno: apellidoPaterno || null,
      apellidoMaterno: apellidoMaterno || null,
      fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
      lugarNacimiento: lugarNacimiento || null,
      estadoCivil: estadoCivil || null,
      nacionalidad: nacionalidad || null,
      sexo: sexo || null,
      nivelAcademico: nivelAcademico || null,
      
      // Contacto y Dirección
      telefonoCasa: telefonoCasa || null,
      telefonoMovil: telefonoMovil || null,
      correoElectronico: correoElectronico || null,
      correoEmpresa: correoEmpresa || null,
      direccionCompleta: direccionCompleta || null,
      estado: estado || null,
      cpFiscal: cpFiscal || null,
      
      // Datos Legales
      rfc,
      curp,
      nss,
      
      // Datos Laborales
      fechaAlta: new Date(fecha_ingreso),
      fechaBaja: fechaBaja ? new Date(fechaBaja) : null,
      estatus: estatus || 'Activo',
      sucursal: sucursal || null,
      area: area || null,
      region: region || null,
      contrato: contrato || null,
      horario: horario || null,
      
      // Datos Financieros
      salarioMensual: salary && salary !== '' ? parseFloat(salary) : null,
      clabe: clabe || null,
      numeroCuenta: numeroCuenta || null,
      banco: banco || null,
      
      // Nuevos campos: Jefe Directo, SD, SDI
      jefeDirecto: jefeDirecto || null,
      sd: sd && sd !== '' ? parseFloat(sd) : null,
      sdi: sdi && sdi !== '' ? parseFloat(sdi) : null,
      
      // Campos de jerarquía (NUEVOS)
      nivelJerarquico: nivelJerarquico || 'OPERATIVO',
      
      // Uniformes y Extras
      tallaCamisa: tallaCamisa || null,
      tallaPlayera: tallaPlayera || null,
      tallaPantalon: tallaPantalon || null,
      tallaZapatos: tallaZapatos || null,
      nombreConyuge: nombreConyuge || null,
      
      // Beneficiarios
      beneficiario1: beneficiario1 || null,
      fechaNacBeneficiario1: fechaNacBeneficiario1 ? new Date(fechaNacBeneficiario1) : null,
      porcentaje1: porcentaje1 && porcentaje1 !== '' ? parseFloat(porcentaje1) : null,
      beneficiario2: beneficiario2 || null,
      fechaNacBeneficiario2: fechaNacBeneficiario2 ? new Date(fechaNacBeneficiario2) : null,
      porcentaje2: porcentaje2 && porcentaje2 !== '' ? parseFloat(porcentaje2) : null,
    };

    // Agregar relaciones solo si existen
    if (puestoId) {
      employeeData.puesto = {
        connect: { id: puestoId }
      };
    }

    if (departamento_id) {
      employeeData.departamento = {
        connect: { id: departamento_id }
      };
    }

    if (userId && userId.trim() !== '') {
      employeeData.user = {
        connect: { id: userId }
      };
    }

    // Agregar relación reportaA si se proporciona reportaAId
    if (reportaAId && reportaAId.trim() !== '') {
      employeeData.reportaA = {
        connect: { id: reportaAId }
      };
    }

    console.log("📝 Datos preparados para crear empleado:", JSON.stringify(employeeData, null, 2));

    const employee = await prisma.employee.create({
      data: employeeData,
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
    console.error('❌ Error creating employee:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Error al crear el empleado', details: error.message });
  }
};

// Actualizar un empleado
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      // Datos Personales
      clave,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      fechaNacimiento,
      lugarNacimiento,
      estadoCivil,
      nacionalidad,
      sexo,
      nivelAcademico,
      
      // Contacto y Dirección
      telefonoCasa,
      telefonoMovil,
      correoElectronico,
      correoEmpresa,
      direccionCompleta,
      estado,
      cpFiscal,
      
      // Datos Legales
      rfc,
      curp,
      nss,
      
      // Datos Laborales
      fecha_ingreso,
      fechaBaja,
      estatus,
      sucursal,
      area,
      region,
      contrato,
      horario,
      puestoId,
      departamento_id,
      
      // Datos Financieros
      salary,
      clabe,
      numeroCuenta,
      banco,
      
      // Nuevos campos: Jefe Directo, SD, SDI
      jefeDirecto,
      sd,
      sdi,
      
      // Campos de jerarquía (NUEVOS)
      nivelJerarquico,
      reportaAId,
      
      // Uniformes y Extras
      tallaCamisa,
      tallaPlayera,
      tallaPantalon,
      tallaZapatos,
      nombreConyuge,
      
      // Beneficiarios
      beneficiario1,
      fechaNacBeneficiario1,
      porcentaje1,
      beneficiario2,
      fechaNacBeneficiario2,
      porcentaje2,
      
      // Relación con usuario
      userId
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

    // Preparar datos para actualización
    const updateData = {
      // Datos Personales
      clave: clave !== undefined ? clave : existingEmployee.clave,
      nombre: nombres !== undefined ? nombres : existingEmployee.nombre, // Cambiado de nombres a nombre
      nombres: nombres !== undefined ? nombres : existingEmployee.nombres,
      apellidoPaterno: apellidoPaterno !== undefined ? apellidoPaterno : existingEmployee.apellidoPaterno,
      apellidoMaterno: apellidoMaterno !== undefined ? apellidoMaterno : existingEmployee.apellidoMaterno,
      fechaNacimiento: fechaNacimiento !== undefined ? (fechaNacimiento ? new Date(fechaNacimiento) : null) : existingEmployee.fechaNacimiento,
      lugarNacimiento: lugarNacimiento !== undefined ? lugarNacimiento : existingEmployee.lugarNacimiento,
      estadoCivil: estadoCivil !== undefined ? estadoCivil : existingEmployee.estadoCivil,
      nacionalidad: nacionalidad !== undefined ? nacionalidad : existingEmployee.nacionalidad,
      sexo: sexo !== undefined ? sexo : existingEmployee.sexo,
      nivelAcademico: nivelAcademico !== undefined ? nivelAcademico : existingEmployee.nivelAcademico,
      
      // Contacto y Dirección
      telefonoCasa: telefonoCasa !== undefined ? telefonoCasa : existingEmployee.telefonoCasa,
      telefonoMovil: telefonoMovil !== undefined ? telefonoMovil : existingEmployee.telefonoMovil,
      correoElectronico: correoElectronico !== undefined ? correoElectronico : existingEmployee.correoElectronico,
      correoEmpresa: correoEmpresa !== undefined ? correoEmpresa : existingEmployee.correoEmpresa,
      direccionCompleta: direccionCompleta !== undefined ? direccionCompleta : existingEmployee.direccionCompleta,
      estado: estado !== undefined ? estado : existingEmployee.estado,
      cpFiscal: cpFiscal !== undefined ? cpFiscal : existingEmployee.cpFiscal,
      
      // Datos Legales
      rfc: rfc !== undefined ? rfc : existingEmployee.rfc,
      curp: curp !== undefined ? curp : existingEmployee.curp,
      nss: nss !== undefined ? nss : existingEmployee.nss,
      
      // Datos Laborales
      fechaAlta: fecha_ingreso !== undefined ? (fecha_ingreso ? new Date(fecha_ingreso) : existingEmployee.fechaAlta) : existingEmployee.fechaAlta,
      fechaBaja: fechaBaja !== undefined ? (fechaBaja ? new Date(fechaBaja) : null) : existingEmployee.fechaBaja,
      estatus: estatus !== undefined ? estatus : existingEmployee.estatus,
      sucursal: sucursal !== undefined ? sucursal : existingEmployee.sucursal,
      area: area !== undefined ? area : existingEmployee.area,
      region: region !== undefined ? region : existingEmployee.region,
      contrato: contrato !== undefined ? contrato : existingEmployee.contrato,
      horario: horario !== undefined ? horario : existingEmployee.horario,
      puesto: puestoId !== undefined ? (puestoId ? {
        connect: { id: puestoId }
      } : {
        disconnect: true
      }) : undefined,
      departamento: departamento_id !== undefined ? {
        connect: departamento_id ? { id: departamento_id } : undefined,
        disconnect: !departamento_id && existingEmployee.departamento_id ? true : undefined
      } : undefined,
      
      // Datos Financieros
      salarioMensual: salary !== undefined ? (salary && salary !== '' ? parseFloat(salary) : null) : existingEmployee.salarioMensual,
      clabe: clabe !== undefined ? clabe : existingEmployee.clabe,
      numeroCuenta: numeroCuenta !== undefined ? numeroCuenta : existingEmployee.numeroCuenta,
      banco: banco !== undefined ? banco : existingEmployee.banco,
      
      // Nuevos campos: Jefe Directo, SD, SDI
      jefeDirecto: jefeDirecto !== undefined ? jefeDirecto : existingEmployee.jefeDirecto,
      sd: sd !== undefined ? (sd && sd !== '' ? parseFloat(sd) : null) : existingEmployee.sd,
      sdi: sdi !== undefined ? (sdi && sdi !== '' ? parseFloat(sdi) : null) : existingEmployee.sdi,
      
      // Campos de jerarquía (NUEVOS)
      nivelJerarquico: nivelJerarquico !== undefined ? nivelJerarquico : existingEmployee.nivelJerarquico,
      reportaAId: reportaAId !== undefined ? reportaAId : existingEmployee.reportaAId,
      
      // Uniformes y Extras
      tallaCamisa: tallaCamisa !== undefined ? tallaCamisa : existingEmployee.tallaCamisa,
      tallaPlayera: tallaPlayera !== undefined ? tallaPlayera : existingEmployee.tallaPlayera,
      tallaPantalon: tallaPantalon !== undefined ? tallaPantalon : existingEmployee.tallaPantalon,
      tallaZapatos: tallaZapatos !== undefined ? tallaZapatos : existingEmployee.tallaZapatos,
      nombreConyuge: nombreConyuge !== undefined ? nombreConyuge : existingEmployee.nombreConyuge,
      
      // Beneficiarios
      beneficiario1: beneficiario1 !== undefined ? beneficiario1 : existingEmployee.beneficiario1,
      fechaNacBeneficiario1: fechaNacBeneficiario1 !== undefined ? (fechaNacBeneficiario1 ? new Date(fechaNacBeneficiario1) : null) : existingEmployee.fechaNacBeneficiario1,
      porcentaje1: porcentaje1 !== undefined ? (porcentaje1 && porcentaje1 !== '' ? parseFloat(porcentaje1) : null) : existingEmployee.porcentaje1,
      beneficiario2: beneficiario2 !== undefined ? beneficiario2 : existingEmployee.beneficiario2,
      fechaNacBeneficiario2: fechaNacBeneficiario2 !== undefined ? (fechaNacBeneficiario2 ? new Date(fechaNacBeneficiario2) : null) : existingEmployee.fechaNacBeneficiario2,
      porcentaje2: porcentaje2 !== undefined ? (porcentaje2 && porcentaje2 !== '' ? parseFloat(porcentaje2) : null) : existingEmployee.porcentaje2,
      
      // Relación con usuario
      user: userId !== undefined ? {
        connect: userId ? { id: userId } : undefined,
        disconnect: !userId && existingEmployee.userId ? true : undefined
      } : undefined
    };

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
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
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Error al actualizar el empleado', details: error.message });
  }
};

// Eliminar un empleado (baja lógica)
exports.deleteEmployee = async (req, res) => {
  try {
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

// Eliminar permanentemente un empleado
exports.deleteEmployeePermanently = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el empleado existe
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Verificar si el empleado tiene documentos asociados
    const documentsCount = await prisma.employeeDocument.count({
      where: { employee_id: id }
    });

    // Verificar si el empleado tiene vacantes de trabajo asociadas
    const jobVacanciesCount = await prisma.jobVacancy.count({
      where: { 
        OR: [
          { solicitanteId: id },
          { autorizadoPorId: id },
          { voBoPorId: id }
        ]
      }
    });

    // Si tiene documentos o vacantes asociadas, no permitir eliminación
    if (documentsCount > 0 || jobVacanciesCount > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el empleado permanentemente porque tiene documentos o vacantes de trabajo asociadas',
        details: {
          documentsCount,
          jobVacanciesCount
        }
      });
    }

    // Eliminar permanentemente el empleado
    await prisma.employee.delete({
      where: { id }
    });

    res.json({
      message: 'Empleado eliminado permanentemente exitosamente',
      deletedEmployee: {
        id: existingEmployee.id,
        nombre: existingEmployee.nombre,
        rfc: existingEmployee.rfc
      }
    });
  } catch (error) {
    console.error('Error deleting employee permanently:', error);
    res.status(500).json({ error: 'Error al eliminar el empleado permanentemente' });
  }
};

// Importar empleados desde CSV
exports.importEmployees = async (req, res) => {
  let transaction;
  try {
    console.log('📥 Import employees called');
    console.log('📥 User:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
    console.log('📥 Request file:', req.file);
    console.log('📥 Request headers:', req.headers);
    
    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(400).json({ error: 'No se proporcionó archivo CSV' });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer.length
    });

    const results = [];
    const errors = [];
    const buffer = req.file.buffer;
    const stream = Readable.from(buffer.toString());

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv({
          mapHeaders: ({ header }) => header.trim(),
          mapValues: ({ value }) => value.trim()
        }))
        .on('data', (data) => {
          // Usar nuestro helper para mapear los datos del CSV
          const employeeData = mapEmployeeFromCsv(data, prisma);
          results.push(employeeData);
        })
        .on('end', resolve)
        .on('error', (error) => {
          reject(new Error(`Error al parsear CSV: ${error.message}`));
        });
    });

    if (results.length === 0) {
      return res.status(400).json({ error: 'El archivo CSV está vacío o no contiene datos válidos' });
    }

    // Validar duplicados dentro del archivo
    const seenRFCs = new Set();
    const seenCURPs = new Set();
    const seenNSSs = new Set();
    
    for (let i = 0; i < results.length; i++) {
      const employeeData = results[i];
      const rowNumber = i + 1;

      // Validar datos usando nuestro helper
      const validationErrors = validateEmployeeData(employeeData, rowNumber);
      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
        continue;
      }

      // Validar duplicados dentro del archivo
      if (seenRFCs.has(employeeData.rfc)) {
        errors.push(`Fila ${rowNumber}: RFC duplicado dentro del archivo: ${employeeData.rfc}`);
        continue;
      }
      if (seenCURPs.has(employeeData.curp)) {
        errors.push(`Fila ${rowNumber}: CURP duplicado dentro del archivo: ${employeeData.curp}`);
        continue;
      }
      if (seenNSSs.has(employeeData.nss)) {
        errors.push(`Fila ${rowNumber}: NSS duplicado dentro del archivo: ${employeeData.nss}`);
        continue;
      }
      
      seenRFCs.add(employeeData.rfc);
      seenCURPs.add(employeeData.curp);
      seenNSSs.add(employeeData.nss);
    }

    // Si hay errores de validación, no proceder con la importación
    if (errors.length > 0) {
      console.log('❌ Errores de validación encontrados:', errors);
      return res.status(400).json({
        error: 'Errores de validación encontrados',
        errors: errors,
        summary: {
          totalRows: results.length,
          successful: 0,
          failed: errors.length,
          successRate: '0%'
        }
      });
    }

    // Iniciar transacción para importación atómica
    transaction = await prisma.$transaction(async (tx) => {
      const importedEmployees = [];
      const batchErrors = [];
      
      // Verificar duplicados en la base de datos antes de insertar
      for (let i = 0; i < results.length; i++) {
        const employeeData = results[i];
        const rowNumber = i + 1;
        
        try {
          // Verificar si ya existe un empleado con el mismo RFC, CURP o NSS
          const existingEmployee = await tx.employee.findFirst({
            where: {
              OR: [
                { rfc: employeeData.rfc },
                { curp: employeeData.curp },
                { nss: employeeData.nss }
              ]
            }
          });

          if (existingEmployee) {
            batchErrors.push(`Fila ${rowNumber}: Ya existe un empleado en la base de datos con el mismo RFC, CURP o NSS`);
            continue;
          }

          // Preparar datos para inserción usando nuestro helper
          const dataToInsert = await prepareForPrisma(employeeData, tx);

          const employee = await tx.employee.create({
            data: dataToInsert
          });

          importedEmployees.push({
            id: employee.id,
            nombre: employee.nombre,
            rfc: employee.rfc,
            curp: employee.curp,
            nss: employee.nss
          });
        } catch (error) {
          batchErrors.push(`Fila ${rowNumber}: Error al crear empleado - ${error.message}`);
        }
      }

      // Si hay errores durante la transacción, lanzar excepción para rollback
      if (batchErrors.length > 0) {
        throw new Error(`Errores durante la importación: ${batchErrors.join('; ')}`);
      }

      return importedEmployees;
    });

    res.json({
      message: `Importación completada exitosamente. ${transaction.length} empleados importados.`,
      imported: transaction.length,
      errors: 0,
      importedEmployees: transaction,
      summary: {
        totalRows: results.length,
        successful: transaction.length,
        failed: 0,
        successRate: results.length > 0 ? ((transaction.length / results.length) * 100).toFixed(2) + '%' : '0%'
      }
    });
  } catch (error) {
    console.error('Error importing employees:', error);
    
    // Si hay una transacción activa, se hará rollback automáticamente
    
    if (error.message.includes('Errores durante la importación')) {
      return res.status(400).json({
        error: 'Error durante la importación',
        message: 'No se importó ningún empleado debido a errores. Se realizó rollback de todos los cambios.',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Error al importar empleados',
      message: error.message 
    });
  }
};

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

// Descargar plantilla CSV para importación
exports.downloadImportTemplate = async (req, res) => {
  try {
    // Encabezados de la plantilla con todas las nuevas columnas
    const headers = [
      // Datos Personales
      'CLAVE',
      'NOMBRES',
      'APELLIDO PATERNO',
      'APELLIDO MATERNO',
      'FECHA NACIMIENTO',
      'LUGAR NACIMIENTO',
      'ESTADO CIVIL',
      'NACIONALIDAD',
      'SEXO',
      'NIVEL ACADEMICO',
      
      // Contacto y Dirección
      'TELEFONO CASA',
      'TELEFONO MOVIL',
      'CORREO ELECTRONICO',
      'CORREO EMPRESA',
      'DIRECCION COMPLETA',
      'ESTADO',
      'CP FISCAL',
      
      // Datos Legales
      'RFC',
      'CURP',
      'NSS',
      
      // Datos Laborales
      'FECHA ALTA',
      'FECHA BAJA',
      'ESTATUS',
      'SUCURSAL',
      'AREA',
      'REGION',
      'CONTRATO',
      'HORARIO',
      'PUESTO',
      'DEPARTAMENTO',
      
      // Datos Financieros
      'SALARIO MENSUAL',
      'CLABE',
      'NUMERO CUENTA',
      'BANCO',
      
      // Nuevos campos: Jefe Directo, SD, SDI
      'JEFE DIRECTO',
      'SD',
      'SDI',
      
      // Uniformes y Extras
      'TALLA CAMISA',
      'TALLA PLAYERA',
      'TALLA PANTALON',
      'TALLA ZAPATOS',
      'NOMBRE CONYUGE',
      
      // Beneficiarios
      'BENEFICIARIO 1',
      'FECHA NAC BENEFICIARIO 1',
      'PORCENTAJE 1',
      'BENEFICIARIO 2',
      'FECHA NAC BENEFICIARIO 2',
      'PORCENTAJE 2'
    ];
    
    // Datos de ejemplo
    const exampleData = [
      // Datos Personales
      'EMP001',
      'Juan',
      'Pérez',
      'López',
      '1980-01-01',
      'Ciudad de México',
      'Casado',
      'Mexicana',
      'Masculino',
      'Licenciatura',
      
      // Contacto y Dirección
      '5551234567',
      '5559876543',
      'juan.perez@email.com',
      'juan.perez@empresa.com',
      'Calle Principal 123, Colonia Centro',
      'Ciudad de México',
      '06000',
      
      // Datos Legales
      'PELJ800101ABC',
      'PELJ800101HDFRPN09',
      '12345678901',
      
      // Datos Laborales
      '2024-01-15',
      '',
      'Activo',
      'Sucursal Centro',
      'TI',
      'Centro',
      'Indeterminado',
      '9:00-18:00',
      'Desarrollador Senior',
      'Sistemas',
      
      // Datos Financieros
      '25000.00',
      '012180001234567890',
      '1234567890',
      'Banco Ejemplo',
      
      // Nuevos campos: Jefe Directo, SD, SDI
      'María Rodríguez',
      '833.33',
      '900.00',
      
      // Uniformes y Extras
      'M',
      'M',
      '32',
      '9',
      'María González',
      
      // Beneficiarios
      'Ana Pérez González',
      '2010-05-15',
      '50',
      'Carlos Pérez González',
      '2012-08-20',
      '50'
    ];
    
    // Función para escapar valores CSV
    const escapeCSV = (value) => {
      if (value === null || value === undefined || value === '') return '';
      const stringValue = String(value);
      // Si el valor contiene comillas, comas o saltos de línea, encerrar en comillas
      if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };
    
    // Crear contenido CSV con BOM para UTF-8
    const csvContent = [
      '\ufeff' + headers.map(escapeCSV).join(','),
      exampleData.map(escapeCSV).join(','),
      '',
      'NOTAS IMPORTANTES:',
      '1. Las fechas deben estar en formato YYYY-MM-DD o DD/MM/YYYY',
      '2. ESTATUS puede ser "Activo" o "Inactivo"',
      '3. DEPARTAMENTO debe ser el NOMBRE de un departamento existente (ej: Sistemas, RH, Administración)',
      '4. SALARIO MENSUAL debe ser un número decimal (ej. 25000.00)',
      '5. PORCENTAJE 1 y PORCENTAJE 2 deben ser números entre 0 y 100',
      '6. RFC debe tener exactamente 13 caracteres',
      '7. CURP debe tener exactamente 18 caracteres',
      '8. NSS debe tener exactamente 11 dígitos',
      '9. Los campos marcados con * son obligatorios: RFC, CURP, NSS, FECHA ALTA, PUESTO',
      '10. Use comillas dobles (") para valores que contengan comas o saltos de línea',
      '11. Para incluir comillas dobles dentro de un valor, escríbalas como "" (dos comillas)',
      '',
      'CAMPOS OBLIGATORIOS:',
      '- RFC (13 caracteres)',
      '- CURP (18 caracteres)',
      '- NSS (11 dígitos)',
      '- FECHA ALTA (YYYY-MM-DD o DD/MM/YYYY)',
      '- PUESTO',
      '',
      'CAMPOS OPCIONALES:',
      '- Todos los demás campos pueden dejarse vacíos',
      '- FECHA BAJA solo para empleados inactivos',
      '- DEPARTAMENTO puede dejarse vacío si no hay departamento asignado',
      '',
      'DEPARTAMENTOS DISPONIBLES (puede usar nombre o ID numérico):',
      '- 1 = Sistemas',
      '- 2 = Compras',
      '- 3 = RH',
      '- 4 = Administración',
      '- 5 = Ventas',
      '- 6 = Marketing',
      '- 7 = Producción',
      '',
      'NOTA: Puede usar el nombre del departamento (ej: "Sistemas") o el ID numérico (ej: "1")'
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_importacion_empleados_completa.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('Error downloading import template:', error);
    res.status(500).json({ error: 'Error al descargar la plantilla de importación' });
  }
};

// Exportar empleados a CSV
exports.exportEmployees = async (req, res) => {
  try {
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
        },
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Encabezados del CSV
    const headers = [
      'ID',
      'Nombre',
      'RFC',
      'CURP',
      'NSS',
      'Fecha Ingreso',
      'Estatus',
      'Puesto',
      'Departamento',
      'Email',
      'Usuario Asociado',
      'Salario',
      'Jefe Directo',
      'SD',
      'SDI',
      'Fecha Creación'
    ];

    // Función para escapar valores CSV
    const escapeCSV = (value) => {
      if (value === null || value === undefined || value === '') return '';
      const stringValue = String(value);
      // Si el valor contiene comillas, comas o saltos de línea, encerrar en comillas
      if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Crear filas de datos
    const rows = employees.map(employee => [
      employee.id,
      employee.nombre,
      employee.rfc,
      employee.curp,
      employee.nss,
      employee.fecha_ingreso ? new Date(employee.fecha_ingreso).toISOString().split('T')[0] : '',
      employee.estatus,
      employee.puesto,
      employee.departamento?.nombre || '',
      employee.user?.email || '',
      employee.user?.name || '',
      employee.salary || '',
      employee.jefeDirecto || '',
      employee.sd || '',
      employee.sdi || '',
      employee.createdAt ? new Date(employee.createdAt).toISOString() : ''
    ]);

    // Crear contenido CSV con BOM para UTF-8
    const csvContent = [
      '\ufeff' + headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=empleados_export_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting employees:', error);
    res.status(500).json({ error: 'Error al exportar empleados' });
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
