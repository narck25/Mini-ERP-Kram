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

// Un "tanto" de la solicitud (original para RH o copia para el empleado).
function SolicitudTanto({ vacation, emp, jefe, dias, copia }) {
  const badge = copia === 'original'
    ? { text: 'Original · RH', cls: 'bg-gray-800 text-white' }
    : { text: 'Copia · Empleado', cls: 'border border-gray-800 text-gray-800' };

  return (
    <div className="tanto bg-white p-4">
      {/* Encabezado */}
      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-2 mb-3">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-wide leading-tight">Solicitud de Vacaciones</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Folio: {vacation.id.slice(0, 8).toUpperCase()} · Fecha de solicitud: {fmt(vacation.createdAt)}
          </p>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${badge.cls}`}>{badge.text}</span>
      </div>

      {/* Datos del empleado */}
      <div className="mb-3">
        <h3 className="font-bold text-xs mb-1 border-b border-gray-300 pb-1 uppercase">Datos del empleado</h3>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-sm">
          <p><span className="font-medium">Nombre:</span> {nombreCompleto(emp)}</p>
          <p><span className="font-medium">Clave:</span> {emp?.clave || '—'}</p>
          <p><span className="font-medium">Departamento:</span> {emp?.departamento?.nombre || '—'}</p>
          <p><span className="font-medium">Puesto:</span> {emp?.puesto?.nombre || '—'}</p>
          <p><span className="font-medium">Antigüedad:</span> {vacation.balance?.antiguedad ?? '—'} año(s)</p>
          <p><span className="font-medium">Jefe directo:</span> {nombre(jefe)}</p>
        </div>
      </div>

      {/* Periodo solicitado */}
      <div className="mb-3">
        <h3 className="font-bold text-xs mb-1 border-b border-gray-300 pb-1 uppercase">Periodo solicitado</h3>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <p><span className="font-medium">Inicio:</span> {fmt(vacation.fechaInicio)}</p>
          <p><span className="font-medium">Fin:</span> {fmt(vacation.fechaFin)}</p>
          <p><span className="font-medium">Días:</span> {dias}</p>
        </div>
        <p className="mt-1 text-sm"><span className="font-medium">Motivo:</span> {vacation.motivo || '—'}</p>
      </div>

      {/* Saldo */}
      {vacation.balance && (
        <div className="mb-3">
          <h3 className="font-bold text-xs mb-1 border-b border-gray-300 pb-1 uppercase">Saldo de vacaciones</h3>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <p><span className="font-medium">Corresponden:</span> {vacation.balance.diasCorresponden} días</p>
            <p><span className="font-medium">Usados:</span> {vacation.balance.diasUsados} días</p>
            <p><span className="font-medium">Disponibles:</span> {vacation.balance.diasDisponibles} días</p>
          </div>
        </div>
      )}

      {/* Autorizaciones */}
      <div className="mb-3">
        <h3 className="font-bold text-xs mb-1 border-b border-gray-300 pb-1 uppercase">Autorizaciones</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-1 text-left text-xs">Rol</th>
              <th className="border border-gray-300 p-1 text-left text-xs">Nombre</th>
              <th className="border border-gray-300 p-1 text-left text-xs">Fecha</th>
              <th className="border border-gray-300 p-1 text-left text-xs">Comentario</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-1">Jefe directo</td>
              <td className="border border-gray-300 p-1">{vacation.jefeAutorizadoPor?.name || '—'}</td>
              <td className="border border-gray-300 p-1">{fmt(vacation.jefeAutorizadoAt)}</td>
              <td className="border border-gray-300 p-1">{vacation.comentarioJefe || '—'}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-1">RH</td>
              <td className="border border-gray-300 p-1">{vacation.aprobadoPor?.name || '—'}</td>
              <td className="border border-gray-300 p-1">{fmt(vacation.aprobadoAt)}</td>
              <td className="border border-gray-300 p-1">{vacation.comentarioAprobacion || '—'}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1 text-sm"><span className="font-medium">Estado:</span> {ESTATUS_TEXT[vacation.estatus] || vacation.estatus}</p>
      </div>

      {/* Firmas */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="text-center">
          <div className="border-t border-gray-800 pt-1">
            <p className="text-sm font-medium">{nombreCompleto(emp)}</p>
            <p className="text-xs text-gray-600">Solicitante</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-800 pt-1">
            <p className="text-sm font-medium">{nombre(jefe)}</p>
            <p className="text-xs text-gray-600">Jefe directo</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-800 pt-1">
            <p className="text-sm font-medium">{vacation.aprobadoPor?.name || ''}</p>
            <p className="text-xs text-gray-600">Recursos Humanos</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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

          {/* Dos tantos por hoja (se imprime) */}
          <div className="print-area bg-white rounded-lg shadow">
            <div className="solicitud-duo p-6">
              <SolicitudTanto vacation={vacation} emp={emp} jefe={jefe} dias={dias} copia="original" />

              {/* Línea divisoria para corte */}
              <div className="tanto-cortar flex items-center gap-3 my-2 text-gray-500">
                <div className="flex-1 border-t-2 border-dashed border-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wide">✂️ Cortar aquí</span>
                <div className="flex-1 border-t-2 border-dashed border-gray-400" />
              </div>

              <SolicitudTanto vacation={vacation} emp={emp} jefe={jefe} dias={dias} copia="copia" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
