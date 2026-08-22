'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { uniformApi } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'

// Un "tanto" del acta (original para la empresa o copia para el empleado).
function TantoActa({ delivery, copia }) {
  const badge = copia === 'original'
    ? { text: 'Original · Empresa', cls: 'bg-gray-800 text-white' }
    : { text: 'Copia · Empleado', cls: 'border border-gray-800 text-gray-800' }

  const items = delivery.items || []
  const total = items.reduce((acc, it) => acc + (it.cantidad || 1) * (Number(it.costoUnitario) || 0), 0)

  return (
    <div className="tanto bg-white p-4">
      {/* Encabezado */}
      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-2 mb-3">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-wide leading-tight">Acta de Entrega de Uniformes</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Folio: {delivery.id.slice(0, 8).toUpperCase()} · Fecha de entrega: {new Date(delivery.fechaEntrega).toLocaleDateString('es-MX')}
          </p>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${badge.cls}`}>{badge.text}</span>
      </div>

      {/* Empleado que recibe */}
      <div className="mb-3">
        <h3 className="font-bold text-xs mb-1 border-b border-gray-300 pb-1 uppercase">Empleado que recibe</h3>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-sm">
          <p><span className="font-medium">Nombre:</span> {delivery.empleado?.nombres} {delivery.empleado?.apellidoPaterno}</p>
          <p><span className="font-medium">Clave:</span> {delivery.empleado?.clave || '—'}</p>
        </div>
        {delivery.empleado?.tallaCamisa && (
          <p className="text-sm mt-1">
            <span className="font-medium">Tallas registradas:</span> Camisa {delivery.empleado.tallaCamisa}
            {delivery.empleado.tallaPantalon ? ` · Pantalón ${delivery.empleado.tallaPantalon}` : ''}
            {delivery.empleado.tallaPlayera ? ` · Playera ${delivery.empleado.tallaPlayera}` : ''}
            {delivery.empleado.tallaZapatos ? ` · Zapatos ${delivery.empleado.tallaZapatos}` : ''}
          </p>
        )}
      </div>

      {/* Artículos entregados */}
      <h3 className="font-bold text-xs mb-1 border-b border-gray-300 pb-1 uppercase">Artículos entregados</h3>
      <table className="w-full border-collapse mb-2 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-1 text-left text-xs">#</th>
            <th className="border border-gray-300 p-1 text-left text-xs">Tipo</th>
            <th className="border border-gray-300 p-1 text-left text-xs">Talla</th>
            <th className="border border-gray-300 p-1 text-left text-xs">Género</th>
            <th className="border border-gray-300 p-1 text-center text-xs">Cant.</th>
            <th className="border border-gray-300 p-1 text-right text-xs">C/U</th>
            <th className="border border-gray-300 p-1 text-right text-xs">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const subtotal = (item.cantidad || 1) * (Number(item.costoUnitario) || 0)
            return (
              <tr key={index}>
                <td className="border border-gray-300 p-1">{index + 1}</td>
                <td className="border border-gray-300 p-1 font-medium">{item.tipo}</td>
                <td className="border border-gray-300 p-1">{item.talla || '—'}</td>
                <td className="border border-gray-300 p-1">{item.genero || '—'}</td>
                <td className="border border-gray-300 p-1 text-center">{item.cantidad || 1}</td>
                <td className="border border-gray-300 p-1 text-right">${(Number(item.costoUnitario) || 0).toFixed(2)}</td>
                <td className="border border-gray-300 p-1 text-right">${subtotal.toFixed(2)}</td>
              </tr>
            )
          })}
          <tr>
            <td colSpan="6" className="border border-gray-300 p-1 text-right font-bold">Total</td>
            <td className="border border-gray-300 p-1 text-right font-bold">${total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Observaciones */}
      {delivery.observaciones && (
        <div className="mb-3">
          <h3 className="font-bold text-xs mb-1 border-b border-gray-300 pb-1 uppercase">Observaciones</h3>
          <p className="text-sm text-gray-700">{delivery.observaciones}</p>
        </div>
      )}

      {/* Firmas */}
      <div className="grid grid-cols-2 gap-8 mt-8">
        <div className="text-center">
          <div className="border-t border-gray-800 pt-1">
            <p className="text-sm font-medium">{delivery.empleado?.nombres} {delivery.empleado?.apellidoPaterno}</p>
            <p className="text-xs text-gray-600">Recibí de conformidad</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-800 pt-1">
            <p className="text-sm font-medium">{delivery.entregadoPor?.nombres} {delivery.entregadoPor?.apellidoPaterno}</p>
            <p className="text-xs text-gray-600">Entregó (RH / Compras)</p>
          </div>
        </div>
      </div>
    </div>
  )
}

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

      {/* Dos tantos por hoja (se imprime) */}
      <div className="print-area bg-white rounded-lg shadow">
        <div className="acta-duo p-6">
          <TantoActa delivery={delivery} copia="original" />

          {/* Línea divisoria para corte */}
          <div className="tanto-cortar flex items-center gap-3 my-2 text-gray-500">
            <div className="flex-1 border-t-2 border-dashed border-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wide">✂️ Cortar aquí</span>
            <div className="flex-1 border-t-2 border-dashed border-gray-400" />
          </div>

          <TantoActa delivery={delivery} copia="copia" />
        </div>
      </div>
    </div>
    </DashboardLayout>
  )
}
