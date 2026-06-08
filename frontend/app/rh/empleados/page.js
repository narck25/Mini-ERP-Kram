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

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de dar de baja a este empleado?')) return;
    try {
      await api.put(`/employees/${id}`, { estatus: 'Inactivo' });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting employee:', error);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          onDelete={handleDelete}
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
