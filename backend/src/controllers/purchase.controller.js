const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PurchaseController {
  /**
   * Crear una nueva solicitud de compra
   * Recibe justificacion y un array de items
   * Extrae el solicitanteId y departamentoId del usuario autenticado
   * Usa transacciones de Prisma para guardar la solicitud y sus ítems
   * Estatus inicial: NUEVO
   */
  static async createRequest(req, res) {
    try {
      const { justificacion, items } = req.body;
      const userId = req.user.id;

      // Verificar que el usuario tenga un empleado asociado
      const employee = await prisma.employee.findUnique({
        where: { userId }
      });

      if (!employee) {
        return res.status(404).json({ 
          error: 'Empleado no encontrado',
          message: 'El usuario no tiene un empleado asociado'
        });
      }

      // Validar que haya al menos un ítem
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          message: 'Debe incluir al menos un ítem en la solicitud'
        });
      }

      // Validar cada ítem
      for (const item of items) {
        if (!item.productoServicio || !item.cantidad) {
          return res.status(400).json({ 
            error: 'Datos inválidos',
            message: 'Cada ítem debe tener productoServicio y cantidad'
          });
        }
      }

      // Usar transacción para crear la solicitud y sus ítems
      const result = await prisma.$transaction(async (tx) => {
        // Crear la solicitud de compra
        const purchaseRequest = await tx.purchaseRequest.create({
          data: {
            solicitanteId: employee.id,
            departamentoId: employee.departamento_id,
            justificacion: justificacion || null,
            estatus: 'NUEVO',
            fechaSolicitud: new Date(),
            requiereAutorizacion: false
          }
        });

        // Crear los ítems de la solicitud
        const purchaseItems = await Promise.all(
          items.map(item => 
            tx.purchaseItem.create({
              data: {
                requestId: purchaseRequest.id,
                productoServicio: item.productoServicio,
                cantidad: parseFloat(item.cantidad),
                descripcion: item.descripcion || null
              }
            })
          )
        );

        return { purchaseRequest, purchaseItems };
      });

      res.status(201).json({
        message: 'Solicitud de compra creada exitosamente',
        data: {
          request: result.purchaseRequest,
          items: result.purchaseItems
        }
      });
    } catch (error) {
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo crear la solicitud de compra'
      });
    }
  }

  /**
   * Obtener las solicitudes creadas por el usuario autenticado
   */
  static async getMyRequests(req, res) {
    try {
      const userId = req.user.id;

      // Buscar el empleado asociado al usuario
      const employee = await prisma.employee.findUnique({
        where: { userId }
      });

      if (!employee) {
        return res.json({ requests: [] });
      }

      const requests = await prisma.purchaseRequest.findMany({
        where: { solicitanteId: employee.id },
        include: {
          solicitante: {
            select: {
              id: true,
              nombre: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          departamento: {
            select: {
              id: true,
              nombre: true
            }
          },
          items: true,
          quotes: true,
          autorizadoPor: {
            select: {
              id: true,
              nombre: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Transformar las URLs de las cotizaciones a URLs completas
      const transformedRequests = requests.map(request => ({
        ...request,
        quotes: request.quotes.map(quote => ({
          ...quote,
          archivoUrl: quote.archivoUrl 
            ? `${req.protocol}://${req.get('host')}${quote.archivoUrl}`
            : null
        }))
      }));

      res.json({ requests: transformedRequests });
    } catch (error) {
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las solicitudes'
      });
    }
  }

  /**
   * Obtener los detalles de una solicitud específica
   */
  static async getRequestDetails(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Buscar el empleado asociado al usuario
      const employee = await prisma.employee.findUnique({
        where: { userId }
      });

      if (!employee) {
        return res.status(404).json({ 
          error: 'Empleado no encontrado',
          message: 'El usuario no tiene un empleado asociado'
        });
      }

      // Buscar la solicitud
      const request = await prisma.purchaseRequest.findUnique({
        where: { id },
        include: {
          solicitante: {
            select: {
              id: true,
              nombre: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          departamento: {
            select: {
              id: true,
              nombre: true
            }
          },
          items: true,
          quotes: true,
          autorizadoPor: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      });

      if (!request) {
        return res.status(404).json({ 
          error: 'Solicitud no encontrada',
          message: 'La solicitud de compra no existe'
        });
      }

      // Verificar permisos: solo el solicitante o Admin/Compras pueden ver los detalles
      const isSolicitante = request.solicitanteId === employee.id;
      const isAdminOrCompras = ['ADMIN', 'COMPRAS'].includes(req.user.role);

      if (!isSolicitante && !isAdminOrCompras) {
        return res.status(403).json({ 
          error: 'Acceso denegado',
          message: 'No tiene permisos para ver esta solicitud'
        });
      }

      // Transformar las URLs de las cotizaciones a URLs completas
      const transformedRequest = {
        ...request,
        quotes: request.quotes.map(quote => ({
          ...quote,
          archivoUrl: quote.archivoUrl 
            ? `${req.protocol}://${req.get('host')}${quote.archivoUrl}`
            : null
        }))
      };

      res.json({ request: transformedRequest });
    } catch (error) {
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los detalles de la solicitud'
      });
    }
  }

  /**
   * Obtener todas las solicitudes (Solo Admin/Compras)
   */
  static async getAllRequests(req, res) {
    try {
      const { status, department } = req.query;
      
      const where = {};
      if (status) where.estatus = status;
      if (department) {
        // Buscar departamento por nombre para obtener su ID
        const dept = await prisma.department.findFirst({
          where: { nombre: { equals: department, mode: 'insensitive' } }
        });
        if (dept) {
          where.departamentoId = dept.id;
        }
      }

      const requests = await prisma.purchaseRequest.findMany({
        where,
        include: {
          solicitante: {
            select: {
              id: true,
              nombre: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          departamento: {
            select: {
              id: true,
              nombre: true
            }
          },
          items: true,
          quotes: true,
          autorizadoPor: {
            select: {
              id: true,
              nombre: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Transformar las URLs de las cotizaciones a URLs completas
      const transformedRequests = requests.map(request => ({
        ...request,
        quotes: request.quotes.map(quote => ({
          ...quote,
          archivoUrl: quote.archivoUrl 
            ? `${req.protocol}://${req.get('host')}${quote.archivoUrl}`
            : null
        }))
      }));

      res.json({ requests: transformedRequests });
    } catch (error) {
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las solicitudes'
      });
    }
  }

  /**
   * Subir cotizaciones para una solicitud (Solo Admin/Compras)
   * Recibe hasta 3 cotizaciones (proveedor, monto, archivoUrl)
   * Cambia el estatus a PENDIENTE
   */
  static async uploadQuotes(req, res) {
    try {
      const { id } = req.params;
      const { quotes } = req.body;

      // Validar que la solicitud exista
      const request = await prisma.purchaseRequest.findUnique({
        where: { id }
      });

      if (!request) {
        return res.status(404).json({ 
          error: 'Solicitud no encontrada',
          message: 'La solicitud de compra no existe'
        });
      }

      // Permitir subir cotizaciones solo en estado NUEVO (mientras no se alcancen 3)
      if (request.estatus !== 'NUEVO') {
        return res.status(400).json({ 
          error: 'Estado inválido',
          message: 'Solo se pueden subir cotizaciones a solicitudes en estado NUEVO'
        });
      }

      // Validar cotizaciones (máximo 3)
      if (!quotes || !Array.isArray(quotes) || quotes.length === 0 || quotes.length > 3) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          message: 'Debe proporcionar entre 1 y 3 cotizaciones'
        });
      }

      // Validar cada cotización
      for (const quote of quotes) {
        if (!quote.proveedor || !quote.monto) {
          return res.status(400).json({ 
            error: 'Datos inválidos',
            message: 'Cada cotización debe tener proveedor y monto'
          });
        }
      }

      // Usar transacción para actualizar la solicitud y crear las cotizaciones
      const result = await prisma.$transaction(async (tx) => {
        // Obtener cotizaciones existentes
        const existingQuotes = await tx.purchaseQuote.findMany({
          where: { requestId: id }
        });

        // Crear las nuevas cotizaciones
        const purchaseQuotes = await Promise.all(
          quotes.map(quote => 
            tx.purchaseQuote.create({
              data: {
                requestId: id,
                proveedor: quote.proveedor,
                monto: parseFloat(quote.monto),
                archivoUrl: quote.archivoUrl || null,
                fechaCotizacion: new Date(),
                isSelected: false
              }
            })
          )
        );

        // Calcular total de cotizaciones (existentes + nuevas)
        const totalQuotes = existingQuotes.length + purchaseQuotes.length;
        
        // Solo cambiar a PENDIENTE si ya hay 3 cotizaciones
        let estatusUpdate = {};
        if (totalQuotes >= 3) {
          estatusUpdate.estatus = 'PENDIENTE';
        }

        // Actualizar estado de la solicitud si es necesario
        const updatedRequest = await tx.purchaseRequest.update({
          where: { id },
          data: estatusUpdate
        });

        return { request: updatedRequest, quotes: purchaseQuotes };
      });

      res.json({
        message: 'Cotizaciones subidas exitosamente',
        data: result
      });
    } catch (error) {
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron subir las cotizaciones'
      });
    }
  }

  /**
   * Seleccionar una cotización (El solicitante)
   * Lógica de negocio clave: 
   * - Si el monto de la cotización seleccionada es > 28000, 
   *   cambia estatus a EN_AUTORIZACION y marca requiereAutorizacion: true
   * - Si es <= 28000, pasa directo a APROBADO
   */
  static async selectQuote(req, res) {
    try {
      const { id } = req.params;
      const { quoteId } = req.body;
      const userId = req.user.id;

      // Buscar el empleado asociado al usuario
      const employee = await prisma.employee.findUnique({
        where: { userId }
      });

      if (!employee) {
        return res.status(404).json({ 
          error: 'Empleado no encontrado',
          message: 'El usuario no tiene un empleado asociado'
        });
      }

      // Validar que la solicitud exista y pertenezca al solicitante
      const request = await prisma.purchaseRequest.findUnique({
        where: { id },
        include: { quotes: true }
      });

      if (!request) {
        return res.status(404).json({ 
          error: 'Solicitud no encontrada',
          message: 'La solicitud de compra no existe'
        });
      }

      if (request.solicitanteId !== employee.id) {
        return res.status(403).json({ 
          error: 'Acceso denegado',
          message: 'Solo el solicitante puede seleccionar una cotización'
        });
      }

      if (request.estatus !== 'PENDIENTE') {
        return res.status(400).json({ 
          error: 'Estado inválido',
          message: 'Solo se puede seleccionar una cotización en solicitudes PENDIENTE'
        });
      }

      // Buscar la cotización seleccionada
      const selectedQuote = request.quotes.find(q => q.id === quoteId);
      if (!selectedQuote) {
        return res.status(404).json({ 
          error: 'Cotización no encontrada',
          message: 'La cotización especificada no existe para esta solicitud'
        });
      }

      // Determinar el nuevo estado basado en el monto
      const monto = selectedQuote.monto;
      let nuevoEstatus;
      let requiereAutorizacion = false;

      if (monto > 28000) {
        nuevoEstatus = 'EN_AUTORIZACION';
        requiereAutorizacion = true;
      } else {
        nuevoEstatus = 'APROBADO';
        requiereAutorizacion = false;
      }

      // Usar transacción para actualizar la cotización y la solicitud
      const result = await prisma.$transaction(async (tx) => {
        // Desmarcar todas las cotizaciones como seleccionadas
        await tx.purchaseQuote.updateMany({
          where: { requestId: id },
          data: { isSelected: false }
        });

        // Marcar la cotización seleccionada
        const updatedQuote = await tx.purchaseQuote.update({
          where: { id: quoteId },
          data: { isSelected: true }
        });

        // Actualizar la solicitud
        const updatedRequest = await tx.purchaseRequest.update({
          where: { id },
          data: {
            estatus: nuevoEstatus,
            requiereAutorizacion
          }
        });

        return { request: updatedRequest, quote: updatedQuote };
      });

      res.json({
        message: `Cotización seleccionada exitosamente. Solicitud ${nuevoEstatus.toLowerCase()}.`,
        data: result
      });
    } catch (error) {
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo seleccionar la cotización'
      });
    }
  }

  /**
   * Autorizar una solicitud (Admin/Gerente)
   * Cambia de EN_AUTORIZACION a APROBADO, guardando quién autorizó
   */
  static async authorizeRequest(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Buscar el empleado asociado al usuario
      const employee = await prisma.employee.findUnique({
        where: { userId }
      });

      if (!employee) {
        return res.status(404).json({ 
          error: 'Empleado no encontrado',
          message: 'El usuario no tiene un empleado asociado'
        });
      }

      // Validar que la solicitud exista y esté en estado EN_AUTORIZACION
      const request = await prisma.purchaseRequest.findUnique({
        where: { id }
      });

      if (!request) {
        return res.status(404).json({ 
          error: 'Solicitud no encontrada',
          message: 'La solicitud de compra no existe'
        });
      }

      if (request.estatus !== 'EN_AUTORIZACION') {
        return res.status(400).json({ 
          error: 'Estado inválido',
          message: 'Solo se pueden autorizar solicitudes en estado EN_AUTORIZACION'
        });
      }

      // Autorizar la solicitud
      const updatedRequest = await prisma.purchaseRequest.update({
        where: { id },
        data: {
          estatus: 'APROBADO',
          autorizadoPorId: employee.id,
          fechaAutorizacion: new Date()
        },
        include: {
          autorizadoPor: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      });

      res.json({
        message: 'Solicitud autorizada exitosamente',
        data: updatedRequest
      });
    } catch (error) {
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo autorizar la solicitud'
      });
    }
  }

  /**
   * Marcar solicitud como ENTREGADA
   */
  static async markAsDelivered(req, res) {
    try {
      const { id } = req.params;

      // Validar que la solicitud exista y esté en estado APROBADO
      const request = await prisma.purchaseRequest.findUnique({
        where: { id }
      });

      if (!request) {
        return res.status(404).json({ 
          error: 'Solicitud no encontrada',
          message: 'La solicitud de compra no existe'
        });
      }

      if (request.estatus !== 'APROBADO') {
        return res.status(400).json({ 
          error: 'Estado inválido',
          message: 'Solo se pueden marcar como entregadas solicitudes en estado APROBADO'
        });
      }

      // Marcar como entregada
      const updatedRequest = await prisma.purchaseRequest.update({
        where: { id },
        data: { estatus: 'ENTREGADO' }
      });

      res.json({
        message: 'Solicitud marcada como entregada exitosamente',
        data: updatedRequest
      });
    } catch (error) {
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo marcar la solicitud como entregada'
      });
    }
  }

  /**
   * Subir archivo a una cotización existente
   * Solo Admin/Compras pueden subir archivos
   */
  static async uploadQuoteFile(req, res) {
    try {
      const { id, quoteId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ 
          error: 'Archivo requerido',
          message: 'Debe seleccionar un archivo para subir'
        });
      }

      // Validar que la solicitud exista
      const request = await prisma.purchaseRequest.findUnique({
        where: { id }
      });

      if (!request) {
        return res.status(404).json({ 
          error: 'Solicitud no encontrada',
          message: 'La solicitud de compra no existe'
        });
      }

      // Validar que la cotización exista y pertenezca a la solicitud
      const quote = await prisma.purchaseQuote.findFirst({
        where: { 
          id: quoteId,
          requestId: id 
        }
      });

      if (!quote) {
        return res.status(404).json({ 
          error: 'Cotización no encontrada',
          message: 'La cotización no existe o no pertenece a esta solicitud'
        });
      }

      // Construir la URL del archivo
      const fileUrl = `/uploads/purchase-quotes/${req.file.filename}`;
      
      // Mover el archivo de la carpeta temporal a la carpeta final
      const fs = require('fs');
      const path = require('path');
      
      const tempPath = req.file.path;
      const finalDir = 'uploads/purchase-quotes/';
      const finalPath = path.join(finalDir, req.file.filename);
      
      // Crear directorio si no existe
      if (!fs.existsSync(finalDir)) {
        fs.mkdirSync(finalDir, { recursive: true });
      }
      
      // Mover el archivo
      fs.renameSync(tempPath, finalPath);

      // Actualizar la cotización con la URL del archivo
      const updatedQuote = await prisma.purchaseQuote.update({
        where: { id: quoteId },
        data: { archivoUrl: fileUrl }
      });

      res.json({
        message: 'Archivo subido exitosamente',
        data: {
          fileUrl,
          quote: updatedQuote
        }
      });
    } catch (error) {
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo subir el archivo'
      });
    }
  }

  /**
   * Subir archivo para una nueva cotización (antes de crear la cotización)
   * Solo Admin/Compras pueden subir archivos
   */
  static async uploadQuoteFileForNewQuote(req, res) {
    try {
      const { id } = req.params;
      const { quoteIndex } = req.query;
      
      if (!req.file) {
        return res.status(400).json({ 
          error: 'Archivo requerido',
          message: 'Debe seleccionar un archivo para subir'
        });
      }

      // Validar que la solicitud exista y esté en estado NUEVO
      const request = await prisma.purchaseRequest.findUnique({
        where: { id }
      });

      if (!request) {
        return res.status(404).json({ 
          error: 'Solicitud no encontrada',
          message: 'La solicitud de compra no existe'
        });
      }

      if (request.estatus !== 'NUEVO') {
        return res.status(400).json({ 
          error: 'Estado inválido',
          message: 'Solo se pueden subir archivos para cotizaciones en solicitudes NUEVO'
        });
      }

      // Validar índice de cotización (0-2)
      const index = parseInt(quoteIndex);
      if (isNaN(index) || index < 0 || index > 2) {
        return res.status(400).json({ 
          error: 'Índice inválido',
          message: 'El índice de cotización debe ser 0, 1 o 2'
        });
      }

      // Construir la URL del archivo
      const fileUrl = `/uploads/purchase-quotes/temp/${Date.now()}-${index}-${req.file.filename}`;
      
      // Mover el archivo de la carpeta temporal a la carpeta temporal de cotizaciones
      const fs = require('fs');
      const path = require('path');
      
      const tempPath = req.file.path;
      const finalDir = 'uploads/purchase-quotes/temp/';
      const finalPath = path.join(finalDir, `${Date.now()}-${index}-${req.file.filename}`);
      
      // Crear directorio si no existe
      if (!fs.existsSync(finalDir)) {
        fs.mkdirSync(finalDir, { recursive: true });
      }
      
      // Mover el archivo
      fs.renameSync(tempPath, finalPath);

      res.json({
        message: 'Archivo subido exitosamente',
        data: {
          fileUrl,
          fileName: req.file.originalname,
          quoteIndex: index
        }
      });
    } catch (error) {
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo subir el archivo'
      });
    }
  }

  /**
   * Actualizar el monto de una cotización
   * Solo Admin/Compras pueden actualizar montos
   */
  static async updateQuoteAmount(req, res) {
    try {
      const { id, quoteId } = req.params;
      const { monto } = req.body;

      // Validar que el monto sea un número positivo
      if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
        return res.status(400).json({ 
          error: 'Monto inválido',
          message: 'El monto debe ser un número mayor a 0'
        });
      }

      // Validar que la solicitud exista
      const request = await prisma.purchaseRequest.findUnique({
        where: { id }
      });

      if (!request) {
        return res.status(404).json({ 
          error: 'Solicitud no encontrada',
          message: 'La solicitud de compra no existe'
        });
      }

      // Validar que la cotización exista y pertenezca a la solicitud
      const quote = await prisma.purchaseQuote.findFirst({
        where: { 
          id: quoteId,
          requestId: id 
        }
      });

      if (!quote) {
        return res.status(404).json({ 
          error: 'Cotización no encontrada',
          message: 'La cotización no existe o no pertenece a esta solicitud'
        });
      }

      // Validar que la solicitud no esté en estado ENTREGADO o CANCELADO
      if (request.estatus === 'ENTREGADO' || request.estatus === 'CANCELADO') {
        return res.status(400).json({ 
          error: 'Estado inválido',
          message: 'No se puede modificar cotizaciones en solicitudes ENTREGADAS o CANCELADAS'
        });
      }

      // Actualizar el monto de la cotización
      const updatedQuote = await prisma.purchaseQuote.update({
        where: { id: quoteId },
        data: { 
          monto: parseFloat(monto),
          fechaCotizacion: new Date() // Actualizar fecha de cotización
        }
      });

      // Si esta cotización está seleccionada, verificar si requiere autorización
      if (updatedQuote.isSelected) {
        const nuevoMonto = parseFloat(monto);
        let nuevoEstatus = request.estatus;
        let requiereAutorizacion = request.requiereAutorizacion;

        // Si el monto cambia de <= 28000 a > 28000, cambiar a EN_AUTORIZACION
        if (nuevoMonto > 28000 && request.estatus === 'APROBADO') {
          nuevoEstatus = 'EN_AUTORIZACION';
          requiereAutorizacion = true;
        }
        // Si el monto cambia de > 28000 a <= 28000, cambiar a APROBADO
        else if (nuevoMonto <= 28000 && request.estatus === 'EN_AUTORIZACION') {
          nuevoEstatus = 'APROBADO';
          requiereAutorizacion = false;
        }

        // Actualizar la solicitud si es necesario
        if (nuevoEstatus !== request.estatus) {
          await prisma.purchaseRequest.update({
            where: { id },
            data: {
              estatus: nuevoEstatus,
              requiereAutorizacion
            }
          });
        }
      }

      res.json({
        message: 'Monto actualizado exitosamente',
        data: updatedQuote
      });
    } catch (error) {
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el monto'
      });
    }
  }

  /**
   * Cancelar una solicitud
   */
  static async cancelRequest(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Buscar el empleado asociado al usuario
      const employee = await prisma.employee.findUnique({
        where: { userId }
      });

      if (!employee) {
        return res.status(404).json({ 
          error: 'Empleado no encontrado',
          message: 'El usuario no tiene un empleado asociado'
        });
      }

      // Validar que la solicitud exista
      const request = await prisma.purchaseRequest.findUnique({
        where: { id }
      });

      if (!request) {
        return res.status(404).json({ 
          error: 'Solicitud no encontrada',
          message: 'La solicitud de compra no existe'
        });
      }

      // Solo el solicitante o Admin/Compras pueden cancelar
      const isSolicitante = request.solicitanteId === employee.id;
      const isAdminOrCompras = ['ADMIN', 'COMPRAS'].includes(req.user.role);

      if (!isSolicitante && !isAdminOrCompras) {
        return res.status(403).json({ 
          error: 'Acceso denegado',
          message: 'No tiene permisos para cancelar esta solicitud'
        });
      }

      // Validar que la solicitud no esté ya cancelada o entregada
      if (request.estatus === 'CANCELADO') {
        return res.status(400).json({ 
          error: 'Solicitud ya cancelada',
          message: 'La solicitud ya está cancelada'
        });
      }

      if (request.estatus === 'ENTREGADO') {
        return res.status(400).json({ 
          error: 'No se puede cancelar',
          message: 'No se pueden cancelar solicitudes ya entregadas'
        });
      }

      // Cancelar la solicitud
      const updatedRequest = await prisma.purchaseRequest.update({
        where: { id },
        data: { estatus: 'CANCELADO' }
      });

      res.json({
        message: 'Solicitud cancelada exitosamente',
        data: updatedRequest
      });
    } catch (error) {
      console.error("🔥 ERROR PRISMA:", error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo cancelar la solicitud'
      });
    }
  }
}

module.exports = PurchaseController;
