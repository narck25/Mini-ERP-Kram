const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');

// Tipos de documentos permitidos
const ALLOWED_DOCUMENT_TYPES = [
  'Contrato',
  'Identificación Oficial',
  'Comprobante de Domicilio',
  'Acta de Nacimiento',
  'CURP',
  'RFC',
  'NSS',
  'Título Profesional',
  'Carta de Recomendación',
  'Otro'
];

// Extensiones permitidas
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];

// Crear carpeta de uploads si no existe
const UPLOAD_DIR = path.join(__dirname, '../../uploads/employee-documents');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Obtener documentos de un empleado
exports.getEmployeeDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const documents = await prisma.employeeDocument.findMany({
      where: { employee_id: employeeId },
      orderBy: { uploaded_at: 'desc' },
      include: {
        employee: {
          select: {
            nombre: true,
            rfc: true
          }
        }
      }
    });

    res.json({ documents });
  } catch (error) {
    console.error('Error fetching employee documents:', error);
    res.status(500).json({ error: 'Error al obtener documentos del empleado' });
  }
};

// Subir documento para un empleado
exports.uploadEmployeeDocument = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { tipo_documento } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    if (!tipo_documento) {
      return res.status(400).json({ error: 'El tipo de documento es requerido' });
    }

    if (!ALLOWED_DOCUMENT_TYPES.includes(tipo_documento)) {
      return res.status(400).json({ 
        error: 'Tipo de documento no válido',
        allowedTypes: ALLOWED_DOCUMENT_TYPES
      });
    }

    // Verificar que el empleado existe
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Crear nombre único para el archivo
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const uniqueFileName = `${employeeId}_${Date.now()}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFileName);

    // Guardar el archivo en la carpeta de uploads
    // Soporta tanto diskStorage (file.path) como memoryStorage (file.buffer)
    if (file.buffer && file.buffer.length > 0) {
      fs.writeFileSync(filePath, file.buffer);
    } else if (file.path) {
      fs.renameSync(file.path, filePath);
    } else {
      return res.status(500).json({ error: 'Error interno: no se pudo leer el archivo subido' });
    }

    // Crear registro en la base de datos
    const document = await prisma.employeeDocument.create({
      data: {
        tipo_documento,
        nombre_archivo: file.originalname,
        url_archivo: `/uploads/employee-documents/${uniqueFileName}`,
        mime_type: file.mimetype,
        size_bytes: file.size,
        employee_id: employeeId,
        uploaded_by: req.user?.id
      }
    });

    res.status(201).json({ 
      message: 'Documento subido exitosamente',
      document 
    });
  } catch (error) {
    console.error('Error uploading employee document:', error);
    res.status(500).json({ error: 'Error al subir documento' });
  }
};

// Descargar documento
exports.downloadEmployeeDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await prisma.employeeDocument.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const filePath = path.join(__dirname, '../..', document.url_archivo);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
    }

    res.download(filePath, document.nombre_archivo);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Error al descargar documento' });
  }
};

// Eliminar documento
exports.deleteEmployeeDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await prisma.employeeDocument.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../..', document.url_archivo);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar registro de la base de datos
    await prisma.employeeDocument.delete({
      where: { id: documentId }
    });

    res.json({ message: 'Documento eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
};

// Obtener tipos de documentos permitidos
exports.getAllowedDocumentTypes = (req, res) => {
  res.json({ 
    allowedTypes: ALLOWED_DOCUMENT_TYPES,
    allowedExtensions: ALLOWED_EXTENSIONS
  });
};