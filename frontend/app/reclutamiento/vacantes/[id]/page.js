'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import CandidatesTab from './CandidatesTab';
import ProtectedRoute from '@/components/ProtectedRoute';

function VacancyDetailPageContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (user && id) {
      fetchVacancy();
    }
  }, [user, id]);

  const fetchVacancy = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/recruitment/vacancies/${id}`);
      setVacancy(response.data.vacancy);
    } catch (error) {
      console.error('Error fetching vacancy:', error);
      toast.error('Error al cargar la solicitud de vacante');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await api.post(`/recruitment/vacancies/${id}/comments`, {
        mensaje: newComment
      });
      
      toast.success('Comentario agregado exitosamente');
      setNewComment('');
      fetchVacancy(); // Recargar para obtener los nuevos comentarios
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(error.response?.data?.error || 'Error al agregar comentario');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('¿Estás seguro de aprobar esta solicitud de vacante?')) {
      return;
    }

    try {
      await api.put(`/recruitment/vacancies/${id}/approve`);
      toast.success('Solicitud aprobada exitosamente');
      fetchVacancy();
    } catch (error) {
      console.error('Error approving vacancy:', error);
      toast.error(error.response?.data?.error || 'Error al aprobar la solicitud');
    }
  };

  const handleClose = async () => {
    if (!confirm('¿Estás seguro de cerrar esta solicitud de vacante?')) {
      return;
    }

    try {
      await api.put(`/recruitment/vacancies/${id}/close`);
      toast.success('Solicitud cerrada exitosamente');
      fetchVacancy();
    } catch (error) {
      console.error('Error closing vacancy:', error);
      toast.error(error.response?.data?.error || 'Error al cerrar la solicitud');
    }
  };

  const handleDelete = async () => {
    if (!confirm('⚠️ ¿Estás seguro de ELIMINAR PERMANENTEMENTE esta vacante? Se borrarán todos los candidatos, comentarios y actividades asociados. Esta acción NO se puede deshacer.')) {
      return;
    }

    try {
      await api.delete(`/recruitment/vacancies/${id}`);
      toast.success('Vacante eliminada permanentemente');
      router.push((user.role === 'RH' || user.role === 'ADMIN') ? '/rh/reclutamiento' : '/reclutamiento/mis-solicitudes');
    } catch (error) {
      console.error('Error deleting vacancy:', error);
      toast.error(error.response?.data?.error || 'Error al eliminar la vacante');
    }
  };

  const handleCancel = async () => {
    if (!confirm('¿Estás seguro de cancelar esta vacante? Se cerrará y ya no estará disponible para búsqueda de candidatos.')) {
      return;
    }

    try {
      await api.put(`/recruitment/vacancies/${id}/cancel`);
      toast.success('Vacante cancelada exitosamente');
      fetchVacancy();
    } catch (error) {
      console.error('Error cancelling vacancy:', error);
      toast.error(error.response?.data?.error || 'Error al cancelar la vacante');
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

  // Función para formatear valores de enum
  const formatEnumValue = (value) => {
    if (!value) return 'No especificado';
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Función para formatear booleanos
  const formatBoolean = (value) => {
    return value ? '✅ Sí' : '❌ No';
  };

  // Función para formatear fecha
  const formatDate = (date) => {
    if (!date) return 'No especificada';
    return new Date(date).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para verificar si es reemplazo
  const isReemplazo = (motivo) => {
    return motivo && motivo.includes('REEMPLAZO');
  };

  const canComment = () => {
    if (!user || !vacancy) return false;
    
    // Usuarios con acceso al módulo de Reclutamiento pueden comentar
    if (user.accessibleModules?.includes('RECLUTAMIENTO')) {
      // RH y ADMIN pueden comentar siempre
      if (user.role === 'RH' || user.role === 'ADMIN') return true;
      
      // Jefes de área solo pueden comentar en sus propias solicitudes
      return vacancy.solicitante?.user?.id === user.id;
    }
    
    return false;
  };

  const canApprove = () => {
    return user && (user.role === 'RH' || user.role === 'ADMIN') && 
           vacancy?.estatus === 'Solicitada';
  };

  const canClose = () => {
    return user && (user.role === 'RH' || user.role === 'ADMIN') && 
           vacancy?.estatus !== 'Cerrada';
  };

  const canDefineTechnicalProfile = () => {
    return user && user.accessibleModules?.includes('RECLUTAMIENTO') && 
           vacancy?.estatus === 'Aprobada' && 
           vacancy?.solicitante?.user?.id === user.id;
  };

  const canDelete = () => {
    return user && (user.role === 'RH' || user.role === 'ADMIN');
  };

  const canCancel = () => {
    return user && user.accessibleModules?.includes('RECLUTAMIENTO') && 
           vacancy?.solicitante?.user?.id === user.id &&
           vacancy?.estatus !== 'Cerrada';
  };

  if (!user || !user.accessibleModules?.includes('RECLUTAMIENTO')) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">No tienes acceso al módulo de Reclutamiento.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando información de la vacante...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!vacancy) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Solicitud no encontrada</h2>
            <p className="text-red-600 mt-1">La solicitud de vacante que buscas no existe o no tienes permisos para verla.</p>
            <button
              onClick={() => router.back()}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              Volver
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Encabezado */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{vacancy.titulo}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <Link
                  href={(user.role === 'RH' || user.role === 'ADMIN') ? '/rh/reclutamiento' : '/reclutamiento/mis-solicitudes'}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Volver
                </Link>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vacancy.estatus)}`}>
                  {getStatusText(vacancy.estatus)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {canApprove() && (
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm"
                >
                  Aprobar Solicitud
                </button>
              )}
              
              {canClose() && (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium text-sm"
                >
                  Cerrar Solicitud
                </button>
              )}
              
              {canDefineTechnicalProfile() && (
                <Link
                  href={`/reclutamiento/vacantes/${id}/perfil-tecnico`}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium text-sm"
                >
                  Definir Perfil Técnico
                </Link>
              )}

              {canCancel() && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium text-sm"
                >
                  Cancelar Vacante
                </button>
              )}

              {canDelete() && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium text-sm"
                >
                  Eliminar Vacante
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'info'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Información General
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Comentarios ({vacancy.comments?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('candidates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'candidates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Candidatos ({vacancy.candidatesRH?.length || 0})
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Grid de tarjetas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tarjeta 1: Información de la Vacante */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Vacante</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Nombre del Puesto:</span>
                    <p className="text-sm text-gray-600 mt-1">{vacancy.nombrePuesto || vacancy.titulo}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Departamento:</span>
                    <p className="text-sm text-gray-600 mt-1">{vacancy.departamento?.nombre || 'No especificado'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Reporta a:</span>
                    <p className="text-sm text-gray-600 mt-1">{vacancy.reportaA || 'No especificado'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Número de Vacantes:</span>
                    <p className="text-sm text-gray-600 mt-1">{vacancy.numeroVacantes || 1}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Motivo de Solicitud:</span>
                    <p className="text-sm text-gray-600 mt-1">{formatEnumValue(vacancy.motivoSolicitud)}</p>
                  </div>
                  {isReemplazo(vacancy.motivoSolicitud) && (
                    <div className="space-y-2">
                      {vacancy.personaAReemplazarNombre && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Persona a Reemplazar:</span>
                          <p className="text-sm text-gray-600 mt-1">{vacancy.personaAReemplazarNombre}</p>
                        </div>
                      )}
                      {vacancy.personaAReemplazarCargo && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Cargo de la Persona a Reemplazar:</span>
                          <p className="text-sm text-gray-600 mt-1">{vacancy.personaAReemplazarCargo}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tarjeta 2: Requerimientos de Infraestructura (Sistemas) */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Requerimientos de Infraestructura</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Requiere Laptop:</span>
                    <p className="text-sm text-gray-600 mt-1">{formatBoolean(vacancy.reqLaptop)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Requiere PC de Escritorio:</span>
                    <p className="text-sm text-gray-600 mt-1">{formatBoolean(vacancy.reqComputadoraEscritorio)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Requiere Móvil:</span>
                    <p className="text-sm text-gray-600 mt-1">{formatBoolean(vacancy.reqTelefonoMovil)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Requiere Extensión Telefónica:</span>
                    <p className="text-sm text-gray-600 mt-1">{formatBoolean(vacancy.reqExtensionTelefonica)}</p>
                  </div>
                  </div>
                  {vacancy.ubicacionFisica && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Ubicación Física:</span>
                      <p className="text-sm text-gray-600 mt-1">{vacancy.ubicacionFisica}</p>
                    </div>
                  )}
                  {vacancy.otrosRequerimientos && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Otros Requerimientos:</span>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{vacancy.otrosRequerimientos}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tarjeta 3: Modalidad y Promoción Interna */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Modalidad y Promoción Interna</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Tipo de Contratación:</span>
                    <p className="text-sm text-gray-600 mt-1">{formatEnumValue(vacancy.tipoContratacion)}</p>
                  </div>
                  {(vacancy.candidatoPromocion || vacancy.cargoPromocion) && (
                    <>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Candidato Promoción Interna:</span>
                        <p className="text-sm text-gray-600 mt-1">{vacancy.candidatoPromocion || 'No especificado'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Cargo Actual:</span>
                        <p className="text-sm text-gray-600 mt-1">{vacancy.cargoPromocion || 'No especificado'}</p>
                      </div>
                    </>
                  )}
                  {vacancy.observaciones && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Observaciones:</span>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{vacancy.observaciones}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tarjeta 4: Proceso de Entrevista */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Proceso de Entrevista</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Entrevistador Técnico:</span>
                    <p className="text-sm text-gray-600 mt-1">{vacancy.entrevistadorTecnico || 'No especificado'}</p>
                  </div>
                  {vacancy.entrevistadorRespaldo && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Entrevistador de Respaldo:</span>
                      <p className="text-sm text-gray-600 mt-1">{vacancy.entrevistadorRespaldo}</p>
                    </div>
                  )}
                  {vacancy.conocimientosExtra && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Conocimientos Extra:</span>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{vacancy.conocimientosExtra}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información adicional en una sola fila */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Información del Solicitante */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Solicitante</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Solicitante:</span>
                    <p className="text-sm text-gray-600 mt-1">{vacancy.solicitante?.user?.name || 'No especificado'}</p>
                    <p className="text-xs text-gray-500 mt-1">{vacancy.solicitante?.user?.email || ''}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Fecha de Solicitud:</span>
                    <p className="text-sm text-gray-600 mt-1">{formatDate(vacancy.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Aprobaciones y Firmas */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Aprobaciones y Firmas</h3>
                <div className="space-y-3">
                  {vacancy.autorizadoPor && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Autorizado por:</span>
                      <p className="text-sm text-gray-600 mt-1">{vacancy.autorizadoPor?.user?.name || vacancy.autorizadoPor?.nombre}</p>
                      {vacancy.fechaAutorizacion && (
                        <p className="text-xs text-gray-500 mt-1">Fecha: {formatDate(vacancy.fechaAutorizacion)}</p>
                      )}
                    </div>
                  )}
                  {vacancy.voBoPor && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">VoBo por:</span>
                      <p className="text-sm text-gray-600 mt-1">{vacancy.voBoPor?.user?.name || vacancy.voBoPor?.nombre}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-700">Estado Actual:</span>
                    <p className="text-sm text-gray-600 mt-1">{getStatusText(vacancy.estatus)}</p>
                  </div>
                </div>
              </div>

              {/* Perfil Técnico Detallado */}
              {vacancy.requerimientos_tecnicos && vacancy.requerimientos_tecnicos.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Perfil Técnico Detallado</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                    {vacancy.requerimientos_tecnicos.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actividades Principales */}
            {vacancy.JobActivity && vacancy.JobActivity.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividades Principales</h3>
                <div className="space-y-4">
                  {vacancy.JobActivity.map((activity, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Tipo de Actividad:</span>
                          <p className="text-sm text-gray-600 mt-1">{activity.activityType}</p>
                        </div>
                        {activity.priority && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            Prioridad: {activity.priority}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Descripción:</span>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{activity.description}</p>
                      </div>
                      {activity.duration && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-gray-700">Duración:</span>
                          <p className="text-sm text-gray-600 mt-1">{activity.duration}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-6">
            {/* Formulario para agregar comentario */}
            {canComment() && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Comentario</h3>
                <form onSubmit={handleAddComment}>
                  <div className="mb-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escribe tu comentario aquí..."
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? 'Enviando...' : 'Enviar Comentario'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de comentarios */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Comentarios</h3>
              {vacancy.comments && vacancy.comments.length > 0 ? (
                <div className="space-y-4">
                  {vacancy.comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-gray-900">{comment.user?.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({comment.user?.role === 'RH' ? 'Recursos Humanos' : 
                              comment.user?.role === 'SISTEMAS' ? 'Jefe de Sistemas' :
                              comment.user?.role === 'COMPRAS' ? 'Jefe de Compras' :
                              comment.user?.role})
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.mensaje}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay comentarios</h3>
                  <p className="text-gray-600">Sé el primero en comentar sobre esta solicitud.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'candidates' && (
          <CandidatesTab 
            vacancy={vacancy} 
            user={user} 
            onRefresh={fetchVacancy}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export default function VacancyDetailPage() {
  return (
    <ProtectedRoute requiredModule="RECLUTAMIENTO">
      <VacancyDetailPageContent />
    </ProtectedRoute>
  );
}
