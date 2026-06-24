'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { stationeryApi } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'

export default function AdminPapeleria() {
  const router = useRouter()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filter) params.estatus = filter
      const res = await stationeryApi.getAllRequests(params)
      setRequests(res.data.data || [])
    } catch (err) {
      setError('Error al cargar solicitudes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeliver = async (id) => {
    if (!confirm('¿Marcar esta solicitud como entregada?')) return
    try {
      await stationeryApi.deliverRequest(id)
      loadRequests()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al entregar')
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

  if (loading) return <DashboardLayout><div className="p-6 text-center">Cargando...</div></DashboardLayout>

  return (
    <DashboardLayout>
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Papelería</h1>
          <p className="text-gray-500">Administra las solicitudes de papelería</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard/compras/papeleria/inventario')}
            className="border px-4 py-2 rounded hover:bg-gray-50"
          >
            Inventario
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {['', 'PENDIENTE', 'ENTREGADO', 'CANCELADO'].map((estatus) => (
          <button
            key={estatus}
            onClick={() => { setFilter(estatus); loadRequests() }}
            className={`px-3 py-1 rounded text-sm ${filter === estatus ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {estatus || 'TODOS'}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <p className="text-lg">No hay solicitudes</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Folio</th>
                <th className="p-3 text-left">Solicitante</th>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Artículos</th>
                <th className="p-3 text-left">Estatus</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm">{req.folio || req.id.slice(0, 8)}</td>
                  <td className="p-3">
                    {req.solicitante?.nombres} {req.solicitante?.apellidoPaterno}
                  </td>
                  <td className="p-3">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">{req.items?.length || 0} artículos</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(req.estatus)}`}>
                      {req.estatus}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => router.push(`/dashboard/compras/${req.id}`)}
                      className="text-blue-600 hover:underline text-sm mr-2"
                    >
                      Ver
                    </button>
                    {req.estatus === 'PENDIENTE' && (
                      <button
                        onClick={() => handleDeliver(req.id)}
                        className="text-green-600 hover:underline text-sm"
                      >
                        Entregar
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
    </DashboardLayout>
  )
}
