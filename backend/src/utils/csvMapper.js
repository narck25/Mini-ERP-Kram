/**
 * Columnas REQUERIDAS en el CSV de importación
 * Solo estas son obligatorias para que la importación funcione
 */
const REQUIRED_HEADERS = [
  'RFC', 'CURP', 'NSS', 'FECHA ALTA', 'PUESTO'
];

/**
 * Columnas RECOMENDADAS en el CSV de importación
 * No son obligatorias pero ayudan a tener datos más completos
 */
const RECOMMENDED_HEADERS = [
  'CLAVE', 'NOMBRES', 'APELLIDO PATERNO', 'APELLIDO MATERNO',
  'FECHA NACIMIENTO', 'LUGAR NACIMIENTO', 'ESTADO CIVIL', 'NACIONALIDAD', 'SEXO', 'NIVEL ACADEMICO',
  'TELEFONO CASA', 'TELEFONO MOVIL', 'CORREO ELECTRONICO', 'CORREO EMPRESA',
  'DIRECCION COMPLETA', 'ESTADO', 'CP FISCAL',
  'FECHA BAJA', 'ESTATUS', 'SUCURSAL', 'AREA', 'REGION', 'CONTRATO', 'HORARIO', 'DEPARTAMENTO',
  'SALARIO MENSUAL', 'CLABE', 'NUMERO CUENTA', 'BANCO',
  'JEFE DIRECTO', 'SD', 'SDI',
  'TALLA CAMISA', 'TALLA PLAYERA', 'TALLA PANTALON', 'TALLA ZAPATOS', 'NOMBRE CONYUGE',
  'BENEFICIARIO 1', 'FECHA NAC BENEFICIARIO 1', 'PORCENTAJE 1',
  'BENEFICIARIO 2', 'FECHA NAC BENEFICIARIO 2', 'PORCENTAJE 2'
];

/**
 * Valida que las cabeceras del CSV contengan al menos las columnas REQUERIDAS
 * @param {string[]} headers - Cabeceras del archivo CSV
 * @returns {Object} { valid: boolean, missingHeaders: string[], recommendedHeaders: string[] }
 */
function validateCsvHeaders(headers) {
  const normalizedHeaders = headers.map(h => h.trim().toUpperCase());
  const missingRequired = [];
  const missingRecommended = [];
  
  // Verificar columnas REQUERIDAS (obligatorias)
  for (const expected of REQUIRED_HEADERS) {
    if (!normalizedHeaders.includes(expected)) {
      missingRequired.push(expected);
    }
  }
  
  // Verificar columnas RECOMENDADAS (opcionales, solo informativo)
  for (const expected of RECOMMENDED_HEADERS) {
    if (!normalizedHeaders.includes(expected)) {
      missingRecommended.push(expected);
    }
  }
  
  return {
    valid: missingRequired.length === 0,
    missingHeaders: missingRequired,
    recommendedHeaders: missingRecommended
  };
}

/**
 * Mapea una fila del CSV a un objeto Employee listo para Prisma
 * @param {Object} row - Fila del csv-parser
 * @returns {Object} Objeto mapeado para Prisma
 */
function mapEmployeeFromCsv(row, prisma) {
  // Función auxiliar para convertir fechas
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr?.trim() === '') return null;
    try {
      // Intentar formato DD/MM/YYYY primero (común en México)
      if (dateStr?.includes('/')) {
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
      }
      // Intentar formato YYYY-MM-DD
      else if (dateStr?.includes('-')) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      // Si no tiene separadores, intentar parsear como string
      else {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      }
    } catch (error) {
      console.warn(`Error al parsear fecha: ${dateStr}`, error);
      return null;
    }
  };

  // Función auxiliar para convertir a número
  const parseNumber = (numStr) => {
    if (!numStr || numStr?.trim() === '') return null;
    const num = parseFloat(numStr.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? null : num;
  };

  // Mapeo de campos del CSV a los campos del modelo Employee
  // IGNORAMOS campos calculados: EDAD, ANTIGUEDAD EN LA EMPRESA, FECHA EN LETRA, SALARIO EN LETRAS, SD, SDI, FECHAS DE VENCIMIENTO
  const employeeData = {
    // Datos Personales
    clave: row['CLAVE'] || row['clave'] || null,
    nombres: row['NOMBRES'] || row['NOMBRES(S)'] || row['nombres'] || null,
    apellidoPaterno: row['APELLIDO PATERNO'] || row['APELLIDO_PATERNO'] || row['apellidoPaterno'] || null,
    apellidoMaterno: row['APELLIDO MATERNO'] || row['APELLIDO_MATERNO'] || row['apellidoMaterno'] || null,
    nombre: `${row['NOMBRES'] || row['NOMBRES(S)'] || ''} ${row['APELLIDO PATERNO'] || ''} ${row['APELLIDO MATERNO'] || ''}`.trim() || 
            row['NOMBRE'] || row['nombre'] || null,
    fechaNacimiento: parseDate(row['FECHA NACIMIENTO'] || row['FECHA_NACIMIENTO'] || row['fechaNacimiento']),
    lugarNacimiento: row['LUGAR NACIMIENTO'] || row['LUGAR_NACIMIENTO'] || row['lugarNacimiento'] || null,
    estadoCivil: row['ESTADO CIVIL'] || row['ESTADO_CIVIL'] || row['estadoCivil'] || null,
    nacionalidad: row['NACIONALIDAD'] || row['nacionalidad'] || null,
    sexo: row['SEXO'] || row['sexo'] || null,
    nivelAcademico: row['NIVEL ACADEMICO'] || row['NIVEL_ACADEMICO'] || row['nivelAcademico'] || null,
    
    // Contacto y Dirección
    telefonoCasa: row['TELEFONO CASA'] || row['TELEFONO_CASA'] || row['telefonoCasa'] || null,
    telefonoMovil: row['TELEFONO MOVIL'] || row['TELEFONO_MOVIL'] || row['telefonoMovil'] || null,
    correoElectronico: row['CORREO ELECTRONICO'] || row['CORREO_ELECTRONICO'] || row['correoElectronico'] || null,
    correoEmpresa: row['CORREO EMPRESA'] || row['CORREO_EMPRESA'] || row['correoEmpresa'] || null,
    direccionCompleta: row['DIRECCION COMPLETA'] || row['DIRECCION_COMPLETA'] || row['direccionCompleta'] || null,
    estado: row['ESTADO'] || row['estado'] || null,
    cpFiscal: row['CP FISCAL'] || row['CP_FISCAL'] || row['cpFiscal'] || null,
    
    // Datos Legales
    rfc: row['RFC'] || row['rfc'] || null,
    curp: row['CURP'] || row['curp'] || null,
    nss: row['NSS'] || row['REGISTRO IMSS'] || row['nss'] || row['registroImss'] || null,
    
    // Datos Laborales
    fechaAlta: parseDate(row['FECHA ALTA'] || row['FECHA_ALTA'] || row['fechaAlta'] || row['fecha_ingreso']),
    fechaBaja: parseDate(row['FECHA BAJA'] || row['FECHA_BAJA'] || row['fechaBaja']),
    estatus: row['ESTATUS'] || row['estatus'] || 'Activo',
    sucursal: row['SUCURSAL'] || row['sucursal'] || null,
    area: row['AREA'] || row['area'] || null,
    region: row['REGION'] || row['region'] || null,
    contrato: row['CONTRATO'] || row['contrato'] || null,
    horario: row['HORARIO'] || row['horario'] || null,
    puesto: row['PUESTO'] || row['puesto'] || null,
    departamento_nombre: row['DEPARTAMENTO'] || row['DEPARTAMENTO_ID'] || row['departamento_id'] || row['departamento'] || null,
    
    // Datos Financieros
    salarioMensual: parseNumber(row['SALARIO MENSUAL'] || row['SALARIO_MENSUAL'] || row['salarioMensual'] || row['salary']),
    clabe: row['CLABE'] || row['clabe'] || null,
    numeroCuenta: row['NUMERO CUENTA'] || row['NUMERO_CUENTA'] || row['numeroCuenta'] || null,
    banco: row['BANCO'] || row['banco'] || null,
    
    // Nuevos campos: Jefe Directo, SD, SDI
    jefeDirecto: row['JEFE DIRECTO'] || row['JEFE_DIRECTO'] || row['jefeDirecto'] || null,
    sd: parseNumber(row['SD'] || row['sd'] || null),
    sdi: parseNumber(row['SDI'] || row['sdi'] || null),
    
    // Uniformes y Extras
    tallaCamisa: row['TALLA CAMISA'] || row['TALLA_CAMISA'] || row['tallaCamisa'] || null,
    tallaPlayera: row['TALLA PLAYERA'] || row['TALLA_PLAYERA'] || row['tallaPlayera'] || null,
    tallaPantalon: row['TALLA PANTALON'] || row['TALLA_PANTALON'] || row['tallaPantalon'] || null,
    tallaZapatos: row['TALLA ZAPATOS'] || row['TALLA_ZAPATOS'] || row['tallaZapatos'] || null,
    nombreConyuge: row['NOMBRE CONYUGE'] || row['NOMBRE_CONYUGE'] || row['nombreConyuge'] || null,
    
    // Beneficiarios
    beneficiario1: row['BENEFICIARIO 1'] || row['BENEFICIARIO_1'] || row['beneficiario1'] || null,
    fechaNacBeneficiario1: parseDate(row['FECHA NAC BENEFICIARIO 1'] || row['FECHA_NAC_BENEFICIARIO_1'] || row['fechaNacBeneficiario1']),
    porcentaje1: parseNumber(row['PORCENTAJE 1'] || row['PORCENTAJE_1'] || row['porcentaje1']),
    beneficiario2: row['BENEFICIARIO 2'] || row['BENEFICIARIO_2'] || row['beneficiario2'] || null,
    fechaNacBeneficiario2: parseDate(row['FECHA NAC BENEFICIARIO 2'] || row['FECHA_NAC_BENEFICIARIO_2'] || row['fechaNacBeneficiario2']),
    porcentaje2: parseNumber(row['PORCENTAJE 2'] || row['PORCENTAJE_2'] || row['porcentaje2'])
  };

  // Normalizar strings a mayúsculas donde sea apropiado
  if (employeeData.rfc) employeeData.rfc = employeeData.rfc.toUpperCase();
  if (employeeData.curp) employeeData.curp = employeeData.curp.toUpperCase();
  if (employeeData.estatus) employeeData.estatus = employeeData.estatus.charAt(0).toUpperCase() + employeeData.estatus.slice(1);
  
  // Normalizar departamento y puesto a MAYÚSCULAS (regla del sistema)
  if (employeeData.departamento_nombre) {
    employeeData.departamento_nombre = employeeData.departamento_nombre.toUpperCase().trim();
  }
  if (employeeData.puesto) {
    employeeData.puesto = employeeData.puesto.toUpperCase().trim();
  }

  return employeeData;
}

/**
 * Valida los datos mínimos requeridos de un empleado
 * @param {Object} employeeData - Datos del empleado mapeados
 * @returns {Array} Array de errores, vacío si no hay errores
 */
function validateEmployeeData(employeeData, rowNumber = 0) {
  const errors = [];

  if (!employeeData.rfc) {
    errors.push(`Fila ${rowNumber}: RFC es requerido`);
  } else if (employeeData.rfc.length !== 13) {
    errors.push(`Fila ${rowNumber}: RFC debe tener exactamente 13 caracteres (tiene ${employeeData.rfc.length})`);
  }

  if (!employeeData.curp) {
    errors.push(`Fila ${rowNumber}: CURP es requerido`);
  } else if (employeeData.curp.length !== 18) {
    errors.push(`Fila ${rowNumber}: CURP debe tener exactamente 18 caracteres (tiene ${employeeData.curp.length})`);
  }

  if (!employeeData.nss) {
    errors.push(`Fila ${rowNumber}: NSS es requerido`);
  } else if (!/^\d+$/.test(employeeData.nss)) {
    errors.push(`Fila ${rowNumber}: NSS debe contener solo dígitos`);
  } else if (employeeData.nss.length < 10 || employeeData.nss.length > 11) {
    errors.push(`Fila ${rowNumber}: NSS debe tener entre 10 y 11 dígitos (tiene ${employeeData.nss.length})`);
  }

  if (!employeeData.fechaAlta) {
    errors.push(`Fila ${rowNumber}: FECHA ALTA es requerida`);
  }

  if (!employeeData.puesto) {
    errors.push(`Fila ${rowNumber}: PUESTO es requerido`);
  }

  if (employeeData.estatus && !['Activo', 'Inactivo'].includes(employeeData.estatus)) {
    errors.push(`Fila ${rowNumber}: ESTATUS debe ser "Activo" o "Inactivo" (valor recibido: "${employeeData.estatus}")`);
  }

  if (employeeData.salarioMensual && isNaN(employeeData.salarioMensual)) {
    errors.push(`Fila ${rowNumber}: SALARIO MENSUAL debe ser un número válido`);
  }

  if (employeeData.porcentaje1 && (employeeData.porcentaje1 < 0 || employeeData.porcentaje1 > 100)) {
    errors.push(`Fila ${rowNumber}: PORCENTAJE 1 debe estar entre 0 y 100`);
  }

  if (employeeData.porcentaje2 && (employeeData.porcentaje2 < 0 || employeeData.porcentaje2 > 100)) {
    errors.push(`Fila ${rowNumber}: PORCENTAJE 2 debe estar entre 0 y 100`);
  }

  return errors;
}

/**
 * Prepara los datos para inserción en Prisma
 * @param {Object} employeeData - Datos del empleado mapeados
 * @param {Object} prisma - Instancia de PrismaClient
 * @returns {Object} Datos listos para Prisma.create()
 */
async function prepareForPrisma(employeeData, prisma) {
  // Buscar departamento por nombre o ID
  let departamento_id = employeeData.departamento_id;
  const departamentoValue = employeeData.departamento_nombre;
  
  if (departamentoValue && !departamento_id) {
    try {
      // Primero verificar si es un ID numérico (UUIDs no son numéricos)
      const numericValue = departamentoValue.trim();
      const isNumeric = /^\d+$/.test(numericValue);
      
      if (isNumeric) {
        // Buscar directamente por ID (UUIDs no son numéricos, pero algunos IDs podrían ser)
        const departamentoById = await prisma.department.findUnique({
          where: { id: numericValue },
          select: { id: true }
        });
        
        if (departamentoById) {
          departamento_id = departamentoById.id;
        } else {
          // Si no se encuentra por ID, intentar mapear IDs numéricos a nombres
          const numericIdMap = {
            '1': 'SISTEMAS',
            '2': 'COMPRAS', 
            '3': 'RH',
            '4': 'Administración',
            '5': 'Ventas',
            '6': 'Marketing',
            '7': 'PRODUCCION'
          };
          
          if (numericIdMap[numericValue]) {
            // Buscar el departamento por el nombre mapeado
            const mappedDepartamento = await prisma.department.findFirst({
              where: {
                nombre: {
                  equals: numericIdMap[numericValue],
                  mode: 'insensitive'
                }
              },
              select: { id: true }
            });
            
            if (mappedDepartamento) {
              departamento_id = mappedDepartamento.id;
            } else {
              throw new Error(`Departamento no encontrado para ID numérico "${numericValue}". El sistema espera nombres como "Sistemas", "RH", etc.`);
            }
          } else {
            throw new Error(`ID de departamento no válido: "${numericValue}". IDs válidos: 1-7 o nombres de departamento.`);
          }
        }
      } else {
        // No es numérico, buscar por nombre (exacto, los datos ya vienen en mayúsculas)
        const departamentoByName = await prisma.department.findFirst({
          where: {
            nombre: departamentoValue.trim()
          },
          select: { id: true }
        });
        
        if (departamentoByName) {
          departamento_id = departamentoByName.id;
        } else {
          // Si no se encuentra por nombre exacto, intentar búsqueda insensible
          const departamentoInsensitive = await prisma.department.findFirst({
            where: {
              nombre: {
                equals: departamentoValue.trim(),
                mode: 'insensitive'
              }
            },
            select: { id: true }
          });
          
          if (departamentoInsensitive) {
            departamento_id = departamentoInsensitive.id;
          } else {
            // CREACIÓN DINÁMICA: El departamento no existe, crearlo automáticamente
            // Esto permite que al escribir un departamento nuevo en el Excel, el sistema lo cree
            console.log(`🏗️ Departamento no encontrado, creando dinámicamente: "${departamentoValue}"`);
            const nuevoDepartamento = await prisma.department.create({
              data: {
                nombre: departamentoValue.trim(), // Ya viene en MAYÚSCULAS por el normalize en mapEmployeeFromCsv
                descripcion: `Departamento importado desde CSV: ${departamentoValue}`,
                estado: 'Activo'
              },
              select: { id: true }
            });
            departamento_id = nuevoDepartamento.id;
            console.log(`✅ Departamento creado dinámicamente: ${departamentoValue} (ID: ${departamento_id})`);
          }
        }
      }
    } catch (error) {
      console.error('Error al buscar departamento:', error);
      throw error; // Re-lanzar el error para que se maneje en el controlador
    }
  }

  // El departamento es opcional - si no se especifica, se deja como null
  // El empleado se creará sin departamento asignado

  // Buscar puesto por nombre (si se proporciona)
  let puestoId = null;
  const puestoNombre = employeeData.puesto;
  
  if (puestoNombre) {
    try {
      // Buscar el puesto por nombre en el departamento correspondiente
      const puesto = await prisma.jobPosition.findFirst({
        where: {
          nombre: {
            equals: puestoNombre.trim(),
            mode: 'insensitive'
          },
          departamentoId: departamento_id
        },
        select: { id: true }
      });
      
      if (puesto) {
        puestoId = puesto.id;
      } else {
        // Si no se encuentra, crear un nuevo puesto
        const nuevoPuesto = await prisma.jobPosition.create({
          data: {
            nombre: puestoNombre.trim(),
            descripcion: `Puesto importado desde CSV: ${puestoNombre}`,
            departamentoId: departamento_id,
            nivelJerarquico: 'OPERATIVO',
            estado: 'Activo'
          },
          select: { id: true }
        });
        
        puestoId = nuevoPuesto.id;
        console.log(`✅ Puesto creado: ${puestoNombre} en departamento ${departamento_id}`);
      }
    } catch (error) {
      console.error('Error al buscar/crear puesto:', error);
      // Si hay error, continuar sin puestoId (será null)
    }
  }

  return {
    clave: employeeData.clave,
    nombres: employeeData.nombres,
    apellidoPaterno: employeeData.apellidoPaterno,
    apellidoMaterno: employeeData.apellidoMaterno,
    nombre: employeeData.nombre,
    fechaNacimiento: employeeData.fechaNacimiento,
    lugarNacimiento: employeeData.lugarNacimiento,
    estadoCivil: employeeData.estadoCivil,
    nacionalidad: employeeData.nacionalidad,
    sexo: employeeData.sexo,
    nivelAcademico: employeeData.nivelAcademico,
    telefonoCasa: employeeData.telefonoCasa,
    telefonoMovil: employeeData.telefonoMovil,
    correoElectronico: employeeData.correoElectronico,
    correoEmpresa: employeeData.correoEmpresa,
    direccionCompleta: employeeData.direccionCompleta,
    estado: employeeData.estado,
    cpFiscal: employeeData.cpFiscal,
    rfc: employeeData.rfc,
    curp: employeeData.curp,
    nss: employeeData.nss,
    fechaAlta: employeeData.fechaAlta,
    fechaBaja: employeeData.fechaBaja,
    estatus: employeeData.estatus,
    sucursal: employeeData.sucursal,
    area: employeeData.area,
    region: employeeData.region,
    contrato: employeeData.contrato,
    horario: employeeData.horario,
    puestoId: puestoId,
    departamento_id: departamento_id,
    salarioMensual: employeeData.salarioMensual,
    clabe: employeeData.clabe,
    numeroCuenta: employeeData.numeroCuenta,
    banco: employeeData.banco,
    jefeDirecto: employeeData.jefeDirecto,
    sd: employeeData.sd,
    sdi: employeeData.sdi,
    tallaCamisa: employeeData.tallaCamisa,
    tallaPlayera: employeeData.tallaPlayera,
    tallaPantalon: employeeData.tallaPantalon,
    tallaZapatos: employeeData.tallaZapatos,
    nombreConyuge: employeeData.nombreConyuge,
    beneficiario1: employeeData.beneficiario1,
    fechaNacBeneficiario1: employeeData.fechaNacBeneficiario1,
    porcentaje1: employeeData.porcentaje1,
    beneficiario2: employeeData.beneficiario2,
    fechaNacBeneficiario2: employeeData.fechaNacBeneficiario2,
    porcentaje2: employeeData.porcentaje2
  };
}

module.exports = {
  mapEmployeeFromCsv,
  validateEmployeeData,
  prepareForPrisma,
  validateCsvHeaders
};
