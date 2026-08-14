# ADR-005: Documentación como Driver del Desarrollo

| Campo | Valor |
|-------|-------|
| **Identificador** | ADR-005 |
| **Título** | Documentación como driver del desarrollo (Documentation-Driven Development) |
| **Estado** | Aprobado |
| **Fecha de aprobación** | 24 de junio de 2026 |
| **Versión** | 1.0 |
| **Autor** | Arquitectura — ERP KRAM |
| **Audiencia** | Arquitectos de software, desarrolladores full-stack, documentadores técnicos |

---

## Contexto

El ERP KRAM experimentó un crecimiento acelerado en sus primeros meses de desarrollo, pasando de 2 módulos (Empleados y Reclutamiento) a 10 módulos (incluyendo Vacaciones, Incidencias, Compras, Papelería, Uniformes, Configuración, Reportes y Dashboard) en menos de 4 meses.

Durante este crecimiento, la documentación del sistema se mantuvo exclusivamente en el archivo `.clinerules`, que originalmente era un documento pequeño de reglas para asistentes de IA. A medida que el sistema crecía, el `.clinerules` se expandió para incluir:

- Reglas de arquitectura backend y frontend.
- Modelo de seguridad de 3 niveles.
- Inventario de módulos y roles.
- Convenciones de código.
- Flujos de trabajo.
- Checklist de calidad.

Este crecimiento desordenado generó varios problemas:

1. El `.clinerules` superó las 800 líneas, volviéndose difícil de navegar.
2. Mezclaba principios generales con ejemplos de código específicos.
3. No existía una separación clara entre documentación de arquitectura, guías de implementación y reglas para IA.
4. No había un proceso definido para mantener la documentación sincronizada con el código.

---

## Problema

1. **Documentación reactiva**: La documentación se creaba después del código, como un ejercicio de "atrapar el estado actual", en lugar de guiar el desarrollo.

2. **Un solo archivo para todo**: El `.clinerules` intentaba ser la fuente de verdad para todo: reglas de IA, arquitectura, seguridad, convenciones, ejemplos y flujos de trabajo.

3. **Sincronización inconsistente**: No existía un proceso formal para actualizar la documentación cuando se agregaban módulos, roles o cambios arquitectónicos.

4. **Descubrimiento difícil**: Los desarrolladores no sabían dónde encontrar información específica (ej. "¿dónde está documentado el flujo de aprobación de compras?").

5. **Falta de estándares**: No había un formato definido para documentos de arquitectura, guías de API o registros de decisiones.

6. **Documentación huérfana**: Cuando se eliminaba o modificaba código, la documentación asociada rara vez se actualizaba, generando información obsoleta.

---

## Alternativas Consideradas

### Alternativa 1: Sin Documentación Formal — Código como Documentación

Mantener solo el código como fuente de verdad, sin documentación adicional. Los desarrolladores deben leer el código para entender el sistema.

**Ventajas:**
- Sin esfuerzo de documentación.
- El código siempre refleja la realidad (no puede estar desactualizado).
- Los desarrolladores aprenden a leer código eficientemente.

**Desventajas:**
- Imposible para nuevos desarrolladores entender la arquitectura general sin leer miles de líneas.
- Las decisiones arquitectónicas (por qué se hizo algo de cierta forma) se pierden.
- Dificultad para roles no técnicos (RH, Dirección) de entender el sistema.
- Alto costo de onboarding.

**Decisión:** Rechazada. No escala para un sistema con múltiples módulos y desarrolladores.

---

### Alternativa 2: Documentación Centralizada en .clinerules

Mantener toda la documentación en un solo archivo (.clinerules), como se venía haciendo.

**Ventajas:**
- Un solo lugar para buscar información.
- Fácil de mantener para equipos pequeños.
- Los asistentes de IA siempre tienen el contexto completo.

**Desventajas:**
- Archivo monolítico que supera las 800 líneas.
- Mezcla de conceptos (reglas, ejemplos, arquitectura, flujos).
- Difícil de navegar y encontrar información específica.
- No escalable a medida que el sistema crece.

**Decisión:** Rechazada. El archivo ya mostraba signos de degradación por tamaño y mezcla de conceptos.

---

### Alternativa 3: Documentación Estructurada con ADRs y Guías Especializadas (DECISIÓN TOMADA)

Implementar un modelo de documentación con las siguientes características:

1. **`.clinerules`**: Documento liviano de principios y reglas generales (máximo 300 líneas de reglas, sin ejemplos detallados).
2. **`docs/`**: Directorio con documentos especializados por tema (arquitectura, seguridad, API, despliegue, pruebas).
3. **`docs/adr/`**: Registro de Decisiones Arquitectónicas (ADRs) para decisiones importantes.
4. **Sincronización obligatoria**: La documentación debe actualizarse como parte del proceso de desarrollo, no después.

**Ventajas:**
- Separación clara de conceptos: cada documento tiene un propósito específico.
- El `.clinerules` se mantiene liviano y enfocado en reglas para IA.
- Los ADRs capturan el "por qué" de las decisiones arquitectónicas.
- Las guías especializadas (API, despliegue, pruebas) son fáciles de encontrar y mantener.
- Escalable: nuevos temas agregan nuevos documentos sin afectar los existentes.

**Desventajas:**
- Mayor cantidad de archivos que mantener.
- Requiere disciplina para mantener la sincronización.
- Los desarrolladores deben saber qué documento consultar para cada tema.

**Decisión:** Aprobada. Es el modelo que mejor equilibra completitud, mantenibilidad y escalabilidad.

---

## Decisión Tomada

Se establece la **Documentación como Driver del Desarrollo (DDD)** como política oficial del ERP KRAM.

### Estructura de Documentación

```
.clinerules                    ← Principios, reglas generales, seguridad (documento liviano)
docs/
├── ARQUITECTURA_KRAM.md       ← Arquitectura general, estructura del repositorio
├── MODELO_SEGURIDAD_KRAM.md   ← Modelo de seguridad ejecutivo
├── MATRIZ_DE_PERMISOS.md      ← Matriz completa de permisos por módulo y rol
├── FLUJOS_DE_NEGOCIO.md       ← Flujos funcionales detallados
├── ERD_KRAM.md                ← Diagrama entidad-relación
├── GUIA_NUEVO_MODULO.md       ← Guía paso a paso para nuevos módulos
├── API_GUIDELINES.md          ← Estándares para APIs REST
├── DEPLOYMENT.md              ← Proceso de despliegue
├── TESTING.md                 ← Estrategia de pruebas
├── CHANGELOG.md               ← Registro de cambios del sistema
├── STANDARDS.md               ← Catálogo de ejemplos detallados de código
├── DEUDA_TECNICA.md           ← Inventario de deuda técnica
└── adr/
    ├── ADR-001-Roles-Estrategicos.md
    ├── ADR-002-Controllers-vs-Services.md
    ├── ADR-003-Three-Level-Security.md
    ├── ADR-004-Pragmatism-Over-Overengineering.md
    └── ADR-005-Documentation-Driven-Development.md
```

### Reglas de Sincronización

#### Regla 1: Documentar Antes de Implementar

Para cambios significativos (nuevos módulos, cambios arquitectónicos, refactors mayores):

1. Escribir el ADR o documento de diseño primero.
2. Obtener aprobación del equipo.
3. Implementar el código.
4. Actualizar la documentación existente si es necesario.

#### Regla 2: Sin Código Huérfano de Documentación

No se considera completo un cambio hasta que la documentación asociada esté actualizada:

- Nuevo módulo → Actualizar `ARQUITECTURA_KRAM.md`, `MATRIZ_DE_PERMISOS.md`, `FLUJOS_DE_NEGOCIO.md`, `ERD_KRAM.md`.
- Nuevo rol → Actualizar `MATRIZ_DE_PERMISOS.md`, `.clinerules`.
- Nueva API → Seguir `API_GUIDELINES.md` y documentar en el código.
- Cambio arquitectónico → Crear o actualizar ADR.

#### Regla 3: Límites del .clinerules

El `.clinerules` debe mantenerse como un documento liviano:

- **Máximo**: 300 líneas de reglas y principios.
- **Lo que va en .clinerules**: Filosofía, principios, reglas de seguridad, convenciones generales.
- **Lo que NO va en .clinerules**: Ejemplos de código detallados, guías de implementación, flujos completos, matrices de permisos.
- **Si una regla es muy específica**: Moverla a `docs/` y referenciarla desde `.clinerules`.

#### Regla 4: ADRs para Decisiones Importantes

Crear un ADR cuando:

- Se introduce un nuevo patrón arquitectónico.
- Se cambia un patrón existente.
- Se toma una decisión con impacto en múltiples módulos.
- Se define una política de seguridad o calidad.
- Se adopta o rechaza una tecnología.

#### Regla 5: Revisión Periódica

Cada 3 meses, revisar:

- ¿La documentación refleja el estado actual del sistema?
- ¿Hay ADRs obsoletos que necesitan actualización?
- ¿Hay documentos que ya no son necesarios?
- ¿El `.clinerules` sigue siendo liviano?

---

## Consecuencias Positivas

1. **Documentación viva**: La documentación se mantiene sincronizada con el código porque es parte del proceso de desarrollo, no una tarea separada.

2. **Onboarding acelerado**: Nuevos desarrolladores pueden entender la arquitectura, decisiones y flujos del sistema sin leer todo el código.

3. **Decisiones trazables**: Los ADRs capturan el contexto, alternativas y razones detrás de cada decisión arquitectónica.

4. **Calidad consistente**: Las guías (API_GUIDELINES, STANDARDS) aseguran que todo el código siga los mismos patrones.

5. **Colaboración multidisciplinaria**: Roles no técnicos (RH, Dirección) pueden entender el sistema a través de la documentación de alto nivel.

6. **Reducción de deuda técnica**: La documentación obligatoria antes de implementar fuerza a pensar el diseño antes de escribir código.

---

## Riesgos

| Riesgo | Descripción | Mitigación |
|--------|-------------|------------|
| **Burocracia excesiva** | Que el proceso de documentación ralentice el desarrollo. | Solo cambios significativos requieren documentación previa. Cambios pequeños pueden documentarse después. |
| **Documentación obsoleta** | Que la documentación no se actualice y quede desactualizada. | Regla 2: sin código huérfano de documentación. Revisiones trimestrales. |
| **Sobre-documentación** | Documentar en exceso detalles triviales. | Enfocar la documentación en decisiones, patrones y flujos, no en cada función o variable. |
| **Falta de adherencia** | Desarrolladores que no siguen el proceso de documentación. | Revisiones de código que verifican documentación asociada. Cultura de calidad. |

---

## Implementación Técnica

### Documentación Existente (al 24/06/2026)

| Documento | Propósito | Estado |
|-----------|-----------|--------|
| `.clinerules` | Reglas maestras y principios del sistema | ✅ v5.2 |
| `docs/ARQUITECTURA_KRAM.md` | Arquitectura general | ✅ Actualizado |
| `docs/MODELO_SEGURIDAD_KRAM.md` | Modelo de seguridad | ✅ Actualizado |
| `docs/MATRIZ_DE_PERMISOS.md` | Matriz de permisos | ✅ Actualizado |
| `docs/FLUJOS_DE_NEGOCIO.md` | Flujos funcionales | ✅ Actualizado |
| `docs/ERD_KRAM.md` | Diagrama entidad-relación | ✅ Actualizado |
| `docs/GUIA_NUEVO_MODULO.md` | Guía para nuevos módulos | ✅ Actualizado |
| `docs/API_GUIDELINES.md` | Estándares de APIs REST | ✅ v1.0 |
| `docs/DEPLOYMENT.md` | Proceso de despliegue | ✅ v1.0 |
| `docs/TESTING.md` | Estrategia de pruebas | ✅ v1.0 |
| `docs/CHANGELOG.md` | Registro de cambios | ✅ v1.0 |
| `docs/STANDARDS.md` | Ejemplos detallados de código | ✅ v1.0 |
| `docs/DEUDA_TECNICA.md` | Inventario de deuda técnica | ✅ Actualizado |
| `docs/adr/ADR-001` | Roles Estratégicos | ✅ Aprobado |
| `docs/adr/ADR-002` | Controllers vs Services | ✅ Aprobado |
| `docs/adr/ADR-003` | Modelo de Seguridad 3 Niveles | ✅ Aprobado |
| `docs/adr/ADR-004` | Pragmatismo sobre Sobreingeniería | ✅ Aprobado |
| `docs/adr/ADR-005` | Documentación como Driver | ✅ Aprobado |

---

## Referencias

- `.clinerules` v5.2 — Reglas Maestras del ERP KRAM (Secciones 13, 18)
- `ADR-001` — Roles Estratégicos en el ERP KRAM
- `ADR-002` — Separación de Responsabilidades: Controllers vs Services
- `ADR-003` — Modelo de Seguridad de 3 Niveles
- `ADR-004` — Pragmatismo sobre Sobreingeniería

---

## Historial de Revisiones

| Versión | Fecha | Cambios | Autor |
|---------|-------|---------|-------|
| 1.0 | 24/06/2026 | Versión inicial. Definición de la política de Documentación como Driver del Desarrollo con estructura, reglas de sincronización y límites. | Arquitectura — ERP KRAM |

---

> **Nota:** Este ADR es un documento oficial de arquitectura del ERP KRAM. Cualquier modificación a la política de documentación definida en este documento debe ser revisada por el equipo de arquitectura y reflejada en el `.clinerules` y la documentación asociada.
