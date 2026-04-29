require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const vacancyRoutes = require('./routes/vacancy.routes');
const employeeRoutes = require('./routes/employee.routes');
const employeeDocumentRoutes = require('./routes/employeeDocument.routes');
const recruitmentRoutes = require('./routes/recruitment.routes');
const statsRoutes = require('./routes/stats.routes');
const permissionRoutes = require('./routes/permission.routes');
const userRoutes = require('./routes/user.routes');
const organizationRoutes = require('./routes/organization.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const attendanceRoutes = require('./routes/attendance.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar proxy trust para túneles
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
  console.log('🔧 Proxy trust configurado para túneles');
}

// Parsear CORS_ORIGIN (puede ser string separada por comas o array)
const getCorsOrigins = () => {
  if (!process.env.CORS_ORIGIN) {
    return ['http://localhost:3000', 'http://localhost:3002'];
  }
  
  if (process.env.CORS_ORIGIN.includes(',')) {
    return process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  }
  
  return [process.env.CORS_ORIGIN];
};

// Middlewares
app.use(cors({
  origin: getCorsOrigins(),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check (debe estar antes de las rutas protegidas)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ERP KRAM Backend is running' });
});

// Routes
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
