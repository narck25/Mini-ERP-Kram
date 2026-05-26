const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================================
// Utilidades de directorios
// ============================================================
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// ============================================================
// Configuración de rutas
// ============================================================
const UPLOAD_BASE = path.join(process.cwd(), 'uploads');
const PATHS = {
  purchaseQuotes: path.join(UPLOAD_BASE, 'purchase-quotes'),
  temp: path.join(UPLOAD_BASE, 'temp'),
  cvs: path.join(UPLOAD_BASE, 'cvs'),
  employeeDocuments: path.join(UPLOAD_BASE, 'employee-documents'),
  psychTests: path.join(UPLOAD_BASE, 'psych-tests'),
  photos: path.join(UPLOAD_BASE, 'photos'),
};

// Asegurar que todos los directorios existan
Object.values(PATHS).forEach(ensureDir);

// ============================================================
// Filtro de archivos permitidos
// ============================================================
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.csv'];

const fileFilter = (req, file, cb) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (ALLOWED_EXTENSIONS.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${fileExtension}. Extensiones permitidas: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }
};

// ============================================================
// Configuración de almacenamiento
// ============================================================
const createStorage = (destinationPath) => multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir(destinationPath);
    cb(null, destinationPath);
  },
  filename: (req, file, cb) => {
    // Sanitizar nombre de archivo
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 100);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

// ============================================================
// Límites
// ============================================================
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
  files: 2 // Máximo 2 archivos por request
};

// ============================================================
// Middlewares de upload
// ============================================================

// Upload genérico temporal
const upload = multer({
  storage: createStorage(PATHS.temp),
  fileFilter: fileFilter,
  limits: limits
});

// Upload para cotizaciones de compras
const uploadPurchaseQuotes = multer({
  storage: createStorage(PATHS.purchaseQuotes),
  fileFilter: fileFilter,
  limits: limits
});

// Upload para CVs
const uploadCV = multer({
  storage: createStorage(PATHS.cvs),
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }
});

// Upload para fotos de empleados
const uploadPhoto = multer({
  storage: createStorage(PATHS.photos),
  fileFilter: (req, file, cb) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (imageExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPG, JPEG, PNG)'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 1 } // 5MB para fotos
});

// ============================================================
// Middleware para asegurar directorios
// ============================================================
const ensureUploadDirs = (req, res, next) => {
  Object.values(PATHS).forEach(ensureDir);
  next();
};

// ============================================================
// Middleware para manejar errores de multer
// ============================================================
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'El archivo excede el tamaño máximo permitido (10MB)' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({ error: 'Se excedió el número máximo de archivos permitidos' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: `Campo de archivo inesperado: ${err.field}` });
    }
    return res.status(400).json({ error: `Error de subida: ${err.message}` });
  }
  
  if (err.message?.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({ error: err.message });
  }
  
  next(err);
};

module.exports = {
  upload,
  uploadPurchaseQuotes,
  uploadCV,
  uploadPhoto,
  ensureUploadDirs,
  handleMulterError
};
