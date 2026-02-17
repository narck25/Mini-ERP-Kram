'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function CrearVacantePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Formulario
  const [formData, setFormData] = useState({
    titulo: '',
    departamento_id: '',
    requerimientos_tecnicos: [''] // Array para múltiples requerimientos
  });

  useEffect(() => {
    if (user && ['RH', 'ADMIN'].includes(user.role)) {
      fetchDepartments();
    }
  }, [user]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Si falla, usar datos por defecto
      const defaultDepartments = [
        { id: '1', nombre: 'Sistemas', descripcion: 'Departamento de Sistemas' },
        { id: '2', nombre: 'Compras', descripcion: 'Departamento de Compras' },
        { id: '3', nombre: 'RH', descripcion: 'Recursos Humanos' },
        { id: '4', nombre: 'Administración', descripcion: 'Administración' },
        { id: '5', nombre: 'Finanzas', descripcion: 'Finanzas y Contabilidad' },
        { id: '6', nombre: 'Ventas', descripcion: 'Departamento de Ventas' },
        { id: '7', nombre: 'Marketing', descripcion: 'Marketing' },
        { id: '8', nombre: 'Producción', descripcion: 'Producción' }
      ];
      setDepartments(defaultDepartments);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRequirementChange = (index, value) => {
    const newRequirements = [...formData.requerimientos_tecnicos];
    newRequirements[index] = value;
    setFormData(prev => ({ ...prev, requerimientos_tecnicos: newRequirements }));
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requerimientos_tecnicos: [...prev.requerimientos_tecnicos, '']
    }));
  };

  const removeRequirement = (index) => {
    const newRequirements = formData.requerimientos_tecnicos.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, requerimientos_tecnicos: newRequirements }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos requeridos
    if (!formData.titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }
    
    if (!formData.departamento_id) {
      toast.error('Debes seleccionar un departamento');
      return;
    }

    // Filtrar requerimientos vacíos
    const requerimientosFiltrados = formData.requerimientos_tecnicos
      .filter(req => req.trim() !== '')
      .map(req => req.trim());

    if (requerimientosFiltrados.length === 0) {
      toast.error('Agrega al menos un requerimiento técnico');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        titulo: formData.titulo.trim(),
        departamento_id: formData.departamento_id,
        requerimientos_tecnicos: requerimientosFiltrados
      };

      await api.post('/recruitment/vacancies', payload);
      
      toast.success('Vacante creada y aprobada exitosamente');
      router.push('/rh/reclutamiento');
    } catch (error) {
      console.error('Error creating vacancy:', error);
      toast.error(error.response?.data?.error || 'Error al crear la vacante');
    } finally {
      setLoading(false);
    }
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

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Crear Vacante Pre-Aprobada</h1>
              <p className="text-gray-600">Crea una vacante que será automáticamente aprobada para búsqueda inmediata</p>
            </div>
            <button
              onClick={() => router.push('/rh/reclutamiento')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título de la vacante *
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  placeholder="Ej: Desarrollador Full Stack Senior"
                  className="form-input w-full"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Describe claramente el puesto que necesitas cubrir
                </p>
              </div>

              {/* Departamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento *
                </label>
                <select
                  name="departamento_id"
                  value={formData.departamento_id}
                  onChange={handleInputChange}
                  className="form-select w-full"
                  required
                >
                  <option value="">Seleccionar departamento</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.nombre}</option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Selecciona el departamento donde se ubicará el puesto
                </p>
              </div>

              {/* Requerimientos técnicos */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Requerimientos técnicos *
                  </label>
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Agregar requerimiento
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.requerimientos_tecnicos.map((requirement, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={requirement}
                        onChange={(e) => handleRequirementChange(index, e.target.value)}
                        placeholder={`Requerimiento ${index + 1} (Ej: 3+ años experiencia en React)`}
                        className="form-input flex-1"
                      />
                      {formData.requerimientos_tecnicos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <p className="mt-2 text-sm text-gray-500">
                  Describe los conocimientos y habilidades técnicas necesarias para el puesto
                </p>
              </div>

              {/* Nota sobre aprobación automática */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Vacante Pre-Aprobada</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Esta vacante será creada con estado <span className="font-semibold">"Aprobada"</span> automáticamente.
                        El jefe de área podrá definir el perfil técnico detallado y actividades antes de comenzar la búsqueda.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.push('/rh/reclutamiento')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Creando...' : 'Crear Vacante Pre-Aprobada'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}