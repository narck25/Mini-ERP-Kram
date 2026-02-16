# ERP KRAM - Backend

Backend del sistema ERP para KRAM construido con Node.js, Express, Prisma y PostgreSQL.

## 🚀 Características

- ✅ Autenticación JWT con roles (Admin, RH, Sistemas, Compras)
- ✅ API RESTful
- ✅ Base de datos PostgreSQL con Docker
- ✅ Validación de datos con express-validator
- ✅ Middleware de autorización por roles
- ✅ Seeds para datos iniciales
- ✅ CORS configurable

## 📋 Prerrequisitos

- Node.js 18+
- Docker y Docker Compose
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repo-url>
   cd Mini-ERP-Kram/backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Editar el archivo `.env` con tus configuraciones.

4. **Iniciar base de datos con Docker**
   ```bash
   docker-compose up -d
   ```

5. **Ejecutar migraciones de Prisma**
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Generar cliente Prisma**
   ```bash
   npx prisma generate
   ```

7. **Ejecutar seed de datos iniciales**
   ```bash
   npm run prisma:seed
   ```

## 🚀 Ejecución

**Modo desarrollo:**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

## 📊 Base de datos

### Acceso a pgAdmin
- URL: http://localhost:5050
- Email: admin@kram.com
- Password: admin123

### Credenciales PostgreSQL
- Host: localhost
- Port: 5432
- Database: kram_erp
- User: kramadmin
- Password: krampassword123

## 🔐 Autenticación

### Usuarios de prueba

1. **Administrador**
   - Email: admin@kram.com
   - Password: admin123
   - Rol: ADMIN

2. **Recursos Humanos**
   - Email: rh@kram.com
   - Password: rh123
   - Rol: RH

3. **Sistemas**
   - Email: sistemas@kram.com
   - Password: sistemas123
   - Rol: SISTEMAS

4. **Compras**
   - Email: compras@kram.com
   - Password: compras123
   - Rol: COMPRAS

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil (requiere autenticación)
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/change-password` - Cambiar contraseña

### Health Check
- `GET /api/health` - Verificar estado del servidor

## 🏗️ Estructura del proyecto

```
backend/
├── src/
│   ├── controllers/     # Controladores de la API
│   ├── middlewares/     # Middlewares de autenticación/autorización
│   ├── routes/          # Definición de rutas
│   ├── utils/           # Utilidades (auth, validaciones, etc.)
│   └── index.js         # Punto de entrada
├── prisma/
│   ├── schema.prisma    # Esquema de base de datos
│   └── seed.js          # Datos iniciales
├── .env.example         # Variables de entorno de ejemplo
├── package.json         # Dependencias y scripts
└── README.md            # Documentación
```

## 🔧 Scripts disponibles

- `npm run dev` - Inicia servidor en modo desarrollo con nodemon
- `npm start` - Inicia servidor en modo producción
- `npm run prisma:generate` - Genera cliente Prisma
- `npm run prisma:migrate` - Ejecuta migraciones
- `npm run prisma:studio` - Abre Prisma Studio
- `npm run prisma:seed` - Ejecuta seed de datos iniciales

## 🐳 Docker

### Iniciar servicios
```bash
docker-compose up -d
```

### Detener servicios
```bash
docker-compose down
```

### Ver logs
```bash
docker-compose logs -f
```

## 📝 Notas

- El backend corre por defecto en el puerto 3001
- El frontend debe apuntar a http://localhost:3001
- Las variables de JWT deben ser seguras en producción
- Los passwords en el seed son solo para desarrollo