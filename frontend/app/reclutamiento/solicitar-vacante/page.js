'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Enums para los select
const MOTIVO_VACANTE_OPTIONS = [
  { value: 'NUEVA_CREACION', label: 'Nueva Creación' },
  { value: 'REEMPLAZO_DEFINITIVO', label: 'Reemplazo Definitivo' },
  { value: 'REEMPLAZO_TEMPORAL', label: 'Reemplazo Temporal' },
  { value: 'INCREMENTO_PLANTILLA', label: 'Incremento de Plantilla' },
  { value: 'INCREMENTO_PRODUCCION', label: 'Incremento de Producción' },
  { value: 'RENUNCIA', label: 'Renuncia' },
  { value: 'TERMINACION_CONTRATO', label: 'Terminación de Contrato' },
  { value: 'LICENCIA', label: 'Licencia' },
  { value: 'INCAPACIDAD', label: 'Incapacidad' },
  { value: 'JUBILACION', label: 'Jubilación' },
  { value: 'PROMOCION', label: 'Promoción' },
  { value: 'REESTRUCTURACION', label: 'Reestructuración' },
  { value: 'MATERNIDAD', label: 'Maternidad' },
  { value: 'VACACIONES', label: 'Vacaciones' }
];

const TIPO_CONTRATACION_OPTIONS = [
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
  { value: 'TEMPORAL', label: 'Temporal' },
  { value: 'SINDICALIZADO', label: 'Sindicalizado' },
  { value: 'TIEMPO_COMPLETO', label: 'Tiempo Completo' },
  { value: 'PERMANENTE', label: 'Permanente' },
  { value: 'BECARIO', label: 'Becario' },
  { value: 'ROL_TURNOS', label: 'Rol por Turnos' }
];

export default function SolicitarVacantePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availablePositions, setAvailablePositions] = useState([]);
  const [managers, setManagers] = useState([]);
  
  // Formulario - Página 1
  const [formData, setFormData] = useState({
    // Información de la Vacante
    titulo: '',
    departamento_id: '',
    jobPositionId: '',
    reportaA: '',
    numeroVacantes: 1,
    motivoSolicitud: 'NUEVA_CREACION',
    personaAReemplazarNombre: '',
    personaAReemplazarCargo: '',
    noAceptanReingresos: false,
    
    // Requerimientos de Sistemas (Infraestructura)
    reqComputadoraEscritorio: false,
    reqLaptop: false,
    reqTelefonoMovil: false,
    reqExtensionTelefonica: false,
    ubicacionFisica: '',
    otrosRequerimientosFisicos: '',
    
    // Modalidad y Promoción Interna
    tipoContratacion: 'ADMINISTRATIVO',
    consideraPromocionInterna: false,
    candidatosInternosPropuestos: [],
    observacionesPromocion: '',
    
    // Proceso de Entrevista (Página 2)
    entrevistadorTecnico: '',
    entrevistadorRespaldo: '',
    conocimientosAdicionales: '',
    
    // Requerimientos técnicos
    requerimientos_tecnicos: ['']
  });

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) {
      fetchEmployees();
      fetchDepartments();
      fetchManagers();
    }
  }, [user]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Error al cargar la lista de empleados');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/vacancies/form-data');
      console.log('Departments data from API:', response.data);
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Error al cargar la lista de departamentos y puestos');
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await api.get('/managers');
      console.log('Managers data from API:', response.data);
      setManagers(response.data.managers || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast.error('Error al cargar la lista de jefes directos');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Si se cambia el departamento, actualizar los puestos disponibles y resetear el puesto seleccionado
    if (name === 'departamento_id') {
      console.log('Departamento seleccionado:', value);
      const selectedDepartment = departments.find(dept => dept.id === value);
      console.log('Departamento encontrado:', selectedDepartment);
      // El backend ya filtra por estado 'Activo', así que tomamos todos los puestos que vienen
      const positions = selectedDepartment?.jobPositions || [];
      console.log('Puestos encontrados:', positions);
      setAvailablePositions(positions);
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        jobPositionId: '' // Resetear el puesto cuando se cambia de departamento
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePage1 = () => {
    if (!formData.titulo.trim()) {
      toast.error('El título de la vacante es requerido');
      return false;
    }
    if (!formData.departamento_id.trim()) {
      toast.error('El departamento es requerido');
      return false;
    }
    if (!formData.jobPositionId.trim()) {
      toast.error('El puesto es requerido');
      return false;
    }
    // Campo reportaA deshabilitado para la demo - no es requerido
    // if (!formData.reportaA.trim()) {
    //   toast.error('El campo "Reporta a" es requerido');
    //   return false;
    // }
    if (formData.numeroVacantes < 1) {
      toast.error('El número de vacantes debe ser al menos 1');
      return false;
    }
    return true;
  };

  const validatePage2 = () => {
    if (!formData.entrevistadorTecnico.trim()) {
      toast.error('El entrevistador técnico es requerido');
      return false;
    }
    return true;
  };

  const handleNextPage = () => {
    if (validatePage1()) {
      setCurrentPage(2);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePage2()) {
      return;
    }

    try {
      setLoading(true);
      
      // Obtener el empleado actual (solicitante)
      const employeeResponse = await api.get('/employees/me');
      const solicitanteId = employeeResponse.data.employee?.id;
      
      if (!solicitanteId) {
        toast.error('No se pudo identificar al solicitante');
        return;
      }

      // Extraer solo el nombre del manager del displayName (solo para reportaA si tiene valor)
      const extractManagerName = (displayName) => {
        if (!displayName) return '';
        // El displayName tiene formato: "Nombre - Puesto (NivelJerarquico)"
        // Extraemos solo el nombre (antes del primer " - ")
        const parts = displayName.split(' - ');
        return parts[0] || displayName;
      };

      const payload = {
        ...formData,
        // Para reportaA (campo deshabilitado) extraer nombre si tiene valor
        reportaA: extractManagerName(formData.reportaA),
        // Para entrevistadorTecnico (ahora campo de texto) usar valor directamente
        entrevistadorTecnico: formData.entrevistadorTecnico || '',
        solicitanteId,
        numeroVacantes: parseInt(formData.numeroVacantes),
        jobPositionId: formData.jobPositionId || null,
        departamento_id: formData.departamento_id || null,
        personaAReemplazarNombre: formData.personaAReemplazarNombre || null,
        personaAReemplazarCargo: formData.personaAReemplazarCargo || null,
        noAceptanReingresos: Boolean(formData.noAceptanReingresos),
        reqComputadoraEscritorio: Boolean(formData.reqComputadoraEscritorio),
        reqLaptop: Boolean(formData.reqLaptop),
        reqTelefonoMovil: Boolean(formData.reqTelefonoMovil),
        reqExtensionTelefonica: Boolean(formData.reqExtensionTelefonica),
        consideraPromocionInterna: Boolean(formData.consideraPromocionInterna),
        candidatosInternosPropuestos: formData.candidatosInternosPropuestos || [],
        observacionesPromocion: formData.observacionesPromocion || null,
        conocimientosAdicionales: formData.conocimientosAdicionales || null,
        requerimientos_tecnicos: formData.requerimientos_tecnicos || ['']
      };

      console.log('📤 Enviando payload de vacante:', payload);

      await api.post('/vacancies', payload);
      
      toast.success('Solicitud de vacante enviada exitosamente');
      router.push('/reclutamiento/mis-solicitudes');
    } catch (error) {
      console.error('Error creating vacancy:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.error || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">Debes iniciar sesión para acceder a esta sección.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Solicitud de Vacante</h1>
              <p className="text-gray-600">Formulario digitalizado para solicitar una nueva vacante</p>
            </div>
            <button
              onClick={() => router.push('/reclutamiento/mis-solicitudes')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              ← Volver a Mis Solicitudes
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentPage >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <div className={`ml-2 text-sm font-medium ${currentPage >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>
                Información de la Vacante
              </div>
            </div>
            <div className="w-16 h-0.5 mx-4 bg-gray-300"></div>
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentPage >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <div className={`ml-2 text-sm font-medium ${currentPage >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>
                Proceso de Entrevista
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            {currentPage === 1 ? (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Información de la Vacante</h2>
                
                {/* Título de la Vacante */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título de la Vacante *
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
                    <option value="">Selecciona un departamento</option>
                    {departments.map(department => (
                      <option key={department.id} value={department.id}>
                        {department.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Puesto (JobPosition) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Puesto *
                  </label>
                  <select
                    name="jobPositionId"
                    value={formData.jobPositionId}
                    onChange={handleInputChange}
                    className="form-select w-full"
                    required
                    disabled={!formData.departamento_id || availablePositions.length === 0}
                  >
                    <option value="">
                      {!formData.departamento_id 
                        ? 'Selecciona primero un departamento' 
                        : availablePositions.length === 0 
                          ? 'No hay puestos disponibles en este departamento' 
                          : 'Selecciona un puesto'}
                    </option>
                    {availablePositions.map(position => (
                      <option key={position.id} value={position.id}>
                        {position.nombre} {position.nivelJerarquico ? `(${position.nivelJerarquico})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.departamento_id && availablePositions.length > 0 
                      ? `${availablePositions.length} puesto(s) disponible(s)` 
                      : 'Selecciona un departamento para ver los puestos disponibles'}
                  </p>
                </div>

                {/* Reporta a */}
                <div className="hidden">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reporta a *
                  </label>
                  <select
                    name="reportaA"
                    value={formData.reportaA}
                    onChange={handleInputChange}
                    className="form-select w-full"
                    required
                    disabled
                  >
                    <option value="">Selecciona un jefe directo</option>
                    {managers.map(manager => (
                      <option key={manager.id} value={manager.displayName}>
                        {manager.displayName}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Selecciona el jefe directo al que reportará el nuevo empleado
                  </p>
                  <p className="mt-1 text-sm text-gray-500 italic">
                    Campo deshabilitado para la demo
                  </p>
                </div>

                {/* Número de Vacantes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Vacantes *
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
                </div>

                {/* Motivo de Solicitud */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de la Solicitud *
                  </label>
                  <select
                    value={formData.motivoSolicitud}
                    onChange={(e) => handleSelectChange('motivoSolicitud', e.target.value)}
                    className="form-select w-full"
                    required
                  >
                    {MOTIVO_VACANTE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Persona a Reemplazar (solo si es reemplazo) */}
                {['REEMPLAZO_DEFINITIVO', 'REEMPLAZO_TEMPORAL', 'RENUNCIA', 'TERMINACION_CONTRATO', 'LICENCIA', 'INCAPACIDAD', 'JUBILACION', 'PROMOCION', 'MATERNIDAD', 'VACACIONES'].includes(formData.motivoSolicitud) && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la Persona a Reemplazar
                      </label>
                      <input
                        type="text"
                        name="personaAReemplazarNombre"
                        value={formData.personaAReemplazarNombre}
                        onChange={handleInputChange}
                        placeholder="Nombre de la persona a reemplazar"
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cargo de la Persona a Reemplazar
                      </label>
                      <input
                        type="text"
                        name="personaAReemplazarCargo"
                        value={formData.personaAReemplazarCargo}
                        onChange={handleInputChange}
                        placeholder="Cargo de la persona a reemplazar"
                        className="form-input w-full"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="noAceptanReingresos"
                        name="noAceptanReingresos"
                        checked={formData.noAceptanReingresos}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor="noAceptanReingresos" className="ml-2 text-sm text-gray-700">
                        No aceptan reingresos
                      </label>
                    </div>
                  </div>
                )}

                {/* Requerimientos de Sistemas */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Requerimientos de Sistemas (Infraestructura)</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="reqLaptop"
                        name="reqLaptop"
                        checked={formData.reqLaptop}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor="reqLaptop" className="ml-2 text-sm text-gray-700">
                        Requiere Laptop
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="reqComputadoraEscritorio"
                        name="reqComputadoraEscritorio"
                        checked={formData.reqComputadoraEscritorio}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor="reqComputadoraEscritorio" className="ml-2 text-sm text-gray-700">
                        Requiere PC de Escritorio
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="reqTelefonoMovil"
                        name="reqTelefonoMovil"
                        checked={formData.reqTelefonoMovil}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor="reqTelefonoMovil" className="ml-2 text-sm text-gray-700">
                        Requiere Móvil
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="reqExtensionTelefonica"
                        name="reqExtensionTelefonica"
                        checked={formData.reqExtensionTelefonica}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor="reqExtensionTelefonica" className="ml-2 text-sm text-gray-700">
                        Requiere Extensión Telefónica
                      </label>
                    </div>
                  </div>

                  {/* Ubicación Física */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación Física (Opcional)
                    </label>
                    <input
                      type="text"
                      name="ubicacionFisica"
                      value={formData.ubicacionFisica}
                      onChange={handleInputChange}
                      placeholder="Ej: Edificio A, Piso 3, Cubículo 305"
                      className="form-input w-full"
                    />
                  </div>

                  {/* Otros Requerimientos Físicos */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Otros Requerimientos Físicos (Opcional)
                    </label>
                    <textarea
                      name="otrosRequerimientosFisicos"
                      value={formData.otrosRequerimientosFisicos}
                      onChange={handleInputChange}
                      placeholder="Describe cualquier otro requerimiento de infraestructura necesario"
                      rows="3"
                      className="form-textarea w-full"
                    />
                  </div>
                </div>

                {/* Modalidad y Promoción Interna */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Modalidad y Promoción Interna</h3>
                  
                  {/* Tipo de Contratación */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Contratación *
                    </label>
                    <select
                      value={formData.tipoContratacion}
                      onChange={(e) => handleSelectChange('tipoContratacion', e.target.value)}
                      className="form-select w-full"
                      required
                    >
                      {TIPO_CONTRATACION_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Considera Promoción Interna */}
                  <div className="mb-4 flex items-center">
                    <input
                      type="checkbox"
                      id="consideraPromocionInterna"
                      name="consideraPromocionInterna"
                      checked={formData.consideraPromocionInterna}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor="consideraPromocionInterna" className="ml-2 text-sm text-gray-700">
                      Considera promoción interna
                    </label>
                  </div>

                  {/* Candidatos Internos Propuestos */}
                  {formData.consideraPromocionInterna && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Candidatos Internos Propuestos (separados por comas)
                      </label>
                      <input
                        type="text"
                        name="candidatosInternosPropuestos"
                        value={formData.candidatosInternosPropuestos.join(', ')}
                        onChange={(e) => {
                          const value = e.target.value;
                          const candidates = value.split(',').map(c => c.trim()).filter(c => c);
                          setFormData(prev => ({
                            ...prev,
                            candidatosInternosPropuestos: candidates
                          }));
                        }}
                        placeholder="Ej: Juan Pérez, María López, Carlos García"
                        className="form-input w-full"
                      />
                    </div>
                  )}

                  {/* Observaciones de Promoción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones de Promoción (Opcional)
                    </label>
                    <textarea
                      name="observacionesPromocion"
                      value={formData.observacionesPromocion}
                      onChange={handleInputChange}
                      placeholder="Observaciones adicionales sobre la promoción interna"
                      rows="3"
                      className="form-textarea w-full"
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end pt-6 border-t">
                  <button
                    type="button"
                    onClick={handleNextPage}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Proceso de Entrevista</h2>
                
                {/* Entrevistador Técnico */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entrevistador Técnico *
                  </label>
                  <input
                    type="text"
                    name="entrevistadorTecnico"
                    value={formData.entrevistadorTecnico}
                    onChange={handleInputChange}
                    placeholder="Escribe el nombre del entrevistador técnico"
                    className="form-input w-full"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Persona que realizará la entrevista técnica (campo de texto para la demo)
                  </p>
                </div>

                {/* Entrevistador de Respaldo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entrevistador de Respaldo (Opcional)
                  </label>
                  <input
                    type="text"
                    name="entrevistadorRespaldo"
                    value={formData.entrevistadorRespaldo}
                    onChange={handleInputChange}
                    placeholder="Nombre del entrevistador de respaldo"
                    className="form-input w-full"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Persona que apoyará en caso de que el entrevistador principal no esté disponible
                  </p>
                </div>

                {/* Conocimientos Adicionales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conocimientos Adicionales (Opcional)
                  </label>
                  <textarea
                    name="conocimientosAdicionales"
                    value={formData.conocimientosAdicionales}
                    onChange={handleInputChange}
                    placeholder="Conocimientos adicionales requeridos que no están en los requerimientos principales"
                    rows="4"
                    className="form-textarea w-full"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Especifica conocimientos adicionales que serían valorados pero no son obligatorios
                  </p>
                </div>

                {/* Nota sobre el proceso */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Proceso de Aprobación</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          Esta solicitud será enviada para aprobación. Primero será revisada por el Director de Área 
                          y luego por el Director de RH. Recibirás una notificación cuando la solicitud sea aprobada.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-between pt-6 border-t">
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                  >
                    ← Anterior
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => router.push('/reclutamiento/mis-solicitudes')}
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
                      {loading ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
