# Módulo de Reclutamiento - ERP KRAM

## Descripción
Módulo completo de reclutamiento para el ERP KRAM que permite a los jefes de área solicitar vacantes y al personal de RH gestionar el proceso de contratación.

## Características Principales

### 1. **Solicitud de Vacantes por Jefes de Área**
- Los jefes de Sistemas y Compras pueden crear solicitudes de vacantes
- Formulario completo con: título, descripción, departamento, posición, rango salarial, requisitos y responsabilidades
- Seguimiento del estado de cada solicitud (Pendiente, Aprobada, Buscando, Cerrada)

### 2. **Dashboard de RH**
- Vista completa de todas las vacantes con filtros por estado y departamento
- Estadísticas en tiempo real (total, pendientes, aprobadas, buscando, cerradas)
- Aprobación/rechazo de vacantes con un solo clic
- Gestión de actividades del puesto (entrevistas, pruebas, etc.)

### 3. **Gestión de Actividades del Puesto**
- Creación de actividades específicas para cada vacante (entrevistas técnicas, pruebas prácticas, etc.)
- Priorización de actividades (baja, media, alta)
- Seguimiento de actividades completadas
- Asignación de duración estimada

### 4. **Gestión de Candidatos**
- Registro de candidatos por vacante
- Seguimiento de estado (Pendiente, En Proceso, Rechazado, Contratado)
- Notas y fechas de entrevista
- Enlace a CV/Resumen

## Estructura de Base de Datos

### Modelos Principales

#### 1. **Employee** (Empleado)
- Relación 1:1 con User
- Información laboral: departamento, posición, fecha de contratación, salario
- Creador automático al primer login de jefes de área

#### 2. **JobVacancy** (Vacante)
- Estados: PENDIENTE, APROBADA, BUSCANDO, CERRADA
- Información completa del puesto
- Relación con Employee (creador) y User (aprobador de RH)
- Fechas de aprobación y cierre

#### 3. **JobActivity** (Actividad del Puesto)
- Actividades específicas para cada vacante
- Prioridad (1-3) y estado de completado
- Descripción y duración estimada

#### 4. **Candidate** (Candidato)
- Información personal y de contacto
- Estado del proceso de selección
- Notas y fecha de entrevista
- Enlace a CV

## Flujo de Trabajo

### Para Jefes de Área (Sistemas/Compras):
1. **Login** → Dashboard principal
2. **Acceder a "Mis Solicitudes"** → Ver vacantes existentes o crear nueva
3. **Crear Vacante** → Completar formulario y enviar
4. **Seguimiento** → Ver estado (Pendiente → Aprobada → Buscando → Cerrada)

### Para RH/Admin:
1. **Login** → Dashboard principal
2. **Acceder a "Dashboard RH"** → Ver todas las vacantes
3. **Aprobar/Rechazar** → Cambiar estado de vacantes pendientes
4. **Agregar Actividades** → Para vacantes aprobadas
5. **Gestionar Candidatos** → Registrar y seguir candidatos

## Endpoints API

### Vacantes
- `POST /api/vacancies` - Crear nueva vacante (jefes de área)
- `GET /api/vacancies/my` - Obtener vacantes del usuario (mis solicitudes)
- `GET /api/vacancies` - Obtener todas las vacantes (RH/Admin)
- `GET /api/vacancies/stats` - Estadísticas de vacantes
- `PUT /api/vacancies/:id/approve` - Aprobar/rechazar/cerrar vacante
- `GET /api/vacancies/:id` - Obtener detalles de vacante

### Actividades
- `POST /api/vacancies/:id/activities` - Agregar actividad a vacante
- `PUT /api/activities/:activityId` - Actualizar actividad (marcar como completada)

## Credenciales de Prueba

### Usuarios Disponibles:
1. **Administrador**
   - Email: `admin@kram.com`
   - Password: `password123`
   - Rol: ADMIN (acceso completo)

2. **Recursos Humanos**
   - Email: `rh@kram.com`
   - Password: `password123`
   - Rol: RH (dashboard de reclutamiento)

3. **Jefe de Sistemas**
   - Email: `sistemas@kram.com`
   - Password: `password123`
   - Rol: SISTEMAS (mis solicitudes)

4. **Jefe de Compras**
   - Email: `compras@kram.com`
   - Password: `password123`
   - Rol: COMPRAS (mis solicitudes)

5. **Otros usuarios** (sistemas2@kram.com, compras2@kram.com)

## Instalación y Configuración

### 1. Requisitos Previos
- Node.js 18+
- PostgreSQL 14+
- Docker (opcional, para desarrollo)

### 2. Configuración Backend
```bash
cd backend
npm install
cp .env.example .env
# Configurar DATABASE_URL en .env
npx prisma migrate dev
npm run seed
npm run dev
```

### 3. Configuración Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Acceso
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## Estructura de Archivos

```
backend/
├── src/
│   ├── controllers/
│   │   └── vacancy.controller.js    # Controlador de vacantes
│   ├── routes/
│   │   └── vacancy.routes.js        # Rutas de vacantes
│   └── index.js                     # Servidor principal
├── prisma/
│   ├── schema.prisma                # Esquema de base de datos
│   └── seed.js                      # Datos de prueba
└── package.json

frontend/
├── app/
│   ├── my-vacancies/
│   │   └── page.js                  # Mis solicitudes (jefes)
│   ├── rh-dashboard/
│   │   └── page.js                  # Dashboard RH
│   ├── vacancies/[id]/activities/
│   │   └── page.js                  # Gestión de actividades
│   └── dashboard/
│       └── page.js                  # Dashboard principal
└── package.json
```

## Tecnologías Utilizadas

### Backend
- **Node.js** + **Express** - Servidor API
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **bcryptjs** - Encriptación de contraseñas

### Frontend
- **Next.js 14** - Framework React
- **React** + **Hooks** - Interfaz de usuario
- **Tailwind CSS** - Estilos
- **Axios** - Cliente HTTP
- **React Hot Toast** - Notificaciones

## Próximas Mejoras

1. **Notificaciones por Email** - Alertas cuando una vacante cambia de estado
2. **Subida de Archivos** - CVs de candidatos
3. **Calendario de Entrevistas** - Integración con Google Calendar
4. **Reportes Avanzados** - Métricas de reclutamiento
5. **Workflow Personalizado** - Estados personalizables por empresa
6. **Integración con LinkedIn** - Importación de candidatos
7. **Evaluación de Candidatos** - Sistema de scoring
8. **Colaboración en Equipo** - Comentarios y votos sobre candidatos

## Contribución

1. Fork del repositorio
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia
Este proyecto está bajo la licencia MIT.

## Contacto
Para preguntas o soporte, contactar al equipo de desarrollo.

---

**Nota**: Este módulo está diseñado para ser extensible y puede integrarse con otros módulos del ERP KRAM como nóminas, capacitación y evaluación de desempeño.