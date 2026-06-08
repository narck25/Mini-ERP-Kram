'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function MisSolicitudesPage() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (user && user.accessibleModules?.includes('RECLUTAMIENTO')) {
      fetchMyVacancies();
    }
  }, [user, pagination.page]);

  const fetchMyVacancies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      const response = await api.get(`/recruitment/my-vacancies?${params.toString()}`);
      setVacancies(response.data.vacancies);
      if (response.data.pagination) {
        setPagination(prev => ({ ...prev, ...response.data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching vacancies:', error);
      toast.error('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estatus) => {
    switch (estatus) {
      case 'Solicitada': return 'bg-yellow-100 text-yellow-800';
      case 'Aprobada': return 'bg-green-100 text-green-800';
      case 'Buscando': return 'bg-blue-100 text-blue-800';
      case 'Cerrada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (estatus) => {
    switch (estatus) {
      case 'Solicitada': return 'En revisión por RH';
      case 'Aprobada': return 'Aprobada - Define perfil técnico';
      case 'Buscando': return 'En búsqueda de candidatos';
      case 'Cerrada': return 'Cerrada';
      default: return estatus;
    }
  };

  if (!user || !user.accessibleModules?.includes('RECLUTAMIENTO')) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">No tienes acceso al módulo de Reclutamiento. Contacta a un administrador si necesitas acceso.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Mis Solicitudes de Vacantes</h1>
              <p className="text-gray-600">Gestiona tus solicitudes de nuevas posiciones en tu área</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/reclutamiento/solicitar-vacante"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                📋 Formulario Digitalizado
              </Link>
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
                <h3 className="text-sm font-medium text-blue-800">Nuevo Formulario Digitalizado</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Usa el <span className="font-semibold">Formulario Digitalizado</span> para solicitar vacantes con todos los campos requeridos 
                    (información de la vacante, requerimientos de sistemas, modalidad de contratación, y proceso de entrevista).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Solicitudes */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando solicitudes...</p>
          </div>
        ) : vacancies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes</h3>
            <p className="text-gray-600 mb-4">Usa el Formulario Digitalizado para crear tu primera solicitud de vacante.</p>
            <Link
              href="/reclutamiento/solicitar-vacante"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              📋 Ir al Formulario Digitalizado
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {vacancies.map((vacancy) => (
                <div key={vacancy.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{vacancy.titulo}</h3>
                        <p className="text-sm text-gray-600">
                          {vacancy.departamento?.nombre} • Solicitado: {(() => {
                            const dateStr = vacancy.createdAt.split('T')[0];
                            const [y, m, d] = dateStr.split('-');
                            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString();
                          })()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vacancy.estatus)}`}>
                          {getStatusText(vacancy.estatus)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {vacancy._count.comments} comentarios
                        </span>
                      </div>
                    </div>
                    
                    {/* Requerimientos técnicos */}
                    {vacancy.requerimientos_tecnicos && vacancy.requerimientos_tecnicos.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Requerimientos técnicos:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {vacancy.requerimientos_tecnicos.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      <Link
                        href={`/reclutamiento/vacantes/${vacancy.id}`}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-medium text-sm"
                      >
                        Ver Detalles
                      </Link>
                      
                      {vacancy.estatus === 'Aprobada' && (
                        <Link
                          href={`/reclutamiento/vacantes/${vacancy.id}/perfil-tecnico`}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm"
                        >
                          Definir Perfil Técnico
                        </Link>
                      )}
                      
                      {vacancy.estatus === 'Buscando' && (
                        <Link
                          href={`/reclutamiento/vacantes/${vacancy.id}`}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium text-sm"
                        >
                          Ver Candidatos
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-lg shadow-md px-4 py-3 mt-6">
                <div className="text-sm text-gray-600">
                  Mostrando página {pagination.page} de {pagination.totalPages} ({pagination.total} resultados)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page <= 1}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      pagination.page <= 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      pagination.page >= pagination.totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
