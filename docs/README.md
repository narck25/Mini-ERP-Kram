# Documentación del ERP KRAM

Documentación oficial organizada **por módulo**. Cada archivo de `modules/` contiene:

1. **Cómo funciona** — descripción general del módulo.
2. **Quiénes pueden usarlo** — roles y permisos.
3. **Manual del administrador** — operaciones de gestión.
4. **Manual del usuario** — operaciones del día a día.

## Roles del sistema

| Rol | Descripción | Nivel de acceso |
|-----|-------------|-----------------|
| **ADMIN** | Administrador del sistema | Total (incluye operaciones críticas) |
| **RH** | Recursos Humanos | Total operativo (excepto operaciones críticas de sistema) |
| **SISTEMAS** | Soporte técnico | Dashboard + Configuración |
| **COMPRAS** | Compras | Dashboard + Compras |
| **PRODUCCION** | Producción | Dashboard |
| **EMPLEADO_BASICO** | Empleado | Dashboard + módulos asignados |

## Módulos

| Módulo | Manual | Flujos |
|--------|--------|--------|
| Dashboard | [modules/DASHBOARD.md](modules/DASHBOARD.md) | [flujos/DASHBOARD.md](flujos/DASHBOARD.md) |
| Empleados | [modules/EMPLEADOS.md](modules/EMPLEADOS.md) | [flujos/EMPLEADOS.md](flujos/EMPLEADOS.md) |
| Reclutamiento | [modules/RECLUTAMIENTO.md](modules/RECLUTAMIENTO.md) | [flujos/RECLUTAMIENTO.md](flujos/RECLUTAMIENTO.md) |
| Incidencias | [modules/INCIDENCIAS.md](modules/INCIDENCIAS.md) | [flujos/INCIDENCIAS.md](flujos/INCIDENCIAS.md) |
| Configuración | [modules/CONFIGURACION.md](modules/CONFIGURACION.md) | [flujos/CONFIGURACION.md](flujos/CONFIGURACION.md) |
| Compras | [modules/COMPRAS.md](modules/COMPRAS.md) | [flujos/COMPRAS.md](flujos/COMPRAS.md) |

> **Nota:** la documentación técnica y los manuales anteriores fueron archivados en la carpeta `docuold/`.
