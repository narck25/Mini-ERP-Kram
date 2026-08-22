'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { uniformApi } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'

export default function AdminUniformes() {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({
    empleadoId: '',
    items: [{ tipo: 'CAMISA', talla: '', genero: '', cantidad: 1, costoUnitario: '' }],
    observaciones: ''
  })

  useEffect(() => {
    loadDeliveries()
    loadEmployees()
  }, [])

  const loadDeliveries = async () => {
    try {
      setLoading(true)
      const res = await uniformApi.getDeliveries()
      setDeliveries(res.data.data || [])
    } catch (err) {
      setError('Error al cargar entregas')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const res = await uniformApi.getEmployeesForDelivery()
      setEmployees(res.data.data || [])
    } catch (err) {
      console.error('Error al cargar empleados:', err)
    }
  }

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { tipo: 'CAMISA', talla: '', genero: '', cantidad: 1, costoUnitario: '' }] })
  }

  const removeItem = (index) => {
    if (form.items.length === 1) return
    const items = form.items.filter((_, i) => i !== index)
    setForm({ ...form, items })
  }

  const updateItem = (index, field, value) => {
    const items = [...form.items]
    items[index][field] = value
    setForm({ ...form, items })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.empleadoId) {
      alert('Selecciona un empleado')
      return
    }
    try {
      await uniformApi.createDelivery(form)
      setShowModal(false)
      setForm({
        empleadoId: '',
        items: [{ tipo: 'CAMISA', talla: '', genero: '', cantidad: 1, costoUnitario: '' }],
        observaciones: ''
      })
      loadDeliveries()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar entrega')
    }
  }

  if (loading) return <DashboardLayout><div className="p-6 text-center">Cargando...</div></DashboardLayout>

  return (
    <DashboardLayout>
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Uniformes</h1>
          <p className="text-gray-500">Administra el inventario y entregas de uniformes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard/compras/uniformes/inventario')}
            className="border px-4 py-2 rounded hover:bg-gray-50"
          >
            Inventario
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Nueva Entrega
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      {deliveries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <p className="text-lg">No hay entregas registradas</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Empleado</th>
                <th className="p-3 text-left">Artículos</th>
                <th className="p-3 text-left">Entregó</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((del) => (
                <tr key={del.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{new Date(del.fechaEntrega).toLocaleDateString()}</td>
                  <td className="p-3">
                    {del.empleado?.nombres} {del.empleado?.apellidoPaterno}
                    <span className="text-gray-500 text-xs ml-1">({del.empleado?.clave})</span>
                  </td>
                  <td className="p-3">{del.items?.length || 0} artículos</td>
                  <td className="p-3 text-sm">
                    {del.entregadoPor?.nombres} {del.entregadoPor?.apellidoPaterno}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => router.push(`/dashboard/compras/uniformes/entregas/${del.id}`)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nueva Entrega */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Registrar Entrega de Uniformes</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Empleado *</label>
                <select
                  value={form.empleadoId}
                  onChange={(e) => setForm({ ...form, empleadoId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Seleccionar empleado...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombres} {emp.apellidoPaterno} - {emp.clave}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Artículos</h3>
                  <button type="button" onClick={addItem} className="text-blue-600 hover:text-blue-800 text-sm">
                    + Agregar
                  </button>
                </div>
                {form.items.map((item, index) => (
                  <div key={index} className="border rounded p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Artículo #{index + 1}</span>
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(index)} className="text-red-500 text-sm">Eliminar</button>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      <div>
                        <label className="block text-xs font-medium">Tipo</label>
                        <select value={item.tipo} onChange={(e) => updateItem(index, 'tipo', e.target.value)} className="w-full border rounded px-2 py-1 text-sm">
                          {['CAMISA', 'PLAYERA', 'PANTALON', 'CHALECO', 'CHAQUETA', 'GORRA', 'MANDIL', 'BATA', 'ZAPATOS', 'BOTAS', 'OTRO'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium">Talla</label>
                        <input type="text" value={item.talla} onChange={(e) => updateItem(index, 'talla', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Ej. M, 28, 7" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium">Género</label>
                        <select value={item.genero} onChange={(e) => updateItem(index, 'genero', e.target.value)} className="w-full border rounded px-2 py-1 text-sm">
                          <option value="">-</option>
                          <option value="HOMBRE">Hombre</option>
                          <option value="MUJER">Mujer</option>
                          <option value="UNISEX">Unisex</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium">Cant.</label>
                        <input type="number" min="1" value={item.cantidad} onChange={(e) => updateItem(index, 'cantidad', parseInt(e.target.value) || 1)} className="w-full border rounded px-2 py-1 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium">C/U ($)</label>
                        <input type="number" min="0" step="0.01" value={item.costoUnitario} onChange={(e) => updateItem(index, 'costoUnitario', e.target.value === '' ? '' : Number(e.target.value))} className="w-full border rounded px-2 py-1 text-sm" placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observaciones</label>
                <textarea
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows="2"
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Registrar Entrega
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="border px-4 py-2 rounded hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}
