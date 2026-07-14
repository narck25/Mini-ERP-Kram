'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import usePurchaseItems from '@/hooks/usePurchaseItems';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function NuevaSolicitudComprasPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { items, handleItemChange, addItem, removeItem, validateItems, getItemsPayload } = usePurchaseItems();

  const [formData, setFormData] = useState({ justificacion: '' });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.justificacion.trim()) {
      toast.error('La justificación es requerida');
      return;
    }
    if (!validateItems()) return;

    try {
      setLoading(true);
      await api.post('/purchases', {
        justificacion: formData.justificacion,
        items: getItemsPayload()
      });
      toast.success('Solicitud de compra creada exitosamente');
      router.push('/compras/mis-solicitudes');
    } catch (error) {
      console.error('Error creating purchase request:', error);
      toast.error(error.response?.data?.message || 'Error al crear la solicitud de compra');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.accessibleModules?.includes('COMPRAS')) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">No tiene acceso al módulo de Compras.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nueva Solicitud de Compra</h1>
              <p className="text-gray-600">Completa el formulario para solicitar materiales o servicios</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/compras/mis-solicitudes')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                ← Volver
              </button>
            </div>
          </div>
          
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Información importante</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Las solicitudes mayores a $28,000 MXN requieren autorización adicional</li>
                    <li>El departamento de compras subirá hasta 3 cotizaciones para tu selección</li>
                    <li>Puedes agregar múltiples ítems en una sola solicitud</li>
                    <li>La justificación debe ser clara y detallada</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            {/* Justificación */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Justificación de la solicitud *
              </label>
              <textarea
                name="justificacion"
                value={formData.justificacion}
                onChange={handleInputChange}
                placeholder="Describe la necesidad, propósito y beneficios de esta solicitud de compra..."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Explica claramente por qué necesitas estos materiales o servicios.
              </p>
            </div>

            {/* Ítems de la solicitud */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Ítems solicitados</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar Ítem
                </button>
              </div>

              <div className="space-y-6">
                {items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-gray-900">Ítem #{index + 1}</h3>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Producto/Servicio */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Producto/Servicio *
                        </label>
                        <input
                          type="text"
                          value={item.productoServicio}
                          onChange={(e) => handleItemChange(index, 'productoServicio', e.target.value)}
                          placeholder="Ej: Laptop Dell, Servicio de mantenimiento, Material de oficina..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      {/* Cantidad */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                          placeholder="Ej: 1, 5, 10..."
                          min="0.01"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      {/* Descripción */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción (opcional)
                        </label>
                        <input
                          type="text"
                          value={item.descripcion}
                          onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                          placeholder="Especificaciones, modelo, características..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen */}
            <div className="mb-8 bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Resumen de la solicitud</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total de ítems:</p>
                  <p className="font-medium">{items.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado inicial:</p>
                  <p className="font-medium text-red-600">NUEVO</p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push('/compras/mis-solicitudes')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Procesando...
                  </>
                ) : (
                  'Enviar Solicitud'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">¿Qué sucede después?</h3>
              <div className="mt-2 text-sm text-green-700">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Tu solicitud será revisada por el departamento de compras</li>
                  <li>Se buscarán hasta 3 cotizaciones de diferentes proveedores</li>
                  <li>Recibirás una notificación cuando las cotizaciones estén listas</li>
                  <li>Podrás seleccionar la cotización que mejor se adapte a tus necesidades</li>
                  <li>Si el monto supera $28,000 MXN, se requerirá autorización adicional</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}