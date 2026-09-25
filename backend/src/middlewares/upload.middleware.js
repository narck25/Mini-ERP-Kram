const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================================
// Utilidades de directorios
// ============================================================
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
    } catch (err) {
      console.warn(`⚠️ No se pudo crear directorio ${dirPath}: ${err.message}`);
      // Intentar con /tmp como fallback
      const tmpPath = dirPath.replace(process.cwd(), '/tmp');
      if (!fs.existsSync(tmpPath)) {
        fs.mkdirSync(tmpPath, { recursive: true });
      }
      return tmpPath;
    }
  }
  return dirPath;
};

// ============================================================
// Configuración de rutas
// ============================================================
// En Docker/Coolify, usar UPLOAD_DIR del entorno o /tmp/uploads como fallback
const UPLOAD_BASE = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const PATHS = {
  purchaseQuotes: path.join(UPLOAD_BASE, 'purchase-quotes'),
  temp: path.join(UPLOAD_BASE, 'temp'),
  cvs: path.join(UPLOAD_BASE, 'cvs'),
  employeeDocuments: path.join(UPLOAD_BASE, 'employee-documents'),
  psychTests: path.join(UPLOAD_BASE, 'psych-tests'),
  photos: path.join(UPLOAD_BASE, 'photos'),
  disciplinaryIncidents: path.join(UPLOAD_BASE, 'disciplinary-incidents'),
};

// Asegurar que todos los directorios existan
Object.entries(PATHS).forEach(([key, dirPath]) => {
  const result = ensureDir(dirPath);
  if (result !== dirPath) {
    PATHS[key] = result; // Actualizar con fallback si cambió
  }
});

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
    const dir = ensureDir(destinationPath);
    cb(null, dir);
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

// Upload genérico temporal (usa memoryStorage para compatibilidad con proxies)
const upload = multer({
  storage: multer.memoryStorage(),
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

// Upload para pruebas psicométricas
const uploadPsychTest = multer({
  storage: createStorage(PATHS.psychTests),
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }
});

// Upload para candidatos (CV + pruebas psicométricas en un solo middleware)
const uploadCandidate = multer({
  storage: createStorage(PATHS.cvs),
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 2 }
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

// Upload para actas administrativas / incidencias disciplinarias
const uploadDisciplinaryIncident = multer({
  storage: createStorage(PATHS.disciplinaryIncidents),
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }
});

// ============================================================
// Middleware para asegurar directorios
// ============================================================
const ensureUploadDirs = (req, res, next) => {
  Object.entries(PATHS).forEach(([key, dirPath]) => {
    const result = ensureDir(dirPath);
    if (result !== dirPath) {
      PATHS[key] = result;
    }
  });
  next();
};

// ============================================================
// Validación de contenido real (magic bytes)
// ============================================================
// El fileFilter de multer solo mira la extensión que el cliente declara
// (`file.originalname`), que es trivial de falsificar (ej. subir un .exe
// renombrado a "curriculum.pdf"). Esta capa adicional revisa los primeros
// bytes del archivo YA subido contra la firma real de su tipo declarado.
// No reemplaza al fileFilter (que sigue filtrando por extensión primero);
// lo complementa verificando que el contenido no mienta sobre sí mismo.
const MAGIC_BYTES = {
  '.pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  '.png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  '.jpg': [[0xff, 0xd8, 0xff]],
  '.jpeg': [[0xff, 0xd8, 0xff]],
  // .doc/.xls legado (OLE2 Compound File) comparten la misma firma —
  // basta con confirmar que es un contenedor Office real, no distinguir
  // el subtipo exacto a partir de los primeros bytes.
  '.doc': [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  '.xls': [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  // .docx/.xlsx (Office Open XML) son contenedores ZIP.
  '.docx': [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]],
  '.xlsx': [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]],
  // .csv es texto plano, sin firma binaria propia — se valida por
  // descarte más abajo (que no coincida con ninguna firma de esta lista).
};

const readHeaderBytes = (file, length = 12) => {
  if (file.buffer && file.buffer.length > 0) {
    return file.buffer.subarray(0, length);
  }
  if (file.path && fs.existsSync(file.path)) {
    const fd = fs.openSync(file.path, 'r');
    try {
      const buf = Buffer.alloc(length);
      const bytesRead = fs.readSync(fd, buf, 0, length, 0);
      return buf.subarray(0, bytesRead);
    } finally {
      fs.closeSync(fd);
    }
  }
  return Buffer.alloc(0);
};

const matchesAnySignature = (header, signatures) =>
  signatures.some((sig) => sig.every((byte, i) => header[i] === byte));

const isFileContentValid = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const header = readHeaderBytes(file);

  if (ext === '.csv') {
    const allBinarySignatures = Object.values(MAGIC_BYTES).flat();
    return !matchesAnySignature(header, allBinarySignatures);
  }

  const signatures = MAGIC_BYTES[ext];
  if (!signatures) return true; // sin firma definida para esta extensión; no bloquear aquí
  return matchesAnySignature(header, signatures);
};

const collectUploadedFiles = (req) => {
  if (req.file) return [req.file];
  if (req.files) {
    return Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
  }
  return [];
};

const cleanupDiskFile = (file) => {
  if (file.path && fs.existsSync(file.path)) {
    try { fs.unlinkSync(file.path); } catch { /* best-effort */ }
  }
};

/**
 * Middleware a colocar DESPUÉS de cualquier multer.single()/.fields() de
 * este archivo. Rechaza (400) si el contenido real de algún archivo no
 * coincide con la firma esperada de su extensión declarada, y limpia del
 * disco los archivos ya escritos por multer antes de responder.
 */
const validateFileContent = (req, res, next) => {
  const files = collectUploadedFiles(req);
  const invalid = files.find((file) => !isFileContentValid(file));

  if (invalid) {
    files.forEach(cleanupDiskFile);
    return res.status(400).json({
      error: `El archivo "${invalid.originalname}" no coincide con su extensión (contenido inválido o corrupto).`
    });
  }

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
  uploadPsychTest,
  uploadCandidate,
  uploadPhoto,
  uploadDisciplinaryIncident,
  ensureUploadDirs,
  handleMulterError,
  validateFileContent
};
