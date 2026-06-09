'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';

const ITEMS_PER_PAGE = 8;

const NIVELES_JERARQUICOS = [
  'PRESIDENTE', 'DIRECTOR', 'GERENTE', 'JEFE',
  'COORDINADOR', 'ANALISTA', 'SUPERVISOR',
  'AUX_ADMINISTRATIVO', 'OPERATIVO'
];

const emptyDeptForm = { nombre: '', descripcion: '', estado: 'Activo' };
const emptyPosForm = { nombre: '', descripcion: '', nivelJerarquico: 'OPERATIVO', departamentoId: '', estado: 'Activo' };

export default function OrganizacionPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('departments');

  // Formularios principales
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [showPosForm, setShowPosForm] = useState(false);
  const [deptForm, setDeptForm] = useState({ ...emptyDeptForm });
  const [posForm, setPosForm] = useState({ ...emptyPosForm });
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editingPosId, setEditingPosId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Búsqueda
  const [searchDept, setSearchDept] = useState('');
  const [searchPos, setSearchPos] = useState('');

  // Paginación
  const [deptPage, setDeptPage] = useState(1);
  const [posPage, setPosPage] = useState(1);

  // Modal de puestos por departamento
  const [deptPositionsModal, setDeptPositionsModal] = useState(null);
  const [modalPosForm, setModalPosForm] = useState(null); // { mode: 'new'|'edit', data: pos|null }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptsRes, positionsRes] = await Promise.all([
        api.get('/departments'),
        api.get('/job-positions')
      ]);
      setDepartments(deptsRes.data?.departments || []);
      setJobPositions(positionsRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===== Departamentos filtrados y paginados =====
  const filteredDepts = useMemo(() => {
    if (!searchDept.trim()) return departments;
    const q = searchDept.toLowerCase();
    return departments.filter(d =>
      d.nombre.toLowerCase().includes(q) ||
      (d.descripcion || '').toLowerCase().includes(q)
    );
  }, [departments, searchDept]);

  const totalDeptPages = Math.max(1, Math.ceil(filteredDepts.length / ITEMS_PER_PAGE));
  const paginatedDepts = filteredDepts.slice(
    (deptPage - 1) * ITEMS_PER_PAGE,
    deptPage * ITEMS_PER_PAGE
  );

  // ===== Puestos filtrados y paginados =====
  const filteredPositions = useMemo(() => {
    if (!searchPos.trim()) return jobPositions;
    const q = searchPos.toLowerCase();
    return jobPositions.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.descripcion || '').toLowerCase().includes(q) ||
      (p.departamento?.nombre || '').toLowerCase().includes(q) ||
      (p.nivelJerarquico || '').toLowerCase().includes(q)
    );
  }, [jobPositions, searchPos]);

  const totalPosPages = Math.max(1, Math.ceil(filteredPositions.length / ITEMS_PER_PAGE));
  const paginatedPositions = filteredPositions.slice(
    (posPage - 1) * ITEMS_PER_PAGE,
    posPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setDeptPage(1); }, [searchDept]);
  useEffect(() => { setPosPage(1); }, [searchPos]);

  // ===== Handlers Departamentos =====
  const openNewDept = () => {
    setEditingDeptId(null);
    setDeptForm({ ...emptyDeptForm });
    setShowDeptForm(true);
  };

  const openEditDept = (dept) => {
    setEditingDeptId(dept.id);
    setDeptForm({ nombre: dept.nombre, descripcion: dept.descripcion || '', estado: dept.estado || 'Activo' });
    setShowDeptForm(true);
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingDeptId) {
        await api.put(`/departments/${editingDeptId}`, deptForm);
      } else {
        await api.post('/departments', deptForm);
      }
      setShowDeptForm(false);
      setEditingDeptId(null);
      setDeptForm({ ...emptyDeptForm });
      fetchData();
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!confirm('¿Está seguro de eliminar este departamento?')) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchData();
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  // ===== Handlers Puestos (principales) =====
  const openNewPos = (prefilledDeptId) => {
    setEditingPosId(null);
    setPosForm({ ...emptyPosForm, departamentoId: prefilledDeptId || '' });
    setShowPosForm(true);
  };

  const openEditPos = (pos) => {
    setEditingPosId(pos.id);
    setPosForm({
      nombre: pos.nombre,
      descripcion: pos.descripcion || '',
      nivelJerarquico: pos.nivelJerarquico || 'OPERATIVO',
      departamentoId: pos.departamentoId || pos.departamento?.id || '',
      estado: pos.estado || 'Activo'
    });
    setShowPosForm(true);
  };

  const handlePosSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPosId) {
        await api.put(`/job-positions/${editingPosId}`, posForm);
      } else {
        await api.post('/job-positions', posForm);
      }
      setShowPosForm(false);
      setEditingPosId(null);
      setPosForm({ ...emptyPosForm });
      fetchData();
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePos = async (id) => {
    if (!confirm('¿Está seguro de eliminar este puesto?')) return;
    try {
      await api.delete(`/job-positions/${id}`);
      fetchData();
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  // ===== Handlers del Modal =====
  const openModalNewPos = (deptId) => {
    setModalPosForm({ mode: 'new', data: { ...emptyPosForm, departamentoId: deptId } });
  };

  const openModalEditPos = (pos) => {
    setModalPosForm({
      mode: 'edit',
      data: {
        id: pos.id,
        nombre: pos.nombre,
        descripcion: pos.descripcion || '',
        nivelJerarquico: pos.nivelJerarquico || 'OPERATIVO',
        departamentoId: pos.departamentoId || pos.departamento?.id || '',
        estado: pos.estado || 'Activo'
      }
    });
  };

  const handleModalPosSubmit = async (e) => {
    e.preventDefault();
    if (!modalPosForm) return;
    setSubmitting(true);
    try {
      if (modalPosForm.mode === 'edit') {
        await api.put(`/job-positions/${modalPosForm.data.id}`, modalPosForm.data);
      } else {
        await api.post('/job-positions', modalPosForm.data);
      }
      setModalPosForm(null);
      fetchData();
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalDeletePos = async (id) => {
    if (!confirm('¿Está seguro de eliminar este puesto?')) return;
    try {
      await api.delete(`/job-positions/${id}`);
      fetchData();
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  // ===== Componente Paginación =====
  const Pagination = ({ page, totalPages, setPage }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-gray-200">
        <div className="text-xs text-gray-600">Página {page} de {totalPages}</div>
        <div className="flex space-x-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-2 py-1 border rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >← Anterior</button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-2 py-1 border rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >Siguiente →</button>
        </div>
      </div>
    );
  };

  // ===== Modal de puestos por departamento =====
  const DeptPositionsModal = () => {
    if (!deptPositionsModal) return null;
    const positions = jobPositions.filter(p =>
      p.departamentoId === deptPositionsModal.id || p.departamento?.id === deptPositionsModal.id
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Puestos en {deptPositionsModal.nombre}
            </h3>
            <button
              onClick={() => { setDeptPositionsModal(null); setModalPosForm(null); }}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >&times;</button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-6 flex-1">
            {/* Formulario dentro del modal */}
            {modalPosForm && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">
                  {modalPosForm.mode === 'edit' ? 'Editar Puesto' : 'Nuevo Puesto en ' + deptPositionsModal.nombre}
                </h4>
                <form onSubmit={handleModalPosSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                      <input
                        type="text" required
                        value={modalPosForm.data.nombre}
                        onChange={(e) => setModalPosForm({
                          ...modalPosForm,
                          data: { ...modalPosForm.data, nombre: e.target.value }
                        })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nivel Jerárquico</label>
                      <select
                        value={modalPosForm.data.nivelJerarquico}
                        onChange={(e) => setModalPosForm({
                          ...modalPosForm,
                          data: { ...modalPosForm.data, nivelJerarquico: e.target.value }
                        })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {NIVELES_JERARQUICOS.map(n => (
                          <option key={n} value={n}>{n.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                      <input
                        type="text"
                        value={modalPosForm.data.descripcion}
                        onChange={(e) => setModalPosForm({
                          ...modalPosForm,
                          data: { ...modalPosForm.data, descripcion: e.target.value }
                        })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Descripción opcional"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-3">
                    <button type="button"
                      onClick={() => setModalPosForm(null)}
                      className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"
                    >Cancelar</button>
                    <button type="submit" disabled={submitting}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >{submitting ? '...' : (modalPosForm.mode === 'edit' ? 'Actualizar' : 'Guardar')}</button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de puestos */}
            {positions.length === 0 && !modalPosForm ? (
              <p className="text-gray-500 text-center py-8">Este departamento no tiene puestos registrados</p>
            ) : (
              <div className="space-y-2">
                {positions.map(pos => (
                  <div key={pos.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div>
                      <span className="font-medium text-gray-900">{pos.nombre}</span>
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {pos.nivelJerarquico?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModalEditPos(pos)}
                        className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                      >Editar</button>
                      <button
                        onClick={() => handleModalDeletePos(pos.id)}
                        className="text-red-600 hover:text-red-900 text-xs font-medium"
                      >Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botón agregar puesto */}
            {!modalPosForm && (
              <div className="mt-4">
                <button
                  onClick={() => openModalNewPos(deptPositionsModal.id)}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  + Agregar puesto a {deptPositionsModal.nombre}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute requiredModule="EMPLEADOS">
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Estructura Organizacional</h1>
            <p className="text-gray-500 text-sm mt-1">Administra departamentos y puestos de trabajo</p>
          </div>

          {/* Tabs */}
          <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-6">
              <button
                onClick={() => setActiveTab('departments')}
                className={`pb-2 border-b-2 font-medium text-sm ${
                  activeTab === 'departments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Departamentos <span className="text-xs ml-1 text-gray-400">({departments.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('jobPositions')}
                className={`pb-2 border-b-2 font-medium text-sm ${
                  activeTab === 'jobPositions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Puestos <span className="text-xs ml-1 text-gray-400">({jobPositions.length})</span>
              </button>
            </nav>
          </div>

          {/* ===== TAB: DEPARTAMENTOS ===== */}
          {activeTab === 'departments' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text" placeholder="Buscar departamento..."
                    value={searchDept}
                    onChange={(e) => setSearchDept(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                  <span className="absolute left-2.5 top-2 text-gray-400 text-xs">🔍</span>
                </div>
                <button onClick={openNewDept}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium text-sm whitespace-nowrap"
                >+ Nuevo Departamento</button>
              </div>

              {showDeptForm && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    {editingDeptId ? 'Editar Departamento' : 'Nuevo Departamento'}
                  </h3>
                  <form onSubmit={handleDeptSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                        <input type="text" required value={deptForm.nombre}
                          onChange={(e) => setDeptForm({ ...deptForm, nombre: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                        <select value={deptForm.estado}
                          onChange={(e) => setDeptForm({ ...deptForm, estado: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Activo">Activo</option>
                          <option value="Inactivo">Inactivo</option>
                        </select>
                      </div>
                      <div className="flex items-end space-x-2">
                        <button type="submit" disabled={submitting}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                        >{submitting ? '...' : (editingDeptId ? 'Actualizar' : 'Guardar')}</button>
                        <button type="button"
                          onClick={() => { setShowDeptForm(false); setEditingDeptId(null); }}
                          className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"
                        >Cancelar</button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                      <input type="text" value={deptForm.descripcion}
                        onChange={(e) => setDeptForm({ ...deptForm, descripcion: e.target.value })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Descripción opcional"
                      />
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {paginatedDepts.length === 0 ? (
                  <div className="col-span-full text-center py-10">
                    <p className="text-gray-400 text-sm">{searchDept ? 'Sin resultados' : 'No hay departamentos registrados'}</p>
                  </div>
                ) : (
                  paginatedDepts.map((dept) => {
                    const posCount = jobPositions.filter(p =>
                      p.departamentoId === dept.id || p.departamento?.id === dept.id
                    ).length;
                    return (
                      <div key={dept.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{dept.nombre}</h3>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{dept.descripcion || 'Sin descripción'}</p>
                            <div className="flex items-center mt-2 space-x-2">
                              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                                dept.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>{dept.estado}</span>
                              <span className="text-xs text-gray-500">{posCount} puestos</span>
                            </div>
                          </div>
                          <div className="flex space-x-1 ml-2 shrink-0">
                            <button onClick={() => openEditDept(dept)}
                              className="text-blue-600 hover:text-blue-800 text-xs px-1.5 py-0.5 rounded hover:bg-blue-50" title="Editar">✏️</button>
                            <button onClick={() => handleDeleteDept(dept.id)}
                              className="text-red-600 hover:text-red-800 text-xs px-1.5 py-0.5 rounded hover:bg-red-50" title="Eliminar">🗑️</button>
                          </div>
                        </div>
                        <button
                          onClick={() => setDeptPositionsModal(dept)}
                          className="mt-3 w-full py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                        >👥 Ver {posCount} puesto(s)</button>
                      </div>
                    );
                  })
                )}
              </div>
              <Pagination page={deptPage} totalPages={totalDeptPages} setPage={setDeptPage} />
            </div>
          )}

          {/* ===== TAB: PUESTOS DE TRABAJO ===== */}
          {activeTab === 'jobPositions' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="relative w-full sm:w-64">
                  <input type="text" placeholder="Buscar puesto..."
                    value={searchPos} onChange={(e) => setSearchPos(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                  <span className="absolute left-2.5 top-2 text-gray-400 text-xs">🔍</span>
                </div>
                <button onClick={() => openNewPos('')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium text-sm whitespace-nowrap"
                >+ Nuevo Puesto</button>
              </div>

              {showPosForm && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    {editingPosId ? 'Editar Puesto' : 'Nuevo Puesto'}
                  </h3>
                  <form onSubmit={handlePosSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                        <input type="text" required value={posForm.nombre}
                          onChange={(e) => setPosForm({ ...posForm, nombre: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Departamento *</label>
                        <select required value={posForm.departamentoId}
                          onChange={(e) => setPosForm({ ...posForm, departamentoId: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nivel</label>
                        <select value={posForm.nivelJerarquico}
                          onChange={(e) => setPosForm({ ...posForm, nivelJerarquico: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {NIVELES_JERARQUICOS.map(n => (
                            <option key={n} value={n}>{n.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end space-x-2">
                        <button type="submit" disabled={submitting}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                        >{submitting ? '...' : (editingPosId ? 'Actualizar' : 'Guardar')}</button>
                        <button type="button"
                          onClick={() => { setShowPosForm(false); setEditingPosId(null); }}
                          className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"
                        >Cancelar</button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                      <input type="text" value={posForm.descripcion}
                        onChange={(e) => setPosForm({ ...posForm, descripcion: e.target.value })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Descripción opcional"
                      />
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                {paginatedPositions.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-400 text-sm">{searchPos ? 'Sin resultados' : 'No hay puestos registrados'}</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Puesto</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Departamento</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedPositions.map((pos) => {
                        const deptName = pos.departamento?.nombre ||
                          departments.find(d => d.id === pos.departamentoId)?.nombre || '—';
                        return (
                          <tr key={pos.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{pos.nombre}</td>
                            <td className="px-4 py-2.5 text-sm text-gray-600">{deptName}</td>
                            <td className="px-4 py-2.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {pos.nivelJerarquico?.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                                pos.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>{pos.estado}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="flex justify-end space-x-1">
                                <button onClick={() => openEditPos(pos)}
                                  className="text-blue-600 hover:text-blue-800 text-xs px-1.5 py-0.5 rounded hover:bg-blue-50" title="Editar">✏️</button>
                                <button onClick={() => handleDeletePos(pos.id)}
                                  className="text-red-600 hover:text-red-800 text-xs px-1.5 py-0.5 rounded hover:bg-red-50" title="Eliminar">🗑️</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                <Pagination page={posPage} totalPages={totalPosPages} setPage={setPosPage} />
              </div>
            </div>
          )}
        </div>

        {/* Modal de puestos por departamento */}
        <DeptPositionsModal />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
