'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

function CrearVacantePageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  
  // Formulario
  const [formData, setFormData] = useState({
    titulo: '',
    departamento_id: '',
    jobPositionId: '',
    numeroVacantes: 1,
    motivoSolicitud: 'NUEVA_CREACION',
    personaAReemplazarNombre: '',
    personaAReemplazarCargo: '',
    noAceptanReingresos: false,
    reqComputadoraEscritorio: false,
    reqLaptop: false,
    reqTelefonoMovil: false,
    reqExtensionTelefonica: false,
    ubicacionFisica: '',
    otrosRequerimientosFisicos: '',
    tipoContratacion: 'ADMINISTRATIVO',
    consideraPromocionInterna: false,
    candidatosInternosPropuestos: [],
    observacionesPromocion: '',
    entrevistadorTecnico: '',
    entrevistadorRespaldo: '',
    conocimientosAdicionales: '',
    requerimientos_tecnicos: ['']
  });

  useEffect(() => {
    if (user && user.accessibleModules?.includes('RECLUTAMIENTO')) {
      fetchDepartments();
    }
  }, [user]);

  useEffect(() => {
    if (formData.departamento_id) {
      fetchJobPositions(formData.departamento_id);
    } else {
      setJobPositions([]);
    }
  }, [formData.departamento_id]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Si falla, usar datos por defecto
      const defaultDepartments = [
        { id: '1', nombre: 'SISTEMAS', descripcion: 'Departamento de Sistemas' },
        { id: '2', nombre: 'COMPRAS', descripcion: 'Departamento de Compras' },
        { id: '3', nombre: 'RH', descripcion: 'Recursos Humanos' },
        { id: '4', nombre: 'Administración', descripcion: 'Administración' },
        { id: '5', nombre: 'Finanzas', descripcion: 'Finanzas y Contabilidad' },
        { id: '6', nombre: 'Ventas', descripcion: 'Departamento de Ventas' },
        { id: '7', nombre: 'Marketing', descripcion: 'Marketing' },
        { id: '8', nombre: 'PRODUCCION', descripcion: 'Producción' }
      ];
      setDepartments(defaultDepartments);
    }
  };

  const fetchJobPositions = async (departmentId) => {
    try {
      const response = await api.get(`/departments/${departmentId}/job-positions`);
      setJobPositions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching job positions:', error);
      setJobPositions([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleCheckboxChange = (name) => {
    setFormData(prev => ({ 
      ...prev, 
      [name]: !prev[name] 
    }));
  };

  const handleCandidatoInternoChange = (index, field, value) => {
    const newCandidatos = [...formData.candidatosInternosPropuestos];
    if (!newCandidatos[index]) {
      newCandidatos[index] = { nombre: '', cargo: '' };
    }
    newCandidatos[index][field] = value;
    setFormData(prev => ({ ...prev, candidatosInternosPropuestos: newCandidatos }));
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

    if (!formData.jobPositionId) {
      toast.error('Debes seleccionar un puesto');
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
      setFormLoading(true);
      const payload = {
        titulo: formData.titulo.trim(),
        departamento_id: formData.departamento_id,
        jobPositionId: formData.jobPositionId,
        numeroVacantes: parseInt(formData.numeroVacantes),
        motivoSolicitud: formData.motivoSolicitud,
        personaAReemplazarNombre: formData.personaAReemplazarNombre || null,
        personaAReemplazarCargo: formData.personaAReemplazarCargo || null,
        noAceptanReingresos: formData.noAceptanReingresos,
        reqComputadoraEscritorio: formData.reqComputadoraEscritorio,
        reqLaptop: formData.reqLaptop,
        reqTelefonoMovil: formData.reqTelefonoMovil,
        reqExtensionTelefonica: formData.reqExtensionTelefonica,
        ubicacionFisica: formData.ubicacionFisica || null,
        otrosRequerimientosFisicos: formData.otrosRequerimientosFisicos || null,
        tipoContratacion: formData.tipoContratacion,
        consideraPromocionInterna: formData.consideraPromocionInterna,
        candidatosInternosPropuestos: formData.candidatosInternosPropuestos.filter(c => c?.nombre && c?.cargo),
        observacionesPromocion: formData.observacionesPromocion || null,
        entrevistadorTecnico: formData.entrevistadorTecnico || null,
        entrevistadorRespaldo: formData.entrevistadorRespaldo || null,
        conocimientosAdicionales: formData.conocimientosAdicionales || null,
        requerimientos_tecnicos: requerimientosFiltrados,
        isDirect: true // Flujo directo para RH
      };

      await api.post('/recruitment/vacancies', payload);
      
      toast.success('Vacante creada y aprobada exitosamente');
      router.push('/rh/reclutamiento');
    } catch (error) {
      console.error('Error creating vacancy:', error);
      toast.error(error.response?.data?.error || 'Error al crear la vacante');
    } finally {
      setFormLoading(false);
    }
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
              {/* Sección 1: Información de la Vacante */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sección 1: Información de la Vacante</h2>
                
                {/* Título */}
                <div className="mb-4">
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
                <div className="mb-4">
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

                {/* Puesto (JobPosition) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Puesto *
                  </label>
                  <select
                    name="jobPositionId"
                    value={formData.jobPositionId}
                    onChange={handleInputChange}
                    className="form-select w-full"
                    required
                  >
                    <option value="">Seleccionar puesto</option>
                    {jobPositions.map(position => (
                      <option key={position.id} value={position.id}>{position.nombre}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Selecciona el puesto específico a cubrir
                  </p>
                </div>

                {/* Número de vacantes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de vacantes *
                  </label>
                  <input
                    type="number"
                    name="numeroVacantes"
                    value={formData.numeroVacantes}
                    onChange={handleInputChange}
                    min="1"
                    className="form-input w-full"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Cantidad de personas que se necesitan para este puesto
                  </p>
                </div>
              </div>

              {/* Sección 2: Motivo de la Solicitud */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sección 2: Motivo de la Solicitud</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de la solicitud *
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'NUEVA_CREACION', label: 'Nueva creación' },
                      { value: 'REEMPLAZO_RENUNCIA', label: 'Reemplazo - Renuncia' },
                      { value: 'REEMPLAZO_TERMINACION_CONTRATO', label: 'Reemplazo - Terminación de contrato' },
                      { value: 'LICENCIA_TEMPORAL', label: 'Licencia temporal' },
                      { value: 'INCREMENTO_PRODUCCION', label: 'Incremento de producción' },
                      { value: 'INCREMENTO_PLANTILLA', label: 'Incremento de plantilla' },
                      { value: 'JUBILACION_RETIRO', label: 'Jubilación/retiro' },
                      { value: 'PROMOCION', label: 'Promoción' },
                      { value: 'REESTRUCTURACION', label: 'Restructuración' },
                      { value: 'LICENCIA_MATERNIDAD', label: 'Licencia de maternidad' },
                      { value: 'VACACIONES', label: 'Vacaciones' }
                    ].map((option) => (
                      <div key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          id={`motivo-${option.value}`}
                          name="motivoSolicitud"
                          value={option.value}
                          checked={formData.motivoSolicitud === option.value}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor={`motivo-${option.value}`} className="ml-2 text-sm text-gray-700">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campos condicionales para reemplazo */}
                {(formData.motivoSolicitud === 'REEMPLAZO_RENUNCIA' || formData.motivoSolicitud === 'REEMPLAZO_TERMINACION_CONTRATO') && (
                  <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la persona a reemplazar
                      </label>
                      <input
                        type="text"
                        name="personaAReemplazarNombre"
                        value={formData.personaAReemplazarNombre}
                        onChange={handleInputChange}
                        className="form-input w-full"
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cargo de la persona a reemplazar
                      </label>
                      <input
                        type="text"
                        name="personaAReemplazarCargo"
                        value={formData.personaAReemplazarCargo}
                        onChange={handleInputChange}
                        className="form-input w-full"
                        placeholder="Cargo actual"
                      />
                    </div>
                  </div>
                )}

                {/* Checkbox para no aceptar reingresos */}
                <div className="mt-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="noAceptanReingresos"
                      name="noAceptanReingresos"
                      checked={formData.noAceptanReingresos}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="noAceptanReingresos" className="ml-2 text-sm text-gray-700">
                      No se aceptan reingresos
                    </label>
                  </div>
                </div>
              </div>

              {/* Sección 3: Requerimientos Físicos */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sección 3: Requerimientos Físicos</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Herramientas requeridas
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="reqComputadoraEscritorio"
                        name="reqComputadoraEscritorio"
                        checked={formData.reqComputadoraEscritorio}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="reqComputadoraEscritorio" className="ml-2 text-sm text-gray-700">
                        Computadora de escritorio
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="reqLaptop"
                        name="reqLaptop"
                        checked={formData.reqLaptop}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="reqLaptop" className="ml-2 text-sm text-gray-700">
                        Laptop
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="reqTelefonoMovil"
                        name="reqTelefonoMovil"
                        checked={formData.reqTelefonoMovil}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="reqTelefonoMovil" className="ml-2 text-sm text-gray-700">
                        Teléfono móvil
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="reqExtensionTelefonica"
                        name="reqExtensionTelefonica"
                        checked={formData.reqExtensionTelefonica}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="reqExtensionTelefonica" className="ml-2 text-sm text-gray-700">
                        Extensión telefónica
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación física
                  </label>
                  <input
                    type="text"
                    name="ubicacionFisica"
                    value={formData.ubicacionFisica}
                    onChange={handleInputChange}
                    className="form-input w-full"
                    placeholder="Ej: Edificio A, Piso 3, Oficina 302"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Algún otro requerimiento necesario
                  </label>
                  <textarea
                    name="otrosRequerimientosFisicos"
                    value={formData.otrosRequerimientosFisicos}
                    onChange={handleInputChange}
                    rows="3"
                    className="form-textarea w-full"
                    placeholder="Describe cualquier otro requerimiento físico necesario para el puesto"
                  />
                </div>
              </div>

              {/* Sección 4: Contratación */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sección 4: Contratación</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de contratación *
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'ADMINISTRATIVO', label: 'Administrativo' },
                      { value: 'SINDICALIZADO', label: 'Sindicalizado' },
                      { value: 'TEMPORAL', label: 'Temporal' },
                      { value: 'PERMANENTE', label: 'Permanente' },
                      { value: 'BECARIO', label: 'Becario/Practicante' },
                      { value: 'ROL_TURNOS', label: 'Rol de turnos' },
                      { value: 'TIEMPO_COMPLETO', label: 'Tiempo Completo' }
                    ].map((option) => (
                      <div key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          id={`contratacion-${option.value}`}
                          name="tipoContratacion"
                          value={option.value}
                          checked={formData.tipoContratacion === option.value}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor={`contratacion-${option.value}`} className="ml-2 text-sm text-gray-700">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sección 5: Promoción Interna */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sección 5: Promoción Interna</h2>
                
                <div className="mb-4">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="consideraPromocionInterna"
                      name="consideraPromocionInterna"
                      checked={formData.consideraPromocionInterna}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="consideraPromocionInterna" className="ml-2 text-sm font-medium text-gray-700">
                      ¿Considera a alguno que pueda ser promovido?
                    </label>
                  </div>

                  {formData.consideraPromocionInterna && (
                    <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Candidato interno 1
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={formData.candidatosInternosPropuestos[0]?.nombre || ''}
                            onChange={(e) => handleCandidatoInternoChange(0, 'nombre', e.target.value)}
                            className="form-input"
                            placeholder="Nombre"
                          />
                          <input
                            type="text"
                            value={formData.candidatosInternosPropuestos[0]?.cargo || ''}
                            onChange={(e) => handleCandidatoInternoChange(0, 'cargo', e.target.value)}
                            className="form-input"
                            placeholder="Cargo actual"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Candidato interno 2
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={formData.candidatosInternosPropuestos[1]?.nombre || ''}
                            onChange={(e) => handleCandidatoInternoChange(1, 'nombre', e.target.value)}
                            className="form-input"
                            placeholder="Nombre"
                          />
                          <input
                            type="text"
                            value={formData.candidatosInternosPropuestos[1]?.cargo || ''}
                            onChange={(e) => handleCandidatoInternoChange(1, 'cargo', e.target.value)}
                            className="form-input"
                            placeholder="Cargo actual"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Observaciones sobre promoción interna
                        </label>
                        <textarea
                          name="observacionesPromocion"
                          value={formData.observacionesPromocion}
                          onChange={handleInputChange}
                          rows="3"
                          className="form-textarea w-full"
                          placeholder="Observaciones adicionales sobre los candidatos internos"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección 6: Entrevistas y Perfil Adicional */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sección 6: Entrevistas y Perfil Adicional</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entrevistador técnico (Nombre y cargo)
                  </label>
                  <input
                    type="text"
                    name="entrevistadorTecnico"
                    value={formData.entrevistadorTecnico}
                    onChange={handleInputChange}
                    className="form-input w-full"
                    placeholder="Ej: Juan Pérez - Jefe de Sistemas"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entrevistador de respaldo (Quién más podría entrevistar)
                  </label>
                  <input
                    type="text"
                    name="entrevistadorRespaldo"
                    value={formData.entrevistadorRespaldo}
                    onChange={handleInputChange}
                    className="form-input w-full"
                    placeholder="Ej: María González - Coordinadora de Desarrollo"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conocimientos adicionales (Aptitudes no establecidas en el perfil base)
                  </label>
                  <textarea
                    name="conocimientosAdicionales"
                    value={formData.conocimientosAdicionales}
                    onChange={handleInputChange}
                    rows="3"
                    className="form-textarea w-full"
                    placeholder="Describe cualquier conocimiento o aptitud adicional requerida"
                  />
                </div>
              </div>

              {/* Sección 7: Requerimientos Técnicos */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sección 7: Requerimientos Técnicos</h2>
                
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
                        Esta vacante será creada con estado <span className="font-semibold">&ldquo;Aprobada&rdquo;</span> automáticamente.
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
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={formLoading}
                >
                  {formLoading ? 'Creando...' : 'Crear Vacante Pre-Aprobada'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CrearVacantePage() {
  return (
    <ProtectedRoute requiredModule="RECLUTAMIENTO">
      <CrearVacantePageContent />
    </ProtectedRoute>
  );
}
