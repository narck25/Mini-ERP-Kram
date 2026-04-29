const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ruta absoluta para uploads de cotizaciones de compras
const purchaseQuotesPath = path.join(process.cwd(), 'uploads', 'purchase-quotes');

// Crear la carpeta si no existe
if (!fs.existsSync(purchaseQuotesPath)) {
  fs.mkdirSync(purchaseQuotesPath, { recursive: true });
}

// Configurar almacenamiento para cotizaciones de compras
const purchaseQuotesStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, purchaseQuotesPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configurar almacenamiento temporal (para otros usos)
const tempStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtrar tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Extensiones permitidas: ${allowedExtensions.join(', ')}`), false);
  }
};

// Configurar límites
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
  files: 2 // Máximo 2 archivos (CV y pruebas psicométricas)
};

// Crear middlewares de upload
const upload = multer({
  storage: tempStorage,
  fileFilter: fileFilter,
  limits: limits
});

const uploadPurchaseQuotes = multer({
  storage: purchaseQuotesStorage,
  fileFilter: fileFilter,
  limits: limits
});

// Middleware para crear carpeta temporal si no existe
const ensureTempDir = (req, res, next) => {
  const tempDir = path.join(process.cwd(), 'uploads', 'temp');
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  next();
};

module.exports = {
  upload,
  uploadPurchaseQuotes,
  ensureTempDir
};
