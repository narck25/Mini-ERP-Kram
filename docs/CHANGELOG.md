# Changelog — ERP KRAM

> **Registro de cambios del sistema**
> *Última actualización: 06/07/2026*

---

## v5.4 — Fases 1-5: Remediación masiva de deuda técnica

**Fecha:** 06/07/2026

### Changed (Fase 1 — Autorización)
- **ProtectedRoute.js**: Lógica de autorización extraída a `hooks/useAuthorization.js` (hasRole, hasModule, helpers semánticos). Wrapper delgado.
- **AuthContext.js**: Eliminados 5 helpers por rol hardcodeados (`isAdmin`, `isRH`, etc.). Movidos a `useAuthorization.js`.

### Changed (Fase 2 — Middlewares)
- **auth.middleware.js**: Reducido de 370 a 117 líneas (-68%). Dividido en 3 archivos especializados: `auth.middleware.js` (verifyToken), `permission.middleware.js` (requireModule, requireRole), `sse.middleware.js` (verifyTokenFromQuery). 0 cambios en rutas gracias a re-exports.

### Changed (Fase 3 — God Objects)
- **employee.controller.js**: Eliminado (1682 líneas de dead code — 0 referencias).
- **employee-core.controller.js**: Reducido de 1124 a 120 líneas (-89%). CRUD extraído a `employee-crud.controller.js` (290 líneas).
- **recruitment.controller.js**: Reducido de 1550 a 1069 líneas (-31%). Candidatos extraídos a `candidate.controller.js` (528 líneas).
- **purchase.controller.js**: Verificado — ya cumple SRP con controllers delgados que delegan en servicios.

### Changed (Fase 4 — Frontend)
- **DashboardLayout.js**: Navegación extraída a `constants/navigation.js`. Reducido de 340 a 305 líneas.
- **start-backend.bat / start-frontend.bat**: Agregada validación de `node_modules` con mensajes de error claros.
- **Paginación empleados**: Defaults `page=1, limit=20` implementados en `employee-crud.controller.js`.

### Changed (Fase 5 — Infraestructura)
- **docker-compose.yml**: Healthcheck `pg_isready` agregado a servicio postgres.
- **schema.prisma**: 3 índices compuestos agregados: `Employee(departamento_id, estatus)`, `JobVacancy(estatus, fechaSolicitud)`, `PurchaseRequest(estatus, fechaSolicitud)`.

### Fixed
- **P1-001, P1-002, P1-004**: God Objects eliminados o reducidos.
- **P2-001, P2-002, P2-003, P2-004**: SRP aplicado a middlewares, ProtectedRoute, AuthContext, DashboardLayout.
- **P2-006, P2-007**: Infraestructura optimizada.
- **P3-002, P3-004**: Scripts y paginación corregidos.
- **17 de 18 items de deuda documentada resueltos (94%)**.

### Docs
- **DEUDA_TECNICA.md** (v3.1): 17 items marcados como resueltos. Métricas de reducción documentadas.
- **PLAN_REMEDIACION_DEUDA_TECNICA.md**: Plan maestro de 9 fases.

---

## v5.3 — Fase 0: Unificación de autorización en rutas de Compras

**Fecha:** 06/07/2026 — Commit `4b17bba`

### Changed
- **Rutas de Papelería** (`backend/src/routes/stationery.routes.js`): Reemplazado `requireRole(['ADMIN','COMPRAS'])` por `requireModule('COMPRAS')` en 3 rutas de inventario (POST, PUT, DELETE). Ahora cualquier usuario con módulo COMPRAS puede gestionar inventario de papelería.
- **Rutas de Uniformes** (`backend/src/routes/uniform.routes.js`): Reemplazado `requireRole(['ADMIN','COMPRAS'])` y `requireRole(['ADMIN','COMPRAS','RH'])` por `requireModule('COMPRAS')` en 4 rutas (3 inventory + 1 history).
- **Rutas de Compras** (`backend/src/routes/purchase.routes.js`): Eliminadas 17 instancias redundantes de `requireRole(['ADMIN','COMPRAS'])` que estaban acompañadas de `requireModule('COMPRAS')`. Ahora todas las rutas usan exclusivamente `requireModule('COMPRAS')` para control de acceso (Nivel A).

### Docs
- **docs/PLAN_REMEDIACION_DEUDA_TECNICA.md**: Documento maestro de planificación de remediación de deuda técnica (733 líneas). Contiene 9 fases, cronograma de 7 semanas, métricas, riesgos y Definition of Done.
- **docs/DEUDA_TECNICA.md** (v2.1): Marcados como resueltos P2-008, P2-009, P3-005. Actualizado resumen de deuda y plan de remediación.

### Fixed
- **P2-008**: `stationery.routes.js` — Violación de Nivel A del modelo de seguridad corregida.
- **P2-009**: `uniform.routes.js` — Violación de Nivel A del modelo de seguridad corregida.

---

## Convención

| Etiqueta | Significado |
|----------|-------------|
| **Added** | Nuevas funcionalidades, módulos, endpoints, componentes |
| **Changed** | Cambios en funcionalidad existente, refactors, mejoras |
| **Fixed** | Correcciones de bugs, errores, problemas de producción |
| **Deprecated** | Funcionalidades que serán eliminadas en futuras versiones |
| **Removed** | Funcionalidades eliminadas |
| **Security** | Mejoras de seguridad, vulnerabilidades corregidas |
| **Docs** | Cambios en documentación |
| **Chore** | Tareas de mantenimiento, configuración, tooling |

---

## v5.2 — Constitución Técnica

**Fecha:** 24/06/2026

### Added
- **docs/API_GUIDELINES.md**: Guía completa de estándares para APIs REST (1,111 líneas)
  - Filosofía, estructura de respuestas, manejo de errores, códigos HTTP
  - Patrones de controladores delgados y servicios especializados
  - DTOs, validaciones, paginación, filtros, ordenamiento
  - Transacciones Prisma, auditoría, ejemplos completos GET/POST/PUT/DELETE
- **docs/DEPLOYMENT.md**: Proceso oficial de despliegue (411 líneas)
  - Arquitectura (Traefik → Frontend/Backend/PostgreSQL)
  - Entornos (desarrollo local + producción Coolify)
  - Checklist predeploy (11 verificaciones) y postdeploy (10 validaciones)
  - Rollback, migraciones seguras, backup de BD, variables de entorno
- **docs/TESTING.md**: Estrategia de pruebas del sistema (511 líneas)
  - Filosofía, tipos de pruebas (unitarias, integración, frontend, manuales)
  - 7 flujos críticos obligatorios con checklist
  - 42 casos de prueba documentados (AUTH, EMP, REC, COM, ACC, PAP, UNI)
  - Checklist pre-commit, estrategia de regresión, plantilla de bugs
- **docs/CHANGELOG.md**: Este archivo — registro de cambios del sistema
- **docs/STANDARDS.md**: Catálogo de ejemplos detallados de código
- **Sección 17 (Arquitectura Evolutiva)**: Principios de evolución progresiva (Simple → Modular → Escalable)
- **Sección 18 (Constitución Técnica)**: Propósito y límites del `.clinerules` como documento liviano
- **Sección 19 (Principio de Cambio Mínimo)**: Regla de preferir extender antes que reescribir
- **Sección 20 (Regla de Dependencias)**: Prioridad de soluciones sin nuevas librerías

### Changed
- **.clinerules v5.2**: Refuerzo como documento liviano de principios; ejemplos detallados movidos a `docs/STANDARDS.md`
- **Reglas de controllers**: Unificación (eliminación de contradicción entre secciones 3.1 y 5.2)

### Fixed
- Contradicción en reglas de controllers: se unificó el criterio (CRUD simple permitido en controller, lógica compleja en servicio)

---

## v5.1 — Refinamiento Pragmático

**Fecha:** 24/06/2026

### Added
- **Sección 15 (Pragmatismo y Simplicidad)**: Principios de evitar sobreingeniería y abstracciones prematuras
- **Sección 16 (Reglas para Agentes IA)**: Directrices específicas para asistentes de IA al modificar código

### Changed
- **Límites de tamaño**: Flexibilizados de obligatorios a objetivos recomendados
- **Regla de Prisma en controllers**: Relajada — CRUD simple permitido sin capa de servicio adicional
- **Flujo de trabajo**: Menos burocrático — cambios pequeños no requieren aprobación previa
- **Tono del documento**: Más técnico y neutral

---

## v5.0 — Refactorización Integral Arquitectónica

**Fecha:** 24/06/2026

### Added
- **Sección 3 (Arquitectura Backend)**: Separación de capas (routes → controllers → services), límites de tamaño, estructura de directorios
- **Sección 4 (Arquitectura Frontend)**: Estructura de directorios, reglas de frontend, límites de tamaño
- **Sección 9 (Reutilización y Anti-duplicidad)**: Regla de oro y ejemplos prohibidos
- **Sección 10 (Patrones Obligatorios)**: Sistema de Roles Escalable, patrón de controladores
- **Sección 11 (Flujo de Trabajo)**: Proceso obligatorio antes de programar, preguntas clave
- **Sección 12 (Git y Despliegue)**: Reglas de Git, proceso de commit
- **Sección 13 (Documentación Obligatoria)**: Documentos oficiales, regla de sincronización
- **Sección 14 (Checklist Final)**: 10 verificaciones antes de terminar un cambio

### Changed
- **Reorganización completa**: De 4 secciones a 14 secciones temáticas
- **Documentación**: Formalización de `docs/` como directorio oficial de documentación técnica

---

## v4.1 — Roles Estratégicos

**Fecha:** 13/06/2026

### Added
- **Roles Estratégicos**: Documentación formal de ADMIN y RH como roles con bypass global intencional
- **Política de seguridad**: Nota sobre autorización de Presidencia para nuevos roles estratégicos
- **Alcance documental de RH**: Control operativo global autorizado por Dirección General

### Changed
- **Ejemplos de código**: Actualizados para reflejar bypass de ADMIN/RH
- **Modelo de seguridad**: Alineado con la política oficial de seguridad de KRAM

---

## v4.0 — Centralización de Módulos

**Fecha:** 13/06/2026

### Added
- **modules.config.js**: Fuente de verdad centralizada para módulos del sistema
- **docs/ARQUITECTURA_KRAM.md**: Documento de arquitectura general
- **docs/FLUJOS_DE_NEGOCIO.md**: Flujos funcionales detallados
- **docs/MATRIZ_DE_PERMISOS.md**: Matriz completa de permisos
- **docs/ERD_KRAM.md**: Diagrama entidad-relación
- **docs/GUIA_NUEVO_MODULO.md**: Guía paso a paso para nuevos módulos
- **docs/DEUDA_TECNICA.md**: Inventario de deuda técnica
- **Módulo COMPRAS**: Incorporación oficial al sistema

### Changed
- **Reglas para nuevos módulos**: Procedimiento oficial de 13 pasos
- **Documentación**: Formalización de `docs/` como directorio oficial

---

## v3.0 — Sistema de Roles Escalable

**Fecha:** 04/06/2026

### Added
- **rolesConfig.js**: Sistema de roles escalable con presets de módulos
- **Endpoints dinámicos**: `GET /api/roles`, `GET /api/modules`, `GET /api/roles/presets`
- **Guía de escalabilidad**: Cómo agregar nuevos roles sin modificar código de validación
- **Paginación y filtros**: Implementación en listados de vacantes (Fase 3.3+3.4)
- **Unificación de creación de vacantes**: Helper `getOrCreateSolicitante` (Fase 3.1+3.2)

### Changed
- **Sistema de permisos**: Migración de ACL a sistema de roles escalable
- **Vacancy controller**: Unificado en `recruitment.controller.js`

---

## v2.0 — Sistema de Permisos ACL

**Fecha:** 03/06/2026

### Added
- **Estrategia de 3 niveles**: Control de acceso a módulos (A), scoping de datos (B), operaciones críticas (C)
- **Notificaciones por email**: Implementación con Resend API
- **Endpoint de seed/reset**: `POST /api/seed/reset` para limpiar BD desde API (solo ADMIN)
- **Importación CSV**: 3 modos de manejo de duplicados
- **CRUD de organización**: Modal con formulario inline de puestos
- **Notificaciones de cumpleaños y aniversarios**: Widget en dashboard
- **Perfil de empleado**: Hero, Cards, subida manual de foto y descarga
- **Cambio de contraseña**: Desde perfil de usuario
- **Restablecimiento de contraseña**: Para admin/login
- **Seed de producción**: Idempotente con flag `--reset`

### Changed
- **Upload de CV**: De memoryStorage a diskStorage (fix Error 500)
- **Dockerfiles**: Optimizaciones multi-stage para producción

### Fixed
- **Error 401 con emails con punto (Gmail)**: Eliminación de `normalizeEmail`
- **EACCES en uploads**: Permisos 777 en volúmenes persistentes
- **Mixed Content en producción**: Proxy Next.js para import CSV
- **Pruebas psicométricas**: Opcionales al registrar candidatos

---

## v1.0 — Versión Inicial

**Fecha:** 15/02/2026 — 02/06/2026

### Added
- **Autenticación**: Login con JWT, middleware de verificación
- **Módulo de Empleados**: Gestión de empleados y expedientes
  - CRUD completo, importación/exportación CSV
  - Perfil con foto, documentos, historial
- **Módulo de Reclutamiento**: Vacantes y candidatos
  - Creación de vacantes, registro de candidatos
  - Etapas de reclutamiento (ETIQUETA, ENTREVISTA_INICIAL, etc.)
  - Subida de CV y pruebas psicométricas
- **Módulo de Vacaciones**: Solicitud y aprobación
- **Módulo de Incidencias**: Reporte y seguimiento
- **Dashboard**: Panel principal con widgets
- **Configuración**: Gestión de usuarios, roles y módulos
- **Infraestructura Docker**: Dockerfiles multi-stage, docker-compose, Coolify
- **Base de datos**: PostgreSQL con Prisma ORM
- **Seed de datos**: Población inicial de catálogos

### Security
- **JWT**: Tokens con expiración de 7 días
- **bcrypt**: Hash de contraseñas (salt rounds: 10)
- **CORS**: Configuración para dominios kramhub.site
- **Middleware de autenticación**: `verifyToken` en rutas protegidas

---

## Historial de Versiones del Sistema

| Versión | Fecha | Nombre | Cambios destacados |
|---------|-------|--------|-------------------|
| **v5.2** | 24/06/2026 | Constitución Técnica | API Guidelines, Deployment, Testing, Changelog, STANDARDS.md, Arquitectura Evolutiva |
| **v5.1** | 24/06/2026 | Refinamiento Pragmático | Flexibilización de reglas, pragmatismo, reglas para IA |
| **v5.0** | 24/06/2026 | Refactorización Integral | Reorganización en 14 secciones, separación de capas, anti-duplicidad |
| **v4.1** | 13/06/2026 | Roles Estratégicos | Bypass global ADMIN/RH, política de seguridad |
| **v4.0** | 13/06/2026 | Centralización de Módulos | modules.config.js, docs/, módulo COMPRAS |
| **v3.0** | 04/06/2026 | Roles Escalable | rolesConfig.js, endpoints dinámicos, paginación |
| **v2.0** | 03/06/2026 | Permisos ACL | 3 niveles, notificaciones email, seed, CSV |
| **v1.0** | 15/02/2026 | Versión Inicial | Autenticación, Empleados, Reclutamiento, Docker |

---

*Fin del documento — Changelog del ERP KRAM*
