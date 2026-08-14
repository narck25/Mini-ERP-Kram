# ADR-002: Separación de Responsabilidades — Controllers vs Services

| Campo | Valor |
|-------|-------|
| **Identificador** | ADR-002 |
| **Título** | Separación de responsabilidades entre Controllers y Services |
| **Estado** | Aprobado |
| **Fecha de aprobación** | 24 de junio de 2026 |
| **Versión** | 1.0 |
| **Autor** | Arquitectura — ERP KRAM |
| **Audiencia** | Arquitectos de software, desarrolladores backend, revisores de código |

---

## Contexto

El ERP KRAM fue construido inicialmente con una arquitectura donde los controladores de Express concentraban tanto la lógica de manejo de requests HTTP como la lógica de negocio y las consultas a la base de datos. A medida que el sistema creció en funcionalidad —agregando módulos de Empleados, Reclutamiento, Vacaciones, Incidencias, Compras, Papelería y Uniformes—, los controladores se volvieron difíciles de mantener, superando en algunos casos las 800 líneas de código.

Paralelamente, existía una contradicción en las reglas del sistema: por un lado se exigía que los controladores no contuvieran lógica de negocio ni consultas Prisma, pero por otro lado se permitía que los CRUD simples permanecieran en el controlador. Esta ambigüedad generaba inconsistencia entre módulos, donde algunos tenían servicios dedicados y otros operaban directamente desde el controlador.

---

## Problema

1. **Controladores monolíticos**: Algunos controladores superaban las 800 líneas, mezclando validación de requests, lógica de negocio, consultas Prisma y formateo de respuestas.

2. **Duplicidad de lógica**: Sin servicios especializados, la misma lógica de negocio (ej. cálculo de impuestos, scoping de datos, validación de estados) se replicaba en múltiples controladores.

3. **Contradicción normativa**: Las reglas del sistema decían "los controllers no deben tener lógica de negocio" pero también "los CRUD simples pueden permanecer en el controller", sin definir claramente el límite entre "simple" y "complejo".

4. **Dificultad de testing**: La lógica de negocio embebida en controladores no podía ser probada unitariamente sin levantar un servidor Express completo.

5. **Acoplamiento a Express**: La lógica de negocio dependía de objetos `req` y `res`, dificultando su reutilización en otros contextos (webhooks, tareas programadas, scripts).

---

## Alternativas Consideradas

### Alternativa 1: Controladores Monolíticos (Status Quo)

Mantener toda la lógica en los controladores, sin capa de servicios.

**Ventajas:**
- Sin abstracción adicional, código más directo.
- Menos archivos que navegar.
- Curva de aprendizaje mínima para nuevos desarrolladores.

**Desventajas:**
- Violación del Principio de Responsabilidad Única (SRP).
- Código no testeable unitariamente.
- Duplicación de lógica entre controladores.
- Dificultad de mantenimiento a medida que el sistema crece.
- Acoplamiento a Express.

**Decisión:** Rechazada. No escala con el crecimiento del sistema.

---

### Alternativa 2: Servicios Obligatorios para Todo

Exigir que toda operación de base de datos, incluso las más triviales, pase por una capa de servicio.

**Ventajas:**
- Consistencia total: todas las operaciones siguen el mismo patrón.
- Facilita el testing unitario de todas las operaciones.
- Preparado para crecimiento futuro sin refactors.

**Desventajas:**
- Sobrecarga de archivos para operaciones triviales (CRUD de catálogos simples).
- Abstracción prematura: crear un servicio para `GET /api/catalogos/estados` donde solo hay un `findMany` sin lógica.
- Mayor fricción para cambios pequeños.
- Violación del principio de simplicidad sobre sobreingeniería.

**Decisión:** Rechazada. Introduce sobreingeniería para casos triviales.

---

### Alternativa 3: Capa de Servicios con Excepción para CRUD Simple (DECISIÓN TOMADA)

Implementar una capa de servicios para toda la lógica de negocio, pero permitir que operaciones CRUD verdaderamente triviales (sin lógica de negocio, sin validaciones complejas, sin transformaciones) puedan ejecutarse directamente desde el controlador.

**Regla práctica:** Si la operación requiere más de 3 líneas de lógica (validaciones, cálculos, transformaciones, scoping), debe ir en un servicio.

**Ventajas:**
- Equilibrio entre consistencia y pragmatismo.
- Los servicios existen donde realmente aportan valor.
- Los CRUD simples no requieren archivos adicionales innecesarios.
- Regla clara y accionable para los desarrolladores.

**Desventajas:**
- Requiere criterio del desarrollador para determinar qué es "simple".
- Posible inconsistencia si diferentes desarrolladores interpretan la regla de forma distinta.
- Los CRUD simples en controladores no son testeables unitariamente (aunque rara vez necesitan pruebas).

**Decisión:** Aprobada. Es el equilibrio óptimo entre arquitectura limpia y pragmatismo.

---

## Decisión Tomada

Se establece una separación clara de responsabilidades entre Controllers y Services:

### Controller (Capa de Orquestación)

Responsabilidades:
- Validar la estructura del request (parámetros, body, headers).
- Extraer datos del request (`req.params`, `req.query`, `req.body`, `req.user`).
- Llamar al servicio correspondiente.
- Formatear la respuesta HTTP con el código y estructura adecuados.
- Manejar errores y devolver respuestas HTTP estandarizadas.

Prohibiciones:
- NO contiene lógica de negocio.
- NO realiza consultas Prisma directamente (excepto CRUD simple).
- NO implementa cálculos, transformaciones o validaciones de negocio.

### Service (Capa de Negocio)

Responsabilidades:
- Toda la lógica de negocio del dominio.
- Todas las consultas a la base de datos a través de Prisma.
- Validaciones de negocio (unicidad, reglas de estado, permisos de nivel B).
- Scoping de datos (filtros por departamento, jerarquía, propiedad).
- Transacciones que requieran atomicidad.
- Auditoría de operaciones críticas.

### Excepción: CRUD Simple

Se permite mantener operaciones CRUD verdaderamente triviales en el controlador cuando:
- La operación es un `findMany`, `findUnique`, `create`, `update` o `delete` directo.
- No requiere validaciones de negocio adicionales.
- No requiere transformaciones de datos.
- No requiere scoping de datos.
- No requiere transacciones.

```js
// ✅ ACEPTABLE: CRUD simple sin lógica de negocio
static async listCatalog(req, res) {
  try {
    const items = await prisma.catalog.findMany({ orderBy: { name: 'asc' } });
    res.json({ data: items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ❌ DEBE IR EN SERVICE: Tiene lógica de negocio
static async createRequest(req, res) {
  try {
    const { items, total } = req.body;
    const tax = total * 0.16; // Lógica de negocio
    const result = await prisma.purchase.create({
      data: { items, total: total + tax }
    });
    res.json({ data: result });
  } catch (error) { ... }
}
```

---

## Consecuencias Positivas

1. **Controladores delgados**: La mayoría de los controladores no superan las 150 líneas, limitándose a orquestar requests y respuestas.

2. **Servicios reutilizables**: La lógica de negocio en servicios puede ser invocada desde controladores, webhooks, tareas programadas o scripts.

3. **Testeabilidad**: Los servicios pueden probarse unitariamente sin necesidad de un servidor Express.

4. **Claridad arquitectónica**: Nuevos desarrolladores pueden identificar rápidamente dónde está cada tipo de lógica.

5. **Evolución gradual**: Los CRUD simples pueden migrarse a servicios cuando crecen en complejidad, sin cambios arquitectónicos mayores.

---

## Riesgos

| Riesgo | Descripción | Mitigación |
|--------|-------------|------------|
| **Interpretación subjetiva** | Diferentes desarrolladores pueden tener criterios distintos sobre qué constituye un "CRUD simple". | Regla práctica documentada (3 líneas de lógica). Revisiones de código. |
| **Servicios anémicos** | Crear servicios que solo delegan a Prisma sin agregar valor. | Evaluar si el servicio realmente encapsula lógica de negocio. Si no, considerar mantenerlo en el controlador. |
| **Controllers con lógica residual** | Que los controladores sigan acumulando lógica de negocio por descuido. | Revisiones de código obligatorias. Checklist de calidad. |

---

## Implementación Técnica

La implementación de esta decisión se refleja en los siguientes componentes:

### Backend

- **`backend/src/controllers/`**: Controladores delgados que solo orquestan requests.
- **`backend/src/services/`**: Servicios especializados por dominio con toda la lógica de negocio.
- **`backend/src/services/purchases/`**: Ejemplo de servicios especializados (8 servicios para el módulo de Compras).

### Documentación

- **`.clinerules`**: Secciones 3.1 (Separación de Capas), 15 (Pragmatismo y Simplicidad), 17 (Arquitectura Evolutiva).
- **`docs/API_GUIDELINES.md`**: Secciones 5 (Controladores Delgados) y 6 (Servicios Especializados).
- **`docs/STANDARDS.md`**: Ejemplos detallados de patrones de controladores y servicios.

---

## Referencias

- `.clinerules` v5.2 — Reglas Maestras del ERP KRAM (Secciones 3.1, 15, 17, 19)
- `docs/API_GUIDELINES.md` — Guía de APIs REST (Secciones 5, 6)
- `docs/STANDARDS.md` — Estándares de código y patrones detallados
- `backend/src/controllers/stationery.controller.js` — Ejemplo de controlador delgado (133 líneas)
- `backend/src/controllers/purchase.controller.js` — Ejemplo de controlador con auditoría

---

## Historial de Revisiones

| Versión | Fecha | Cambios | Autor |
|---------|-------|---------|-------|
| 1.0 | 24/06/2026 | Versión inicial. Definición de separación Controllers vs Services con excepción para CRUD simple. | Arquitectura — ERP KRAM |

---

> **Nota:** Este ADR es un documento oficial de arquitectura del ERP KRAM. Cualquier modificación a la separación de responsabilidades definida en este documento debe ser revisada por el equipo de arquitectura y reflejada en el `.clinerules` y la documentación asociada.
