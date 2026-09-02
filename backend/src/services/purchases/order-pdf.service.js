/**
 * order-pdf.service.js
 * Generación del PDF profesional para Órdenes de Compra.
 * Extraído de purchase-order.service.js para cumplir SRP.
 */
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { COMPANY_INFO } = require('../../config/company.config');

const ORDERS_DIR = path.join(__dirname, '..', '..', '..', 'uploads', 'purchase-orders');
const IVA_RATE = 0.16;

if (!fs.existsSync(ORDERS_DIR)) fs.mkdirSync(ORDERS_DIR, { recursive: true });

const C = { PRIMARY: '#1e40af', SECONDARY: '#3b82f6', LIGHT_BG: '#f0f4ff', DARK_TEXT: '#1f2937', GRAY_TEXT: '#6b7280', BORDER: '#d1d5db' };

const generatePDF = (d) => new Promise((resolve, reject) => {
  try {
    const n = d.numero.replace(/\//g, '-') + '.pdf';
    const fp = path.join(ORDERS_DIR, n);
    const doc = new PDFDocument({ size: 'LETTER', margins: { top: 50, bottom: 50, left: 50, right: 50 }, info: { Title: 'OC ' + d.numero } });
    const s = fs.createWriteStream(fp);
    doc.pipe(s);

    doc.rect(50, 50, 515, 4).fill(C.PRIMARY);
    // Logo fuera de /uploads a propósito: esa carpeta es un volumen persistente en producción
    // que no se actualiza con el contenido de una imagen nueva una vez creado.
    const lp = path.join(__dirname, '..', '..', 'assets', 'logo-kram.png');
    if (fs.existsSync(lp)) doc.image(lp, 50, 65, { width: 70, height: 70 });

    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.PRIMARY).text(COMPANY_INFO.name, 50, 145);
    doc.fontSize(7).font('Helvetica').fillColor(C.GRAY_TEXT).text('Direccion:', 50, 159);
    doc.fillColor(C.DARK_TEXT).text(COMPANY_INFO.address, 50, 169);
    doc.fillColor(C.GRAY_TEXT).text('Telefono:', 50, 185);
    doc.fillColor(C.DARK_TEXT).text(COMPANY_INFO.phone, 50, 195);
    doc.fillColor(C.GRAY_TEXT).text('Correo:', 50, 211);
    doc.fillColor(C.DARK_TEXT).text(COMPANY_INFO.email, 50, 221);
    doc.fillColor(C.GRAY_TEXT).text('Contacto:', 50, 237);
    doc.fillColor(C.DARK_TEXT).text(d.contactoKram || '—', 50, 247);

    doc.rect(350, 75, 215, 40).fill(C.LIGHT_BG).stroke(C.SECONDARY);
    doc.fontSize(9).font('Helvetica').fillColor(C.GRAY_TEXT).text('No. de Orden', 360, 83, { width: 195, align: 'right' });
    doc.fontSize(16).font('Helvetica-Bold').fillColor(C.PRIMARY).text(d.numero, 360, 97, { width: 195, align: 'right' });
    doc.fontSize(22).font('Helvetica-Bold').fillColor(C.PRIMARY).text('ORDEN DE COMPRA', 50, 330, { align: 'center' });
    doc.moveTo(50, 355).lineTo(565, 355).stroke(C.BORDER);

    const df = (l, v, x, y, w) => { doc.fontSize(7).font('Helvetica').fillColor(C.GRAY_TEXT).text(l.toUpperCase(), x, y); doc.fontSize(10).font('Helvetica').fillColor(C.DARK_TEXT).text(v || '—', x, y + 12, { width: w || 230 }); return y + 34; };
    let yp = df('Proveedor', d.proveedor, 50, 370);
    df('Lugar de entrega', d.lugarEntrega || '—', 310, 370, 255);

    const ty = yp + 10;
    doc.rect(50, ty, 515, 22).fill(C.PRIMARY);
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
    const hd = ['#', 'Producto / Servicio', 'Cantidad', 'Precio Unitario', 'Importe'];
    const cx = [55, 85, 295, 355, 455], wx = [25, 200, 50, 90, 105];
    hd.forEach((h, i) => doc.text(h, cx[i], ty + 6, { width: wx[i], align: i >= 2 ? 'right' : 'left' }));

    let ry = ty + 22;
    d.items.forEach((it, idx) => {
      if (idx % 2 === 0) doc.rect(50, ry, 515, 22).fill('#f9fafb');
      doc.fontSize(9).font('Helvetica').fillColor(C.DARK_TEXT);
      const pu = it.precioUnitario || 0, imp = it.importe || (pu * it.cantidad);
      doc.text(String(idx + 1), 55, ry + 6, { width: 25, align: 'center' });
      doc.text(it.productoServicio || '—', 85, ry + 6, { width: 200 });
      doc.text(String(it.cantidad), 295, ry + 6, { width: 50, align: 'right' });
      doc.text('$ ' + pu.toLocaleString('es-MX', { minimumFractionDigits: 2 }), 355, ry + 6, { width: 90, align: 'right' });
      doc.text('$ ' + imp.toLocaleString('es-MX', { minimumFractionDigits: 2 }), 455, ry + 6, { width: 105, align: 'right' });
      ry += 22;
    });

    doc.rect(50, ry, 515, 1).fill(C.PRIMARY);
    ry += 8;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.DARK_TEXT);
    doc.text('Subtotal:', 350, ry, { width: 95, align: 'right' });
    doc.text('$ ' + (d.subtotal || d.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 }), 455, ry, { width: 105, align: 'right' });
    ry += 16;
    doc.text('IVA (' + Math.round((d.ivaRate || IVA_RATE) * 100) + '%):', 350, ry, { width: 95, align: 'right' });
    doc.text('$ ' + (d.iva || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }), 455, ry, { width: 105, align: 'right' });
    ry += 16;
    doc.rect(340, ry - 4, 225, 24).fill(C.LIGHT_BG).stroke(C.SECONDARY);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.PRIMARY).text('Total:', 350, ry, { width: 95, align: 'right' });
    doc.text('$ ' + d.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 }), 455, ry, { width: 105, align: 'right' });

    const oy = ry + 35;
    if (d.observaciones) { doc.fontSize(7).font('Helvetica').fillColor(C.GRAY_TEXT).text('OBSERVACIONES', 50, oy); doc.fontSize(9).fillColor(C.DARK_TEXT).text(d.observaciones, 50, oy + 12, { width: 515 }); }
    const fy = Math.max(oy + (d.observaciones ? 50 : 20), ry + 70);
    doc.moveTo(50, fy).lineTo(565, fy).stroke(C.BORDER);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.PRIMARY).text('AUTORIZADO POR', 50, fy + 10, { width: 515, align: 'center' });
    doc.moveTo(180, fy + 45).lineTo(435, fy + 45).stroke(C.BORDER);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(C.DARK_TEXT).text(d.contactoKram || '—', 180, fy + 50, { width: 255, align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor(C.GRAY_TEXT).text('Area de Compras', 180, fy + 64, { width: 255, align: 'center' });
    doc.fontSize(8).font('Helvetica-Bold').fillColor(C.PRIMARY).text('COMERCIALIZADORA KRAM', 180, fy + 76, { width: 255, align: 'center' });
    const ffy = Math.max(fy + 100, 680);
    doc.fontSize(7).font('Helvetica').fillColor(C.GRAY_TEXT).text('Documento oficial emitido por ERP KRAM.', 50, ffy, { align: 'center', width: 515 });
    doc.end();
    s.on('finish', () => resolve({ filename: n, filePath: fp, pdfUrl: '/uploads/purchase-orders/' + n }));
    s.on('error', reject);
  } catch (e) { reject(e); }
});

module.exports = { generatePDF, IVA_RATE, ORDERS_DIR };