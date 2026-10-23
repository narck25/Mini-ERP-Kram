'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { stationeryApi } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'
import InventoryStrictModeToggle from '@/components/InventoryStrictModeToggle'

export default function AdminPapeleria() {
  const router = useRouter()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  const loadRequests = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const params = { page, limit: 20 }
      if (filter) params.estatus = filter
      if (search) params.search = search
      const res = await stationeryApi.getAllRequests(params)
      setRequests(res.data.data || [])
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
    } catch (err) {
      setError('Error al cargar solicitudes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  // Debounce sobre el efecto, no sobre el handler del input: así el timeout
  // siempre dispara con el cierre (closure) más reciente de loadRequests
  // (que ya trae el valor de búsqueda actual), en vez de capturar uno viejo
  // y pisar el resultado correcto con uno de un caracter atrás.
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadRequests(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [loadRequests])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadRequests(newPage)
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

  if (loading && requests.length === 0) return <DashboardLayout><div className="p-6 text-center">Cargando...</div></DashboardLayout>

  return (
    <DashboardLayout>
    <div className="p-6 w-full">
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

      <div className="mb-4">
        <InventoryStrictModeToggle />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {['', 'PENDIENTE', 'ENTREGADO', 'CANCELADO'].map((estatus) => (
          <button
            key={estatus}
            onClick={() => setFilter(estatus)}
            className={`px-3 py-1 rounded text-sm ${filter === estatus ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {estatus || 'TODOS'}
          </button>
        ))}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por folio o solicitante..."
          className="ml-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
        />
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <p className="text-lg">No hay solicitudes</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Folio</th>
                  <th className="p-3 text-left">Solicitante</th>
                  <th className="p-3 text-left">Fecha</th>
                  <th className="p-3 text-left">Artículos</th>
                  <th className="p-3 text-left">Estatus</th>
                  <th className="p-3 text-left">Acción</th>
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
                        {req.estatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => router.push(`/compras/papeleria/${req.id}`)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {['PENDIENTE', 'ENTREGADO_PARCIAL'].includes(req.estatus) ? 'Ver / Entregar' : 'Ver'}
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
                    <span className="font-medium">{pagination.total}</span> solicitudes
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
