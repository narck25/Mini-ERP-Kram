'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

function EmployeeProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchEmployee();
    }
  }, [user, id]);

  // Inicializar formulario de edición cuando se carga el empleado
  useEffect(() => {
    if (employee) {
      setEditForm({
        // Datos Personales
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
        
        // Contacto y Dirección
        telefonoCasa: employee.telefonoCasa || '',
        telefonoMovil: employee.telefonoMovil || '',
        correoElectronico: employee.correoElectronico || '',
        correoEmpresa: employee.correoEmpresa || '',
        direccionCompleta: employee.direccionCompleta || '',
        estado: employee.estado || '',
        cpFiscal: employee.cpFiscal || '',
        
        // Datos Legales
        rfc: employee.rfc || '',
        curp: employee.curp || '',
        nss: employee.nss || '',
        
        // Datos Laborales
        fecha_ingreso: employee.fechaAlta ? new Date(employee.fechaAlta).toISOString().split('T')[0] : '',
        estatus: employee.estatus || 'Activo',
        sucursal: employee.sucursal || '',
        area: employee.area || '',
        region: employee.region || '',
        contrato: employee.contrato || '',
        horario: employee.horario || '',
        puestoId: employee.puestoId || '',
        departamento_id: employee.departamento_id || '',
        
        // Datos Financieros
        salary: employee.salarioMensual || '',
        clabe: employee.clabe || '',
        numeroCuenta: employee.numeroCuenta || '',
        banco: employee.banco || '',
        
        // Nuevos campos: Jefe Directo, SD, SDI
        jefeDirecto: employee.jefeDirecto || '',
        sd: employee.sd || '',
        sdi: employee.sdi || '',
        
        // Uniformes y Extras
        tallaCamisa: employee.tallaCamisa || '',
        tallaPlayera: employee.tallaPlayera || '',
        tallaPantalon: employee.tallaPantalon || '',
        tallaZapatos: employee.tallaZapatos || '',
        nombreConyuge: employee.nombreConyuge || '',
        
        // Beneficiarios
        beneficiario1: employee.beneficiario1 || '',
        fechaNacBeneficiario1: employee.fechaNacBeneficiario1 ? new Date(employee.fechaNacBeneficiario1).toISOString().split('T')[0] : '',
        porcentaje1: employee.porcentaje1 || '',
        beneficiario2: employee.beneficiario2 || '',
        fechaNacBeneficiario2: employee.fechaNacBeneficiario2 ? new Date(employee.fechaNacBeneficiario2).toISOString().split('T')[0] : '',
        porcentaje2: employee.porcentaje2 || '',
      });
    }
  }, [employee]);

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value
    });
  };

  const handleSaveChanges = async () => {
    if (!employee) return;

    setSaving(true);
    try {
      const response = await api.put(`/employees/${employee.id}`, editForm);
      toast.success('Empleado actualizado exitosamente');
      setShowEditModal(false);
      // Recargar datos del empleado
      await fetchEmployee();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar el empleado');
    } finally {
      setSaving(false);
    }
  };

  const [documents, setDocuments] = useState([]);
  const [allowedDocumentTypes, setAllowedDocumentTypes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newDocument, setNewDocument] = useState({
    tipo_documento: '',
    document: null
  });

  const fetchEmployee = async () => {
    try {
      const response = await api.get(`/employees/${id}`);
      setEmployee(response.data.employee);
      // Cargar documentos del empleado
      await fetchDocuments();
      // Cargar tipos de documentos permitidos
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
      setNewDocument({
        ...newDocument,
        document: file
      });
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
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Documento subido exitosamente');
      setNewDocument({
        tipo_documento: '',
        document: null
      });
      setShowUploadForm(false);
      await fetchDocuments(); // Recargar lista de documentos
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.error || 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = async (documentId, fileName) => {
    try {
      const response = await api.get(`/employee-documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
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
    if (!confirm('¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await api.delete(`/employee-documents/${documentId}`);
      toast.success('Documento eliminado exitosamente');
      await fetchDocuments(); // Recargar lista de documentos
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(error.response?.data?.error || 'Error al eliminar documento');
    }
  };

  // Función para calcular la edad
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'No especificada';
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return `${edad} años`;
  };

  // Función para calcular la antigüedad con días
  const calcularAntiguedad = (fechaAlta) => {
    if (!fechaAlta) return 'No especificada';
    const ingreso = new Date(fechaAlta);
    const hoy = new Date();
    
    let años = hoy.getFullYear() - ingreso.getFullYear();
    let meses = hoy.getMonth() - ingreso.getMonth();
    let días = hoy.getDate() - ingreso.getDate();
    
    // Ajustar días negativos
    if (días < 0) {
      meses--;
      // Obtener días del mes anterior
      const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
      días += ultimoDiaMesAnterior;
    }
    
    // Ajustar meses negativos
    if (meses < 0) {
      años--;
      meses += 12;
    }
    
    // Formatear resultado
    const partes = [];
    if (años > 0) {
      partes.push(`${años} ${años === 1 ? 'año' : 'años'}`);
    }
    if (meses > 0) {
      partes.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`);
    }
    if (días > 0) {
      partes.push(`${días} ${días === 1 ? 'día' : 'días'}`);
    }
    
    if (partes.length === 0) {
      return '0 días';
    }
    
    return partes.join(', ');
  };

  // Función para convertir fecha a letras
  const fechaALetras = (fecha) => {
    if (!fecha) return 'No especificada';
    const fechaObj = new Date(fecha);
    const opciones = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return fechaObj.toLocaleDateString('es-MX', opciones);
  };

  // Función para convertir número a texto (salario) en formato VEINTICINCO MIL 00/100 M.N.
  const numeroATexto = (numero) => {
    if (!numero) return 'No especificado';
    
    // Separar parte entera y decimal
    const entero = Math.floor(numero);
    const decimal = Math.round((numero - entero) * 100);
    
    // Convertir parte entera a texto
    const textoEntero = convertirNumeroATexto(entero);
    // Formatear decimal como 00/100
    const textoDecimal = decimal.toString().padStart(2, '0') + '/100';
    
    // Retornar en formato solicitado: VEINTICINCO MIL 00/100 M.N.
    return `${textoEntero} ${textoDecimal} M.N.`;
  };

  // Función auxiliar para convertir números enteros a texto en mayúsculas
  const convertirNumeroATexto = (numero) => {
    if (numero === 0) return 'CERO';
    
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    
    if (numero < 10) {
      return unidades[numero];
    }
    
    if (numero < 20) {
      return especiales[numero - 10];
    }
    
    if (numero < 100) {
      const d = Math.floor(numero / 10);
      const u = numero % 10;
      
      if (u === 0) {
        return decenas[d];
      } else if (d === 2) {
        // Casos especiales: veintiuno, veintidós, etc.
        const veinti = ['VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 
                       'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
        return veinti[u - 1];
      } else {
        return `${decenas[d]} Y ${unidades[u]}`;
      }
    }
    
    if (numero === 100) {
      return 'CIEN';
    }
    
    if (numero < 1000) {
      const c = Math.floor(numero / 100);
      const resto = numero % 100;
      
      if (resto === 0) {
        return centenas[c];
      } else {
        return `${centenas[c]} ${convertirNumeroATexto(resto)}`;
      }
    }
    
    if (numero < 1000000) {
      const miles = Math.floor(numero / 1000);
      const resto = numero % 1000;
      
      let textoMiles = '';
      if (miles === 1) {
        textoMiles = 'MIL';
      } else {
        textoMiles = `${convertirNumeroATexto(miles)} MIL`;
      }
      
      if (resto === 0) {
        return textoMiles;
      } else {
        return `${textoMiles} ${convertirNumeroATexto(resto)}`;
      }
    }
    
    // Para números mayores a un millón (por si acaso)
    return 'NÚMERO MUY GRANDE';
  };

  // Verificar permisos usando accessibleModules
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
              <h1 className="text-2xl font-bold text-gray-900">Perfil del Empleado</h1>
              <div className="flex items-center space-x-4 mt-2">
                <Link
                  href="/rh/empleados"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Volver a la lista
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Información del empleado */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {employee.nombres || employee.nombre || ''} {employee.apellidoPaterno || ''} {employee.apellidoMaterno || ''}
              </h2>
              <p className="text-gray-600">{employee.puesto?.nombre || 'Sin puesto asignado'}</p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                employee.estatus === 'Activo' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {employee.estatus}
              </span>
              {/* Botón de edición - solo visible para ADMIN o usuarios con acceso al módulo EMPLEADOS */}
              {user && (user.role === 'ADMIN' || user.accessibleModules?.includes('EMPLEADOS')) && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                >
                  Editar Información
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Columna 1: Datos Personales */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Clave:</span>
                  <p className="text-sm text-gray-600">{employee.clave || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Nombres:</span>
                  <p className="text-sm text-gray-600">{employee.nombres || employee.nombre || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Apellido Paterno:</span>
                  <p className="text-sm text-gray-600">{employee.apellidoPaterno || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Apellido Materno:</span>
                  <p className="text-sm text-gray-600">{employee.apellidoMaterno || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Fecha de Nacimiento:</span>
                  <p className="text-sm text-gray-600">
                    {employee.fechaNacimiento ? new Date(employee.fechaNacimiento).toLocaleDateString('es-MX') : 'No especificada'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Edad:</span>
                  <p className="text-sm text-gray-600">{calcularEdad(employee.fechaNacimiento)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Lugar de Nacimiento:</span>
                  <p className="text-sm text-gray-600">{employee.lugarNacimiento || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Estado Civil:</span>
                  <p className="text-sm text-gray-600">{employee.estadoCivil || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Nacionalidad:</span>
                  <p className="text-sm text-gray-600">{employee.nacionalidad || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Sexo:</span>
                  <p className="text-sm text-gray-600">{employee.sexo || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Nivel Académico:</span>
                  <p className="text-sm text-gray-600">{employee.nivelAcademico || 'No especificado'}</p>
                </div>
              </div>
            </div>

            {/* Columna 2: Datos Laborales */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Laborales</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Puesto:</span>
                  <p className="text-sm text-gray-600">{employee.puesto?.nombre || 'Sin puesto asignado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Departamento:</span>
                  <p className="text-sm text-gray-600">{employee.departamento?.nombre || 'No asignado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Fecha de Ingreso:</span>
                  <p className="text-sm text-gray-600">
                    {employee.fechaAlta ? new Date(employee.fechaAlta).toLocaleDateString('es-MX') : 'No especificada'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Fecha de Ingreso (en letras):</span>
                  <p className="text-sm text-gray-600">{fechaALetras(employee.fechaAlta)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Antigüedad:</span>
                  <p className="text-sm text-gray-600">{calcularAntiguedad(employee.fechaAlta)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Estatus:</span>
                  <p className="text-sm text-gray-600">{employee.estatus || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Salario Mensual:</span>
                  <p className="text-sm text-gray-600">
                    {employee.salarioMensual ? `$${employee.salarioMensual.toLocaleString('es-MX')}` : 'No especificado'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Salario Mensual (en texto):</span>
                  <p className="text-sm text-gray-600">{numeroATexto(employee.salarioMensual)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Área:</span>
                  <p className="text-sm text-gray-600">{employee.area || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Región:</span>
                  <p className="text-sm text-gray-600">{employee.region || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Contrato:</span>
                  <p className="text-sm text-gray-600">{employee.contrato || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Horario:</span>
                  <p className="text-sm text-gray-600">{employee.horario || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Sucursal:</span>
                  <p className="text-sm text-gray-600">{employee.sucursal || 'No especificado'}</p>
                </div>
              </div>
            </div>

            {/* Columna 3: Información Adicional */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Adicional</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Jefe Directo:</span>
                  <p className="text-sm text-gray-600">{employee.jefeDirecto || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">SD (Sueldo Diario):</span>
                  <p className="text-sm text-gray-600">
                    {employee.sd ? `$${employee.sd.toLocaleString('es-MX')}` : 'No especificado'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">SDI (Sueldo Diario Integrado):</span>
                  <p className="text-sm text-gray-600">
                    {employee.sdi ? `$${employee.sdi.toLocaleString('es-MX')}` : 'No especificado'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Documentos:</span>
                  <p className="text-sm text-gray-600">
                    {employee.documents?.length || 0} documentos
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Contacto y Dirección */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto y Dirección</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Teléfono Casa:</span>
                <p className="text-sm text-gray-600">{employee.telefonoCasa || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Teléfono Móvil:</span>
                <p className="text-sm text-gray-600">{employee.telefonoMovil || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Correo Electrónico:</span>
                <p className="text-sm text-gray-600">{employee.correoElectronico || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Correo Empresa:</span>
                <p className="text-sm text-gray-600">{employee.correoEmpresa || 'No especificado'}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-700">Dirección Completa:</span>
                <p className="text-sm text-gray-600">{employee.direccionCompleta || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Estado:</span>
                <p className="text-sm text-gray-600">{employee.estado || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">CP Fiscal:</span>
                <p className="text-sm text-gray-600">{employee.cpFiscal || 'No especificado'}</p>
              </div>
            </div>
          </div>

          {/* Sección de Datos Legales */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Legales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">RFC:</span>
                <p className="text-sm text-gray-600">{employee.rfc || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">CURP:</span>
                <p className="text-sm text-gray-600">{employee.curp || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">NSS:</span>
                <p className="text-sm text-gray-600">{employee.nss || 'No especificado'}</p>
              </div>
            </div>
          </div>

          {/* Sección de Datos Financieros */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Financieros</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Banco:</span>
                <p className="text-sm text-gray-600">{employee.banco || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Número de Cuenta:</span>
                <p className="text-sm text-gray-600">{employee.numeroCuenta || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">CLABE:</span>
                <p className="text-sm text-gray-600">{employee.clabe || 'No especificado'}</p>
              </div>
            </div>
          </div>

          {/* Sección de Uniformes */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Uniformes</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Talla Camisa:</span>
                <p className="text-sm text-gray-600">{employee.tallaCamisa || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Talla Playera:</span>
                <p className="text-sm text-gray-600">{employee.tallaPlayera || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Talla Pantalón:</span>
                <p className="text-sm text-gray-600">{employee.tallaPantalon || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Talla Zapatos:</span>
                <p className="text-sm text-gray-600">{employee.tallaZapatos || 'No especificado'}</p>
              </div>
            </div>
          </div>

          {/* Sección de Beneficiarios */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Beneficiarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Beneficiario 1</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Nombre:</span>
                    <p className="text-sm text-gray-600">{employee.beneficiario1 || 'No especificado'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Fecha de Nacimiento:</span>
                    <p className="text-sm text-gray-600">
                      {employee.fechaNacBeneficiario1 ? new Date(employee.fechaNacBeneficiario1).toLocaleDateString('es-MX') : 'No especificada'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Porcentaje:</span>
                    <p className="text-sm text-gray-600">{employee.porcentaje1 ? `${employee.porcentaje1}%` : 'No especificado'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Beneficiario 2</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Nombre:</span>
                    <p className="text-sm text-gray-600">{employee.beneficiario2 || 'No especificado'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Fecha de Nacimiento:</span>
                    <p className="text-sm text-gray-600">
                      {employee.fechaNacBeneficiario2 ? new Date(employee.fechaNacBeneficiario2).toLocaleDateString('es-MX') : 'No especificada'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Porcentaje:</span>
                    <p className="text-sm text-gray-600">{employee.porcentaje2 ? `${employee.porcentaje2}%` : 'No especificado'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Sección de Archivo Digital */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Archivo Digital</h3>
              {user && (user.role === 'ADMIN' || user.role === 'RH') && (
                <button
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                >
                  {showUploadForm ? 'Cancelar' : 'Subir Documento'}
                </button>
              )}
            </div>

            {/* Formulario de subida de documentos (solo para RH y Admin) */}
            {showUploadForm && user && (user.role === 'ADMIN' || user.role === 'RH') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-3">Subir Nuevo Documento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Documento *
                    </label>
                    <select
                      value={newDocument.tipo_documento}
                      onChange={(e) => setNewDocument({...newDocument, tipo_documento: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccionar tipo</option>
                      {allowedDocumentTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Archivo *
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      required
                    />
                    {newDocument.document && (
                      <p className="mt-1 text-sm text-gray-600">
                        Archivo seleccionado: {newDocument.document.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleUploadDocument}
                    disabled={uploading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Subiendo...' : 'Subir Documento'}
                  </button>
                </div>
              </div>
            )}

            {/* Lista de documentos */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {documents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo de Documento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre del Archivo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha de Subida
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tamaño
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {doc.tipo_documento}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {doc.nombre_archivo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(doc.uploaded_at).toLocaleDateString('es-MX')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doc.size_bytes ? `${Math.round(doc.size_bytes / 1024)} KB` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDownloadDocument(doc.id, doc.nombre_archivo)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Descargar
                            </button>
                            {user && (user.role === 'ADMIN' || user.role === 'RH') && (
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Eliminar
                              </button>
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
                    <p className="text-gray-400 text-sm mt-2">
                      Haz clic en "Subir Documento" para agregar el primer documento.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Editar Información del Empleado</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Datos Personales */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Personales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Clave</label>
                      <input
                        type="text"
                        name="clave"
                        value={editForm.clave}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                      <input
                        type="text"
                        name="nombres"
                        value={editForm.nombres}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno</label>
                      <input
                        type="text"
                        name="apellidoPaterno"
                        value={editForm.apellidoPaterno}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
                      <input
                        type="text"
                        name="apellidoMaterno"
                        value={editForm.apellidoMaterno}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        name="fechaNacimiento"
                        value={editForm.fechaNacimiento}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lugar de Nacimiento</label>
                      <input
                        type="text"
                        name="lugarNacimiento"
                        value={editForm.lugarNacimiento}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
                      <input
                        type="text"
                        name="estadoCivil"
                        value={editForm.estadoCivil}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
                      <input
                        type="text"
                        name="nacionalidad"
                        value={editForm.nacionalidad}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                      <select
                        name="sexo"
                        value={editForm.sexo}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nivel Académico</label>
                      <input
                        type="text"
                        name="nivelAcademico"
                        value={editForm.nivelAcademico}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Datos Laborales */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Laborales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Puesto ID *</label>
                      <input
                        type="text"
                        name="puestoId"
                        value={editForm.puestoId}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ID del puesto (ej: clm...)"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso *</label>
                      <input
                        type="date"
                        name="fecha_ingreso"
                        value={editForm.fecha_ingreso}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
                      <select
                        name="estatus"
                        value={editForm.estatus}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                      <input
                        type="text"
                        name="sucursal"
                        value={editForm.sucursal}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                      <input
                        type="text"
                        name="area"
                        value={editForm.area}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Región</label>
                      <input
                        type="text"
                        name="region"
                        value={editForm.region}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contrato</label>
                      <input
                        type="text"
                        name="contrato"
                        value={editForm.contrato}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
                      <input
                        type="text"
                        name="horario"
                        value={editForm.horario}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salario Mensual</label>
                      <input
                        type="number"
                        step="0.01"
                        name="salary"
                        value={editForm.salary}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jefe Directo</label>
                      <input
                        type="text"
                        name="jefeDirecto"
                        value={editForm.jefeDirecto}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SD (Sueldo Diario)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="sd"
                        value={editForm.sd}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SDI (Sueldo Diario Integrado)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="sdi"
                        value={editForm.sdi}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Contacto y Dirección */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto y Dirección</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Casa</label>
                      <input
                        type="text"
                        name="telefonoCasa"
                        value={editForm.telefonoCasa}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Móvil</label>
                      <input
                        type="text"
                        name="telefonoMovil"
                        value={editForm.telefonoMovil}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        name="correoElectronico"
                        value={editForm.correoElectronico}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Correo Empresa</label>
                      <input
                        type="email"
                        name="correoEmpresa"
                        value={editForm.correoEmpresa}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Completa</label>
                      <textarea
                        name="direccionCompleta"
                        value={editForm.direccionCompleta}
                        onChange={handleEditFormChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <input
                        type="text"
                        name="estado"
                        value={editForm.estado}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CP Fiscal</label>
                      <input
                        type="text"
                        name="cpFiscal"
                        value={editForm.cpFiscal}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Datos Legales */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Legales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RFC *</label>
                      <input
                        type="text"
                        name="rfc"
                        value={editForm.rfc}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CURP *</label>
                      <input
                        type="text"
                        name="curp"
                        value={editForm.curp}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">NSS *</label>
                      <input
                        type="text"
                        name="nss"
                        value={editForm.nss}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Datos Financieros */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Financieros</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                      <input
                        type="text"
                        name="banco"
                        value={editForm.banco}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cuenta</label>
                      <input
                        type="text"
                        name="numeroCuenta"
                        value={editForm.numeroCuenta}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CLABE</label>
                      <input
                        type="text"
                        name="clabe"
                        value={editForm.clabe}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Uniformes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Uniformes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Talla Camisa</label>
                      <input
                        type="text"
                        name="tallaCamisa"
                        value={editForm.tallaCamisa}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Talla Playera</label>
                      <input
                        type="text"
                        name="tallaPlayera"
                        value={editForm.tallaPlayera}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Talla Pantalón</label>
                      <input
                        type="text"
                        name="tallaPantalon"
                        value={editForm.tallaPantalon}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Talla Zapatos</label>
                      <input
                        type="text"
                        name="tallaZapatos"
                        value={editForm.tallaZapatos}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Beneficiarios */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Beneficiarios</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Beneficiario 1</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                          <input
                            type="text"
                            name="beneficiario1"
                            value={editForm.beneficiario1}
                            onChange={handleEditFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                          <input
                            type="date"
                            name="fechaNacBeneficiario1"
                            value={editForm.fechaNacBeneficiario1}
                            onChange={handleEditFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            name="porcentaje1"
                            value={editForm.porcentaje1}
                            onChange={handleEditFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Beneficiario 2</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                          <input
                            type="text"
                            name="beneficiario2"
                            value={editForm.beneficiario2}
                            onChange={handleEditFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                          <input
                            type="date"
                            name="fechaNacBeneficiario2"
                            value={editForm.fechaNacBeneficiario2}
                            onChange={handleEditFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            name="porcentaje2"
                            value={editForm.porcentaje2}
                            onChange={handleEditFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
