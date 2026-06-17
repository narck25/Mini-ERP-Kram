/**
 * Script de prueba para generar un PDF de Orden de Compra con el logo
 * Ejecutar: node test-pdf-logo.js
 * El PDF se generará en: backend/uploads/purchase-orders/TEST-OC.pdf
 */
const path = require('path');
const fs = require('fs');

// Configurar variables de entorno mínimas para Prisma
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/kram_erp';

// Importar la función generatePDF directamente
const PDFDocument = require('pdfkit');
const { COMPANY_INFO } = require('./src/config/company.config');

const ORDERS_DIR = path.join(__dirname, 'uploads', 'purchase-orders');
if (!fs.existsSync(ORDERS_DIR)) {
  fs.mkdirSync(ORDERS_DIR, { recursive: true });
}

const generateTestPDF = () => {
  return new Promise((resolve, reject) => {
    try {
      const numero = 'OC-2026-000001-TEST';
      const proveedor = 'PROVEEDOR DE PRUEBA S.A. DE C.V.';
      const monto = 15000.00;
      const subtotal = 12931.03;
      const iva = 2068.97;
      const ivaRate = 0.16;
      const contactoKram = 'Lic. Juan Pérez - Compras';
      const lugarEntrega = 'C. Segunda Sur No. 2-Bodega 3, Col. Independencia, Buenavista, Estado de México.';
      const observaciones = 'Entrega a más tardar 15 días hábiles después de la emisión de la orden. Favor de facturar a COMERCIALIZADORA KRAM con RFC: KRAM123456XYZ.';

      const items = [
        { productoServicio: 'Papel bond carta 75gr caja x 5000 hojas', cantidad: 5, precioUnitario: 850.00, importe: 4250.00 },
        { productoServicio: 'Tóner HP LaserJet 107A Negro', cantidad: 3, precioUnitario: 1200.00, importe: 3600.00 },
        { productoServicio: 'Folder tamaño carta color beige x 100 pzas', cantidad: 10, precioUnitario: 180.50, importe: 1805.00 },
        { productoServicio: 'Pluma punto fino azul caja x 50 pzas', cantidad: 8, precioUnitario: 95.00, importe: 760.00 },
        { productoServicio: 'Engrapadora metálica mediana', cantidad: 2, precioUnitario: 245.00, importe: 490.00 },
      ];

      const filename = `${numero.replace(/\//g, '-')}.pdf`;
      const filePath = path.join(ORDERS_DIR, filename);

      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Orden de Compra ${numero}`,
          Author: 'COMERCIALIZADORA KRAM',
          Subject: 'Orden de Compra',
          Keywords: 'orden, compra, OC, KRAM'
        }
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ── Colores corporativos ──
      const PRIMARY = '#1e40af';
      const SECONDARY = '#3b82f6';
      const LIGHT_BG = '#f0f4ff';
      const DARK_TEXT = '#1f2937';
      const GRAY_TEXT = '#6b7280';
      const BORDER = '#d1d5db';

      // ═══════════════════════════════════════════════════════
      // HEADER: Logo + Datos corporativos + No. OC
      // ═══════════════════════════════════════════════════════

      // Barra superior decorativa
      doc.rect(50, 50, 515, 4).fill(PRIMARY);

      // ── Logo de KRAM (lado izquierdo) ──
      const LOGO_PATH = path.join(__dirname, 'uploads', 'logo-kram.png');
      if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, 50, 65, { width: 70, height: 70 });
        console.log('✅ Logo encontrado y agregado al PDF');
      } else {
        console.log('⚠️ Logo no encontrado en:', LOGO_PATH);
      }

      // ── Datos de la empresa (lado izquierdo, debajo del logo) ──
      const infoX = 50;
      const infoY = 145;

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(PRIMARY)
         .text(COMPANY_INFO.name, infoX, infoY);

      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(GRAY_TEXT)
         .text('Dirección:', infoX, infoY + 14, { width: 300 });
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(DARK_TEXT)
         .text(COMPANY_INFO.address, infoX, infoY + 24, { width: 300 });

      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(GRAY_TEXT)
         .text('Teléfono:', infoX, infoY + 40, { width: 300 });
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(DARK_TEXT)
         .text(COMPANY_INFO.phone, infoX, infoY + 50, { width: 300 });

      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(GRAY_TEXT)
         .text('Correo:', infoX, infoY + 66, { width: 300 });
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(DARK_TEXT)
         .text(COMPANY_INFO.email, infoX, infoY + 76, { width: 300 });

      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(GRAY_TEXT)
         .text('Contacto:', infoX, infoY + 92, { width: 300 });
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(DARK_TEXT)
         .text(contactoKram || '—', infoX, infoY + 102, { width: 300 });

      // ── Número de OC (destacado, lado derecho) ──
      doc.rect(350, 75, 215, 40).fill(LIGHT_BG);
      doc.rect(350, 75, 215, 40).stroke(SECONDARY);
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(GRAY_TEXT)
         .text('No. de Orden', 360, 83, { width: 195, align: 'right' });
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor(PRIMARY)
         .text(numero, 360, 97, { width: 195, align: 'right' });

      // ── Título central ──
      doc.fontSize(22)
         .font('Helvetica-Bold')
         .fillColor(PRIMARY)
         .text('ORDEN DE COMPRA', 50, 330, { align: 'center' });

      // ── Línea separadora ──
      doc.moveTo(50, 355).lineTo(565, 355).stroke(BORDER);

      // ═══════════════════════════════════════════════════════
      // INFORMACIÓN GENERAL
      // ═══════════════════════════════════════════════════════

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

      let yPos = 370;
      yPos = drawField('Proveedor', proveedor, 50, yPos);

      let yPosRight = 370;
      yPosRight = drawField('Lugar de entrega', lugarEntrega || '—', 310, yPosRight, 255);

      // ═══════════════════════════════════════════════════════
      // TABLA DE PARTIDAS
      // ═══════════════════════════════════════════════════════
      const tableY = Math.max(yPos, yPosRight + 10) + 10;

      doc.rect(50, tableY, 515, 22).fill(PRIMARY);
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#ffffff');

      const colWidths = [30, 210, 60, 100, 115];
      const colStarts = [50, 80, 290, 350, 450];
      const headers = ['#', 'Producto / Servicio', 'Cantidad', 'Precio Unitario', 'Importe'];

      headers.forEach((header, i) => {
        doc.text(header, colStarts[i] + 5, tableY + 6, {
          width: colWidths[i] - 10,
          align: i >= 2 ? 'right' : 'left'
        });
      });

      let rowY = tableY + 22;
      items.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.rect(50, rowY, 515, 22).fill('#f9fafb');
        }

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(DARK_TEXT);

        doc.text(String(index + 1), 55, rowY + 6, { width: 25, align: 'center' });
        doc.text(item.productoServicio || '—', 85, rowY + 6, { width: 200 });
        doc.text(String(item.cantidad), 295, rowY + 6, { width: 50, align: 'right' });
        doc.text(`$ ${item.precioUnitario.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 355, rowY + 6, { width: 90, align: 'right' });
        doc.text(`$ ${item.importe.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 455, rowY + 6, { width: 105, align: 'right' });

        rowY += 22;
      });

      doc.rect(50, rowY, 515, 1).fill(PRIMARY);

      // ═══════════════════════════════════════════════════════
      // TOTALES
      // ═══════════════════════════════════════════════════════
      rowY += 8;
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(DARK_TEXT);

      doc.text('Subtotal:', 350, rowY, { width: 95, align: 'right' });
      doc.text(`$ ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 455, rowY, { width: 105, align: 'right' });
      rowY += 16;

      doc.text(`IVA (${Math.round(ivaRate * 100)}%):`, 350, rowY, { width: 95, align: 'right' });
      doc.text(`$ ${iva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 455, rowY, { width: 105, align: 'right' });
      rowY += 16;

      doc.rect(340, rowY - 4, 225, 24).fill(LIGHT_BG);
      doc.rect(340, rowY - 4, 225, 24).stroke(SECONDARY);
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(PRIMARY)
         .text('Total:', 350, rowY, { width: 95, align: 'right' });
      doc.text(`$ ${monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 455, rowY, { width: 105, align: 'right' });

      // ═══════════════════════════════════════════════════════
      // OBSERVACIONES
      // ═══════════════════════════════════════════════════════
      const obsY = rowY + 35;
      if (observaciones) {
        doc.fontSize(7)
           .font('Helvetica')
           .fillColor(GRAY_TEXT)
           .text('OBSERVACIONES', 50, obsY, { width: 515 });
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(DARK_TEXT)
           .text(observaciones, 50, obsY + 12, { width: 515 });
      }

      // ═══════════════════════════════════════════════════════
      // FIRMA INSTITUCIONAL
      // ═══════════════════════════════════════════════════════
      const firmaY = Math.max(obsY + (observaciones ? 50 : 20), rowY + 70);

      doc.moveTo(50, firmaY).lineTo(565, firmaY).stroke(BORDER);

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(PRIMARY)
         .text('AUTORIZADO POR', 50, firmaY + 10, { width: 515, align: 'center' });

      doc.moveTo(180, firmaY + 45).lineTo(435, firmaY + 45).stroke(BORDER);

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(DARK_TEXT)
         .text(contactoKram || '—', 180, firmaY + 50, { width: 255, align: 'center' });

      doc.fontSize(8)
         .font('Helvetica')
         .fillColor(GRAY_TEXT)
         .text('Área de Compras', 180, firmaY + 64, { width: 255, align: 'center' });

      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor(PRIMARY)
         .text('COMERCIALIZADORA KRAM', 180, firmaY + 76, { width: 255, align: 'center' });

      // ═══════════════════════════════════════════════════════
      // FOOTER
      // ═══════════════════════════════════════════════════════
      const footerY = Math.max(firmaY + 100, 680);

      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(GRAY_TEXT);

      doc.text('Documento oficial emitido por ERP KRAM para efectos comerciales y administrativos.', 50, footerY, { align: 'center', width: 515 });
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 50, footerY + 14, { align: 'center', width: 515 });

      doc.end();

      stream.on('finish', () => {
        console.log(`\n✅ PDF generado exitosamente:`);
        console.log(`   📄 ${filePath}`);
        console.log(`   🔗 /uploads/purchase-orders/${filename}`);
        resolve(filePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Ejecutar
generateTestPDF()
  .then((filePath) => {
    console.log('\n📋 Para abrir el PDF:');
    console.log(`   start "${filePath}"`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error generando PDF:', err);
    process.exit(1);
  });
