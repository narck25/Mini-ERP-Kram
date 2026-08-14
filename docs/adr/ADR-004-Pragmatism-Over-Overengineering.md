# ADR-004: Pragmatismo sobre Sobreingeniería

| Campo | Valor |
|-------|-------|
| **Identificador** | ADR-004 |
| **Título** | Principio de pragmatismo sobre sobreingeniería en el diseño arquitectónico |
| **Estado** | Aprobado |
| **Fecha de aprobación** | 24 de junio de 2026 |
| **Versión** | 1.0 |
| **Autor** | Arquitectura — ERP KRAM |
| **Audiencia** | Arquitectos de software, desarrolladores full-stack, revisores de código |

---

## Contexto

El ERP KRAM comenzó como un sistema pequeño con autenticación básica y dos módulos (Empleados y Reclutamiento). A medida que creció —agregando Vacaciones, Incidencias, Compras, Papelería, Uniformes, Configuración y Reportes—, la arquitectura evolucionó de manera orgánica.

En este proceso de crecimiento, surgieron dos tendencias opuestas entre los desarrolladores:

1. **Simplistas**: Propensos a escribir código directo sin abstracciones, lo que generaba duplicación y dificultad de mantenimiento.
2. **Sobreingenieros**: Propensos a crear capas de abstracción, interfaces y patrones antes de que fueran necesarios, lo que generaba complejidad innecesaria y código difícil de seguir.

El sistema necesitaba un equilibrio: suficiente estructura para ser mantenible, pero sin caer en la sobreingeniería que ralentiza el desarrollo y dificulta la comprensión del código.

---

## Problema

1. **Abstracciones prematuras**: Se creaban servicios, hooks y componentes genéricos para funcionalidades que solo se usaban en un lugar, bajo la premisa de "prepararse para el futuro".

2. **Fragmentación artificial**: Archivos de 30 líneas que podrían ser parte de un archivo de 100 líneas, fragmentados solo para cumplir métricas arbitrarias de tamaño.

3. **Patrones innecesarios**: Implementación de patrones de diseño (Factory, Observer, Singleton) para problemas que podían resolverse con una función simple.

4. **Código muerto por abstracción**: Capas de abstracción que nunca se utilizaban pero se mantenían "por si acaso", aumentando la deuda técnica y la carga cognitiva.

5. **Dificultad de onboarding**: Nuevos desarrolladores encontraban difícil entender el flujo del código debido a la cantidad de indirecciones y abstracciones.

---

## Alternativas Consideradas

### Alternativa 1: Sin Reglas — Cada Desarrollador Decide

No establecer reglas sobre cuándo abstraer. Cada desarrollador decide según su criterio.

**Ventajas:**
- Sin restricciones, máxima libertad creativa.
- No requiere documentación ni consenso.
- Cada desarrollador usa el enfoque con el que se siente más cómodo.

**Desventajas:**
- Inconsistencia total en el código base.
- Algunos módulos tendrán sobreingeniería, otros serán código espagueti.
- Dificultad de mantenimiento a largo plazo.
- Rotación de desarrolladores: cada uno deja su estilo particular.

**Decisión:** Rechazada. La falta de reglas genera caos arquitectónico en sistemas que crecen.

---

### Alternativa 2: Arquitectura Estricta — Patrones Obligatorios

Exigir que todo el código siga patrones arquitectónicos estrictos (capas, interfaces, DTOs, repositorios, casos de uso, etc.).

**Ventajas:**
- Consistencia total en todo el código base.
- Preparado para escalar a cientos de módulos.
- Fácil de auditar: todo sigue la misma estructura.
- Alineado con principios de Domain-Driven Design (DDD).

**Desventajas:**
- Sobrecarga cognitiva para cambios pequeños.
- Curva de aprendizaje alta para nuevos desarrolladores.
- Abstracciones innecesarias para operaciones simples.
- Mayor tiempo de desarrollo para funcionalidades triviales.
- Riesgo de que los desarrolladores encuentren formas de evadir la arquitectura.

**Decisión:** Rechazada. Introduce sobreingeniería que no se justifica para el tamaño actual del sistema.

---

### Alternativa 3: Arquitectura Evolutiva con Pragmatismo (DECISIÓN TOMADA)

Implementar una arquitectura que evolucione con el sistema, donde las abstracciones aparezcan solo cuando exista una necesidad real. Priorizar la simplicidad y legibilidad sobre la adherencia dogmática a patrones.

**Principios:**
- **Simple → Modular → Escalable**: Progresión natural, no saltos arquitectónicos.
- **La simplicidad tiene prioridad** sobre la sobreingeniería.
- **Evitar abstracciones prematuras**: No crear capas que aún no se necesitan.
- **No fragmentar artificialmente**: Un archivo de 200 líneas es mejor que 5 archivos de 40 líneas si no hay una razón de dominio para separarlos.

**Ventajas:**
- Equilibrio entre estructura y pragmatismo.
- El código refleja la complejidad real del problema, no una complejidad arquitectónica impuesta.
- Fácil onboarding: los nuevos desarrolladores pueden entender el flujo sin conocer patrones complejos.
- Evolución natural: cuando un módulo crece, se refactoriza con la estructura adecuada.

**Desventajas:**
- Requiere criterio y disciplina del desarrollador para saber cuándo abstraer.
- Riesgo de que módulos crezcan demasiado antes de ser refactorizados.
- No hay una receta única: cada módulo puede tener una estructura ligeramente diferente.

**Decisión:** Aprobada. Es el enfoque que mejor equilibra mantenibilidad, velocidad de desarrollo y adaptabilidad.

---

## Decisión Tomada

Se establece el **Pragmatismo sobre Sobreingeniería** como principio rector del desarrollo en el ERP KRAM.

### Reglas Prácticas

#### 1. Progresión Natural

```
Fase 1: Simple
  → Código directo, mínimo de abstracciones
  → Válido para CRUDs, páginas simples, utilidades
  → Ejemplo: Un controlador con 3 operaciones CRUD simples

Fase 2: Modular
  → Extraer responsabilidades cuando el código crece
  → Separar por dominio cuando hay múltiples contextos
  → Ejemplo: Extraer un servicio cuando el controlador supera 200 líneas

Fase 3: Escalable
  → Arquitectura completa con capas bien definidas
  → Solo cuando el sistema lo justifica
  → Ejemplo: Módulo de Compras con 8 servicios especializados
```

#### 2. Regla de las 3 Líneas

Si una operación requiere más de 3 líneas de lógica de negocio (validaciones, cálculos, transformaciones, scoping), debe ir en un servicio. Si no, puede permanecer en el controlador.

#### 3. Regla de los 3 Usos

Antes de crear un componente, hook o utilidad reutilizable, preguntar: ¿se usa en al menos 3 lugares diferentes? Si no, considerar mantenerlo inline o local al módulo.

#### 4. Regla de la Próxima Semana

Preguntar: "¿Necesito esta abstracción hoy o podría necesitarla la próxima semana?" Si la respuesta es "la próxima semana", no la implementes hoy. Espera a que realmente la necesites.

#### 5. Prioridades al Escribir Código

1. **Legibilidad** — El código debe ser claro para otros desarrolladores.
2. **Mantenibilidad** — Debe ser fácil de modificar sin romper otras partes.
3. **Simplicidad** — La solución más simple y directa suele ser la correcta.
4. **Reutilización** — Extraer lógica compartida solo cuando se usa en más de un lugar.
5. **Escalabilidad** — Preparar para crecimiento sin sobreingeniería.

### Lo que NO es Pragmatismo

| Esto NO es pragmatismo | Esto SÍ es pragmatismo |
|------------------------|------------------------|
| "No necesito validación, es un CRUD simple" | "Este CRUD es simple, lo dejo en el controlador sin capa de servicio" |
| "No documentamos, el código se explica solo" | "Documentamos lo necesario sin crear documentos innecesarios" |
| "No hacemos pruebas, total es un cambio pequeño" | "Probamos lo crítico, no cada getter/setter" |
| "Copio y pego este código, es más rápido" | "Refactorizo cuando veo el tercer uso del mismo patrón" |

---

## Consecuencias Positivas

1. **Código más legible**: Menos indirecciones y abstracciones innecesarias.

2. **Desarrollo más rápido**: Los cambios pequeños no requieren navegar múltiples capas de abstracción.

3. **Onboarding más fácil**: Nuevos desarrolladores pueden entender el flujo del código sin conocer patrones complejos.

4. **Deuda técnica controlada**: La deuda técnica por exceso de abstracción es tan costosa como la falta de ella. Este principio evita ambos extremos.

5. **Arquitectura que refleja la realidad**: La estructura del código refleja la complejidad real del dominio, no una complejidad arquitectónica impuesta.

---

## Riesgos

| Riesgo | Descripción | Mitigación |
|--------|-------------|------------|
| **Pragmatismo como excusa** | Desarrolladores usando el pragmatismo como excusa para no seguir buenas prácticas. | El pragmatismo no es pereza. Las reglas prácticas (3 líneas, 3 usos) son objetivas. |
| **Deuda técnica por omisión** | Acumular código simple que debería haberse refactorizado. | Revisiones de código periódicas. Refactorizar cuando un módulo alcanza los límites de tamaño. |
| **Inconsistencia entre módulos** | Módulos con diferentes niveles de abstracción. | La progresión natural permite diferentes niveles siempre que estén justificados por la complejidad del dominio. |

---

## Implementación Técnica

### Documentación

- **`.clinerules`**: Secciones 15 (Pragmatismo y Simplicidad), 17 (Arquitectura Evolutiva), 19 (Principio de Cambio Mínimo).
- **`docs/API_GUIDELINES.md`**: Sección 5.3 (Excepción: CRUD Simple).
- **`docs/STANDARDS.md`**: Ejemplos de cuándo abstraer y cuándo mantener simple.

### Ejemplos en el Código Base

- **Módulo de Compras** (Fase 3 — Escalable): 8 servicios especializados, controlador con auditoría. Justificado por la complejidad del dominio.
- **Módulo de Papelería** (Fase 2 — Modular): Servicio único con operaciones agrupadas por dominio. Justificado por ser un CRUD con lógica de inventario.
- **Catálogos simples** (Fase 1 — Simple): Operaciones directas en controlador. Justificado por ser operaciones triviales sin lógica de negocio.

---

## Referencias

- `.clinerules` v5.2 — Reglas Maestras del ERP KRAM (Secciones 15, 17, 19)
- `ADR-002` — Separación de Responsabilidades: Controllers vs Services
- `docs/API_GUIDELINES.md` — Guía de APIs REST (Sección 5.3)
- `docs/STANDARDS.md` — Estándares de código y patrones detallados

---

## Historial de Revisiones

| Versión | Fecha | Cambios | Autor |
|---------|-------|---------|-------|
| 1.0 | 24/06/2026 | Versión inicial. Definición del principio de pragmatismo sobre sobreingeniería con reglas prácticas. | Arquitectura — ERP KRAM |

---

> **Nota:** Este ADR es un documento oficial de arquitectura del ERP KRAM. Cualquier modificación a los principios definidos en este documento debe ser revisada por el equipo de arquitectura y reflejada en el `.clinerules` y la documentación asociada.
