# Resultados de Pruebas — ERP KRAM

**Fecha**: 24/06/2026  
**Versión**: 1.0  
**Framework**: Jest + Supertest (backend)  
**Cobertura**: Pruebas de integración contra API REST

---

## Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Suites de prueba** | 11 |
| **Pruebas totales** | 55 |
| **✅ Pass** | 55 |
| **❌ Fail** | 0 |
| **⏱️ Tiempo total** | ~8s |
| **Cobertura de código** | N/A (pruebas de integración) |

**Resultado: ✅ 55/55 PRUEBAS PASAN — SISTEMA OPERATIVO**

---

## Estructura de la Suite

```
backend/tests/
├── helpers/
│   └── setup.js              ← Helper HTTP + getToken()
├── 01-health.test.js          ← Health Check (1 test)
├── 02-auth.test.js            ← Autenticación (5 tests)
├── 03-modules-roles.test.js   ← Módulos, Roles, Presets (10 tests)
├── 04-employees.test.js       ← Empleados (8 tests)
├── 05-recruitment.test.js     ← Reclutamiento (5 tests)
├── 06-purchases.test.js       ← Compras (3 tests)
├── 07-config.test.js          ← Configuración (7 tests)
├── 08-incidencias.test.js     ← Incidencias (2 tests)
├── 09-stats.test.js           ← Estadísticas (4 tests)
├── 10-other-modules.test.js   ← Papelería, Uniformes, Notif. (4 tests)
└── 11-security.test.js        ← Seguridad (6 tests)
```

---

## Resultados Detallados

### 🔍 Health Check — 1/1 ✅

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | `GET /api/health` responde OK | ✅ 200 |

### 🔐 Autenticación — 5/5 ✅

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | Login ADMIN exitoso | ✅ 200 + token JWT |
| 2 | Credenciales inválidas | ✅ 401 |
| 3 | Usuario inactivo | ✅ 401 |
| 4 | Sin token en ruta protegida | ✅ 401 |
| 5 | Token JWT tiene estructura válida | ✅ 3 partes |

### 📦 Módulos y Roles — 10/10 ✅

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | Lista de módulos | ✅ 200 (≥7 módulos) |
| 2 | Cada módulo tiene id, name, description | ✅ |
| 3 | Módulos críticos existen | ✅ EMPLEADOS, RECLUTAMIENTO, COMPRAS, CONFIGURACION |
| 4 | Lista de roles | ✅ 200 (≥6 roles) |
| 5 | Cada rol tiene id, name, description | ✅ |
| 6 | Roles estratégicos existen | ✅ ADMIN, RH |
| 7 | Lista de presets | ✅ 200 |
| 8 | ADMIN tiene todos los módulos | ✅ ≥7 módulos |
| 9 | Módulos sin token | ✅ 401 |
| 10 | Roles sin token | ✅ 401 |

### 👥 Empleados — 8/8 ✅

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | Lista todos los empleados | ✅ 200 (≥1 empleado) |
| 2 | Campos requeridos | ✅ id, nombres, estatus |
| 3 | Sin token | ✅ 401 |
| 4 | Departamentos | ✅ 200 (≥1) |
| 5 | Puestos | ✅ 200 |
| 6 | Jefes directos | ✅ 200 |
| 7 | Empleado por ID | ✅ 200 |
| 8 | ID inexistente | ✅ 404 |

### 📋 Reclutamiento — 5/5 ✅

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | Lista vacantes | ✅ 200 |
| 2 | Vacantes del usuario | ✅ 200 |
| 3 | Estadísticas | ✅ 200 |
| 4 | Datos para formulario | ✅ 200 |
| 5 | Sin token | ✅ 401 |

### 🛒 Compras — 3/3 ✅

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | Lista purchase-orders | ✅ 200 |
| 2 | Lista purchases (alternativo) | ✅ 200 |
| 3 | Sin token | ✅ 401 |

### ⚙️ Configuración — 7/7 ✅

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | ADMIN lista usuarios | ✅ 200 (≥1) |
| 2 | Sin token | ✅ 401 |
| 3 | Permisos de usuarios | ✅ 200 |
| 4 | Módulos de permisos | ✅ 200 |
| 5 | Permisos del usuario actual | ✅ 200 |
| 6 | Permisos sin token | ✅ 401 |
| 7 | Users/stats sin token | ✅ 401 |

### ⚠️ Incidencias — 2/2 ✅

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | Lista incidencias | ✅ 200 |
| 2 | Sin token | ✅ 401 |

### 📊 Estadísticas — 4/4 ✅

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | Dashboard RH | ✅ 200 |
| 2 | Dashboard personal | ✅ 200 |
| 3 | Estadísticas del sistema | ✅ 200 |
| 4 | Sin token | ✅ 401 |

### 📎 Módulos Adicionales — 4/4 ✅

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | Papelería (stationery) | ✅ 200 |
| 2 | Papelería sin token | ✅ 401 |
| 3 | Uniformes (ruta no montada) | ✅ 404 (esperado) |
| 4 | Notificaciones (ruta no montada) | ✅ 404 (esperado) |

### 🔒 Seguridad — 6/6 ✅

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | Nivel A: endpoint sin token | ✅ 401 |
| 2 | Nivel A: endpoint con token ADMIN | ✅ 200 |
| 3 | Nivel C: permissions sin token | ✅ 401 |
| 4 | Nivel C: users/stats sin token | ✅ 401 |
| 5 | Ruta inexistente | ✅ 404 |
| 6 | Recurso inexistente | ✅ 404 |

---

## Cobertura por Módulo

| Módulo | Endpoints Probados | Estado |
|--------|-------------------|--------|
| **System** | `/api/health` | ✅ |
| **Auth** | `/api/auth/login`, `/api/auth/me` | ✅ |
| **Modules** | `/api/modules` | ✅ |
| **Roles** | `/api/roles`, `/api/roles/presets` | ✅ |
| **Empleados** | `/api/employees`, `/api/departments`, `/api/job-positions`, `/api/managers` | ✅ |
| **Reclutamiento** | `/api/vacancies`, `/api/vacancies/my`, `/api/vacancies/stats`, `/api/vacancies/form-data` | ✅ |
| **Compras** | `/api/purchase-orders`, `/api/purchases` | ✅ |
| **Configuración** | `/api/users`, `/api/permissions/users`, `/api/permissions/modules`, `/api/permissions/me` | ✅ |
| **Incidencias** | `/api/incidencias` | ✅ |
| **Estadísticas** | `/api/stats/rh/dashboard`, `/api/stats/my-dashboard`, `/api/stats/system` | ✅ |
| **Papelería** | `/api/stationery` | ✅ |
| **Seguridad** | Nivel A, Nivel C, 404 Handling | ✅ |

---

## Hallazgos y Notas

### Rutas no montadas (404 esperado)
- `/api/uniform-deliveries` — Ruta de uniformes no está montada en el backend
- `/api/notifications` — Ruta de notificaciones no está montada en el backend
- `/api/purchase-requests` — La ruta correcta es `/api/purchase-orders`
- `/api/stationery-requests` — La ruta correcta es `/api/stationery`

### Estructura de respuesta de API
- `GET /api/modules` devuelve `{ modules: [{ id, name, description }] }` (no `key`/`label`/`enabled`)
- `GET /api/roles/presets` devuelve `{ presets: { ADMIN: [...], RH: [...], ... } }` (objeto, no array)

### Cobertura de código
Las pruebas actuales son **pruebas de integración** que ejercitan los endpoints HTTP reales. La cobertura de código (statement/branch/function/line) no es aplicable directamente ya que las pruebas no importan los módulos internos. Para cobertura de código unitario, se necesitarían pruebas adicionales que importen directamente los servicios y controladores.

---

## Cómo Ejecutar

```bash
# Backend debe estar corriendo
cd backend
npm start

# En otra terminal, ejecutar pruebas
cd backend
npm test              # Todas las pruebas
npm run test:verbose  # Modo verbose
npm run test:coverage # Con reporte de cobertura
npm run test:watch    # Modo watch
```

---

## Próximos Pasos Recomendados

1. ✅ **Pruebas de integración** (55 tests) — Completado
2. ⬜ **Pruebas unitarias** para servicios (purchase-order.service.js, etc.)
3. ⬜ **Pruebas unitarias** para controladores
4. ⬜ **Pruebas E2E** con Playwright para frontend
5. ⬜ **Montar rutas faltantes**: uniformes, notificaciones
6. ⬜ **Agregar más casos edge** (paginación, filtros, datos malformados)

---

*Reporte generado con Jest v30.4.2 — 24/06/2026*
