'use client';

import { useMemo } from 'react';
import { fHoraStr, formatDate } from '@/utils/attendanceHelpers';

const SYMBOL_TEXT = {
  '✅': 'OK',
  '⚠️': 'TURNO CORTO',
  '❌': 'INCIDENCIA',
  '➖': 'N/A'
};

// Port directo de getSymbolAndTooltip() de kram_matrix_viewer.html, leyendo
// los campos ya calculados por procesarAsistencia() en vez de texto de CSV.
function getSymbolAndTooltip(row) {
  if (!row) return { symbol: '➖', tooltip: 'Sin registro' };

  const entrada = fHoraStr(row.t1);
  const salida = fHoraStr(row.t6);
  const hasValidEntry = entrada !== '--:--';
  const hasValidExit = salida !== '--:--';

  let symbol = '➖';
  if (hasValidEntry && hasValidExit) {
    symbol = '✅';
    if (row.estatus === 'Información') symbol = '⚠️';
    else if (row.estatus === 'Crítico') symbol = '❌';
  } else if (hasValidEntry || hasValidExit) {
    symbol = '❌';
  }

  return { symbol, tooltip: `Entrada: ${entrada} - Salida: ${salida} (${row.totalHoras || '0'}h)` };
}

export default function AttendanceMatrixView({ allDatos, datos }) {
  // Las fechas-columna salen de allDatos (sin filtrar) para que no se muevan
  // al buscar; solo las filas de empleado respetan el filtro (datos).
  const dates = useMemo(() => {
    return [...new Set((allDatos || []).map((r) => r.fecha))].sort();
  }, [allDatos]);

  const employees = useMemo(() => {
    const map = new Map();
    (datos || []).forEach((row) => {
      if (!map.has(row.numeroEmpleado)) {
        map.set(row.numeroEmpleado, { numeroEmpleado: row.numeroEmpleado, nombre: row.nombre });
      }
    });
    return Array.from(map.values()).sort((a, b) => (parseInt(a.numeroEmpleado) || 0) - (parseInt(b.numeroEmpleado) || 0));
  }, [datos]);

  const lookup = useMemo(() => {
    const map = new Map();
    (allDatos || []).forEach((row) => map.set(`${row.numeroEmpleado}-${row.fecha}`, row));
    return map;
  }, [allDatos]);

  const exportMatrix = () => {
    if (employees.length === 0) return alert('No hay datos para exportar');

    let csv = 'No.,Nombre,';
    dates.forEach((d) => { csv += `${formatDate(d)},`; });
    csv += 'Total Asistencias,Total Incidencias\n';

    employees.forEach((emp) => {
      let asistencias = 0, incidencias = 0;
      let fila = `"${emp.numeroEmpleado}","${emp.nombre}",`;
      dates.forEach((d) => {
        const { symbol } = getSymbolAndTooltip(lookup.get(`${emp.numeroEmpleado}-${d}`));
        fila += `"${SYMBOL_TEXT[symbol]}",`;
        if (symbol === '✅' || symbol === '⚠️') asistencias++;
        if (symbol === '❌') incidencias++;
      });
      csv += `${fila}"${asistencias}","${incidencias}"\n`;
    });

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Matriz_Asistencia.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyMatrix = () => {
    if (employees.length === 0) return alert('No hay datos para copiar');

    let tsv = 'No.\tNombre\t';
    dates.forEach((d) => { tsv += `${formatDate(d)}\t`; });
    tsv += 'Total Asistencias\tTotal Incidencias\n';

    employees.forEach((emp) => {
      let asistencias = 0, incidencias = 0;
      let fila = `${emp.numeroEmpleado}\t${emp.nombre}\t`;
      dates.forEach((d) => {
        const { symbol } = getSymbolAndTooltip(lookup.get(`${emp.numeroEmpleado}-${d}`));
        fila += `${symbol}\t`;
        if (symbol === '✅' || symbol === '⚠️') asistencias++;
        if (symbol === '❌') incidencias++;
      });
      tsv += `${fila}${asistencias}\t${incidencias}\n`;
    });

    navigator.clipboard.writeText(tsv).then(() => alert('Matriz copiada al portapapeles. Ya puedes pegarla en Excel.'));
  };

  if (employees.length === 0 || dates.length === 0) {
    return <div className="px-6 py-8 text-center text-gray-500">No hay datos para mostrar en la matriz.</div>;
  }

  return (
    <div>
      {/* Leyenda compacta */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs text-gray-600">
        <span>✅ Asistencia normal</span>
        <span>⚠️ Turno corto</span>
        <span>❌ Incidencia / falta</span>
        <span>➖ Sin registro</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">No.</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Nombre</th>
              {dates.map((d) => (
                <th key={d} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                  {formatDate(d)}
                </th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Total Asist.</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Total Incid.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employees.map((emp) => {
              let asistencias = 0, incidencias = 0;
              const cells = dates.map((d) => {
                const { symbol, tooltip } = getSymbolAndTooltip(lookup.get(`${emp.numeroEmpleado}-${d}`));
                if (symbol === '✅' || symbol === '⚠️') asistencias++;
                if (symbol === '❌') incidencias++;
                return { d, symbol, tooltip };
              });
              return (
                <tr key={emp.numeroEmpleado} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">{emp.numeroEmpleado}</td>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">{emp.nombre}</td>
                  {cells.map(({ d, symbol, tooltip }) => (
                    <td key={d} className="px-2 py-2 text-center" title={tooltip}>{symbol}</td>
                  ))}
                  <td className="px-3 py-2 text-center text-sm text-gray-900">{asistencias}</td>
                  <td className="px-3 py-2 text-center text-sm text-gray-900">{incidencias}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-3 px-6 py-4 border-t border-gray-200">
        <button onClick={exportMatrix} className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
          Exportar Matriz
        </button>
        <button onClick={copyMatrix} className="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
          Copiar Tabla
        </button>
      </div>
    </div>
  );
}
