# ERP KRAM — Sistema de Gestión Empresarial

ERP completo para **Comercializadora KRAM**: empleados, reclutamiento, compras, incidencias y administración, con un sistema de permisos dinámico basado en **módulos** y **roles**.

## 🚀 Módulos

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| Dashboard | ✅ | Panel personal y de gestión (siempre activo) |
| Empleados | ✅ | Expedientes, documentos, organización, baja con motivo |
| Reclutamiento | ✅ | Requisición de personal → candidatos → contratación |
| Compras | ✅ | Solicitudes, cotizaciones, OC, papelería, uniformes e inventario (kardex) |
| Incidencias | ✅ | Asistencia / reporte de incidencias (checador ZKTeco) |
| Configuración | ✅ | Accesos, usuarios y roles |
| Vacaciones | ❌ | Sin implementar (deshabilitado) |
| Reportes | ❌ | Sin implementar (deshabilitado) |

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
npm test           # suite completa (14 suites, 99 tests)
npm run test:unit  # solo pruebas unitarias
```

Ver **[docs/TESTING.md](docs/TESTING.md)**.

## 🔒 Seguridad

- Modelo de control de acceso en **3 niveles**: módulos (A), scoping de datos (B), operaciones críticas (C).
- JWT con `role` y `accessibleModules`.
- Contraseñas con hash bcrypt (salt 10).
- **Solo ADMIN** cambia roles, elimina usuarios y gestiona roles personalizados.
