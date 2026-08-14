# Auditoría del Módulo: INCIDENCIAS

**Fecha**: 24/06/2026  
**Auditor**: Arquitectura — ERP KRAM  
**Versión**: 1.0

---

## Descripción

Módulo de incidencias que gestiona la carga de registros de asistencia desde checadores ZKTeco (formato CSV). Permite subir archivos CSV con las checadas de los empleados y consultar registros por rango de fechas.

---

## Modelos Prisma

| Modelo | Propósito |
|--------|-----------|
| `AttendanceRecord` | Registro de asistencia (checador ZKTeco) |

---

## Rutas (Backend)

### Archivo: `attendance.routes.js` (31 líneas)

Montado en: `/api/incidencias`

| Método | Ruta | Middleware | Controlador |
|--------|------|-----------|-------------|
| POST | `/upload` | requireModule('INCIDENCIAS') | AttendanceController.uploadCSV |
| GET | `/` | requireModule('INCIDENCIAS') | AttendanceController.getRecords |

**Total de endpoints**: 2

---

## Controladores

| Controlador | Líneas | Propósito |
|-------------|--------|-----------|
| `attendance.controller.js` | 198 | Upload CSV + consulta de registros |

---

## APIs (Frontend)

No existen APIs frontend dedicadas para incidencias.

---

## Componentes (Frontend)

### Páginas

| Ruta Frontend | Archivo |
|---------------|---------|
| `/rh/incidencias` | `frontend/app/rh/incidencias/page.js` |

---

## Servicios

No hay servicios dedicados. Toda la lógica está en el controlador.

---

## Problemas Encontrados

### 🟡 P1 — Altos

1. **Sin capa de servicio**: Toda la lógica (parseo CSV + Prisma) está en el controlador.

2. **Sin paginación en `getRecords`**: Puede haber problemas de rendimiento con muchos registros.

### 🟡 P2 — Medios

3. **Funcionalidad limitada**: Solo upload CSV y consulta. No hay reportes, dashboard, ni vinculación con empleados.

4. **Sin validación de empleados**: Los registros se guardan con `numeroEmpleado` como string, sin validar contra la tabla `employees`.

### 🟢 P3 — Bajos

5. **Sin eliminación de registros**: No hay endpoint para eliminar registros incorrectos.

---

## Estado General

| Dimensión | Calificación | Comentario |
|-----------|-------------|------------|
| **Arquitectura** | 4/10 | Sin servicios, lógica en controller |
| **Seguridad** | 6/10 | Nivel A presente |
| **UI** | 5/10 | Funcionalidad básica |
| **Backend** | 4/10 | Sin servicios, sin paginación |
| **Mantenibilidad** | 5/10 | Controller pequeño pero sin estructura |

### Calificación Final: **4.8 / 10**
