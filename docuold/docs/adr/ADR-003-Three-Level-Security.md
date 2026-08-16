# ADR-003: Modelo de Seguridad de 3 Niveles

| Campo | Valor |
|-------|-------|
| **Identificador** | ADR-003 |
| **Título** | Modelo de autorización de 3 niveles (A/B/C) |
| **Estado** | Aprobado |
| **Fecha de aprobación** | 24 de junio de 2026 |
| **Versión** | 1.0 |
| **Autor** | Arquitectura — ERP KRAM |
| **Audiencia** | Arquitectos de software, desarrolladores full-stack, administradores de seguridad |

---

## Contexto

El ERP KRAM maneja información sensible de empleados, reclutamiento, compras y configuración del sistema. Desde sus inicios, el sistema implementó un modelo de autorización donde los permisos de acceso a módulos se asignaban mediante un array configurable por usuario (`accessibleModules`), independientemente del rol del usuario.

Sin embargo, a medida que el sistema creció, se identificaron tres tipos distintos de decisiones de autorización que no podían ser resueltas por un solo mecanismo:

1. **¿Qué módulos puede ver este usuario?** — Control de acceso a nivel de funcionalidad.
2. **¿Qué datos específicos puede ver este usuario dentro de un módulo?** — Visibilidad de datos según jerarquía organizacional.
3. **¿Puede este usuario realizar operaciones críticas del sistema?** — Operaciones que afectan la integridad del sistema.

Inicialmente, estos tres niveles se manejaban de manera inconsistente: algunas validaciones usaban `accessibleModules`, otras usaban `user.role`, y otras simplemente no existían, permitiendo que cualquier usuario con acceso a un módulo viera todos los datos del mismo.

---

## Problema

1. **Mecanismo único insuficiente**: El array `accessibleModules` resolvía el nivel de acceso a módulos, pero no podía determinar qué datos específicos debía ver un usuario (ej. un gerente solo ve empleados de su departamento).

2. **Hardcodeo de roles**: Para compensar las limitaciones de `accessibleModules`, los desarrolladores comenzaron a hardcodear validaciones como `user.role === 'SISTEMAS'` para controlar acceso a datos, mezclando lógica de módulos con lógica de visibilidad.

3. **Inexistencia de control de operaciones críticas**: No existía un mecanismo para restringir operaciones como modificar permisos de usuarios, eliminar registros o acceder a estadísticas del sistema. Cualquier usuario con acceso al módulo de Configuración podía realizar estas operaciones.

4. **Dificultad de auditoría**: Sin una separación clara de niveles, era imposible auditar de manera consistente quién accedió a qué y por qué.

5. **Mezcla de responsabilidades**: El mismo fragmento de código mezclaba validaciones de módulo, visibilidad de datos y control de operaciones críticas, dificultando el mantenimiento.

---

## Alternativas Consideradas

### Alternativa 1: RBAC Tradicional (Role-Based Access Control)

Implementar un modelo RBAC donde cada rol tenga permisos predefinidos para cada operación posible en el sistema.

**Ventajas:**
- Modelo ampliamente conocido y documentado.
- Control granular sobre cada operación.
- Fácil de auditar: cada permiso está asociado a un rol.

**Desventajas:**
- Extremadamente rígido: cualquier nuevo permiso requiere actualizar la definición del rol.
- No resuelve el scoping de datos (un gerente y un empleado pueden tener el mismo rol pero ver datos distintos).
- Requiere una matriz de permisos enorme para cubrir todas las operaciones del sistema.
- No escala con la cantidad de módulos y operaciones.

**Decisión:** Rechazada. No resuelve el problema de scoping de datos y es demasiado rígido para un sistema en crecimiento.

---

### Alternativa 2: ACL Plano (Access Control List)

Mantener un solo mecanismo de permisos (accessibleModules) y agregar lógica ad-hoc en cada servicio para el scoping de datos y operaciones críticas.

**Ventajas:**
- Simplicidad conceptual: un solo mecanismo.
- Flexibilidad: cada servicio implementa su propia lógica de scoping.
- No requiere cambios arquitectónicos.

**Desventajas:**
- Duplicación de lógica de scoping en cada servicio.
- Inconsistencia: cada desarrollador implementa el scoping de forma diferente.
- Las operaciones críticas no tienen un mecanismo de protección uniforme.
- Dificultad de auditoría y mantenimiento.

**Decisión:** Rechazada. No resuelve los problemas de consistencia y mantenibilidad.

---

### Alternativa 3: Modelo de 3 Niveles (A/B/C) con Bypass Estratégico (DECISIÓN TOMADA)

Implementar tres niveles de autorización claramente diferenciados, cada uno con su propio mecanismo y propósito:

| Nivel | Mecanismo | Propósito |
|-------|-----------|-----------|
| **A — Módulos** | `accessibleModules` + bypass ADMIN/RH | ¿Qué módulos puede ver? |
| **B — Scoping** | Lógica de negocio (departamento, jerarquía) + bypass ADMIN/RH | ¿Qué datos específicos ve? |
| **C — Críticas** | `requireRole(['ADMIN'])` | ¿Puede hacer operaciones del sistema? |

**Ventajas:**
- Separación clara de responsabilidades: cada nivel tiene su propio mecanismo.
- Scoping de datos flexible: se implementa según la lógica de negocio de cada dominio.
- Operaciones críticas protegidas por un mecanismo explícito y restrictivo.
- Bypass estratégico para ADMIN y RH sin romper el modelo.
- Escalable: agregar nuevos módulos o roles no requiere modificar los mecanismos de autorización.

**Desventajas:**
- Requiere que los desarrolladores conozcan los tres niveles y cuándo usar cada uno.
- Mayor complejidad inicial que un modelo plano.
- Riesgo de aplicar el nivel incorrecto en una validación.

**Decisión:** Aprobada. Es el modelo que mejor equilibra seguridad, flexibilidad y escalabilidad.

---

## Decisión Tomada

Se establece el **Modelo de Seguridad de 3 Niveles (A/B/C)** como el mecanismo de autorización oficial del ERP KRAM:

### Nivel A — Control de Acceso a Módulos

**Propósito:** Determinar qué módulos del sistema puede ver y usar un usuario.

**Mecanismo:** Array `accessibleModules` en el objeto de usuario, combinado con bypass para ADMIN y RH.

**Implementación:**
- Frontend: `user.accessibleModules?.includes('MODULO')` para mostrar/ocultar secciones.
- Backend: Middleware `requireModule('MODULO')` para proteger endpoints.
- Bypass: ADMIN y RH no necesitan tener módulos asignados; tienen acceso completo.

**Ejemplo:**
```js
// Frontend: Sidebar
{user.accessibleModules?.includes('COMPRAS') && (
  <MenuItem href="/dashboard/compras" label="Compras" />
)}

// Backend: Ruta protegida
router.post('/purchases', verifyToken, requireModule('COMPRAS'), PurchaseController.create);
```

### Nivel B — Scoping de Datos / Visibilidad

**Propósito:** Determinar qué datos específicos puede ver un usuario dentro de un módulo.

**Mecanismo:** Lógica de negocio en servicios, basada en atributos del empleado asociado (departamento, nivel jerárquico, propiedad del recurso).

**Implementación:**
- Se implementa en los servicios, no en los controladores.
- Usa atributos del empleado (`employeeId`, `nivelJerarquico`, `departamento_id`).
- Bypass: ADMIN y RH ven todos los datos sin filtros.

**Ejemplo:**
```js
// Service: Scoping de datos
static async list(filters, user) {
  const where = {};

  if (user.role !== 'ADMIN' && user.role !== 'RH') {
    const employee = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (employee?.nivelJerarquico === 'GERENTE') {
      where.departamento_id = employee.departamento_id;
    } else {
      where.solicitanteId = employee.id;
    }
  }

  return await prisma.vacancy.findMany({ where });
}
```

### Nivel C — Operaciones Críticas del Sistema

**Propósito:** Restringir operaciones que afectan la integridad, seguridad o configuración del sistema.

**Mecanismo:** Middleware `requireRole(['ADMIN'])` o validación inline `req.user.role !== 'ADMIN'`.

**Implementación:**
- Solo ADMIN tiene acceso a operaciones de Nivel C.
- RH NO tiene bypass en Nivel C.
- Se usa exclusivamente para: modificar permisos de usuarios, eliminar usuarios, estadísticas del sistema, seed/reset de BD.

**Ejemplo:**
```js
// Backend: Solo ADMIN
router.post('/seed/reset', verifyToken, requireRole(['ADMIN']), SeedController.reset);

// O inline
if (req.user.role !== 'ADMIN') {
  return res.status(403).json({ error: 'Solo ADMIN puede realizar esta operación' });
}
```

### Bypass de Roles Estratégicos

| Nivel | ADMIN | RH |
|-------|-------|-----|
| **A — Módulos** | ✅ Bypass total | ✅ Bypass total |
| **B — Scoping** | ✅ Bypass total | ✅ Bypass total |
| **C — Críticas** | ✅ Acceso completo | ❌ Sin acceso |

---

## Consecuencias Positivas

1. **Claridad conceptual**: Cada nivel de autorización tiene un propósito, mecanismo y ámbito claramente definidos.

2. **Consistencia en el código**: Todos los desarrolladores siguen el mismo patrón para cada tipo de validación.

3. **Escalabilidad**: Agregar nuevos módulos o roles no requiere modificar los mecanismos de autorización existentes.

4. **Seguridad por capas**: Un usuario malintencionado necesita vulnerar tres mecanismos distintos para causar daño significativo.

5. **Auditabilidad**: Cada nivel puede auditarse de forma independiente.

6. **Flexibilidad organizacional**: El modelo se adapta a estructuras jerárquicas complejas sin modificar código de autorización.

---

## Riesgos

| Riesgo | Descripción | Mitigación |
|--------|-------------|------------|
| **Confusión de niveles** | Desarrolladores aplicando el nivel incorrecto (ej. usar Nivel C para scoping de datos). | Documentación clara, revisiones de código, ejemplos en STANDARDS.md. |
| **Bypass excesivo** | Extender el bypass de ADMIN/RH a otros roles sin autorización. | Política explícita: solo Presidencia puede autorizar nuevos roles estratégicos. |
| **Scoping insuficiente** | Olvidar implementar scoping de datos en un nuevo endpoint, exponiendo datos sensibles. | Checklist de seguridad obligatorio para nuevos endpoints. |
| **Nivel C ausente** | No proteger una operación crítica con requireRole(['ADMIN']). | Auditoría periódica de endpoints críticos. |

---

## Implementación Técnica

### Backend

- **`backend/src/middlewares/auth.middleware.js`**: Implementa `requireModule()` (Nivel A) y `requireRole()` (Nivel C) con bypass para ADMIN/RH.
- **`backend/src/services/`**: Cada servicio implementa scoping de datos (Nivel B) según la lógica de negocio del dominio.
- **`backend/src/config/modules.config.js`**: Fuente de verdad de módulos (Nivel A).
- **`backend/src/config/roles.config.js`**: Presets de módulos por rol (Nivel A).

### Frontend

- **`frontend/components/DashboardLayout.js`**: Sidebar con filtrado por `accessibleModules` (Nivel A).
- **`frontend/components/ProtectedRoute.js`**: Componente para proteger rutas del frontend (Nivel A).
- **`frontend/lib/rolesConfig.js`**: Fallback visual (Nivel A).

### Documentación

- **`.clinerules`**: Sección 5 (Modelo de Seguridad) con la estrategia de 3 niveles.
- **`docs/MODELO_SEGURIDAD_KRAM.md`**: Documento ejecutivo del modelo de seguridad.
- **`docs/MATRIZ_DE_PERMISOS.md`**: Matriz completa de permisos por módulo y rol.
- **`docs/API_GUIDELINES.md`**: Sección 6 (Servicios) con ejemplos de scoping de datos.

---

## Referencias

- `.clinerules` v5.2 — Reglas Maestras del ERP KRAM (Sección 5: Modelo de Seguridad)
- `ADR-001` — Roles Estratégicos en el ERP KRAM
- `docs/MODELO_SEGURIDAD_KRAM.md` — Modelo de Seguridad del ERP KRAM
- `docs/MATRIZ_DE_PERMISOS.md` — Matriz de Permisos del ERP KRAM
- `docs/API_GUIDELINES.md` — Guía de APIs REST (Sección 6)

---

## Historial de Revisiones

| Versión | Fecha | Cambios | Autor |
|---------|-------|---------|-------|
| 1.0 | 24/06/2026 | Versión inicial. Definición del modelo de seguridad de 3 niveles (A/B/C) con bypass estratégico. | Arquitectura — ERP KRAM |

---

> **Nota:** Este ADR es un documento oficial de arquitectura del ERP KRAM. Cualquier modificación al modelo de seguridad definido en este documento debe ser revisada por el equipo de arquitectura y reflejada en el `.clinerules` y la documentación asociada.
