# ERP KRAM - Sistema de Gestión Empresarial

Sistema ERP completo para la empresa KRAM construido con tecnologías modernas.

## 🏗️ Arquitectura

El proyecto está dividido en dos partes principales:

### Backend
- **Node.js** con **Express**
- **Prisma** como ORM
- **PostgreSQL** como base de datos
- **Docker** para contenedores
- **JWT** para autenticación

### Frontend
- **Next.js 14** con App Router
- **React** con hooks
- **Tailwind CSS** para estilos
- **Context API** para estado global

## 📁 Estructura del proyecto

```
Mini-ERP-Kram/
├── backend/                 # API del sistema
│   ├── src/               # Código fuente
│   │   ├── controllers/   # Controladores de la API
│   │   ├── middlewares/   # Middlewares de autenticación
│   │   ├── routes/        # Definición de rutas
│   │   ├── utils/         # Utilidades
│   │   └── index.js       # Punto de entrada
│   ├── prisma/           # Configuración de Prisma
│   │   ├── schema.prisma # Esquema de base de datos
│   │   └── seed.js       # Datos iniciales
│   ├── .env.example      # Variables de entorno
│   ├── package.json      # Dependencias
│   └── README.md         # Documentación
├── frontend/              # Aplicación web
│   ├── app/              # App Router de Next.js
│   ├── components/       # Componentes React
│   ├── contexts/         # Contextos de React
│   ├── lib/             # Utilidades
│   ├── public/          # Archivos estáticos
│   ├── package.json     # Dependencias
│   └── README.md        # Documentación
├── docker-compose.yml    # Configuración de Docker
└── README.md            # Este archivo
```

## 🚀 Instalación rápida

### 1. Clonar el repositorio
```bash
git clone <repo-url>
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

## 🌐 Acceso a la aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **pgAdmin**: http://localhost:5050
- **Health Check**: http://localhost:3001/api/health

## 🔐 Credenciales de prueba

### Usuarios del sistema
- **Administrador**: admin@kram.com / admin123
- **Recursos Humanos**: rh@kram.com / rh123
- **Sistemas**: sistemas@kram.com / sistemas123
- **Compras**: compras@kram.com / compras123

### Base de datos PostgreSQL
- **Host**: localhost:5432
- **Database**: kram_erp
- **User**: kramadmin
- **Password**: krampassword123

### pgAdmin
- **URL**: http://localhost:5050
- **Email**: admin@kram.com
- **Password**: admin123

## 📊 Características implementadas

### Backend
- ✅ Autenticación JWT con roles
- ✅ API RESTful con Express
- ✅ Validación de datos con express-validator
- ✅ Middleware de autorización por roles
- ✅ Base de datos PostgreSQL con Prisma
- ✅ Seeds para datos iniciales
- ✅ CORS configurable

### Frontend
- ✅ Dashboard responsivo con sidebar
- ✅ Sistema de login/register
- ✅ Protección de rutas por roles
- ✅ Formularios con validación
- ✅ Notificaciones con toast
- ✅ Contexto de autenticación global
- ✅ Diseño moderno con Tailwind CSS

## 🛠️ Scripts útiles

### Backend
```bash
npm run dev           # Inicia servidor en modo desarrollo
npm start            # Inicia servidor en modo producción
npm run prisma:generate  # Genera cliente Prisma
npm run prisma:migrate   # Ejecuta migraciones
npm run prisma:seed      # Ejecuta seed de datos
npm run prisma:studio    # Abre Prisma Studio
```

### Frontend
```bash
npm run dev    # Inicia servidor de desarrollo
npm run build  # Construye para producción
npm start      # Inicia servidor de producción
npm run lint   # Ejecuta ESLint
```

## 🐳 Docker

### Iniciar todos los servicios
```bash
docker-compose up -d
```

### Ver logs
```bash
docker-compose logs -f
```

### Detener servicios
```bash
docker-compose down
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/change-password` - Cambiar contraseña

### Health Check
- `GET /api/health` - Verificar estado del servidor

## 🔧 Tecnologías utilizadas

### Backend
- Node.js 18+
- Express 4.x
- Prisma 5.x
- PostgreSQL 15
- JWT para autenticación
- bcryptjs para hash de passwords
- express-validator para validación

### Frontend
- Next.js 14
- React 18
- Tailwind CSS 3.x
- Axios para peticiones HTTP
- React Hook Form para formularios
- Zod para validación de esquemas
- React Hot Toast para notificaciones

### Infraestructura
- Docker
- Docker Compose
- pgAdmin 4

## 📝 Notas de desarrollo

1. **Seguridad**: En producción, cambiar todas las contraseñas por defecto
2. **JWT**: Usar una clave secreta fuerte para JWT
3. **CORS**: Configurar dominios permitidos según el entorno
4. **Base de datos**: Realizar backups periódicos
5. **Logs**: Implementar sistema de logs para producción

## 🚧 Próximas características

- [ ] Módulo de inventario completo
- [ ] Sistema de compras y proveedores
- [ ] Módulo de recursos humanos
- [ ] Reportes y dashboards avanzados
- [ ] Sistema de tickets de soporte
- [ ] Integración con sistemas de pago
- [ ] Notificaciones en tiempo real
- [ ] Exportación de datos a Excel/PDF

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

## 👥 Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request