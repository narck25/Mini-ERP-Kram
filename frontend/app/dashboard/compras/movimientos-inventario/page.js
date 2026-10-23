'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { inventoryMovementApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'

export default function MovimientosInventario() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const canView = ['ADMIN', 'RH', 'COMPRAS'].includes(user?.role)
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState('')
  const [filterMov, setFilterMov] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, totalPages: 0 })

  const loadMovements = useCallback(async (page = 1, tipo = filterTipo, mov = filterMov) => {
    try {
      setLoading(true)
      const params = { page }
      if (tipo) params.tipo = tipo
      if (mov) params.tipoMovimiento = mov
      const res = await inventoryMovementApi.list(params)
      setMovements(res.data.data || [])
      setPagination(res.data.pagination || { page: 1, limit: 100, total: 0, totalPages: 0 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTipo, filterMov])

  useEffect(() => {
    if (user && canView) loadMovements(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadMovements(newPage)
    }
  }

  if (authLoading) return <DashboardLayout><div className="p-6 text-center">Cargando...</div></DashboardLayout>
  if (!user || !canView) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">Solo los roles ADMIN, RH o COMPRAS pueden ver los movimientos de inventario.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const movColor = (m) => m === 'ENTRADA' ? 'bg-green-100 text-green-800' : m === 'SALIDA' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'

  return (
    <DashboardLayout>
      <div className="p-6 w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Movimientos de Inventario (Kardex)</h1>
            <p className="text-gray-500">Historial de ingresos, salidas y ajustes</p>
          </div>
          <button onClick={() => router.back()} className="border px-4 py-2 rounded hover:bg-gray-50">← Volver</button>
        </div>

        <div className="flex gap-2 mb-4">
          <select value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value); loadMovements(1, e.target.value, filterMov) }} className="border rounded px-3 py-2">
            <option value="">Todos los tipos</option>
            <option value="PAPELERIA">Papelería</option>
            <option value="UNIFORMES">Uniformes</option>
          </select>
          <select value={filterMov} onChange={(e) => { setFilterMov(e.target.value); loadMovements(1, filterTipo, e.target.value) }} className="border rounded px-3 py-2">
            <option value="">Todos los movimientos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="AJUSTE">Ajuste</option>
          </select>
        </div>

        {loading && movements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : movements.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            <p className="text-lg">No hay movimientos registrados</p>
          </div>
        ) : (
          <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Fecha</th>
                  <th className="p-3 text-left">Tipo</th>
                  <th className="p-3 text-left">Movimiento</th>
                  <th className="p-3 text-left">Artículo</th>
                  <th className="p-3 text-center">Cantidad</th>
                  <th className="p-3 text-center">Stock Ant.</th>
                  <th className="p-3 text-center">Stock Nuevo</th>
                  <th className="p-3 text-left">Referencia</th>
                  <th className="p-3 text-left">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-sm">{new Date(m.createdAt).toLocaleString()}</td>
                    <td className="p-3 text-sm">{m.tipo}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-medium ${movColor(m.tipoMovimiento)}`}>{m.tipoMovimiento}</span></td>
                    <td className="p-3 text-sm font-medium">{m.itemDescripcion}</td>
                    <td className="p-3 text-center">{m.cantidad}</td>
                    <td className="p-3 text-center">{m.stockAnterior}</td>
                    <td className="p-3 text-center">{m.stockNuevo}</td>
                    <td className="p-3 text-sm text-gray-600">{m.referencia || '-'}</td>
                    <td className="p-3 text-sm">{m.usuario?.name || '-'}</td>
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
                    <span className="font-medium">{pagination.total}</span> movimientos
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
      </div>
    </DashboardLayout>
  )
}
