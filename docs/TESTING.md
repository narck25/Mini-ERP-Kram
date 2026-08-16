# Pruebas (Testing)

## Cómo ejecutar

```bash
cd backend
npm test             # suite completa (integración + unitarias)
npm run test:unit    # solo pruebas unitarias
npm run test:coverage # con reporte de cobertura
npm run test:ci      # modo CI
```

## Estructura de la suite

### Pruebas de integración (Supertest contra el servidor Express)

| Archivo | Cobertura |
|---------|-----------|
| `01-health.test.js` | Health check (`GET /api/health`) |
| `02-auth.test.js` | Login, credenciales inválidas, usuario inactivo, estructura del JWT |
| `03-modules-roles.test.js` | Módulos, roles y presets |
| `04-employees.test.js` | Listado de empleados, departamentos, puestos, jefes, empleado por ID |
| `05-recruitment.test.js` | Vacantes y candidatos |
| `06-purchases.test.js` | Solicitudes de compra, cotizaciones, autorización |
| `07-config.test.js` | Configuración |
| `08-incidencias.test.js` | Incidencias / asistencia |
| `09-stats.test.js` | Estadísticas |
| `10-other-modules.test.js` | Otros módulos |
| `11-security.test.js` | Seguridad |

### Pruebas unitarias

| Archivo | Cobertura |
|---------|-----------|
| `unit/middlewares/auth.middleware.test.js` | `verifyToken`, `requireRole`, `requireModule`, `requireAdmin`, `requireRHOrAdmin` |
| `unit/services/auth.service.test.js` | Servicio de autenticación |
| `unit/services/purchase-order.service.test.js` | Generación de número de orden de compra |

## Estado actual

- **14 suites / 99 tests**, todos pasando.
- Los tests de integración corren contra el servidor en ejecución (requieren la BD y el backend levantados).

## Cómo agregar una prueba

1. Crea `tests/NN-nombre.test.js` (integración) o `tests/unit/...` (unitaria).
2. Para integración, usa `supertest` apuntando a la app Express.
3. Reutiliza el helper de login de `tests/helpers/setup.js`.
4. Sigue el patrón de los archivos existentes (describe/test con nombres descriptivos en español).
