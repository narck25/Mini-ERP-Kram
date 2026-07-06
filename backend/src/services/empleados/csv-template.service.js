/**
 * csv-template.service.js
 * Plantillas y helpers para importación/exportación CSV de empleados.
 * Extraído de employee-csv.controller.js.
 */

// Encabezados de la plantilla CSV (usados tanto en download como export)
const CSV_HEADERS = [
  'CLAVE', 'NOMBRES', 'APELLIDO PATERNO', 'APELLIDO MATERNO', 'FECHA NACIMIENTO',
  'LUGAR NACIMIENTO', 'ESTADO CIVIL', 'NACIONALIDAD', 'SEXO', 'NIVEL ACADEMICO',
  'TELEFONO CASA', 'TELEFONO MOVIL', 'CORREO ELECTRONICO', 'CORREO EMPRESA',
  'DIRECCION COMPLETA', 'ESTADO', 'CP FISCAL',
  'RFC', 'CURP', 'NSS',
  'FECHA ALTA', 'FECHA BAJA', 'ESTATUS', 'SUCURSAL', 'AREA', 'REGION',
  'CONTRATO', 'HORARIO', 'PUESTO', 'DEPARTAMENTO',
  'SALARIO MENSUAL', 'CLABE', 'NUMERO CUENTA', 'BANCO',
  'NIVEL JERARQUICO', 'JEFE DIRECTO', 'JEFE DIRECTO (CLAVE)', 'SD', 'SDI',
  'TALLA CAMISA', 'TALLA PLAYERA', 'TALLA PANTALON', 'TALLA ZAPATOS', 'NOMBRE CONYUGE',
  'BENEFICIARIO 1', 'FECHA NAC BENEFICIARIO 1', 'PORCENTAJE 1',
  'BENEFICIARIO 2', 'FECHA NAC BENEFICIARIO 2', 'PORCENTAJE 2'
];

const EXAMPLE_ROW = [
  'EMP001', 'Juan', 'Pérez', 'López', '1980-01-01', 'Ciudad de México', 'Casado', 'Mexicana', 'Masculino', 'Licenciatura',
  '5551234567', '5559876543', 'juan.perez@email.com', 'juan.perez@empresa.com', 'Calle Principal 123, Colonia Centro', 'Ciudad de México', '06000',
  'PELJ800101ABC', 'PELJ800101HDFRPN09', '12345678901',
  '2024-01-15', '', 'Activo', 'Sucursal Centro', 'TI', 'Centro', 'Indeterminado', '9:00-18:00', 'Desarrollador Senior', 'Sistemas',
  '25000.00', '012180001234567890', '1234567890', 'Banco Ejemplo',
  'ANALISTA', 'María Rodríguez', 'EMP001', '833.33', '900.00',
  'M', 'M', '32', '9', 'María González',
  'Ana Pérez González', '2010-05-15', '50', 'Carlos Pérez González', '2012-08-20', '50'
];

const escapeCSV = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const sv = String(value);
  if (sv.includes('"') || sv.includes(',') || sv.includes('\n') || sv.includes('\r')) return '"' + sv.replace(/"/g, '""') + '"';
  return sv;
};

const dateStr = (date) => date ? new Date(date).toISOString().split('T')[0] : '';

// Mapea un Employee de Prisma a fila CSV
const employeeToRow = (emp) => [
  emp.clave || '', emp.nombres || '', emp.apellidoPaterno || '', emp.apellidoMaterno || '',
  dateStr(emp.fechaNacimiento), emp.lugarNacimiento || '', emp.estadoCivil || '', emp.nacionalidad || '', emp.sexo || '', emp.nivelAcademico || '',
  emp.telefonoCasa || '', emp.telefonoMovil || '', emp.correoElectronico || '', emp.correoEmpresa || '',
  emp.direccionCompleta || '', emp.estado || '', emp.cpFiscal || '',
  emp.rfc || '', emp.curp || '', emp.nss || '',
  dateStr(emp.fechaAlta), dateStr(emp.fechaBaja), emp.estatus || '',
  emp.sucursal || '', emp.area || '', emp.region || '', emp.contrato || '', emp.horario || '',
  emp.puesto?.nombre || '', emp.departamento?.nombre || '',
  emp.salarioMensual || '', emp.clabe || '', emp.numeroCuenta || '', emp.banco || '',
  emp.nivelJerarquico || '', emp.reportaA?.nombre || emp.jefeDirecto || '', emp.reportaA?.clave || '',
  emp.sd || '', emp.sdi || '',
  emp.tallaCamisa || '', emp.tallaPlayera || '', emp.tallaPantalon || '', emp.tallaZapatos || '', emp.nombreConyuge || '',
  emp.beneficiario1 || '', dateStr(emp.fechaNacBeneficiario1), emp.porcentaje1 || '',
  emp.beneficiario2 || '', dateStr(emp.fechaNacBeneficiario2), emp.porcentaje2 || ''
];

const generateTemplateCSV = () => {
  const notes = [
    '', 'NOTAS IMPORTANTES:',
    '1. Las fechas deben estar en formato YYYY-MM-DD o DD/MM/YYYY',
    '2. ESTATUS puede ser "Activo" o "Inactivo"',
    '3. DEPARTAMENTO debe escribirse en MAYÚSCULAS',
    '4. PUESTO debe escribirse en MAYÚSCULAS',
    '5. SALARIO MENSUAL debe ser un número decimal',
    '6. RFC (13 caracteres), CURP (18 caracteres), NSS (11 dígitos)',
    '7. CAMPOS OBLIGATORIOS: RFC, CURP, NSS, FECHA ALTA, PUESTO'
  ];
  return '\ufeff' + CSV_HEADERS.map(escapeCSV).join(',') + '\n' + EXAMPLE_ROW.map(escapeCSV).join(',') + '\n' + notes.join('\n');
};

const generateExportCSV = (employees) => {
  const rows = employees.map(employeeToRow);
  return '\ufeff' + CSV_HEADERS.map(escapeCSV).join(',') + '\n' + rows.map(r => r.map(escapeCSV).join(',')).join('\n');
};

module.exports = { CSV_HEADERS, EXAMPLE_ROW, escapeCSV, employeeToRow, generateTemplateCSV, generateExportCSV };