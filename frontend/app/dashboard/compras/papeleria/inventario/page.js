'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { stationeryApi, inventoryAdjustmentApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'

export default function InventarioPapeleria() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const canView = ['ADMIN', 'RH', 'COMPRAS'].includes(user?.role)
  const canEdit = user?.role === 'ADMIN' || user?.role === 'RH'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ producto: '', categoria: 'OTRO', cantidadActual: 0, cantidadMinima: 0, unidad: '' })
  const [restockId, setRestockId] = useState('')
  const [restockCantidad, setRestockCantidad] = useState(0)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestForm, setRequestForm] = useState({ accion: 'AGREGAR', itemId: '', producto: '', categoria: 'OTRO', cantidadActual: 0, cantidadMinima: 0, unidad: 'pzas', motivo: '' })

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      const res = await stationeryApi.getInventory()
      setItems(res.data.data || [])
    } catch (err) {
      setError('Error al cargar inventario')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    setEditItem(null)
    setRestockId('')
    setRestockCantidad(0)
    setForm({ producto: '', categoria: 'OTRO', cantidadActual: 0, cantidadMinima: 0, unidad: '' })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      producto: item.producto,
      categoria: item.categoria || 'OTRO',
      cantidadActual: item.cantidadActual,
      cantidadMinima: item.cantidadMinima || 0,
      unidad: item.unidad || ''
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (restockId) {
        await stationeryApi.restockInventoryItem(restockId, restockCantidad)
      } else if (editItem) {
        await stationeryApi.updateInventoryItem(editItem.id, form)
      } else {
        await stationeryApi.addInventoryItem(form)
      }
      setShowModal(false)
      loadInventory()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto del inventario?')) return
    try {
      await stationeryApi.deleteInventoryItem(id)
      loadInventory()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar')
    }
  }

  const submitAdjustment = async (e) => {
    e.preventDefault()
    if (!requestForm.motivo.trim()) { alert('El motivo es obligatorio'); return }
    if (requestForm.accion !== 'AGREGAR' && !requestForm.itemId) { alert('Selecciona un producto'); return }
    try {
      const detalle = requestForm.accion === 'AGREGAR'
        ? { producto: requestForm.producto, categoria: requestForm.categoria, cantidadActual: requestForm.cantidadActual, cantidadMinima: requestForm.cantidadMinima, unidad: requestForm.unidad }
        : { cantidadActual: requestForm.cantidadActual }
      await inventoryAdjustmentApi.create({
        tipo: 'PAPELERIA',
        accion: requestForm.accion,
        itemId: requestForm.accion === 'AGREGAR' ? null : requestForm.itemId,
        detalle,
        motivo: requestForm.motivo
      })
      setShowRequestModal(false)
      setRequestForm({ accion: 'AGREGAR', itemId: '', producto: '', categoria: 'OTRO', cantidadActual: 0, cantidadMinima: 0, unidad: 'pzas', motivo: '' })
      alert('Solicitud enviada para aprobación de RH/ADMIN')
    } catch (err) {
      alert(err.response?.data?.message || 'Error al enviar solicitud')
    }
  }

  if (authLoading) return <DashboardLayout><div className="p-6 text-center">Cargando...</div></DashboardLayout>
  if (!user || !canView) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">Solo los roles ADMIN, RH o COMPRAS pueden ver el inventario.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) return <DashboardLayout><div className="p-6 text-center">Cargando...</div></DashboardLayout>

  return (
    <DashboardLayout>
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventario de Papelería</h1>
          <p className="text-gray-500">Gestiona los productos disponibles</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard/compras/papeleria')}
            className="border px-4 py-2 rounded hover:bg-gray-50"
          >
            ← Volver
          </button>
          <button
            onClick={() => router.push('/dashboard/compras/movimientos-inventario')}
            className="border px-4 py-2 rounded hover:bg-gray-50"
          >
            📊 Movimientos
          </button>
          {canEdit ? (
            <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              + Agregar Producto
            </button>
          ) : (
            <button onClick={() => setShowRequestModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              + Solicitar Ajuste
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <p className="text-lg">No hay productos en el inventario</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Producto</th>
                <th className="p-3 text-left">Categoría</th>
                <th className="p-3 text-center">Stock Actual</th>
                <th className="p-3 text-center">Stock Mínimo</th>
                <th className="p-3 text-left">Unidad</th>
                <th className="p-3 text-center">Estatus</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isLow = item.cantidadActual <= item.cantidadMinima
                return (
                  <tr key={item.id} className={`border-t hover:bg-gray-50 ${isLow ? 'bg-red-50' : ''}`}>
                    <td className="p-3 font-medium">{item.producto}</td>
                    <td className="p-3 text-sm text-gray-600">{item.categoria || '-'}</td>
                    <td className="p-3 text-center">{item.cantidadActual}</td>
                    <td className="p-3 text-center">{item.cantidadMinima || 0}</td>
                    <td className="p-3">{item.unidad || '-'}</td>
                    <td className="p-3 text-center">
                      {isLow ? (
                        <span className="text-red-600 text-xs font-medium">STOCK BAJO</span>
                      ) : (
                        <span className="text-green-600 text-xs font-medium">OK</span>
                      )}
                    </td>
                    <td className="p-3">
                      {canEdit ? (
                        <>
                          <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline text-sm mr-2">Editar</button>
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline text-sm">Eliminar</button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setRequestForm({ ...requestForm, accion: 'ACTUALIZAR', itemId: item.id, producto: item.producto }); setShowRequestModal(true) }}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Solicitar cambio
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editItem ? 'Editar Producto' : 'Alta de Producto'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              {!editItem && (
                <div>
                  <label className="block text-sm font-medium mb-1">Reabastecer producto existente (opcional)</label>
                  <select
                    value={restockId}
                    onChange={(e) => setRestockId(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">— Nuevo producto —</option>
                    {items.map((it) => <option key={it.id} value={it.id}>{it.producto} (stock: {it.cantidadActual})</option>)}
                  </select>
                </div>
              )}
              {restockId ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Cantidad a agregar</label>
                  <input
                    type="number"
                    min="0"
                    value={restockCantidad}
                    onChange={(e) => setRestockCantidad(parseInt(e.target.value) || 0)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Producto *</label>
                <input
                  type="text"
                  value={form.producto}
                  onChange={(e) => setForm({ ...form, producto: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  {['HOJAS', 'PLUMAS', 'LAPICES', 'MARCADORES', 'CARPETAS', 'POST-IT', 'CLIPS', 'GRAPAS', 'CINTA', 'SOBRES', 'OTRO'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Cantidad Actual</label>
                  <input
                    type="number"
                    min="0"
                    value={form.cantidadActual}
                    onChange={(e) => setForm({ ...form, cantidadActual: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={form.cantidadMinima}
                    onChange={(e) => setForm({ ...form, cantidadMinima: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Unidad</label>
                    <input
                      type="text"
                      value={form.unidad}
                      onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Ej. pieza, resma, caja"
                    />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Guardar
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="border px-4 py-2 rounded hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de solicitud de ajuste */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Solicitar Ajuste de Inventario</h2>
            <form onSubmit={submitAdjustment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Acción</label>
                <select value={requestForm.accion} onChange={(e) => setRequestForm({ ...requestForm, accion: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="AGREGAR">Agregar producto</option>
                  <option value="ACTUALIZAR">Actualizar stock</option>
                  <option value="ELIMINAR">Eliminar producto</option>
                </select>
              </div>
              {requestForm.accion !== 'AGREGAR' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Producto</label>
                  <select value={requestForm.itemId} onChange={(e) => setRequestForm({ ...requestForm, itemId: e.target.value })} className="w-full border rounded px-3 py-2">
                    <option value="">Selecciona...</option>
                    {items.map((it) => <option key={it.id} value={it.id}>{it.producto}</option>)}
                  </select>
                </div>
              )}
              {requestForm.accion === 'AGREGAR' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Producto *</label>
                    <input type="text" value={requestForm.producto} onChange={(e) => setRequestForm({ ...requestForm, producto: e.target.value })} className="w-full border rounded px-3 py-2" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cantidad inicial</label>
                    <input type="number" min="0" value={requestForm.cantidadActual} onChange={(e) => setRequestForm({ ...requestForm, cantidadActual: parseInt(e.target.value) || 0 })} className="w-full border rounded px-3 py-2" />
                  </div>
                </>
              )}
              {requestForm.accion === 'ACTUALIZAR' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Nueva cantidad</label>
                  <input type="number" min="0" value={requestForm.cantidadActual} onChange={(e) => setRequestForm({ ...requestForm, cantidadActual: parseInt(e.target.value) || 0 })} className="w-full border rounded px-3 py-2" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Motivo *</label>
                <textarea value={requestForm.motivo} onChange={(e) => setRequestForm({ ...requestForm, motivo: e.target.value })} className="w-full border rounded px-3 py-2" rows="2" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Enviar solicitud</button>
                <button type="button" onClick={() => setShowRequestModal(false)} className="border px-4 py-2 rounded hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}
