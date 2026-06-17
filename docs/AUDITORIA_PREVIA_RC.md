# AUDITORÍA PREVIA — ERP KRAM v1.0 RC

**Fecha**: 16/06/2026  
**Versión**: 1.0  
**Propósito**: Diagnóstico integral pre-consolidación

---

## 1. INFORME EJECUTIVO

ERP KRAM ha completado el Sprint del módulo de Compras con resultados sólidos. El sistema cuenta con **8 módulos funcionales**, **6 roles del sistema**, y una arquitectura de permisos de 3 niveles (A/B/C) correctamente implementada.

**Estado general**: REQUIERE AJUSTES MENORES

**Fortalezas**:
- Arquitectura de permisos escalable (ACL dinámico con bypass ADMIN/RH)
- Módulo de Compras completo con flujo de autorización, cotizaciones, OC y PDF
- Refactorización exitosa del controlador de compras en servicios especializados
- Sistema de auditoría implementado en operaciones críticas
- Página pública de autorización (/autorizar-compra) sin dependencia de módulo

**Debilidades**:
- Dashboard principal sobrecargado con lógica duplicada del sidebar
- Múltiples dashboards con información redundante (Mi Espacio vs Dashboard RH)
- Falta de favicon y branding inconsistente
- Código duplicado en validaciones de acceso (frontend y backend)
- Componentes muy grandes (>500 líneas) que requieren refactor

---

## 2. INVENTARIO FUNCIONAL COMPLETO

| Módulo | Estado | Rutas Frontend | Backend | Frontend | Observaciones |
|--------|--------|----------------|---------|----------|---------------|
| **Dashboard** | Completo | `/dashboard` | — | `dashboard/page.js` | Panel principal con grid dinámico de módulos |
| **Empleados** | Completo | `/rh/empleados`, `/dashboard/mi-espacio`, `/dashboard/organizacion` | `employee.routes.js`, `employee.controller.js` | `rh/empleados/`, `dashboard/mi-espacio/`, `dashboard/organizacion/` | CRUD completo, import/export CSV, fotos, documentos |
| **Reclutamiento** | Completo | `/reclutamiento/*`, `/rh/reclutamiento/*` | `recruitment.routes.js`, `recruitment.controller.js` | `reclutamiento/`, `rh/reclutamiento/` | Vacantes, candidatos, CV, perfil técnico, actividades |
| **Vacaciones** | Parcial | — | — | — | Módulo registrado en config pero sin rutas ni UI |
| **Incidencias** | Parcial | `/rh/incidencias` | `attendance.routes.js`, `attendance.controller.js` | `rh/incidencias/` | Ruta registrada, funcionalidad básica de asistencia |
| **Configuración** | Completo | `/dashboard/accesos`, `/dashboard/usuarios` | `permission.routes.js`, `user.routes.js` | `dashboard/accesos/`, `dashboard/usuarios/` | Gestión de accesos, usuarios, roles personalizados |
| **Reportes** | Parcial | — | `stats.routes.js`, `stats.controller.js` | — | Endpoints de estadísticas existentes, sin UI de reportes dedicada |
| **Compras** | Completo | `/compras/*`, `/dashboard/compras/*`, `/autorizar-compra/*` | `purchase.routes.js`, `purchase-public.routes.js` | `compras/`, `dashboard/compras/`, `autorizar-compra/` | Flujo completo: solicitud → cotización → autorización → OC → entrega |

### Módulos con estado "Parcial":
- **VACACIONES**: Registrado en `modules.config.js` y en presets de RH/ADMIN, pero sin implementación de rutas ni UI
- **INCIDENCIAS**: Ruta montada en `/api/incidencias`, página `/rh/incidencias` existe pero funcionalidad básica
- **REPORTES**: Endpoints de stats funcionando, pero sin página de reportes dedicada en el frontend

---

## 3. MATRIZ DE PERMISOS

### Comportamiento Real vs Documentado

| Rol | Sidebar (Mi Portal) | Sidebar (Admin Global) | Módulos por preset | Ownership (Nivel B) | Nivel C |
|-----|---------------------|----------------------|-------------------|---------------------|---------|
| **ADMIN** | Todos los módulos | Todos (sin filtro de rol) | DASHBOARD, EMPLEADOS, RECLUTAMIENTO, VACACIONES, INCIDENCIAS, CONFIGURACION, REPORTES, COMPRAS | Bypass total | ✅ Puede todo |
| **RH** | Módulos asignados | Solo items sin filtro de rol (EMPLEADOS, RECLUTAMIENTO, INCIDENCIAS) | DASHBOARD, EMPLEADOS, RECLUTAMIENTO, VACACIONES, INCIDENCIAS, REPORTES | Bypass total | ❌ No tiene acceso a CONFIGURACION (Nivel C) |
| **SISTEMAS** | DASHBOARD + módulos asignados | Solo CONFIGURACION (filtrado por rol) | DASHBOARD, CONFIGURACION, REPORTES | Scoping por empleado | Solo ADMIN |
| **COMPRAS** | DASHBOARD + COMPRAS | Solo COMPRAS (filtrado por rol) | DASHBOARD, COMPRAS, REPORTES | Scoping por empleado + rol COMPRAS | Solo ADMIN |
| **PRODUCCION** | Solo DASHBOARD | Ninguno (sin módulos asignados) | DASHBOARD, REPORTES | Scoping por empleado | Solo ADMIN |
| **EMPLEADO_BASICO** | Solo DASHBOARD | Ninguno | DASHBOARD | Scoping por empleado | Solo ADMIN |

### Hallazgos de Permisos

1. **✅ Bypass ADMIN/RH correcto**: `auth.middleware.js` línea 335 implementa bypass para ADMIN y RH en `requireModule()`
2. **✅ `accessibleModules` funcional**: Se usa correctamente en frontend (DashboardLayout, ProtectedRoute) y backend (requireModule)
3. **⚠️ RH no tiene CONFIGURACION en preset**: Aunque RH tiene bypass en módulos, el preset no incluye CONFIGURACION. Esto es correcto porque el bypass anula el preset, pero es confuso documentalmente
4. **⚠️ ProtectedRoute no tiene bypass ADMIN/RH**: El componente `ProtectedRoute.js` verifica `accessibleModules?.includes(requiredModule)` sin bypass para ADMIN/RH. Esto significa que si un ADMIN no tiene explícitamente un módulo en `accessibleModules`, no podrá acceder aunque el backend se lo permita
5. **⚠️ `requireRole` hardcodea nombres de roles**: En `auth.middleware.js` líneas 96-101, los nombres de roles están hardcodeados. Si se agrega un nuevo rol, no aparecerá en el mensaje de error

---

## 4. HALLAZGOS UX

### Críticos

| # | Hallazgo | Impacto | Archivo |
|---|----------|---------|---------|
| C1 | **Dashboard principal sobrecargado**: `dashboard/page.js` (132 líneas) duplica la lógica de navegación del sidebar. Los mismos módulos se muestran en sidebar y en grid, creando redundancia | Medio | `frontend/app/dashboard/page.js` |
| C2 | **Mi Espacio vs Dashboard RH**: Ambas páginas muestran información similar (vacantes, actividades) pero con APIs diferentes (`/stats/my-dashboard` vs `/stats/rh/dashboard`). Confunde al usuario sobre cuál usar | Medio | `mi-espacio/page.js`, `rh/dashboard-completo/page.js` |
| C3 | **Sin feedback visual de carga en operaciones**: Al autorizar, eliminar o cambiar estado, no hay indicador de progreso en botones de acción (excepto `deletingId`) | Bajo | `dashboard/compras/page.js` |

### Medios

| # | Hallazgo | Impacto | Archivo |
|---|----------|---------|---------|
| M1 | **Sidebar no colapsable en desktop**: Ocupa 256px fijos. En pantallas pequeñas (1280px), el contenido principal se comprime | Bajo | `DashboardLayout.js` |
| M2 | **Menú de usuario con outline verde**: Línea 263: `style={{outline: '2px solid green'}}` — parece debug CSS olvidado | Bajo | `DashboardLayout.js` |
| M3 | **Tabla de compras sin paginación**: Si hay muchas solicitudes, la tabla crece indefinidamente | Bajo | `dashboard/compras/page.js` |
| M4 | **Sin confirmación visual en acciones rápidas**: Las cards de "Acciones Rápidas" no muestran feedback al hacer clic | Bajo | `mi-espacio/page.js`, `rh/dashboard-completo/page.js` |

### Bajos

| # | Hallazgo | Impacto | Archivo |
|---|----------|---------|---------|
| B1 | **Dashboard RH sin acceso a Vacaciones/Incidencias**: Aunque el módulo existe, no hay enlaces directos desde el dashboard | Muy Bajo | `rh/dashboard-completo/page.js` |
| B2 | **Login sin opción "Recordar contraseña"**: El formulario de login no tiene checkbox "Recordarme" | Muy Bajo | `login/page.js` |
| B3 | **Sin breadcrumbs**: No hay navegación jerárquica en ninguna página | Muy Bajo | Global |

---

## 5. HALLAZGOS TÉCNICOS

### Código Duplicado

| # | Archivo | Problema | Riesgo | Prioridad |
|---|---------|----------|--------|-----------|
| T1 | `auth.middleware.js` (líneas 10-79 vs 235-317) | **Código duplicado**: `verifyToken` y `verifyTokenFromQuery` son casi idénticos (~80 líneas cada uno). Solo cambia la fuente del token | Medio | P1 |
| T2 | `DashboardLayout.js` (líneas 93-161 vs 184-241) | **Sidebar duplicado**: La versión móvil y desktop del sidebar tienen la misma lógica de navegación pero HTML separado (~70 líneas cada uno) | Medio | P1 |
| T3 | `dashboard/page.js` (líneas 32-84) vs `DashboardLayout.js` (líneas 10-29) | **Lógica de navegación duplicada**: Ambos archivos definen qué módulos mostrar, con filtros similares | Bajo | P2 |
| T4 | `dashboard/compras/page.js` (líneas 110-138) vs (líneas 182-198) | **Lógica de cálculo de monto duplicada**: `calculateTotal` y `getAmountDisplay` tienen la misma lógica | Bajo | P2 |

### Endpoints y Servicios

| # | Archivo | Problema | Riesgo | Prioridad |
|---|---------|----------|--------|-----------|
| T5 | `backend/src/services/purchases/` | **Servicios no utilizados**: `comparison.service.js`, `approval.service.js`, `quote.service.js` existen pero no se pudo verificar su uso completo | Medio | P2 |
| T6 | `backend/src/routes/recruitment.routes.js` | **Rutas duplicadas**: `/vacancies/*` y `/recruitment/vacancies/*` apuntan al mismo controlador. Confuso para mantenimiento | Medio | P2 |
| T7 | `backend/src/index.js` | **Ruta huérfana**: `vacancy.routes.js` fue eliminado pero el comentario en línea 48 lo referencia | Muy Bajo | P3 |

### Componentes Grandes

| # | Archivo | Líneas | Problema | Prioridad |
|---|---------|--------|----------|-----------|
| T8 | `purchase.controller.js` | 805 | **Muy grande**: Aunque refactorizado, el orquestador sigue siendo extenso | P2 |
| T9 | `dashboard/compras/page.js` | 692 | **Muy grande**: Panel de administración de compras con toda la lógica en un solo componente | P2 |
| T10 | `purchase-order.service.js` | ~600 (estimado) | **Grande**: Servicio de órdenes de compra con generación de PDF | P2 |
| T11 | `rh/dashboard-completo/page.js` | 488 | **Grande**: Dashboard RH con múltiples secciones | P3 |
| T12 | `purchase.service.js` | 504 | **Grande**: Servicio principal de compras con múltiples responsabilidades | P3 |

### Configuraciones Redundantes

| # | Archivo | Problema | Prioridad |
|---|---------|----------|-----------|
| T13 | `frontend/lib/rolesConfig.js` vs `backend/src/routes/roles.routes.js` | **Config duplicada**: `ROLE_FALLBACK_CONFIG` duplica `SYSTEM_ROLES`. Aunque es intencional (fallback), puede desincronizarse | P2 |
| T14 | `backend/src/config/modules.config.js` vs `backend/prisma/schema.prisma` (enum ModuleType) | **Dos fuentes de verdad**: Los módulos se definen en ambos lugares. Si se agrega uno nuevo, hay que actualizar ambos | P2 |

---

## 6. BRANDING E IDENTIDAD

### Estado Actual

| Elemento | Estado | Observación |
|----------|--------|-------------|
| **Login** | ✅ Bueno | Fondo gradiente oscuro con blobs, logo KRAM en esquina superior izquierda, diseño moderno |
| **Dashboard** | ⚠️ Básico | Sin logo, solo texto "ERP KRAM" en sidebar. Sin favicon |
| **Landing Page** | ✅ Bueno | Logo grande, tarjetas de módulos, diseño consistente con login |
| **Metadata** | ⚠️ Genérico | Title: "ERP KRAM - Sistema de Gestión Empresarial". Sin keywords ni Open Graph |
| **Favicon** | ❌ Ausente | No hay `<link rel="icon">` en `layout.js`. El navegador muestra el default |
| **Nombre del sistema** | ✅ Consistente | "ERP KRAM" en todos lados |
| **Colores** | ⚠️ Inconsistente | Login/Landing usan teal (`teal-500`), dashboard usa azul (`blue-600`). Dos paletas distintas |
| **Logo** | ✅ Presente | `Kram-logo-web.png` en public/, `logo-kram.png` en uploads/ |

### Estrategia Propuesta

1. **Unificar paleta de colores**: Decidir entre teal (login/landing) o azul (dashboard). Recomendación: mantener teal como color primario corporativo
2. **Agregar favicon**: Usar una versión simplificada del logo KRAM como favicon
3. **Mejorar metadata**: Agregar keywords, Open Graph, y description más descriptiva
4. **Logo en sidebar**: Agregar el logo KRAM en el sidebar del dashboard (reemplazar texto "ERP KRAM")
5. **Consistencia de botones**: Unificar estilos de botones primarios (teal en login, azul en dashboard)

---

## 7. EVALUACIÓN RELEASE CANDIDATE

| Área | Estado | Justificación |
|------|--------|---------------|
| **Compras** | ✅ LISTO | Módulo completo con flujo de extremo a extremo, auditoría, PDF, autorización pública |
| **RH** | ⚠️ REQUIERE AJUSTES MENORES | Empleados y Reclutamiento completos. Vacaciones e Incidencias parciales |
| **Seguridad** | ✅ LISTO | ACL de 3 niveles implementado correctamente. Bypass ADMIN/RH funcional |
| **UX** | ⚠️ REQUIERE AJUSTES MENORES | Dashboards redundantes, sidebar no colapsable, debug CSS presente |
| **Documentación** | ⚠️ REQUIERE REVISIÓN | `.clinerules` actualizado, `docs/` con arquitectura y matriz de permisos. Falta documentación de API |
| **Branding** | ⚠️ REQUIERE AJUSTES MENORES | Sin favicon, paleta inconsistente, metadata genérica |
| **Producción** | ⚠️ REQUIERE REVISIÓN | Docker configurado, CORS para producción. Falta verificar variables de entorno en producción |

### Veredicto

```
ERP KRAM v1.0 RC — CONDICIONAL
```

Se requiere completar los ajustes menores antes de declarar RC definitivo:
1. Agregar favicon
2. Unificar paleta de colores
3. Eliminar debug CSS (outline verde)
4. Completar módulo de Vacaciones (mínimo funcionalidad básica)
5. Agregar paginación a tabla de compras

---

## 8. ROADMAP — SPRINT DE CONSOLIDACIÓN

### Fase 1: Correcciones Críticas (Prioridad Alta)
- [ ] Agregar bypass ADMIN/RH en `ProtectedRoute.js` (frontend)
- [ ] Eliminar debug CSS (outline verde) en `DashboardLayout.js`
- [ ] Agregar favicon
- [ ] Unificar paleta de colores (teal como primario)

### Fase 2: Refactor Técnico (Prioridad Media)
- [ ] Refactorizar `auth.middleware.js`: unificar `verifyToken` y `verifyTokenFromQuery`
- [ ] Refactorizar `DashboardLayout.js`: extraer sidebar a componente reutilizable
- [ ] Eliminar rutas duplicadas en `recruitment.routes.js` (`/vacancies/*` vs `/recruitment/vacancies/*`)
- [ ] Agregar paginación a tabla de compras

### Fase 3: Completar Módulos Parciales (Prioridad Media)
- [ ] Implementar UI básica de Vacaciones (solicitud y aprobación)
- [ ] Implementar página de Reportes con gráficas
- [ ] Mejorar módulo de Incidencias

### Fase 4: Mejoras UX (Prioridad Baja)
- [ ] Agregar breadcrumbs
- [ ] Simplificar dashboards (unificar Mi Espacio y Dashboard RH)
- [ ] Agregar indicadores de carga en botones de acción
- [ ] Sidebar colapsable en desktop

### Fase 5: Documentación y Producción (Prioridad Media)
- [ ] Documentar API endpoints
- [ ] Verificar variables de entorno en producción
- [ ] Agregar keywords y Open Graph metadata
- [ ] Logo KRAM en sidebar del dashboard

---

## 9. LISTA PRIORIZADA DE ACCIONES CORRECTIVAS

| # | Acción | Prioridad | Esfuerzo | Impacto | Área |
|---|--------|-----------|----------|---------|------|
| 1 | Agregar bypass ADMIN/RH en ProtectedRoute | 🔴 Alta | 15 min | Alto | Seguridad |
| 2 | Eliminar outline verde debug | 🔴 Alta | 5 min | Medio | UX |
| 3 | Agregar favicon | 🔴 Alta | 15 min | Medio | Branding |
| 4 | Unificar paleta teal/azul | 🟡 Media | 1 hora | Alto | Branding |
| 5 | Refactor auth.middleware (verifyToken duplicado) | 🟡 Media | 1 hora | Medio | Técnico |
| 6 | Refactor DashboardLayout (sidebar duplicado) | 🟡 Media | 2 horas | Medio | Técnico |
| 7 | Eliminar rutas duplicadas en recruitment | 🟡 Media | 30 min | Bajo | Técnico |
| 8 | Agregar paginación a tabla de compras | 🟡 Media | 1 hora | Medio | UX |
| 9 | Implementar UI de Vacaciones | 🟡 Media | 4 horas | Alto | Funcional |
| 10 | Implementar página de Reportes | 🟡 Media | 3 horas | Medio | Funcional |
| 11 | Agregar breadcrumbs | 🟢 Baja | 2 horas | Bajo | UX |
| 12 | Unificar dashboards (Mi Espacio + RH) | 🟢 Baja | 3 horas | Medio | UX |
| 13 | Logo KRAM en sidebar | 🟢 Baja | 15 min | Bajo | Branding |
| 14 | Documentar API endpoints | 🟢 Baja | 4 horas | Alto | Documentación |

---

## 10. MÉTRICAS DEL SISTEMA

| Métrica | Valor |
|---------|-------|
| **Módulos registrados** | 8 (7 enabled + DASHBOARD implícito) |
| **Roles del sistema** | 6 |
| **Presets definidos** | 6 |
| **Endpoints backend** | ~80 (estimado) |
| **Páginas frontend** | ~25 (estimado) |
| **Componentes React** | ~15 (estimado) |
| **Servicios backend** | ~15 (estimado) |
| **Archivos de ruta** | 13 |
| **Controladores** | 14 |
| **Middleware** | 2 |
| **Archivos de configuración** | 5 (modules, roles, company, auth, upload) |

---

*Documento generado el 16/06/2026. Auditoría exclusivamente de análisis — no modificar código.*
