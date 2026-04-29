'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function ComprasDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const requestId = params.id;
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Estado para las cotizaciones
  const [quotes, setQuotes] = useState([
    { proveedor: '', monto: '', archivoUrl: '', fileName: '' },
    { proveedor: '', monto: '', archivoUrl: '', fileName: '' },
    { proveedor: '', monto: '', archivoUrl: '', fileName: '' }
  ]);
  
  // Estado para el modal de PDF
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');
  
  // Estado para edición de montos
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [updatingAmount, setUpdatingAmount] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'COMPRAS' || user.accessibleModules?.includes('COMPRAS'))) {
      fetchRequestDetails();
    }
  }, [user, requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/purchases/${requestId}`);
      setRequest(response.data.request);
      
      // Si ya hay cotizaciones, cargarlas en el estado
      if (response.data.request?.quotes?.length > 0) {
        const existingQuotes = [...quotes];
        response.data.request.quotes.forEach((quote, index) => {
          if (index < 3) {
            existingQuotes[index] = {
              proveedor: quote.proveedor || '',
              monto: quote.monto?.toString() || '',
              archivoUrl: quote.archivoUrl || ''
            };
          }
        });
        setQuotes(existingQuotes);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error('Error al cargar los detalles de la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteChange = (index, field, value) => {
    const newQuotes = [...quotes];
    newQuotes[index] = {
      ...newQuotes[index],
      [field]: value
    };
    setQuotes(newQuotes);
  };

  const handleUploadQuotes = async () => {
    // Validar que al menos una cotización tenga proveedor y monto
    const validQuotes = quotes.filter(q => q.proveedor.trim() && q.monto.trim());
    
    if (validQuotes.length === 0) {
      toast.error('Debe ingresar al menos una cotización con proveedor y monto');
      return;
    }

    // Validar montos
    const invalidAmounts = validQuotes.filter(q => isNaN(parseFloat(q.monto)) || parseFloat(q.monto) <= 0);
    if (invalidAmounts.length > 0) {
      toast.error('Los montos deben ser números mayores a 0');
      return;
    }

    try {
      setUploading(true);
      
      const quotesToSend = validQuotes.map(q => ({
        proveedor: q.proveedor.trim(),
        monto: parseFloat(q.monto),
        archivoUrl: q.archivoUrl.trim() || null
      }));

      await api.post(`/purchases/${requestId}/quotes`, { quotes: quotesToSend });
      
      toast.success('Cotizaciones subidas exitosamente');
      fetchRequestDetails(); // Recargar datos
    } catch (error) {
      console.error('Error uploading quotes:', error);
      toast.error(error.response?.data?.message || 'Error al subir las cotizaciones');
    } finally {
      setUploading(false);
    }
  };

  // Función para subir una sola cotización
  const handleUploadSingleQuote = async (index) => {
    const quote = quotes[index];
    
    // Validar que la cotización tenga proveedor y monto
    if (!quote.proveedor?.trim() || !quote.monto?.trim()) {
      toast.error('Debe ingresar proveedor y monto para esta cotización');
      return;
    }

    // Validar monto
    if (isNaN(parseFloat(quote.monto)) || parseFloat(quote.monto) <= 0) {
      toast.error('El monto debe ser un número mayor a 0');
      return;
    }

    try {
      setUploading(true);
      
      let archivoUrl = quote.archivoUrl?.trim() || null;
      
      // Si hay un archivo seleccionado pero no se ha subido aún, subirlo primero
      if (quote.fileName && !quote.archivoUrl) {
        // Buscar el input de archivo correspondiente
        const fileInput = document.querySelector(`input[type="file"][data-index="${index}"]`);
        if (fileInput && fileInput.files && fileInput.files[0]) {
          const file = fileInput.files[0];
          
          // Validar tamaño (10MB máximo)
          if (file.size > 10 * 1024 * 1024) {
            toast.error('El archivo es demasiado grande. Máximo 10MB.');
            setUploading(false);
            return;
          }
          
          // Validar tipo de archivo
          const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
          if (!validTypes.includes(file.type)) {
            toast.error('Formato no válido. Solo PDF, PNG o JPG.');
            setUploading(false);
            return;
          }
          
          // Crear FormData para enviar el archivo
          const formData = new FormData();
          formData.append('file', file);
          
          // Enviar archivo al backend para una cotización nueva
          const uploadResponse = await api.post(`/purchases/${requestId}/upload-quote-file`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            params: {
              quoteIndex: index
            }
          });
          
          // Obtener la URL del archivo subido directamente de la respuesta
          archivoUrl = uploadResponse.data?.data?.fileUrl || null;
          
          if (archivoUrl) {
            toast.success('Archivo subido exitosamente');
          }
        }
      }
      
      // Crear el objeto de cotización con la URL del archivo obtenida
      const quoteToSend = {
        proveedor: quote.proveedor.trim(),
        monto: parseFloat(quote.monto),
        archivoUrl: archivoUrl
      };

      // Enviar la cotización a la base de datos
      const response = await api.post(`/purchases/${requestId}/quotes`, { quotes: [quoteToSend] });
      
      toast.success(`Cotización ${index + 1} subida exitosamente`);
      
      // Actualizar el estado inmediatamente con la respuesta del backend
      if (response.data?.data?.quotes) {
        // Actualizar el estado de la solicitud con las nuevas cotizaciones
        setRequest(prev => ({
          ...prev,
          quotes: [...(prev?.quotes || []), ...response.data.data.quotes]
        }));
        
        // Limpiar la cotización del formulario
        const newQuotes = [...quotes];
        newQuotes[index] = { proveedor: '', monto: '', archivoUrl: '', fileName: '' };
        setQuotes(newQuotes);
      }
      
      // También recargar datos para asegurar consistencia
      fetchRequestDetails();
    } catch (error) {
      console.error('Error uploading single quote:', error);
      toast.error(error.response?.data?.message || 'Error al subir la cotización');
    } finally {
      setUploading(false);
    }
  };

  const handleMarkAsDelivered = async () => {
    if (!confirm('¿Marcar esta solicitud como entregada?')) return;
    
    try {
      await api.post(`/purchases/${requestId}/deliver`);
      toast.success('Solicitud marcada como entregada');
      fetchRequestDetails();
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error(error.response?.data?.message || 'Error al marcar como entregada');
    }
  };

  const handleAuthorizeRequest = async () => {
    if (!confirm('¿Aprobar esta solicitud especial (mayor a $28,000 MXN)?')) return;
    
    try {
      await api.post(`/purchases/${requestId}/authorize`);
      toast.success('Solicitud autorizada exitosamente');
      fetchRequestDetails();
    } catch (error) {
      console.error('Error authorizing request:', error);
      toast.error(error.response?.data?.message || 'Error al autorizar la solicitud');
    }
  };

  const handleFileUpload = async (quoteId, file) => {
    if (!file) {
      toast.error('Debe seleccionar un archivo primero');
      return;
    }
    
    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }
    
    // Validar tipo de archivo
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Solo PDF, PNG o JPG.');
      return;
    }
    
    try {
      setUploading(true);
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);
      
      // Enviar archivo al backend
      const response = await api.post(`/purchases/${requestId}/quotes/${quoteId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Archivo subido exitosamente');
      
      // Actualizar el estado inmediatamente con la respuesta del backend
      if (response.data?.data?.quote) {
        // Actualizar la cotización específica en el estado
        setRequest(prev => ({
          ...prev,
          quotes: prev.quotes.map(q => 
            q.id === quoteId ? { ...q, archivoUrl: response.data.data.quote.archivoUrl } : q
          )
        }));
      }
      
      // También recargar datos para asegurar consistencia
      fetchRequestDetails();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUploadForNewQuote = async (event, index) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }
    
    // Validar tipo de archivo
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Solo PDF, PNG o JPG.');
      return;
    }
    
    try {
      setUploading(true);
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);
      
      // Enviar archivo al backend para una cotización nueva
      const response = await api.post(`/purchases/${requestId}/upload-quote-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          quoteIndex: index
        }
      });
      
      // Actualizar el estado con la URL del archivo subido
      const newQuotes = [...quotes];
      newQuotes[index] = {
        ...newQuotes[index],
        archivoUrl: response.data?.data?.fileUrl || response.data?.fileUrl,
        fileName: file.name
      };
      setQuotes(newQuotes);
      
      toast.success('Archivo subido exitosamente');
    } catch (error) {
      console.error('Error uploading file for new quote:', error);
      toast.error(error.response?.data?.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
      // Limpiar el input de archivo
      event.target.value = '';
    }
  };

  // Función para iniciar la edición de un monto
  const startEditingAmount = (quoteId, currentAmount) => {
    setEditingQuoteId(quoteId);
    setEditingAmount(currentAmount.toString());
  };

  // Función para cancelar la edición
  const cancelEditingAmount = () => {
    setEditingQuoteId(null);
    setEditingAmount('');
  };

  // Función para guardar el monto editado
  const saveEditedAmount = async (quoteId) => {
    if (!editingAmount || isNaN(parseFloat(editingAmount)) || parseFloat(editingAmount) <= 0) {
      toast.error('El monto debe ser un número mayor a 0');
      return;
    }

    try {
      setUpdatingAmount(true);
      
      await api.put(`/purchases/${requestId}/quotes/${quoteId}/amount`, {
        monto: parseFloat(editingAmount)
      });
      
      toast.success('Monto actualizado exitosamente');
      fetchRequestDetails(); // Recargar datos
      cancelEditingAmount(); // Salir del modo edición
    } catch (error) {
      console.error('Error updating amount:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar el monto');
    } finally {
      setUpdatingAmount(false);
    }
  };

  const getStatusColor = (estatus) => {
    switch (estatus) {
      case 'NUEVO': return 'bg-red-100 text-red-800';
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800';
      case 'EN_AUTORIZACION': return 'bg-blue-100 text-blue-800';
      case 'APROBADO': return 'bg-green-100 text-green-800';
      case 'ENTREGADO': return 'bg-green-100 text-green-800';
      case 'CANCELADO': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (estatus) => {
    switch (estatus) {
      case 'NUEVO': return 'Nuevo';
      case 'PENDIENTE': return 'Pendiente';
      case 'EN_AUTORIZACION': return 'En Autorización';
      case 'APROBADO': return 'Aprobado';
      case 'ENTREGADO': return 'Entregado';
      case 'CANCELADO': return 'Cancelado';
      default: return estatus;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Función para abrir el modal con la cotización
  const handleViewQuote = (quote) => {
    if (!quote.archivoUrl) {
      toast.error('Archivo de cotización no disponible');
      return;
    }
    
    // Construir la URL completa del archivo
    // Nota: Las cotizaciones de compras ya tienen URLs completas desde el backend
    const encodedUrl = encodeURI(quote.archivoUrl);
    setPdfUrl(encodedUrl);
    setPdfTitle(`Cotización - ${quote.proveedor} - ${formatCurrency(quote.monto)}`);
    setShowPdfModal(true);
  };

  // Verificar permisos
  const hasAccess = user && (user.role === 'ADMIN' || user.role === 'COMPRAS' || user.accessibleModules?.includes('COMPRAS'));
  
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">No tiene permisos para acceder al panel de administración de compras.</p>
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
            <p className="mt-2 text-gray-600">Cargando detalles de la solicitud...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Solicitud no encontrada</h2>
            <p className="text-red-600 mt-1">La solicitud de compra no existe o no se pudo cargar.</p>
            <Link
              href="/dashboard/compras"
              className="mt-3 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              ← Volver a la lista
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedQuote = request?.quotes?.find(q => q.isSelected);
  const totalAmount = selectedQuote?.monto || 0;
  const requiresAuthorization = totalAmount > 28000;

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/dashboard/compras"
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Volver a la lista
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                  Solicitud de Compra #{request.folio}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.estatus)}`}>
                  {getStatusText(request.estatus)}
                </span>
              </div>
              <p className="text-gray-600">
                Departamento: {request.departamento?.nombre} • 
                Solicitante: {request.solicitante?.nombre} • 
                Fecha: {formatDate(request.fechaSolicitud)}
              </p>
            </div>
          </div>
        </div>

        {/* Flujo del proceso - Horizontal en la parte inicial */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Flujo del proceso</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${request.estatus === 'NUEVO' ? 'bg-red-100 text-red-800 border-2 border-red-300' : 'bg-gray-100 text-gray-800'}`}>
                1
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">NUEVO</div>
                <div className="text-xs text-gray-600">Subir cotizaciones</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${request.estatus === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' : 'bg-gray-100 text-gray-800'}`}>
                2
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">PENDIENTE</div>
                <div className="text-xs text-gray-600">Esperando selección</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${request.estatus === 'EN_AUTORIZACION' ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' : 'bg-gray-100 text-gray-800'}`}>
                3
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">EN AUTORIZACIÓN</div>
                <div className="text-xs text-gray-600">Solo si mayor a $28,000 MXN</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${request.estatus === 'APROBADO' ? 'bg-green-100 text-green-800 border-2 border-green-300' : 'bg-gray-100 text-gray-800'}`}>
                4
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">APROBADO</div>
                <div className="text-xs text-gray-600">Listo para entregar</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${request.estatus === 'ENTREGADO' ? 'bg-green-100 text-green-800 border-2 border-green-300' : 'bg-gray-100 text-gray-800'}`}>
                5
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">ENTREGADO</div>
                <div className="text-xs text-gray-600">Proceso completado</div>
              </div>
            </div>
          </div>
        </div>

        {/* Información del estado - Horizontal debajo de Flujo del proceso */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del estado</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Estado actual:</div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusColor(request.estatus)}`}>
                {getStatusText(request.estatus)}
              </div>
            </div>
            
            {selectedQuote && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Cotización seleccionada:</div>
                <div className="font-medium">{selectedQuote.proveedor}</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(selectedQuote.monto)}
                </div>
              </div>
            )}

            {requiresAuthorization && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-yellow-800">⚠️ Requiere autorización</div>
                <div className="text-sm text-yellow-700">
                  Esta solicitud supera los $28,000 MXN y requiere autorización adicional.
                </div>
              </div>
            )}

            {request.autorizadoPor && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Autorizado por:</div>
                <div className="font-medium">{request.autorizadoPor?.nombre}</div>
                <div className="text-sm text-gray-600">
                  Fecha: {formatDate(request.fechaAutorizacion)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Todo el contenido ahora en ancho completo */}
          <div className="space-y-6">
            {/* Justificación */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Justificación</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{request.justificacion}</p>
            </div>

            {/* Ítems solicitados */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ítems solicitados</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto/Servicio
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {request.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.productoServicio}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.cantidad}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.descripcion || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subir cotizaciones (para estados NUEVO o PENDIENTE con menos de 3 cotizaciones) - Solo formularios faltantes */}
            {(request.estatus === 'NUEVO' || request.estatus === 'PENDIENTE') && (!request.quotes || request.quotes.length < 3) && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Subir cotizaciones</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Sube hasta 3 cotizaciones de diferentes proveedores. Cada cotización puede incluir un archivo PDF/Imagen.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {quotes.map((quote, index) => {
                    // Solo mostrar formularios para cotizaciones que aún no existen
                    // Si ya hay 1 cotización subida, solo mostrar formularios 2 y 3
                    // Si ya hay 2 cotizaciones subidas, solo mostrar formulario 3
                    if (request.quotes && request.quotes.length > index) {
                      return null; // No mostrar formulario si ya existe una cotización en esta posición
                    }
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-xl p-6 flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="text-xl font-semibold text-gray-800 mb-6 text-center">
                          Cotización {index + 1}
                        </div>
                        
                        <div className="space-y-5 flex-grow">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Proveedor *
                            </label>
                            <input
                              type="text"
                              value={quote.proveedor}
                              onChange={(e) => handleQuoteChange(index, 'proveedor', e.target.value)}
                              placeholder="Nombre del proveedor"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Monto ($) *
                            </label>
                            <input
                              type="number"
                              value={quote.monto}
                              onChange={(e) => handleQuoteChange(index, 'monto', e.target.value)}
                              placeholder="0.00"
                              min="0.01"
                              step="0.01"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Archivo de cotización (opcional)
                            </label>
                            <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                data-index={index}
                                onChange={(e) => handleFileUploadForNewQuote(e, index)}
                                className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              PDF, PNG o JPG (máx. 10MB)
                            </p>
                          </div>
                          
                          {/* Mostrar nombre del archivo si ya se subió */}
                          {quote.fileName && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="truncate">Archivo: {quote.fileName}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Botón individual para subir esta cotización */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                          <button
                            onClick={() => handleUploadSingleQuote(index)}
                            disabled={uploading || !quote.proveedor.trim() || !quote.monto.trim()}
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-200 shadow-sm hover:shadow"
                          >
                            {uploading ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Subiendo...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span>Subir Cotización {index + 1}</span>
                              </>
                            )}
                          </button>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            {!quote.proveedor.trim() || !quote.monto.trim() ? 
                              'Completa proveedor y monto para habilitar' : 
                              '✓ Lista para subir'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-blue-700">
                          <strong>Nota:</strong> Cada cotización se sube individualmente. Completa los campos requeridos (proveedor y monto) para habilitar el botón de subida.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cotizaciones existentes - 3 Cards Horizontales (Modo Lectura) */}
            {request.quotes && request.quotes.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Cotizaciones subidas</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Cotizaciones ya registradas en el sistema. Haz clic en "Ver Cotización" para revisar los archivos PDF.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {request.quotes.map((quote, index) => (
                    <div 
                      key={quote.id} 
                      className={`p-5 rounded-lg border ${quote.isSelected ? 'border-green-300 bg-green-50' : 'border-gray-200'} flex flex-col`}
                    >
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-lg">{quote.proveedor}</span>
                            {quote.isSelected && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                Seleccionada
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Fecha: {formatDate(quote.fechaCotizacion)}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {formatCurrency(quote.monto)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Botón para ver/descargar archivo */}
                        {quote.archivoUrl && (
                          <div className="mt-4">
                            <button
                              onClick={() => handleViewQuote(quote)}
                              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Ver Cotización
                            </button>
                            <p className="text-xs text-gray-500 mt-1 text-center">
                              Se abrirá en modal
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gestión de autorización (solo para estado EN_AUTORIZACION y perfiles gerenciales/admin) */}
        {request.estatus === 'EN_AUTORIZACION' && (user.role === 'ADMIN' || user.role === 'COMPRAS') && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Autorización Gerencial</h2>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Solicitud Especial</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Esta solicitud supera los <strong>$28,000 MXN</strong> y requiere autorización gerencial.
                    </p>
                    <p className="mt-1">
                      Cotización seleccionada: <strong>{selectedQuote?.proveedor}</strong> - <strong>{formatCurrency(selectedQuote?.monto)}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Como usuario con permisos gerenciales, puedes aprobar esta solicitud especial.
            </p>
            <button
              onClick={handleAuthorizeRequest}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
            >
              ✅ Aprobar Compra Especial (mayor a $28k)
            </button>
          </div>
        )}

        {/* Gestión de entrega (solo para estado APROBADO) */}
        {request.estatus === 'APROBADO' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gestión de entrega</h2>
            <p className="text-sm text-gray-600 mb-4">
              Marca esta solicitud como entregada cuando se complete la compra.
            </p>
            <button
              onClick={handleMarkAsDelivered}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
            >
              ✅ Marcar como Entregado
            </button>
          </div>
        )}

        {/* Modal para visualizar PDFs */}
        {showPdfModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl h-5/6 flex flex-col">
              {/* Encabezado del modal */}
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">{pdfTitle}</h3>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              {/* Contenido del PDF */}
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={pdfUrl}
                  title={pdfTitle}
                  className="w-full h-full border-0"
                  style={{ minHeight: '500px' }}
                />
              </div>
              
              {/* Pie del modal */}
              <div className="flex justify-between items-center p-4 border-t">
                <div className="text-sm text-gray-600">
                  <p>Para descargar el PDF, haz clic derecho en el documento y selecciona "Guardar como"</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                  >
                    Abrir en nueva pestaña
                  </a>
                  <button
                    onClick={() => setShowPdfModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
