# Guía de Testing — ERP KRAM

**Versión**: 1.0  
**Última actualización**: 24/06/2026

---

## Índice

1. [Introducción](#1-introducción)
2. [Estructura de Pruebas](#2-estructura-de-pruebas)
3. [Pruebas de Integración (API)](#3-pruebas-de-integración-api)
4. [Pruebas Unitarias](#4-pruebas-unitarias)
5. [Pruebas E2E (Playwright)](#5-pruebas-e2e-playwright)
6. [GitHub Actions (CI/CD)](#6-github-actions-cicd)
7. [Buenas Prácticas](#7-buenas-prácticas)
8. [Solución de Problemas](#8-solución-de-problemas)

---

## 1. Introducción

El ERP KRAM cuenta con una suite de pruebas de **3 niveles**:

| Nivel | Framework | Propósito | Dependencias |
|-------|-----------|-----------|--------------|
| **Integración** | Jest + Supertest | Probar endpoints HTTP reales | Backend + BD |
| **Unitarias** | Jest | Probar funciones aisladas | Ninguna (mocks) |
| **E2E** | Playwright | Probar flujos completos en navegador | Frontend + Backend + BD |

### Stack de Testing

```
Jest v30.4.2       → Framework principal de pruebas
Supertest v7.2.2   → Cliente HTTP para pruebas de API
Playwright         → Automatización de navegador para E2E
```

---

## 2. Estructura de Pruebas

```
backend/
├── tests/
│   ├── helpers/
│   │   └── setup.js              ← Helper HTTP + getToken()
│   ├── 01-health.test.js          ← Health Check
│   ├── 02-auth.test.js            ← Autenticación
│   ├── 03-modules-roles.test.js   ← Módulos, Roles, Presets
│   ├── 04-employees.test.js       ← Empleados
│   ├── 05-recruitment.test.js     ← Reclutamiento
│   ├── 06-purchases.test.js       ← Compras
│   ├── 07-config.test.js          ← Configuración
│   ├── 08-incidencias.test.js     ← Incidencias
│   ├── 09-stats.test.js           ← Estadísticas
│   ├── 10-other-modules.test.js   ← Papelería, Uniformes, Notif.
│   ├── 11-security.test.js        ← Seguridad (3 niveles)
│   └── unit/
│       ├── services/
│       │   ├── auth.service.test.js
│       │   └── purchase-order.service.test.js
│       └── middlewares/
│           └── auth.middleware.test.js
├── jest.config.js                 ← Config integración
├── jest.unit.config.js            ← Config unit tests
└── package.json                   ← Scripts de prueba

frontend/
└── e2e/
    ├── playwright.config.js       ← Config Playwright
    ├── login.spec.js              ← Pruebas de login
    └── dashboard.spec.js          ← Pruebas de dashboard
```

---

## 3. Pruebas de Integración (API)

### Propósito
Verificar que los endpoints HTTP funcionan correctamente contra una base de datos real.

### Requisitos
- Backend corriendo (`npm start`)
- Base de datos PostgreSQL con datos seed
- Puerto 4000 disponible

### Ejecución

```bash
# Todas las pruebas de integración
cd backend
npm test

# Modo verbose
npm run test:verbose

# Con reporte de cobertura
npm run test:coverage

# Modo watch (desarrollo)
npm run test:watch
```

### Estructura de una prueba

```javascript
const { api, getToken } = require('./helpers/setup');

describe('🔐 Módulo', () => {
  let token;

  beforeAll(async () => {
    token = await getToken('admin@kram.mx', 'Admin123!');
  });

  test('GET /api/endpoint - descripción', async () => {
    const res = await api.get('/api/endpoint')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});
```

### Helper `setup.js`

```javascript
const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:4000/api';

const api = request(API_URL);

const getToken = async (email, password) => {
  const res = await api.post('/auth/login').send({ email, password });
  return res.body.token;
};

module.exports = { api, getToken };
```

---

## 4. Pruebas Unitarias

### Propósito
Verificar funciones de forma aislada usando mocks. No requieren base de datos.

### Ejecución

```bash
# Todas las pruebas unitarias
cd backend
npm run test:unit

# Con cobertura
npm run test:unit:coverage
```

### Patrón de Mocking

```javascript
// Mock de dependencias externas
jest.mock('../../../src/utils/auth.utils', () => ({
  extractToken: jest.fn(),
  verifyToken: jest.fn(),
  hasRole: jest.fn()
}));

// Mock de Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: { findUnique: jest.fn() }
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});
```

### Estructura de una prueba unitaria

```javascript
describe('🔐 AuthUtils - Pruebas Unitarias', () => {
  describe('hashPassword', () => {
    test('debe generar un hash para una contraseña', async () => {
      const hash = await AuthUtils.hashPassword('password123');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });
});
```

---

## 5. Pruebas E2E (Playwright)

### Propósito
Verificar flujos completos desde el navegador, incluyendo UI e interacciones.

### Requisitos
- Frontend corriendo (`npm run dev` en `frontend/`)
- Backend corriendo (`npm start` en `backend/`)
- Playwright instalado

### Instalación

```bash
cd frontend
npm install -D @playwright/test
npx playwright install chromium
```

### Ejecución

```bash
# Todas las pruebas E2E
cd frontend
npx playwright test --config e2e/playwright.config.js

# Modo visible (ver el navegador)
npx playwright test --config e2e/playwright.config.js --headed

# Prueba específica
npx playwright test --config e2e/playwright.config.js --grep "Login"

# Ver reporte HTML
npx playwright show-report e2e/report
```

### Estructura de una prueba E2E

```javascript
const { test, expect } = require('@playwright/test');

test.describe('🔐 Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('debe redirigir al dashboard con credenciales válidas', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@kram.mx');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    expect(page.url()).toContain('dashboard');
  });
});
```

---

## 6. GitHub Actions (CI/CD)

### Workflows Disponibles

| Workflow | Archivo | Evento |
|----------|---------|--------|
| **Backend CI** | `.github/workflows/backend-ci.yml` | Push/PR a main/develop |
| **Frontend CI** | `.github/workflows/frontend-ci.yml` | Push/PR a main/develop |

### Backend CI

Ejecuta en cada push/PR:
1. ✅ Checkout del código
2. ✅ Setup Node.js 18
3. ✅ Instalación de dependencias (`npm ci`)
4. ✅ Generación de Prisma Client
5. ✅ Migraciones de base de datos
6. ✅ Seed de datos de prueba
7. ✅ Pruebas de integración con cobertura
8. ✅ Pruebas unitarias con cobertura
9. ✅ Subida de reportes de cobertura como artefactos

### Frontend CI

Ejecuta en cada push/PR:
1. ✅ Checkout del código
2. ✅ Setup Node.js 18
3. ✅ Instalación de dependencias (`npm ci`)
4. ✅ Linter (ESLint)
5. ✅ Build de producción
6. ⬜ Pruebas E2E (deshabilitadas hasta configurar servicios)

### Configuración de CI

Las variables de entorno necesarias:
```yaml
env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/kram_test
  JWT_SECRET: ci-test-secret
  JWT_EXPIRES_IN: 1h
  PORT: 4000
```

---

## 7. Buenas Prácticas

### Para pruebas de integración

1. **Usar datos seed reales** — Las pruebas deben funcionar con los datos del seed
2. **Probar casos de éxito y error** — 200, 400, 401, 403, 404
3. **No modificar la base de datos** — Las pruebas son de solo lectura
4. **Usar `beforeAll` para obtener tokens** — No repetir login en cada test
5. **Mantener pruebas independientes** — Cada prueba debe poder ejecutarse sola

### Para pruebas unitarias

1. **Aislar completamente** — Usar mocks para todas las dependencias externas
2. **Probar un solo comportamiento** — Una prueba = un escenario
3. **Nombrar claramente** — `debe retornar 401 si no hay token`
4. **No probar Prisma** — Las consultas a BD se prueban en integración
5. **Cubrir casos edge** — Null, undefined, arrays vacíos, strings vacíos

### Para pruebas E2E

1. **Usar selectores robustos** — Preferir `data-testid` sobre clases CSS
2. **Esperar elementos** — Usar `waitForSelector` en lugar de `setTimeout`
3. **Capturar pantallas en fallos** — Configurar `screenshot: 'only-on-failure'`
4. **No depender de datos específicos** — Usar datos del seed
5. **Mantener pocas pruebas E2E** — Son lentas, priorizar flujos críticos

---

## 8. Solución de Problemas

### Error: `ECONNREFUSED` en pruebas de integración

```bash
# El backend no está corriendo
cd backend && npm start
# En otra terminal:
cd backend && npm test
```

### Error: `PrismaClientInitializationError`

```bash
# La base de datos no está disponible
# Verificar que PostgreSQL está corriendo
# Verificar DATABASE_URL en .env
```

### Error: `JWT_SECRET not set`

```bash
# Crear archivo .env en backend/
echo "JWT_SECRET=my-secret-key" >> backend/.env
echo "DATABASE_URL=postgresql://..." >> backend/.env
```

### Error: Playwright no encuentra navegadores

```bash
cd frontend
npx playwright install chromium
```

### Error: Pruebas unitarias fallan por mocks

```bash
# Verificar que los mocks están correctamente configurados
# Limpiar caché de Jest
cd backend
npx jest --clearCache
```

---

## Comandos Rápidos

```bash
# Backend
cd backend
npm test                    # Integración
npm run test:unit           # Unitarias
npm run test:all            # Todas
npm run test:ci             # CI (integración + unitarias con cobertura)
npm run test:coverage       # Cobertura de integración
npm run test:unit:coverage  # Cobertura de unitarias

# Frontend E2E
cd frontend
npx playwright test --config e2e/playwright.config.js
```

---

*Documentación mantenida por el equipo de QA — ERP KRAM*
