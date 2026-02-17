'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function CandidatesTab({ vacancy, user, onRefresh }) {
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    nombre: '',
    comentarios_rh: ''
  });
  const [cvFile, setCvFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingObservations, setEditingObservations] = useState(null);
  const [observationsText, setObservationsText] = useState('');

  // Verificar si el usuario es RH/ADMIN
  const isRH = ['RH', 'ADMIN'].includes(user.role);
  
  // Verificar si el usuario es el solicitante
  const isSolicitante = vacancy.solicitante?.user?.id === user.id;

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!newCandidate.nombre.trim()) {
      toast.error('El nombre del candidato es requerido');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('nombre', newCandidate.nombre);
      if (newCandidate.comentarios_rh) {
        formData.append('comentarios_rh', newCandidate.comentarios_rh);
      }
      if (cvFile) {
        formData.append('cv', cvFile);
      }

      await api.post(`/recruitment/vacancies/${vacancy.id}/candidates`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Candidato registrado exitosamente');
      setShowAddCandidate(false);
      setNewCandidate({ nombre: '', comentarios_rh: '' });
      setCvFile(null);
      onRefresh();
    } catch (error) {
      console.error('Error adding candidate:', error);
      toast.error(error.response?.data?.error || 'Error al registrar el candidato');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateObservations = async (candidateId) => {
    try {
      await api.put(`/recruitment/candidates/${candidateId}/observations`, {
        comentarios_rh: observationsText
      });

      toast.success('Observaciones actualizadas exitosamente');
      setEditingObservations(null);
      setObservationsText('');
      onRefresh();
    } catch (error) {
      console.error('Error updating observations:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar observaciones');
    }
  };

  const handleVote = async (candidateId, vote) => {
    try {
      await api.put(`/recruitment/candidates/${candidateId}/vote`, { vote });
      
      const voteText = vote === 'like' ? 'Visto bueno' : 'No seleccionado';
      toast.success(`${voteText} registrado exitosamente`);
      onRefresh();
    } catch (error) {
      console.error('Error voting for candidate:', error);
      toast.error(error.response?.data?.error || 'Error al registrar el voto');
    }
  };

  const handleSelectCandidate = async (candidateId) => {
    if (!confirm('¿Estás seguro de seleccionar este candidato? Esto cerrará la vacante.')) {
      return;
    }

    try {
      await api.put(`/recruitment/candidates/${candidateId}/select`);
      toast.success('🎉 Candidato seleccionado. Proceso de contratación puede iniciar.');
      onRefresh();
    } catch (error) {
      console.error('Error selecting candidate:', error);
      toast.error(error.response?.data?.error || 'Error al seleccionar el candidato');
    }
  };

  const handleDownloadCV = async (candidate) => {
    try {
      const response = await api.get(`/recruitment/candidates/${candidate.id}/cv`);
      
      // En un entorno real, aquí descargarías el archivo
      // Por ahora, mostramos la información
      toast.success(`CV disponible: ${response.data.filename}`);
      console.log('CV URL:', response.data.cv_url);
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast.error('Error al descargar el CV');
    }
  };

  const getCandidateStatusColor = (estatus) => {
    switch (estatus) {
      case 'En_Revision': return 'bg-blue-100 text-blue-800';
      case 'Descartado': return 'bg-red-100 text-red-800';
      case 'Seleccionado': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCandidateStatusText = (estatus) => {
    switch (estatus) {
      case 'En_Revision': return 'En revisión';
      case 'Descartado': return 'Descartado';
      case 'Seleccionado': return 'Seleccionado';
      default: return estatus;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado con botón para RH */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Candidatos</h3>
        {isRH && vacancy.estatus === 'Buscando' && (
          <button
            onClick={() => setShowAddCandidate(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm"
          >
            + Registrar Candidato
          </button>
        )}
      </div>

      {/* Formulario para agregar candidato (solo RH) */}
      {showAddCandidate && isRH && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Registrar Nuevo Candidato</h4>
          <form onSubmit={handleAddCandidate}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={newCandidate.nombre}
                  onChange={(e) => setNewCandidate({ ...newCandidate, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones post-filtro (RH)
                </label>
                <textarea
                  value={newCandidate.comentarios_rh}
                  onChange={(e) => setNewCandidate({ ...newCandidate, comentarios_rh: e.target.value })}
                  placeholder="Observaciones sobre el candidato después del filtro inicial..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CV (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setCvFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {cvFile && (
                  <p className="text-sm text-green-600 mt-1">
                    Archivo seleccionado: {cvFile.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCandidate(false);
                    setNewCandidate({ nombre: '', comentarios_rh: '' });
                    setCvFile(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Registrando...' : 'Registrar Candidato'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Lista de candidatos */}
      {vacancy.candidatesRH && vacancy.candidatesRH.length > 0 ? (
        <div className="space-y-4">
          {vacancy.candidatesRH.map((candidate) => (
            <div key={candidate.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 text-lg">{candidate.nombre}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCandidateStatusColor(candidate.estatus)}`}>
                      {getCandidateStatusText(candidate.estatus)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Registrado: {new Date(candidate.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Botones de acción según rol */}
                <div className="flex gap-2">
                  {/* RH: Editar observaciones */}
                  {isRH && (
                    <button
                      onClick={() => {
                        setEditingObservations(candidate.id);
                        setObservationsText(candidate.comentarios_rh || '');
                      }}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm"
                    >
                      {candidate.comentarios_rh ? 'Editar Obs.' : 'Agregar Obs.'}
                    </button>
                  )}

                  {/* Solicitante: Botones de visto bueno */}
                  {isSolicitante && candidate.estatus === 'En_Revision' && (
                    <>
                      <button
                        onClick={() => handleVote(candidate.id, 'like')}
                        className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-md text-sm"
                      >
                        👍 Visto Bueno
                      </button>
                      <button
                        onClick={() => handleVote(candidate.id, 'dislike')}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-sm"
                      >
                        👎 No Seleccionar
                      </button>
                    </>
                  )}

                  {/* Solicitante: Botón de selección final */}
                  {isSolicitante && candidate.estatus === 'Seleccionado' && (
                    <button
                      onClick={() => handleSelectCandidate(candidate.id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
                    >
                      🎉 Seleccionar Candidato
                    </button>
                  )}

                  {/* Descargar CV */}
                  {candidate.cv_url && (
                    <button
                      onClick={() => handleDownloadCV(candidate)}
                      className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md text-sm"
                    >
                      📄 Ver CV
                    </button>
                  )}
                </div>
              </div>

              {/* Observaciones de RH */}
              {candidate.comentarios_rh && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Observaciones de RH:</h5>
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                    {candidate.comentarios_rh}
                  </p>
                </div>
              )}

              {/* Formulario para editar observaciones (solo RH) */}
              {editingObservations === candidate.id && isRH && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Editar observaciones:</h5>
                  <textarea
                    value={observationsText}
                    onChange={(e) => setObservationsText(e.target.value)}
                    placeholder="Escribe tus observaciones post-filtro..."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdateObservations(candidate.id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setEditingObservations(null);
                        setObservationsText('');
                      }}
                      className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Información adicional */}
              <div className="text-sm text-gray-600">
                <p>CV: {candidate.cv_url ? 'Disponible' : 'No disponible'}</p>
                <p>Última actualización: {new Date(candidate.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay candidatos</h3>
          <p className="text-gray-600">
            {isRH && vacancy.estatus === 'Buscando' 
              ? 'Registra el primer candidato para esta vacante.'
              : 'Aún no se han registrado candidatos para esta vacante.'}
          </p>
        </div>
      )}

      {/* Instrucciones según rol */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Instrucciones:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {isRH && (
            <>
              <li>• <strong>RH:</strong> Registra candidatos, sube sus CVs y agrega observaciones post-filtro.</li>
              <li>• <strong>Solicitante:</strong> Revisa los candidatos, lee las observaciones de RH y marca visto bueno.</li>
            </>
          )}
          {isSolicitante && (
            <>
              <li>• <strong>Visto Bueno (👍):</strong> Marca candidatos que consideras adecuados.</li>
              <li>• <strong>No Seleccionar (👎):</strong> Descarta candidatos que no cumplen con los requisitos.</li>
              <li>• <strong>Seleccionar Candidato (🎉):</strong> Elige el candidato final para cerrar la vacante.</li>
            </>
          )}
          <li>• Una vez seleccionado un candidato, la vacante se cerrará automáticamente.</li>
        </ul>
      </div>
    </div>
  );
}