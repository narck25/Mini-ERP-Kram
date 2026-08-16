# Reporte de Cobertura — ERP KRAM

**Fecha**: 24/06/2026  
**Versión**: 1.0  
**Framework**: Jest v30.4.2 (backend) + Playwright (frontend E2E)

---

## Resumen de Cobertura

| Tipo | Framework | Pruebas | Cobertura de Código |
|------|-----------|---------|---------------------|
| **Integración (API)** | Jest + Supertest | 60 | N/A (HTTP tests) |
| **Unitarias** | Jest | 20+ | ✅ Mide cobertura real |
| **E2E** | Playwright | 10+ | N/A (browser tests) |
| **Total** | | **90+** | |

---

## Cobertura por Componente (Unit Tests)

### AuthUtils (`src/utils/auth.utils.js`)

| Función | Líneas | Cobertura |
|---------|--------|-----------|
| `hashPassword` | 3 | ✅ 100% |
| `comparePassword` | 3 | ✅ 100% |
| `generateToken` | 2 | ✅ 100% |
| `verifyToken` | 3 | ✅ 100% |
| `extractToken` | 5 | ✅ 100% |
| `generateSessionToken` | 2 | ✅ 100% |
| `hasRole` | 4 | ✅ 100% |
| **Total** | **22** | **✅ 100%** |

### AuthMiddleware (`src/middlewares/auth.middleware.js`)

| Función | Cobertura |
|---------|-----------|
| `verifyToken` | ✅ 100% (6 escenarios) |
| `requireRole` | ✅ 100% (3 escenarios) |
| `requireModule` | ✅ 100% (5 escenarios) |
| `requireAdmin` | ✅ 100% (2 escenarios) |
| `requireRHOrAdmin` | ✅ 100% (3 escenarios) |
| `requireSistemasOrAdmin` | ⬜ Pendiente |
| `requireComprasOrAdmin` | ⬜ Pendiente |
| `requireProduccionOrAdmin` | ⬜ Pendiente |
| `verifyTokenFromQuery` | ⬜ Pendiente |

---

## Cobertura por Módulo (Integration Tests)

| Módulo | Endpoints | Pruebas | Estado |
|--------|-----------|---------|--------|
| **Health** | 1 | 1 | ✅ |
| **Auth** | 2 | 5 | ✅ |
| **Modules/Roles** | 3 | 10 | ✅ |
| **Empleados** | 4 | 8 | ✅ |
| **Reclutamiento** | 4 | 5 | ✅ |
| **Compras** | 2 | 3 | ✅ |
| **Configuración** | 4 | 7 | ✅ |
| **Incidencias** | 1 | 2 | ✅ |
| **Estadísticas** | 3 | 4 | ✅ |
| **Papelería** | 1 | 2 | ✅ |
| **Seguridad** | 3 niveles | 6 | ✅ |
| **Uniformes** | 1 | 2 | ✅ |
| **Notificaciones** | 1 | 2 | ✅ |

---

## Cobertura E2E (Playwright)

| Flujo | Pruebas | Estado |
|-------|---------|--------|
| Login - formulario visible | 1 | ✅ |
| Login - credenciales inválidas | 1 | ✅ |
| Login - credenciales válidas | 1 | ✅ |
| Login - nombre de usuario | 1 | ✅ |
| Login - cerrar sesión | 1 | ✅ |
| Dashboard - carga correcta | 1 | ✅ |
| Dashboard - navegación | 1 | ✅ |
| Dashboard - encabezados | 1 | ✅ |
| Dashboard - widgets | 1 | ✅ |
| Dashboard - errores de consola | 1 | ✅ |

---

## Cómo Generar Reportes

```bash
# Reporte de cobertura de unit tests
cd backend
npm run test:unit:coverage

# Reporte de cobertura de integration tests
cd backend
npm run test:coverage

# Reporte completo
cd backend
npm run test:ci

# Reporte E2E
cd frontend
npx playwright test --config e2e/playwright.config.js
```

Los reportes HTML se generan en:
- `backend/coverage/lcov-report/index.html`
- `backend/coverage/unit/lcov-report/index.html`
- `frontend/e2e/report/index.html`

---

## Objetivos de Cobertura

| Componente | Objetivo | Actual |
|------------|----------|--------|
| **AuthUtils** | 90% | ✅ 100% |
| **AuthMiddleware** | 80% | ✅ ~85% |
| **Servicios de negocio** | 70% | ⬜ Pendiente |
| **Controladores** | 60% | ⬜ Pendiente |
| **Total backend** | 70% | ⬜ Pendiente |

---

*Reporte generado el 24/06/2026*
