# Auditoría del Módulo: RECLUTAMIENTO

**Fecha**: 24/06/2026  
**Auditor**: Arquitectura — ERP KRAM  
**Versión**: 1.0

---

## Descripción

Módulo de reclutamiento que gestiona vacantes, candidatos, actividades del puesto, perfil técnico y comentarios. Soporta dos flujos: Estándar (solicitud → aprobación RH → actividades → búsqueda) y Directo/Fast-Track (creación directa por RH/ADMIN).

---

## Modelos Prisma

| Modelo | Propósito |
|--------|-----------|
| `JobVacancy` | Vacante de trabajo (solicitante, estatus, motivo, tipo contratación) |
| `JobActivity` | Actividades del puesto asociadas a una vacante |
| `CandidateRH` | Candidatos (CV, pruebas psicométricas, estatus) |
| `VacancyComment` | Comentarios en vacantes (tipo timeline) |
| `Employee` | Solicitante (relación con vacante) |
| `Department` | Departamento de la vacante |
| `JobPosition` | Puesto solicitado |

---

## Rutas (Backend)

### Archivo: `recruitment.routes.js` (197 líneas)

| Método | Ruta | Middleware | Controlador |
|--------|------|-----------|-------------|
| GET | `/vacancies/form-data` | requireModule('RECLUTAMIENTO') | getVacancyFormData |
| POST | `/vacancies` | requireModule('RECLUTAMIENTO') | createVacancyRequest |
| GET | `/vacancies` | requireModule('RECLUTAMIENTO') | getAllVacancyRequests |
| GET | `/vacancies/my` | requireModule('RECLUTAMIENTO') | getMyVacancyRequests |
| GET | `/vacancies/stats` | requireModule('RECLUTAMIENTO') | getVacancyRequestStats |
| GET | `/vacancies/:id` | requireModule('RECLUTAMIENTO') | getVacancyRequestById |
| POST | `/recruitment/vacancies` | requireModule('RECLUTAMIENTO') | createVacancyRequest |
| GET | `/recruitment/my-vacancies` | requireModule('RECLUTAMIENTO') | getMyVacancyRequests |
| PUT | `/recruitment/vacancies/:id/technical-profile` | requireModule('RECLUTAMIENTO') | updateTechnicalProfile |
| POST | `/recruitment/vacancies/:id/activities` | requireModule('RECLUTAMIENTO') | createJobActivities |
| GET | `/recruitment/vacancies` | requireModule('RECLUTAMIENTO') | getAllVacancyRequests |
| PUT | `/recruitment/vacancies/:id/approve` | requireRHOrAdmin() | approveVacancyRequest |
| PUT | `/recruitment/vacancies/:id/close` | requireRHOrAdmin() | closeVacancyRequest |
| GET | `/recruitment/vacancies/stats` | requireModule('RECLUTAMIENTO') | getVacancyRequestStats |
| POST | `/recruitment/vacancies/direct` | requireRHOrAdmin() | createDirectVacancy |
| GET | `/recruitment/vacancies/:id` | requireModule('RECLUTAMIENTO') | getVacancyRequestById |
| POST | `/recruitment/vacancies/:id/comments` | requireModule('RECLUTAMIENTO') | addComment |
| POST | `/recruitment/vacancies/:vacancy_id/candidates` | requireRHOrAdmin() | createCandidate |
| PUT | `/recruitment/candidates/:candidate_id/observations` | requireRHOrAdmin() | updateCandidateObservations |
| PUT | `/recruitment/candidates/:candidate_id/documents` | requireRHOrAdmin() | updateCandidateDocuments |
| PUT | `/recruitment/candidates/:candidate_id/vote` | requireModule('RECLUTAMIENTO') | updateCandidateVote |
| PUT | `/recruitment/candidates/:candidate_id/select` | requireModule('RECLUTAMIENTO') | selectCandidate |
| GET | `/recruitment/candidates/:candidate_id/cv` | requireModule('RECLUTAMIENTO') | downloadCandidateCV |
| DELETE | `/recruitment/vacancies/:id` | requireRHOrAdmin() | deleteVacancy |
| PUT | `/recruitment/activities/:activityId` | requireModule('RECLUTAMIENTO') | updateActivity |
| PUT | `/recruitment/vacancies/:id/cancel` | requireModule('RECLUTAMIENTO') | cancelVacancy |

**Total de endpoints**: 26

---

## APIs (Frontend)

| Objeto | Métodos |
|--------|---------|
| `vacancyApi` | `getAll`, `getById`, `create`, `update`, `getMyVacancies`, `approve`, `close`, `getStats`, `getActivities`, `createActivity`, `updateActivity` |
| `recruitmentApi` | `getAll`, `getById`, `create`, `update`, `getMyVacancies`, `approve`, `close`, `getStats`, `getCandidates`, `createCandidate`, `updateCandidateObservations`, `voteCandidate`, `selectCandidate`, `getCandidateCV`, `getComments`, `createComment`, `updateTechnicalProfile` |

---

## Componentes (Frontend)

| Componente | Archivo |
|-----------|---------|
| CandidatesTab | `frontend/app/reclutamiento/vacantes/[id]/CandidatesTab.js` |

### Páginas

| Ruta Frontend | Archivo |
|---------------|---------|
| `/reclutamiento/mis-solicitudes` | `frontend/app/reclutamiento/mis-solicitudes/page.js` |
| `/reclutamiento/solicitar-vacante` | `frontend/app/reclutamiento/solicitar-vacante/page.js` |
| `/reclutamiento/vacantes/[id]` | `frontend/app/reclutamiento/vacantes/[id]/page.js` |
| `/reclutamiento/vacantes/[id]/perfil-tecnico` | `frontend/app/reclutamiento/vacantes/[id]/perfil-tecnico/page.js` |
| `/rh/reclutamiento/crear-vacante` | `frontend/app/rh/reclutamiento/crear-vacante/page.js` |
| `/my-vacancies` | `frontend/app/my-vacancies/page.js` |
| `/vacancies/[id]` | `frontend/app/vacancies/[id]/page.js` |

---

## Servicios

No hay servicios dedicados. Toda la lógica está en el controller (`recruitment.controller.js` - 1550 líneas).

---

## Problemas Encontrados

### 🔴 P0 — Críticos

1. **Controller monolítico de 1550 líneas**: `recruitment.controller.js` contiene TODA la lógica de negocio + consultas Prisma + lógica de archivos + notificaciones. Violación severa de separación de capas.

2. **Dos sistemas de vacantes paralelos**: Existen rutas duplicadas:
   - `/api/vacancies/*` → `recruitmentController`
   - `/api/recruitment/vacancies/*` → `recruitmentController`
   Ambos apuntan al MISMO controller, causando confusión y duplicidad.

3. **Dos APIs frontend duplicadas**: `vacancyApi` y `recruitmentApi` en `api.js` apuntan a endpoints diferentes pero funcionalidad idéntica.

### 🟡 P1 — Altos

4. **`getOrCreateSolicitante` crea empleados RH automáticamente**: Si no existe empleado asociado al usuario, crea uno temporal con datos ficticios (RFC: RH000000000, CURP: RH00000000000000). Esto contamina la BD.

5. **Prisma directo en controller**: Todas las consultas se hacen directamente en el controller, sin capa de servicio.

6. **Lógica de email inline**: Las notificaciones por email se envían directamente desde el controller.

### 🟡 P2 — Medios

7. **Falta de paginación en candidatos**: `getCandidates` no tiene paginación.

8. **No hay scoping Nivel B**: Cualquier usuario con módulo RECLUTAMIENTO puede ver todas las vacantes.

### 🟢 P3 — Bajos

9. **Código duplicado de manejo de archivos psychTest** (líneas 107-121 y 141-158 en recruitment.routes.js).

10. **Falta de validación de tipos de archivo** en upload de candidatos.

---

## Deuda Técnica

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| DT-R01 | Controller de 1550 líneas sin servicios | P0 |
| DT-R02 | Dos sistemas de vacantes paralelos | P1 |
| DT-R03 | Creación automática de empleados RH ficticios | P1 |
| DT-R04 | Prisma directo en controller | P1 |
| DT-R05 | Código duplicado de manejo de archivos | P2 |
| DT-R06 | APIs frontend duplicadas (vacancyApi + recruitmentApi) | P1 |

---

## Estado General

| Dimensión | Calificación | Comentario |
|-----------|-------------|------------|
| **Arquitectura** | 4/10 | Controller monolítico, sin servicios, sin separación de capas |
| **Seguridad** | 6/10 | Nivel A presente, Nivel B ausente |
| **UI** | 7/10 | Funcional pero con duplicidad de páginas |
| **Backend** | 4/10 | Toda la lógica en controller, sin servicios |
| **Mantenibilidad** | 3/10 | Controller de 1550 líneas, código duplicado |

### Calificación Final: **4.8 / 10**
