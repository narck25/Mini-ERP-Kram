'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { stationeryApi } from '@/lib/api'

export default function DetalleSolicitudPapeleria() {
  const { id } = useParams()
  const router = useRouter()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadRequest()
  }, [id])

  const loadRequest = async () => {
    try {
      setLoading(true)
      const res = await stationeryApi.getRequestById(id)
      setRequest(res.data.data)
    } catch (err) {
      setError('Error al cargar la solicitud')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (estatus) => {
    const colors = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      ENTREGADO: 'bg-green-100 text-green-800',
      CANCELADO: 'bg-red-100 text-red-800'
    }
    return colors[estatus] || 'bg-gray-100 text-gray-800'
  }

  if (loading) return <div className="p-6 text-center">Cargando...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!request) return <div className="p-6 text-center">Solicitud no encontrada</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="text-blue-600 hover:underline mb-4 block">
        &larr; Regresar
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Solicitud de Papelería</h1>
            <p className="text-gray-500">Folio: {request.folio || request.id.slice(0, 8)}</p>
          </div>
          <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusBadge(request.estatus)}`}>
            {request.estatus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <span className="text-gray-500">Fecha de solicitud:</span>
            <p className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</p>
          </div>
          {request.entregadoAt && (
            <div>
              <span className="text-gray-500">Fecha de entrega:</span>
              <p className="font-medium">{new Date(request.entregadoAt).toLocaleDateString()}</p>
            </div>
          )}
          {request.entregadoPor && (
            <div>
              <span className="text-gray-500">Entregado por:</span>
              <p className="font-medium">{request.entregadoPor.nombres} {request.entregadoPor.apellidoPaterno}</p>
            </div>
          )}
        </div>

        {request.observaciones && (
          <div className="mb-6">
            <h3 className="font-semibold mb-1">Observaciones:</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded">{request.observaciones}</p>
          </div>
        )}

        <h3 className="font-semibold mb-3">Artículos solicitados</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Artículo</th>
                <th className="p-3 text-left">Categoría</th>
                <th className="p-3 text-center">Cantidad</th>
                <th className="p-3 text-left">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {(request.items || []).map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3 font-medium">{item.nombre}</td>
                  <td className="p-3 text-sm text-gray-600">{item.categoria || '-'}</td>
                  <td className="p-3 text-center">{item.cantidad}</td>
                  <td className="p-3 text-sm text-gray-600">{item.observaciones || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
