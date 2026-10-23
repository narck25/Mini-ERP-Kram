'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { uniformApi } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'
import InventoryStrictModeToggle from '@/components/InventoryStrictModeToggle'

export default function AdminUniformes() {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [form, setForm] = useState({
    empleadoId: '',
    items: [{ tipo: 'CAMISA', talla: '', genero: '', cantidad: 1, costoUnitario: '' }],
    observaciones: ''
  })

  const loadDeliveries = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const params = { page, limit: 20 }
      if (search) params.search = search
      const res = await uniformApi.getDeliveries(params)
      setDeliveries(res.data.data || [])
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
    } catch (err) {
      setError('Error al cargar entregas')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    loadEmployees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce sobre el efecto, no sobre el handler del input: así el timeout
  // siempre dispara con el cierre (closure) más reciente de loadDeliveries
  // (que ya trae el valor de búsqueda actual), en vez de capturar uno viejo
  // y pisar el resultado correcto con uno de un caracter atrás.
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadDeliveries(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [loadDeliveries])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadDeliveries(newPage)
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

  if (loading && deliveries.length === 0) return <DashboardLayout><div className="p-6 text-center">Cargando...</div></DashboardLayout>

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

      <div className="mb-4">
        <InventoryStrictModeToggle />
      </div>

      <div className="flex justify-end mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por empleado..."
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
        />
      </div>

      {deliveries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <p className="text-lg">No hay entregas registradas</p>
        </div>
      ) : (
        <>
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

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Anterior
              </button>
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de{' '}
                  <span className="font-medium">{pagination.total}</span> entregas
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="sr-only">Primera</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                  </button>
                  <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="sr-only">Anterior</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                    .map((p, idx, arr) => (
                      <span key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
                        )}
                        <button onClick={() => handlePageChange(p)} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${p === pagination.page ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                          {p}
                        </button>
                      </span>
                    ))}
                  <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="sr-only">Siguiente</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                  </button>
                  <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="sr-only">Última</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
        </>
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
