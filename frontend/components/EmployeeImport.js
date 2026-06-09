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

const DUPLICATE_MODES = [
  { value: 'error', label: '❌ Error (detener importación)', description: 'Si hay duplicados, no se importa nada (rollback total)' },
  { value: 'skip', label: '⏭️ Omitir duplicados', description: 'Los empleados nuevos se importan, los existentes se saltan' },
  { value: 'update', label: '🔄 Actualizar existentes', description: 'Los empleados existentes se actualizan con los datos del CSV' },
];

export default function EmployeeImport({ show, onClose, onSaved }) {
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [createUsers, setCreateUsers] = useState(false);
  const [duplicateMode, setDuplicateMode] = useState('error');

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
      formData.append('duplicateMode', duplicateMode);

      const response = await api.post('/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImportResults(response.data);
      if (response.data.imported > 0 || response.data.updated > 0) {
        onSaved();
      }
    } catch (error) {
      const errorData = error.response?.data;
      
      // Extraer detalles del error
      let errorDetails = [];
      let summary = null;
      let message = errorData?.message || errorData?.error || 'Error al importar el archivo';
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Errores de validación (array)
        errorDetails = errorData.errors;
        summary = errorData.summary;
      } else if (errorData?.details) {
        // Error con detalles en string (modo 'error' con duplicados)
        // Separar por punto y coma para mostrar cada fila
        errorDetails = errorData.details.split('; ').map(d => d.trim()).filter(d => d);
        summary = errorData.summary || { created: 0, updated: 0, skipped: 0, failed: errorDetails.length, totalRows: errorDetails.length, successRate: '0%' };
      } else {
        errorDetails = [errorData?.error || 'Error al importar el archivo'];
      }
      
      setImportResults({
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: errorDetails.length,
        errorDetails,
        summary,
        message
      });
    } finally {
      setImporting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
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
            {/* Selector de archivo */}
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

            {/* Modo de manejo de duplicados */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Qué hacer si hay empleados ya existentes?
              </label>
              <div className="space-y-2">
                {DUPLICATE_MODES.map((mode) => (
                  <label
                    key={mode.value}
                    className={`flex items-start p-3 border rounded-md cursor-pointer transition-colors ${
                      duplicateMode === mode.value
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="duplicateMode"
                      value={mode.value}
                      checked={duplicateMode === mode.value}
                      onChange={(e) => setDuplicateMode(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900">{mode.label}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{mode.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Crear usuarios */}
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

            {/* Resultados */}
            {importResults && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Resultados de importación:</h4>
                
                {/* Resumen */}
                {importResults.summary ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    <div className="bg-green-50 p-2 rounded text-center">
                      <div className="text-lg font-bold text-green-700">{importResults.summary.created || 0}</div>
                      <div className="text-xs text-green-600">Creados</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <div className="text-lg font-bold text-blue-700">{importResults.summary.updated || 0}</div>
                      <div className="text-xs text-blue-600">Actualizados</div>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded text-center">
                      <div className="text-lg font-bold text-yellow-700">{importResults.summary.skipped || 0}</div>
                      <div className="text-xs text-yellow-600">Omitidos</div>
                    </div>
                    <div className="bg-red-50 p-2 rounded text-center">
                      <div className="text-lg font-bold text-red-700">{importResults.summary.failed || 0}</div>
                      <div className="text-xs text-red-600">Errores</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mb-3">
                    Creados: {importResults.imported} | Actualizados: {importResults.updated || 0} | 
                    Omitidos: {importResults.skipped || 0} | Errores: {importResults.errors}
                  </p>
                )}

                {/* Mensaje */}
                {importResults.message && (
                  <p className="text-sm font-medium text-gray-700 mb-2">{importResults.message}</p>
                )}

                {/* Detalle de errores */}
                {importResults.errorDetails && importResults.errorDetails.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Detalles de errores:</p>
                    <ul className="text-sm text-red-600 mt-1 max-h-32 overflow-y-auto list-disc list-inside">
                      {importResults.errorDetails.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Empleados omitidos */}
                {importResults.skippedEmployees && importResults.skippedEmployees.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-yellow-700">Empleados omitidos (ya existían):</p>
                    <ul className="text-sm text-yellow-600 mt-1 max-h-24 overflow-y-auto">
                      {importResults.skippedEmployees.map((emp, index) => (
                        <li key={index}>• {emp.nombre} (RFC: {emp.rfc})</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Empleados actualizados */}
                {importResults.updatedEmployees && importResults.updatedEmployees.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-blue-700">Empleados actualizados:</p>
                    <ul className="text-sm text-blue-600 mt-1 max-h-24 overflow-y-auto">
                      {importResults.updatedEmployees.map((emp, index) => (
                        <li key={index}>• {emp.nombre} (RFC: {emp.rfc})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={downloadTemplate}
                className="px-4 py-2 border border-green-300 text-green-700 rounded-md hover:bg-green-50 inline-flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
