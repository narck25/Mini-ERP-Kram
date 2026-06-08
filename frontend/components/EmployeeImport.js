'use client';

import { useState } from 'react';
import api from '@/lib/api';

const TEMPLATE_COLUMNS = [
  'CLAVE', 'NOMBRES', 'APELLIDO PATERNO', 'APELLIDO MATERNO',
  'RFC', 'CURP', 'NSS',
  'FECHA NACIMIENTO', 'LUGAR NACIMIENTO', 'ESTADO CIVIL', 'NACIONALIDAD', 'SEXO', 'NIVEL ACADEMICO',
  'TELEFONO CASA', 'TELEFONO MOVIL', 'CORREO ELECTRONICO', 'CORREO EMPRESA',
  'DIRECCION COMPLETA', 'ESTADO', 'CP FISCAL',
  'FECHA ALTA', 'FECHA BAJA', 'ESTATUS', 'SUCURSAL', 'AREA', 'REGION', 'CONTRATO', 'HORARIO', 'DEPARTAMENTO', 'PUESTO',
  'SALARIO MENSUAL', 'CLABE', 'NUMERO CUENTA', 'BANCO',
  'JEFE DIRECTO', 'SD', 'SDI',
  'NIVEL JERARQUICO', 'JEFE DIRECTO (CLAVE)',
  'TALLA CAMISA', 'TALLA PLAYERA', 'TALLA PANTALON', 'TALLA ZAPATOS', 'NOMBRE CONYUGE',
  'BENEFICIARIO 1', 'FECHA NAC BENEFICIARIO 1', 'PORCENTAJE 1',
  'BENEFICIARIO 2', 'FECHA NAC BENEFICIARIO 2', 'PORCENTAJE 2'
];

export default function EmployeeImport({ show, onClose, onSaved }) {
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [createUsers, setCreateUsers] = useState(false);

  const downloadTemplate = () => {
    // Crear contenido CSV con cabeceras y una fila de ejemplo
    const headerRow = TEMPLATE_COLUMNS.join(',');
    const exampleRow = [
      'EMP001', 'JUAN', 'PEREZ', 'GARCIA',
      'PEPJ800101ABC', 'PEPJ800101HDFRRN01', '12345678901',
      '01/01/1980', 'CIUDAD DE MEXICO', 'CASADO', 'MEXICANA', 'MASCULINO', 'LICENCIATURA',
      '5512345678', '5512345678', 'juan@correo.com', 'juan@empresa.com',
      'CALLE 123 COL CENTRO', 'CDMX', '06600',
      '01/01/2024', '', 'Activo', 'MATRIZ', 'SISTEMAS', 'CENTRO', 'INDETERMINADO', '9:00-18:00', 'SISTEMAS', 'ANALISTA',
      '25000', '012345678901234567', '1234567890', 'BBVA',
      'MARIA LOPEZ', '833.33', '961.54',
      'ANALISTA', 'EMP001',
      'M', 'M', '30', '27', 'MARIA LOPEZ',
      'PEDRO PEREZ', '01/01/2000', '50',
      'ANA PEREZ', '01/01/2005', '50'
    ];
    const exampleRowStr = exampleRow.join(',');

    const BOM = '\uFEFF';
    const csvContent = BOM + headerRow + '\n' + exampleRowStr + '\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_empleados.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    setImporting(true);
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('createUsers', createUsers.toString());

      const response = await api.post('/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImportResults(response.data);
      if (response.data.imported > 0) {
        onSaved();
      }
    } catch (error) {
      setImportResults({
        imported: 0,
        errors: 1,
        errorDetails: [error.response?.data?.error || 'Error al importar el archivo']
      });
    } finally {
      setImporting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Importar Empleados desde CSV</h3>
            <button
              onClick={() => {
                onClose();
                setCsvFile(null);
                setImportResults(null);
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Cerrar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleImport}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar archivo CSV
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m0 0a4 4 0 004 4h12m4-24v8m0 0v8m0-8h8m-8 0h-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>Subir archivo</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept=".csv"
                        onChange={(e) => setCsvFile(e.target.files[0])}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">o arrastrar y soltar</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV hasta 5MB</p>
                  {csvFile && (
                    <p className="text-sm text-green-600 mt-2">
                      Archivo seleccionado: {csvFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={createUsers}
                  onChange={(e) => setCreateUsers(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Crear usuarios automáticamente para los empleados importados
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Se creará un usuario con rol EMPLEADO_BASICO usando el correo del empleado.
                La contraseña temporal será los primeros 10 caracteres del RFC.
              </p>
            </div>

            {importResults && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">Resultados de importación:</h4>
                <p className="text-sm text-gray-600">
                  Importados: {importResults.imported} | Errores: {importResults.errors}
                </p>
                {importResults.errorDetails && importResults.errorDetails.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Detalles de errores:</p>
                    <ul className="text-sm text-red-600 mt-1 max-h-32 overflow-y-auto">
                      {importResults.errorDetails.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={downloadTemplate}
                className="px-4 py-2 border border-green-300 text-green-700 rounded-md hover:bg-green-50 inline-flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar plantilla
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setCsvFile(null);
                  setImportResults(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!csvFile || importing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importando...
                  </>
                ) : 'Importar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
