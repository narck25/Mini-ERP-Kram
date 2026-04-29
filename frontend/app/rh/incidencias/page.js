'use client';

import { useState, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';

export default function IncidenciasPage() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  // Función para procesar la asistencia según la lógica exacta proporcionada
  const procesarAsistencia = (registros) => {
    const reporte = {};
    registros.forEach(rec => {
      const d = new Date(rec.fechaHora);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const fecha = `${year}-${month}-${day}`; // Fecha local real
      const key = `${rec.numeroEmpleado}-${fecha}`;
      if (!reporte[key]) {
        reporte[key] = { numeroEmpleado: rec.numeroEmpleado, nombre: rec.nombreEmpleado, fecha, rawPunches: [] };
      }
      reporte[key].rawPunches.push(new Date(rec.fechaHora));
    });
    
    const resultado = Object.values(reporte).map(dia => {
      let punches = dia.rawPunches.sort((a, b) => a - b);

      // 1. Filtro Anti-Rebote (> 5 min)
      punches = punches.filter((time, index) => {
        if (index === 0) return true;
        return ((time - punches[index - 1]) / 60000) > 5;
      });
      
      // 2. Cubetas AM/PM (Corte 12:30 PM)
      const amPunches = [];
      const pmPunches = [];
      punches.forEach(p => {
        const h = p.getHours(), m = p.getMinutes();
        if (h < 12 || (h === 12 && m <= 30)) amPunches.push(p);
        else pmPunches.push(p);
      });
      
      // 3. Asignación Estricta (T1 a T6)
      let t1 = null, t2 = null, t3 = null, t4 = null, t5 = null, t6 = null;
      let alertas = [];
      
      if (amPunches.length > 0) {
        t1 = amPunches[0]; // Entrada
        if (amPunches.length >= 2) t2 = amPunches[1]; // Salida Desayuno
        if (amPunches.length >= 3) t3 = amPunches[2]; // Regreso Desayuno
      } else { 
        alertas.push("❌ Falta Entrada Mañana"); 
      }
      
      if (pmPunches.length > 0) {
        t6 = pmPunches[pmPunches.length - 1]; // Salida Final
        const pmInt = pmPunches.slice(0, pmPunches.length - 1);
        if (pmInt.length >= 1) t4 = pmInt[0]; // Salida Comida
        if (pmInt.length >= 2) t5 = pmInt[1]; // Regreso Comida
      }
      
      // 4. Cálculos
      dia.t1 = t1; dia.t2 = t2; dia.t3 = t3; dia.t4 = t4; dia.t5 = t5; dia.t6 = t6;
      dia.desayunoMin = (t2 && t3) ? Math.round((t3 - t2) / 60000) : 0;
      dia.comidaMin = (t4 && t5) ? Math.round((t5 - t4) / 60000) : 0;
      dia.totalHoras = (t1 && t6) ? ((t6 - t1) / 3600000).toFixed(1) : "0.0";
      
      // Alertas
      if (t2 && !t3) alertas.push("❓ Falta Regreso Desayuno");
      if (dia.desayunoMin > 20) alertas.push(`⚠️ Desayuno Excedido`);
      if (t4 && !t5) alertas.push("❓ Falta Regreso Comida");
      if (dia.comidaMin > 65) alertas.push(`⚠️ Comida Excedida`);
      if (!t1 || !t6) alertas.push("❌ Registro Incompleto");
      else if (parseFloat(dia.totalHoras) < 6.5) alertas.push("ℹ️ Turno Corto");
      
      // Determinar Estado Principal para UI
      if (alertas.some(a => a.includes("❌"))) dia.estatus = 'Crítico';
      else if (alertas.some(a => a.includes("⚠️") || a.includes("❓"))) dia.estatus = 'Atención';
      else if (alertas.some(a => a.includes("ℹ️"))) dia.estatus = 'Información';
      else dia.estatus = 'Normal';
      
      dia.alertasText = alertas.join(', ');
      return dia;
    });
    
    return resultado.sort((a, b) => {
      const numA = parseInt(a.numeroEmpleado) || 0;
      const numB = parseInt(b.numeroEmpleado) || 0;
      return numA !== numB ? numA - numB : new Date(a.fecha) - new Date(b.fecha);
    });
  };

  // Usar useMemo para procesar los registros cuando cambien
  const datosProcesados = useMemo(() => {
    if (!records || records.length === 0) return [];
    return procesarAsistencia(records);
  }, [records]);

  // Filtrar datos por término de búsqueda
  const datosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return datosProcesados;
    
    const term = searchTerm.toLowerCase();
    return datosProcesados.filter(row => 
      row.nombre.toLowerCase().includes(term) || 
      row.numeroEmpleado.toLowerCase().includes(term)
    );
  }, [datosProcesados, searchTerm]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    if (datosProcesados.length === 0) {
      return { normal: 0, atencion: 0, critico: 0, informacion: 0, totalRegistros: 0 };
    }
    
    const normal = datosProcesados.filter(dia => dia.estatus === 'Normal').length;
    const atencion = datosProcesados.filter(dia => dia.estatus === 'Atención').length;
    const critico = datosProcesados.filter(dia => dia.estatus === 'Crítico').length;
    const informacion = datosProcesados.filter(dia => dia.estatus === 'Información').length;
    
    return {
      normal,
      atencion,
      critico,
      informacion,
      totalRegistros: datosProcesados.length
    };
  }, [datosProcesados]);

  // Función helper para formatear horas en string
  const fHoraStr = (date) => date ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';
  
  // Función para obtener icono de estado
  const getEstadoIcon = (estatus) => {
    if (estatus === 'Crítico') return '❌';
    if (estatus === 'Atención') return '⚠️';
    if (estatus === 'Información') return 'ℹ️';
    return '✅';
  };

  // Función para exportar a CSV
  const exportToCSV = () => {
    if (datosFiltrados.length === 0) return alert('No hay datos para exportar');
    
    let csv = 'Num.,Nombre,Fecha,Entrada,Desayuno,Comida,Salida,Total,Estado\n';
    
    datosFiltrados.forEach(row => {
      const desayunoText = `${fHoraStr(row.t2)} / ${fHoraStr(row.t3)} (${row.desayunoMin} min)`;
      const comidaText = `${fHoraStr(row.t4)} / ${fHoraStr(row.t5)} (${row.comidaMin} min)`;
      const estadoText = `${getEstadoIcon(row.estatus)} ${row.estatus}`;
      
      csv += `"${row.numeroEmpleado}","${row.nombre}","${row.fecha}","${fHoraStr(row.t1)}","${desayunoText}","${comidaText}","${fHoraStr(row.t6)}","${row.totalHoras}h","${estadoText}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Reporte_Incidencias.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para copiar al portapapeles
  const copyToClipboard = () => {
    if (datosFiltrados.length === 0) return alert('No hay datos para copiar');
    
    let tsv = 'Num.\tNombre\tFecha\tEntrada\tDesayuno\tComida\tSalida\tTotal\tEstado\n';
    
    datosFiltrados.forEach(row => {
      const desayunoText = `${fHoraStr(row.t2)} / ${fHoraStr(row.t3)} (${row.desayunoMin} min)`;
      const comidaText = `${fHoraStr(row.t4)} / ${fHoraStr(row.t5)} (${row.comidaMin} min)`;
      const estadoText = `${getEstadoIcon(row.estatus)} ${row.estatus}`;
      
      tsv += `${row.numeroEmpleado}\t${row.nombre}\t${row.fecha}\t${fHoraStr(row.t1)}\t${desayunoText}\t${comidaText}\t${fHoraStr(row.t6)}\t${row.totalHoras}h\t${estadoText}\n`;
    });
    
    navigator.clipboard.writeText(tsv).then(() => alert('Reporte copiado al portapapeles. Ya puedes pegarlo en Excel.'));
  };

  const consultarRegistros = async () => {
    if (!startDate || !endDate) {
      setMessage('Por favor, selecciona las fechas de inicio y fin');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/incidencias/?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al consultar registros');
      }

      const data = await response.json();
      if (data.success) {
        setRecords(data.data);
        setMessage(`Se encontraron ${data.data.length} registros`);
      } else {
        setMessage(data.message || 'Error al obtener registros');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error al consultar registros: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/incidencias/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`CSV procesado: ${data.message}`);
        // Limpiar el input de archivo
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setMessage('Error al subir CSV: ' + (data.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error al subir CSV: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Función helper para formatear horas
  const fHora = (date) => {
    if (!date) return '-';
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
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

  return (
    <ProtectedRoute requiredModule="INCIDENCIAS">
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Incidencias (Asistencia)</h1>
          
          {/* Controles superiores */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o número..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={consultarRegistros}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Consultando...' : 'Consultar'}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  className="hidden"
                />
                <button
                  onClick={triggerFileInput}
                  disabled={uploading}
                  className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {uploading ? 'Subiendo...' : 'Subir CSV ZKTeco'}
                </button>
              </div>
              
              {message && (
                <div className={`px-4 py-2 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>

          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <span className="text-green-600 text-2xl">✓</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Normal</p>
                  <p className="text-2xl font-bold text-gray-800">{estadisticas.normal}</p>
                  <p className="text-xs text-gray-500">6 registros, descansos OK</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                  <span className="text-yellow-600 text-2xl">⚠️</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Atención</p>
                  <p className="text-2xl font-bold text-gray-800">{estadisticas.atencion}</p>
                  <p className="text-xs text-gray-500">Desayuno mayor a 20m o comida mayor a 65m</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg mr-4">
                  <span className="text-red-600 text-2xl">❌</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Crítico</p>
                  <p className="text-2xl font-bold text-gray-800">{estadisticas.critico}</p>
                  <p className="text-xs text-gray-500">Registros faltantes</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <span className="text-blue-600 text-2xl">ℹ️</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Información</p>
                  <p className="text-2xl font-bold text-gray-800">{estadisticas.informacion}</p>
                  <p className="text-xs text-gray-500">Turno corto (menor a 6.5h)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de resultados */}
          {datosFiltrados.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Reporte de Asistencia Detallado</h2>
                  <p className="text-sm text-gray-600">
                    Mostrando {datosFiltrados.length} de {datosProcesados.length} días de trabajo
                    {searchTerm && <span className="text-blue-600"> (filtrados por "{searchTerm}")</span>}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Copiar Reporte
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Exportar CSV
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Num.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entrada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Desayuno
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comida
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salida
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {datosFiltrados.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.numeroEmpleado}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(row.fecha)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {fHora(row.t1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {fHora(row.t2)} / {fHora(row.t3)} <span className="text-xs text-gray-500">({row.desayunoMin} min)</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {fHora(row.t4)} / {fHora(row.t5)} <span className="text-xs text-gray-500">({row.comidaMin} min)</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {fHora(row.t6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {row.totalHoras}h
                        </td>
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
              
              {datosFiltrados.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  No hay datos que coincidan con la búsqueda "{searchTerm}".
                </div>
              )}
            </div>
          )}

          {datosProcesados.length === 0 && records.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos de asistencia</h3>
              <p className="text-gray-500 mb-4">
                Consulta un rango de fechas o sube un archivo CSV del checador ZKTeco para comenzar.
              </p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
