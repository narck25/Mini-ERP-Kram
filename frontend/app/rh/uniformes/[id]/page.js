'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { uniformApi, employeeApi } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'

export default function HistorialUniformesEmpleado() {
  const { id } = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState(null)
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [empRes, histRes] = await Promise.all([
        employeeApi.getById(id),
        uniformApi.getEmployeeHistory(id)
      ])
      setEmployee(empRes.data.data)
      setDeliveries(histRes.data.data || [])
    } catch (err) {
      setError('Error al cargar datos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <DashboardLayout><div className="p-6 text-center">Cargando...</div></DashboardLayout>
  if (error) return <DashboardLayout><div className="p-6 text-red-600">{error}</div></DashboardLayout>
  if (!employee) return <DashboardLayout><div className="p-6 text-center">Empleado no encontrado</div></DashboardLayout>

  return (
    <DashboardLayout>
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => router.back()} className="text-blue-600 hover:underline mb-4 block">
        &larr; Regresar
      </button>

      {/* Datos del empleado */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {employee.nombres} {employee.apellidoPaterno}
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Clave:</span>
            <p className="font-medium">{employee.clave}</p>
          </div>
          <div>
            <span className="text-gray-500">Departamento:</span>
            <p className="font-medium">{employee.departamento?.nombre || '-'}</p>
          </div>
          <div>
            <span className="text-gray-500">Puesto:</span>
            <p className="font-medium">{employee.puesto || '-'}</p>
          </div>
          <div>
            <span className="text-gray-500">Género:</span>
            <p className="font-medium">{employee.genero || '-'}</p>
          </div>
        </div>

        {/* Tallas registradas */}
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h3 className="font-semibold text-sm mb-2">Tallas registradas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Camisa:</span>
              <p className="font-medium">{employee.tallaCamisa || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">Pantalón:</span>
              <p className="font-medium">{employee.tallaPantalon || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">Playera:</span>
              <p className="font-medium">{employee.tallaPlayera || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">Zapatos:</span>
              <p className="font-medium">{employee.tallaZapatos || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de entregas */}
      <h2 className="text-xl font-bold mb-4">Historial de Entregas</h2>

      {deliveries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No hay entregas registradas para este empleado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((del) => (
            <div key={del.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-500">
                    Fecha: {new Date(del.fechaEntrega).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Entregó: {del.entregadoPor?.nombres} {del.entregadoPor?.apellidoPaterno}
                  </p>
                </div>
              </div>

              {del.observaciones && (
                <p className="text-sm text-gray-600 mb-2">{del.observaciones}</p>
              )}

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-left">Talla</th>
                    <th className="p-2 text-left">Género</th>
                    <th className="p-2 text-center">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {(del.items || []).map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{item.tipo}</td>
                      <td className="p-2">{item.talla || '-'}</td>
                      <td className="p-2">{item.genero || '-'}</td>
                      <td className="p-2 text-center">{item.cantidad || 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}
