# ERP KRAM - Sistema de Gestión Empresarial Moderno

Sistema ERP completo para la empresa KRAM construido con tecnologías modernas, diseñado para gestionar empleados, reclutamiento, compras, asistencia y más con un sistema de permisos basado en módulos.

## 🚀 Características Principales

### ✅ Módulos Implementados
- **EMPLEADOS**: Gestión completa de expedientes digitales de empleados
- **RECLUTAMIENTO**: Proceso digitalizado de solicitud y aprobación de vacantes
- **COMPRAS**: Sistema de solicitudes y cotizaciones de compras
- **ASISTENCIA**: Registro y seguimiento de asistencia
- **CONFIGURACIÓN**: Gestión de organización y departamentos
- **REPORTES**: Estadísticas y dashboards
- **DASHBOARD**: Panel principal personalizado por rol

### 🔐 Sistema de Permisos Avanzado
- **Basado en módulos**: Cada usuario tiene acceso solo a módulos específicos
- **Roles predefinidos**: ADMIN, RH, SISTEMAS, COMPRAS, PRODUCCIÓN
- **Protección de rutas**: Frontend y backend validan permisos automáticamente
- **JWT con módulos**: Tokens incluyen lista de módulos accesibles

## 🏗️ Arquitectura del Sistema

### Backend
- **Node.js** con **Express** - API RESTful
- **Prisma** como ORM - Gestión de base de datos tipo-safe
- **PostgreSQL** - Base de datos relacional robusta
- **JWT** - Autenticación segura con tokens
- **Multer** - Manejo de uploads de archivos (CVs, documentos)
- **Docker** - Contenedores para desarrollo y producción

### Frontend
- **Next.js 14** con App Router - Framework React moderno
- **React 18** con hooks - Componentes funcionales
- **Tailwind CSS** - Estilos utilitarios responsivos
- **Context API** - Estado global para autenticación
- **React Hook Form + Zod** - Formularios con validación
- **Axios** - Cliente HTTP para API

## 📁 Estructura del Proyecto

```
Mini-ERP-Kram/
├── backend/                 # API del sistema
│   ├── src/
│   │   ├── controllers/    # Controladores de la API
│   │   ├── middlewares/    # Middlewares (auth, uploads)
│   │   ├── routes/         # Definición de rutas
│   │   └── utils/          # Utilidades (auth, CSV)
│   ├── prisma/
│   │   ├── schema.prisma   # Esquema de base de datos
│   │   ├── migrations/     # Migraciones de BD
│   │   └── seed.js         # Datos iniciales
│   ├── scripts/           # Scripts de mantenimiento
│   ├── uploads/           # Archivos subidos (CVs, docs)
│   ├── .env.example       # Variables de entorno
│   ├── package.json       # Dependencias
│   └── README.md          # Documentación backend
├── frontend/              # Aplicación web
│   ├── app/              # App Router de Next.js
│   │   ├── dashboard/    # Panel principal
│   │   ├── rh/          # Módulo Recursos Humanos
│   │   ├── reclutamiento/ # Módulo Reclutamiento
│   │   ├── compras/      # Módulo Compras
│   │   └── login/        # Autenticación
│   ├── components/       # Componentes reutilizables
│   ├── contexts/         # Contextos React (Auth)
│   ├── lib/             # Utilidades (API client)
│   ├── public/          # Archivos estáticos
│   ├── package.json     # Dependencias
│   └── README.md        # Documentación frontend
├── docker-compose.yml    # Configuración Docker (PostgreSQL + pgAdmin)
├── .clinerules          # Reglas maestras del desarrollo
├── ESTADO_MODULOS_EMPLEADOS_RECLUTAMIENTO.md # Estado de módulos
└── README.md            # Este archivo
```

## 🚀 Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone https://github.com/narck25/Mini-ERP-Kram.git
cd Mini-ERP-Kram
```

### 2. Iniciar base de datos con Docker
```bash
docker-compose up -d
```

### 3. Configurar y ejecutar el backend
```bash
cd backend
cp .env.example .env
# Editar .env si es necesario (puertos, credenciales)
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
npm run dev
```

### 4. Configurar y ejecutar el frontend
```bash
cd ../frontend
npm install
npm run dev
```

## 🌐 Acceso a la Aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **pgAdmin**: http://localhost:5050
- **Health Check**: http://localhost:3001/api/health

## 🔐 Credenciales de Prueba

### Usuarios del Sistema
| Rol | Email | Contraseña | Módulos Accesibles |
|-----|-------|------------|-------------------|
| **Administrador** | admin@kram.com | admin123 | Todos los módulos |
| **Recursos Humanos** | rh@kram.com | rh123 | EMPLEADOS, RECLUTAMIENTO, DASHBOARD |
| **Sistemas** | sistemas@kram.com | sistemas123 | CONFIGURACIÓN, DASHBOARD |
| **Compras** | compras@kram.com | compras123 | COMPRAS, DASHBOARD |
| **Producción** | produccion@kram.com | produccion123 | DASHBOARD |

### Base de Datos PostgreSQL
- **Host**: localhost:5432
- **Database**: kram_erp
- **User**: kramadmin
- **Password**: krampassword123

### pgAdmin
- **URL**: http://localhost:5050
- **Email**: admin@kram.com
- **Password**: admin123

## 📊 Módulos y Funcionalidades

### 🧑‍💼 Módulo de Empleados
- **Gestión completa**: CRUD de empleados con todos los campos
- **Expedientes digitales**: Documentos adjuntos (PDF, imágenes)
- **Integración automática**: Asociación con usuarios del sistema
- **Validación por permisos**: Solo RH y ADMIN pueden gestionar

### 📋 Módulo de Reclutamiento
- **Solicitud digital**: Formulario completo para solicitar vacantes
- **Proceso de aprobación**: Estados: Solicitada → Aprobada → Buscando → Cerrada
- **Gestión de candidatos**: Subida de CVs, pruebas psicológicas
- **Perfil técnico**: Definición de requisitos por vacante
- **Actividades**: Seguimiento del proceso de reclutamiento

### 🛒 Módulo de Compras
- **Solicitudes de compra**: Formularios para requerir materiales/equipos
- **Cotizaciones**: Gestión de múltiples cotizaciones por solicitud
- **Aprobaciones**: Flujo de aprobación por jefes de área
- **Seguimiento**: Estado de cada solicitud y cotización

### ⏰ Módulo de Asistencia
- **Registro de entrada/salida**: Marcaje de asistencia
- **Reportes**: Historial de asistencia por empleado
- **Validaciones**: Control de horarios y retardos

### ⚙️ Módulo de Configuración
- **Organización**: Gestión de departamentos y áreas
- **Usuarios**: Administración de usuarios y permisos
- **Sistema**: Configuración general del ERP

## 🔧 API Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil del usuario
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/change-password` - Cambiar contraseña

### Empleados
- `GET /api/employees` - Listar empleados (requiere módulo EMPLEADOS)
- `GET /api/employees/:id` - Obtener empleado específico
- `POST /api/employees` - Crear nuevo empleado
- `PUT /api/employees/:id` - Actualizar empleado
- `DELETE /api/employees/:id` - Eliminar empleado
- `POST /api/employees/:id/documents` - Subir documentos

### Reclutamiento
- `POST /api/recruitment/vacancies` - Crear vacante
- `GET /api/recruitment/my-vacancies` - Mis solicitudes de vacante
- `GET /api/recruitment/vacancies` - Todas las vacantes (RH/ADMIN)
- `PUT /api/recruitment/vacancies/:id/approve` - Aprobar vacante
- `POST /api/recruitment/vacancies/:id/candidates` - Agregar candidato
- `PUT /api/recruitment/vacancies/:id/technical-profile` - Actualizar perfil técnico

### Compras
- `GET /api/purchases` - Listar solicitudes de compra
- `POST /api/purchases` - Crear solicitud de compra
- `GET /api/purchases/:id` - Obtener solicitud específica
- `POST /api/purchases/:id/quotes` - Agregar cotización
- `PUT /api/purchases/:id/approve` - Aprobar solicitud

### Asistencia
- `POST /api/attendance/check-in` - Registrar entrada
- `POST /api/attendance/check-out` - Registrar salida
- `GET /api/attendance/history/:employeeId` - Historial de asistencia
- `GET /api/attendance/today` - Asistencia del día actual

### Configuración
- `GET /api/organization/departments` - Listar departamentos
- `POST /api/organization/departments` - Crear departamento
- `GET /api/users` - Listar usuarios (ADMIN)
- `PUT /api/users/:id/permissions` - Actualizar permisos de usuario

### Estadísticas
- `GET /api/stats/employees` - Estadísticas de empleados
- `GET /api/stats/recruitment` - Estadísticas de reclutamiento
- `GET /api/stats/purchases` - Estadísticas de compras

## 🛠️ Scripts Útiles

### Backend
```bash
npm run dev           # Inicia servidor en modo desarrollo
npm start            # Inicia servidor en modo producción
npm run prisma:generate  # Genera cliente Prisma
npm run prisma:migrate   # Ejecuta migraciones
npm run prisma:seed      # Ejecuta seed de datos iniciales
npm run prisma:studio    # Abre Prisma Studio (UI para BD)
```

### Frontend
```bash
npm run dev    # Inicia servidor de desarrollo
npm run build  # Construye para producción
npm start      # Inicia servidor de producción
npm run lint   # Ejecuta ESLint para verificar código
```

### Docker
```bash
docker-compose up -d      # Iniciar todos los servicios
docker-compose logs -f    # Ver logs en tiempo real
docker-compose down       # Detener servicios
docker-compose restart    # Reiniciar servicios
```

## 🐳 Docker Compose

El archivo `docker-compose.yml` incluye:

1. **PostgreSQL 15**: Base de datos principal
2. **pgAdmin 4**: Interfaz web para administrar PostgreSQL

Para personalizar puertos o credenciales, editar el archivo `docker-compose.yml`.

## 🔐 Sistema de Permisos (ACL)

### Reglas Maestras
1. **NUNCA** usar validaciones rígidas de roles (`user.role === 'RH'`)
2. **SIEMPRE** usar el array `user.accessibleModules`
3. **Frontend**: Usar `<ProtectedRoute requiredModule="MODULO">`
4. **Backend**: Usar middleware `requireModule('MODULO')`

### Módulos Disponibles
| ID | Nombre | Descripción |
|----|--------|-------------|
| `EMPLEADOS` | Empleados | Gestión de empleados y expedientes |
| `RECLUTAMIENTO` | Reclutamiento | Gestión de vacantes y candidatos |
| `VACACIONES` | Vacaciones | Solicitud y aprobación de vacaciones |
| `INCIDENCIAS` | Incidencias | Reporte y seguimiento de incidencias |
| `CONFIGURACION` | Configuración | Configuración del sistema |
| `REPORTES` | Reportes | Generación de reportes y estadísticas |
| `DASHBOARD` | Dashboard | Panel principal (siempre activo) |

### Roles del Sistema
| Rol | Descripción | Módulos Típicos |
|-----|-------------|----------------|
| `ADMIN` | Administrador del sistema | Todos |
| `RH` | Recursos Humanos | EMPLEADOS, RECLUTAMIENTO, DASHBOARD |
| `SISTEMAS` | Jefe de Sistemas | CONFIGURACIÓN, DASHBOARD |
| `COMPRAS` | Jefe de Compras | COMPRAS, DASHBOARD |
| `PRODUCCION` | Jefe de Producción | DASHBOARD |

## 💻 Tecnologías Utilizadas

### Backend
- **Node.js 18+** - Entorno de ejecución JavaScript
- **Express 4.x** - Framework web minimalista
- **Prisma 5.x** - ORM moderno con type-safety
- **PostgreSQL 15** - Base de datos relacional
- **JWT** - Autenticación con JSON Web Tokens
- **bcrypt/bcryptjs** - Hash de contraseñas
- **express-validator** - Validación de datos
- **multer** - Manejo de uploads de archivos
- **csv-parser** - Procesamiento de archivos CSV

### Frontend
- **Next.js 14** - Framework React con App Router
- **React 18** - Biblioteca para interfaces de usuario
- **Tailwind CSS 3.x** - Framework de utilidades CSS
- **Axios** - Cliente HTTP para peticiones API
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas TypeScript
- **React Hot Toast** - Notificaciones en tiempo real
- **jwt-decode** - Decodificación de tokens JWT

### Infraestructura
- **Docker** - Contenedores para servicios
- **Docker Compose** - Orquestación de múltiples servicios
- **PostgreSQL** - Base de datos principal
- **pgAdmin** - Interfaz web para PostgreSQL

## 📝 Notas de Desarrollo

### Manejo de Fechas
- **Backend**: Guarda fechas en formato ISO/UTC
- **Frontend**: Formatea fechas a `DD/MM/YYYY` para la UI
- **Evitar bug del día anterior**: Extraer fecha sin zona horaria (`.substring(0,10)` o `split('T')[0]`) antes de convertir a `Date`

### Calidad del Código
- No dejar código huérfano (Dead Code)
- Revisar imports de React para evitar condiciones de carrera
- Usar controladores con métodos estáticos en backend
- Respuestas API consistentes: `{ data: ..., message: ... }`
- Mensajes de error claros y localizados (español)

### Seguridad
- Tokens JWT incluyen `accessibleModules` en el payload
- Middleware valida permisos en cada ruta protegida
- Contraseñas con hash bcrypt (salt rounds: 10)
- Invalidar tokens al cambiar contraseña
- CORS configurable por entorno

## 🧪 Pruebas y Estado Actual

### Módulos Verificados y Funcionando
- ✅ **Empleados**: CRUD completo, documentos adjuntos, permisos
- ✅ **Reclutamiento**: Solicitud, aprobación, candidatos, CVs
- ✅ **Compras**: Solicitudes, cotizaciones, aprobaciones
- ✅ **Asistencia**: Registro, historial, reportes
- ✅ **Autenticación**: Login, registro, JWT, permisos
- ✅ **Configuración**: Departamentos, usuarios, organización

### Scripts de Mantenimiento Disponibles
- `backend/scripts/diagnostico-bd.js` - Diagnóstico de base de datos
- `backend/scripts/unificar-bd-nuevo.js` - Unificación de datos
- `backend/scripts/estandarizar-puestos.js` - Estandarización de puestos
- `backend/scripts/verificar-roles.js` - Verificación de roles
- `backend/scripts/configurar-roles.js` - Configuración de