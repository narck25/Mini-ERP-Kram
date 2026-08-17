'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const fmt = (iso) => (iso ? new Date(iso).toISOString().substring(0, 10).split('-').reverse().join('/') : '—');

function MiEspacioPage() {
  const { user, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const hasAccess = user?.accessibleModules?.some(m => ['EMPLEADOS', 'RECLUTAMIENTO', 'COMPRAS', 'VACACIONES', 'INCIDENCIAS', 'DASHBOARD'].includes(m))

  useEffect(() => {
    if (user?.id && hasAccess) {
      if (!dashboardData) {
        fetchDashboardData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.accessibleModules, dashboardData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stats/my-dashboard');
      setDashboardData(response.data);
      setLastUpdated(new Date(response.data.lastUpdated));
    } catch (error) {
      console.error('Error fetching my dashboard data:', error);
      toast.error('Error al cargar datos del dashboard');
      setDashboardData({
        myVacancies: { total: 0, active: 0, latest: [] },
        myPurchases: { total: 0, active: 0, latest: [] },
        pendingActivities: { total: 0, activities: [] },
        candidates: { total: 0, enRevision: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estatus) => {
    const colors = {
      'Solicitada': 'bg-yellow-100 text-yellow-800',
      'Aprobada': 'bg-green-100 text-green-800',
      'Buscando': 'bg-blue-100 text-blue-800',
      'Cerrada': 'bg-gray-100 text-gray-800'
    };
    return colors[estatus] || 'bg-gray-100 text-gray-800';
  };

  // Datos para gráfica de vacantes por estatus
  const vacancyChartData = dashboardData?.myVacancies ? [
    { name: 'Solicitadas', value: dashboardData.myVacancies.latest.filter(v => v.estatus === 'Solicitada').length || 0 },
    { name: 'Aprobadas', value: dashboardData.myVacancies.latest.filter(v => v.estatus === 'Aprobada').length || 0 },
    { name: 'Buscando', value: dashboardData.myVacancies.latest.filter(v => v.estatus === 'Buscando').length || 0 },
    { name: 'Cerradas', value: dashboardData.myVacancies.latest.filter(v => v.estatus === 'Cerrada').length || 0 }
  ] : [];

  const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#6B7280'];

  const hasReclutamiento = user?.accessibleModules?.includes('RECLUTAMIENTO');
  const hasCompras = user?.accessibleModules?.includes('COMPRAS');
  const hasVacaciones = user?.accessibleModules?.includes('VACACIONES');

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Verificando autenticación...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !hasAccess) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">No tienes acceso a este módulo.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Mi Espacio</h1>
              <p className="text-gray-600">Panel personal con tus solicitudes y actividades</p>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-1">
                  Última actualización: {lastUpdated.toLocaleTimeString('es-MX')}
                </p>
              )}
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando tu espacio personal...</p>
          </div>
        ) : (
          <>
            {/* Tarjetas de métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Mis Vacantes — solo si tiene módulo RECLUTAMIENTO */}
              {hasReclutamiento && (
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Mis Vacantes</h3>
                    <p className="text-sm text-gray-600">Solicitudes realizadas</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {dashboardData?.myVacancies?.total || 0}
                </div>
                <div className="text-sm text-gray-600">
                  {dashboardData?.myVacancies?.active || 0} activas
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link href="/reclutamiento/mis-solicitudes" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                    Ver mis vacantes
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
              )}

              {/* Mis Vacaciones — solo si tiene módulo VACACIONES */}
              {hasVacaciones && (
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Mis Vacaciones</h3>
                    <p className="text-sm text-gray-600">Días disponibles</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <span className="text-2xl">🏖️</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {dashboardData?.myVacations?.balance?.diasDisponibles ?? 0}
                </div>
                <div className="text-sm text-gray-600">
                  {dashboardData?.myVacations?.pending || 0} pendientes
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link href="/vacaciones/mis-solicitudes" className="text-emerald-600 hover:text-emerald-800 text-sm font-medium flex items-center gap-1">
                    Ver mis vacaciones
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
              )}

              {/* Mis Compras — solo si tiene módulo COMPRAS */}
              {hasCompras && (
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Mis Compras</h3>
                    <p className="text-sm text-gray-600">Solicitudes de compra</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {dashboardData?.myPurchases?.total || 0}
                </div>
                <div className="text-sm text-gray-600">
                  {dashboardData?.myPurchases?.active || 0} activas
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link href="/compras/mis-solicitudes" className="text-yellow-600 hover:text-yellow-800 text-sm font-medium flex items-center gap-1">
                    Ver mis compras
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
              )}

              {/* Candidatos — solo si tiene módulo RECLUTAMIENTO */}
              {hasReclutamiento && (
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Candidatos</h3>
                    <p className="text-sm text-gray-600">En revisión</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 01-4 4m4-4a4 4 0 00-4-4m0 0a4 4 0 00-4 4" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {dashboardData?.candidates?.enRevision || 0}
                </div>
                <div className="text-sm text-gray-600">
                  de {dashboardData?.candidates?.total || 0} totales
                </div>
              </div>
              )}
            </div>

            {/* Gráfica y lista de últimas vacantes — solo RECLUTAMIENTO */}
            {hasReclutamiento && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Gráfica de vacantes */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Distribución de Vacantes</h2>
                {vacancyChartData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={vacancyChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {vacancyChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aún no tienes vacantes registradas</p>
                    <Link href="/reclutamiento/solicitar-vacante" className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block">
                      Solicitar mi primera vacante
                    </Link>
                  </div>
                )}
              </div>

              {/* Últimas vacantes */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Últimas Vacantes</h2>
                  <Link href="/reclutamiento/mis-solicitudes" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Ver todas
                  </Link>
                </div>
                {dashboardData?.myVacancies?.latest?.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.myVacancies.latest.map((vacancy) => (
                      <Link
                        key={vacancy.id}
                        href={`/reclutamiento/vacantes/${vacancy.id}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{vacancy.titulo}</h3>
                            <p className="text-sm text-gray-600">{vacancy.departamento}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vacancy.estatus)}`}>
                            {vacancy.estatus}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {(() => { const d = vacancy.createdAt.split('T')[0].split('-'); return `${d[2]}/${d[1]}/${d[0]}`; })()}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No tienes vacantes registradas</p>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Mis vacaciones — solo VACACIONES */}
            {hasVacaciones && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Mis Vacaciones</h2>
                <Link href="/vacaciones/mis-solicitudes" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Ver todas
                </Link>
              </div>
              {dashboardData?.myVacations?.balance && (
                <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-emerald-50 rounded-lg">
                  <div>
                    <p className="text-sm text-emerald-600">Disponibles</p>
                    <p className="text-xl font-bold text-emerald-800">{dashboardData.myVacations.balance.diasDisponibles}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Corresponden</p>
                    <p className="text-lg font-semibold text-gray-800">{dashboardData.myVacations.balance.diasCorresponden}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Usados</p>
                    <p className="text-lg font-semibold text-gray-800">{dashboardData.myVacations.balance.diasUsados}</p>
                  </div>
                </div>
              )}
              {dashboardData?.myVacations?.latest?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.myVacations.latest.map((v) => (
                    <Link key={v.id} href={`/vacaciones/solicitud/${v.id}`} className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{fmt(v.fechaInicio)} → {fmt(v.fechaFin)}</p>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{v.estatus}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No tienes solicitudes de vacaciones</p>
                  <Link href="/vacaciones/mis-solicitudes" className="text-emerald-600 hover:text-emerald-800 text-sm font-medium mt-2 inline-block">
                    Solicitar mis primeras vacaciones
                  </Link>
                </div>
              )}
            </div>
            )}

            {/* Acciones rápidas */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Acciones Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {hasReclutamiento && (
                <Link
                  href="/reclutamiento/solicitar-vacante"
                  className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 flex flex-col items-center justify-center text-center transition-colors"
                >
                  <div className="p-3 bg-blue-100 rounded-lg mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Solicitar Vacante</h3>
                  <p className="text-sm text-gray-600">Nueva solicitud de personal</p>
                </Link>
                )}

                {hasCompras && (
                <Link
                  href="/compras/nueva-solicitud"
                  className="bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg p-4 flex flex-col items-center justify-center text-center transition-colors"
                >
                  <div className="p-3 bg-yellow-100 rounded-lg mb-3">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Nueva Compra</h3>
                  <p className="text-sm text-gray-600">Solicitar una compra</p>
                </Link>
                )}

                {hasReclutamiento && (
                <Link
                  href="/reclutamiento/mis-solicitudes"
                  className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 flex flex-col items-center justify-center text-center transition-colors"
                >
                  <div className="p-3 bg-green-100 rounded-lg mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Mis Solicitudes</h3>
                  <p className="text-sm text-gray-600">Ver historial completo</p>
                </Link>
                )}

                {hasVacaciones && (
                <Link
                  href="/vacaciones/mis-solicitudes"
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg p-4 flex flex-col items-center justify-center text-center transition-colors"
                >
                  <div className="p-3 bg-emerald-100 rounded-lg mb-3">
                    <span className="text-xl">🏖️</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Solicitar Vacaciones</h3>
                  <p className="text-sm text-gray-600">Pedir mis días</p>
                </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function MiEspacioPageWrapper() {
  return (
    <ProtectedRoute requiredModule="DASHBOARD">
      <MiEspacioPage />
    </ProtectedRoute>
  );
}
