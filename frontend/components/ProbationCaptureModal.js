'use client';

import { useState } from 'react';

const TIPO_LABELS = { DIA_30: '30 días', DIA_60: '60 días', DIA_90: '90 días' };

function nombreEmpleado(emp) {
  if (!emp) return '—';
  return `${emp.nombres || emp.nombre || ''} ${emp.apellidoPaterno || ''} ${emp.apellidoMaterno || ''}`.trim();
}

/**
 * Modal para capturar el resultado de una evaluación de periodo de prueba (30/60/90 días).
 * Compartido entre la vista RH (rh/periodo-prueba) y la tarjeta del jefe directo (Mi Espacio).
 */
export default function ProbationCaptureModal({ evaluation, onClose, onSubmit }) {
  const [resultado, setResultado] = useState('APROBADO');
  const [comentarios, setComentarios] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!evaluation) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(evaluation.id, { resultado, comentarios });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Capturar Evaluación</h2>
          <p className="text-sm text-gray-600 mb-4">
            {nombreEmpleado(evaluation.empleado)} — {TIPO_LABELS[evaluation.tipo] || evaluation.tipo}
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Resultado *</label>
            <select value={resultado} onChange={(e) => setResultado(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="APROBADO">Aprobado</option>
              <option value="NO_APROBADO">No aprobado</option>
              <option value="EXTENDIDO">Extendido</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios</label>
            <textarea value={comentarios} onChange={(e) => setComentarios(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50">
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
