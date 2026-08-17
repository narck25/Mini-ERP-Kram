# Flujo de Reportes

> Módulo: REPORTES · Permiso: `requireModule('REPORTES')` · Preset: ADMIN/RH

## Descripción

Generación de 5 reportes (solo lectura, sin tablas nuevas) con exportación a Excel (`.xlsx` vía `xlsx`).

## Reportes

| Reporte | Endpoint | Filtros |
|---|---|---|
| Empleados | `/reports/empleados` | `estatus` |
| Compras | `/reports/compras` | `estatus`, `fechaDesde`, `fechaHasta` |
| Inventario | `/reports/inventario` | — |
| Asistencia | `/reports/asistencia` | `fechaDesde`, `fechaHasta` |
| Vacaciones | `/reports/vacaciones` | `estatus` |

Cada reporte tiene su variante `/export` que devuelve un archivo `.xlsx`.

## Frontend

Página `/dashboard/reportes` con 5 pestañas, filtros por estado/fechas y botón "Exportar Excel" (descarga vía blob con token JWT).
