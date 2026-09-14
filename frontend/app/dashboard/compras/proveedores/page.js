'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supplierApi } from '@/lib/api/suppliers'
import { toast } from 'react-hot-toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'

function ProveedoresPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ nombre: '', rfc: '', contacto: '', telefono: '', email: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const res = await supplierApi.list()
      setSuppliers(res.data.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar el catálogo de proveedores')
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    setEditItem(null)
    setForm({ nombre: '', rfc: '', contacto: '', telefono: '', email: '' })
    setShowModal(true)
  }

  const openEdit = (supplier) => {
    setEditItem(supplier)
    setForm({
      nombre: supplier.nombre,
      rfc: supplier.rfc || '',
      contacto: supplier.contacto || '',
      telefono: supplier.telefono || '',
      email: supplier.email || ''
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        await supplierApi.update(editItem.id, form)
        toast.success('Proveedor actualizado')
      } else {
        await supplierApi.create(form)
        toast.success('Proveedor agregado al catálogo')
      }
      setShowModal(false)
      loadSuppliers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar el proveedor')
    } finally {
      setSaving(false)
    }
  }

  const toggleActivo = async (supplier) => {
    try {
      await supplierApi.update(supplier.id, { activo: !supplier.activo })
      toast.success(supplier.activo ? 'Proveedor desactivado' : 'Proveedor activado')
      loadSuppliers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar el proveedor')
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Catálogo de Proveedores</h1>
            <p className="text-gray-500">Proveedores disponibles para cotizar compras</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard/compras')}
              className="border px-4 py-2 rounded hover:bg-gray-50"
            >
              ← Volver
            </button>
            <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              + Agregar Proveedor
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">Cargando...</div>
        ) : suppliers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            <p className="text-lg">No hay proveedores registrados todavía</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Nombre</th>
                  <th className="p-3 text-left">RFC</th>
                  <th className="p-3 text-left">Contacto</th>
                  <th className="p-3 text-left">Teléfono</th>
                  <th className="p-3 text-center">Estatus</th>
                  <th className="p-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} className={`border-t hover:bg-gray-50 ${!s.activo ? 'opacity-60' : ''}`}>
                    <td className="p-3 font-medium">{s.nombre}</td>
                    <td className="p-3 text-sm text-gray-600">{s.rfc || '-'}</td>
                    <td className="p-3 text-sm text-gray-600">{s.contacto || '-'}</td>
                    <td className="p-3 text-sm text-gray-600">{s.telefono || '-'}</td>
                    <td className="p-3 text-center">
                      {s.activo ? (
                        <span className="text-green-600 text-xs font-medium">ACTIVO</span>
                      ) : (
                        <span className="text-gray-500 text-xs font-medium">INACTIVO</span>
                      )}
                    </td>
                    <td className="p-3">
                      <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline text-sm mr-3">Editar</button>
                      <button onClick={() => toggleActivo(s)} className="text-red-600 hover:underline text-sm">
                        {s.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{editItem ? 'Editar Proveedor' : 'Alta de Proveedor'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">RFC</label>
                    <input
                      type="text"
                      value={form.rfc}
                      onChange={(e) => setForm({ ...form, rfc: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contacto</label>
                    <input
                      type="text"
                      value={form.contacto}
                      onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={form.telefono}
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Correo</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                    {saving ? 'Guardando...' : 'Guardar'}
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

export default function ProveedoresPageWrapper() {
  return (
    <ProtectedRoute requiredModule="COMPRAS">
      <ProveedoresPage />
    </ProtectedRoute>
  )
}
