'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ticketApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

const CATEGORIAS = [
  { value: 'PROBLEMA_TECNICO', label: 'Problema técnico (algo no funciona)' },
  { value: 'SOLICITUD_INFORME', label: 'Solicitud de informe / reporte' },
  { value: 'SOLICITUD_ACCESO', label: 'Solicitud de acceso (usuario, permisos, contraseña)' },
  { value: 'SOLICITUD_EQUIPO', label: 'Solicitud de equipo o instalación' },
  { value: 'OTRO', label: 'Otro' },
];

const PRIORIDADES = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB, igual que el resto del backend
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export default function NuevoTicketPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({ asunto: '', descripcion: '', categoria: '', prioridad: 'MEDIA' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilesChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const valid = [];
    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" excede el tamaño máximo (10MB)`);
        continue;
      }
      if (ALLOWED_TYPES.length && !ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" no es un tipo de archivo permitido`);
        continue;
      }
      valid.push(file);
    }
    setFiles(valid.slice(0, 5));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.asunto.trim() || !formData.descripcion.trim() || !formData.categoria) {
      toast.error('Completa el asunto, la descripción y la categoría');
      return;
    }

    try {
      setLoading(true);
      const payload = new FormData();
      payload.append('asunto', formData.asunto.trim());
      payload.append('descripcion', formData.descripcion.trim());
      payload.append('categoria', formData.categoria);
      payload.append('prioridad', formData.prioridad);
      files.forEach((file) => payload.append('files', file));

      const res = await ticketApi.create(payload);
      toast.success(`Ticket #${res.data.data.folio} creado`);
      router.push('/ti/mis-tickets');
    } catch (error) {
      console.error('Error creando ticket:', error);
      toast.error(error.response?.data?.error || 'No se pudo crear el ticket');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.accessibleModules?.includes('TICKETS')) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">No tiene acceso al módulo de Tickets de TI.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Nuevo ticket a Sistemas</h1>
          <p className="text-gray-600">Reporta un problema, pide un informe, o cualquier solicitud al área de TI</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona una categoría...</option>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <select
              name="prioridad"
              value={formData.prioridad}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asunto *</label>
            <input
              type="text"
              name="asunto"
              value={formData.asunto}
              onChange={handleInputChange}
              required
              maxLength={150}
              placeholder="Resumen breve del problema o solicitud"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              required
              rows={5}
              placeholder="Describe con detalle qué pasa, desde cuándo, y cualquier información que ayude a resolverlo más rápido"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adjuntos (opcional)</label>
            <input
              type="file"
              multiple
              onChange={handleFilesChange}
              className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">Hasta 5 archivos, 10MB cada uno (capturas de pantalla, documentos).</p>
            {files.length > 0 && (
              <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                {files.map((f, i) => <li key={i}>{f.name}</li>)}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/ti/mis-tickets')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Crear ticket'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
