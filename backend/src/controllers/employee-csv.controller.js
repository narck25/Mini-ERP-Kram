const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const { Readable } = require('stream');
const fs = require('fs');
const { mapEmployeeFromCsv, validateEmployeeData, prepareForPrisma, validateCsvHeaders } = require('../utils/csvMapper');

// Importar empleados desde CSV
exports.importEmployees = async (req, res) => {
  let transaction;
  let filePath = req.file?.path;
  const fileBuffer = req.file?.buffer;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo CSV' });
    }

    // Determinar si se deben crear usuarios automáticamente
    const createUsers = req.body.createUsers === 'true' || req.body.createUsers === true;
    
    // Modo de manejo de duplicados: 'error' | 'skip' | 'update'
    const duplicateMode = req.body.duplicateMode || 'error';

    let fileContent;
    
    // Intentar leer desde buffer primero (memoryStorage o proxy que transforma)
    if (fileBuffer && fileBuffer.length > 0) {
      fileContent = fileBuffer.toString('utf8');
    } 
    // Fallback: leer desde disco (diskStorage)
    else if (filePath) {
      fileContent = fs.readFileSync(filePath, 'utf8');
    }
    // Si no hay ni buffer ni path, error
    else {
      return res.status(500).json({ error: 'Error interno: no se pudo leer el archivo subido' });
    }

    const results = [];
    const errors = [];
    const stream = Readable.from(fileContent);

    let csvHeaders = [];

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv({
          mapHeaders: ({ header }) => {
            const trimmed = header.trim();
            // Capturar las cabeceras en la primera llamada
            if (!csvHeaders.includes(trimmed)) {
              csvHeaders.push(trimmed);
            }
            return trimmed;
          },
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

    // Validar cabeceras del CSV (solo REQUERIDAS: RFC, CURP, NSS, FECHA ALTA, PUESTO)
    const headerValidation = validateCsvHeaders(csvHeaders);
    if (!headerValidation.valid) {
      const missingSample = headerValidation.missingHeaders.join(', ');
      return res.status(400).json({
        error: 'El CSV no contiene las columnas obligatorias. Verifique que incluya: RFC, CURP, NSS, FECHA ALTA, PUESTO',
        missingHeaders: headerValidation.missingHeaders,
        message: `Columnas obligatorias faltantes: ${missingSample}`
      });
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
      const updatedEmployees = [];
      const skippedEmployees = [];
      const createdUsers = [];
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
            },
            include: {
              user: { select: { id: true, email: true } }
            }
          });

          if (existingEmployee) {
            if (duplicateMode === 'error') {
              // Modo ERROR: falla toda la importación
              batchErrors.push(`Fila ${rowNumber}: Ya existe un empleado con el mismo RFC, CURP o NSS (${existingEmployee.nombre})`);
              continue;
            } else if (duplicateMode === 'skip') {
              // Modo SKIP: saltar el duplicado, continuar con los demás
              skippedEmployees.push({
                id: existingEmployee.id,
                nombre: existingEmployee.nombre,
                rfc: existingEmployee.rfc,
                motivo: 'Ya existente en BD'
              });
              console.log(`⏭️ Empleado omitido (ya existe): ${existingEmployee.nombre} (RFC: ${existingEmployee.rfc})`);
              continue;
            } else if (duplicateMode === 'update') {
              // Modo UPDATE: actualizar datos del empleado existente
              const dataToUpdate = await prepareForPrisma(employeeData, tx);
              
              // No cambiar el ID ni el userId
              delete dataToUpdate.id;
              delete dataToUpdate.userId;
              
              const updated = await tx.employee.update({
                where: { id: existingEmployee.id },
                data: dataToUpdate
              });

              updatedEmployees.push({
                id: updated.id,
                nombre: updated.nombre,
                rfc: updated.rfc,
                curp: updated.curp,
                nss: updated.nss
              });

              console.log(`🔄 Empleado actualizado: ${updated.nombre} (RFC: ${updated.rfc})`);

              // Si se solicita crear usuarios y el empleado no tiene usuario vinculado
              if (createUsers && !existingEmployee.user) {
                const email = updated.correoEmpresa || updated.correoElectronico;
                const nombreCompleto = updated.nombres || updated.nombre || '';

                if (email) {
                  const existingUser = await tx.user.findUnique({
                    where: { email }
                  });

                  if (!existingUser) {
                    const tempPassword = updated.rfc ? updated.rfc.substring(0, 10).toLowerCase() : 'kram2026';
                    const hashedPassword = await bcrypt.hash(tempPassword, 10);

                    const newUser = await tx.user.create({
                      data: {
                        email,
                        password: hashedPassword,
                        name: nombreCompleto,
                        role: 'EMPLEADO_BASICO',
                        accessibleModules: ['DASHBOARD'],
                        isActive: true,
                        employee: {
                          connect: { id: updated.id }
                        }
                      },
                      select: { id: true, email: true, name: true, role: true }
                    });

                    createdUsers.push({
                      id: newUser.id,
                      email: newUser.email,
                      name: newUser.name,
                      employeeId: updated.id,
                      tempPassword
                    });
                  } else {
                    await tx.user.update({
                      where: { id: existingUser.id },
                      data: {
                        employee: {
                          connect: { id: updated.id }
                        }
                      }
                    });
                  }
                }
              }

              continue;
            }
          }

          // Preparar datos para inserción usando nuestro helper
          const dataToInsert = await prepareForPrisma(employeeData, tx);

          const employee = await tx.employee.create({
            data: dataToInsert
          });

          const employeeResult = {
            id: employee.id,
            nombre: employee.nombre,
            rfc: employee.rfc,
            curp: employee.curp,
            nss: employee.nss
          };

          // Si se solicita crear usuarios automáticamente
          if (createUsers) {
            const email = employee.correoEmpresa || employee.correoElectronico;
            const nombreCompleto = employee.nombres || employee.nombre || '';

            if (email) {
              // Verificar que el email no esté ya registrado
              const existingUser = await tx.user.findUnique({
                where: { email }
              });

              if (!existingUser) {
                // Generar contraseña temporal: primeros 10 caracteres del RFC (en minúsculas)
                const tempPassword = employee.rfc ? employee.rfc.substring(0, 10).toLowerCase() : 'kram2026';
                const hashedPassword = await bcrypt.hash(tempPassword, 10);

                const newUser = await tx.user.create({
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

                createdUsers.push({
                  id: newUser.id,
                  email: newUser.email,
                  name: newUser.name,
                  employeeId: employee.id,
                  tempPassword
                });

                console.log(`✅ Usuario creado automáticamente para: ${nombreCompleto} (${email})`);
              } else {
                // Si ya existe un usuario con ese email, vincularlo al empleado
                await tx.user.update({
                  where: { id: existingUser.id },
                  data: {
                    employee: {
                      connect: { id: employee.id }
                    }
                  }
                });
                console.log(`✅ Usuario existente vinculado al empleado: ${nombreCompleto} (${email})`);
              }
            } else {
              console.log(`⚠️ No se pudo crear usuario para ${nombreCompleto}: no tiene correo electrónico`);
            }
          }

          importedEmployees.push(employeeResult);
        } catch (error) {
          batchErrors.push(`Fila ${rowNumber}: Error al procesar empleado - ${error.message}`);
        }
      }

      // Si hay errores en modo 'error', lanzar excepción para rollback total
      if (batchErrors.length > 0 && duplicateMode === 'error') {
        throw new Error(`Errores durante la importación: ${batchErrors.join('; ')}`);
      }

      return { importedEmployees, updatedEmployees, skippedEmployees, createdUsers, batchErrors };
    });

    const responseData = {
      message: '',
      imported: transaction.importedEmployees.length,
      updated: transaction.updatedEmployees.length,
      skipped: transaction.skippedEmployees.length,
      errors: transaction.batchErrors.length,
      importedEmployees: transaction.importedEmployees,
      updatedEmployees: transaction.updatedEmployees,
      skippedEmployees: transaction.skippedEmployees,
      errorDetails: transaction.batchErrors,
      summary: {
        totalRows: results.length,
        created: transaction.importedEmployees.length,
        updated: transaction.updatedEmployees.length,
        skipped: transaction.skippedEmployees.length,
        failed: transaction.batchErrors.length,
        successRate: results.length > 0 
          ? (((transaction.importedEmployees.length + transaction.updatedEmployees.length) / results.length) * 100).toFixed(2) + '%'
          : '0%'
      }
    };

    // Construir mensaje según modo
    const parts = [];
    if (transaction.importedEmployees.length > 0) parts.push(`${transaction.importedEmployees.length} empleados creados`);
    if (transaction.updatedEmployees.length > 0) parts.push(`${transaction.updatedEmployees.length} empleados actualizados`);
    if (transaction.skippedEmployees.length > 0) parts.push(`${transaction.skippedEmployees.length} empleados omitidos (ya existían)`);
    if (transaction.batchErrors.length > 0) parts.push(`${transaction.batchErrors.length} errores`);
    responseData.message = `Importación completada. ${parts.join(', ')}.`;

    // Agregar información de usuarios creados si aplica
    if (createUsers) {
      responseData.usersCreated = transaction.createdUsers.length;
      responseData.createdUsers = transaction.createdUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        employeeId: u.employeeId,
        tempPassword: u.tempPassword
      }));
      responseData.message += ` ${transaction.createdUsers.length} usuarios creados automáticamente.`;
    }

    res.json(responseData);
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
  } finally {
    // Limpiar archivo temporal del disco para no acumular basura
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        // Solo log, no debe interrumpir la respuesta
        console.warn(`⚠️ No se pudo eliminar archivo temporal: ${filePath}`, cleanupError.message);
      }
    }
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
      
      // Nuevos campos: Nivel Jerárquico, Jefe Directo, SD, SDI
      'NIVEL JERARQUICO',
      'JEFE DIRECTO',
      'JEFE DIRECTO (CLAVE)',
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
      
      // Nuevos campos: Nivel Jerárquico, Jefe Directo, SD, SDI
      'ANALISTA',
      'María Rodríguez',
      'EMP001',
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
      '3. DEPARTAMENTO debe escribirse en MAYÚSCULAS (ej: SISTEMAS, RH, COMPRAS, PRODUCCION)',
      '   ★ Si el departamento no existe, el sistema lo CREARÁ AUTOMÁTICAMENTE en MAYÚSCULAS',
      '4. PUESTO debe escribirse en MAYÚSCULAS (ej: DESARROLLADOR SENIOR, AUXILIAR ADMINISTRATIVO)',
      '   ★ Si el puesto no existe, el sistema lo CREARÁ AUTOMÁTICAMENTE vinculado al departamento',
      '5. SALARIO MENSUAL debe ser un número decimal (ej. 25000.00)',
      '6. PORCENTAJE 1 y PORCENTAJE 2 deben ser números entre 0 y 100',
      '7. RFC debe tener exactamente 13 caracteres',
      '8. CURP debe tener exactamente 18 caracteres',
      '9. NSS debe tener exactamente 11 dígitos',
      '10. Los campos marcados con * son obligatorios: RFC, CURP, NSS, FECHA ALTA, PUESTO',
      '11. Use comillas dobles (") para valores que contengan comas o saltos de línea',
      '12. Para incluir comillas dobles dentro de un valor, escríbalas como "" (dos comillas)',
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
      'CREACIÓN DINÁMICA DE CATÁLOGOS:',
      '- Si escribes un DEPARTAMENTO nuevo, el sistema lo crea automáticamente en MAYÚSCULAS',
      '- Si escribes un PUESTO nuevo, el sistema lo crea automáticamente vinculado al departamento',
      '- Esto permite importar datos de cualquier fuente sin preparar catálogos previamente',
      '',
      'EJEMPLO DE DEPARTAMENTOS (use el nombre en MAYÚSCULAS o ID numérico):',
      '- 1 = SISTEMAS',
      '- 2 = COMPRAS',
      '- 3 = RH',
      '- 4 = ADMINISTRACIÓN',
      '- 5 = VENTAS',
      '- 6 = MARKETING',
      '- 7 = PRODUCCION',
      '',
      'NOTA: Puede usar el nombre del departamento en MAYÚSCULAS (ej: "SISTEMAS") o el ID numérico (ej: "1")'
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
        puesto: {
          select: {
            nombre: true
          }
        },
        reportaA: {
          select: {
            clave: true,
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

    // Encabezados del CSV (MISMO orden que la plantilla para re-importación)
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
      
      // Nivel Jerárquico, Jefe Directo, SD, SDI
      'NIVEL JERARQUICO',
      'JEFE DIRECTO',
      'JEFE DIRECTO (CLAVE)',
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

    // Crear filas de datos (MISMO orden que los headers)
    const rows = employees.map(employee => [
      // Datos Personales
      employee.clave || '',
      employee.nombres || '',
      employee.apellidoPaterno || '',
      employee.apellidoMaterno || '',
      employee.fechaNacimiento ? new Date(employee.fechaNacimiento).toISOString().split('T')[0] : '',
      employee.lugarNacimiento || '',
      employee.estadoCivil || '',
      employee.nacionalidad || '',
      employee.sexo || '',
      employee.nivelAcademico || '',
      
      // Contacto y Dirección
      employee.telefonoCasa || '',
      employee.telefonoMovil || '',
      employee.correoElectronico || '',
      employee.correoEmpresa || '',
      employee.direccionCompleta || '',
      employee.estado || '',
      employee.cpFiscal || '',
      
      // Datos Legales
      employee.rfc || '',
      employee.curp || '',
      employee.nss || '',
      
      // Datos Laborales
      employee.fechaAlta ? new Date(employee.fechaAlta).toISOString().split('T')[0] : '',
      employee.fechaBaja ? new Date(employee.fechaBaja).toISOString().split('T')[0] : '',
      employee.estatus || '',
      employee.sucursal || '',
      employee.area || '',
      employee.region || '',
      employee.contrato || '',
      employee.horario || '',
      employee.puesto?.nombre || '',
      employee.departamento?.nombre || '',
      
      // Datos Financieros
      employee.salarioMensual || '',
      employee.clabe || '',
      employee.numeroCuenta || '',
      employee.banco || '',
      
      // Nivel Jerárquico, Jefe Directo, SD, SDI
      employee.nivelJerarquico || '',
      employee.reportaA?.nombre || employee.jefeDirecto || '',
      employee.reportaA?.clave || '',
      employee.sd || '',
      employee.sdi || '',
      
      // Uniformes y Extras
      employee.tallaCamisa || '',
      employee.tallaPlayera || '',
      employee.tallaPantalon || '',
      employee.tallaZapatos || '',
      employee.nombreConyuge || '',
      
      // Beneficiarios
      employee.beneficiario1 || '',
      employee.fechaNacBeneficiario1 ? new Date(employee.fechaNacBeneficiario1).toISOString().split('T')[0] : '',
      employee.porcentaje1 || '',
      employee.beneficiario2 || '',
      employee.fechaNacBeneficiario2 ? new Date(employee.fechaNacBeneficiario2).toISOString().split('T')[0] : '',
      employee.porcentaje2 || ''
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
