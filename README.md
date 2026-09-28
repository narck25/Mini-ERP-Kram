# ERP KRAM — Sistema de Gestión Empresarial

ERP completo para **Comercializadora KRAM**: empleados, reclutamiento, compras, incidencias y administración, con un sistema de permisos dinámico basado en **módulos** y **roles**.

## 🚀 Módulos

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| Dashboard | ✅ | Panel personal y de gestión (siempre activo) |
| Empleados | ✅ | Expedientes, documentos, organización, baja con motivo |
| Reclutamiento | ✅ | Requisición de personal → candidatos → contratación |
| Compras | ✅ | Solicitudes, cotizaciones, OC, papelería, uniformes e inventario (kardex), proveedores |
| Incidencias | ✅ | Asistencia / reporte de incidencias (checador ZKTeco) |
| Vacaciones | ✅ | Solicitud y aprobación en dos niveles, saldo según Ley Federal del Trabajo |
| Incapacidades | ✅ | Registro y seguimiento de incapacidades médicas |
| Disciplina | ✅ | Faltas, retardos y actas administrativas por empleado |
| Reportes | ✅ | 5 reportes exportables a Excel (empleados, compras, inventario, asistencia, vacaciones) |
| Configuración | ✅ | Accesos, usuarios y roles |

Sin gate de módulo propio (visibles por rol — RH/ADMIN):

| Funcionalidad | Descripción |
|--------|-------------|
| Periodo de prueba | Recordatorios automáticos y evaluación a los 30/60/90 días, con autoevaluación previa del colaborador |
| Evaluación operativa trimestral | Para 6 puestos operativos, con criterios y pesos propios por puesto |
| Auditoría de RH | Bitácora de cambios sobre expedientes, para trazabilidad |

## 🔐 Roles

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Administrador — acceso total + operaciones críticas |
| `RH` | Recursos Humanos — acceso total operativo |
| `SISTEMAS` | Soporte técnico |
| `COMPRAS` | Compras |
| `PRODUCCION` | Producción |
| `EMPLEADO_BASICO` | Empleado — acceso básico |

## 🏗️ Stack tecnológico

- **Backend**: Node.js + Express + Prisma + PostgreSQL + JWT + Multer + csv-parser
- **Frontend**: Next.js 14 (App Router) + React 18 + Tailwind CSS + Axios
- **Infraestructura**: Docker + Docker Compose + GitHub Actions

## 📁 Estructura

```
Mini-ERP-Kram/
├── backend/          # API (controllers, services, routes, middlewares, prisma)
├── frontend/         # App Next.js (app, components, contexts, lib)
├── docs/             # Documentación por módulo (manuales + flujos)
├── docuold/          # Documentación técnica archivada
└── docker-compose.yml
```

## 📚 Documentación

Ver **[docs/README.md](docs/README.md)**:

- **Manuales por módulo** → `docs/modules/`
- **Flujos de negocio** (con diagramas Mermaid) → `docs/flujos/`
- **Estado del proyecto** → `docs/ESTADO_DEL_PROYECTO.md`
- **Pruebas** → `docs/TESTING.md`
- **Deuda técnica y mejoras** → `docs/DEUDA_TECNICA.md`

## 🚀 Instalación rápida

```bash
# 1. Clonar
git clone https://github.com/narck25/Mini-ERP-Kram.git
cd Mini-ERP-Kram

# 2. Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# 3. Frontend (en otra terminal)
cd ../frontend
npm install
npm run dev
```

Configura las variables de entorno a partir de `backend/.env.example`.

## 🧪 Pruebas

```bash
cd backend
npm test           # suite completa (34 archivos: 22 de integración + 12 unitarios)
npm run test:unit  # solo pruebas unitarias
```

Ver **[docs/TESTING.md](docs/TESTING.md)**. No queda ningún módulo de negocio sin al menos una prueba automatizada.

## 🔒 Seguridad

- Modelo de control de acceso en **3 niveles**: módulos (A), scoping de datos (B), operaciones críticas (C).
- JWT con `role` y `accessibleModules`, con sesión revocable en base de datos (logout y cambio de contraseña cortan el acceso al instante, sin esperar a que expire el token).
- Contraseñas con hash bcrypt (salt 10).
- Verificación del contenido real de los archivos subidos (no solo la extensión declarada).
- Rate limiting en login, reseteo de base de datos y restablecimiento de contraseña por admin.
- **Solo ADMIN** cambia roles, elimina usuarios y gestiona roles personalizados.

Ver **[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)** para el detalle técnico completo y **[RESUMEN_DIRECCION.md](RESUMEN_DIRECCION.md)** para el resumen ejecutivo.
