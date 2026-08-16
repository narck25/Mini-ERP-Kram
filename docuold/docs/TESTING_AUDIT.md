# Auditoría de Calidad del Sistema de Testing — ERP KRAM

**Fecha**: 24/06/2026  
**Versión**: 1.0  
**Auditor**: QA Lead / Software Architect  
**Tipo**: Auditoría de calidad y cobertura (sin generación de nuevas pruebas)

---

## Índice

1. [Madurez del Testing](#1-madurez-del-testing)
2. [Gaps Detectados](#2-gaps-detectados)
3. [Riesgos](#3-riesgos)
4. [Cobertura por Módulo](#4-cobertura-por-módulo)
5. [Recomendaciones](#5-recomendaciones)
6. [Roadmap de Calidad](#6-roadmap-de-calidad)

---

## 1. Madurez del Testing

### 1.1 Unit Testing — Calificación: **6/10**

**Fortalezas:**
- AuthUtils: 20 pruebas, cobertura 100% de 7 funciones (hash, compare, JWT, extract, hasRole, session)
- AuthMiddleware: 19 pruebas, cobertura 100% de 5 middlewares (verifyToken, requireRole, requireModule, requireAdmin, requireRHOrAdmin)
- Mocks bien estructurados con `jest.mock()` y `jest.fn()`
- Pruebas aisladas sin dependencia de base de datos
- Configuración dedicada (`jest.unit.config.js`) con 10s timeout

**Debilidades:**
- PurchaseOrderService: solo 2 pruebas, una de ellas vacía (`expect(true).toBe(true)`)
- **0 servicios de negocio probados** de 11 disponibles (audit, email, birthday, approval, comparison, purchase, quote, stationery, uniform, notification, sse-manager)
- **0 controladores probados** de 18 disponibles
- **0 utilidades probadas** de 3 disponibles (csvMapper, salaryCalculator)
- No se prueba `upload.middleware.js`
- No se prueban middlewares departamentales (requireSistemasOrAdmin, requireComprasOrAdmin, requireProduccionOrAdmin, verifyTokenFromQuery)
- No hay pruebas de casos edge (null, undefined, arrays vacíos) en servicios

### 1.2 Integration Testing — Calificación: **7/10**

**Fortalezas:**
- 55 pruebas distribuidas en 11 archivos
- Cobertura de 11 módulos funcionales
- Pruebas de seguridad en 3 niveles (A, C, 404)
- Helper `setup.js` reutilizable con `request()` y `getToken()`
- Pruebas de autenticación (login exitoso, inválido, inactivo, JWT structure)
- Verificación de módulos críticos (EMPLEADOS, RECLUTAMIENTO, COMPRAS, CONFIGURACION)
- Verificación de roles estratégicos (ADMIN, RH)

**Debilidades:**
- **Solo pruebas de lectura (GET)** — No hay pruebas de creación (POST), actualización (PUT/PATCH) ni eliminación (DELETE)
- No se prueban flujos completos (ej. crear vacante → postular candidato → cambiar estado)
- No se prueba scoping de datos (Nivel B): un EMPLEADO_BASICO no debería ver datos de otros departamentos
- No se prueba el bypass de RH en módulos (solo ADMIN)
- No se prueban respuestas con contenido específico (solo status code)
- Helper `setup.js` usa `http.request` nativo en lugar de `supertest` (más verboso, menos expresivo)
- No hay limpieza de datos entre pruebas (podría haber efectos colaterales)
- Las pruebas de Compras (06) son mínimas: solo 2 GETs + 1 seguridad

### 1.3 E2E Testing — Calificación: **4/10**

**Fortalezas:**
- Configuración de Playwright correcta con reportes HTML, screenshots, video
- 2 spec files con 10 escenarios
- Pruebas de login (formulario visible, credenciales inválidas, válidas, nombre usuario, cerrar sesión)
- Pruebas de dashboard (carga, navegación, encabezados, widgets, errores consola)

**Debilidades:**
- **NUNCA ejecutadas** — No hay evidencia de que funcionen
- CI/CD deshabilitado (`if: false` en el workflow)
- Selectores frágiles: usan texto (`:has-text("Salir")`) en lugar de `data-testid`
- Uso excesivo de `waitForTimeout` en lugar de `waitForSelector`
- Pruebas con `catch(() => {})` que tragan errores silenciosamente
- No se prueban flujos críticos: creación de empleados, solicitudes de compra, vacantes
- No hay `data-testid` en los componentes del frontend
- Solo cubren 2 páginas de ~25+ (login y dashboard)
- Dependen de datos seed específicos que pueden cambiar

### 1.4 Security Testing — Calificación: **5/10**

**Fortalezas:**
- Pruebas de Nivel A (acceso a módulos): 401 sin token, 200 con ADMIN
- Pruebas de Nivel C (operaciones críticas): 401 en endpoints sensibles
- Pruebas de 404 handling
- AuthMiddleware unit tests cubren bypass de ADMIN/RH en requireModule

**Debilidades:**
- **No se prueba Nivel B (scoping de datos)** — El gap más crítico
- No se prueba que un usuario sin módulo reciba 403 (solo 401 sin token)
- No se prueba que EMPLEADO_BASICO no pueda acceder a endpoints de ADMIN
- No se prueba inyección SQL, XSS, CSRF
- No se prueba rate limiting
- No se prueba validación de entrada (malformed JSON, tipos incorrectos)
- No se prueba que RH tenga bypass pero no acceso a Nivel C

### 1.5 CI/CD — Calificación: **6/10**

**Fortalezas:**
- Backend CI completo: PostgreSQL service, migrations, seed, integration + unit tests, coverage upload
- Frontend CI: build + lint
- Disparo condicional por cambios en backend/ o frontend/
- Cache de npm dependencies
- Retención de artefactos (30 días)

**Debilidades:**
- **E2E deshabilitado** (`if: false`) — No hay validación de frontend funcional
- No hay thresholds de cobertura — El pipeline pasa aunque la cobertura sea 0%
- No hay pruebas de seguridad automatizadas
- No hay linting en backend
- No hay análisis de vulnerabilidades (npm audit, Snyk)
- No hay deploy automático (solo CI, no CD)
- Frontend CI no ejecuta pruebas (solo build + lint)
- No hay matrix de Node.js versions

### 1.6 Cobertura — Calificación: **4/10**

**Fortalezas:**
- AuthUtils: 100% (22 líneas, 7 funciones)
- AuthMiddleware: ~85% (5 de 9 funciones)
- Reporte de cobertura documentado en `docs/COVERAGE_REPORT.md`

**Debilidades:**
- **Cobertura real del backend es < 10%** — Solo 2 de ~30+ archivos tienen pruebas unitarias
- 0% en servicios de negocio (11 archivos)
- 0% en controladores (18 archivos)
- 0% en utilidades (csvMapper, salaryCalculator)
- 0% en upload middleware
- No hay métricas de cobertura por línea real (solo estimaciones)
- No hay thresholds en CI que exijan cobertura mínima
- No se mide cobertura de integración (solo unitaria)

### 1.7 Calidad de los Casos — Calificación: **6/10**

**Fortalezas:**
- Nombres descriptivos en español (`debe retornar 401 si no hay token`)
- Estructura clara con `describe`/`test`
- Separación lógica por módulo
- Pruebas unitarias con mocks bien definidos
- Pruebas de integración con setup compartido

**Debilidades:**
- Muchas pruebas solo verifican status code (200/401), no contenido
- Pruebas frágiles que dependen de datos seed (IDs hardcodeados)
- Uso de `if (!employeeId) return;` que skipea pruebas silenciosamente
- Helper `setup.js` usa `http.request` en lugar de `supertest` (menos expresivo)
- No hay `afterAll` cleanup
- Pruebas E2E con `catch(() => {})` que ocultan fallos
- No hay data-testid en frontend
- Pruebas de Compras (06) y PurchaseOrderService unitarias son casi vacías

---

## 2. Gaps Detectados

### 2.1 Gaps Críticos (Alta Prioridad)

| # | Gap | Impacto | Dónde |
|---|-----|---------|-------|
| G1 | **Sin pruebas de escritura (POST/PUT/DELETE)** | No se detectan errores en creación/modificación de datos | Todos los módulos |
| G2 | **Sin pruebas de Nivel B (scoping)** | Un usuario podría ver datos de otros departamentos sin ser detectado | Empleados, Vacantes, Compras |
| G3 | **0% cobertura en servicios de negocio** | Lógica crítica (aprobaciones, cálculos, estados) no tiene pruebas | 11 servicios sin probar |
| G4 | **0% cobertura en controladores** | Validación de requests, manejo de errores, respuestas no probados | 18 controladores sin probar |
| G5 | **E2E nunca ejecutado** | Flujos completos de UI nunca validados | Frontend completo |

### 2.2 Gaps Importantes (Media Prioridad)

| # | Gap | Impacto | Dónde |
|---|-----|---------|-------|
| G6 | **Sin pruebas de flujos completos** | No se validan transiciones de estado (ej. vacante: abierta → cerrada) | Reclutamiento, Compras |
| G7 | **Sin pruebas de email/notificaciones** | Notificaciones podrían romperse sin ser detectado | email.service.js |
| G8 | **Sin pruebas de upload** | Subida de archivos/fotos no validada | upload.middleware.js |
| G9 | **Sin pruebas de CSV import** | Importación masiva de empleados no probada | employee-csv.controller.js |
| G10 | **Sin pruebas de SSE** | Notificaciones en tiempo real no probadas | sse-manager.service.js |
| G11 | **Sin pruebas de auditoría** | Registro de cambios no validado | audit.service.js |
| G12 | **Sin pruebas de salaryCalculator** | Cálculos de nómina/salarios no probados | salaryCalculator.js |

### 2.3 Gaps Menores (Baja Prioridad)

| # | Gap | Impacto | Dónde |
|---|-----|---------|-------|
| G13 | **Sin pruebas de rate limiting** | Posible abuso de API | Backend general |
| G14 | **Sin pruebas de validación de entrada** | Malformed JSON, tipos incorrectos | Controladores |
| G15 | **Sin pruebas de concurrencia** | Condiciones de carrera | Servicios de compras |
| G16 | **Sin pruebas de frontend unitarias** | Componentes React sin test | Frontend completo |
| G17 | **Sin data-testid en componentes** | Selectores frágiles en E2E | Frontend completo |
| G18 | **Sin pruebas de migraciones** | Cambios de schema no validados | Prisma |

---

## 3. Riesgos

### 3.1 Riesgos Críticos

| # | Riesgo | Probabilidad | Impacto | Detección Actual |
|---|--------|-------------|---------|------------------|
| R1 | **Scoping de datos roto** — Un EMPLEADO_BASICO accede a datos de otros departamentos | Alta | Alto | ❌ No detectable |
| R2 | **Creación de datos corruptos** — POST sin validación crea registros inválidos | Media | Alto | ❌ No detectable |
| R3 | **Flujo de aprobaciones roto** — Cambio en lógica de aprobaciones no detectado | Media | Alto | ❌ No detectable |
| R4 | **Regresión en autenticación** — Cambio en auth.utils rompe login | Baja | Crítico | ✅ Detectable (unit tests) |
| R5 | **Regresión en middleware** — Cambio en auth.middleware rompe permisos | Baja | Crítico | ✅ Detectable (unit tests) |

### 3.2 Riesgos Medios

| # | Riesgo | Probabilidad | Impacto | Detección Actual |
|---|--------|-------------|---------|------------------|
| R6 | **Notificaciones silenciosas** — Emails no se envían pero nadie lo nota | Media | Medio | ❌ No detectable |
| R7 | **Import CSV corrupto** — Cambio en csvMapper rompe importación | Baja | Alto | ❌ No detectable |
| R8 | **Cálculos de nómina incorrectos** — salaryCalculator con bug | Baja | Alto | ❌ No detectable |
| R9 | **Upload de archivos roto** — Cambio en upload.middleware impide subir fotos | Baja | Medio | ❌ No detectable |
| R10 | **SSE desconectado** — Notificaciones en tiempo real dejan de funcionar | Baja | Medio | ❌ No detectable |

### 3.3 Riesgos de CI/CD

| # | Riesgo | Probabilidad | Impacto | Detección Actual |
|---|--------|-------------|---------|------------------|
| R11 | **Cobertura decreciente** — Nuevo código sin pruebas pasa CI | Alta | Medio | ❌ No hay thresholds |
| R12 | **Frontend roto en producción** — Build pasa pero UI tiene errores | Media | Alto | ❌ E2E deshabilitado |
| R13 | **Vulnerabilidad en dependencias** — npm audit no se ejecuta en CI | Media | Medio | ❌ No hay análisis |

---

## 4. Cobertura por Módulo

### 4.1 COMPRAS — Cobertura: **15%** ⚠️

| Componente | Archivos | Unit Tests | Integration Tests | Estado |
|------------|----------|-----------|-------------------|--------|
| purchase-order.service.js | 1 | 2 (1 vacía) | — | ⚠️ Mínimo |
| purchase.service.js | 1 | 0 | — | ❌ Sin pruebas |
| approval.service.js | 1 | 0 | — | ❌ Sin pruebas |
| comparison.service.js | 1 | 0 | — | ❌ Sin pruebas |
| quote.service.js | 1 | 0 | — | ❌ Sin pruebas |
| stationery.service.js | 1 | 0 | — | ❌ Sin pruebas |
| uniform.service.js | 1 | 0 | — | ❌ Sin pruebas |
| purchase-notification.service.js | 1 | 0 | — | ❌ Sin pruebas |
| status-notification.service.js | 1 | 0 | — | ❌ Sin pruebas |
| purchase.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| purchase-comment.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| purchase-public.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| stationery.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| uniform.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| **API endpoints** | — | — | 3 (solo GET) | ⚠️ Sin POST/PUT |

### 4.2 EMPLEADOS — Cobertura: **10%** ⚠️

| Componente | Archivos | Unit Tests | Integration Tests | Estado |
|------------|----------|-----------|-------------------|--------|
| employee.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| employee-core.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| employee-csv.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| employee-org.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| employee-photo.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| employeeDocument.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| organization.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| **API endpoints** | — | — | 8 (solo GET) | ⚠️ Sin POST/PUT |

### 4.3 RECLUTAMIENTO — Cobertura: **10%** ⚠️

| Componente | Archivos | Unit Tests | Integration Tests | Estado |
|------------|----------|-----------|-------------------|--------|
| recruitment.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| **API endpoints** | — | — | 5 (solo GET) | ⚠️ Sin POST/PUT |

### 4.4 CONFIGURACION — Cobertura: **15%** ⚠️

| Componente | Archivos | Unit Tests | Integration Tests | Estado |
|------------|----------|-----------|-------------------|--------|
| permission.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| user.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| **API endpoints** | — | — | 7 (solo GET) | ⚠️ Sin POST/PUT |

### 4.5 INCIDENCIAS — Cobertura: **5%** ❌

| Componente | Archivos | Unit Tests | Integration Tests | Estado |
|------------|----------|-----------|-------------------|--------|
| attendance.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| **API endpoints** | — | — | 2 (solo GET) | ⚠️ Mínimo |

### 4.6 PAPELERIA — Cobertura: **5%** ❌

| Componente | Archivos | Unit Tests | Integration Tests | Estado |
|------------|----------|-----------|-------------------|--------|
| stationery.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| stationery.service.js | 1 | 0 | — | ❌ Sin pruebas |
| **API endpoints** | — | — | 2 (solo GET) | ⚠️ Mínimo |

### 4.7 UNIFORMES — Cobertura: **0%** ❌

| Componente | Archivos | Unit Tests | Integration Tests | Estado |
|------------|----------|-----------|-------------------|--------|
| uniform.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| uniform.service.js | 1 | 0 | — | ❌ Sin pruebas |
| **API endpoints** | — | — | 0 (no montado) | ❌ No implementado |

### 4.8 REPORTES / ESTADISTICAS — Cobertura: **10%** ⚠️

| Componente | Archivos | Unit Tests | Integration Tests | Estado |
|------------|----------|-----------|-------------------|--------|
| stats.controller.js | 1 | 0 | — | ❌ Sin pruebas |
| **API endpoints** | — | — | 4 (solo GET) | ⚠️ Sin POST |

### 4.9 Servicios Transversales — Cobertura: **5%** ❌

| Componente | Archivos | Unit Tests | Integration Tests | Estado |
|------------|----------|-----------|-------------------|--------|
| audit.service.js | 1 | 0 | — | ❌ Sin pruebas |
| email.service.js | 1 | 0 | — | ❌ Sin pruebas |
| birthdayAnniversary.service.js | 1 | 0 | — | ❌ Sin pruebas |
| sse-manager.service.js | 1 | 0 | — | ❌ Sin pruebas |
| csvMapper.js | 1 | 0 | — | ❌ Sin pruebas |
| salaryCalculator.js | 1 | 0 | — | ❌ Sin pruebas |

### 4.10 Frontend — Cobertura: **2%** ❌

| Componente | Archivos | Unit Tests | E2E Tests | Estado |
|------------|----------|-----------|-----------|--------|
| Páginas (app/) | ~25 | 0 | 2 (login, dashboard) | ❌ Sin coverage |
| Componentes | 11 | 0 | 0 | ❌ Sin pruebas |
| Contextos | ~3 | 0 | 0 | ❌ Sin pruebas |
| Hooks | ~3 | 0 | 0 | ❌ Sin pruebas |

---

## 5. Recomendaciones

### P0 — Críticas (Implementar antes del próximo release)

| # | Recomendación | Esfuerzo | Impacto | Gap asociado |
|---|--------------|----------|---------|-------------|
| P0-1 | **Agregar pruebas de escritura (POST/PUT/DELETE)** a todos los módulos | 3-4 días | Alto | G1 |
| P0-2 | **Implementar pruebas de Nivel B (scoping)** — Verificar que EMPLEADO_BASICO no ve datos de otros deptos | 2-3 días | Alto | G2 |
| P0-3 | **Completar PurchaseOrderService unit tests** — Reemplazar prueba vacía con pruebas reales de `generateOrderNumber` y `create` | 1 día | Medio | G3 |
| P0-4 | **Habilitar E2E en CI** — Configurar servicios de backend + frontend en GitHub Actions | 2-3 días | Alto | G5 |

### P1 — Importantes (Implementar en los próximos 30 días)

| # | Recomendación | Esfuerzo | Impacto | Gap asociado |
|---|--------------|----------|---------|-------------|
| P1-1 | **Agregar unit tests para servicios de compras** (approval, comparison, quote, stationery, uniform) | 3-4 días | Alto | G3 |
| P1-2 | **Agregar unit tests para servicios transversales** (audit, email, birthday, sse-manager) | 2-3 días | Medio | G3 |
| P1-3 | **Agregar unit tests para csvMapper y salaryCalculator** | 1 día | Medio | G12, G7 |
| P1-4 | **Agregar thresholds de cobertura en CI** (mínimo 50% en servicios nuevos) | 0.5 días | Medio | R11 |
| P1-5 | **Agregar pruebas de flujos completos en integración** (crear → leer → actualizar → eliminar) | 3-4 días | Alto | G6 |
| P1-6 | **Migrar helper setup.js a supertest** para pruebas más expresivas | 1 día | Bajo | Calidad |

### P2 — Recomendadas (Implementar en los próximos 90 días)

| # | Recomendación | Esfuerzo | Impacto | Gap asociado |
|---|--------------|----------|---------|-------------|
| P2-1 | **Agregar unit tests para controladores** (al menos los críticos: auth, employee, recruitment, purchase) | 4-5 días | Medio | G4 |
| P2-2 | **Agregar pruebas de validación de entrada** (malformed JSON, tipos incorrectos, campos requeridos) | 2-3 días | Medio | G14 |
| P2-3 | **Agregar data-testid a componentes frontend** y actualizar E2E tests | 2-3 días | Medio | G17 |
| P2-4 | **Agregar pruebas de upload** (subida de fotos, documentos) | 1-2 días | Medio | G8 |
| P2-5 | **Agregar pruebas de import CSV** | 1-2 días | Medio | G9 |
| P2-6 | **Agregar pruebas de notificaciones SSE** | 1-2 días | Bajo | G10 |
| P2-7 | **Agregar pruebas de auditoría** | 1 día | Bajo | G11 |
| P2-8 | **Agregar npm audit al CI** | 0.5 días | Medio | R13 |

### P3 — Deseables (Futuras iteraciones)

| # | Recomendación | Esfuerzo | Impacto | Gap asociado |
|---|--------------|----------|---------|-------------|
| P3-1 | **Agregar pruebas de rate limiting** | 1 día | Bajo | G13 |
| P3-2 | **Agregar pruebas de concurrencia** en servicios de compras | 2-3 días | Bajo | G15 |
| P3-3 | **Agregar pruebas unitarias de frontend** (Jest + React Testing Library) | 5-7 días | Medio | G16 |
| P3-4 | **Agregar pruebas de migraciones Prisma** | 1 día | Bajo | G18 |
| P3-5 | **Agregar análisis de seguridad** (Snyk, SonarQube) al CI | 2-3 días | Medio | Seguridad |
| P3-6 | **Implementar CD** (deploy automático a staging) | 3-4 días | Medio | CI/CD |
| P3-7 | **Agregar matrix de Node.js versions** al CI | 0.5 días | Bajo | CI/CD |

---

## 6. Roadmap de Calidad

### Próximos 30 Días

```
Semana 1-2: P0 (Críticas)
├── P0-1: Pruebas de escritura (POST/PUT/DELETE) en todos los módulos
├── P0-2: Pruebas de Nivel B (scoping de datos)
├── P0-3: Completar PurchaseOrderService unit tests
└── P0-4: Habilitar E2E en CI

Semana 3-4: P1 (Importantes)
├── P1-1: Unit tests para servicios de compras
├── P1-2: Unit tests para servicios transversales
├── P1-3: Unit tests para csvMapper y salaryCalculator
├── P1-4: Thresholds de cobertura en CI
├── P1-5: Pruebas de flujos completos
└── P1-6: Migrar a supertest
```

**Meta 30 días:**
- Unit tests: de 39 → 100+ pruebas
- Integration tests: de 55 → 100+ pruebas (incluyendo POST/PUT)
- Cobertura de servicios: de <10% → 40%+
- E2E: habilitado en CI con 10+ pruebas funcionales
- Thresholds de cobertura en CI (mínimo 50% en servicios nuevos)

### Próximos 90 Días

```
Mes 2: P2 (Recomendadas)
├── P2-1: Unit tests para controladores críticos
├── P2-2: Pruebas de validación de entrada
├── P2-3: data-testid + E2E actualizados
├── P2-4: Pruebas de upload
├── P2-5: Pruebas de import CSV
├── P2-6: Pruebas de SSE
├── P2-7: Pruebas de auditoría
└── P2-8: npm audit en CI

Mes 3: P3 (Deseables) + Consolidación
├── P3-1: Rate limiting
├── P3-2: Concurrencia
├── P3-3: Frontend unit tests (Jest + RTL)
├── P3-4: Migraciones Prisma
├── P3-5: Análisis de seguridad (Snyk/SonarQube)
├── P3-6: CD a staging
└── P3-7: Matrix Node.js versions
```

**Meta 90 días:**
- Unit tests: 200+ pruebas
- Integration tests: 150+ pruebas (incluyendo escritura y flujos)
- E2E: 30+ pruebas cubriendo flujos críticos
- Cobertura total backend: 60%+
- Cobertura de servicios: 70%+
- Cobertura de controladores: 50%+
- Frontend: pruebas unitarias en componentes críticos
- CI/CD: thresholds, seguridad, deploy automático a staging

---

## Resumen de Calificaciones

| Dimensión | Calificación | Estado |
|-----------|:-----------:|--------|
| Unit Testing | **6/10** | 🟡 Aceptable con gaps |
| Integration Testing | **7/10** | 🟡 Bueno pero incompleto |
| E2E Testing | **4/10** | 🔴 No funcional |
| Security Testing | **5/10** | 🟡 Gap crítico en Nivel B |
| CI/CD | **6/10** | 🟡 E2E deshabilitado |
| Cobertura | **4/10** | 🔴 < 10% real |
| Calidad de Casos | **6/10** | 🟡 Mejorable |
| **Global** | **5.4/10** | 🟡 **Requiere atención** |

---

## Estadísticas Clave

| Métrica | Valor |
|---------|-------|
| Archivos de prueba (backend) | 14 |
| Archivos de prueba (frontend) | 3 |
| Pruebas unitarias | 39 |
| Pruebas de integración | 55 |
| Pruebas E2E | 10 |
| **Total pruebas** | **94** |
| Servicios sin pruebas | 11 de 14 (79%) |
| Controladores sin pruebas | 18 de 18 (100%) |
| Utilidades sin pruebas | 2 de 3 (67%) |
| Middlewares sin pruebas | 1 de 2 (50%) |
| Páginas frontend sin E2E | 23 de 25 (92%) |
| Componentes frontend sin pruebas | 11 de 11 (100%) |
| Gaps identificados | 18 |
| Riesgos identificados | 13 |
| Recomendaciones P0 | 4 |
| Recomendaciones P1 | 6 |
| Recomendaciones P2 | 8 |
| Recomendaciones P3 | 7 |

---

*Auditoría generada el 24/06/2026 — ERP KRAM QA Lead*
