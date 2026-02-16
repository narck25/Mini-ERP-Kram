# ERP KRAM - Frontend

Frontend del sistema ERP para KRAM construido con Next.js 14, React y Tailwind CSS.

## 🚀 Características

- ✅ Autenticación JWT con roles (Admin, RH, Sistemas, Compras)
- ✅ Dashboard responsivo con sidebar
- ✅ Sistema de rutas protegidas por roles
- ✅ Formularios con validación usando React Hook Form y Zod
- ✅ Notificaciones con React Hot Toast
- ✅ API client con interceptores para tokens
- ✅ Contexto de autenticación global
- ✅ Diseño moderno con Tailwind CSS

## 📋 Prerrequisitos

- Node.js 18+
- Backend del ERP KRAM corriendo en puerto 3001

## 🛠️ Instalación

1. **Navegar al directorio frontend**
   ```bash
   cd frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en navegador**
   ```
   http://localhost:3000
   ```

## 🎨 Estructura del proyecto

```
frontend/
├── app/                    # App Router de Next.js
│   ├── dashboard/         # Páginas del dashboard
│   ├── login/            # Página de login
│   ├── register/         # Página de registro
│   ├── globals.css       # Estilos globales
│   ├── layout.js         # Layout principal
│   └── page.js           # Página de inicio
├── components/           # Componentes reutilizables
│   └── DashboardLayout.js # Layout del dashboard
├── contexts/            # Contextos de React
│   └── AuthContext.js   # Contexto de autenticación
├── lib/                 # Utilidades y configuraciones
│   ├── api.js          # Cliente API con axios
│   └── auth.js         # Utilidades de autenticación
├── hooks/              # Custom hooks
├── utils/              # Funciones utilitarias
├── public/             # Archivos estáticos
└── package.json        # Dependencias y scripts
```

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

### Flujo de autenticación

1. **Login**: Los usuarios inician sesión con email y contraseña
2. **Token JWT**: Se almacena en localStorage
3. **Contexto**: El estado de autenticación se maneja globalmente
4. **Protección de rutas**: Las rutas se protegen según el rol del usuario
5. **Logout**: Invalida el token y limpia el estado

## 📱 Componentes principales

### AuthContext
Contexto global que maneja:
- Estado de autenticación del usuario
- Funciones de login, registro y logout
- Verificación de roles
- Persistencia de sesión

### DashboardLayout
Layout principal del dashboard que incluye:
- Sidebar responsivo con navegación
- Filtrado de menú según roles
- Header con información del usuario
- Botón de logout

### API Client
Cliente HTTP con:
- Interceptores para agregar tokens automáticamente
- Manejo de errores de autenticación
- Configuración base para todas las peticiones

## 🎯 Rutas disponibles

- `/` - Página de inicio (redirige al dashboard si está autenticado)
- `/login` - Página de inicio de sesión
- `/register` - Página de registro
- `/dashboard` - Dashboard principal (requiere autenticación)

## 🛡️ Protección de rutas

Las rutas se protegen en dos niveles:

1. **Autenticación**: Verifica que el usuario tenga un token válido
2. **Roles**: Verifica que el usuario tenga los permisos necesarios

Ejemplo de protección por roles en el sidebar:
```javascript
{ name: 'Usuarios', href: '/dashboard/users', icon: '👥', roles: ['ADMIN'] }
```

## 🔧 Scripts disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia servidor de producción
- `npm run lint` - Ejecuta ESLint

## 🎨 Estilos

- **Tailwind CSS**: Framework de utilidades CSS
- **Componentes personalizados**: Clases reutilizables en `globals.css`
- **Diseño responsivo**: Mobile-first approach
- **Sistema de colores**: Paleta personalizada en `tailwind.config.js`

## 🔄 Integración con Backend

El frontend se comunica con el backend a través de:
- **Proxy**: Las peticiones a `/api/*` se redirigen a `http://localhost:3001`
- **Headers**: Los tokens JWT se envían automáticamente en el header `Authorization`
- **CORS**: Configurado para permitir peticiones desde `http://localhost:3000`

## 📝 Notas de desarrollo

- El frontend corre en el puerto 3000 por defecto
- Los tokens se almacenan en localStorage (considerar HttpOnly cookies para producción)
- Los formularios usan validación del lado del cliente y servidor
- El diseño es completamente responsivo
- Los iconos son emojis (considerar una librería de iconos para producción)