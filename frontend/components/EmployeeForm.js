'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

const INITIAL_FORM = {
  nombres: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  rfc: '',
  curp: '',
  nss: '',
  fecha_ingreso: '',
  estatus: 'Activo',
  puestoId: '',
  departamento_id: '',
  salary: '',
  sd: '',
  sdi: '',
  nivelJerarquico: 'OPERATIVO',
  reportaAId: '',
  userId: '',
  // Nuevos campos
  correoElectronico: '',
  correoEmpresa: '',
  telefonoMovil: '',
  telefonoCasa: '',
  direccionCompleta: '',
  estado: '',
  cpFiscal: '',
  fechaNacimiento: '',
  lugarNacimiento: '',
  estadoCivil: '',
  nacionalidad: '',
  sexo: '',
  nivelAcademico: '',
  clabe: '',
  numeroCuenta: '',
  banco: '',
  tallaCamisa: '',
  tallaPlayera: '',
  tallaPantalon: '',
  tallaZapatos: '',
  nombreConyuge: '',
  beneficiario1: '',
  fechaNacBeneficiario1: '',
  porcentaje1: '',
  beneficiario2: '',
  fechaNacBeneficiario2: '',
  porcentaje2: '',
  esPadre: false,
  numeroHijos: 0,
  contrato: '',
  horario: '',
  sucursal: '',
  area: '',
  region: ''
};

export default function EmployeeForm({ show, onClose, employee, departments, managers, onSaved }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [availablePositions, setAvailablePositions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('basicos');

  // Calcular SD y SDI automáticamente
  const calcularSD_SDI = (salarioMensual, fechaIngreso) => {
    if (!salarioMensual || !fechaIngreso) return { sd: '', sdi: '' };
    const salario = parseFloat(salarioMensual);
    if (isNaN(salario) || salario <= 0) return { sd: '', sdi: '' };
    
    const sd = (salario / 30).toFixed(2);
    
    // Calcular antigüedad en años
    const fechaIngresoDate = new Date(fechaIngreso);
    const hoy = new Date();
    let antiguedad = hoy.getFullYear() - fechaIngresoDate.getFullYear();
    const mesDiff = hoy.getMonth() - fechaIngresoDate.getMonth();
    if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < fechaIngresoDate.getDate())) {
      antiguedad--;
    }
    antiguedad = Math.max(1, Math.min(30, antiguedad || 1));
    
    // Factores de integración según LFT
    const factores = {
      1: 1.0493, 2: 1.0507, 3: 1.0521, 4: 1.0534, 5: 1.0548,
      6: 1.0562, 7: 1.0562, 8: 1.0562, 9: 1.0562, 10: 1.0562,
      11: 1.0575, 12: 1.0575, 13: 1.0575, 14: 1.0575, 15: 1.0575,
      16: 1.0589, 17: 1.0589, 18: 1.0589, 19: 1.0589, 20: 1.0589,
      21: 1.0603, 22: 1.0603, 23: 1.0603, 24: 1.0603, 25: 1.0603,
      26: 1.0616, 27: 1.0616, 28: 1.0616, 29: 1.0616, 30: 1.0616
    };
    const factor = factores[antiguedad] || 1.0493;
    const sdi = (sd * factor).toFixed(2);
    
    return { sd, sdi };
  };

  // Efecto para recalcular SD/SDI cuando cambia salary o fecha_ingreso
  useEffect(() => {
    if (formData.salary && formData.fecha_ingreso) {
      const { sd, sdi } = calcularSD_SDI(formData.salary, formData.fecha_ingreso);
      setFormData(prev => ({ ...prev, sd, sdi }));
    }
  }, [formData.salary, formData.fecha_ingreso]);
  const isEditing = !!employee;

  useEffect(() => {
    if (employee) {
      setFormData({
        nombres: employee.nombres || employee.nombre || '',
        apellidoPaterno: employee.apellidoPaterno || '',
        apellidoMaterno: employee.apellidoMaterno || '',
        rfc: employee.rfc || '',
        curp: employee.curp || '',
        nss: employee.nss || '',
        fecha_ingreso: (employee.fecha_ingreso || employee.fechaAlta || '').split('T')[0],
        estatus: employee.estatus || 'Activo',
        puestoId: employee.puestoId || '',
        departamento_id: employee.departamento_id || '',
        salary: employee.salary || employee.salarioMensual || '',
        sd: employee.sd || '',
        sdi: employee.sdi || '',
        nivelJerarquico: employee.nivelJerarquico || 'OPERATIVO',
        reportaAId: employee.reportaAId || '',
        userId: employee.userId || '',
        correoElectronico: employee.correoElectronico || '',
        correoEmpresa: employee.correoEmpresa || '',
        telefonoMovil: employee.telefonoMovil || '',
        telefonoCasa: employee.telefonoCasa || '',
        direccionCompleta: employee.direccionCompleta || '',
        estado: employee.estado || '',
        cpFiscal: employee.cpFiscal || '',
        fechaNacimiento: employee.fechaNacimiento ? employee.fechaNacimiento.split('T')[0] : '',
        lugarNacimiento: employee.lugarNacimiento || '',
        estadoCivil: employee.estadoCivil || '',
        nacionalidad: employee.nacionalidad || '',
        sexo: employee.sexo || '',
        nivelAcademico: employee.nivelAcademico || '',
        clabe: employee.clabe || '',
        numeroCuenta: employee.numeroCuenta || '',
        banco: employee.banco || '',
        tallaCamisa: employee.tallaCamisa || '',
        tallaPlayera: employee.tallaPlayera || '',
        tallaPantalon: employee.tallaPantalon || '',
        tallaZapatos: employee.tallaZapatos || '',
        nombreConyuge: employee.nombreConyuge || '',
        beneficiario1: employee.beneficiario1 || '',
        fechaNacBeneficiario1: employee.fechaNacBeneficiario1 ? employee.fechaNacBeneficiario1.split('T')[0] : '',
        porcentaje1: employee.porcentaje1 || '',
        beneficiario2: employee.beneficiario2 || '',
        fechaNacBeneficiario2: employee.fechaNacBeneficiario2 ? employee.fechaNacBeneficiario2.split('T')[0] : '',
        porcentaje2: employee.porcentaje2 || '',
        esPadre: employee.esPadre || false,
        numeroHijos: employee.numeroHijos || 0,
        contrato: employee.contrato || '',
        horario: employee.horario || '',
        sucursal: employee.sucursal || '',
        area: employee.area || '',
        region: employee.region || ''
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [employee]);

  useEffect(() => {
    if (formData.departamento_id) {
      fetchPositionsByDepartment(formData.departamento_id);
    } else {
      setAvailablePositions([]);
    }
  }, [formData.departamento_id]);

  const fetchPositionsByDepartment = async (departmentId) => {
    try {
      const response = await api.get(`/departments/${departmentId}/job-positions`);
      setAvailablePositions(response.data.data || []);
    } catch (error) {
      setAvailablePositions([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanedData = {
        ...formData,
        apellidoPaterno: formData.apellidoPaterno || null,
        apellidoMaterno: formData.apellidoMaterno || null,
        salary: formData.salary || null,
        sd: formData.sd || null,
        sdi: formData.sdi || null,
        reportaAId: formData.reportaAId || null,
        userId: formData.userId || null,
        porcentaje1: formData.porcentaje1 || null,
        porcentaje2: formData.porcentaje2 || null,
        numeroHijos: formData.numeroHijos || 0
      };

      if (isEditing) {
        await api.put(`/employees/${employee.id}`, cleanedData);
      } else {
        await api.post('/employees', cleanedData);
      }
      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  const sections = [
    { id: 'basicos', label: 'Datos Básicos' },
    { id: 'personales', label: 'Datos Personales' },
    { id: 'contacto', label: 'Contacto y Dirección' },
    { id: 'laborales', label: 'Datos Laborales' },
    { id: 'financieros', label: 'Datos Financieros' },
    { id: 'uniformes', label: 'Uniformes' },
    { id: 'beneficiarios', label: 'Beneficiarios' }
  ];

  const renderField = (label, name, type = 'text', options = null, required = false, readOnly = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      {options ? (
        <select
          value={formData[name]}
          onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
          required={required}
          disabled={readOnly}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Seleccionar...</option>
          {options.map(opt => (
            <option key={opt.value || opt.id} value={opt.value || opt.id}>{opt.label || opt.nombre}</option>
          ))}
        </select>
      ) : type === 'checkbox' ? (
        <input
          type="checkbox"
          checked={formData[name]}
          onChange={(e) => setFormData({ ...formData, [name]: e.target.checked })}
          disabled={readOnly}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      ) : (
        <input
          type={type}
          value={formData[name]}
          onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
          required={required}
          readOnly={readOnly}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
            readOnly ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'border-gray-300'
          }`}
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navegación de secciones */}
          <div className="flex flex-wrap gap-2 mb-6 border-b pb-3">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeSection === s.id ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Sección: Datos Básicos */}
            {activeSection === 'basicos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {renderField('Nombres *', 'nombres', 'text', null, true)}
                {renderField('Apellido Paterno', 'apellidoPaterno')}
                {renderField('Apellido Materno', 'apellidoMaterno')}
                {renderField('RFC *', 'rfc', 'text', null, true)}
                {renderField('CURP *', 'curp', 'text', null, true)}
                {renderField('NSS *', 'nss', 'text', null, true)}
                {renderField('Fecha de Ingreso *', 'fecha_ingreso', 'date', null, true)}
                {renderField('Estatus', 'estatus', 'select', [
                  { value: 'Activo', label: 'Activo' },
                  { value: 'Inactivo', label: 'Inactivo' }
                ])}
                {renderField('Departamento *', 'departamento_id', 'select', departments, true)}
                {renderField('Puesto *', 'puestoId', 'select', availablePositions, true)}
                {renderField('Nivel Jerárquico', 'nivelJerarquico', 'select', [
                  { value: 'PRESIDENTE', label: 'Presidente' },
                  { value: 'DIRECTOR', label: 'Director' },
                  { value: 'GERENTE', label: 'Gerente' },
                  { value: 'JEFE', label: 'Jefe' },
                  { value: 'COORDINADOR', label: 'Coordinador' },
                  { value: 'ANALISTA', label: 'Analista' },
                  { value: 'SUPERVISOR', label: 'Supervisor' },
                  { value: 'AUX_ADMINISTRATIVO', label: 'Aux. Administrativo' },
                  { value: 'OPERATIVO', label: 'Operativo' }
                ])}
                {renderField('Jefe Directo', 'reportaAId', 'select', managers.map(m => ({ value: m.id, label: m.displayName })))}
              </div>
            )}

            {/* Sección: Datos Personales */}
            {activeSection === 'personales' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {renderField('Fecha de Nacimiento', 'fechaNacimiento', 'date')}
                {renderField('Lugar de Nacimiento', 'lugarNacimiento')}
                {renderField('Estado Civil', 'estadoCivil', 'select', [
                  { value: 'Soltero', label: 'Soltero' },
                  { value: 'Casado', label: 'Casado' },
                  { value: 'Divorciado', label: 'Divorciado' },
                  { value: 'Viudo', label: 'Viudo' },
                  { value: 'Unión Libre', label: 'Unión Libre' }
                ])}
                {renderField('Nacionalidad', 'nacionalidad')}
                {renderField('Sexo', 'sexo', 'select', [
                  { value: 'Masculino', label: 'Masculino' },
                  { value: 'Femenino', label: 'Femenino' }
                ])}
                {renderField('Nivel Académico', 'nivelAcademico', 'select', [
                  { value: 'Primaria', label: 'Primaria' },
                  { value: 'Secundaria', label: 'Secundaria' },
                  { value: 'Preparatoria', label: 'Preparatoria' },
                  { value: 'Técnico', label: 'Técnico' },
                  { value: 'Licenciatura', label: 'Licenciatura' },
                  { value: 'Maestría', label: 'Maestría' },
                  { value: 'Doctorado', label: 'Doctorado' }
                ])}
                {renderField('Nombre del Cónyuge', 'nombreConyuge')}
                <div className="flex items-center gap-4">
                  <div>{renderField('¿Es Padre/Madre?', 'esPadre', 'checkbox')}</div>
                  {renderField('Número de Hijos', 'numeroHijos', 'number')}
                </div>
              </div>
            )}

            {/* Sección: Contacto y Dirección */}
            {activeSection === 'contacto' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {renderField('Correo Electrónico Personal', 'correoElectronico', 'email')}
                {renderField('Correo Electrónico Empresarial', 'correoEmpresa', 'email')}
                {renderField('Teléfono Móvil', 'telefonoMovil', 'tel')}
                {renderField('Teléfono de Casa', 'telefonoCasa', 'tel')}
                {renderField('Dirección Completa', 'direccionCompleta')}
                {renderField('Estado', 'estado')}
                {renderField('Código Postal Fiscal', 'cpFiscal')}
              </div>
            )}

            {/* Sección: Datos Laborales */}
            {activeSection === 'laborales' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {renderField('Salario Mensual', 'salary', 'number')}
                {renderField('SD (Sueldo Diario)', 'sd', 'number', null, false, true)}
                {renderField('SDI (Sueldo Diario Integrado)', 'sdi', 'number', null, false, true)}
                {renderField('Tipo de Contrato', 'contrato', 'select', [
                  { value: 'Indeterminado', label: 'Indeterminado' },
                  { value: 'Temporal', label: 'Temporal' },
                  { value: 'Prueba', label: 'Prueba' },
                  { value: 'Honorarios', label: 'Honorarios' },
                  { value: 'Outsourcing', label: 'Outsourcing' }
                ])}
                {renderField('Horario', 'horario')}
                {renderField('Sucursal', 'sucursal')}
                {renderField('Área', 'area')}
                {renderField('Región', 'region')}
              </div>
            )}

            {/* Sección: Datos Financieros */}
            {activeSection === 'financieros' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {renderField('Banco', 'banco', 'select', [
                  { value: 'BBVA', label: 'BBVA' },
                  { value: 'Santander', label: 'Santander' },
                  { value: 'Banamex', label: 'Banamex' },
                  { value: 'Banorte', label: 'Banorte' },
                  { value: 'HSBC', label: 'HSBC' },
                  { value: 'Scotiabank', label: 'Scotiabank' },
                  { value: 'Azteca', label: 'Azteca' },
                  { value: 'BanBajío', label: 'BanBajío' },
                  { value: 'Afirme', label: 'Afirme' },
                  { value: 'Otro', label: 'Otro' }
                ])}
                {renderField('CLABE', 'clabe')}
                {renderField('Número de Cuenta', 'numeroCuenta')}
              </div>
            )}

            {/* Sección: Uniformes */}
            {activeSection === 'uniformes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {renderField('Talla de Camisa', 'tallaCamisa', 'select', [
                  { value: 'XS', label: 'XS' },
                  { value: 'S', label: 'S' },
                  { value: 'M', label: 'M' },
                  { value: 'L', label: 'L' },
                  { value: 'XL', label: 'XL' },
                  { value: '2XL', label: '2XL' },
                  { value: '3XL', label: '3XL' }
                ])}
                {renderField('Talla de Playera', 'tallaPlayera', 'select', [
                  { value: 'XS', label: 'XS' },
                  { value: 'S', label: 'S' },
                  { value: 'M', label: 'M' },
                  { value: 'L', label: 'L' },
                  { value: 'XL', label: 'XL' },
                  { value: '2XL', label: '2XL' },
                  { value: '3XL', label: '3XL' }
                ])}
                {renderField('Talla de Pantalón', 'tallaPantalon')}
                {renderField('Talla de Zapatos', 'tallaZapatos')}
              </div>
            )}

            {/* Sección: Beneficiarios */}
            {activeSection === 'beneficiarios' && (
              <div className="space-y-6 mb-6">
                <div className="border-b pb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Beneficiario 1</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField('Nombre Completo', 'beneficiario1')}
                    {renderField('Fecha de Nacimiento', 'fechaNacBeneficiario1', 'date')}
                    {renderField('Porcentaje (%)', 'porcentaje1', 'number')}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Beneficiario 2</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField('Nombre Completo', 'beneficiario2')}
                    {renderField('Fecha de Nacimiento', 'fechaNacBeneficiario2', 'date')}
                    {renderField('Porcentaje (%)', 'porcentaje2', 'number')}
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2">
                {saving && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isEditing ? 'Actualizar Empleado' : 'Crear Empleado'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
