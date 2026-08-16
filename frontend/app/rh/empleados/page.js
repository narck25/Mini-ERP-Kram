'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import EmployeeTable from '@/components/EmployeeTable';
import EmployeeForm from '@/components/EmployeeForm';
import EmployeeImport from '@/components/EmployeeImport';
import api from '@/lib/api';

function EmpleadosPageContent() {
  const { user } = useAuth();
  const isRHOrAdmin = user?.role === 'ADMIN' || user?.role === 'RH';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showBajaModal, setShowBajaModal] = useState(false);
  const [bajaEmployee, setBajaEmployee] = useState(null);
  const [bajaMotivo, setBajaMotivo] = useState('Renuncia');
  const [bajaDetalle, setBajaDetalle] = useState('');
  const [bajaFecha, setBajaFecha] = useState('');

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  const fetchManagers = useCallback(async () => {
    try {
      const response = await api.get('/managers');
      setManagers(response.data.managers || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchManagers();
  }, [fetchDepartments, fetchManagers]);

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const openBajaModal = (employee) => {
    setBajaEmployee(employee);
    setBajaMotivo('Renuncia');
    setBajaDetalle('');
    setBajaFecha(new Date().toISOString().split('T')[0]);
    setShowBajaModal(true);
  };

  const confirmBaja = async () => {
    if (!bajaEmployee) return;
    if (!bajaMotivo) {
      alert('Selecciona un motivo de baja');
      return;
    }
    try {
      const motivoBaja = [bajaMotivo, bajaDetalle.trim()].filter(Boolean).join(' - ');
      await api.put(`/employees/${bajaEmployee.id}`, {
        estatus: 'Inactivo',
        motivoBaja,
        fechaBaja: bajaFecha
      });
      setShowBajaModal(false);
      setBajaEmployee(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error al dar de baja:', error);
      alert(error.response?.data?.error || 'Error al dar de baja al empleado');
    }
  };

  const handleDeletePermanently = async (id, name) => {
    if (!confirm(`¿Estás seguro de ELIMINAR PERMANENTEMENTE a ${name}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/employees/${id}/permanent`);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting employee permanently:', error);
    }
  };

  const handleSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/employees/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'empleados.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/employees/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_empleados.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Empleados</h1>
            <p className="text-sm text-gray-500 mt-1">
              Administra la información de todos los empleados
            </p>
          </div>
          {isRHOrAdmin && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Empleado
              </button>
              <button onClick={() => setShowImportModal(true)} className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Importar CSV
              </button>
              <button onClick={handleExportCSV} className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar CSV
              </button>
              <button onClick={handleDownloadTemplate} className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Plantilla CSV
              </button>
            </div>
          )}
        </div>

        {/* Tabla de empleados */}
        <EmployeeTable
          isRHOrAdmin={isRHOrAdmin}
          onEdit={handleEdit}
          onDelete={openBajaModal}
          onDeletePermanently={handleDeletePermanently}
          refreshTrigger={refreshTrigger}
        />

        {/* Modal de creación */}
        <EmployeeForm
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          employee={null}
          departments={departments}
          managers={managers}
          onSaved={handleSaved}
        />

        {/* Modal de edición */}
        <EmployeeForm
          show={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          departments={departments}
          managers={managers}
          onSaved={handleSaved}
        />

        {/* Modal de importación CSV */}
        <EmployeeImport
          show={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSaved={handleSaved}
        />

        {/* Modal de baja (motivo + fecha) */}
        {showBajaModal && bajaEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Dar de baja a {bajaEmployee.nombres || bajaEmployee.nombre || 'empleado'}
                </h2>
                <button
                  onClick={() => { setShowBajaModal(false); setBajaEmployee(null); }}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de baja *</label>
                  <select
                    value={bajaMotivo}
                    onChange={(e) => setBajaMotivo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Renuncia">Renuncia</option>
                    <option value="Despido">Despido</option>
                    <option value="Fin de contrato">Fin de contrato</option>
                    <option value="Abandono">Abandono</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nota / detalle (opcional)</label>
                  <textarea
                    value={bajaDetalle}
                    onChange={(e) => setBajaDetalle(e.target.value)}
                    rows={2}
                    placeholder="Detalle adicional del motivo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de baja</label>
                  <input
                    type="date"
                    value={bajaFecha}
                    onChange={(e) => setBajaFecha(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                  Al dar de baja se desactivará su cuenta y se liberará el correo institucional para poder reutilizarlo con otra persona.
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t">
                <button
                  onClick={() => { setShowBajaModal(false); setBajaEmployee(null); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmBaja}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
                >
                  Confirmar baja
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function EmpleadosPage() {
  return (
    <ProtectedRoute requiredModule="EMPLEADOS">
      <EmpleadosPageContent />
    </ProtectedRoute>
  );
}
