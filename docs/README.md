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

## Documentos transversales

| Documento | Contenido |
|-----------|-----------|
| [PRESENTACION_PROYECTO.md](PRESENTACION_PROYECTO.md) | Presentación detallada del proyecto (para NotebookLM) |
| [MANUAL_PROYECTO.md](MANUAL_PROYECTO.md) | Manual completo del proyecto y los módulos |
| [ESTADO_DEL_PROYECTO.md](ESTADO_DEL_PROYECTO.md) | Estado de los módulos, infraestructura y cambios recientes |
| [TESTING.md](TESTING.md) | Suite de pruebas: cómo ejecutar y estructura |
| [DEUDA_TECNICA.md](DEUDA_TECNICA.md) | Deuda técnica y mejoras priorizadas (P1–P3) |

## Documentación técnica y operativa

| Documento | Contenido |
|-----------|-----------|
| [ARQUITECTURA.md](ARQUITECTURA.md) | Arquitectura general, capas, modelo de seguridad y stack |
| [API.md](API.md) | Referencia completa de endpoints (método, ruta, permisos) |
| [MODELO_DATOS.md](MODELO_DATOS.md) | Modelo entidad-relación, tablas y enumeraciones |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Guía para desarrolladores (setup, convenciones, testing) |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Despliegue local y producción (Docker/Coolify) |
| [OPERACIONES.md](OPERACIONES.md) | Migraciones, seed, respaldos y monitoreo |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Errores comunes y soluciones |
| [SEGURIDAD.md](SEGURIDAD.md) | Modelo de seguridad (3 niveles) y recomendaciones |
| [CHANGELOG.md](CHANGELOG.md) | Historial de cambios del sistema |
| [CAPACITACION.md](CAPACITACION.md) | Guía de capacitación por rol (perfiles y flujos) |

> La licencia del proyecto (MIT) se encuentra en el archivo `LICENSE` en la raíz del repositorio.
