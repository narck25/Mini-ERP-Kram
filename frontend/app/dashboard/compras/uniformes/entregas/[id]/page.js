'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { uniformApi } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'

export default function DetalleEntregaUniforme() {
  const { id } = useParams()
  const router = useRouter()
  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDelivery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadDelivery = async () => {
    try {
      setLoading(true)
      const res = await uniformApi.getDeliveryById(id)
      setDelivery(res.data.data)
    } catch (err) {
      setError('Error al cargar la entrega')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <DashboardLayout><div className="p-6 text-center">Cargando...</div></DashboardLayout>
  if (error) return <DashboardLayout><div className="p-6 text-red-600">{error}</div></DashboardLayout>
  if (!delivery) return <DashboardLayout><div className="p-6 text-center">Entrega no encontrada</div></DashboardLayout>

  return (
    <DashboardLayout>
    <div className="p-6 max-w-4xl mx-auto">
      {/* Barra de acciones (no se imprime) */}
      <div className="flex justify-between items-center mb-4 no-print">
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">
          &larr; Regresar
        </button>
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          🖨️ Imprimir Acta
        </button>
      </div>

      {/* Acta de entrega (se imprime) */}
      <div className="print-area bg-white rounded-lg shadow p-8">
        <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Acta de Entrega de Uniformes</h1>
          <p className="text-gray-600 mt-1">Folio: {delivery.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-gray-600">Fecha de entrega: {new Date(delivery.fechaEntrega).toLocaleDateString('es-MX')}</p>
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-2 border-b border-gray-300 pb-1">Empleado que recibe</h3>
          <p><span className="font-medium">Nombre:</span> {delivery.empleado?.nombres} {delivery.empleado?.apellidoPaterno}</p>
          <p><span className="font-medium">Clave:</span> {delivery.empleado?.clave || '-'}</p>
          {delivery.empleado?.tallaCamisa && (
            <p>
              <span className="font-medium">Tallas registradas:</span> Camisa {delivery.empleado.tallaCamisa}
              {delivery.empleado.tallaPantalon ? ` · Pantalón ${delivery.empleado.tallaPantalon}` : ''}
              {delivery.empleado.tallaPlayera ? ` · Playera ${delivery.empleado.tallaPlayera}` : ''}
              {delivery.empleado.tallaZapatos ? ` · Zapatos ${delivery.empleado.tallaZapatos}` : ''}
            </p>
          )}
        </div>

        <h3 className="font-bold mb-2 border-b border-gray-300 pb-1">Artículos entregados</h3>
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">#</th>
              <th className="border border-gray-300 p-2 text-left">Tipo</th>
              <th className="border border-gray-300 p-2 text-left">Talla</th>
              <th className="border border-gray-300 p-2 text-left">Género</th>
              <th className="border border-gray-300 p-2 text-center">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {(delivery.items || []).map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">{index + 1}</td>
                <td className="border border-gray-300 p-2 font-medium">{item.tipo}</td>
                <td className="border border-gray-300 p-2">{item.talla || '-'}</td>
                <td className="border border-gray-300 p-2">{item.genero || '-'}</td>
                <td className="border border-gray-300 p-2 text-center">{item.cantidad || 1}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {delivery.observaciones && (
          <div className="mb-6">
            <h3 className="font-bold mb-1 border-b border-gray-300 pb-1">Observaciones</h3>
            <p className="text-gray-700">{delivery.observaciones}</p>
          </div>
        )}

        {/* Firmas */}
        <div className="grid grid-cols-2 gap-12 mt-16">
          <div className="text-center">
            <div className="border-t border-gray-800 pt-2">
              <p className="font-medium">{delivery.empleado?.nombres} {delivery.empleado?.apellidoPaterno}</p>
              <p className="text-sm text-gray-600">Recibí de conformidad</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-800 pt-2">
              <p className="font-medium">{delivery.entregadoPor?.nombres} {delivery.entregadoPor?.apellidoPaterno}</p>
              <p className="text-sm text-gray-600">Entregó (RH / Compras)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  )
}
