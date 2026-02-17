'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

// Componente para mostrar información del empleado
function EmployeeInfoCard({ employee }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{employee.nombre}</h2>
          <p className="text-gray-600">{employee.puesto}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          employee.estatus === 'Activo' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {employee.estatus}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">RFC:</span>
              <p className="text-sm text-gray-600">{employee.rfc}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">CURP:</span>
              <p className="text-sm text-gray-600">{employee.curp}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">NSS:</span>
              <p className="text-sm text-gray-600">{employee.nss}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Fecha de Ingreso:</span>
              <p className="text-sm text-gray-600">
                {new Date(employee.fecha_ingreso).toLocaleDateString('es-MX')}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Laboral</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Departamento:</span>
              <p className="text-sm text-gray-600">{employee.departamento?.nombre || 'No asignado'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Salario:</span>
              <p className="text-sm text-gray-600">
                {employee.salary ? `$${employee.salary.toLocaleString('es-MX')}` : 'No especificado'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Usuario Asociado:</span>
              <p className="text-sm text-gray-600">
                {employee.user ? employee.user.email : 'No tiene usuario'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Fecha de Creación:</span>
              <p className="text-sm text-gray-600">
                {new Date(employee.createdAt).toLocaleDateString('es-MX')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para documentos
function DocumentsTab({ employeeId, documents, onDocumentUpload, onDocumentDelete }) {
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState(null);
  const [allowedTypes, setAllowedTypes] = useState([]);

  useEffect(() => {
    fetchAllowedTypes();
  }, []);

  const fetchAllowedTypes = async () => {
    try {
      const response = await api.get('/employee-documents/allowed-types');
      setAllowedTypes(response.data.allowedTypes);
    } catch (error) {
      console.error('Error fetching allowed types:', error);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !documentType) {
      toast.error('Por favor selecciona un archivo y un tipo de documento');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);
    formData.append('tipo_documento', documentType);

    setUploading(true);
    try {
      await api.post(`/employee/${employeeId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Documento subido exitosamente');
      setFile(null);
      setDocumentType('');
      document.getElementById('fileInput').value = '';
      onDocumentUpload();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.error || 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return;
    }

    try {
      await api.delete(`/employee-documents/${documentId}`);
      toast.success('Documento eliminado exitosamente');
      onDocumentDelete();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(error.response?.data?.error || 'Error al eliminar documento');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word')) return '📝';
    return '📎';
  };

  return (
    <div className="space-y-6">
      {/* Formulario de subida */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subir Nuevo Documento</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Documento
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un tipo</option>
              {allowedTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Archivo (PDF, JPG, PNG, DOC)
            </label>
            <input
              id="fileInput"
              type="file"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            {file && (
              <p className="mt-1 text-sm text-gray-600">
                Archivo seleccionado: {file.name} ({formatFileSize(file.size)})
              </p>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || !file || !documentType}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Subiendo...' : 'Subir Documento'}
          </button>
        </div>
      </div>

      {/* Lista de documentos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentos del Empleado</h3>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay documentos</h3>
            <p className="text-gray-600">Sube el primer documento usando el formulario de arriba.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{getFileIcon(doc.mime_type)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{doc.nombre_archivo}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{doc.tipo_documento}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.size_bytes)}</span>
                      <span>•</span>
                      <span>{new Date(doc.uploaded_at).toLocaleDateString('es-MX')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={`/api${doc.url_archivo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium"
                  >
                    Ver
                  </a>
                  <a
                    href={`/api/employee-documents/${doc.id}/download`}
                    className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-md text-sm font-medium"
                  >
                    Descargar
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (user && id) {
      fetchEmployee();
      fetchDocuments();
    }
  }, [user, id]);

  const fetchEmployee = async () => {
    try {
      const response = await api.get(`/employees/${id}`);
      setEmployee(response.data.employee);
    } catch (error) {
      console.error('Error fetching employee:', error);
      toast.error('Error al cargar información del empleado');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await api.get(`/employee/${id}/documents`);
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleDocumentUpload = () => {
    fetchDocuments();
  };

  const handleDocumentDelete = () => {
    fetchDocuments();
  };

  if (!user || !['RH', 'ADMIN'].includes(user.role)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">Solo el personal de RH puede acceder a esta sección.</p>
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
            <p className="mt-2 text-gray-600">Cargando información del empleado...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Empleado no encontrado</h2>
            <p className="text-red-600 mt-1">El empleado que buscas no existe o no tienes permisos para verlo.</p>
            <button
              onClick={() => router.push('/rh/empleados')}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              Volver a la lista de empleados
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
              <h1 className="text-2xl font-bold text-gray-900">Perfil 360° del Empleado</h1>
              <div className="flex items-center space-x-4 mt-2">
                <Link
                  href="/rh/empleados"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Volver a la lista
                </Link>
                <button
                  onClick={() => router.push(`/rh/empleados/${id}/edit`)}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium text-sm"
                >
                  Editar Empleado
                </button>
              </div>
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
                onClick={() => setActiveTab('documents')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'documents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Documentos ({documents.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === 'info' && (
          <EmployeeInfoCard employee={employee} />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab
            employeeId={id}
            documents={documents}
            onDocumentUpload={handleDocumentUpload}
            onDocumentDelete={handleDocumentDelete}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
