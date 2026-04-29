'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

function RHDashboardCompletoPage() {
  const { user, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    // Usar user?.id como dependencia para evitar re-renders innecesarios
    if (user?.id && (user.role === 'RH' || user.role === 'ADMIN' || user.accessibleModules?.includes('EMPLEADOS'))) {
      // Solo hacer la llamada si no tenemos datos
      if (!dashboardData) {
        fetchDashboardData();
      }
    }
  }, [user?.id, user?.role, user?.accessibleModules, dashboardData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stats/rh/dashboard');
      setDashboardData(response.data);
      setLastUpdated(new Date(response.data.lastUpdated));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error al cargar datos del dashboard');
      setDashboardData({
        employees: { total: 0, active: 0, onVacation: 0, onLeave: 0 },
        vacancies: { total: 0, open: 0, inProgress: 0, closed: 0 },
        recruitment: { total: 0, thisMonth: 0, pending: 0 },
        recentHires: []
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  // Mostrar loading mientras se verifica autenticación
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

  // Verificar acceso después de que authLoading sea false
  if (!user || (user.role !== 'RH' && user.role !== 'ADMIN' && !user.accessibleModules?.includes('EMPLEADOS'))) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">
              No tienes acceso al módulo de Empleados. 
              {user ? ` Tu rol actual es: ${user.role}` : ' No estás autenticado.'}
            </p>
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
              <h1 className="text-2xl font-bold text-gray-900">Dashboard de Recursos Humanos</h1>
              <p className="text-gray-600">Panel de control principal con métricas clave del departamento</p>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-1">
                  Última actualización: {lastUpdated.toLocaleTimeString('es-MX')}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </button>
              <Link
                href="/rh/empleados"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
              >
                Ver Empleados
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando métricas del dashboard...</p>
          </div>
        ) : (
          <>
            {/* Sección de Tarjetas de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Tarjeta 1: Total de Empleados Activos */}
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Empleados Activos</h3>
                    <p className="text-sm text-gray-600">Total en la empresa</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 01-4 4m4-4a4 4 0 00-4-4m0 0a4 4 0 00-4 4" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {dashboardData?.employees?.active || 0}
                </div>
                <div className="text-sm text-gray-600">
                  de {dashboardData?.employees?.total || 0} empleados totales
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link
                    href="/rh/empleados"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                  >
                    Ver todos los empleados
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Tarjeta 2: Empleados de Vacaciones */}
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">En Vacaciones</h3>
                    <p className="text-sm text-gray-600">Actualmente fuera</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {dashboardData?.employees?.onVacation || 0}
                </div>
                <div className="text-sm text-gray-600">
                  {dashboardData?.employees?.onVacation > 0 ? 'Empleados disfrutando vacaciones' : 'Ningún empleado de vacaciones'}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm">
                    <span className="text-gray-600">Incapacidades: </span>
                    <span className="font-medium text-gray-900">{dashboardData?.employees?.onLeave || 0}</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Vacantes Totales */}
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Vacantes</h3>
                    <p className="text-sm text-gray-600">Posiciones abiertas</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {dashboardData?.vacancies?.total || 0}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{dashboardData?.vacancies?.open || 0}</div>
                    <div className="text-xs text-gray-600">Abiertas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">{dashboardData?.vacancies?.inProgress || 0}</div>
                    <div className="text-xs text-gray-600">En proceso</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-600">{dashboardData?.vacancies?.closed || 0}</div>
                    <div className="text-xs text-gray-600">Cerradas</div>
                  </div>
                </div>
              </div>

              {/* Tarjeta 4: Contrataciones del Mes */}
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Contrataciones</h3>
                    <p className="text-sm text-gray-600">Este mes</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {dashboardData?.recruitment?.thisMonth || 0}
                </div>
                <div className="text-sm text-gray-600">
                  {dashboardData?.recruitment?.thisMonth > 0 ? 'Nuevas contrataciones este mes' : 'Sin contrataciones este mes'}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="text-gray-600">Pendientes: </span>
                      <span className="font-medium text-gray-900">{dashboardData?.recruitment?.pending || 0}</span>
                    </div>
                    <Link
                      href="/rh/reclutamiento"
                      className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                    >
                      Ver proceso
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección de Contrataciones Recientes */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Contrataciones Recientes</h2>
                  <p className="text-gray-600">Nuevos empleados incorporados</p>
                </div>
                <Link
                  href="/rh/empleados"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium text-sm"
                >
                  Ver todos
                </Link>
              </div>

              {dashboardData?.recentHires && dashboardData.recentHires.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Empleado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puesto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Departamento
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha de Ingreso
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estatus
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dashboardData.recentHires.map((hire) => (
                        <tr key={hire.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {hire.nombres?.charAt(0) || 'E'}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {hire.nombres || 'Nuevo Empleado'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {hire.clave || 'Sin clave'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{hire.puesto?.nombre || 'No especificado'}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{hire.departamento?.nombre || 'No asignado'}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {hire.fechaAlta ? new Date(hire.fechaAlta).toLocaleDateString('es-MX') : 'No especificada'}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              hire.estatus === 'Activo' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {hire.estatus || 'No especificado'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 01-4 4m4-4a4 4 0 00-4-4m0 0a4 4 0 00-4 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contrataciones recientes</h3>
                  <p className="text-gray-600">No se han registrado nuevas contrataciones este mes.</p>
                </div>
              )}
            </div>

            {/* Sección de Acciones Rápidas */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Acciones Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/rh/empleados"
                  className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 flex flex-col items-center justify-center text-center transition-colors"
                >
                  <div className="p-3 bg-blue-100 rounded-lg mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 01-4 4m4-4a4 4 0 00-4-4m0 0a4 4 0 00-4 4" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Gestionar Empleados</h3>
                  <p className="text-sm text-gray-600">Ver y administrar todos los empleados</p>
                </Link>

                <Link
                  href="/rh/reclutamiento"
                  className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 flex flex-col items-center justify-center text-center transition-colors"
                >
                  <div className="p-3 bg-purple-100 rounded-lg mb-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Reclutamiento</h3>
                  <p className="text-sm text-gray-600">Gestionar vacantes y candidatos</p>
                </Link>

                <Link
                  href="/rh/reclutamiento/crear-vacante"
                  className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 flex flex-col items-center justify-center text-center transition-colors"
                >
                  <div className="p-3 bg-green-100 rounded-lg mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Crear Vacante</h3>
                  <p className="text-sm text-gray-600">Publicar nueva posición</p>
                </Link>

                <Link
                  href="/dashboard/accesos"
                  className="bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg p-4 flex flex-col items-center justify-center text-center transition-colors"
                >
                  <div className="p-3 bg-orange-100 rounded-lg mb-3">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Permisos</h3>
                  <p className="text-sm text-gray-600">Administrar accesos del sistema</p>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function RHDashboardCompletoPageWrapper() {
  return (
    <ProtectedRoute requiredModule="EMPLEADOS">
      <RHDashboardCompletoPage />
    </ProtectedRoute>
  );
}
