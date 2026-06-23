'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { employeeApi } from '@/lib/api'

export default function HistorialUniformesRH() {
  const router = useRouter()
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const res = await employeeApi.getAll()
      setEmployees(res.data.data || [])
    } catch (err) {
      console.error('Error al cargar empleados:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = employees.filter(emp => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      emp.nombres?.toLowerCase().includes(q) ||
      emp.apellidoPaterno?.toLowerCase().includes(q) ||
      emp.clave?.toLowerCase().includes(q)
    )
  })

  if (loading) return <div className="p-6 text-center">Cargando...</div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Historial de Uniformes</h1>
        <p className="text-gray-500">Consulta las entregas de uniformes por empleado</p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar empleado por nombre o clave..."
          className="w-full max-w-md border rounded px-3 py-2"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Clave</th>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Departamento</th>
              <th className="p-3 text-left">Tallas</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-mono text-sm">{emp.clave}</td>
                <td className="p-3 font-medium">{emp.nombres} {emp.apellidoPaterno}</td>
                <td className="p-3 text-sm text-gray-600">{emp.departamento?.nombre || '-'}</td>
                <td className="p-3 text-sm text-gray-600">
                  {emp.tallaCamisa && `Camisa: ${emp.tallaCamisa}`}
                  {emp.tallaPantalon && ` | Pant: ${emp.tallaPantalon}`}
                  {emp.tallaPlayera && ` | Play: ${emp.tallaPlayera}`}
                  {emp.tallaZapatos && ` | Zap: ${emp.tallaZapatos}`}
                  {!emp.tallaCamisa && !emp.tallaPantalon && '-'}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => router.push(`/rh/uniformes/${emp.id}`)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Ver historial
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
