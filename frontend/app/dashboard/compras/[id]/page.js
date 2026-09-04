'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import QuoteSelectionModal from '@/components/QuoteSelectionModal';
import PurchaseOrderModal from '@/components/PurchaseOrderModal';
import PurchaseComments from '@/components/PurchaseComments';

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
  
  // Estado para edición de cotizaciones (proveedor + monto)
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [editingQuoteData, setEditingQuoteData] = useState({ proveedor: '', monto: '' });
  const [updatingAmount, setUpdatingAmount] = useState(false);

  // Estado para edición de items
  const [editingItems, setEditingItems] = useState(false);
  const [editedItems, setEditedItems] = useState([]);
  const [savingItems, setSavingItems] = useState(false);

  
  // Estado para el modal de selección de cotización

  const [showQuoteSelectionModal, setShowQuoteSelectionModal] = useState(false);
  
  // Estado para la comparativa de cotizaciones
  const [comparison, setComparison] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  
  // Estado para la orden de compra
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [generatingOrder, setGeneratingOrder] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'COMPRAS' || user.accessibleModules?.includes('COMPRAS'))) {
      fetchRequestDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/purchases/details/${requestId}`);
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

  // Función para subir una sola cotización (archivo + datos en una sola llamada)
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
      
      // Buscar el input de archivo correspondiente
      const fileInput = document.querySelector(`input[type="file"][data-index="${index}"]`);
      const file = fileInput?.files?.[0];
      
      // Validar archivo si existe
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error('El archivo es demasiado grande. Máximo 10MB.');
          setUploading(false);
          return;
        }
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
          toast.error('Formato no válido. Solo PDF, PNG o JPG.');
          setUploading(false);
          return;
        }
      }
      
      // Crear FormData con todos los datos (archivo + cotización)
      const formData = new FormData();
      formData.append('proveedor', quote.proveedor.trim());
      formData.append('monto', quote.monto.trim());
      if (file) {
        formData.append('file', file);
      } else if (quote.archivoUrl) {
        // Si no hay archivo nuevo pero ya se subió uno antes, enviar la URL
        formData.append('archivoUrl', quote.archivoUrl);
      }
      
      // Enviar todo en una sola llamada
      const response = await api.post(`/purchases/${requestId}/quotes/upload-with-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success(`Cotización ${index + 1} subida exitosamente`);
      
      // Actualizar request con los datos de la respuesta para ocultar el formulario inmediatamente
      if (response.data?.data?.quotes) {
        setRequest(prev => ({
          ...prev,
          quotes: [...(prev?.quotes || []), ...response.data.data.quotes]
        }));
      }
      
      // Limpiar la cotización del formulario
      const newQuotes = [...quotes];
      newQuotes[index] = { proveedor: '', monto: '', archivoUrl: '', fileName: '' };
      setQuotes(newQuotes);
      
      // Recargar datos completos del backend en segundo plano (sin await)
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

  // Función para abrir el modal de orden de compra
  const handleGenerateOrder = () => {
    setShowPurchaseOrderModal(true);
  };

  // Función para cargar la orden de compra existente
  const fetchPurchaseOrder = async () => {
    try {
      setLoadingOrder(true);
      const response = await api.get(`/purchases/${requestId}/purchase-order`);
      if (response.data.order) {
        setPurchaseOrder(response.data.order);
      }
    } catch (error) {
      console.error('Error fetching purchase order:', error);
    } finally {
      setLoadingOrder(false);
    }
  };

  // Cargar orden de compra si la solicitud está aprobada
  useEffect(() => {
    if (request?.estatus === 'APROBADO') {
      fetchPurchaseOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.estatus]);

  const handleAuthorizeRequest = async () => {
    if (!confirm('¿Aprobar esta solicitud especial (mayor a $50,000 MXN)?')) return;
    
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

  // Función para eliminar una solicitud (Admin/Compras)
  const handleDeleteRequest = async () => {
    if (!confirm('⚠️ ¿Estás seguro de eliminar esta solicitud?\n\nEsta acción es irreversible y eliminará TODOS los datos relacionados (cotizaciones, comentarios, aprobadores, etc.).')) {
      return;
    }
    
    try {
      await api.delete(`/purchases/${requestId}`);
      toast.success('Solicitud eliminada exitosamente');
      router.push('/dashboard/compras');
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar la solicitud');
    }
  };

  // Función para cancelar una solicitud
  const handleCancelRequest = async () => {
    if (!confirm('¿Cancelar esta solicitud de compra?')) return;
    
    try {
      await api.post(`/purchases/${requestId}/cancel`);
      toast.success('Solicitud cancelada exitosamente');
      fetchRequestDetails();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error(error.response?.data?.message || 'Error al cancelar la solicitud');
    }
  };

  // ── Funciones para edición de items ──
  const startEditingItems = () => {
    setEditedItems(request.items?.map(item => ({
      id: item.id,
      productoServicio: item.productoServicio,
      cantidad: item.cantidad.toString(),
      descripcion: item.descripcion || ''
    })) || []);
    setEditingItems(true);
  };

  const cancelEditingItems = () => {
    setEditingItems(false);
    setEditedItems([]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...editedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedItems(newItems);
  };

  const addItemRow = () => {
    setEditedItems(prev => [...prev, { id: null, productoServicio: '', cantidad: '', descripcion: '' }]);
  };

  const removeItemRow = (index) => {
    if (editedItems.length <= 1) {
      toast.error('Debe haber al menos un ítem');
      return;
    }
    setEditedItems(prev => prev.filter((_, i) => i !== index));
  };

  const saveEditedItems = async () => {
    // Validar items
    for (let i = 0; i < editedItems.length; i++) {
      const item = editedItems[i];
      if (!item.productoServicio?.trim()) {
        toast.error(`El ítem ${i + 1} debe tener un producto/servicio`);
        return;
      }
      if (!item.cantidad || isNaN(parseFloat(item.cantidad)) || parseFloat(item.cantidad) <= 0) {
        toast.error(`El ítem ${i + 1} debe tener una cantidad válida`);
        return;
      }
    }

    try {
      setSavingItems(true);
      const itemsToSend = editedItems.map(item => ({
        productoServicio: item.productoServicio.trim(),
        cantidad: parseFloat(item.cantidad),
        descripcion: item.descripcion?.trim() || null
      }));

      await api.put(`/purchases/${requestId}/items`, { items: itemsToSend });
      toast.success('Items actualizados exitosamente');
      setEditingItems(false);
      setEditedItems([]);
      fetchRequestDetails();
    } catch (error) {
      console.error('Error saving items:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar los items');
    } finally {
      setSavingItems(false);
    }
  };

  // Función para iniciar la edición de una cotización (proveedor + monto)
  const startEditingQuote = (quote) => {


    setEditingQuoteId(quote.id);
    setEditingQuoteData({
      proveedor: quote.proveedor || '',
      monto: quote.monto?.toString() || ''
    });
  };

  // Función para cancelar la edición
  const cancelEditingQuote = () => {
    setEditingQuoteId(null);
    setEditingQuoteData({ proveedor: '', monto: '' });
  };

  // Función para guardar la cotización editada
  const saveEditedQuote = async (quoteId) => {
    const { proveedor, monto } = editingQuoteData;
    
    if (!proveedor || !proveedor.trim()) {
      toast.error('El nombre del proveedor no puede estar vacío');
      return;
    }
    if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
      toast.error('El monto debe ser un número mayor a 0');
      return;
    }

    try {
      setUpdatingAmount(true);
      
      await api.put(`/purchases/${requestId}/quotes/${quoteId}`, {
        proveedor: proveedor.trim(),
        monto: parseFloat(monto)
      });
      
      toast.success('Cotización actualizada exitosamente');
      fetchRequestDetails(); // Recargar datos
      cancelEditingQuote(); // Salir del modo edición
    } catch (error) {
      console.error('Error updating quote:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar la cotización');
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
  const requiresAuthorization = totalAmount > 50000;

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
            
            {/* Botones de acción en el header */}
            <div className="flex gap-2">
              {/* Cancelar solicitud - disponible para Admin/Compras o el solicitante */}
              {(user.role === 'ADMIN' || user.role === 'COMPRAS') && request.estatus !== 'CANCELADO' && request.estatus !== 'ENTREGADO' && (
                <button
                  onClick={handleCancelRequest}
                  className="px-4 py-2 border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-md font-medium text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar
                </button>
              )}
              
              {/* Eliminar solicitud - solo Admin/Compras */}
              {(user.role === 'ADMIN' || user.role === 'COMPRAS') && (
                <button
                  onClick={handleDeleteRequest}
                  className="px-4 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-md font-medium text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              )}
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
                <div className="text-xs text-gray-600">Solo si mayor a $50,000 MXN</div>
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
                  Esta solicitud supera los $50,000 MXN y requiere autorización adicional.
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Ítems solicitados</h2>
                {/* Botón para editar items - solo en estado NUEVO */}
                {request.estatus === 'NUEVO' && !editingItems && (
                  <button
                    onClick={startEditingItems}
                    className="px-3 py-1.5 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md text-sm font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar items
                  </button>
                )}
              </div>

              {editingItems ? (
                /* ── MODO EDICIÓN DE ITEMS ── */
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto/Servicio</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {editedItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={item.productoServicio}
                                onChange={(e) => handleItemChange(index, 'productoServicio', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Producto o servicio"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={item.cantidad}
                                onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                min="0.01"
                                step="0.01"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={item.descripcion}
                                onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Descripción (opcional)"
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => removeItemRow(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Eliminar ítem"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={addItemRow}
                      className="px-3 py-1.5 border border-dashed border-gray-400 text-gray-600 hover:text-gray-800 hover:border-gray-600 rounded-md text-sm font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Agregar ítem
                    </button>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={saveEditedItems}
                      disabled={savingItems}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      {savingItems ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Guardar cambios
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelEditingItems}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* ── MODO VISUALIZACIÓN ── */
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto/Servicio</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {request.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
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
              )}
            </div>


            {/* Subir cotizaciones (para estados NUEVO o PENDIENTE con menos de 3 cotizaciones) - Solo Admin/Compras */}
            {(request.estatus === 'NUEVO' || request.estatus === 'PENDIENTE') && (!request.quotes || request.quotes.length < 3) && (user.role === 'ADMIN' || user.role === 'COMPRAS') && (
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

            {/* Cotizaciones existentes - visible siempre que haya cotizaciones */}
            {request.quotes && request.quotes.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Cotizaciones subidas</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Cotizaciones ya registradas en el sistema. Haz clic en &ldquo;Ver Cotización&rdquo; para revisar los archivos PDF.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {request.quotes.map((quote, index) => {
                    const isEditing = editingQuoteId === quote.id;
                    const canEdit = user.role === 'ADMIN' || user.role === 'COMPRAS';
                    
                    return (
                      <div 
                        key={quote.id} 
                        className={`p-5 rounded-lg border ${quote.isSelected ? 'border-green-300 bg-green-50' : 'border-gray-200'} flex flex-col`}
                      >
                        {isEditing ? (
                          /* ── MODO EDICIÓN ── */
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-blue-700">Editando cotización</span>
                              <button
                                onClick={cancelEditingQuote}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Proveedor</label>
                              <input
                                type="text"
                                value={editingQuoteData.proveedor}
                                onChange={(e) => setEditingQuoteData(prev => ({ ...prev, proveedor: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Monto ($)</label>
                              <input
                                type="number"
                                value={editingQuoteData.monto}
                                onChange={(e) => setEditingQuoteData(prev => ({ ...prev, monto: e.target.value }))}
                                min="0.01"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEditedQuote(quote.id)}
                                disabled={updatingAmount}
                                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                              >
                                {updatingAmount ? 'Guardando...' : 'Guardar'}
                              </button>
                              <button
                                onClick={cancelEditingQuote}
                                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ── MODO VISUALIZACIÓN ── */
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
                            <div className="mt-4">
                              {quote.archivoUrl ? (
                                <>
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
                                </>
                              ) : (
                                <div className="text-center">
                                  <p className="text-xs text-red-500 mb-2">
                                    ⚠️ Archivo de cotización no disponible
                                  </p>
                                  {/* Botón para subir archivo a cotización existente */}
                                  {canEdit && (
                                    <div>
                                      <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        id={`upload-file-${quote.id}`}
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) handleFileUpload(quote.id, file);
                                        }}
                                        className="hidden"
                                      />
                                      <label
                                        htmlFor={`upload-file-${quote.id}`}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium cursor-pointer"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Subir archivo
                                      </label>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Botón de editar cotización — se permite aunque ya esté seleccionada/aceptada,
                                para corregir montos mal capturados; el backend recalcula si se requiere
                                autorización según el nuevo monto. CANCELADO se bloquea para todos; en
                                ENTREGADO solo ADMIN puede seguir editando (COMPRAS ya no). */}
                            {canEdit && request.estatus !== 'CANCELADO' && (request.estatus !== 'ENTREGADO' || user.role === 'ADMIN') && (
                              <button
                                onClick={() => startEditingQuote(quote)}
                                className="w-full mt-2 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Editar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>


                {/* Información de cotización ya seleccionada */}
                {selectedQuote && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm text-green-700">
                            <strong>Cotización seleccionada:</strong> {selectedQuote.proveedor} - {formatCurrency(selectedQuote.monto)}
                          </p>
                          {selectedQuote.comentarios && (
                            <p className="text-sm text-green-600 mt-1">
                              <strong>Comentarios:</strong> {selectedQuote.comentarios}
                            </p>
                          )}
                          {selectedQuote.fechaEstimadaEntrega && (
                            <p className="text-sm text-green-600 mt-1">
                              <strong>Fecha estimada de entrega:</strong> {formatDate(selectedQuote.fechaEstimadaEntrega)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botón para seleccionar cotización (independiente, fuera del bloque de subir cotizaciones) */}
            {request.estatus === 'PENDIENTE' && !selectedQuote && request.quotes && request.quotes.length > 0 && (user.role === 'ADMIN' || user.role === 'COMPRAS') && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-yellow-700">
                        <strong>Acción requerida:</strong> Revisa las cotizaciones y selecciona la más conveniente. 
                        Si la compra supera los $50,000 MXN, se solicitará autorización a Dirección/RH automáticamente.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowQuoteSelectionModal(true)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-3 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Seleccionar Cotización
                </button>
              </div>
            )}

            {/* Comparativa de cotizaciones - visible para todos */}
            {request.quotes && request.quotes.length > 1 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Comparativa de Cotizaciones</h2>
                  <button
                    onClick={async () => {
                      if (showComparison && comparison) {
                        setShowComparison(false);
                        return;
                      }
                      setLoadingComparison(true);
                      try {
                        const response = await api.get(`/purchases/${requestId}/comparison`);
                        setComparison(response.data.comparison);
                        setShowComparison(true);
                      } catch (error) {
                        console.error('Error fetching comparison:', error);
                        toast.error('Error al cargar la comparativa');
                      } finally {
                        setLoadingComparison(false);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {showComparison ? 'Ocultar comparativa' : 'Ver comparativa'}
                  </button>
                </div>

                {loadingComparison && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-sm text-gray-600">Cargando comparativa...</p>
                  </div>
                )}

                {showComparison && comparison && (
                  <div className="space-y-6">
                    {/* Resumen de la comparativa */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-500">Total cotizaciones</div>
                        <div className="text-lg font-bold text-gray-900">{comparison.resumen.totalCotizaciones}</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-500">Monto mínimo</div>
                        <div className="text-lg font-bold text-green-700">{formatCurrency(comparison.resumen.montoMinimo)}</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-500">Monto máximo</div>
                        <div className="text-lg font-bold text-red-700">{formatCurrency(comparison.resumen.montoMaximo)}</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-500">Promedio</div>
                        <div className="text-lg font-bold text-blue-700">{formatCurrency(comparison.resumen.montoPromedio)}</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-500">Ahorro potencial</div>
                        <div className="text-lg font-bold text-yellow-700">{formatCurrency(comparison.resumen.ahorroPotencial)}</div>
                      </div>
                    </div>

                    {/* Tabla comparativa detallada */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Diferencia vs mejor</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">% Diferencia</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mejor opción</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Archivo</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {comparison.quotes.map((quote, idx) => (
                            <tr key={quote.id} className={`${quote.esMejorOpcion ? 'bg-green-50' : ''} ${quote.isSelected ? 'bg-blue-50' : ''}`}>
                              <td className="px-4 py-3 text-sm text-gray-900">{quote.rank}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {quote.proveedor}
                                {quote.isSelected && (
                                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">Seleccionada</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(quote.monto)}</td>
                              <td className={`px-4 py-3 text-sm text-right ${quote.diferenciaVsMejor > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {quote.diferenciaVsMejor > 0 ? `+${formatCurrency(quote.diferenciaVsMejor)}` : '$0.00'}
                              </td>
                              <td className={`px-4 py-3 text-sm text-right ${quote.diferenciaPorcentual > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {quote.diferenciaPorcentual > 0 ? `+${quote.diferenciaPorcentual}%` : '0%'}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                {quote.esMejorOpcion ? (
                                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-semibold">✓ Mejor opción</span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                {quote.archivoUrl ? (
                                  <button
                                    onClick={() => handleViewQuote(quote)}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                  >
                                    Ver PDF
                                  </button>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Alerta si requiere autorización */}
                    {comparison.resumen.requiereAutorizacion && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700">
                          <strong>⚠️ Atención:</strong> La mejor cotización supera los $50,000 MXN. 
                          Esta compra requerirá autorización de Dirección/RH.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sección de comentarios tipo chat/blog */}
        <div className="mt-6">
          <PurchaseComments requestId={requestId} />
        </div>

        {/* Sección para asignar aprobadores (cuando hay cotización seleccionada > $50k pero no hay aprobadores) */}
        {request.estatus === 'PENDIENTE' && selectedQuote && selectedQuote.monto > 50000 && (!request.approvers || request.approvers.length === 0) && (user.role === 'ADMIN' || user.role === 'COMPRAS') && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Asignar Aprobadores
              </span>
            </h2>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Requiere Autorización</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Esta solicitud supera los <strong>$50,000 MXN</strong> y requiere que asignes aprobadores.
                    </p>
                    <p className="mt-1">
                      Cotización seleccionada: <strong>{selectedQuote?.proveedor}</strong> - <strong>{formatCurrency(selectedQuote?.monto)}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Selecciona las personas que deben autorizar esta compra (gerentes, directores, etc.)
            </p>
            <button
              onClick={() => setShowQuoteSelectionModal(true)}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              👥 Asignar Aprobadores
            </button>
          </div>
        )}

        {/* Sección de aprobadores asignados */}
        {request.approvers && request.approvers.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Aprobadores Asignados
              </span>
            </h2>
            <div className="space-y-3">
              {request.approvers.map((approver) => {
                const nombre = approver.employee?.nombre || 
                  `${approver.employee?.nombres || ''} ${approver.employee?.apellidoPaterno || ''} ${approver.employee?.apellidoMaterno || ''}`.trim();
                const estatusColors = {
                  'PENDIENTE': 'bg-yellow-100 text-yellow-800',
                  'APROBADO': 'bg-green-100 text-green-800',
                  'RECHAZADO': 'bg-red-100 text-red-800'
                };
                const estatusLabels = {
                  'PENDIENTE': 'Pendiente',
                  'APROBADO': 'Aprobado',
                  'RECHAZADO': 'Rechazado'
                };
                return (
                  <div key={approver.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{nombre}</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {approver.employee?.nivelJerarquico || 'N/A'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            {approver.employee?.departamento?.nombre || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${estatusColors[approver.estatus] || 'bg-gray-100 text-gray-800'}`}>
                      {estatusLabels[approver.estatus] || approver.estatus}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gestión de autorización (solo para estado EN_AUTORIZACION y perfiles ADMIN/RH) */}
        {request.estatus === 'EN_AUTORIZACION' && (user.role === 'ADMIN' || user.role === 'RH') && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
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
                      Esta solicitud supera los <strong>$50,000 MXN</strong> y requiere autorización gerencial.
                    </p>
                    <p className="mt-1">
                      Cotización seleccionada: <strong>{selectedQuote?.proveedor}</strong> - <strong>{formatCurrency(selectedQuote?.monto)}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Como usuario con permisos de administración, puedes aprobar esta solicitud especial.
            </p>
            <button
              onClick={handleAuthorizeRequest}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
            >
              ✅ Aprobar Compra Especial (mayor a $50k)
            </button>
          </div>
        )}

        {/* Gestión de Orden de Compra y Entrega (solo para estado APROBADO) */}
        {request.estatus === 'APROBADO' && (
          <div className="space-y-6 mt-6">
            {/* Sección de Orden de Compra */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Orden de Compra
                </span>
              </h2>
              
              {loadingOrder ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Cargando orden de compra...</p>
                </div>
              ) : purchaseOrder ? (
                <div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-green-700">
                          <strong>Orden de Compra generada:</strong> {purchaseOrder.numero}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Proveedor: {purchaseOrder.proveedor} • Monto: {formatCurrency(purchaseOrder.monto)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {purchaseOrder.pdfUrl && (
                    <button
                      onClick={() => {
                        setPdfUrl(purchaseOrder.pdfUrl);
                        setPdfTitle(`Orden de Compra ${purchaseOrder.numero}`);
                        setShowPdfModal(true);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Ver PDF de la Orden de Compra
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-yellow-700">
                          <strong>Sin orden de compra:</strong> Aún no se ha generado la orden de compra para esta solicitud.
                        </p>
                        <p className="text-sm text-yellow-600 mt-1">
                          Haz clic en el botón para generar la orden de compra en formato PDF.
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateOrder}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    📄 Generar Orden de Compra
                  </button>
                </div>
              )}
            </div>

            {/* Sección de Gestión de entrega */}
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
          </div>
        )}

        {/* Modal de selección de cotización (solo Admin/Compras) */}
        {showQuoteSelectionModal && (
          <QuoteSelectionModal
            request={request}
            onClose={() => setShowQuoteSelectionModal(false)}
            onSuccess={() => {
              fetchRequestDetails();
            }}
          />
        )}

        {/* Modal para generar orden de compra */}
        {showPurchaseOrderModal && (
          <PurchaseOrderModal
            request={request}
            onClose={() => setShowPurchaseOrderModal(false)}
            onSuccess={() => {
              setShowPurchaseOrderModal(false);
              fetchPurchaseOrder();
              fetchRequestDetails();
            }}
          />
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
                  <p>Para descargar el PDF, haz clic derecho en el documento y selecciona &ldquo;Guardar como&rdquo;</p>
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
