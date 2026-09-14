'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { stationeryApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'

export default function DetalleSolicitudPapeleria() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [entregas, setEntregas] = useState({})
  const [delivering, setDelivering] = useState(false)
  const [closing, setClosing] = useState(false)

  const [comments, setComments] = useState([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  const isAdminOrCompras = ['ADMIN', 'COMPRAS'].includes(user?.role)

  useEffect(() => {
    loadRequest()
    loadComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const loadComments = async () => {
    try {
      const res = await stationeryApi.getComments(id)
      setComments(res.data.comments || [])
    } catch (err) {
      console.error('Error al cargar comentarios', err)
    }
  }

  const getStatusBadge = (estatus) => {
    const colors = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      ENTREGADO_PARCIAL: 'bg-blue-100 text-blue-800',
      ENTREGADO: 'bg-green-100 text-green-800',
      CANCELADO: 'bg-red-100 text-red-800'
    }
    return colors[estatus] || 'bg-gray-100 text-gray-800'
  }

  const saldoPendiente = (item) => item.cantidad - (item.cantidadEntregada || 0)

  const handleEntregaChange = (itemId, value) => {
    setEntregas(prev => ({ ...prev, [itemId]: value }))
  }

  const handleDeliver = async () => {
    const payload = Object.entries(entregas)
      .map(([itemId, cantidad]) => ({ itemId, cantidad: parseInt(cantidad) }))
      .filter(e => e.cantidad > 0)

    if (payload.length === 0) {
      alert('Indica la cantidad a entregar de al menos un artículo')
      return
    }

    try {
      setDelivering(true)
      await stationeryApi.deliverRequest(id, payload)
      setEntregas({})
      await loadRequest()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar la entrega')
    } finally {
      setDelivering(false)
    }
  }

  const handleClose = async () => {
    if (!confirm('¿Cerrar la solicitud aceptando lo recibido hasta ahora? No podrás recibir el resto.')) return
    try {
      setClosing(true)
      await stationeryApi.closeRequest(id)
      await loadRequest()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cerrar la solicitud')
    } finally {
      setClosing(false)
    }
  }

  const handleSendComment = async () => {
    if (!nuevoComentario.trim()) return
    try {
      setSendingComment(true)
      await stationeryApi.addComment(id, nuevoComentario.trim())
      setNuevoComentario('')
      await loadComments()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al enviar el comentario')
    } finally {
      setSendingComment(false)
    }
  }

  if (loading) return <DashboardLayout><div className="p-6 text-center">Cargando...</div></DashboardLayout>
  if (error) return <DashboardLayout><div className="p-6 text-red-600">{error}</div></DashboardLayout>
  if (!request) return <DashboardLayout><div className="p-6 text-center">Solicitud no encontrada</div></DashboardLayout>

  const puedeEntregar = isAdminOrCompras && ['PENDIENTE', 'ENTREGADO_PARCIAL'].includes(request.estatus)
  const puedeCerrar = !isAdminOrCompras && request.estatus === 'ENTREGADO_PARCIAL'

  return (
    <DashboardLayout>
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
            {request.estatus.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <span className="text-gray-500">Fecha de solicitud:</span>
            <p className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</p>
          </div>
          {request.fechaEntrega && (
            <div>
              <span className="text-gray-500">Última entrega:</span>
              <p className="font-medium">{new Date(request.fechaEntrega).toLocaleDateString()}</p>
            </div>
          )}
          {request.entregadoPor && (
            <div>
              <span className="text-gray-500">Entregado por:</span>
              <p className="font-medium">{request.entregadoPor.nombres} {request.entregadoPor.apellidoPaterno}</p>
            </div>
          )}
        </div>

        {request.justificacion && (
          <div className="mb-6">
            <h3 className="font-semibold mb-1">Justificación:</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded">{request.justificacion}</p>
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
                <th className="p-3 text-center">Solicitado</th>
                <th className="p-3 text-center">Entregado</th>
                <th className="p-3 text-left">Unidad</th>
                <th className="p-3 text-left">Observaciones</th>
                {puedeEntregar && <th className="p-3 text-center">Entregar ahora</th>}
              </tr>
            </thead>
            <tbody>
              {(request.items || []).map((item, index) => {
                const saldo = saldoPendiente(item)
                return (
                  <tr key={item.id || index} className="border-t">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 font-medium">{item.producto}</td>
                    <td className="p-3 text-sm text-gray-600">{item.categoria || '-'}</td>
                    <td className="p-3 text-center">{item.cantidad}</td>
                    <td className="p-3 text-center">{item.cantidadEntregada || 0}</td>
                    <td className="p-3 text-sm text-gray-600">{item.unidad || '-'}</td>
                    <td className="p-3 text-sm text-gray-600">{item.observaciones || '-'}</td>
                    {puedeEntregar && (
                      <td className="p-3 text-center">
                        {saldo > 0 ? (
                          <input
                            type="number"
                            min="0"
                            max={saldo}
                            placeholder={`máx ${saldo}`}
                            value={entregas[item.id] || ''}
                            onChange={(e) => handleEntregaChange(item.id, e.target.value)}
                            className="w-20 border rounded px-2 py-1 text-center"
                          />
                        ) : (
                          <span className="text-green-600 text-sm">Completo</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {puedeEntregar && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleDeliver}
              disabled={delivering}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {delivering ? 'Registrando...' : 'Registrar entrega'}
            </button>
          </div>
        )}

        {puedeCerrar && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4 flex items-center justify-between">
            <p className="text-sm text-blue-800">
              Esta solicitud tiene artículos pendientes de entrega. Si ya no necesitas el resto, puedes cerrarla.
            </p>
            <button
              onClick={handleClose}
              disabled={closing}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap ml-4"
            >
              {closing ? 'Cerrando...' : 'Cerrar solicitud'}
            </button>
          </div>
        )}
      </div>

      {/* Comentarios */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h3 className="font-semibold mb-4">Comentarios</h3>

        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no hay comentarios.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="bg-gray-50 rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{c.user?.employee?.nombre || c.user?.name}</span>
                  <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.mensaje}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <textarea
            value={nuevoComentario}
            onChange={(e) => setNuevoComentario(e.target.value)}
            placeholder="Escribe un comentario..."
            rows={2}
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <button
            onClick={handleSendComment}
            disabled={sendingComment || !nuevoComentario.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 self-end"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
    </DashboardLayout>
  )
}
