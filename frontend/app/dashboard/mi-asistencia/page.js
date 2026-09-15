'use client'

import { useState, useEffect, useMemo } from 'react'
import { attendanceApi } from '@/lib/api/attendance'
import DashboardLayout from '@/components/DashboardLayout'
import { toast } from 'react-hot-toast'

const toISODate = (date) => date.toISOString().slice(0, 10)

export default function MiAsistenciaPage() {
  const today = new Date()
  const hace30Dias = new Date()
  hace30Dias.setDate(today.getDate() - 30)

  const [startDate, setStartDate] = useState(toISODate(hace30Dias))
  const [endDate, setEndDate] = useState(toISODate(today))
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadRecords = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await attendanceApi.getMy(startDate, endDate)
      setRecords(res.data.data || [])
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'No se pudo cargar tu asistencia')
      toast.error('Error al cargar tu asistencia')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrar = (e) => {
    e.preventDefault()
    loadRecords()
  }

  // Misma lógica exacta que /rh/incidencias (agrupación T1-T6 por día, corte AM/PM a las 12:30)
  const procesarAsistencia = (registros) => {
    const reporte = {};
    registros.forEach(rec => {
      const d = new Date(rec.fechaHora);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const fecha = `${year}-${month}-${day}`;
      const key = `${rec.numeroEmpleado}-${fecha}`;
      if (!reporte[key]) {
        reporte[key] = { numeroEmpleado: rec.numeroEmpleado, nombre: rec.nombreEmpleado, fecha, rawPunches: [] };
      }
      reporte[key].rawPunches.push(new Date(rec.fechaHora));
    });

    const resultado = Object.values(reporte).map(dia => {
      let punches = dia.rawPunches.sort((a, b) => a - b);

      punches = punches.filter((time, index) => {
        if (index === 0) return true;
        return ((time - punches[index - 1]) / 60000) > 5;
      });

      const amPunches = [];
      const pmPunches = [];
      punches.forEach(p => {
        const h = p.getHours(), m = p.getMinutes();
        if (h < 12 || (h === 12 && m <= 30)) amPunches.push(p);
        else pmPunches.push(p);
      });

      let t1 = null, t2 = null, t3 = null, t4 = null, t5 = null, t6 = null;
      let alertas = [];

      if (amPunches.length > 0) {
        t1 = amPunches[0];
        if (amPunches.length >= 2) t2 = amPunches[1];
        if (amPunches.length >= 3) t3 = amPunches[2];
      } else {
        alertas.push("❌ Falta Entrada Mañana");
      }

      if (pmPunches.length > 0) {
        t6 = pmPunches[pmPunches.length - 1];
        const pmInt = pmPunches.slice(0, pmPunches.length - 1);
        if (pmInt.length >= 1) t4 = pmInt[0];
        if (pmInt.length >= 2) t5 = pmInt[1];
      }

      dia.t1 = t1; dia.t2 = t2; dia.t3 = t3; dia.t4 = t4; dia.t5 = t5; dia.t6 = t6;
      dia.desayunoMin = (t2 && t3) ? Math.round((t3 - t2) / 60000) : 0;
      dia.comidaMin = (t4 && t5) ? Math.round((t5 - t4) / 60000) : 0;
      dia.totalHoras = (t1 && t6) ? ((t6 - t1) / 3600000).toFixed(1) : "0.0";

      if (t2 && !t3) alertas.push("❓ Falta Regreso Desayuno");
      if (dia.desayunoMin > 20) alertas.push(`⚠️ Desayuno Excedido`);
      if (t4 && !t5) alertas.push("❓ Falta Regreso Comida");
      if (dia.comidaMin > 65) alertas.push(`⚠️ Comida Excedida`);
      if (!t1 || !t6) alertas.push("❌ Registro Incompleto");
      else if (parseFloat(dia.totalHoras) < 6.5) alertas.push("ℹ️ Turno Corto");

      if (alertas.some(a => a.includes("❌"))) dia.estatus = 'Crítico';
      else if (alertas.some(a => a.includes("⚠️") || a.includes("❓"))) dia.estatus = 'Atención';
      else if (alertas.some(a => a.includes("ℹ️"))) dia.estatus = 'Información';
      else dia.estatus = 'Normal';

      dia.alertasText = alertas.join(', ');
      return dia;
    });

    return resultado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  };

  const datosProcesados = useMemo(() => {
    if (!records || records.length === 0) return [];
    return procesarAsistencia(records);
  }, [records]);

  const estadisticas = useMemo(() => {
    if (datosProcesados.length === 0) {
      return { normal: 0, atencion: 0, critico: 0, informacion: 0 };
    }
    return {
      normal: datosProcesados.filter(d => d.estatus === 'Normal').length,
      atencion: datosProcesados.filter(d => d.estatus === 'Atención').length,
      critico: datosProcesados.filter(d => d.estatus === 'Crítico').length,
      informacion: datosProcesados.filter(d => d.estatus === 'Información').length,
    };
  }, [datosProcesados]);

  const fHora = (date) => {
    if (!date) return '-';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getStatusColor = (estatus) => {
    switch (estatus) {
      case 'Normal': return 'bg-green-100 text-green-800';
      case 'Atención': return 'bg-yellow-100 text-yellow-800';
      case 'Crítico': return 'bg-red-100 text-red-800';
      case 'Información': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (estatus) => {
    switch (estatus) {
      case 'Normal': return '✅';
      case 'Atención': return '⚠️';
      case 'Crítico': return '❌';
      case 'Información': return 'ℹ️';
      default: return '';
    }
  };

  const copyToClipboard = () => {
    if (datosProcesados.length === 0) return toast.error('No hay datos para copiar');
    let tsv = 'Fecha\tEntrada\tDesayuno\tComida\tSalida\tTotal\tEstado\n';
    datosProcesados.forEach(row => {
      const desayunoText = `${fHora(row.t2)} / ${fHora(row.t3)} (${row.desayunoMin} min)`;
      const comidaText = `${fHora(row.t4)} / ${fHora(row.t5)} (${row.comidaMin} min)`;
      const estadoText = `${getStatusIcon(row.estatus)} ${row.estatus}`;
      tsv += `${formatDate(row.fecha)}\t${fHora(row.t1)}\t${desayunoText}\t${comidaText}\t${fHora(row.t6)}\t${row.totalHoras}h\t${estadoText}\n`;
    });
    navigator.clipboard.writeText(tsv).then(() => toast.success('Reporte copiado al portapapeles'));
  };

  const exportToCSV = () => {
    if (datosProcesados.length === 0) return toast.error('No hay datos para exportar');
    let csv = 'Fecha,Entrada,Desayuno,Comida,Salida,Total,Estado\n';
    datosProcesados.forEach(row => {
      const desayunoText = `${fHora(row.t2)} / ${fHora(row.t3)} (${row.desayunoMin} min)`;
      const comidaText = `${fHora(row.t4)} / ${fHora(row.t5)} (${row.comidaMin} min)`;
      const estadoText = `${getStatusIcon(row.estatus)} ${row.estatus}`;
      csv += `"${formatDate(row.fecha)}","${fHora(row.t1)}","${desayunoText}","${comidaText}","${fHora(row.t6)}","${row.totalHoras}h","${estadoText}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Mi_Asistencia.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mi Asistencia</h1>
          <p className="text-gray-600">Consulta tu reporte detallado de entrada, comidas y salida del checador</p>
        </div>

        <form onSubmit={handleFiltrar} className="bg-white rounded-lg shadow-md p-6 mb-6 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium whitespace-nowrap disabled:opacity-50"
          >
            {loading ? 'Consultando...' : 'Filtrar'}
          </button>
        </form>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">Cargando...</div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-red-600">{error}</div>
        ) : (
          <>
            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg mr-4"><span className="text-green-600 text-2xl">✓</span></div>
                  <div>
                    <p className="text-sm text-gray-500">Normal</p>
                    <p className="text-2xl font-bold text-gray-800">{estadisticas.normal}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg mr-4"><span className="text-yellow-600 text-2xl">⚠️</span></div>
                  <div>
                    <p className="text-sm text-gray-500">Atención</p>
                    <p className="text-2xl font-bold text-gray-800">{estadisticas.atencion}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg mr-4"><span className="text-red-600 text-2xl">❌</span></div>
                  <div>
                    <p className="text-sm text-gray-500">Crítico</p>
                    <p className="text-2xl font-bold text-gray-800">{estadisticas.critico}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg mr-4"><span className="text-blue-600 text-2xl">ℹ️</span></div>
                  <div>
                    <p className="text-sm text-gray-500">Información</p>
                    <p className="text-2xl font-bold text-gray-800">{estadisticas.informacion}</p>
                  </div>
                </div>
              </div>
            </div>

            {datosProcesados.length > 0 ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Reporte de Asistencia Detallado</h2>
                    <p className="text-sm text-gray-600">{datosProcesados.length} día(s) de trabajo en el rango seleccionado</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={copyToClipboard} className="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700">
                      Copiar Reporte
                    </button>
                    <button onClick={exportToCSV} className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700">
                      Exportar CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desayuno</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comida</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salida</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {datosProcesados.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(row.fecha)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{fHora(row.t1)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                            {fHora(row.t2)} / {fHora(row.t3)} <span className="text-xs text-gray-500">({row.desayunoMin} min)</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                            {fHora(row.t4)} / {fHora(row.t5)} <span className="text-xs text-gray-500">({row.comidaMin} min)</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{fHora(row.t6)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{row.totalHoras}h</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(row.estatus)}`}>
                              {getStatusIcon(row.estatus)} {row.estatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay registros de asistencia</h3>
                <p className="text-gray-500">No se encontraron checadas en el rango de fechas seleccionado.</p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
