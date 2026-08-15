'use client'

import { useState, useEffect } from 'react'
import { inventoryAdjustmentApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'

export default function AprobacionesInventario() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDIENTE')
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectComment, setRejectComment] = useState('')

  const isAdminOrRH = user?.role === 'ADMIN' || user?.role === 'RH'

  const loadRequests = async (status = filter) => {
    try {
      setLoading(true)
      const params = {}
      if (status) params.estatus = status
      const res = await inventoryAdjustmentApi.list(params)
      setRequests(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleApprove = async (id) => {
    if (!confirm('¿Aprobar y aplicar este ajuste al inventario?')) return
    try {
      await inventoryAdjustmentApi.approve(id)
      loadRequests()
    } catch (err) {
      alert(err.response?.data?.message || 'Error al aprobar')
    }
  }

  const handleReject = async (id) => {
    try {
      await inventoryAdjustmentApi.reject(id, rejectComment)
      setRejectingId(null)
      setRejectComment('')
      loadRequests()
    } catch (err) {
      alert(err.response?.data?.message || 'Error al rechazar')
    }
  }

  if (!user || !isAdminOrRH) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">Solo ADMIN o RH pueden aprobar ajustes de inventario.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) return <DashboardLayout><div className="p-6 text-center">Cargando...</div></DashboardLayout>

  const statusColor = (s) =>
    s === 'APROBADA' ? 'bg-green-100 text-green-800' :
    s === 'RECHAZADA' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'

  const formatDetalle = (req) => {
    const d = req.detalle || {}
    const parts = []
    if (d.producto) parts.push(`Producto: ${d.producto}`)
    if (d.tipo) parts.push(`Tipo: ${d.tipo}`)
    if (d.talla) parts.push(`Talla: ${d.talla}`)
    if (d.genero) parts.push(`Género: ${d.genero}`)
    if (d.categoria) parts.push(`Categoría: ${d.categoria}`)
    if (d.cantidadActual != null) parts.push(`Cantidad: ${d.cantidadActual}`)
    if (d.cantidadMinima != null) parts.push(`Mínimo: ${d.cantidadMinima}`)
    if (d.unidad) parts.push(`Unidad: ${d.unidad}`)
    return parts.join(' · ') || '—'
  }

  return (
    <DashboardLayout>
      <div className="p-6 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Aprobaciones de Inventario</h1>
          <p className="text-gray-500">Solicitudes de ajuste de papelería y uniformes</p>
        </div>

        <div className="flex gap-2 mb-4">
          {['PENDIENTE', 'APROBADA', 'RECHAZADA', ''].map((s) => (
            <button
              key={s || 'TODAS'}
              onClick={() => { setFilter(s); loadRequests(s) }}
              className={`px-3 py-1 rounded text-sm ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {s || 'TODAS'}
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
                  <th className="p-3 text-left">Tipo</th>
                  <th className="p-3 text-left">Acción</th>
                  <th className="p-3 text-left">Detalle</th>
                  <th className="p-3 text-left">Motivo</th>
                  <th className="p-3 text-left">Solicitante</th>
                  <th className="p-3 text-left">Estatus</th>
                  <th className="p-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-t hover:bg-gray-50 align-top">
                    <td className="p-3 font-medium">{req.tipo}</td>
                    <td className="p-3">{req.accion}</td>
                    <td className="p-3 text-sm text-gray-700 max-w-xs">{formatDetalle(req)}</td>
                    <td className="p-3 text-sm max-w-xs">{req.motivo}</td>
                    <td className="p-3 text-sm">{req.solicitante?.nombre}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(req.estatus)}`}>{req.estatus}</span>
                      {req.comentarioAprobacion && <p className="text-xs text-gray-500 mt-1">{req.comentarioAprobacion}</p>}
                    </td>
                    <td className="p-3">
                      {req.estatus === 'PENDIENTE' && (
                        rejectingId === req.id ? (
                          <span className="inline-flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Motivo del rechazo"
                              value={rejectComment}
                              onChange={(e) => setRejectComment(e.target.value)}
                              className="border rounded px-2 py-1 text-sm"
                            />
                            <button onClick={() => handleReject(req.id)} className="text-red-600 hover:underline text-sm">Confirmar</button>
                            <button onClick={() => { setRejectingId(null); setRejectComment('') }} className="text-gray-500 text-sm">Cancelar</button>
                          </span>
                        ) : (
                          <span>
                            <button onClick={() => handleApprove(req.id)} className="text-green-600 hover:underline text-sm mr-3">Aprobar</button>
                            <button onClick={() => setRejectingId(req.id)} className="text-red-600 hover:underline text-sm">Rechazar</button>
                          </span>
                        )
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
