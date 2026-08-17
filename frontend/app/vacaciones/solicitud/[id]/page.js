'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { vacationApi } from '@/lib/api';

const fmt = (iso) => (iso ? new Date(iso).toISOString().substring(0, 10).split('-').reverse().join('/') : '—');
const nombre = (e) => [e?.nombres, e?.apellidoPaterno].filter(Boolean).join(' ') || '—';
const nombreCompleto = (e) => [e?.nombres, e?.apellidoPaterno, e?.apellidoMaterno].filter(Boolean).join(' ');

function calcDias(inicio, fin) {
  if (!inicio || !fin) return 0;
  const a = new Date(inicio.substring(0, 10));
  const b = new Date(fin.substring(0, 10));
  return Math.max(0, Math.round((b - a) / 86400000) + 1);
}

const ESTATUS_TEXT = {
  PENDIENTE: 'Pendiente',
  AUTORIZADA: 'Autorizada por jefe',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
};

export default function SolicitudVacacionesPage() {
  const { id } = useParams();
  const router = useRouter();
  const [vacation, setVacation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await vacationApi.getById(id);
        setVacation(res.data?.data);
      } catch (e) {
        setError('Error al cargar la solicitud');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <DashboardLayout><div className="p-6 text-center">Cargando...</div></DashboardLayout>;
  if (error) return <DashboardLayout><div className="p-6 text-red-600">{error}</div></DashboardLayout>;
  if (!vacation) return <DashboardLayout><div className="p-6 text-center">Solicitud no encontrada</div></DashboardLayout>;

  const emp = vacation.empleado;
  const jefe = emp?.reportaA;
  const dias = calcDias(vacation.fechaInicio, vacation.fechaFin);

  return (
    <ProtectedRoute requiredModule="VACACIONES" redirectTo="/dashboard/mi-espacio">
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto">
          {/* Barra de acciones (no se imprime) */}
          <div className="flex justify-between items-center mb-4 no-print">
            <button onClick={() => router.back()} className="text-blue-600 hover:underline">← Regresar</button>
            <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              🖨️ Imprimir Solicitud
            </button>
          </div>

          {/* Solicitud (se imprime) */}
          <div className="print-area bg-white rounded-lg shadow p-8">
            <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
              <h1 className="text-2xl font-bold uppercase tracking-wide">Solicitud de Vacaciones</h1>
              <p className="text-gray-600 mt-1">Folio: {vacation.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-gray-600">Fecha de solicitud: {fmt(vacation.createdAt)}</p>
            </div>

            {/* Datos del empleado */}
            <div className="mb-6">
              <h3 className="font-bold mb-2 border-b border-gray-300 pb-1">Datos del empleado</h3>
              <div className="grid grid-cols-2 gap-2">
                <p><span className="font-medium">Nombre:</span> {nombreCompleto(emp)}</p>
                <p><span className="font-medium">Clave:</span> {emp?.clave || '—'}</p>
                <p><span className="font-medium">Departamento:</span> {emp?.departamento?.nombre || '—'}</p>
                <p><span className="font-medium">Puesto:</span> {emp?.puesto?.nombre || '—'}</p>
                <p><span className="font-medium">Antigüedad:</span> {vacation.balance?.antiguedad ?? '—'} año(s)</p>
                <p><span className="font-medium">Jefe directo:</span> {nombre(jefe)}</p>
              </div>
            </div>

            {/* Periodo solicitado */}
            <div className="mb-6">
              <h3 className="font-bold mb-2 border-b border-gray-300 pb-1">Periodo solicitado</h3>
              <div className="grid grid-cols-3 gap-2">
                <p><span className="font-medium">Inicio:</span> {fmt(vacation.fechaInicio)}</p>
                <p><span className="font-medium">Fin:</span> {fmt(vacation.fechaFin)}</p>
                <p><span className="font-medium">Días:</span> {dias}</p>
              </div>
              <p className="mt-2"><span className="font-medium">Motivo:</span> {vacation.motivo || '—'}</p>
            </div>

            {/* Saldo */}
            {vacation.balance && (
              <div className="mb-6">
                <h3 className="font-bold mb-2 border-b border-gray-300 pb-1">Saldo de vacaciones</h3>
                <div className="grid grid-cols-3 gap-2">
                  <p><span className="font-medium">Corresponden:</span> {vacation.balance.diasCorresponden} días</p>
                  <p><span className="font-medium">Usados:</span> {vacation.balance.diasUsados} días</p>
                  <p><span className="font-medium">Disponibles:</span> {vacation.balance.diasDisponibles} días</p>
                </div>
              </div>
            )}

            {/* Autorizaciones */}
            <div className="mb-6">
              <h3 className="font-bold mb-2 border-b border-gray-300 pb-1">Autorizaciones</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Rol</th>
                    <th className="border border-gray-300 p-2 text-left">Nombre</th>
                    <th className="border border-gray-300 p-2 text-left">Fecha</th>
                    <th className="border border-gray-300 p-2 text-left">Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2">Jefe directo</td>
                    <td className="border border-gray-300 p-2">{vacation.jefeAutorizadoPor?.name || '—'}</td>
                    <td className="border border-gray-300 p-2">{fmt(vacation.jefeAutorizadoAt)}</td>
                    <td className="border border-gray-300 p-2">{vacation.comentarioJefe || '—'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">RH</td>
                    <td className="border border-gray-300 p-2">{vacation.aprobadoPor?.name || '—'}</td>
                    <td className="border border-gray-300 p-2">{fmt(vacation.aprobadoAt)}</td>
                    <td className="border border-gray-300 p-2">{vacation.comentarioAprobacion || '—'}</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-2"><span className="font-medium">Estado:</span> {ESTATUS_TEXT[vacation.estatus] || vacation.estatus}</p>
            </div>

            {/* Firmas */}
            <div className="grid grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="border-t border-gray-800 pt-2">
                  <p className="font-medium">{nombreCompleto(emp)}</p>
                  <p className="text-sm text-gray-600">Solicitante</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-800 pt-2">
                  <p className="font-medium">{nombre(jefe)}</p>
                  <p className="text-sm text-gray-600">Jefe directo</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-800 pt-2">
                  <p className="font-medium">{vacation.aprobadoPor?.name || ''}</p>
                  <p className="text-sm text-gray-600">Recursos Humanos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
