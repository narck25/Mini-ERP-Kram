'use client';

import { useState, useEffect } from 'react';
import { supplierApi } from '@/lib/api/suppliers';
import { toast } from 'react-hot-toast';

const NEW_OPTION = '__new__';

/**
 * Selector de proveedor del catálogo, con opción de dar de alta uno nuevo
 * sin salir de la pantalla. Controlado: recibe `value` (proveedorId) y
 * `onChange(proveedorId)`.
 */
export default function SupplierSelect({ value, onChange, required = false }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ nombre: '', rfc: '', contacto: '' });
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await supplierApi.list({ activo: true });
      setSuppliers(res.data?.data || []);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      toast.error('Error al cargar el catálogo de proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === NEW_OPTION) {
      setShowNewForm(true);
      return;
    }
    onChange(val);
  };

  const handleCreateSupplier = async () => {
    if (!newSupplier.nombre.trim()) {
      toast.error('El nombre del proveedor es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const res = await supplierApi.create(newSupplier);
      const created = res.data.data;
      toast.success('Proveedor agregado al catálogo');
      setSuppliers(prev => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      onChange(created.id);
      setShowNewForm(false);
      setNewSupplier({ nombre: '', rfc: '', contacto: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al agregar el proveedor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <select
        value={value || ''}
        onChange={handleSelectChange}
        required={required}
        disabled={loading}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <option value="">{loading ? 'Cargando proveedores...' : 'Seleccionar proveedor'}</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>{s.nombre}</option>
        ))}
        <option value={NEW_OPTION}>+ Agregar proveedor nuevo</option>
      </select>

      {showNewForm && (
        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del proveedor *</label>
            <input
              type="text"
              value={newSupplier.nombre}
              onChange={(e) => setNewSupplier(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre o razón social"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">RFC</label>
              <input
                type="text"
                value={newSupplier.rfc}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, rfc: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contacto</label>
              <input
                type="text"
                value={newSupplier.contacto}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, contacto: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowNewForm(false); setNewSupplier({ nombre: '', rfc: '', contacto: '' }); }}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateSupplier}
              disabled={saving}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar proveedor'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
