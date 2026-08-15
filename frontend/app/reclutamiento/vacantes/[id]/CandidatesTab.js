'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Columnas del Kanban
const COLUMNS = [
  { id: 'En_Revision', title: '📋 En Revisión', color: 'blue' },
  { id: 'Seleccionado', title: '👍 Seleccionados', color: 'green' },
  { id: 'Descartado', title: '👎 Descartados', color: 'red' }
];

export default function CandidatesTab({ vacancy, user, onRefresh }) {
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    nombre: '',
    comentarios_rh: ''
  });
  const [cvFile, setCvFile] = useState(null);
  const [psychTestFile, setPsychTestFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingObservations, setEditingObservations] = useState(null);
  const [observationsText, setObservationsText] = useState('');
  
  // Estado para el modal de PDF
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');

  // Estado para editar documentos del candidato
  const [editingDocuments, setEditingDocuments] = useState(null);
  const [newCvFile, setNewCvFile] = useState(null);
  const [newPsychTestFile, setNewPsychTestFile] = useState(null);
  const [submittingDocs, setSubmittingDocs] = useState(false);

  // Verificar si el usuario tiene acceso al módulo de Reclutamiento y es RH/ADMIN
  const isRH = user.accessibleModules?.includes('RECLUTAMIENTO') && (user.role === 'RH' || user.role === 'ADMIN');
  
  // Verificar si el usuario es el solicitante
  const isSolicitante = vacancy.solicitante?.user?.id === user.id;

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Agrupar candidatos por estatus para las columnas Kanban
  const getCandidatesByStatus = () => {
    const grouped = {
      En_Revision: [],
      Seleccionado: [],
      Descartado: []
    };
    
    if (vacancy.candidatesRH) {
      vacancy.candidatesRH.forEach(candidate => {
        if (grouped[candidate.estatus]) {
          grouped[candidate.estatus].push(candidate);
        } else {
          grouped.En_Revision.push(candidate);
        }
      });
    }
    
    return grouped;
  };

  const candidatesByStatus = getCandidatesByStatus();

  const validateFileSize = (file, fieldName) => {
    if (file && file.size > MAX_FILE_SIZE) {
      toast.error(`El archivo "${fieldName}" excede el tamaño máximo permitido de 10MB`);
      return false;
    }
    return true;
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!newCandidate.nombre.trim()) {
      toast.error('El nombre del candidato es requerido');
      return;
    }

    // Validar que el CV sea obligatorio
    if (!cvFile) {
      toast.error('El CV es obligatorio');
      return;
    }

    // Validar tamaño del CV
    if (!validateFileSize(cvFile, 'CV')) return;

    // Validar que el CV sea PDF
    if (cvFile.type !== 'application/pdf') {
      toast.error('El CV debe ser un archivo PDF');
      return;
    }
    
    // Validar pruebas psicométricas solo si se proporcionan
    if (psychTestFile) {
      // Validar tamaño de pruebas psicométricas
      if (!validateFileSize(psychTestFile, 'Pruebas Psicométricas')) return;
      
      if (psychTestFile.type !== 'application/pdf') {
        toast.error('Las pruebas psicométricas deben ser un archivo PDF');
        return;
      }
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('nombre', newCandidate.nombre);
      if (newCandidate.comentarios_rh) {
        formData.append('comentarios_rh', newCandidate.comentarios_rh);
      }
      formData.append('cv', cvFile);
      // Solo agregar psychTest si se seleccionó un archivo
      if (psychTestFile) {
        formData.append('psychTest', psychTestFile);
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
      setPsychTestFile(null);
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

  const handleViewCV = (candidate) => {
    if (!candidate.cv_url) {
      toast.error('CV no disponible');
      return;
    }
    
    const encodedUrl = encodeURI(candidate.cv_url);
    setPdfUrl(encodedUrl);
    setPdfTitle(`CV - ${candidate.nombre}`);
    setShowPdfModal(true);
  };

  const handleUpdateDocuments = async (candidateId) => {
    if (!newCvFile && !newPsychTestFile) {
      toast.error('Debe seleccionar al menos un archivo (CV o pruebas psicométricas)');
      return;
    }

    // Validar CV si se seleccionó
    if (newCvFile) {
      if (!validateFileSize(newCvFile, 'CV')) return;
      if (newCvFile.type !== 'application/pdf') {
        toast.error('El CV debe ser un archivo PDF');
        return;
      }
    }

    // Validar pruebas psicométricas si se seleccionaron
    if (newPsychTestFile) {
      if (!validateFileSize(newPsychTestFile, 'Pruebas Psicométricas')) return;
      if (newPsychTestFile.type !== 'application/pdf') {
        toast.error('Las pruebas psicométricas deben ser un archivo PDF');
        return;
      }
    }

    try {
      setSubmittingDocs(true);
      const formData = new FormData();
      if (newCvFile) formData.append('cv', newCvFile);
      if (newPsychTestFile) formData.append('psychTest', newPsychTestFile);

      await api.put(`/recruitment/candidates/${candidateId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Documentos actualizados exitosamente');
      setEditingDocuments(null);
      setNewCvFile(null);
      setNewPsychTestFile(null);
      onRefresh();
    } catch (error) {
      console.error('Error updating documents:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar documentos');
    } finally {
      setSubmittingDocs(false);
    }
  };

  const handleViewPsychTest = (candidate) => {
    if (!candidate.psych_test_url) {
      toast.error('Pruebas psicométricas no disponibles');
      return;
    }
    
    const encodedUrl = encodeURI(candidate.psych_test_url);
    setPdfUrl(encodedUrl);
    setPdfTitle(`Pruebas Psicométricas - ${candidate.nombre}`);
    setShowPdfModal(true);
  };

  // Manejar el drag & drop entre columnas
  const onDragEnd = useCallback(async (result) => {
    const { source, destination, draggableId } = result;

    // Si se soltó fuera de cualquier columna, no hacer nada
    if (!destination) return;

    // Si se soltó en la misma posición, no hacer nada
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const targetStatus = destination.droppableId;
    const sourceStatus = source.droppableId;

    // Determinar qué acción tomar según el movimiento
    if (targetStatus === 'Seleccionado' && sourceStatus !== 'Seleccionado') {
      // Movido a Seleccionados = Visto bueno (like)
      if (isSolicitante) {
        await handleVote(draggableId, 'like');
      } else {
        toast.error('Solo el solicitante puede mover candidatos a Seleccionados');
        onRefresh(); // Revertir el drag
      }
    } else if (targetStatus === 'Descartado' && sourceStatus !== 'Descartado') {
      // Movido a Descartados = No seleccionar (dislike)
      if (isSolicitante) {
        await handleVote(draggableId, 'dislike');
      } else {
        toast.error('Solo el solicitante puede descartar candidatos');
        onRefresh(); // Revertir el drag
      }
    } else if (targetStatus === 'En_Revision' && sourceStatus !== 'En_Revision') {
      // Movido de vuelta a En Revisión - solo si es RH/ADMIN
      if (isRH) {
        try {
          await api.put(`/recruitment/candidates/${draggableId}/vote`, { vote: 'reset' });
          toast.success('Candidato devuelto a revisión');
          onRefresh();
        } catch (error) {
          toast.error('Error al devolver el candidato a revisión');
          onRefresh();
        }
      } else {
        toast.error('Solo RH puede devolver candidatos a revisión');
        onRefresh();
      }
    } else {
      // Mismo destino, refrescar
      onRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSolicitante, isRH, vacancy.id]);

  const getCandidateStatusColor = (estatus) => {
    switch (estatus) {
      case 'En_Revision': return 'border-l-4 border-l-blue-500';
      case 'Descartado': return 'border-l-4 border-l-red-500';
      case 'Seleccionado': return 'border-l-4 border-l-green-500';
      default: return 'border-l-4 border-l-gray-500';
    }
  };

  const getColumnColor = (columnId) => {
    switch (columnId) {
      case 'En_Revision': return {
        header: 'bg-blue-50 border-blue-200',
        title: 'text-blue-800',
        badge: 'bg-blue-100 text-blue-800',
        body: 'bg-blue-50/30'
      };
      case 'Seleccionado': return {
        header: 'bg-green-50 border-green-200',
        title: 'text-green-800',
        badge: 'bg-green-100 text-green-800',
        body: 'bg-green-50/30'
      };
      case 'Descartado': return {
        header: 'bg-red-50 border-red-200',
        title: 'text-red-800',
        badge: 'bg-red-100 text-red-800',
        body: 'bg-red-50/30'
      };
      default: return {
        header: 'bg-gray-50 border-gray-200',
        title: 'text-gray-800',
        badge: 'bg-gray-100 text-gray-800',
        body: 'bg-gray-50/30'
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado con botón para RH */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Pipeline de Candidatos
          <span className="text-sm font-normal text-gray-500 ml-2">
            (Arrastra candidatos entre columnas para cambiar su estatus)
          </span>
        </h3>
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
                  CV (PDF) *
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setCvFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {cvFile && (
                  <p className="text-sm text-green-600 mt-1">
                    Archivo seleccionado: {cvFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pruebas Psicométricas (PDF) - Opcional
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPsychTestFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {psychTestFile && (
                  <p className="text-sm text-green-600 mt-1">
                    Archivo seleccionado: {psychTestFile.name}
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
                    setPsychTestFile(null);
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

      {/* Pipeline Kanban con Drag & Drop */}
      {vacancy.candidatesRH && vacancy.candidatesRH.length > 0 ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map(column => {
              const colors = getColumnColor(column.id);
              const candidates = candidatesByStatus[column.id] || [];
              
              return (
                <div key={column.id} className="flex flex-col">
                  {/* Encabezado de columna */}
                  <div className={`rounded-t-lg px-4 py-3 border ${colors.header}`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold ${colors.title}`}>{column.title}</h4>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors.badge}`}>
                        {candidates.length}
                      </span>
                    </div>
                  </div>

                  {/* Lista dropeable */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 min-h-[200px] p-2 space-y-2 rounded-b-lg border border-t-0 ${
                          colors.body
                        } ${
                          snapshot.isDraggingOver ? 'ring-2 ring-blue-400 ring-inset' : ''
                        }`}
                      >
                        {candidates.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                            <div className="text-center">
                              <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              <p>Arrastra candidatos aquí</p>
                            </div>
                          </div>
                        )}

                        {candidates.map((candidate, index) => (
                          <Draggable
                            key={candidate.id}
                            draggableId={candidate.id}
                            index={index}
                            isDragDisabled={!isSolicitante && !isRH}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white rounded-lg shadow-sm p-3 ${
                                  getCandidateStatusColor(candidate.estatus)
                                } ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400 rotate-2' : ''
                                } ${
                                  !isSolicitante && !isRH ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                                }`}
                              >
                                {/* Nombre del candidato */}
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium text-gray-900 text-sm leading-tight">
                                    {candidate.nombre}
                                  </h5>
                                  <span className="text-xs text-gray-400 ml-1 whitespace-nowrap">
                                    {new Date(candidate.createdAt).toLocaleDateString()}
                                  </span>
                                </div>

                                {/* Observaciones de RH */}
                                {candidate.comentarios_rh && (
                                  <div className="mb-2">
                                    <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                                      {candidate.comentarios_rh}
                                    </p>
                                  </div>
                                )}

                                {/* Documentos disponibles */}
                                <div className="flex gap-1 mb-2">
                                  {candidate.cv_url && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                      📄 CV
                                    </span>
                                  )}
                                  {candidate.psych_test_url && (
                                    <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                                      📊 Tests
                                    </span>
                                  )}
                                </div>

                                {/* Botones de acción */}
                                <div className="flex flex-wrap gap-1">
                                  {/* RH: Editar documentos (CV y pruebas) */}
                                  {isRH && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingDocuments(candidate.id);
                                        setNewCvFile(null);
                                        setNewPsychTestFile(null);
                                      }}
                                      className="text-xs px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded"
                                    >
                                      📎 Editar Docs
                                    </button>
                                  )}

                                  {/* RH: Editar observaciones */}
                                  {isRH && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingObservations(candidate.id);
                                        setObservationsText(candidate.comentarios_rh || '');
                                      }}
                                      className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded"
                                    >
                                      {candidate.comentarios_rh ? 'Editar Obs.' : '+ Obs.'}
                                    </button>
                                  )}

                                  {/* Ver CV */}
                                  {candidate.cv_url && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewCV(candidate);
                                      }}
                                      className="text-xs px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded"
                                    >
                                      Ver CV
                                    </button>
                                  )}

                                  {/* Ver Pruebas */}
                                  {candidate.psych_test_url && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewPsychTest(candidate);
                                      }}
                                      className="text-xs px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded"
                                    >
                                      Ver Tests
                                    </button>
                                  )}

                                  {/* Solicitante: Botón de selección final (solo en Seleccionados) */}
                                  {isSolicitante && candidate.estatus === 'Seleccionado' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectCandidate(candidate.id);
                                      }}
                                      className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                                    >
                                      🎉 Contratar
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
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

      {/* Formulario para editar observaciones (modal inline) */}
      {editingObservations && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Editar Observaciones</h4>
            <textarea
              value={observationsText}
              onChange={(e) => setObservationsText(e.target.value)}
              placeholder="Escribe tus observaciones post-filtro..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setEditingObservations(null);
                  setObservationsText('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleUpdateObservations(editingObservations)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instrucciones según rol */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Instrucciones:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {isRH && (
            <>
              <li>• <strong>RH:</strong> Registra candidatos, sube sus CVs (PDF obligatorio) y opcionalmente pruebas psicométricas.</li>
              <li>• <strong>RH:</strong> Agrega observaciones post-filtro para ayudar al solicitante en la evaluación.</li>
              <li>• <strong>Solicitante:</strong> Arrastra candidatos entre columnas para marcarlos como seleccionados o descartados.</li>
            </>
          )}
          {isSolicitante && (
            <>
              <li>• <strong>Arrastra</strong> candidatos de &ldquo;En Revisión&rdquo; a &ldquo;Seleccionados&rdquo; (👍) o &ldquo;Descartados&rdquo; (👎).</li>
              <li>• <strong>Seleccionar Candidato (🎉):</strong> En la columna de Seleccionados, haz clic en &ldquo;Contratar&rdquo; para cerrar la vacante.</li>
              <li>• <strong>Documentos:</strong> Puedes ver el CV (📄) y las pruebas psicométricas (📊) de cada candidato.</li>
            </>
          )}
          <li>• Una vez seleccionado un candidato, la vacante se cerrará automáticamente.</li>
        </ul>
      </div>

      {/* Modal para editar documentos del candidato */}
      {editingDocuments && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">📎 Editar Documentos del Candidato</h4>
            <p className="text-sm text-gray-500 mb-4">
              Puedes reemplazar el CV, agregar/actualizar las pruebas psicométricas, o ambos.
              Los archivos anteriores se eliminarán automáticamente.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CV (PDF) - Dejar vacío para mantener el actual
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setNewCvFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {newCvFile && (
                  <p className="text-sm text-green-600 mt-1">
                    Nuevo archivo: {newCvFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pruebas Psicométricas (PDF) - Dejar vacío para mantener las actuales
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setNewPsychTestFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {newPsychTestFile && (
                  <p className="text-sm text-green-600 mt-1">
                    Nuevo archivo: {newPsychTestFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setEditingDocuments(null);
                  setNewCvFile(null);
                  setNewPsychTestFile(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleUpdateDocuments(editingDocuments)}
                disabled={submittingDocs || (!newCvFile && !newPsychTestFile)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingDocs ? 'Subiendo...' : 'Actualizar Documentos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para visualizar PDFs */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl h-5/6 flex flex-col">
            {/* Encabezado del modal */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{pdfTitle}</h3>
              <button
                onClick={() => setShowPdfModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>
            
            {/* Contenido del PDF */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfUrl}
                title={pdfTitle}
                className="w-full h-full border-0"
                style={{ minHeight: '500px' }}
              />
            </div>
            
            {/* Pie del modal */}
            <div className="flex justify-between items-center p-4 border-t">
              <div className="text-sm text-gray-600">
                <p>Para descargar el PDF, haz clic derecho en el documento y selecciona &ldquo;Guardar como&rdquo;</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                >
                  Abrir en nueva pestaña
                </a>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
