'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { uniformApi } from '@/lib/api'

export default function DetalleEntregaUniforme() {
  const { id } = useParams()
  const router = useRouter()
  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDelivery()
  }, [id])

  const loadDelivery = async () => {
    try {
      setLoading(true)
      const res = await uniformApi.getDeliveryById(id)
      setDelivery(res.data.data)
    } catch (err) {
      setError('Error al cargar la entrega')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6 text-center">Cargando...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!delivery) return <div className="p-6 text-center">Entrega no encontrada</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="text-blue-600 hover:underline mb-4 block">
        &larr; Regresar
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Entrega de Uniformes</h1>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <span className="text-gray-500">Fecha de entrega:</span>
            <p className="font-medium">{new Date(delivery.fechaEntrega).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-gray-500">Entregado por:</span>
            <p className="font-medium">{delivery.entregadoPor?.nombres} {delivery.entregadoPor?.apellidoPaterno}</p>
          </div>
        </div>

        {/* Datos del empleado */}
        <div className="bg-gray-50 rounded p-4 mb-6">
          <h3 className="font-semibold mb-2">Empleado</h3>
          <p className="text-lg font-medium">{delivery.empleado?.nombres} {delivery.empleado?.apellidoPaterno}</p>
          <p className="text-sm text-gray-600">Clave: {delivery.empleado?.clave}</p>
          {delivery.empleado?.tallaCamisa && (
            <div className="mt-2 text-sm text-gray-600">
              <p>Tallas registradas: Camisa {delivery.empleado.tallaCamisa}
                {delivery.empleado.tallaPantalon && ` | Pantalón ${delivery.empleado.tallaPantalon}`}
                {delivery.empleado.tallaPlayera && ` | Playera ${delivery.empleado.tallaPlayera}`}
                {delivery.empleado.tallaZapatos && ` | Zapatos ${delivery.empleado.tallaZapatos}`}
              </p>
            </div>
          )}
        </div>

        {delivery.observaciones && (
          <div className="mb-6">
            <h3 className="font-semibold mb-1">Observaciones:</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded">{delivery.observaciones}</p>
          </div>
        )}

        <h3 className="font-semibold mb-3">Artículos entregados</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-left">Talla</th>
                <th className="p-3 text-left">Género</th>
                <th className="p-3 text-center">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {(delivery.items || []).map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3 font-medium">{item.tipo}</td>
                  <td className="p-3">{item.talla || '-'}</td>
                  <td className="p-3">{item.genero || '-'}</td>
                  <td className="p-3 text-center">{item.cantidad || 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
