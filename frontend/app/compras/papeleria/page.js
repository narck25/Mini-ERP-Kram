'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { stationeryApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

export default function MisSolicitudesPapeleria() {
  const router = useRouter()
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const res = await stationeryApi.getMyRequests()
      setRequests(res.data.data || [])
    } catch (err) {
      setError('Error al cargar solicitudes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('¿Cancelar esta solicitud?')) return
    try {
      await stationeryApi.cancelRequest(id)
      loadRequests()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cancelar')
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mis Solicitudes de Papelería</h1>
          <p className="text-gray-500">Solicita artículos de papelería y consumibles</p>
        </div>
        <button
          onClick={() => router.push('/compras/papeleria/nueva-solicitud')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nueva Solicitud
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      {requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No tienes solicitudes de papelería</p>
          <p className="mt-2">Crea una nueva solicitud para comenzar</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Folio</th>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Artículos</th>
                <th className="p-3 text-left">Estatus</th>
                <th className="p-3 text-left">Observaciones</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm">{req.folio || req.id.slice(0, 8)}</td>
                  <td className="p-3">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">{req.items?.length || 0} artículos</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(req.estatus)}`}>
                      {req.estatus}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600 max-w-xs truncate">{req.observaciones || '-'}</td>
                  <td className="p-3">
                    <button
                      onClick={() => router.push(`/compras/papeleria/${req.id}`)}
                      className="text-blue-600 hover:underline text-sm mr-2"
                    >
                      Ver
                    </button>
                    {req.estatus === 'PENDIENTE' && (
                      <button
                        onClick={() => handleCancel(req.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
