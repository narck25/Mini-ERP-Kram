/**
 * purchase-order.service.js
 * ─────────────────────────────────────────────────────────────
 * Generación de Órdenes de Compra (OC) con partidas.
 *
 * Flujo:
 *   1. Se llama a generateOrder(requestId, userId, items) desde el endpoint
 *      POST /api/purchases/:id/purchase-order.
 *   2. Valida estado APROBADO y que no exista OC previa.
 *   3. Busca la cotización seleccionada (isSelected = true).
 *   4. Genera número consecutivo OC-AAAA-000001.
 *   5. Calcula subtotal, IVA y total desde los items (con precioUnitario).
 *   6. Crea PurchaseOrder + PurchaseOrderItem en transacción.
 *   7. Genera el PDF profesional con PDFKit (incluye precio unitario e importe).
 *   8. Actualiza el pdfUrl en la OC creada.
 * ─────────────────────────────────────────────────────────────
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const audit = require('../audit.service');

// ─────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────
const ORDERS_DIR = path.join(__dirname, '..', '..', '..', 'uploads', 'purchase-orders');
const IVA_RATE = 0.16; // 16% IVA

// Asegurar que el directorio exista
if (!fs.existsSync(ORDERS_DIR)) {
  fs.mkdirSync(ORDERS_DIR, { recursive: true });
}

// ─────────────────────────────────────────────────────────────
// 1. Generar número consecutivo de OC
// ─────────────────────────────────────────────────────────────
const generateOrderNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `OC-${year}-`;

  // Buscar la última OC del año actual
  const lastOrder = await prisma.purchaseOrder.findFirst({
    where: {
      numero: {
        startsWith: prefix
      }
    },
    orderBy: {
      numero: 'desc'
    }
  });

  let nextNumber = 1;
  if (lastOrder) {
    // Extraer el número secuencial del último: OC-2026-000001 → 1
    const parts = lastOrder.numero.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextNumber = lastSeq + 1;
    }
  }

  // Formatear con 6 dígitos: 1 → 000001
  return `${prefix}${String(nextNumber).padStart(6, '0')}`;
};

// ─────────────────────────────────────────────────────────────
// 2. Generar PDF profesional de la Orden de Compra
// ─────────────────────────────────────────────────────────────
const generatePDF = (orderData) => {
  return new Promise((resolve, reject) => {
    try {
      const {
        numero,
        proveedor,
        monto,
        subtotal,
        iva,
        ivaRate,
        solicitante,
        departamento,
        items,
        justificacion,
        fechaSolicitud,
        fechaAutorizacion,
        autorizadoPor
      } = orderData;

      const filename = `${numero.replace(/\//g, '-')}.pdf`;
      const filePath = path.join(ORDERS_DIR, filename);

      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Orden de Compra ${numero}`,
          Author: 'ERP KRAM - Sistema de Compras',
          Subject: 'Orden de Compra',
          Keywords: 'orden, compra, OC'
        }
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ── Colores corporativos ──
      const PRIMARY = '#1e40af';    // Azul oscuro
      const SECONDARY = '#3b82f6';  // Azul medio
      const LIGHT_BG = '#f0f4ff';   // Fondo azul claro
      const DARK_TEXT = '#1f2937';  // Texto oscuro
      const GRAY_TEXT = '#6b7280';  // Texto gris
      const BORDER = '#d1d5db';     // Borde

      // ── Header: Logo + Título ──
      // Barra superior decorativa
      doc.rect(50, 50, 515, 4).fill(PRIMARY);

      // Título
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor(PRIMARY)
         .text('ORDEN DE COMPRA', 50, 70, { align: 'center' });

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(GRAY_TEXT)
         .text('Sistema de Gestión de Compras - ERP KRAM', 50, 95, { align: 'center' });

      // ── Número de OC (destacado) ──
      doc.rect(350, 70, 215, 40).fill(LIGHT_BG);
      doc.rect(350, 70, 215, 40).stroke(SECONDARY);
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(GRAY_TEXT)
         .text('No. de Orden', 360, 78, { width: 195, align: 'right' });
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor(PRIMARY)
         .text(numero, 360, 92, { width: 195, align: 'right' });

      // ── Línea separadora ──
      doc.moveTo(50, 125).lineTo(565, 125).stroke(BORDER);

      // ── Información general ──
      let yPos = 140;

      // Función helper para dibujar campos
      const drawField = (label, value, x, y, width = 230) => {
        doc.fontSize(7)
           .font('Helvetica')
           .fillColor(GRAY_TEXT)
           .text(label.toUpperCase(), x, y, { width, continued: false });
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(DARK_TEXT)
           .text(value || '—', x, y + 12, { width });
        return y + 34;
      };

      // Columna izquierda
      yPos = drawField('Solicitante', solicitante, 50, yPos);
      yPos = drawField('Departamento', departamento, 50, yPos);
      yPos = drawField('Fecha de Solicitud', fechaSolicitud, 50, yPos);

      // Columna derecha
      let yPosRight = 140;
      yPosRight = drawField('Proveedor', proveedor, 310, yPosRight);
      yPosRight = drawField('Subtotal', `$ ${(subtotal || monto).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`, 310, yPosRight);
      yPosRight = drawField('IVA (${Math.round((ivaRate || IVA_RATE) * 100)}%)', `$ ${(iva || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`, 310, yPosRight);
      yPosRight = drawField('Monto Total', `$ ${monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`, 310, yPosRight);
      yPosRight = drawField('Fecha de Autorización', fechaAutorizacion, 310, yPosRight);

      // Autorizado por
      const maxY = Math.max(yPos, yPosRight);
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(GRAY_TEXT)
         .text('AUTORIZADO POR', 50, maxY + 5, { width: 230 });
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(DARK_TEXT)
         .text(autorizadoPor || '—', 50, maxY + 17, { width: 230 });

      // ── Justificación ──
      if (justificacion) {
        const justY = maxY + 45;
        doc.fontSize(7)
           .font('Helvetica')
           .fillColor(GRAY_TEXT)
           .text('JUSTIFICACIÓN', 50, justY, { width: 515 });
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(DARK_TEXT)
           .text(justificacion, 50, justY + 12, { width: 515 });
      }

      // ── Tabla de partidas ──
      const tableY = Math.max(maxY + (justificacion ? 80 : 55), 280);

      // Encabezado de tabla
      doc.rect(50, tableY, 515, 22).fill(PRIMARY);
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#ffffff');

      // Columnas: #, Producto/Servicio, Cantidad, Precio Unitario, Importe
      const colWidths = [30, 210, 60, 100, 115];
      const colStarts = [50, 80, 290, 350, 450];
      const headers = ['#', 'Producto / Servicio', 'Cantidad', 'Precio Unitario', 'Importe'];

      headers.forEach((header, i) => {
        doc.text(header, colStarts[i] + 5, tableY + 6, {
          width: colWidths[i] - 10,
          align: i >= 2 ? 'right' : 'left'
        });
      });

      // Filas de la tabla
      let rowY = tableY + 22;
      items.forEach((item, index) => {
        // Fondo alternado
        if (index % 2 === 0) {
          doc.rect(50, rowY, 515, 22).fill('#f9fafb');
        }

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(DARK_TEXT);

        const precioUnitario = item.precioUnitario || 0;
        const importe = item.importe || (precioUnitario * item.cantidad);

        doc.text(String(index + 1), 55, rowY + 6, { width: 25, align: 'center' });
        doc.text(item.productoServicio || '—', 85, rowY + 6, { width: 200 });
        doc.text(String(item.cantidad), 295, rowY + 6, { width: 50, align: 'right' });
        doc.text(`$ ${precioUnitario.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 355, rowY + 6, { width: 90, align: 'right' });
        doc.text(`$ ${importe.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 455, rowY + 6, { width: 105, align: 'right' });

        rowY += 22;
      });

      // ── Línea final de la tabla ──
      doc.rect(50, rowY, 515, 1).fill(PRIMARY);

      // ── Totales al final de la tabla ──
      rowY += 8;
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(DARK_TEXT);

      // Subtotal
      doc.text('Subtotal:', 350, rowY, { width: 95, align: 'right' });
      doc.text(`$ ${(subtotal || monto).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 455, rowY, { width: 105, align: 'right' });
      rowY += 16;

      // IVA
      doc.text(`IVA (${Math.round((ivaRate || IVA_RATE) * 100)}%):`, 350, rowY, { width: 95, align: 'right' });
      doc.text(`$ ${(iva || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 455, rowY, { width: 105, align: 'right' });
      rowY += 16;

      // Total (destacado)
      doc.rect(340, rowY - 4, 225, 24).fill(LIGHT_BG);
      doc.rect(340, rowY - 4, 225, 24).stroke(SECONDARY);
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(PRIMARY)
         .text('Total:', 350, rowY, { width: 95, align: 'right' });
      doc.text(`$ ${monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 455, rowY, { width: 105, align: 'right' });

      // ── Footer ──
      const footerY = Math.max(rowY + 40, 650);

      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(GRAY_TEXT);

      doc.text('Este documento es una orden de compra oficial generada por el ERP KRAM.', 50, footerY, { align: 'center', width: 515 });
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 50, footerY + 14, { align: 'center', width: 515 });

      // ── Sello de autenticidad ──
      doc.rect(200, footerY + 30, 215, 30).fill(LIGHT_BG);
      doc.rect(200, footerY + 30, 215, 30).stroke(SECONDARY);
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor(PRIMARY)
         .text('✓ DOCUMENTO AUTENTICADO', 210, footerY + 38, { align: 'center', width: 195 });
      doc.fontSize(6)
         .font('Helvetica')
         .fillColor(GRAY_TEXT)
         .text(`Orden: ${numero} | Folio interno: ${orderData.folio || '—'}`, 210, footerY + 50, { align: 'center', width: 195 });

      // ── Finalizar ──
      doc.end();

      stream.on('finish', () => {
        resolve({
          filename,
          filePath,
          pdfUrl: `/uploads/purchase-orders/${filename}`
        });
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// ─────────────────────────────────────────────────────────────
// 3. Generar Orden de Compra completa (con transacción)
// ─────────────────────────────────────────────────────────────
const generateOrder = async (requestId, userId, customItems = null) => {
  // ── 3.1 Obtener la solicitud con todos los datos ──
  const request = await prisma.purchaseRequest.findUnique({
    where: { id: requestId },
    include: {
      solicitante: {
        select: {
          nombre: true,
          user: { select: { email: true, name: true } }
        }
      },
      departamento: {
        select: { nombre: true }
      },
      items: true,
      quotes: {
        where: { isSelected: true }
      },
      autorizadoPor: {
        select: { nombre: true }
      }
    }
  });

  if (!request) {
    throw { status: 404, error: 'Solicitud no encontrada', message: 'La solicitud de compra no existe' };
  }

  if (request.estatus !== 'APROBADO') {
    throw {
      status: 400,
      error: 'Estado inválido',
      message: 'Solo se pueden generar órdenes de compra para solicitudes en estado APROBADO'
    };
  }

  // ── 3.2 Validar que tenga cotización seleccionada ──
  const selectedQuote = request.quotes[0];
  if (!selectedQuote) {
    throw {
      status: 400,
      error: 'Sin cotización seleccionada',
      message: 'La solicitud debe tener una cotización seleccionada para generar la orden de compra'
    };
  }

  // ── 3.3 Verificar que no exista ya una orden para esta solicitud ──
  const existingOrder = await prisma.purchaseOrder.findUnique({
    where: { purchaseRequestId: requestId }
  });

  if (existingOrder) {
    throw {
      status: 409,
      error: 'Orden duplicada',
      message: `Ya existe una orden de compra para esta solicitud: ${existingOrder.numero}`
    };
  }

  // ── 3.4 Validar items ──
  // Si se proporcionan items personalizados (desde el modal), usarlos
  // Si no, usar los items de la solicitud
  const sourceItems = customItems && customItems.length > 0
    ? customItems
    : request.items;

  if (!sourceItems || sourceItems.length === 0) {
    throw {
      status: 400,
      error: 'Sin partidas',
      message: 'No hay partidas para generar la orden de compra'
    };
  }

  // ── 3.5 Calcular montos ──
  // Si hay items personalizados con precioUnitario, calcular desde ellos
  // Si no, usar el monto de la cotización seleccionada
  let subtotal = 0;
  let iva = 0;
  let montoTotal = selectedQuote.monto;

  if (customItems && customItems.length > 0) {
    // Calcular subtotal desde los items personalizados
    subtotal = customItems.reduce((sum, item) => {
      const precioUnitario = parseFloat(item.precioUnitario) || 0;
      const cantidad = parseFloat(item.cantidad) || 0;
      return sum + (precioUnitario * cantidad);
    }, 0);
    iva = subtotal * IVA_RATE;
    montoTotal = subtotal + iva;
  }

  // ── 3.6 Generar número consecutivo ──
  const numero = await generateOrderNumber();

  // ── 3.7 Ejecutar transacción: crear OC + items ──
  const result = await prisma.$transaction(async (tx) => {
    // 3.7.1 Crear la orden de compra
    const order = await tx.purchaseOrder.create({
      data: {
        purchaseRequestId: requestId,
        numero,
        proveedor: selectedQuote.proveedor,
        monto: montoTotal,
        subtotal: subtotal > 0 ? subtotal : null,
        iva: iva > 0 ? iva : null,
        ivaRate: IVA_RATE,
        items: {
          create: sourceItems.map((item) => {
            const precioUnitario = parseFloat(item.precioUnitario) || 0;
            const cantidad = parseFloat(item.cantidad) || 0;
            const importe = precioUnitario * cantidad;

            return {
              productoServicio: item.productoServicio,
              cantidad: item.cantidad,
              descripcion: item.descripcion || null,
              precioUnitario: precioUnitario > 0 ? precioUnitario : null,
              importe: importe > 0 ? importe : null
            };
          })
        }
      },
      include: {
        items: true
      }
    });

    return order;
  });

  // ── 3.8 Generar PDF (fuera de la transacción para no bloquear BD) ──
  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const pdfResult = await generatePDF({
    numero,
    proveedor: selectedQuote.proveedor,
    monto: montoTotal,
    subtotal: subtotal > 0 ? subtotal : montoTotal,
    iva: iva > 0 ? iva : 0,
    ivaRate: IVA_RATE,
    solicitante: request.solicitante.nombre || request.solicitante.user?.name || '—',
    departamento: request.departamento.nombre,
    items: result.items,
    justificacion: request.justificacion,
    fechaSolicitud: formatDate(request.fechaSolicitud),
    fechaAutorizacion: formatDate(request.fechaAutorizacion),
    autorizadoPor: request.autorizadoPor?.nombre || '—',
    folio: request.folio
  });

  // ── 3.9 Actualizar el pdfUrl en la OC (operación rápida fuera de transacción) ──
  const order = await prisma.purchaseOrder.update({
    where: { id: result.id },
    data: { pdfUrl: pdfResult.pdfUrl },
    include: { items: true }
  });

  // ── 3.10 Auditoría ──
  try {
    await audit.log(
      requestId,
      userId,
      audit.ACCIONES.ORDEN_COMPRA_GENERADA,
      null,
      {
        orderId: order.id,
        numero: order.numero,
        proveedor: order.proveedor,
        monto: order.monto,
        subtotal: order.subtotal,
        iva: order.iva,
        itemsCount: order.items.length,
        pdfUrl: pdfResult.pdfUrl
      }
    );
  } catch (auditError) {
    // No bloquear si falla la auditoría
    console.warn('⚠️ No se pudo registrar auditoría de OC:', auditError.message);
  }

  console.log(`📄 Orden de Compra ${numero} generada para solicitud #${request.folio} (${order.items.length} partidas)`);

  return {
    order,
    pdfUrl: pdfResult.pdfUrl,
    filename: pdfResult.filename
  };
};

// ─────────────────────────────────────────────────────────────
// 6. Regenerar PDF de una Orden de Compra existente
// ─────────────────────────────────────────────────────────────
const regeneratePdf = async (requestId, userId) => {
  // ── 6.1 Obtener la OC existente con todos sus datos ──
  const existingOrder = await prisma.purchaseOrder.findUnique({
    where: { purchaseRequestId: requestId },
    include: {
      items: true,
      request: {
        select: {
          folio: true,
          estatus: true,
          justificacion: true,
          fechaSolicitud: true,
          fechaAutorizacion: true,
          solicitante: {
            select: {
              nombre: true,
              user: { select: { email: true, name: true } }
            }
          },
          departamento: {
            select: { nombre: true }
          },
          autorizadoPor: {
            select: { nombre: true }
          }
        }
      }
    }
  });

  if (!existingOrder) {
    throw {
      status: 404,
      error: 'OC no encontrada',
      message: 'No existe una orden de compra para esta solicitud. Debe generar la OC primero.'
    };
  }

  // ── 6.2 Validar que tenga items ──
  if (!existingOrder.items || existingOrder.items.length === 0) {
    throw {
      status: 400,
      error: 'Sin partidas',
      message: 'La orden de compra existente no tiene partidas para regenerar el PDF'
    };
  }

  // ── 6.3 Formatear fechas ──
  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // ── 6.4 Generar nuevo PDF con los mismos PurchaseOrderItem ──
  const pdfResult = await generatePDF({
    numero: existingOrder.numero,
    proveedor: existingOrder.proveedor,
    monto: existingOrder.monto,
    subtotal: existingOrder.subtotal || existingOrder.monto,
    iva: existingOrder.iva || 0,
    ivaRate: existingOrder.ivaRate || IVA_RATE,
    solicitante: existingOrder.request.solicitante.nombre || existingOrder.request.solicitante.user?.name || '—',
    departamento: existingOrder.request.departamento.nombre,
    items: existingOrder.items,
    justificacion: existingOrder.request.justificacion,
    fechaSolicitud: formatDate(existingOrder.request.fechaSolicitud),
    fechaAutorizacion: formatDate(existingOrder.request.fechaAutorizacion),
    autorizadoPor: existingOrder.request.autorizadoPor?.nombre || '—',
    folio: existingOrder.request.folio
  });

  // ── 6.5 Actualizar SOLO el pdfUrl en la OC existente ──
  const updatedOrder = await prisma.purchaseOrder.update({
    where: { id: existingOrder.id },
    data: { pdfUrl: pdfResult.pdfUrl },
    include: { items: true }
  });

  // ── 6.6 Auditoría ──
  try {
    await audit.log(
      requestId,
      userId,
      audit.ACCIONES.ORDEN_COMPRA_REGENERADA,
      null,
      {
        orderId: updatedOrder.id,
        numero: updatedOrder.numero,
        proveedor: updatedOrder.proveedor,
        monto: updatedOrder.monto,
        subtotal: updatedOrder.subtotal,
        iva: updatedOrder.iva,
        itemsCount: updatedOrder.items.length,
        pdfUrl: pdfResult.pdfUrl,
        regeneratedAt: new Date().toISOString()
      }
    );
  } catch (auditError) {
    console.warn('⚠️ No se pudo registrar auditoría de regeneración de OC:', auditError.message);
  }

  console.log(`📄 PDF de Orden de Compra ${updatedOrder.numero} regenerado (${updatedOrder.items.length} partidas)`);

  return {
    order: updatedOrder,
    pdfUrl: pdfResult.pdfUrl,
    filename: pdfResult.filename
  };
};

// ─────────────────────────────────────────────────────────────
// 4. Obtener orden de compra por requestId (con items)
// ─────────────────────────────────────────────────────────────
const getOrderByRequestId = async (requestId) => {
  const order = await prisma.purchaseOrder.findUnique({
    where: { purchaseRequestId: requestId },
    include: {
      items: true,
      request: {
        select: {
          folio: true,
          estatus: true,
          solicitante: {
            select: { nombre: true }
          },
          departamento: {
            select: { nombre: true }
          }
        }
      }
    }
  });

  return order;
};

// ─────────────────────────────────────────────────────────────
// 5. Obtener todas las órdenes de compra (con items)
// ─────────────────────────────────────────────────────────────
const getAllOrders = async () => {
  const orders = await prisma.purchaseOrder.findMany({
    include: {
      items: true,
      request: {
        select: {
          folio: true,
          estatus: true,
          solicitante: {
            select: { nombre: true }
          },
          departamento: {
            select: { nombre: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return orders;
};

module.exports = {
  generateOrder,
  regeneratePdf,
  getOrderByRequestId,
  getAllOrders
};


