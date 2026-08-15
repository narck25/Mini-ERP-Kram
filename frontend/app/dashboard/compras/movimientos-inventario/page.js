'use client'

import { useState, useEffect } from 'react'
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

  const loadMovements = async (tipo = filterTipo, mov = filterMov) => {
    try {
      setLoading(true)
      const params = {}
      if (tipo) params.tipo = tipo
      if (mov) params.tipoMovimiento = mov
      const res = await inventoryMovementApi.list(params)
      setMovements(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && canView) loadMovements()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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
          <select value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value); loadMovements(e.target.value, filterMov) }} className="border rounded px-3 py-2">
            <option value="">Todos los tipos</option>
            <option value="PAPELERIA">Papelería</option>
            <option value="UNIFORMES">Uniformes</option>
          </select>
          <select value={filterMov} onChange={(e) => { setFilterMov(e.target.value); loadMovements(filterTipo, e.target.value) }} className="border rounded px-3 py-2">
            <option value="">Todos los movimientos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="AJUSTE">Ajuste</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : movements.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            <p className="text-lg">No hay movimientos registrados</p>
          </div>
        ) : (
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
        )}
      </div>
    </DashboardLayout>
  )
}
