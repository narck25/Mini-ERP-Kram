'use client'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

/**
 * usePurchaseItems — Hook reutilizable para formularios con items dinámicos
 * Usado en: nueva-solicitud, editar items de mis-solicitudes
 */
export default function usePurchaseItems(initialItems = [{ productoServicio: '', cantidad: '', descripcion: '' }]) {
  const [items, setItems] = useState(initialItems)

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const addItem = () => {
    setItems(prev => [...prev, { productoServicio: '', cantidad: '', descripcion: '' }])
  }

  const removeItem = (index) => {
    if (items.length <= 1) {
      toast.error('Debe haber al menos un ítem')
      return
    }
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const validateItems = () => {
    const invalidEmpty = items.filter(i => !i.productoServicio.trim() || !i.cantidad)
    if (invalidEmpty.length > 0) {
      toast.error('Todos los ítems deben tener Producto/Servicio y Cantidad')
      return false
    }
    const invalidQty = items.filter(i => isNaN(parseFloat(i.cantidad)) || parseFloat(i.cantidad) <= 0)
    if (invalidQty.length > 0) {
      toast.error('Las cantidades deben ser números mayores a 0')
      return false
    }
    return true
  }

  const getItemsPayload = () => items.map(item => ({
    productoServicio: item.productoServicio.trim(),
    cantidad: parseFloat(item.cantidad),
    descripcion: item.descripcion?.trim() || null
  }))

  return { items, setItems, handleItemChange, addItem, removeItem, validateItems, getItemsPayload }
}