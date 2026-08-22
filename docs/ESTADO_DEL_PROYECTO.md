# Estado del Proyecto

> Última actualización: 22/08/2026

## Módulos

| Módulo | Estado | Backend | Frontend | Notas |
|--------|--------|---------|----------|-------|
| Dashboard | ✅ Completo | ✅ | ✅ | Siempre activo; "Mi Espacio" con scoping por jerarquía |
| Empleados | ✅ Completo | ✅ | ✅ | CRUD, documentos, foto, CSV, organización, baja con motivo |
| Reclutamiento | ✅ Completo | ✅ | ✅ | Requisición → aprobación → Kanban → selección |
| Compras | ✅ Completo | ✅ | ✅ | Solicitudes, OC, papelería, uniformes, inventario (kardex y ajustes) |
| Incidencias | ✅ Funcional | ✅ | ✅ | Asistencia (checador ZKTeco) y reporte de incidencias |
| Configuración | ✅ Completo | ✅ | ✅ | Accesos, usuarios y roles personalizados |
| Vacaciones | ✅ Completo | ✅ | ✅ | Solicitud → jefe → RH; regla de 6 meses (0 días si < 6 meses); saldo por empleado (RH) |
| Reportes | ✅ Completo | ✅ | ✅ | 5 reportes con exportación a Excel |

## Infraestructura

- **Base de datos**: PostgreSQL con 41 migraciones Prisma.
- **Despliegue**: Docker + Docker Compose (las migraciones se aplican automáticamente al iniciar el contenedor).
- **CI**: GitHub Actions (`backend-ci`, `frontend-ci`).

## Pruebas

- **14 suites / 99 tests** (Jest + Supertest), todos pasando.
- Detalle en [TESTING.md](TESTING.md).

## Seguridad

- Modelo de control de acceso en **3 niveles** (módulos / scoping / operaciones críticas).
- **Solo ADMIN** puede cambiar roles, eliminar usuarios y gestionar roles personalizados.
- JWT con `role` y `accessibleModules`; contraseñas con bcrypt.

## Cambios recientes

- **Vacaciones**: regla de saldo por antigüedad (0 días si < 6 meses) y vista "Saldo por empleado" para RH/ADMIN.
- Flujo de **ajuste de inventario** (solicitud → aprobación RH/Admin) + **kardex** + **restock**.
- **Acta imprimible** de entrega de uniformes.
- **Baja de empleado** con motivo, fecha automática y **liberación del correo institucional**.
- Seguridad: **solo ADMIN cambia roles**, roles dinámicos, guard anti auto-bloqueo, confirmación de preset.
- Documentación reorganizada (manuales + flujos con diagramas Mermaid).

## Pendiente / siguientes pasos

- Ver mejoras priorizadas en [DEUDA_TECNICA.md](DEUDA_TECNICA.md).
