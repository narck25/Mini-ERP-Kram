# Guía de Trabajo para Agentes IA — ERP KRAM

**Última actualización**: 24/06/2026  
**Versión**: 1.0  
**Propósito**: Documentar el proceso de trabajo, reglas y buenas prácticas que deben seguir Cline y otros agentes IA al interactuar con el código del ERP KRAM.

---

## Índice

1. [Filosofía General](#1-filosofía-general)
2. [Proceso Antes de Programar](#2-proceso-antes-de-programar)
3. [Principio de Cambio Mínimo](#3-principio-de-cambio-mínimo)
4. [Refactorizar Antes de Reescribir](#4-refactorizar-antes-de-reescribir)
5. [No Duplicar Código](#5-no-duplicar-código)
6. [No Hacer Push Automático](#6-no-hacer-push-automático)
7. [Mostrar Riesgos](#7-mostrar-riesgos)
8. [Revisar Documentación](#8-revisar-documentación)
9. [Actualizar Documentación](#9-actualizar-documentación)
10. [Buenas Prácticas](#10-buenas-prácticas)
11. [Errores Comunes](#11-errores-comunes)
12. [Checklist Final](#12-checklist-final)

---

## 1. Filosofía General

El ERP KRAM es un sistema en crecimiento activo. Como agente IA, tu objetivo es **ayudar a mantener y hacer crecer el sistema de manera ordenada**, siguiendo los principios establecidos en `.clinerules` y la documentación asociada.

### Principios Rectores para Agentes IA

| Principio | Descripción |
|-----------|-------------|
| **Cambio mínimo** | Implementar la modificación más pequeña que resuelva el problema |
| **Refactorizar antes de reescribir** | Extender lo existente antes que crear desde cero |
| **No duplicar** | Buscar siempre si ya existe algo similar antes de crear |
| **Documentación viva** | Mantener docs sincronizados con el código |
| **Transparencia** | Mostrar riesgos y cambios propuestos antes de ejecutarlos |

---

## 2. Proceso Antes de Programar

**ANTES DE ESCRIBIR CUALQUIER CÓDIGO**, seguir este proceso en orden:

```
1. Analizar el requerimiento
   ↓
2. Leer archivos relacionados (contexto completo)
   ↓
3. Buscar componentes existentes (frontend)
   ↓
4. Buscar servicios existentes (backend)
   ↓
5. Buscar endpoints existentes (backend)
   ↓
6. Detectar duplicidades con lo existente
   ↓
7. Revisar documentación relevante (.clinerules, docs/)
   ↓
8. Proponer plan de implementación (si es cambio grande)
   ↓
9. Programar
```

### 2.1 Preguntas Clave Antes de Programar

- [ ] ¿Ya existe un componente/servicio/endpoint que haga algo similar?
- [ ] ¿Puedo extender lo existente en lugar de crear algo nuevo?
- [ ] ¿Estoy siguiendo los patrones establecidos (controllers delgados, servicios especializados)?
- [ ] ¿Estoy respetando la separación de capas (routes → controllers → services)?
- [ ] ¿Estoy usando `accessibleModules` correctamente (Nivel A)?
- [ ] ¿Estoy aplicando scoping de datos donde corresponde (Nivel B)?
- [ ] ¿Estoy protegiendo operaciones críticas con `requireRole` (Nivel C)?
- [ ] ¿Ya revisé la documentación existente?
- [ ] ¿Este cambio afecta el schema de Prisma o las rutas de API?

### 2.2 Cambios Grandes vs Pequeños

| Tipo | Definición | Proceso |
|------|-----------|---------|
| **Cambio grande** | Nuevo módulo, cambio arquitectónico, refactor mayor, cambios de schema | Proponer plan → Esperar aprobación → Programar |
| **Cambio pequeño** | Corrección de bug, mejora localizada, refactor menor, cambio evidente | Puede implementarse directamente respetando las reglas |

---

## 3. Principio de Cambio Mínimo

### 3.1 Regla

Implementar **siempre** el cambio más pequeño que resuelva el problema. No anticipar necesidades futuras.

### 3.2 Prioridad

```
1. Extender una función existente (agregar parámetro opcional)
2. Modificar lógica existente (cambiar comportamiento)
3. Crear archivo nuevo (solo si no existe donde ponerlo)
4. Reescribir (último recurso)
```

### 3.3 Ejemplos

```js
// ✅ BIEN: Cambio mínimo — agregar un parámetro opcional
function getEmployees(departmentId, includeInactive = false) {
  // ...
}

// ❌ MAL: Reescribir toda la función para agregar una funcionalidad pequeña
function getEmployeesV2(departmentId, includeInactive) {
  // Reescribe toda la lógica existente solo para agregar un filtro
}
```

### 3.4 Cuándo NO aplicar cambio mínimo

- Cuando el código existente tiene bugs estructurales.
- Cuando el código existente viola los principios del sistema (ej. lógica de negocio en controller).
- Cuando extender lo existente genera más deuda técnica que refactorizar.

---

## 4. Refactorizar Antes de Reescribir

### 4.1 Regla

**Preferir refactorizar** el código existente antes que reescribirlo desde cero. La reescritura introduce nuevos bugs, pierde el historial de decisiones y duplica esfuerzos.

### 4.2 Proceso de Refactorización

```
1. Identificar el código existente que necesita cambio
2. Entender su funcionamiento actual (leer el código completo)
3. Identificar dependencias (quién lo usa, qué usa)
4. Hacer el cambio mínimo que mejore el código
5. Verificar que no se rompieron dependencias
6. Ejecutar pruebas si existen
```

### 4.3 Cuándo REFACTORIZAR

- El código funciona pero es difícil de entender.
- Hay duplicación que se puede eliminar.
- El código viola principios del sistema (ej. lógica en controller).
- Se necesita agregar funcionalidad y el código actual lo permite.

### 4.4 Cuándo REESCRIBIR (solo con autorización)

- El código tiene bugs estructurales que no se pueden corregir con cambios mínimos.
- El código está obsoleto y no se puede extender.
- El código fue generado automáticamente y no es mantenible.
- **Siempre con autorización explícita del usuario.**

---

## 5. No Duplicar Código

### 5.1 Regla de Oro

**Antes de crear** cualquier componente, servicio, endpoint, hook o utilidad:

1. Buscar si ya existe algo similar en el código base.
2. Si existe pero no es exactamente lo que necesitas, **refactorizar** antes de duplicar.
3. Si no existe, crearlo siguiendo los patrones establecidos.

### 5.2 Qué Buscar

| Tipo | Dónde buscar | Qué buscar |
|------|-------------|------------|
| Servicios | `backend/src/services/` | Funcionalidad similar por dominio |
| Controladores | `backend/src/controllers/` | Endpoints similares |
| Rutas | `backend/src/routes/` | Patrones de ruta similares |
| Componentes | `frontend/components/` | UI similar |
| Hooks | `frontend/hooks/` | Lógica de estado similar |
| Utilidades | `frontend/utils/`, `backend/src/utils/` | Funciones helper |
| API | `frontend/lib/api.js` | Endpoints ya consumidos |

### 5.3 Prohibido

```js
purchaseServiceNew.js       // ❌ Usar purchase.service.js existente
rolesConfigV2.js            // ❌ Usar rolesConfig.js existente
employeeControllerCopy.js   // ❌ Usar employee.controller.js existente
```

### 5.4 Excepción Justificada

Si después de buscar no existe nada similar, y la funcionalidad es genuinamente nueva, se puede crear. Pero antes:

1. Verificar que no se pueda agregar a un archivo existente.
2. Documentar por qué no se pudo reutilizar nada existente.
3. Seguir los patrones de nombres establecidos.

---

## 6. No Hacer Push Automático

### 6.1 Regla

**NUNCA** hacer automáticamente `git add`, `git commit` o `git push`. Siempre se debe:

1. **Mostrar al usuario** los archivos modificados.
2. **Presentar un resumen** de los cambios realizados.
3. **Identificar riesgos** potenciales (migraciones, cambios de schema, permisos).
4. **Esperar confirmación explícita** del usuario.

### 6.2 Proceso de Commit

```
1. Mostrar: "Archivos modificados: [lista]"
2. Mostrar: "Resumen de cambios: [descripción]"
3. Mostrar: "Riesgos: [ninguno / migraciones / cambios de permisos / etc.]"
4. Preguntar: "¿Procedo con el commit y push?"
5. Solo ejecutar tras confirmación del usuario
```

### 6.3 Formato del Resumen

```text
## Archivos modificados
- backend/src/services/nuevo-servicio.service.js (CREADO)
- backend/src/controllers/controlador.controller.js (MODIFICADO)
- backend/src/routes/nuevas-rutas.routes.js (CREADO)
- backend/src/index.js (MODIFICADO)

## Resumen de cambios
- Se agregó el módulo de [nombre] con:
  - CRUD completo (crear, listar, obtener, actualizar, eliminar)
  - Protección con requireModule('MODULO')
  - Scoping de datos por departamento

## Riesgos
- ⚠️ Se agregaron nuevas rutas en index.js
- ⚠️ Se requiere migración de base de datos (nuevo modelo en schema.prisma)
- ✅ No se modificaron rutas existentes
- ✅ No se modificaron permisos existentes
```

---

## 7. Mostrar Riesgos

### 7.1 Regla

Antes de ejecutar cualquier cambio que pueda tener impacto en el sistema, **mostrar los riesgos identificados** al usuario.

### 7.2 Tipos de Riesgo

| Riesgo | Nivel | Ejemplo |
|--------|-------|---------|
| **Migración de BD** | 🔴 Alto | Nuevo modelo en schema.prisma, cambio de enum |
| **Cambio de schema** | 🔴 Alto | Renombrar columna, cambiar tipo de dato |
| **Cambio de ruta API** | 🟡 Medio | Nuevo endpoint, cambio de método HTTP |
| **Cambio de permisos** | 🟡 Medio | Nuevo módulo, cambio en accessibleModules |
| **Cambio de contrato frontend** | 🟡 Medio | Nueva propiedad en respuesta API |
| **Eliminación de código** | 🟡 Medio | Eliminar función, componente o archivo |
| **Nueva dependencia** | 🟢 Bajo | npm install de nueva librería |
| **Cambio de configuración** | 🟢 Bajo | Docker, variables de entorno |

### 7.3 Formato para Mostrar Riesgos

```text
## Análisis de Riesgos

🔴 ALTO: Se modificará schema.prisma (nueva tabla + migración)
🟡 MEDIO: Se agregarán nuevas rutas protegidas con requireModule
🟢 BAJO: No se modifican rutas existentes
🟢 BAJO: No se modifican permisos existentes

## Impacto
- Frontend: Requiere nuevos componentes de UI
- Backend: Nuevos servicios + controladores
- Base de datos: Requiere `npx prisma migrate dev`
- Permisos: No afecta usuarios existentes
```

---

## 8. Revisar Documentación

### 8.1 Regla

Antes de implementar cualquier cambio, **revisar la documentación existente** para asegurarse de seguir los patrones y reglas establecidos.

### 8.2 Documentos a Revisar por Tipo de Cambio

| Tipo de Cambio | Documentos a Revisar |
|----------------|---------------------|
| **Nuevo módulo** | `.clinerules` (sección 6), `docs/GUIA_NUEVO_MODULO.md`, `docs/ARQUITECTURA_KRAM.md` |
| **Nueva API** | `docs/API_GUIDELINES.md`, `docs/STANDARDS.md` (sección 2-4) |
| **Cambio de seguridad** | `.clinerules` (sección 5), `docs/MODELO_SEGURIDAD_KRAM.md`, `ADR-003` |
| **Nuevo componente** | `docs/STANDARDS.md` (sección 5-6), `docs/ARQUITECTURA_KRAM.md` (frontend) |
| **Cambio de BD** | `backend/prisma/schema.prisma`, `docs/ERD_KRAM.md` |
| **Cualquier cambio** | `.clinerules` (secciones 1-20), `docs/CHANGELOG.md` |

### 8.3 Documentación Mínima a Conocer

| Documento | Propósito | Obligatorio |
|-----------|-----------|-------------|
| `.clinerules` | Reglas maestras del sistema | ✅ Siempre |
| `docs/API_GUIDELINES.md` | Estándares de APIs REST | ✅ Para cambios backend |
| `docs/STANDARDS.md` | Ejemplos y patrones de código | ✅ Para cualquier cambio |
| `docs/ARQUITECTURA_KRAM.md` | Arquitectura general | ✅ Para cambios estructurales |
| `docs/MATRIZ_DE_PERMISOS.md` | Matriz de permisos | ✅ Para cambios de seguridad |
| `docs/adr/` | Decisiones arquitectónicas | ✅ Para cambios que afecten decisiones previas |

---

## 9. Actualizar Documentación

### 9.1 Regla

**No se considera completo un cambio** hasta que la documentación asociada esté actualizada.

### 9.2 Qué Actualizar Según el Cambio

| Cambio | Documentos a Actualizar |
|--------|------------------------|
| **Nuevo módulo** | `docs/ARQUITECTURA_KRAM.md`, `docs/MATRIZ_DE_PERMISOS.md`, `docs/FLUJOS_DE_NEGOCIO.md`, `docs/ERD_KRAM.md`, `.clinerules` (sección 6) |
| **Nuevo rol** | `docs/MATRIZ_DE_PERMISOS.md`, `.clinerules` (sección 10) |
| **Nueva API** | `docs/API_GUIDELINES.md` (si agrega nuevo patrón) |
| **Cambio arquitectónico** | `docs/adr/` (nuevo ADR o actualización), `docs/ARQUITECTURA_KRAM.md` |
| **Cambio de seguridad** | `docs/MODELO_SEGURIDAD_KRAM.md`, `docs/MATRIZ_DE_PERMISOS.md` |
| **Cambio de BD** | `docs/ERD_KRAM.md` |
| **Cualquier cambio significativo** | `docs/CHANGELOG.md` |

### 9.3 Formato para Actualizar CHANGELOG.md

```markdown
## vX.Y — Nombre de la Versión

**Fecha:** DD/MM/AAAA

### Added
- Descripción del cambio

### Changed
- Descripción del cambio

### Fixed
- Descripción del cambio
```

---

## 10. Buenas Prácticas

### 10.1 Para Agentes IA

| Práctica | Descripción |
|----------|-------------|
| **Leer antes de modificar** | Siempre leer el archivo completo antes de hacer cambios |
| **Entender el contexto** | No asumir comportamientos; inspeccionar el código real |
| **Cambios atómicos** | Un cambio lógico por commit, no mezclar propósitos |
| **Preservar compatibilidad** | No romper APIs existentes sin autorización |
| **Preferir refactorizar** | Extender antes que reescribir |
| **Documentar decisiones** | Si algo no es obvio, dejar un comentario |
| **Ser explícito** | No usar abreviaturas crípticas en nombres de variables |
| **Seguir convenciones** | Usar los mismos patrones que el código existente |

### 10.2 Para el Código

```js
// ✅ BIEN: Código legible y con propósito claro
static async getPendingApprovals(req, res) {
  try {
    const userId = req.user.id;
    const approvals = await PurchaseService.getPendingApprovals(userId);
    res.json({ data: approvals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ❌ MAL: Código críptico y sin contexto
static async gPA(req, res) {
  try {
    const u = req.user.id;
    const a = await PS.gPA(u);
    res.json({ d: a });
  } catch (e) {
    res.status(500).json({ e: e.message });
  }
}
```

### 10.3 Para Mensajes de Error

```js
// ✅ BIEN: Mensaje claro y en español
res.status(400).json({ error: 'La solicitud de compra no existe o no está disponible' });

// ❌ MAL: Mensaje genérico
res.status(400).json({ error: 'Error' });
```

### 10.4 Para Validaciones

```js
// ✅ BIEN: Validar antes de operar
if (!req.body.items || req.body.items.length === 0) {
  return res.status(400).json({ error: 'La solicitud debe contener al menos un artículo' });
}

// ❌ MAL: Dejar que Prisma lance el error
const result = await prisma.purchase.create({ data: req.body }); // Crash si items está vacío
```

---

## 11. Errores Comunes

### 11.1 Errores de Arquitectura

| Error | Problema | Solución |
|-------|----------|----------|
| **Lógica de negocio en controller** | Violación de separación de capas | Mover a servicio |
| **Prisma en controller** | Acoplamiento a BD en capa de orquestación | Mover a servicio (excepto CRUD simple) |
| **Hardcodear roles** | `user.role === 'SISTEMAS'` para acceso a módulos | Usar `accessibleModules` |
| **No implementar scoping** | Usuario ve datos que no debería | Agregar filtros Nivel B en servicio |
| **No proteger Nivel C** | Operación crítica sin requireRole | Agregar middleware o validación inline |

### 11.2 Errores de Frontend

| Error | Problema | Solución |
|-------|----------|----------|
| **Lógica compleja en page.js** | Página difícil de mantener | Extraer a hooks o subcomponentes |
| **No usar ProtectedRoute** | Ruta accesible sin autenticación | Envolver en `<ProtectedRoute>` |
| **Hardcodear módulos** | Lista de módulos fija en frontend | Consumir desde `GET /api/modules` |
| **No formatear fechas** | Fecha ISO mostrada al usuario | Usar `DD/MM/YYYY` con split('T')[0] |

### 11.3 Errores de Proceso

| Error | Problema | Solución |
|-------|----------|----------|
| **No revisar docs** | Implementar algo que ya existe o está prohibido | Leer `.clinerules` y `docs/` primero |
| **No mostrar riesgos** | Usuario sorprendido por cambios inesperados | Siempre mostrar análisis de riesgos |
| **Push automático** | Código sin revisión en producción | Seguir proceso de commit (sección 6) |
| **No actualizar docs** | Documentación desactualizada | Actualizar docs como parte del cambio |
| **Cambio grande sin plan** | Implementación desordenada | Proponer plan y esperar aprobación |

### 11.4 Errores de Base de Datos

| Error | Problema | Solución |
|-------|----------|----------|
| **Renombrar tablas/columnas** | Rompe frontend y consultas existentes | No hacer sin autorización explícita |
| **Campos calculados en BD** | Edad, antigüedad almacenados | Calcular dinámicamente en frontend |
| **SQL directo** | ByPass de Prisma ORM | Usar Prisma Client siempre |
| **Borrado físico** | Pérdida de datos irrecuperable | Usar borrado lógico (isActive, deletedAt) |

---

## 12. Checklist Final

### 12.1 Verificación Antes de Terminar un Cambio

Antes de dar por completado cualquier cambio, verificar:

| # | Verificación | Descripción |
|---|-------------|-------------|
| ✓ | **No hay código duplicado** | Se buscaron componentes/servicios/endpoints existentes antes de crear nuevos |
| ✓ | **No hay lógica en controllers** | Los controllers solo orquestan, no contienen lógica de negocio ni consultas Prisma (excepto CRUD simple) |
| ✓ | **No se rompió schema.prisma** | No se renombraron tablas/columnas existentes sin autorización |
| ✓ | **No se rompieron permisos** | Se usó `accessibleModules` en lugar de hardcodear roles (excepto ADMIN/RH) |
| ✓ | **Se reutilizaron servicios existentes** | No se crearon servicios duplicados cuando ya existía uno similar |
| ✓ | **No se agregaron hardcodes** | No se hardcodearon listados de módulos, roles ni permisos en el frontend |
| ✓ | **Se mantuvo la arquitectura** | Se respetó la separación de capas (routes → controllers → services) |
| ✓ | **Se actualizó documentación** | Se reflejaron los cambios en `.clinerules` y `docs/` si fue necesario |
| ✓ | **El código es escalable** | Agregar nuevos módulos/roles no requiere modificar código existente |
| ✓ | **El cambio es consistente con ERP KRAM** | Sigue los patrones establecidos y la filosofía del sistema |
| ✓ | **Se mostraron riesgos al usuario** | Se identificaron y comunicaron los riesgos del cambio |
| ✓ | **No se hizo push automático** | Se esperó confirmación del usuario para git add/commit/push |

### 12.2 Pregunta Final

```
¿El cambio que estás por hacer...

  ...respeta la separación de capas?
  ...usa accessibleModules en lugar de roles hardcodeados?
  ...reutiliza servicios existentes?
  ...no duplica código?
  ...está documentado?
  ...es escalable?
  ...es el cambio mínimo necesario?
  ...se mostraron los riesgos al usuario?

Si la respuesta a TODAS es SÍ, procede.
Si alguna es NO, refactoriza antes de continuar.
```

---

## Referencias

- `.clinerules` v5.2 — Reglas Maestras del ERP KRAM (Secciones 11, 14, 16, 19)
- `ADR-002` — Separación de Responsabilidades: Controllers vs Services
- `ADR-004` — Pragmatismo sobre Sobreingeniería
- `ADR-005` — Documentación como Driver del Desarrollo
- `docs/API_GUIDELINES.md` — Guía de APIs REST
- `docs/STANDARDS.md` — Estándares de código y patrones detallados
- `docs/CHANGELOG.md` — Registro de cambios del sistema

---

## Historial de Revisiones

| Versión | Fecha | Cambios | Autor |
|---------|-------|---------|-------|
| 1.0 | 24/06/2026 | Versión inicial. Guía completa de trabajo para agentes IA en el ERP KRAM. | Arquitectura — ERP KRAM |

---

*Fin del documento — Guía de Trabajo para Agentes IA del ERP KRAM*
