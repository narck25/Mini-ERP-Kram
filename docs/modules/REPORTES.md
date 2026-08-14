# Auditoría del Módulo: REPORTES

**Fecha**: 24/06/2026  
**Auditor**: Arquitectura — ERP KRAM  
**Versión**: 1.0

---

## Descripción

Módulo de reportes y estadísticas. Proporciona dashboards y estadísticas para RH, jefes de departamento y administración del sistema. No existe un módulo de reportes independiente; las estadísticas están distribuidas en otros módulos.

---

## Estado Actual

| Componente | Estado | Detalle |
|------------|--------|---------|
| `modules.config.js` | ✅ Registrado | key: `REPORTES`, enabled: true |
| `ModuleType` enum | ✅ Registrado | `REPORTES` en schema.prisma |
| Rutas backend dedicadas | ❌ No existen | No hay `reports.routes.js` |
| Controlador dedicado | ❌ No existe | No hay `report.controller.js` |
| Servicios | ❌ No existen | No hay servicios de reportes |

---

## Funcionalidad de Estadísticas Existente

Las estadísticas están distribuidas en:

| Endpoint | Módulo | Controlador | Propósito |
|----------|--------|-------------|-----------|
| `GET /stats/rh/dashboard` | EMPLEADOS | stats.controller.js | Dashboard RH |
| `GET /stats/my-dashboard` | EMPLEADOS | stats.controller.js | Dashboard "Mi Espacio" |
| `GET /stats/system` | CONFIGURACION | stats.controller.js | Estadísticas del sistema |
| `GET /users/stats` | CONFIGURACION | user.controller.js | Estadísticas de usuarios |
| `GET /employees/stats` | EMPLEADOS | employee-org.controller.js | Estadísticas de empleados |

---

## APIs (Frontend)

No existen APIs dedicadas para reportes.

---

## Componentes (Frontend)

### Páginas

| Ruta Frontend | Archivo |
|---------------|---------|
| `/rh/dashboard-completo` | `frontend/app/rh/dashboard-completo/page.js` |
| `/rh-dashboard` | `frontend/app/rh-dashboard/page.js` |
| `/dashboard/mi-espacio` | `frontend/app/dashboard/mi-espacio/page.js` |

---

## Problemas Encontrados

### 🟡 P1 — Altos

1. **Módulo REPORTES sin implementación propia**: No hay rutas, controladores ni servicios dedicados. Las estadísticas están en otros módulos.

2. **Estadísticas distribuidas**: Las estadísticas de RH están en `stats.controller.js` (montado en módulo EMPLEADOS), las del sistema en CONFIGURACION.

### 🟡 P2 — Medios

3. **Sin reportes exportables**: No hay generación de PDF, Excel o CSV para reportes.

4. **Sin dashboard de reportes unificado**: No existe una página central de reportes.

---

## Estado General

| Dimensión | Calificación | Comentario |
|-----------|-------------|------------|
| **Arquitectura** | 3/10 | Sin implementación propia, estadísticas dispersas |
| **Seguridad** | 5/10 | Depende de módulos donde están montadas las stats |
| **UI** | 4/10 | Dashboards básicos existentes en otros módulos |
| **Backend** | 3/10 | Sin servicios ni controladores dedicados |
| **Mantenibilidad** | 4/10 | Estadísticas dispersas en múltiples controladores |

### Calificación Final: **3.8 / 10**
