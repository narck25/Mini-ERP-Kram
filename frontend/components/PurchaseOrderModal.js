'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * PurchaseOrderModal
 * ─────────────────────────────────────────────────────────────
 * Modal para generar órdenes de compra con partidas editables.
 *
 * Props:
 *   request       → Objeto de la solicitud (con items, quotes, etc.)
 *   onClose       → Callback al cerrar el modal
 *   onSuccess     → Callback al generar la OC exitosamente
 * ─────────────────────────────────────────────────────────────
 */
export default function PurchaseOrderModal({ request, onClose, onSuccess }) {
  const { user } = useAuth();

  // ── Estado de las partidas ──
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [iva, setIva] = useState(0);
  const [total, setTotal] = useState(0);
  const [generating, setGenerating] = useState(false);

  // ── IVA configurable (16% por defecto) ──
  const [ivaRate, setIvaRate] = useState(16);

  // ── Información adicional de la OC ──
  const [contactoKram, setContactoKram] = useState('José Luis González Guillén');
  const [lugarEntrega, setLugarEntrega] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // ── Inicializar partidas desde los PurchaseItems de la solicitud ──

  useEffect(() => {
    if (request?.items && request.items.length > 0) {
      const initialItems = request.items.map((item) => ({
        id: item.id,
        productoServicio: item.productoServicio || '',
        cantidad: item.cantidad || 1,
        descripcion: item.descripcion || '',
        precioUnitario: 0,
        importe: 0
      }));
      setItems(initialItems);
    } else {
      // Si no hay items, empezar con una línea vacía
      setItems([
        { id: null, productoServicio: '', cantidad: 1, descripcion: '', precioUnitario: 0, importe: 0 }
      ]);
    }
  }, [request]);

  // ── Recalcular subtotal, IVA y total ──
  const recalcTotals = useCallback((currentItems, currentIvaRate) => {
    const newSubtotal = currentItems.reduce((sum, item) => {
      return sum + (item.cantidad || 0) * (item.precioUnitario || 0);
    }, 0);
    const newIva = newSubtotal * (currentIvaRate / 100);
    const newTotal = newSubtotal + newIva;

    setSubtotal(newSubtotal);
    setIva(newIva);
    setTotal(newTotal);
  }, []);

  // ── Actualizar un campo de una partida ──
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'cantidad' || field === 'precioUnitario'
          ? parseFloat(value) || 0
          : value
      };
      // Recalcular importe de la línea
      if (field === 'cantidad' || field === 'precioUnitario') {
        updated[index].importe =
          (updated[index].cantidad || 0) * (updated[index].precioUnitario || 0);
      }
      // Recalcular totales
      recalcTotals(updated, ivaRate);
      return updated;
    });
  };

  // ── Agregar nueva línea ──
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: null, productoServicio: '', cantidad: 1, descripcion: '', precioUnitario: 0, importe: 0 }
    ]);
  };

  // ── Eliminar línea ──
  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      toast.error('Debe haber al menos una partida');
      return;
    }
    setItems((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      recalcTotals(updated, ivaRate);
      return updated;
    });
  };

  // ── Duplicar línea ──
  const handleDuplicateItem = (index) => {
    setItems((prev) => {
      const original = prev[index];
      const duplicated = { ...original, id: null };
      const updated = [
        ...prev.slice(0, index + 1),
        duplicated,
        ...prev.slice(index + 1)
      ];
      recalcTotals(updated, ivaRate);
      return updated;
    });
  };

  // ── Cambiar tasa de IVA ──
  const handleIvaRateChange = (newRate) => {
    setIvaRate(newRate);
    recalcTotals(items, newRate);
  };

  // ── Validar y enviar ──
  const handleGenerate = async () => {
    // Validar que todas las partidas tengan producto y precio
    const invalidItems = items.filter(
      (item) => !item.productoServicio.trim() || item.precioUnitario <= 0
    );
    if (invalidItems.length > 0) {
      toast.error('Todas las partidas deben tener producto/servicio y precio unitario mayor a 0');
      return;
    }

    try {
      setGenerating(true);

      // Construir payload con las partidas editadas + info adicional
      const payload = {
        items: items.map((item) => ({
          productoServicio: item.productoServicio.trim(),
          cantidad: item.cantidad,
          descripcion: item.descripcion.trim(),
          precioUnitario: item.precioUnitario
        })),
        subtotal,
        iva,
        total,
        ivaRate,
        contactoKram: contactoKram.trim(),
        lugarEntrega: lugarEntrega.trim(),
        observaciones: observaciones.trim()
      };


      const response = await api.post(`/purchases/${request.id}/purchase-order`, payload);

      toast.success(response.data.message || 'Orden de compra generada exitosamente');

      if (onSuccess) {
        onSuccess(response.data.data);
      }
    } catch (error) {
      console.error('Error al generar orden de compra:', error);
      toast.error(error.response?.data?.message || 'Error al generar la orden de compra');
    } finally {
      setGenerating(false);
    }
  };

  // ── Formateo de moneda ──
  const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // ── Obtener la cotización seleccionada ──
  const selectedQuote = request?.quotes?.find((q) => q.isSelected);

  // Solo ADMIN y COMPRAS pueden generar OC
  if (!user || (user.role !== 'ADMIN' && user.role !== 'COMPRAS')) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto mx-4">
        {/* ── Header ── */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-700 to-blue-500 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold">Generar Orden de Compra</h2>
            <p className="text-blue-100 text-sm mt-1">
              Solicitud #{request.folio || request.id?.substring(0, 8)}
              {' '}· {selectedQuote ? `Proveedor: ${selectedQuote.proveedor}` : 'Sin cotización seleccionada'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1"
            title="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Cuerpo ── */}
        <div className="p-6 space-y-6">
          {/* ── Información de la cotización seleccionada ── */}
          {selectedQuote && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Cotización seleccionada</p>
                <p className="text-lg font-bold text-blue-900">{selectedQuote.proveedor}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">Monto cotizado</p>
                <p className="text-lg font-bold text-blue-900">{formatCurrency(selectedQuote.monto)}</p>
              </div>
            </div>
          )}

          {/* ── Tabla de partidas ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Partidas de la Orden de Compra</h3>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar partida
              </button>
            </div>

            {/* Encabezados */}
            <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 rounded-t-lg text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-3">Producto / Servicio</div>
              <div className="col-span-1 text-center">Cant.</div>
              <div className="col-span-2">Descripción</div>
              <div className="col-span-2 text-right">Precio Unit.</div>
              <div className="col-span-2 text-right">Importe</div>
              <div className="col-span-1 text-center">Acción</div>
            </div>

            {/* Filas */}
            <div className="space-y-2 md:space-y-0">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-2 px-3 py-2 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors"
                >
                  {/* Número de línea */}
                  <div className="md:col-span-1 flex md:block items-center gap-2">
                    <span className="md:hidden text-xs text-gray-500 font-medium">#</span>
                    <span className="text-sm font-mono text-gray-500 text-center w-full">{index + 1}</span>
                  </div>

                  {/* Producto / Servicio */}
                  <div className="md:col-span-3">
                    <span className="md:hidden text-xs text-gray-500 font-medium block mb-0.5">Producto / Servicio</span>
                    <input
                      type="text"
                      value={item.productoServicio}
                      onChange={(e) => handleItemChange(index, 'productoServicio', e.target.value)}
                      placeholder="Ej: Laptop HP ProBook"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Cantidad */}
                  <div className="md:col-span-1">
                    <span className="md:hidden text-xs text-gray-500 font-medium block mb-0.5">Cant.</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.cantidad}
                      onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Descripción */}
                  <div className="md:col-span-2">
                    <span className="md:hidden text-xs text-gray-500 font-medium block mb-0.5">Descripción</span>
                    <input
                      type="text"
                      value={item.descripcion}
                      onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                      placeholder="Especificaciones"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Precio Unitario */}
                  <div className="md:col-span-2">
                    <span className="md:hidden text-xs text-gray-500 font-medium block mb-0.5">Precio Unit.</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.precioUnitario || ''}
                      onChange={(e) => handleItemChange(index, 'precioUnitario', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Importe (solo lectura) */}
                  <div className="md:col-span-2">
                    <span className="md:hidden text-xs text-gray-500 font-medium block mb-0.5">Importe</span>
                    <div className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-right font-mono text-gray-700">
                      {formatCurrency(item.importe)}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="md:col-span-1 flex justify-center gap-1">
                    <button
                      onClick={() => handleDuplicateItem(index)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Duplicar partida"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Eliminar partida"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Totales ── */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-col items-end space-y-2">
              {/* Selector de IVA */}
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm text-gray-600 font-medium">Tasa de IVA:</label>
                <div className="flex gap-1">
                  {[0, 8, 16].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleIvaRateChange(rate)}
                      className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                        ivaRate === rate
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-72 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>IVA ({ivaRate}%):</span>
                  <span className="font-mono">{formatCurrency(iva)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-300 pt-1.5">
                  <span>Total:</span>
                  <span className="font-mono">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Información adicional de la OC ── */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información adicional de la OC</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contacto KRAM */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contacto KRAM
                </label>
                <input
                  type="text"
                  value={contactoKram}
                  onChange={(e) => setContactoKram(e.target.value)}
                  placeholder="Nombre del contacto en KRAM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Lugar de entrega */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lugar de entrega
                </label>
                <input
                  type="text"
                  value={lugarEntrega}
                  onChange={(e) => setLugarEntrega(e.target.value)}
                  placeholder="Ej: Almacén central, Planta, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Observaciones (ocupa ambas columnas) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Instrucciones adicionales para el proveedor..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── Nota informativa ── */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">

            <p className="font-medium">📋 Nota importante</p>
            <p className="mt-1">
              Las partidas se precargan desde los items de la solicitud. Puede editarlas, agregar nuevas líneas,
              duplicar o eliminar según sea necesario. El monto total se calculará automáticamente.
              Al confirmar, se generará la orden de compra con las partidas especificadas.
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-all ${
              generating
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
            }`}
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generando...
              </span>
            ) : (
              `Generar OC (${formatCurrency(total)})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
