require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ============================================================
// Inicialización de directorios de uploads
// ============================================================
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const UPLOAD_SUBDIRS = ['photos', 'cvs', 'employee-documents', 'psych-tests', 'purchase-quotes', 'temp'];

try {
  UPLOAD_SUBDIRS.forEach(subdir => {
    const dirPath = path.join(UPLOAD_DIR, subdir);
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
      } catch (mkdirErr) {
        // Si falla mkdir, intentar arreglar permisos del directorio padre
        // (útil cuando el volumen Docker tiene permisos root)
        if (mkdirErr.code === 'EACCES') {
          try {
            fs.chmodSync(UPLOAD_DIR, 0o777);
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`   ✅ Creado ${subdir} después de corregir permisos`);
          } catch (chmodErr) {
            throw chmodErr;
          }
        } else {
          throw mkdirErr;
        }
      }
    }
  });
  console.log('✅ Upload directories initialized');
  console.log(`   Base: ${UPLOAD_DIR}`);
} catch (err) {
  console.warn('⚠️ No se pudieron crear directorios de uploads:', err.message);
}

// ============================================================
// Carga segura de rutas con validación de callbacks
// ============================================================
const loadRoute = (name, routePath) => {
  try {
    const route = require(routePath);
    console.log(`✅ Route loaded: ${name}`);
    return route;
  } catch (err) {
    console.error(`❌ Error loading route ${name} (${routePath}):`, err.message);
    console.error(err.stack?.substring(0, 300));
    // Retornar un router vacío para evitar crash
    const { Router } = require('express');
    const emptyRouter = Router();
    emptyRouter.all('*', (req, res) => {
      res.status(503).json({ error: `Route module ${name} failed to load` });
    });
    return emptyRouter;
  }
};

const authRoutes = loadRoute('auth', './routes/auth.routes');
const vacancyRoutes = loadRoute('vacancy', './routes/vacancy.routes');
const employeeRoutes = loadRoute('employee', './routes/employee.routes');
const employeeDocumentRoutes = loadRoute('employeeDocument', './routes/employeeDocument.routes');
const recruitmentRoutes = loadRoute('recruitment', './routes/recruitment.routes');
const statsRoutes = loadRoute('stats', './routes/stats.routes');
const permissionRoutes = loadRoute('permission', './routes/permission.routes');
const userRoutes = loadRoute('user', './routes/user.routes');
const organizationRoutes = loadRoute('organization', './routes/organization.routes');
const purchaseRoutes = loadRoute('purchase', './routes/purchase.routes');
const attendanceRoutes = loadRoute('attendance', './routes/attendance.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// Configuración de Proxy Trust (Coolify/Traefik/Nginx)
// ============================================================
// Niveles de trust proxy:
//   1 - confía en el primer proxy (localhost/balanceador)
//   2 - confía en dos niveles (Traefik + Coolify proxy)
//   'loopback' - confía solo en direcciones loopback
const trustProxyLevel = process.env.TRUST_PROXY === '1' ? 1 : 
                         process.env.TRUST_PROXY === '2' ? 2 : 
                         process.env.TRUST_PROXY || 'loopback';

app.set('trust proxy', trustProxyLevel);

if (process.env.TRUST_PROXY) {
  console.log(`🔧 Proxy trust configurado (nivel: ${trustProxyLevel})`);
}

// ============================================================
// Configuración CORS
// ============================================================
const getCorsOrigins = () => {
  if (!process.env.CORS_ORIGIN) {
    return [
      'http://localhost:3000',
      'http://localhost:3002',
      'https://erp.kramhub.site',
      'https://apierp.kramhub.site',
      'http://apierp.kramhub.site'
    ];
  }
  
  if (process.env.CORS_ORIGIN.includes(',')) {
    return process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  }
  
  return [process.env.CORS_ORIGIN];
};

// Middlewares
app.use(cors({
  origin: getCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition']
}));

// Parseo de body - IMPORTANTE: No usar express.json() para rutas multipart
// El orden importa: primero urlencoded, luego json
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// ============================================================
// Archivos estáticos
// ============================================================
app.use('/uploads', express.static(UPLOAD_DIR));

// ============================================================
// Health check
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ERP KRAM Backend is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    uploadDir: UPLOAD_DIR
  });
});

// ============================================================
// Routes
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api', vacancyRoutes);
app.use('/api', employeeRoutes);
app.use('/api', employeeDocumentRoutes);
app.use('/api', recruitmentRoutes);
app.use('/api', statsRoutes);
app.use('/api', permissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api', organizationRoutes);
app.use('/api', purchaseRoutes);
app.use('/api/incidencias', attendanceRoutes);

// ============================================================
// 404 handler
// ============================================================
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================
// Error handler global (incluye errores de multer/upload)
// ============================================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack?.substring(0, 500));
  
  // Errores de Multer (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      error: 'El archivo excede el tamaño máximo permitido (10MB)' 
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({ 
      error: 'Se excedió el número máximo de archivos permitidos' 
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ 
      error: 'Tipo de archivo inesperado en el campo de upload' 
    });
  }
  
  // Errores de multer genéricos
  if (err.name === 'MulterError') {
    return res.status(400).json({ 
      error: `Error en la subida de archivos: ${err.message}` 
    });
  }
  
  // Errores de parseo JSON
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      error: 'Error al parsear JSON en la solicitud' 
    });
  }
  
  // Errores de payload muy grande
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ 
      error: 'El payload de la solicitud excede el límite permitido' 
    });
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message 
  });
});

// ============================================================
// Inicio del servidor
// ============================================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 CORS origins: ${getCorsOrigins().join(', ')}`);
  console.log(`🔒 Trust proxy level: ${trustProxyLevel}`);
  console.log(`📁 Upload directory: ${UPLOAD_DIR}`);
});
