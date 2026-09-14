'use client'

import { useState, useEffect } from 'react'
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

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mi Asistencia</h1>
          <p className="text-gray-600">Consulta tus registros de entrada y salida del checador</p>
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium whitespace-nowrap"
          >
            Filtrar
          </button>
        </form>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Registros</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay registros de asistencia en este rango de fechas.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispositivo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map(r => {
                    const fecha = new Date(r.fechaHora)
                    return (
                      <tr key={r.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fecha.toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fecha.toLocaleTimeString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.tipo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.dispositivo || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
