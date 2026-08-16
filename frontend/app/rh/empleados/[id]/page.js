'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedRoute from '@/components/ProtectedRoute';
import { exportEmployeeToPDF } from '@/lib/employeePdfExport';

// ============================================================
// MODAL REUTILIZABLE PARA EDITAR SECCIONES
// ============================================================
function EditSectionModal({ isOpen, onClose, title, children, onSave, saving }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-6">{children}</div>
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BOTÓN DE EDICIÓN REUTILIZABLE
// ============================================================
function EditButton({ onClick, label = "Editar" }) {
  return (
    <button
      onClick={onClick}
      className="ml-2 px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-medium border border-blue-200 transition-colors"
    >
      ✎ {label}
    </button>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
function EmployeeProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para cada modal de sección
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showLaboralModal, setShowLaboralModal] = useState(false);
  const [showContacto, setShowContacto] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showFinancieroModal, setShowFinancieroModal] = useState(false);
  const [showUniformesModal, setShowUniformesModal] = useState(false);
  const [showBeneficiariosModal, setShowBeneficiariosModal] = useState(false);
  const [showFamiliaresModal, setShowFamiliaresModal] = useState(false);

  // Función para calcular SD/SDI en frontend
  const calcularSD_SDI = (salarioMensual, fechaIngreso) => {
    if (!salarioMensual || !fechaIngreso) return { sd: '', sdi: '' };
    const salario = parseFloat(salarioMensual);
    if (isNaN(salario) || salario <= 0) return { sd: '', sdi: '' };
    
    const sd = (salario / 30).toFixed(2);
    
    const fechaIngresoDate = new Date(fechaIngreso);
    const hoy = new Date();
    let antiguedad = hoy.getFullYear() - fechaIngresoDate.getFullYear();
    const mesDiff = hoy.getMonth() - fechaIngresoDate.getMonth();
    if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < fechaIngresoDate.getDate())) {
      antiguedad--;
    }
    antiguedad = Math.max(1, Math.min(30, antiguedad || 1));
    
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

  // Formularios individuales por sección
  const [personalForm, setPersonalForm] = useState({});
  const [laboralForm, setLaboralForm] = useState({});
  const [contactoForm, setContactoForm] = useState({});
  const [legalForm, setLegalForm] = useState({});
  const [financieroForm, setFinancieroForm] = useState({});
  const [uniformesForm, setUniformesForm] = useState({});
  const [beneficiariosForm, setBeneficiariosForm] = useState({});
  const [familiaresForm, setFamiliaresForm] = useState({});

  // Foto de perfil
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Historial de sueldos
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [showSalaryHistoryModal, setShowSalaryHistoryModal] = useState(false);
  const [loadingSalaryHistory, setLoadingSalaryHistory] = useState(false);

  // Documentos
  const [documents, setDocuments] = useState([]);
  const [allowedDocumentTypes, setAllowedDocumentTypes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newDocument, setNewDocument] = useState({ tipo_documento: '', document: null });

  useEffect(() => {
    if (user && id) {
      fetchEmployee();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  // Inicializar formularios cuando se carga el empleado
  useEffect(() => {
    if (employee) {
      setPersonalForm({
        clave: employee.clave || '',
        nombres: employee.nombres || employee.nombre || '',
        apellidoPaterno: employee.apellidoPaterno || '',
        apellidoMaterno: employee.apellidoMaterno || '',
        fechaNacimiento: employee.fechaNacimiento ? new Date(employee.fechaNacimiento).toISOString().split('T')[0] : '',
        lugarNacimiento: employee.lugarNacimiento || '',
        estadoCivil: employee.estadoCivil || '',
        nacionalidad: employee.nacionalidad || '',
        sexo: employee.sexo || '',
        nivelAcademico: employee.nivelAcademico || '',
      });
      setLaboralForm({
        fecha_ingreso: employee.fechaAlta ? new Date(employee.fechaAlta).toISOString().split('T')[0] : '',
        estatus: employee.estatus || 'Activo',
        sucursal: employee.sucursal || '',
        area: employee.area || '',
        region: employee.region || '',
        contrato: employee.contrato || '',
        horario: employee.horario || '',
        puestoId: employee.puestoId || '',
        departamento_id: employee.departamento_id || '',
        salary: employee.salarioMensual || '',
        jefeDirecto: employee.jefeDirecto || '',
        sd: employee.sd || '',
        sdi: employee.sdi || '',
      });
      setContactoForm({
        telefonoCasa: employee.telefonoCasa || '',
        telefonoMovil: employee.telefonoMovil || '',
        correoElectronico: employee.correoElectronico || '',
        correoEmpresa: employee.correoEmpresa || '',
        direccionCompleta: employee.direccionCompleta || '',
        estado: employee.estado || '',
        cpFiscal: employee.cpFiscal || '',
      });
      setLegalForm({
        rfc: employee.rfc || '',
        curp: employee.curp || '',
        nss: employee.nss || '',
      });
      setFinancieroForm({
        clabe: employee.clabe || '',
        numeroCuenta: employee.numeroCuenta || '',
        banco: employee.banco || '',
      });
      setUniformesForm({
        tallaCamisa: employee.tallaCamisa || '',
        tallaPlayera: employee.tallaPlayera || '',
        tallaPantalon: employee.tallaPantalon || '',
        tallaZapatos: employee.tallaZapatos || '',
      });
      setBeneficiariosForm({
        nombreConyuge: employee.nombreConyuge || '',
        beneficiario1: employee.beneficiario1 || '',
        fechaNacBeneficiario1: employee.fechaNacBeneficiario1 ? new Date(employee.fechaNacBeneficiario1).toISOString().split('T')[0] : '',
        porcentaje1: employee.porcentaje1 || '',
        beneficiario2: employee.beneficiario2 || '',
        fechaNacBeneficiario2: employee.fechaNacBeneficiario2 ? new Date(employee.fechaNacBeneficiario2).toISOString().split('T')[0] : '',
        porcentaje2: employee.porcentaje2 || '',
      });
      setFamiliaresForm({
        esPadre: employee.esPadre || false,
        numeroHijos: employee.numeroHijos || 0,
      });
    }
  }, [employee]);

  // Handlers genéricos para cambios en formularios
  const handleFormChange = (setter) => (e) => {
    const { name, value, type, checked } = e.target;
    setter(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handlers específicos para cada sección
  const handlePersonalChange = handleFormChange(setPersonalForm);
  const handleLaboralChange = (e) => {
    const { name, value } = e.target;
    setLaboralForm(prev => {
      const updated = { ...prev, [name]: value };
      // Recalcular SD/SDI automáticamente cuando cambia salario o fecha de ingreso
      if (name === 'salary' || name === 'fecha_ingreso') {
        const { sd, sdi } = calcularSD_SDI(updated.salary, updated.fecha_ingreso);
        updated.sd = sd;
        updated.sdi = sdi;
      }
      return updated;
    });
  };
  const handleContactoChange = handleFormChange(setContactoForm);
  const handleLegalChange = handleFormChange(setLegalForm);
  const handleFinancieroChange = handleFormChange(setFinancieroForm);
  const handleUniformesChange = handleFormChange(setUniformesForm);
  const handleBeneficiariosChange = handleFormChange(setBeneficiariosForm);
  const handleFamiliaresChange = handleFormChange(setFamiliaresForm);

  // ============================================================
  // FUNCIONES DE GUARDADO POR SECCIÓN
  // ============================================================
  const saveSection = async (sectionData, closeModal) => {
    if (!employee) return;
    setSaving(true);
    try {
      await api.put(`/employees/${employee.id}`, sectionData);
      toast.success('Sección actualizada exitosamente');
      closeModal(false);
      await fetchEmployee();
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar la sección');
    } finally {
      setSaving(false);
    }
  };

  const savePersonal = () => saveSection(personalForm, setShowPersonalModal);
  const saveLaboral = () => saveSection(laboralForm, setShowLaboralModal);
  const saveContacto = () => saveSection(contactoForm, setShowContacto);
  const saveLegal = () => saveSection(legalForm, setShowLegalModal);
  const saveFinanciero = () => saveSection(financieroForm, setShowFinancieroModal);
  const saveUniformes = () => saveSection(uniformesForm, setShowUniformesModal);
  const saveBeneficiarios = () => saveSection(beneficiariosForm, setShowBeneficiariosModal);
  const saveFamiliares = () => saveSection(familiaresForm, setShowFamiliaresModal);

  // ============================================================
  // DOCUMENTOS
  // ============================================================
  const fetchEmployee = async () => {
    try {
      const response = await api.get(`/employees/${id}`);
      setEmployee(response.data.employee);
      await fetchDocuments();
      await fetchAllowedDocumentTypes();
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
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Error al cargar documentos');
    }
  };

  const fetchAllowedDocumentTypes = async () => {
    try {
      const response = await api.get('/employee-documents/allowed-types');
      setAllowedDocumentTypes(response.data.allowedTypes || []);
    } catch (error) {
      console.error('Error fetching allowed document types:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewDocument({ ...newDocument, document: file });
    }
  };

  const handleUploadDocument = async () => {
    if (!newDocument.tipo_documento || !newDocument.document) {
      toast.error('Por favor selecciona un tipo de documento y un archivo');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('tipo_documento', newDocument.tipo_documento);
      formData.append('document', newDocument.document);
      await api.post(`/employee/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Documento subido exitosamente');
      setNewDocument({ tipo_documento: '', document: null });
      setShowUploadForm(false);
      await fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.error || 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = async (documentId, fileName) => {
    try {
      const response = await api.get(`/employee-documents/${documentId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error al descargar documento');
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/employee-documents/${documentId}`);
      toast.success('Documento eliminado exitosamente');
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(error.response?.data?.error || 'Error al eliminar documento');
    }
  };

  // ============================================================
  // FOTO DE PERFIL
  // ============================================================
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      await api.post(`/employees/${employee.id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Foto de perfil actualizada exitosamente');
      await fetchEmployee();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(error.response?.data?.error || 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
      // Resetear el input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadPhoto = () => {
    if (!employee.fotoUrl) return;
    const link = document.createElement('a');
    link.href = employee.fotoUrl;
    link.setAttribute('download', `foto_${employee.clave || employee.id}.jpg`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // ============================================================
  // FUNCIONES AUXILIARES
  // ============================================================
  // Helper para formatear fecha evitando el bug del día anterior
  // Extrae la fecha como string YYYY-MM-DD antes de crear el objeto Date
  const formatDateSafe = (fecha) => {
    if (!fecha) return 'No especificada';
    const dateStr = typeof fecha === 'string' ? fecha.split('T')[0] : fecha;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'No especificada';
    const dateStr = typeof fechaNacimiento === 'string' ? fechaNacimiento.split('T')[0] : fechaNacimiento;
    const [year, month, day] = dateStr.split('-').map(Number);
    const nacimiento = new Date(year, month - 1, day);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return `${edad} años`;
  };

  const calcularAntiguedad = (fechaAlta) => {
    if (!fechaAlta) return 'No especificada';
    const dateStr = typeof fechaAlta === 'string' ? fechaAlta.split('T')[0] : fechaAlta;
    const [year, month, day] = dateStr.split('-').map(Number);
    const ingreso = new Date(year, month - 1, day);
    const hoy = new Date();
    let años = hoy.getFullYear() - ingreso.getFullYear();
    let meses = hoy.getMonth() - ingreso.getMonth();
    let días = hoy.getDate() - ingreso.getDate();
    if (días < 0) {
      meses--;
      const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
      días += ultimoDiaMesAnterior;
    }
    if (meses < 0) { años--; meses += 12; }
    const partes = [];
    if (años > 0) partes.push(`${años} ${años === 1 ? 'año' : 'años'}`);
    if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`);
    if (días > 0) partes.push(`${días} ${días === 1 ? 'día' : 'días'}`);
    if (partes.length === 0) return '0 días';
    return partes.join(', ');
  };

  const fechaALetras = (fecha) => {
    if (!fecha) return 'No especificada';
    const dateStr = typeof fecha === 'string' ? fecha.split('T')[0] : fecha;
    const [year, month, day] = dateStr.split('-').map(Number);
    const fechaSegura = new Date(year, month - 1, day);
    return fechaSegura.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const numeroATexto = (numero) => {
    if (!numero) return 'No especificado';
    const entero = Math.floor(numero);
    const decimal = Math.round((numero - entero) * 100);
    const textoEntero = convertirNumeroATexto(entero);
    const textoDecimal = decimal.toString().padStart(2, '0') + '/100';
    return `${textoEntero} ${textoDecimal} M.N.`;
  };

  const convertirNumeroATexto = (numero) => {
    if (numero === 0) return 'CERO';
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    if (numero < 10) return unidades[numero];
    if (numero < 20) return especiales[numero - 10];
    if (numero < 100) {
      const d = Math.floor(numero / 10);
      const u = numero % 10;
      if (u === 0) return decenas[d];
      if (d === 2) {
        const veinti = ['VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
        return veinti[u - 1];
      }
      return `${decenas[d]} Y ${unidades[u]}`;
    }
    if (numero === 100) return 'CIEN';
    if (numero < 1000) {
      const c = Math.floor(numero / 100);
      const resto = numero % 100;
      if (resto === 0) return centenas[c];
      return `${centenas[c]} ${convertirNumeroATexto(resto)}`;
    }
    if (numero < 1000000) {
      const miles = Math.floor(numero / 1000);
      const resto = numero % 1000;
      let textoMiles = miles === 1 ? 'MIL' : `${convertirNumeroATexto(miles)} MIL`;
      if (resto === 0) return textoMiles;
      return `${textoMiles} ${convertirNumeroATexto(resto)}`;
    }
    return 'NÚMERO MUY GRANDE';
  };

  // ============================================================
  // RENDER: VERIFICACIÓN DE PERMISOS Y ESTADOS
  // ============================================================
  if (!user || !user.accessibleModules?.includes('EMPLEADOS')) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">No tienes acceso al módulo de Empleados.</p>
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
            <button onClick={() => router.push('/rh/empleados')} className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
              Volver a la lista de empleados
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const canEdit = user && (user.role === 'ADMIN' || user.accessibleModules?.includes('EMPLEADOS'));

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <DashboardLayout>
      <div className="p-6 w-full">
        {/* Encabezado */}
        <div className="mb-6">
          <Link href="/rh/empleados" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Volver a la lista
          </Link>
        </div>

        {/* ============================================================ */}
        {/* HERO CARD - Foto + Nombre + Puesto */}
        {/* ============================================================ */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center gap-8">
            {/* Foto del empleado (HERO) */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              {employee.fotoUrl ? (
                <Image
                  src={employee.fotoUrl}
                  alt={`Foto de ${employee.nombres || employee.nombre || ''}`}
                  width={128}
                  height={128}
                  className="h-32 w-32 object-cover rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-white bg-opacity-20 border-4 border-white flex items-center justify-center shadow-lg">
                  <span className="text-5xl font-bold text-white">
                    {((employee.nombres || employee.nombre || '?')[0]).toUpperCase()}
                  </span>
                </div>
              )}
              {/* Botones de foto (solo ADMIN/RH) */}
              {user && (user.role === 'ADMIN' || user.role === 'RH') && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="px-3 py-1 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-md font-medium transition-all"
                  >
                    {uploadingPhoto ? 'Subiendo...' : employee.fotoUrl ? 'Cambiar Foto' : 'Subir Foto'}
                  </button>
                  {employee.fotoUrl && (
                    <button
                      onClick={handleDownloadPhoto}
                      className="px-3 py-1 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-md font-medium transition-all"
                    >
                      Descargar
                    </button>
                  )}
                </div>
              )}
              {/* Botón Exportar PDF (visible para ADMIN/RH) */}
              {user && (user.role === 'ADMIN' || user.role === 'RH') && (
                <button
                  onClick={async () => {
                    try {
                      // Cargar salary history si no está cargado
                      let history = salaryHistory;
                      if (history.length === 0) {
                        const response = await api.get(`/employees/${employee.id}/salary-history`);
                        history = response.data.salaryHistory || [];
                      }
                      exportEmployeeToPDF(employee, history);
                    } catch (error) {
                      console.error('Error exporting PDF:', error);
                      toast.error('Error al generar el PDF');
                    }
                  }}
                  className="mt-2 px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-all flex items-center gap-1"
                  title="Exportar resumen del empleado a PDF"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar PDF
                </button>
              )}
              {/* Input file oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            {/* Información principal */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold">
                {employee.nombres || employee.nombre || ''} {employee.apellidoPaterno || ''} {employee.apellidoMaterno || ''}
              </h1>
              <p className="text-xl text-blue-100 mt-1">{employee.puesto?.nombre || 'Sin puesto asignado'}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${employee.estatus === 'Activo' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {employee.estatus || 'Sin estatus'}
                </span>
                <span className="text-blue-100 text-sm">
                  <span className="font-semibold">Clave:</span> {employee.clave || 'N/A'}
                </span>
                <span className="text-blue-100 text-sm">
                  <span className="font-semibold">Antigüedad:</span> {calcularAntiguedad(employee.fechaAlta)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* GRID DE CARDS POR SECCIÓN */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* CARD: DATOS PERSONALES */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-blue-600">👤</span> Datos Personales
              </h3>
              {canEdit && <EditButton onClick={() => setShowPersonalModal(true)} />}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Nombres:</span><span className="text-sm text-gray-900">{employee.nombres || employee.nombre || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Apellido Paterno:</span><span className="text-sm text-gray-900">{employee.apellidoPaterno || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Apellido Materno:</span><span className="text-sm text-gray-900">{employee.apellidoMaterno || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Fecha de Nacimiento:</span><span className="text-sm text-gray-900">{formatDateSafe(employee.fechaNacimiento)}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Edad:</span><span className="text-sm text-gray-900">{calcularEdad(employee.fechaNacimiento)}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Lugar de Nacimiento:</span><span className="text-sm text-gray-900">{employee.lugarNacimiento || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Estado Civil:</span><span className="text-sm text-gray-900">{employee.estadoCivil || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Nacionalidad:</span><span className="text-sm text-gray-900">{employee.nacionalidad || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Sexo:</span><span className="text-sm text-gray-900">{employee.sexo || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Nivel Académico:</span><span className="text-sm text-gray-900">{employee.nivelAcademico || 'No especificado'}</span></div>
            </div>
          </div>

          {/* CARD: DATOS LABORALES */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-blue-600">💼</span> Datos Laborales
              </h3>
              {canEdit && <EditButton onClick={() => setShowLaboralModal(true)} />}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Puesto:</span><span className="text-sm text-gray-900">{employee.puesto?.nombre || 'Sin puesto asignado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Departamento:</span><span className="text-sm text-gray-900">{employee.departamento?.nombre || 'No asignado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Fecha de Ingreso:</span><span className="text-sm text-gray-900">{formatDateSafe(employee.fechaAlta)}</span></div>
              {employee.estatus === 'Inactivo' && (
                <>
                  <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Fecha de Baja:</span><span className="text-sm text-gray-900">{employee.fechaBaja ? formatDateSafe(employee.fechaBaja) : 'No especificada'}</span></div>
                  <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Motivo de Baja:</span><span className="text-sm text-gray-900">{employee.motivoBaja || 'No especificado'}</span></div>
                </>
              )}
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Salario Mensual:</span><span className="text-sm text-gray-900">{employee.salarioMensual ? `$${employee.salarioMensual.toLocaleString('es-MX')}` : 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Área:</span><span className="text-sm text-gray-900">{employee.area || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Región:</span><span className="text-sm text-gray-900">{employee.region || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Contrato:</span><span className="text-sm text-gray-900">{employee.contrato || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Horario:</span><span className="text-sm text-gray-900">{employee.horario || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Sucursal:</span><span className="text-sm text-gray-900">{employee.sucursal || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Jefe Directo:</span><span className="text-sm text-gray-900">{employee.reportaA?.nombre || employee.jefeDirecto || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">SD / SDI:</span><span className="text-sm text-gray-900">${employee.sd?.toLocaleString('es-MX') || '0'} / ${employee.sdi?.toLocaleString('es-MX') || '0'}</span></div>
            </div>
          </div>

          {/* CARD: HISTORIAL DE SUELDOS */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-blue-600">📊</span> Historial de Sueldos
              </h3>
              {user && (user.role === 'ADMIN' || user.role === 'RH') && (
                <button
                  onClick={async () => {
                    setLoadingSalaryHistory(true);
                    setShowSalaryHistoryModal(true);
                    try {
                      const response = await api.get(`/employees/${employee.id}/salary-history`);
                      setSalaryHistory(response.data.salaryHistory || []);
                    } catch (error) {
                      console.error('Error fetching salary history:', error);
                      toast.error('Error al cargar historial de sueldos');
                      setSalaryHistory([]);
                    } finally {
                      setLoadingSalaryHistory(false);
                    }
                  }}
                  className="ml-2 px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-medium border border-blue-200 transition-colors"
                >
                  📋 Ver Historial
                </button>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Salario Actual:</span>
                <span className="text-sm text-gray-900 font-semibold">
                  {employee.salarioMensual ? `$${employee.salarioMensual.toLocaleString('es-MX')}` : 'No especificado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">SD Actual:</span>
                <span className="text-sm text-gray-900">${employee.sd?.toLocaleString('es-MX') || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">SDI Actual:</span>
                <span className="text-sm text-gray-900">${employee.sdi?.toLocaleString('es-MX') || '0'}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Los cambios salariales se registran automáticamente al modificar el salario en Datos Laborales.
                </p>
              </div>
            </div>
          </div>

          {/* CARD: CONTACTO Y DIRECCIÓN */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-blue-600">📞</span> Contacto y Dirección
              </h3>
              {canEdit && <EditButton onClick={() => setShowContacto(true)} />}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Teléfono Casa:</span><span className="text-sm text-gray-900">{employee.telefonoCasa || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Teléfono Móvil:</span><span className="text-sm text-gray-900">{employee.telefonoMovil || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Correo Electrónico:</span><span className="text-sm text-gray-900">{employee.correoElectronico || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Correo Empresa:</span><span className="text-sm text-gray-900">{employee.correoEmpresa || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Dirección:</span><span className="text-sm text-gray-900 text-right max-w-[60%]">{employee.direccionCompleta || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Estado:</span><span className="text-sm text-gray-900">{employee.estado || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">CP Fiscal:</span><span className="text-sm text-gray-900">{employee.cpFiscal || 'No especificado'}</span></div>
            </div>
          </div>

          {/* CARD: DATOS LEGALES */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-blue-600">⚖️</span> Datos Legales
              </h3>
              {canEdit && <EditButton onClick={() => setShowLegalModal(true)} />}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">RFC:</span><span className="text-sm text-gray-900">{employee.rfc || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">CURP:</span><span className="text-sm text-gray-900">{employee.curp || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">NSS:</span><span className="text-sm text-gray-900">{employee.nss || 'No especificado'}</span></div>
            </div>
          </div>

          {/* CARD: DATOS FINANCIEROS */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-blue-600">💰</span> Datos Financieros
              </h3>
              {canEdit && <EditButton onClick={() => setShowFinancieroModal(true)} />}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Banco:</span><span className="text-sm text-gray-900">{employee.banco || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Número de Cuenta:</span><span className="text-sm text-gray-900">{employee.numeroCuenta || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">CLABE:</span><span className="text-sm text-gray-900">{employee.clabe || 'No especificado'}</span></div>
            </div>
          </div>

          {/* CARD: UNIFORMES */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-blue-600">👕</span> Uniformes
              </h3>
              {canEdit && <EditButton onClick={() => setShowUniformesModal(true)} />}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Talla Camisa:</span><span className="text-sm text-gray-900">{employee.tallaCamisa || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Talla Playera:</span><span className="text-sm text-gray-900">{employee.tallaPlayera || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Talla Pantalón:</span><span className="text-sm text-gray-900">{employee.tallaPantalon || 'No especificado'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Talla Zapatos:</span><span className="text-sm text-gray-900">{employee.tallaZapatos || 'No especificado'}</span></div>
            </div>
          </div>

          {/* CARD: BENEFICIARIOS */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-blue-600">👨‍👩‍👧‍👦</span> Beneficiarios
              </h3>
              {canEdit && <EditButton onClick={() => setShowBeneficiariosModal(true)} />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Beneficiario 1</h4>
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Nombre:</span><span className="text-sm text-gray-900">{employee.beneficiario1 || 'No especificado'}</span></div>
                  <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Fecha Nac.:</span><span className="text-sm text-gray-900">{formatDateSafe(employee.fechaNacBeneficiario1)}</span></div>
                  <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Porcentaje:</span><span className="text-sm text-gray-900">{employee.porcentaje1 ? `${employee.porcentaje1}%` : 'No especificado'}</span></div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Beneficiario 2</h4>
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Nombre:</span><span className="text-sm text-gray-900">{employee.beneficiario2 || 'No especificado'}</span></div>
                  <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Fecha Nac.:</span><span className="text-sm text-gray-900">{formatDateSafe(employee.fechaNacBeneficiario2)}</span></div>
                  <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Porcentaje:</span><span className="text-sm text-gray-900">{employee.porcentaje2 ? `${employee.porcentaje2}%` : 'No especificado'}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD: DATOS FAMILIARES */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-blue-600">🏠</span> Datos Familiares
              </h3>
              {canEdit && <EditButton onClick={() => setShowFamiliaresModal(true)} />}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">¿Es Padre/Madre?</span><span className="text-sm text-gray-900">{employee.esPadre ? 'Sí' : 'No'}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">Número de Hijos:</span><span className="text-sm text-gray-900">{employee.numeroHijos || 0}</span></div>
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* CARD FULL WIDTH: ARCHIVO DIGITAL */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-blue-600">📁</span> Archivo Digital
            </h3>
            {user && (user.role === 'ADMIN' || user.role === 'RH') && (
              <button onClick={() => setShowUploadForm(!showUploadForm)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
                {showUploadForm ? 'Cancelar' : 'Subir Documento'}
              </button>
            )}
          </div>

          {showUploadForm && user && (user.role === 'ADMIN' || user.role === 'RH') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-3">Subir Nuevo Documento</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento *</label>
                  <select value={newDocument.tipo_documento} onChange={(e) => setNewDocument({...newDocument, tipo_documento: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="">Seleccionar tipo</option>
                    {allowedDocumentTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Archivo *</label>
                  <input type="file" onChange={handleFileChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" required />
                  {newDocument.document && <p className="mt-1 text-sm text-gray-600">Archivo seleccionado: {newDocument.document.name}</p>}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={handleUploadDocument} disabled={uploading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploading ? 'Subiendo...' : 'Subir Documento'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {documents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Documento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Archivo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Subida</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamaño</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.tipo_documento}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.nombre_archivo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateSafe(doc.uploaded_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.size_bytes ? `${Math.round(doc.size_bytes / 1024)} KB` : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => handleDownloadDocument(doc.id, doc.nombre_archivo)} className="text-blue-600 hover:text-blue-900 mr-3">Descargar</button>
                          {user && (user.role === 'ADMIN' || user.role === 'RH') && (
                            <button onClick={() => handleDeleteDocument(doc.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay documentos registrados para este empleado.</p>
                {user && (user.role === 'ADMIN' || user.role === 'RH') && (
                  <p className="text-gray-400 text-sm mt-2">Haz clic en &ldquo;Subir Documento&rdquo; para agregar el primer documento.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODALES DE EDICIÓN POR SECCIÓN */}
      {/* ============================================================ */}

      {/* MODAL: DATOS PERSONALES */}
      <EditSectionModal isOpen={showPersonalModal} onClose={() => setShowPersonalModal(false)} title="Editar Datos Personales" onSave={savePersonal} saving={saving}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clave</label>
            <input type="text" name="clave" value={personalForm.clave} onChange={handlePersonalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
            <input type="text" name="nombres" value={personalForm.nombres} onChange={handlePersonalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno</label>
            <input type="text" name="apellidoPaterno" value={personalForm.apellidoPaterno} onChange={handlePersonalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
            <input type="text" name="apellidoMaterno" value={personalForm.apellidoMaterno} onChange={handlePersonalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
            <input type="date" name="fechaNacimiento" value={personalForm.fechaNacimiento} onChange={handlePersonalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lugar de Nacimiento</label>
            <input type="text" name="lugarNacimiento" value={personalForm.lugarNacimiento} onChange={handlePersonalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
            <input type="text" name="estadoCivil" value={personalForm.estadoCivil} onChange={handlePersonalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
            <input type="text" name="nacionalidad" value={personalForm.nacionalidad} onChange={handlePersonalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
            <select name="sexo" value={personalForm.sexo} onChange={handlePersonalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel Académico</label>
            <input type="text" name="nivelAcademico" value={personalForm.nivelAcademico} onChange={handlePersonalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </EditSectionModal>

      {/* MODAL: DATOS LABORALES */}
      <EditSectionModal isOpen={showLaboralModal} onClose={() => setShowLaboralModal(false)} title="Editar Datos Laborales" onSave={saveLaboral} saving={saving}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puesto ID *</label>
            <input type="text" name="puestoId" value={laboralForm.puestoId} onChange={handleLaboralChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ID del puesto (ej: clm...)" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso *</label>
            <input type="date" name="fecha_ingreso" value={laboralForm.fecha_ingreso} onChange={handleLaboralChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
            <select name="estatus" value={laboralForm.estatus} onChange={handleLaboralChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
            <input type="text" name="sucursal" value={laboralForm.sucursal} onChange={handleLaboralChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
            <input type="text" name="area" value={laboralForm.area} onChange={handleLaboralChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Región</label>
            <input type="text" name="region" value={laboralForm.region} onChange={handleLaboralChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contrato</label>
            <input type="text" name="contrato" value={laboralForm.contrato} onChange={handleLaboralChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
            <input type="text" name="horario" value={laboralForm.horario} onChange={handleLaboralChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salario Mensual</label>
            <input type="number" step="0.01" name="salary" value={laboralForm.salary} onChange={handleLaboralChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SD (Sueldo Diario)</label>
            <input type="number" step="0.01" name="sd" value={laboralForm.sd} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed" title="Se calcula automáticamente: Salario Mensual ÷ 30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SDI (Sueldo Diario Integrado)</label>
            <input type="number" step="0.01" name="sdi" value={laboralForm.sdi} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed" title="Se calcula automáticamente: SD × Factor de Integración" />
          </div>
        </div>
      </EditSectionModal>

      {/* MODAL: CONTACTO Y DIRECCIÓN */}
      <EditSectionModal isOpen={showContacto} onClose={() => setShowContacto(false)} title="Editar Contacto y Dirección" onSave={saveContacto} saving={saving}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Casa</label>
            <input type="text" name="telefonoCasa" value={contactoForm.telefonoCasa} onChange={handleContactoChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Móvil</label>
            <input type="text" name="telefonoMovil" value={contactoForm.telefonoMovil} onChange={handleContactoChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input type="email" name="correoElectronico" value={contactoForm.correoElectronico} onChange={handleContactoChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Empresa</label>
            <input type="email" name="correoEmpresa" value={contactoForm.correoEmpresa} onChange={handleContactoChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Completa</label>
            <textarea name="direccionCompleta" value={contactoForm.direccionCompleta} onChange={handleContactoChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <input type="text" name="estado" value={contactoForm.estado} onChange={handleContactoChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CP Fiscal</label>
            <input type="text" name="cpFiscal" value={contactoForm.cpFiscal} onChange={handleContactoChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </EditSectionModal>

      {/* MODAL: DATOS LEGALES */}
      <EditSectionModal isOpen={showLegalModal} onClose={() => setShowLegalModal(false)} title="Editar Datos Legales" onSave={saveLegal} saving={saving}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RFC *</label>
            <input type="text" name="rfc" value={legalForm.rfc} onChange={handleLegalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CURP *</label>
            <input type="text" name="curp" value={legalForm.curp} onChange={handleLegalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NSS *</label>
            <input type="text" name="nss" value={legalForm.nss} onChange={handleLegalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
        </div>
      </EditSectionModal>

      {/* MODAL: DATOS FINANCIEROS */}
      <EditSectionModal isOpen={showFinancieroModal} onClose={() => setShowFinancieroModal(false)} title="Editar Datos Financieros" onSave={saveFinanciero} saving={saving}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
            <input type="text" name="banco" value={financieroForm.banco} onChange={handleFinancieroChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cuenta</label>
            <input type="text" name="numeroCuenta" value={financieroForm.numeroCuenta} onChange={handleFinancieroChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CLABE</label>
            <input type="text" name="clabe" value={financieroForm.clabe} onChange={handleFinancieroChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </EditSectionModal>

      {/* MODAL: UNIFORMES */}
      <EditSectionModal isOpen={showUniformesModal} onClose={() => setShowUniformesModal(false)} title="Editar Uniformes" onSave={saveUniformes} saving={saving}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Talla Camisa</label>
            <input type="text" name="tallaCamisa" value={uniformesForm.tallaCamisa} onChange={handleUniformesChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Talla Playera</label>
            <input type="text" name="tallaPlayera" value={uniformesForm.tallaPlayera} onChange={handleUniformesChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Talla Pantalón</label>
            <input type="text" name="tallaPantalon" value={uniformesForm.tallaPantalon} onChange={handleUniformesChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Talla Zapatos</label>
            <input type="text" name="tallaZapatos" value={uniformesForm.tallaZapatos} onChange={handleUniformesChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </EditSectionModal>

      {/* MODAL: BENEFICIARIOS */}
      <EditSectionModal isOpen={showBeneficiariosModal} onClose={() => setShowBeneficiariosModal(false)} title="Editar Beneficiarios" onSave={saveBeneficiarios} saving={saving}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Beneficiario 1</h4>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" name="beneficiario1" value={beneficiariosForm.beneficiario1} onChange={handleBeneficiariosChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                <input type="date" name="fechaNacBeneficiario1" value={beneficiariosForm.fechaNacBeneficiario1} onChange={handleBeneficiariosChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje (%)</label>
                <input type="number" step="0.01" name="porcentaje1" value={beneficiariosForm.porcentaje1} onChange={handleBeneficiariosChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Beneficiario 2</h4>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" name="beneficiario2" value={beneficiariosForm.beneficiario2} onChange={handleBeneficiariosChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                <input type="date" name="fechaNacBeneficiario2" value={beneficiariosForm.fechaNacBeneficiario2} onChange={handleBeneficiariosChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje (%)</label>
                <input type="number" step="0.01" name="porcentaje2" value={beneficiariosForm.porcentaje2} onChange={handleBeneficiariosChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </EditSectionModal>

      {/* ============================================================ */}
      {/* MODAL: HISTORIAL DE SUELDOS */}
      {/* ============================================================ */}
      {showSalaryHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-blue-600">📊</span> Historial de Sueldos
                </h2>
                <button onClick={() => setShowSalaryHistoryModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingSalaryHistory ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Cargando historial...</p>
                </div>
              ) : salaryHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay registros de cambios salariales para este empleado.</p>
                  <p className="text-gray-400 text-sm mt-2">Los cambios se registran automáticamente al modificar el salario.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Salario Anterior</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Salario Nuevo</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SD Anterior</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SD Nuevo</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SDI Anterior</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SDI Nuevo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Factor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salaryHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDateSafe(record.fechaCambio)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              record.tipoCambio === 'ALTA' ? 'bg-green-100 text-green-800' :
                              record.tipoCambio === 'INCREMENTO' ? 'bg-blue-100 text-blue-800' :
                              record.tipoCambio === 'DECREMENTO' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {record.tipoCambio}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            {record.salarioAnterior ? `$${record.salarioAnterior.toLocaleString('es-MX')}` : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                            ${record.salarioNuevo.toLocaleString('es-MX')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            {record.sdAnterior ? `$${record.sdAnterior.toLocaleString('es-MX')}` : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            {record.sdNuevo ? `$${record.sdNuevo.toLocaleString('es-MX')}` : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            {record.sdiAnterior ? `$${record.sdiAnterior.toLocaleString('es-MX')}` : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            {record.sdiNuevo ? `$${record.sdiNuevo.toLocaleString('es-MX')}` : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {record.factorUsado || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 max-w-[150px] truncate" title={record.motivo || ''}>
                            {record.motivo || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={() => setShowSalaryHistoryModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DATOS FAMILIARES */}
      <EditSectionModal isOpen={showFamiliaresModal} onClose={() => setShowFamiliaresModal(false)} title="Editar Datos Familiares" onSave={saveFamiliares} saving={saving}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Es Padre/Madre?</label>
            <select
              name="esPadre"
              value={familiaresForm.esPadre}
              onChange={(e) => setFamiliaresForm({...familiaresForm, esPadre: e.target.value === 'true'})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Hijos</label>
            <input
              type="number"
              min="0"
              name="numeroHijos"
              value={familiaresForm.numeroHijos}
              onChange={handleFamiliaresChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </EditSectionModal>
    </DashboardLayout>
  );
}

export default function EmployeeProfilePageWrapper() {
  return (
    <ProtectedRoute requiredModule="EMPLEADOS">
      <EmployeeProfilePage />
    </ProtectedRoute>
  );
}
