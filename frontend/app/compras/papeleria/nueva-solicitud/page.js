'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stationeryApi } from '@/lib/api'

const CATEGORIAS = [
  'HOJAS',
  'PLUMAS',
  'LAPICES',
  'MARCADORES',
  'CARPETAS',
  'POST-IT',
  'CLIPS',
  'GRAPAS',
  'CINTA',
  'SOBRES',
  'OTRO'
]

export default function NuevaSolicitudPapeleria() {
  const router = useRouter()
  const [items, setItems] = useState([{ nombre: '', categoria: 'OTRO', cantidad: 1, observaciones: '' }])
  const [observaciones, setObservaciones] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const addItem = () => {
    setItems([...items, { nombre: '', categoria: 'OTRO', cantidad: 1, observaciones: '' }])
  }

  const removeItem = (index) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    const updated = [...items]
    updated[index][field] = value
    setItems(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validar
    const validItems = items.filter(i => i.nombre.trim())
    if (validItems.length === 0) {
      setError('Agrega al menos un artículo con nombre')
      return
    }

    setSubmitting(true)
    try {
      const res = await stationeryApi.createRequest({
        items: validItems.map(i => ({
          nombre: i.nombre.trim(),
          categoria: i.categoria,
          cantidad: parseInt(i.cantidad) || 1,
          observaciones: i.observaciones?.trim() || undefined
        })),
        observaciones: observaciones.trim() || undefined
      })
      router.push(`/compras/papeleria/${res.data.data.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Nueva Solicitud de Papelería</h1>
      <p className="text-gray-500 mb-6">Solicita los artículos que necesitas</p>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Items */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Artículos</h2>
            <button type="button" onClick={addItem} className="text-blue-600 hover:text-blue-800 text-sm">
              + Agregar artículo
            </button>
          </div>

          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Artículo #{index + 1}</span>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 text-sm">
                    Eliminar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Nombre del artículo *</label>
                  <input
                    type="text"
                    value={item.nombre}
                    onChange={(e) => updateItem(index, 'nombre', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Ej. Resma de papel carta"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría</label>
                  <select
                    value={item.categoria}
                    onChange={(e) => updateItem(index, 'categoria', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observaciones del artículo</label>
                <input
                  type="text"
                  value={item.observaciones}
                  onChange={(e) => updateItem(index, 'observaciones', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Ej. Color azul, tamaño carta"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Observaciones generales */}
        <div>
          <label className="block text-sm font-medium mb-1">Observaciones generales</label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows="2"
            placeholder="Notas adicionales para la solicitud..."
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border px-6 py-2 rounded hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
