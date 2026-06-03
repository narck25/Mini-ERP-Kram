const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

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
    } else if (user.employeeNivelJerarquico && user.employeeId) {
      // Usuario tiene empleado asociado y nivel jerárquico
      const nivelJerarquico = user.employeeNivelJerarquico;
      const employeeId = user.employeeId;
      const departamentoId = user.employeeDepartamentoId;
      
      if (nivelJerarquico === 'GERENTE' || nivelJerarquico === 'DIRECTOR' || 
          nivelJerarquico === 'VICEPRESIDENTE' || nivelJerarquico === 'PRESIDENTE') {
        // GERENTE / DIRECTOR o superior: Ver empleados de su mismo departamento
        if (departamentoId) {
          where.departamento_id = departamentoId;
        } else {
          // Si no tiene departamento asignado, solo ver su propio registro
          where.id = employeeId;
        }
      } else if (nivelJerarquico === 'SUPERVISOR') {
        // SUPERVISOR: Ver su propio registro y empleados que le reportan directamente
        where.OR = [
          { id: employeeId }, // Su propio registro
          { reportaAId: employeeId } // Empleados que le reportan
        ];
      } else if (nivelJerarquico === 'OPERATIVO') {
        // OPERATIVO: Solo ver su propio registro
        where.id = employeeId;
      } else {
        // Nivel no reconocido: Por seguridad, solo ver su propio registro
        where.id = employeeId;
      }
    } else {
      // Usuario sin empleado asociado: Por seguridad, no mostrar nada
      where.id = null; // Esto no devolverá resultados
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

    res.json({ employees });
  } catch (error) {
    console.error('Error getting employees:', error.message);
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
    console.error('Error getting current employee:', error.message);
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
      
      // Datos Familiares
      esPadre,
      numeroHijos,
      
      // Foto
      fotoUrl,
      
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
      
      // Datos Familiares
      esPadre: esPadre !== undefined ? esPadre : false,
      numeroHijos: numeroHijos !== undefined ? (numeroHijos !== '' ? parseInt(numeroHijos) : 0) : 0,
      
      // Foto
      fotoUrl: fotoUrl || null,
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

    // Crear usuario automáticamente si se solicita
    let createdUser = null;
    const createUser = req.body.createUser === 'true' || req.body.createUser === true;

    if (createUser && !userId) {
      const email = employee.correoEmpresa || employee.correoElectronico;
      const nombreCompleto = employee.nombres || employee.nombre || '';

      if (email) {
        // Verificar que el email no esté ya registrado
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (!existingUser) {
          // Generar contraseña temporal: primeros 10 caracteres del RFC (en minúsculas)
          const tempPassword = employee.rfc ? employee.rfc.substring(0, 10).toLowerCase() : 'kram2026';
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          createdUser = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              name: nombreCompleto,
              role: 'EMPLEADO_BASICO',
              accessibleModules: ['DASHBOARD'],
              isActive: true,
              employee: {
                connect: { id: employee.id }
              }
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          });

          console.log(`✅ Usuario creado automáticamente para: ${nombreCompleto} (${email})`);
        }
      }
    }

    const response = {
      message: 'Empleado creado exitosamente',
      employee
    };

    if (createdUser) {
      response.user = createdUser;
      response.message += ' Usuario creado automáticamente.';
    }

    res.status(201).json(response);
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
      
      // Datos Familiares
      esPadre,
      numeroHijos,
      
      // Foto
      fotoUrl,
      
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
      
      // Datos Familiares
      esPadre: esPadre !== undefined ? esPadre : existingEmployee.esPadre,
      numeroHijos: numeroHijos !== undefined ? (numeroHijos !== '' ? parseInt(numeroHijos) : 0) : existingEmployee.numeroHijos,
      
      // Foto
      fotoUrl: fotoUrl !== undefined ? fotoUrl : existingEmployee.fotoUrl,
      
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
      where: { id },
      include: {
        user: {
          select: { id: true, isActive: true }
        }
      }
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

    // También desactivar el usuario vinculado si existe
    let userDeactivated = false;
    if (existingEmployee.user) {
      await prisma.user.update({
        where: { id: existingEmployee.user.id },
        data: { isActive: false }
      });
      userDeactivated = true;
      console.log(`✅ Usuario ${existingEmployee.user.id} desactivado por baja del empleado ${id}`);
    }

    res.json({
      message: 'Empleado dado de baja exitosamente',
      employee,
      userDeactivated
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

    // Verificar si el empleado existe e incluir su usuario vinculado
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      }
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

    // Eliminar el usuario vinculado si existe
    let userDeleted = false;
    if (existingEmployee.user) {
      await prisma.user.delete({
        where: { id: existingEmployee.user.id }
      });
      userDeleted = true;
      console.log(`✅ Usuario ${existingEmployee.user.email} eliminado por eliminación permanente del empleado ${id}`);
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
      },
      userDeleted,
      userInfo: userDeleted ? {
        id: existingEmployee.user.id,
        email: existingEmployee.user.email,
        name: existingEmployee.user.name
      } : null
    });
  } catch (error) {
    console.error('Error deleting employee permanently:', error);
    res.status(500).json({ error: 'Error al eliminar el empleado permanentemente' });
  }
};
