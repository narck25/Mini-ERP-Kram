# ADR-001: Roles Estratégicos en el ERP KRAM

| Campo | Valor |
|-------|-------|
| **Identificador** | ADR-001 |
| **Título** | Definición de Roles Estratégicos con bypass global |
| **Estado** | Aprobado |
| **Fecha de aprobación** | 13 de junio de 2026 |
| **Versión** | 1.0 |
| **Autor** | Dirección General — Comercializadora KRAM |
| **Audiencia** | Arquitectos de software, desarrolladores, administradores del sistema, Dirección General |

---

## Contexto

El ERP KRAM fue diseñado originalmente con un modelo de autorización donde los permisos de acceso a módulos se asignaban mediante un array configurable por usuario (`accessibleModules`), independientemente del rol del usuario. Este enfoque permitía flexibilidad en la asignación de accesos, pero no contemplaba la existencia de roles con privilegios especiales que requirieran bypass sobre las validaciones estándar.

A medida que el sistema creció en funcionalidad y número de usuarios, surgió la necesidad de identificar formalmente aquellos roles que, por su naturaleza organizacional, requieren acceso irrestricto a la información y funcionalidades del sistema sin estar sujetos a las restricciones de módulos ni a los filtros de visibilidad de datos.

Dos roles en particular —Administrador del Sistema (ADMIN) y Recursos Humanos (RH)— operaban de facto con acceso completo, pero esta condición no estaba formalmente documentada ni implementada de manera consistente en todos los niveles de autorización del sistema. Esta falta de formalización generaba ambigüedad en el código, donde algunos endpoints validaban el rol directamente mientras que otros confiaban exclusivamente en el array de módulos.

---

## Problema

El ERP KRAM carecía de una definición formal y vinculante de los roles que poseen privilegios especiales dentro del sistema. Esta ausencia generaba los siguientes problemas:

1. **Inconsistencia en la implementación**: Algunos endpoints validaban el acceso mediante `accessibleModules` mientras que otros usaban validaciones directas por rol (`user.role === 'ADMIN'`), sin un criterio unificado sobre cuándo correspondía cada enfoque.

2. **Ambigüedad organizacional**: El rol RH operaba con acceso completo al sistema por práctica establecida, pero sin una directriz documentada que respaldara este privilegio, lo que generaba dudas sobre si dicho acceso era intencional o una omisión de seguridad.

3. **Riesgo de proliferación no controlada**: Sin una política explícita, existía el riesgo de que otros roles solicitaran y obtuvieran privilegios equivalentes sin la debida autorización de la Dirección General, diluyendo el control de acceso del sistema.

4. **Dificultad de auditoría**: La ausencia de documentación formal dificultaba la auditoría de seguridad, pues no existía un registro de qué roles tenían privilegios excepcionales y bajo qué autorización.

---

## Alternativas Consideradas

### Alternativa 1: Modelo Plano — Sin roles con bypass

Mantener el modelo original donde ningún rol tiene bypass global. Todos los usuarios, incluidos ADMIN y RH, estarían sujetos a las mismas validaciones de `accessibleModules` y scoping de datos.

**Ventajas:**
- Simplicidad conceptual: un solo mecanismo de autorización para todos.
- No requiere tratamiento especial en el código.
- Máxima granularidad de control.

**Desventajas:**
- No refleja la realidad organizacional, donde ADMIN y RH requieren acceso global para cumplir sus funciones.
- Incrementa la fricción operativa: ADMIN necesitaría tener todos los módulos asignados explícitamente.
- No resuelve la necesidad de RH de acceder a datos de todos los empleados para funciones de gestión de personal.
- Riesgo de que, por omisión, se bloqueen funciones críticas del negocio.

**Decisión:** Rechazada. No se alinea con las necesidades operativas de la organización.

---

### Alternativa 2: Bypass exclusivo para ADMIN

Conceder bypass global únicamente al rol ADMIN, manteniendo a RH como un rol departamental más, sujeto a las mismas restricciones que los demás.

**Ventajas:**
- Modelo de seguridad más restrictivo.
- Solo un rol con privilegios excepcionales, fácil de auditar.
- Alineado con modelos tradicionales donde el administrador técnico tiene acceso total.

**Desventajas:**
- No refleja la estructura organizacional de Comercializadora KRAM, donde RH opera como brazo ejecutor de Presidencia.
- RH requiere acceso a datos de todos los empleados (nómina, expedientes, vacaciones, incidencias) para funciones de gestión de personal.
- RH requiere capacidad de configurar accesos de usuarios (asignar módulos) como parte de sus funciones operativas.
- Generaría cuellos de botella operativos al centralizar en ADMIN funciones que RH debe ejecutar cotidianamente.

**Decisión:** Rechazada. No se ajusta a la realidad operativa de la organización.

---

### Alternativa 3: Bypass para ADMIN y RH con responsabilidades diferenciadas (DECISIÓN TOMADA)

Conceder bypass global a ADMIN y RH, pero con responsabilidades y alcances distintos:

- **ADMIN**: Control técnico global con acceso a operaciones críticas del sistema (Nivel C).
- **RH**: Control operativo global autorizado por Dirección General, con acceso a todos los módulos y datos, pero sin acceso a operaciones críticas del sistema (Nivel C).

**Ventajas:**
- Refleja fielmente la estructura organizacional de Comercializadora KRAM.
- Separa claramente las responsabilidades técnicas (ADMIN) de las operativas (RH).
- RH puede ejecutar sus funciones sin depender de ADMIN para cada operación.
- ADMIN retiene el control exclusivo sobre operaciones críticas del sistema.
- Modelo auditable y documentable.

**Desventajas:**
- Requiere implementar lógica de bypass en todos los niveles de autorización.
- Mayor complejidad inicial en el código (validaciones de dos roles estratégicos en lugar de uno).
- Riesgo de que futuros desarrolladores extiendan el bypass a otros roles sin autorización.

**Decisión:** Aprobada. Es la alternativa que mejor equilibra seguridad, operatividad y fidelidad organizacional.

---

## Decisión Tomada

Se define formalmente que el ERP KRAM reconoce dos **Roles Estratégicos** con bypass global, cada uno con responsabilidades distintas y complementarias:

### ADMIN — Control Técnico Global

El rol ADMIN posee acceso completo e irrestricto a todas las funcionalidades del sistema, incluyendo:

- Acceso a todos los módulos del sistema, sin necesidad de tenerlos asignados en `accessibleModules`.
- Visibilidad total de todos los datos, sin filtros de scoping por departamento, jerarquía o propiedad.
- Ejecución de operaciones críticas del sistema (Nivel C): modificación de permisos de usuarios, creación y eliminación de usuarios, gestión de roles personalizados, estadísticas del sistema, y operaciones destructivas.

ADMIN es responsable de la administración técnica del sistema y reporta directamente a Presidencia.

### RH — Control Operativo Global Autorizado por Dirección General

El rol RH posee acceso completo a todos los módulos y datos del sistema, con las siguientes características:

- Acceso a todos los módulos del sistema, sin necesidad de tenerlos asignados en `accessibleModules`.
- Visibilidad total de todos los datos, sin filtros de scoping por departamento, jerarquía o propiedad.
- Capacidad de configurar accesos de usuarios (asignar y quitar módulos) en conjunto con ADMIN.
- **No tiene acceso** a operaciones críticas del sistema (Nivel C) que requieren explícitamente el rol ADMIN.

RH es responsable de la gestión de personal, reclutamiento, configuración de accesos y supervisión operativa. Representa la mano derecha operativa de Presidencia dentro de Comercializadora KRAM. Por decisión explícita de Dirección General, RH posee acceso global al sistema, al mismo nivel funcional que ADMIN, aunque con responsabilidades distintas.

### Bypass Global

Ambos roles tienen bypass total en:

| Aspecto | ADMIN | RH |
|---------|-------|-----|
| Acceso a módulos (Nivel A) | ✅ Bypass total | ✅ Bypass total |
| Scoping de datos (Nivel B) | ✅ Bypass total | ✅ Bypass total |
| Operaciones críticas (Nivel C) | ✅ Acceso completo | ❌ Sin acceso |

### Fundamento Organizacional

La decisión de otorgar a RH acceso global al sistema responde a la estructura organizacional de Comercializadora KRAM, donde:

1. RH ejecuta funciones de gestión de personal que requieren acceso a datos de todos los empleados (expedientes, nómina, vacaciones, incidencias).
2. RH es responsable del reclutamiento, lo que requiere acceso completo al módulo de Reclutamiento.
3. RH configura los accesos de los usuarios al sistema, función que requiere visibilidad de todos los módulos disponibles.
4. RH opera como brazo ejecutor de Presidencia en materia de personal, con autorización explícita de Dirección General para acceder a cualquier información del sistema.

---

## Consecuencias Positivas

1. **Claridad organizacional**: Queda formalmente establecido qué roles tienen privilegios especiales y bajo qué autorización.

2. **Consistencia en la implementación**: El código ahora tiene una guía clara sobre cuándo usar bypass de ADMIN/RH y cuándo usar `accessibleModules`.

3. **Eficiencia operativa**: RH puede ejecutar sus funciones sin depender de ADMIN para cada operación, reduciendo cuellos de botella.

4. **Separación de responsabilidades**: ADMIN se enfoca en control técnico; RH en control operativo. No hay duplicación ni conflicto de funciones.

5. **Auditabilidad**: La existencia de roles con bypass global está documentada y justificada, facilitando auditorías de seguridad.

6. **Escalabilidad**: El modelo permite agregar nuevos roles departamentales sin necesidad de otorgar bypass, manteniendo el control de acceso granular.

7. **Marco para decisiones futuras**: Cualquier solicitud de privilegios excepcionales deberá seguir el proceso establecido, evitando decisiones ad-hoc.

---

## Riesgos

| Riesgo | Descripción | Mitigación |
|--------|-------------|------------|
| **Proliferación no autorizada** | Que futuros desarrolladores extiendan el bypass a otros roles sin la debida autorización. | Política explícita documentada en `.clinerules` y en el presente ADR. Solo Presidencia puede autorizar nuevos roles con bypass. |
| **Abuso de privilegios** | Que un usuario con rol ADMIN o RH haga mal uso de su acceso global. | Registro de auditoría de operaciones críticas. Revisión periódica de accesos. |
| **Suplantación de identidad** | Que un atacante obtenga credenciales de ADMIN o RH y acceda a todo el sistema. | Autenticación multifactor recomendada para roles estratégicos. Monitoreo de inicios de sesión. |
| **Desactualización documental** | Que este ADR no se actualice si en el futuro se modifican los roles estratégicos. | Este ADR debe revisarse y actualizarse si se agregan o modifican Roles Estratégicos. |
| **Dependencia de RH** | Que la organización se vuelva dependiente de RH para operaciones que podrían descentralizarse. | Evaluación periódica de la necesidad de delegar ciertas funciones a roles departamentales. |

---

## Implementación Técnica

La implementación de esta decisión se refleja en los siguientes componentes del sistema:

### Backend

- **`backend/src/middlewares/auth.middleware.js`**: Implementa `requireModule()` con bypass automático para ADMIN y RH. Implementa `requireRole()` para operaciones de Nivel C.
- **`backend/src/config/modules.config.js`**: Fuente de verdad de módulos del sistema.
- **`backend/src/config/roles.config.js`**: Presets de módulos por rol.
- **`backend/src/routes/roles.routes.js`**: SYSTEM_ROLES con definición de roles del sistema.

### Frontend

- **`frontend/components/DashboardLayout.js`**: Sidebar que filtra navegación usando `accessibleModules` con bypass para ADMIN/RH.
- **`frontend/components/ProtectedRoute.js`**: Componente para proteger rutas del frontend.
- **`frontend/lib/rolesConfig.js`**: Fallback visual (no usar para autorización).

### Documentación

- **`.clinerules`**: Reglas maestras del sistema, versión 4.1.
- **`docs/MODELO_SEGURIDAD_KRAM.md`**: Documento ejecutivo del modelo de seguridad.
- **`docs/MATRIZ_DE_PERMISOS.md`**: Matriz completa de permisos y rutas protegidas.
- **`docs/ARQUITECTURA_KRAM.md`**: Arquitectura general del sistema.

---

## Referencias

- `.clinerules` v4.1 — Reglas Maestras del ERP KRAM (Secciones 1, 6, 7, 9)
- `docs/MODELO_SEGURIDAD_KRAM.md` — Modelo de Seguridad del ERP KRAM
- `docs/MATRIZ_DE_PERMISOS.md` — Matriz de Permisos del ERP KRAM
- `docs/ARQUITECTURA_KRAM.md` — Arquitectura del ERP KRAM

---

## Historial de Revisiones

| Versión | Fecha | Cambios | Autor |
|---------|-------|---------|-------|
| 1.0 | 13/06/2026 | Versión inicial. Definición de ADMIN y RH como Roles Estratégicos con bypass global. | Dirección General — Comercializadora KRAM |

---

> **Nota:** Este ADR es un documento oficial de arquitectura del ERP KRAM. Cualquier modificación a los Roles Estratégicos definidos en este documento requiere la aprobación de la Dirección General y debe reflejarse en el `.clinerules` y la documentación asociada.
