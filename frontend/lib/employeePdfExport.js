/**
 * Utilidad para exportar perfil de empleado a PDF (Resumen para RH)
 * 
 * Dependencias: jspdf, jspdf-autotable
 * 
 * Uso:
 *   import { exportEmployeeToPDF } from '@/lib/employeePdfExport';
 *   exportEmployeeToPDF(employee, salaryHistory);
 */

import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

// Aplicar el plugin autoTable a jsPDF
applyPlugin(jsPDF);

/**
 * Formatea una fecha ISO a DD/MM/YYYY
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr.substring(0, 10) + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr || '—';
  }
}

/**
 * Formatea un número como moneda MXN
 */
function formatCurrency(value) {
  if (value === null || value === undefined) return '—';
  return `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calcula la antigüedad en años, meses y días
 */
function calcularAntiguedad(fechaAlta) {
  if (!fechaAlta) return '—';
  try {
    const alta = new Date(fechaAlta.substring(0, 10) + 'T00:00:00');
    const hoy = new Date();
    let años = hoy.getFullYear() - alta.getFullYear();
    let meses = hoy.getMonth() - alta.getMonth();
    let días = hoy.getDate() - alta.getDate();
    if (días < 0) { meses--; días += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate(); }
    if (meses < 0) { años--; meses += 12; }
    return `${años} años, ${meses} meses, ${días} días`;
  } catch {
    return '—';
  }
}

/**
 * Calcula la edad a partir de la fecha de nacimiento
 */
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return '—';
  try {
    const nac = new Date(fechaNacimiento.substring(0, 10) + 'T00:00:00');
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return `${edad} años`;
  } catch {
    return '—';
  }
}

/**
 * Exporta el perfil completo del empleado a PDF
 * @param {Object} employee - Datos del empleado
 * @param {Array} salaryHistory - Historial de cambios salariales
 */
export function exportEmployeeToPDF(employee, salaryHistory = []) {
  const doc = new jsPDF('p', 'mm', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ============================================================
  // COLORES CORPORATIVOS
  // ============================================================
  const primaryColor = [37, 99, 235];    // blue-600
  const primaryDark = [30, 64, 175];     // blue-800
  const accentColor = [59, 130, 246];    // blue-500
  const lightBg = [239, 246, 255];       // blue-50
  const textColor = [31, 41, 55];        // gray-800
  const textMuted = [107, 114, 128];     // gray-500
  const borderColor = [209, 213, 219];   // gray-300

  // ============================================================
  // FUNCIONES AUXILIARES DE DIBUJO
  // ============================================================

  function addSectionTitle(title, yPos) {
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPos, contentWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, margin + 4, yPos + 7);
    doc.setTextColor(...textColor);
    return yPos + 14;
  }

  function addField(label, value, yPos, xPos = margin, width = contentWidth / 2 - 5) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text(label, xPos, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    const displayValue = value || '—';
    doc.text(String(displayValue), xPos, yPos + 4);
    return yPos;
  }

  function addDivider(yPos) {
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    return yPos + 4;
  }

  function checkPageBreak(yPos, needed = 30) {
    if (yPos + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      return margin;
    }
    return yPos;
  }

  // ============================================================
  // ENCABEZADO PRINCIPAL
  // ============================================================
  // Barra superior azul oscuro
  doc.setFillColor(...primaryDark);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo / Nombre de la empresa
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('KRAM', margin, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Sistema Integral de Recursos Humanos', margin, 27);

  // Título del documento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RESUMEN DE EMPLEADO', pageWidth - margin, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, 27, { align: 'right' });

  y = 55;

  // ============================================================
  // DATOS GENERALES DEL EMPLEADO
  // ============================================================
  y = addSectionTitle('DATOS GENERALES', y);

  // Nombre completo grande
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...primaryDark);
  const nombreCompleto = `${employee.nombres || employee.nombre || ''} ${employee.apellidoPaterno || ''} ${employee.apellidoMaterno || ''}`.trim();
  doc.text(nombreCompleto || 'Sin nombre', margin, y + 6);
  y += 12;

  // Puesto y departamento
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...textMuted);
  doc.text(`${employee.puesto?.nombre || 'Sin puesto'}  |  ${employee.departamento?.nombre || 'Sin departamento'}`, margin, y);
  y += 10;

  // Grid de datos generales (2 columnas)
  const col1 = margin;
  const col2 = margin + contentWidth / 2;
  const rowH = 10;

  addField('Clave:', employee.clave, y, col1);
  addField('Estatus:', employee.estatus, y, col2);
  y += rowH;

  addField('Antigüedad:', calcularAntiguedad(employee.fechaAlta), y, col1);
  addField('Fecha de Ingreso:', formatDate(employee.fechaAlta), y, col2);
  y += rowH;

  addField('Nivel Jerárquico:', employee.nivelJerarquico, y, col1);
  addField('Jefe Directo:', employee.reportaA?.nombre || employee.jefeDirecto, y, col2);
  y += rowH;

  addField('Sucursal:', employee.sucursal, y, col1);
  addField('Área / Región:', `${employee.area || '—'} / ${employee.region || '—'}`, y, col2);
  y += rowH;

  addField('Contrato:', employee.contrato, y, col1);
  addField('Horario:', employee.horario, y, col2);
  y += 6;

  // ============================================================
  // DATOS PERSONALES
  // ============================================================
  y = checkPageBreak(y, 60);
  y = addSectionTitle('DATOS PERSONALES', y);

  addField('Fecha de Nacimiento:', formatDate(employee.fechaNacimiento), y, col1);
  addField('Edad:', calcularEdad(employee.fechaNacimiento), y, col2);
  y += rowH;

  addField('Lugar de Nacimiento:', employee.lugarNacimiento, y, col1);
  addField('Nacionalidad:', employee.nacionalidad, y, col2);
  y += rowH;

  addField('Estado Civil:', employee.estadoCivil, y, col1);
  addField('Sexo:', employee.sexo, y, col2);
  y += rowH;

  addField('Nivel Académico:', employee.nivelAcademico, y, col1);
  addField('', '', y, col2);
  y += 6;

  // ============================================================
  // CONTACTO Y DIRECCIÓN
  // ============================================================
  y = checkPageBreak(y, 50);
  y = addSectionTitle('CONTACTO Y DIRECCIÓN', y);

  addField('Teléfono Casa:', employee.telefonoCasa, y, col1);
  addField('Teléfono Móvil:', employee.telefonoMovil, y, col2);
  y += rowH;

  addField('Correo Electrónico:', employee.correoElectronico, y, col1);
  addField('Correo Empresa:', employee.correoEmpresa, y, col2);
  y += rowH;

  // Dirección va en ancho completo para evitar que texto largo se encime
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('Dirección:', col1, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...textColor);
  const dirText = employee.direccionCompleta || '—';
  // Si la dirección es muy larga, truncar con puntos suspensivos
  const maxDirChars = 80;
  const displayDir = dirText.length > maxDirChars ? dirText.substring(0, maxDirChars) + '...' : dirText;
  doc.text(displayDir, col1, y + 4);
  y += rowH;

  addField('Estado / CP:', `${employee.estado || '—'} / ${employee.cpFiscal || '—'}`, y, col1);
  addField('', '', y, col2);
  y += 6;

  // ============================================================
  // DATOS LEGALES
  // ============================================================
  y = checkPageBreak(y, 40);
  y = addSectionTitle('DATOS LEGALES', y);

  addField('RFC:', employee.rfc, y, col1);
  addField('CURP:', employee.curp, y, col2);
  y += rowH;

  addField('NSS:', employee.nss, y, col1);
  addField('', '', y, col2);
  y += 6;

  // ============================================================
  // DATOS FINANCIEROS
  // ============================================================
  y = checkPageBreak(y, 60);
  y = addSectionTitle('DATOS FINANCIEROS', y);

  addField('Salario Mensual:', formatCurrency(employee.salarioMensual), y, col1);
  addField('SD (Salario Diario):', formatCurrency(employee.sd), y, col2);
  y += rowH;

  addField('SDI (Salario Diario Integrado):', formatCurrency(employee.sdi), y, col1);
  addField('Banco:', employee.banco, y, col2);
  y += rowH;

  addField('CLABE:', employee.clabe, y, col1);
  addField('No. Cuenta:', employee.numeroCuenta, y, col2);
  y += 6;

  // ============================================================
  // UNIFORMES
  // ============================================================
  y = checkPageBreak(y, 40);
  y = addSectionTitle('UNIFORMES', y);

  addField('Talla Camisa:', employee.tallaCamisa, y, col1);
  addField('Talla Playera:', employee.tallaPlayera, y, col2);
  y += rowH;

  addField('Talla Pantalón:', employee.tallaPantalon, y, col1);
  addField('Talla Zapatos:', employee.tallaZapatos, y, col2);
  y += 6;

  // ============================================================
  // BENEFICIARIOS
  // ============================================================
  y = checkPageBreak(y, 60);
  y = addSectionTitle('BENEFICIARIOS', y);

  addField('Cónyuge:', employee.nombreConyuge, y, col1);
  addField('', '', y, col2);
  y += rowH;

  addField('Beneficiario 1:', employee.beneficiario1, y, col1);
  addField('Fecha Nac. B1:', formatDate(employee.fechaNacBeneficiario1), y, col2);
  y += rowH;

  addField('% Beneficiario 1:', employee.porcentaje1 ? `${employee.porcentaje1}%` : '—', y, col1);
  addField('', '', y, col2);
  y += rowH;

  addField('Beneficiario 2:', employee.beneficiario2, y, col1);
  addField('Fecha Nac. B2:', formatDate(employee.fechaNacBeneficiario2), y, col2);
  y += rowH;

  addField('% Beneficiario 2:', employee.porcentaje2 ? `${employee.porcentaje2}%` : '—', y, col1);
  addField('', '', y, col2);
  y += 6;

  // ============================================================
  // DATOS FAMILIARES
  // ============================================================
  y = checkPageBreak(y, 30);
  y = addSectionTitle('DATOS FAMILIARES', y);

  addField('¿Es Padre/Madre?:', employee.esPadre ? 'Sí' : 'No', y, col1);
  addField('Número de Hijos:', employee.numeroHijos?.toString(), y, col2);
  y += 6;

  // ============================================================
  // HISTORIAL DE SUELDOS
  // ============================================================
  if (salaryHistory && salaryHistory.length > 0) {
    y = checkPageBreak(y, 50);
    y = addSectionTitle('HISTORIAL DE CAMBIOS SALARIALES', y);

    const tableHeaders = [['Fecha', 'Tipo', 'Salario Anterior', 'Salario Nuevo', 'SD Anterior', 'SD Nuevo', 'SDI Ant.', 'SDI Nuevo', 'Factor', 'Motivo']];
    const tableData = salaryHistory.map(r => [
      formatDate(r.fechaCambio),
      r.tipoCambio || '—',
      r.salarioAnterior ? formatCurrency(r.salarioAnterior) : '—',
      r.salarioNuevo ? formatCurrency(r.salarioNuevo) : '—',
      r.sdAnterior ? formatCurrency(r.sdAnterior) : '—',
      r.sdNuevo ? formatCurrency(r.sdNuevo) : '—',
      r.sdiAnterior ? formatCurrency(r.sdiAnterior) : '—',
      r.sdiNuevo ? formatCurrency(r.sdiNuevo) : '—',
      r.factorUsado || '—',
      r.motivo || '—'
    ]);

    doc.autoTable({
      head: tableHeaders,
      body: tableData,
      startY: y,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [...textColor],
      },
      headStyles: {
        fillColor: [...primaryColor],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: [...lightBg],
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 18 },
        2: { cellWidth: 22, halign: 'right' },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 18, halign: 'right' },
        7: { cellWidth: 18, halign: 'right' },
        8: { cellWidth: 14 },
        9: { cellWidth: 'auto' },
      },
    });

    y = doc.lastAutoTable.finalY + 10;
  }

  // ============================================================
  // PIE DE PÁGINA
  // ============================================================
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.line(margin, doc.internal.pageSize.getHeight() - 15, pageWidth - margin, doc.internal.pageSize.getHeight() - 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('KRAM - Sistema Integral de Recursos Humanos', margin, doc.internal.pageSize.getHeight() - 7);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 7, { align: 'right' });
  }

  // ============================================================
  // DESCARGAR PDF
  // ============================================================
  const fileName = `Resumen_${(employee.nombres || employee.nombre || 'empleado').replace(/\s+/g, '_')}_${employee.apellidoPaterno || ''}.pdf`.replace(/\s+/g, '_');
  doc.save(fileName);
}
