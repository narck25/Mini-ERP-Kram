const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const { calcularTodo } = require('../utils/salaryCalculator');

// Obtener todos los empleados con reglas de visibilidad basadas en jerarquía
exports.getAllEmployees = async (req, res) => {
  try {
    const { estatus, departamento_id, search, page = '1', limit = '20' } = req.query;
    const user = req.user;
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;
    
    const where = {};
    
    if (user.role === 'ADMIN' || user.role === 'RH') {
      // Sin restricciones
    } else if (user.employeeNivelJerarquico && user.employeeId) {
      const nivelJerarquico = user.employeeNivelJerarquico;
      const employeeId = user.employeeId;
      const departamentoId = user.employeeDepartamentoId;
      
      if (nivelJerarquico === 'PRESIDENTE' || nivelJerarquico === 'DIRECTOR' || 
          nivelJerarquico === 'GERENTE' || nivelJerarquico === 'JEFE') {
        if (departamentoId) {
          where.departamento_id = departamentoId;
        } else {
          where.id = employeeId;
        }
      } else if (nivelJerarquico === 'COORDINADOR' || nivelJerarquico === 'ANALISTA' ||
                 nivelJerarquico === 'SUPERVISOR' || nivelJerarquico === 'AUX_ADMINISTRATIVO') {
        where.OR = [
          { id: employeeId },
          { reportaAId: employeeId }
        ];
      } else if (nivelJerarquico === 'OPERATIVO') {
        where.id = employeeId;
      } else {
        where.id = employeeId;
      }
    } else {
      where.id = null;
    }
    
    if (estatus) where.estatus = estatus;
    if (departamento_id) where.departamento_id = departamento_id;
    
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { rfc: { contains: search, mode: 'insensitive' } },
        { curp: { contains: search, mode: 'insensitive' } },
        { nss: { contains: search, mode: 'insensitive' } },
        { puesto: { nombre: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [employees, totalCount] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          departamento: { select: { id: true, nombre: true, descripcion: true } },
          puesto: { select: { id: true, nombre: true, descripcion: true, nivelJerarquico: true } },
          user: { select: { id: true, email: true, name: true, role: true, isActive: true } },
          documents: { select: { id: true, tipo_documento: true, url_archivo: true, createdAt: true } },
          _count: { select: { documents: true, jobVacancies: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.count({ where })
    ]);

    res.json({ 
      employees, 
      pagination: { page: pageNum, limit: limitNum, total: totalCount, totalPages: Math.ceil(totalCount / limitNum) }
    });
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
        departamento: { select: { id: true, nombre: true, descripcion: true } },
        puesto: { select: { id: true, nombre: true, descripcion: true, nivelJerarquico: true } },
        user: { select: { id: true, email: true, name: true, role: true, isActive: true } },
        documents: { select: { id: true, tipo_documento: true, url_archivo: true, createdAt: true } },
        jobVacancies: { select: { id: true, titulo: true, createdAt: true, jobPosition: { select: { nombre: true } } } }
      }
    });
    if (!employee) return res.status(404).json({ error: 'Empleado no encontrado para el usuario actual' });
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
        departamento: { select: { id: true, nombre: true, descripcion: true } },
        puesto: { select: { id: true, nombre: true, descripcion: true, nivelJerarquico: true } },
        user: { select: { id: true, email: true, name: true, role: true, isActive: true } },
        documents: { select: { id: true, tipo_documento: true, url_archivo: true, createdAt: true } },
        jobVacancies: { select: { id: true, titulo: true, createdAt: true, jobPosition: { select: { nombre: true } } } },
        reportaA: { select: { id: true, nombre: true, puesto: { select: { id: true, nombre: true, descripcion: true, nivelJerarquico: true } }, nivelJerarquico: true } },
        subordinados: { select: { id: true, nombre: true, puesto: { select: { id: true, nombre: true, descripcion: true, nivelJerarquico: true } }, nivelJerarquico: true } }
      }
    });
    if (!employee) return res.status(404).json({ error: 'Empleado no encontrado' });
    res.json({ employee });
  } catch (error) {
    console.error('Error getEmployeeById:', error.message);
    res.status(500).json({ error: 'Error al obtener el empleado', details: error.message });
  }
};

// Crear un nuevo empleado
exports.createEmployee = async (req, res) => {
  try {
    const { clave, nombres, apellidoPaterno, apellidoMaterno, fechaNacimiento, lugarNacimiento, estadoCivil,
      nacionalidad, sexo, nivelAcademico, telefonoCasa, telefonoMovil, correoElectronico, correoEmpresa,
      direccionCompleta, estado, cpFiscal, rfc, curp, nss, fecha_ingreso, fechaBaja, estatus, sucursal,
      area, region, contrato, horario, puestoId, departamento_id, salary, clabe, numeroCuenta, banco,
      jefeDirecto, sd, sdi, nivelJerarquico, reportaAId, tallaCamisa, tallaPlayera, tallaPantalon,
      tallaZapatos, nombreConyuge, beneficiario1, fechaNacBeneficiario1, porcentaje1, beneficiario2,
      fechaNacBeneficiario2, porcentaje2, esPadre, numeroHijos, fotoUrl, userId } = req.body;

    if (!rfc || !curp || !nss || !fecha_ingreso || !puestoId || !departamento_id) {
      return res.status(400).json({ error: 'Faltan campos requeridos: RFC, CURP, NSS, fecha_ingreso, puestoId, departamento_id' });
    }

    const existingEmployee = await prisma.employee.findFirst({ where: { OR: [{ rfc }, { curp }, { nss }] } });
    if (existingEmployee) return res.status(400).json({ error: 'Ya existe un empleado con el mismo RFC, CURP o NSS' });

    if (userId && userId.trim() !== '') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(400).json({ error: 'El usuario especificado no existe' });
      const existingEmployeeWithUser = await prisma.employee.findUnique({ where: { userId } });
      if (existingEmployeeWithUser) return res.status(400).json({ error: 'El usuario ya tiene un empleado asociado' });
    }

    // Validar disponibilidad del correo ANTES de crear el empleado (evita usuarios huérfanos y fallos silenciosos)
    const crearUsuario = req.body.createUser === 'true' || req.body.createUser === true;
    if (crearUsuario && !(userId && userId.trim() !== '')) {
      const emailUsuario = correoEmpresa || correoElectronico;
      if (emailUsuario) {
        const usuarioExistente = await prisma.user.findUnique({ where: { email: emailUsuario } });
        if (usuarioExistente) {
          return res.status(400).json({ error: `El correo ${emailUsuario} ya está registrado. Da de baja al empleado anterior (el correo se liberará automáticamente) o usa otro correo.` });
        }
      }
    }

    const employeeData = {
      clave: clave || null, nombre: nombres || null, nombres: nombres || null,
      apellidoPaterno: apellidoPaterno || null, apellidoMaterno: apellidoMaterno || null,
      fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
      lugarNacimiento: lugarNacimiento || null, estadoCivil: estadoCivil || null,
      nacionalidad: nacionalidad || null, sexo: sexo || null, nivelAcademico: nivelAcademico || null,
      telefonoCasa: telefonoCasa || null, telefonoMovil: telefonoMovil || null,
      correoElectronico: correoElectronico || null, correoEmpresa: correoEmpresa || null,
      direccionCompleta: direccionCompleta || null, estado: estado || null, cpFiscal: cpFiscal || null,
      rfc, curp, nss, fechaAlta: new Date(fecha_ingreso),
      fechaBaja: fechaBaja ? new Date(fechaBaja) : null, motivoBaja: req.body.motivoBaja || null, estatus: estatus || 'Activo',
      sucursal: sucursal || null, area: area || null, region: region || null,
      contrato: contrato || null, horario: horario || null,
      salarioMensual: salary && salary !== '' ? parseFloat(salary) : null,
      clabe: clabe || null, numeroCuenta: numeroCuenta || null, banco: banco || null,
      jefeDirecto: jefeDirecto || null, sd: sd && sd !== '' ? parseFloat(sd) : null,
      sdi: sdi && sdi !== '' ? parseFloat(sdi) : null, nivelJerarquico: nivelJerarquico || 'OPERATIVO',
      tallaCamisa: tallaCamisa || null, tallaPlayera: tallaPlayera || null,
      tallaPantalon: tallaPantalon || null, tallaZapatos: tallaZapatos || null,
      nombreConyuge: nombreConyuge || null, beneficiario1: beneficiario1 || null,
      fechaNacBeneficiario1: fechaNacBeneficiario1 ? new Date(fechaNacBeneficiario1) : null,
      porcentaje1: porcentaje1 && porcentaje1 !== '' ? parseFloat(porcentaje1) : null,
      beneficiario2: beneficiario2 || null,
      fechaNacBeneficiario2: fechaNacBeneficiario2 ? new Date(fechaNacBeneficiario2) : null,
      porcentaje2: porcentaje2 && porcentaje2 !== '' ? parseFloat(porcentaje2) : null,
      esPadre: esPadre !== undefined ? esPadre : false,
      numeroHijos: numeroHijos !== undefined ? (numeroHijos !== '' ? parseInt(numeroHijos) : 0) : 0,
      fotoUrl: fotoUrl || null,
    };

    if (puestoId) employeeData.puesto = { connect: { id: puestoId } };
    if (departamento_id) employeeData.departamento = { connect: { id: departamento_id } };
    if (userId && userId.trim() !== '') employeeData.user = { connect: { id: userId } };
    if (reportaAId && reportaAId.trim() !== '') employeeData.reportaA = { connect: { id: reportaAId } };

    const salaryValue = salary && salary !== '' ? parseFloat(salary) : null;
    if (salaryValue && fecha_ingreso) {
      const calculos = calcularTodo(salaryValue, fecha_ingreso);
      if (calculos.sd !== null) { employeeData.sd = calculos.sd; employeeData.sdi = calculos.sdi; }
    }

    const employee = await prisma.employee.create({
      data: employeeData,
      include: {
        departamento: { select: { id: true, nombre: true, descripcion: true } },
        user: { select: { id: true, email: true, name: true, role: true } }
      }
    });

    if (employee.salarioMensual) {
      const calculos = calcularTodo(employee.salarioMensual, employee.fechaAlta);
      await prisma.salaryHistory.create({
        data: { employeeId: employee.id, salarioAnterior: null, salarioNuevo: employee.salarioMensual,
          sdAnterior: null, sdNuevo: employee.sd, sdiAnterior: null, sdiNuevo: employee.sdi,
          factorUsado: calculos.factor, tipoCambio: 'ALTA', motivo: 'Creación de empleado',
          usuarioId: req.user?.id || null }
      });
    }

    let createdUser = null;
    const createUser = req.body.createUser === 'true' || req.body.createUser === true;
    if (createUser && !userId) {
      const email = employee.correoEmpresa || employee.correoElectronico;
      const nombreCompleto = employee.nombres || employee.nombre || '';
      if (email) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (!existingUser) {
          const tempPassword = employee.rfc ? employee.rfc.substring(0, 10).toLowerCase() : 'kram2026';
          const hashedPassword = await bcrypt.hash(tempPassword, 10);
          createdUser = await prisma.user.create({
            data: { email, password: hashedPassword, name: nombreCompleto, role: 'EMPLEADO_BASICO',
              accessibleModules: ['DASHBOARD'], isActive: true,
              employee: { connect: { id: employee.id } } },
            select: { id: true, email: true, name: true, role: true }
          });
        }
      }
    }

    const response = { message: 'Empleado creado exitosamente', employee };
    if (createdUser) { response.user = createdUser; response.message += ' Usuario creado automáticamente.'; }
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Error al crear el empleado', details: error.message });
  }
};

// Actualizar un empleado
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { clave, nombres, apellidoPaterno, apellidoMaterno, fechaNacimiento, lugarNacimiento, estadoCivil,
      nacionalidad, sexo, nivelAcademico, telefonoCasa, telefonoMovil, correoElectronico, correoEmpresa,
      direccionCompleta, estado, cpFiscal, rfc, curp, nss, fecha_ingreso, fechaBaja, estatus, sucursal,
      area, region, contrato, horario, puestoId, departamento_id, salary, clabe, numeroCuenta, banco,
      jefeDirecto, sd, sdi, nivelJerarquico, reportaAId, tallaCamisa, tallaPlayera, tallaPantalon,
      tallaZapatos, nombreConyuge, beneficiario1, fechaNacBeneficiario1, porcentaje1, beneficiario2,
      fechaNacBeneficiario2, porcentaje2, esPadre, numeroHijos, fotoUrl, userId } = req.body;

    const existingEmployee = await prisma.employee.findUnique({ where: { id } });
    if (!existingEmployee) return res.status(404).json({ error: 'Empleado no encontrado' });

    if (rfc && rfc !== existingEmployee.rfc) {
      const existingRFC = await prisma.employee.findFirst({ where: { rfc, NOT: { id } } });
      if (existingRFC) return res.status(400).json({ error: 'Ya existe otro empleado con el mismo RFC' });
    }
    if (curp && curp !== existingEmployee.curp) {
      const existingCURP = await prisma.employee.findFirst({ where: { curp, NOT: { id } } });
      if (existingCURP) return res.status(400).json({ error: 'Ya existe otro empleado con el mismo CURP' });
    }
    if (nss && nss !== existingEmployee.nss) {
      const existingNSS = await prisma.employee.findFirst({ where: { nss, NOT: { id } } });
      if (existingNSS) return res.status(400).json({ error: 'Ya existe otro empleado con el mismo NSS' });
    }
    if (userId && userId !== existingEmployee.userId) {
      const existingEmployeeWithUser = await prisma.employee.findFirst({ where: { userId, NOT: { id } } });
      if (existingEmployeeWithUser) return res.status(400).json({ error: 'El usuario ya está asociado a otro empleado' });
    }

    const updateData = {
      clave: u(clave, existingEmployee.clave), nombre: u(nombres, existingEmployee.nombre),
      nombres: u(nombres, existingEmployee.nombres), apellidoPaterno: u(apellidoPaterno, existingEmployee.apellidoPaterno),
      apellidoMaterno: u(apellidoMaterno, existingEmployee.apellidoMaterno),
      fechaNacimiento: u(fechaNacimiento, existingEmployee.fechaNacimiento, v => v ? new Date(v) : null),
      lugarNacimiento: u(lugarNacimiento, existingEmployee.lugarNacimiento),
      estadoCivil: u(estadoCivil, existingEmployee.estadoCivil),
      nacionalidad: u(nacionalidad, existingEmployee.nacionalidad), sexo: u(sexo, existingEmployee.sexo),
      nivelAcademico: u(nivelAcademico, existingEmployee.nivelAcademico),
      telefonoCasa: u(telefonoCasa, existingEmployee.telefonoCasa),
      telefonoMovil: u(telefonoMovil, existingEmployee.telefonoMovil),
      correoElectronico: u(correoElectronico, existingEmployee.correoElectronico),
      correoEmpresa: u(correoEmpresa, existingEmployee.correoEmpresa),
      direccionCompleta: u(direccionCompleta, existingEmployee.direccionCompleta),
      estado: u(estado, existingEmployee.estado), cpFiscal: u(cpFiscal, existingEmployee.cpFiscal),
      rfc: u(rfc, existingEmployee.rfc), curp: u(curp, existingEmployee.curp), nss: u(nss, existingEmployee.nss),
      fechaAlta: u(fecha_ingreso, existingEmployee.fechaAlta, v => v ? new Date(v) : existingEmployee.fechaAlta),
      fechaBaja: u(fechaBaja, existingEmployee.fechaBaja, v => v ? new Date(v) : null),
      motivoBaja: u(req.body.motivoBaja, existingEmployee.motivoBaja),
      estatus: u(estatus, existingEmployee.estatus), sucursal: u(sucursal, existingEmployee.sucursal),
      area: u(area, existingEmployee.area), region: u(region, existingEmployee.region),
      contrato: u(contrato, existingEmployee.contrato), horario: u(horario, existingEmployee.horario),
      puesto: u2(puestoId, { connect: { id: puestoId } }, { disconnect: true }),
      departamento: u3(departamento_id, { connect: { id: departamento_id } }),
      salarioMensual: u(salary, existingEmployee.salarioMensual, v => v && v !== '' ? parseFloat(v) : null),
      clabe: u(clabe, existingEmployee.clabe), numeroCuenta: u(numeroCuenta, existingEmployee.numeroCuenta),
      banco: u(banco, existingEmployee.banco), jefeDirecto: u(jefeDirecto, existingEmployee.jefeDirecto),
      sd: u(sd, existingEmployee.sd, v => v && v !== '' ? parseFloat(v) : null),
      sdi: u(sdi, existingEmployee.sdi, v => v && v !== '' ? parseFloat(v) : null),
      nivelJerarquico: u(nivelJerarquico, existingEmployee.nivelJerarquico),
      reportaA: u2(reportaAId, { connect: { id: reportaAId } }, { disconnect: true }),
      tallaCamisa: u(tallaCamisa, existingEmployee.tallaCamisa),
      tallaPlayera: u(tallaPlayera, existingEmployee.tallaPlayera),
      tallaPantalon: u(tallaPantalon, existingEmployee.tallaPantalon),
      tallaZapatos: u(tallaZapatos, existingEmployee.tallaZapatos),
      nombreConyuge: u(nombreConyuge, existingEmployee.nombreConyuge),
      beneficiario1: u(beneficiario1, existingEmployee.beneficiario1),
      fechaNacBeneficiario1: u(fechaNacBeneficiario1, existingEmployee.fechaNacBeneficiario1, v => v ? new Date(v) : null),
      porcentaje1: u(porcentaje1, existingEmployee.porcentaje1, v => v && v !== '' ? parseFloat(v) : null),
      beneficiario2: u(beneficiario2, existingEmployee.beneficiario2),
      fechaNacBeneficiario2: u(fechaNacBeneficiario2, existingEmployee.fechaNacBeneficiario2, v => v ? new Date(v) : null),
      porcentaje2: u(porcentaje2, existingEmployee.porcentaje2, v => v && v !== '' ? parseFloat(v) : null),
      esPadre: u(esPadre, existingEmployee.esPadre),
      numeroHijos: u(numeroHijos, existingEmployee.numeroHijos, v => v !== '' ? parseInt(v) : 0),
      fotoUrl: u(fotoUrl, existingEmployee.fotoUrl),
      user: u2(userId, { connect: { id: userId } }, { disconnect: true })
    };

    // Limpiar undefineds de relaciones
    if (updateData.puesto && updateData.puesto.connect === undefined && updateData.puesto.disconnect === undefined) delete updateData.puesto;
    if (updateData.departamento && updateData.departamento.connect === undefined) delete updateData.departamento;
    if (updateData.reportaA && updateData.reportaA.connect === undefined && updateData.reportaA.disconnect === undefined) delete updateData.reportaA;
    if (updateData.user && updateData.user.connect === undefined && updateData.user.disconnect === undefined) delete updateData.user;

    // Si es una baja y no se indicó fecha de baja, usar la fecha actual
    if (estatus === 'Inactivo' && existingEmployee.estatus !== 'Inactivo' && !fechaBaja) {
      updateData.fechaBaja = new Date();
    }

    const nuevoSalario = salary !== undefined ? (salary && salary !== '' ? parseFloat(salary) : null) : existingEmployee.salarioMensual;
    const nuevaFecha = fecha_ingreso !== undefined ? (fecha_ingreso ? new Date(fecha_ingreso) : existingEmployee.fechaAlta) : existingEmployee.fechaAlta;
    if (nuevoSalario && nuevaFecha) {
      const calculos = calcularTodo(nuevoSalario, nuevaFecha);
      if (calculos.sd !== null) { updateData.sd = calculos.sd; updateData.sdi = calculos.sdi; }
    }

    const employee = await prisma.employee.update({
      where: { id }, data: updateData,
      include: { departamento: { select: { id: true, nombre: true, descripcion: true } }, user: { select: { id: true, email: true, name: true, role: true } } }
    });

    const salarioFinal = employee.salarioMensual;
    const salarioAnterior = existingEmployee.salarioMensual;
    if (salarioFinal !== salarioAnterior && salarioFinal) {
      const calculos = calcularTodo(salarioFinal, employee.fechaAlta);
      let tipoCambio = !salarioAnterior ? 'ALTA' : salarioFinal > salarioAnterior ? 'INCREMENTO' : 'DECREMENTO';
      await prisma.salaryHistory.create({
        data: { employeeId: employee.id, salarioAnterior, salarioNuevo: salarioFinal,
          sdAnterior: existingEmployee.sd, sdNuevo: employee.sd, sdiAnterior: existingEmployee.sdi,
          sdiNuevo: employee.sdi, factorUsado: calculos.factor, tipoCambio,
          motivo: req.body.motivoCambioSalarial || null, usuarioId: req.user?.id || null }
      });
    }

    // Si el empleado fue dado de baja, desactivar su usuario y liberar el correo institucional
    let correoLiberado = null;
    if (estatus === 'Inactivo' && existingEmployee.estatus !== 'Inactivo' && existingEmployee.userId) {
      correoLiberado = await exports.releaseUserEmail(existingEmployee.userId, existingEmployee.rfc);
    }

    res.json({ message: 'Empleado actualizado exitosamente', employee, correoLiberado });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Error al actualizar el empleado', details: error.message });
  }
};

// Helpers inline para updateEmployee
const u = (val, fallback, transform) => val !== undefined ? (transform ? transform(val) : val) : fallback;
const u2 = (val, connect, disconnect) => val !== undefined ? (val ? connect : disconnect) : undefined;
const u3 = (val, connect) => val !== undefined ? { connect: val ? connect.connect : undefined, disconnect: !val ? true : undefined } : undefined;

// Liberar el correo institucional de un usuario al dar de baja:
// desactiva la cuenta y renombra el email a un placeholder único (basado en RFC o id),
// de modo que el correo original pueda reutilizarse con la siguiente persona del puesto.
exports.releaseUserEmail = async (userId, rfc) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!user) return null;
  const placeholder = `baja.${(rfc || userId).toLowerCase()}@kram.mx`;
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false, email: placeholder }
  });
  // Liberar también el correo institucional del expediente (correoEmpresa)
  await prisma.employee.updateMany({
    where: { userId },
    data: { correoEmpresa: null }
  });
  return user.email; // correo original liberado
};