# Manual de Uniformes — RH

> **Versión**: 1.0  
> **Fecha**: 24/06/2026  
> **Rol**: RH — Recursos Humanos  
> **Módulo**: EMPLEADOS

---

## 1. Objetivo

Consultar el historial de entregas de uniformes por empleado. RH puede visualizar las tallas registradas de cada empleado y el historial completo de entregas realizadas.

---

## 2. Alcance

| Funcionalidad | Descripción |
|---------------|-------------|
| Listado de empleados | Tabla con empleados y sus tallas registradas |
| Historial por empleado | Detalle de todas las entregas de uniformes realizadas |
| Consulta de tallas | Visualización de tallas de camisa, playera, pantalón y zapatos |

---

## 3. Flujo Funcional

```
Listado de empleados (con tallas)
    ↓
Seleccionar empleado
    ↓
Ver historial de entregas de uniformes
```

---

## 4. Procedimientos Paso a Paso

### 4.1 Acceder al Historial de Uniformes

1. Inicia sesión en el sistema
2. En el menú lateral, ve a **RH → Uniformes** o directamente a la ruta `/rh/uniformes`
3. Se mostrará la lista de empleados con sus tallas registradas

> **Captura pendiente**: Pantalla de historial de uniformes

### 4.2 Consultar Tallas de Empleados

La tabla principal muestra por cada empleado:

| Columna | Descripción |
|---------|-------------|
| **Clave** | Número de empleado |
| **Nombre** | Nombre completo |
| **Departamento** | Departamento al que pertenece |
| **Tallas** | Camisa, Pantalón, Playera, Zapatos (si están registradas) |

**Búsqueda**: Usa el campo de búsqueda para filtrar por nombre o clave de empleado.

### 4.3 Ver Historial de un Empleado

1. En la tabla, localiza al empleado deseado
2. Haz clic en **Ver historial**
3. Se abrirá la página de detalle del empleado con el historial de entregas de uniformes

**Ruta directa**: `/rh/uniformes/[id]`

> **Captura pendiente**: Historial de entregas por empleado

### 4.4 Registrar Tallas en el Perfil del Empleado

Las tallas se registran desde el perfil del empleado en la sección **Uniformes**:

1. Ve a `/rh/empleados/[id]`
2. Busca la sección **Uniformes**
3. Completa los campos:
   | Campo | Descripción |
   |-------|-------------|
   | Talla de camisa | Texto (ej: M, L, XL) |
   | Talla de playera | Texto |
   | Talla de pantalón | Texto (ej: 30, 32, 34) |
   | Talla de zapatos | Texto (ej: 25, 26, 27) |
4. Haz clic en **Guardar**

---

## 5. Validaciones del Sistema

| Validación | Regla |
|------------|-------|
| Visualización de historial | Requiere módulo EMPLEADOS |
| Edición de tallas | Solo ADMIN o RH |
| Búsqueda | Por nombre o clave de empleado |

---

## 6. Casos de Uso

### Caso 1: Consulta de tallas para pedido
1. RH necesita saber las tallas de uniforme de todos los empleados de producción
2. Accede a `/rh/uniformes`
3. Usa el buscador o revisa la tabla completa
4. Exporta o toma nota de las tallas necesarias

### Caso 2: Verificar entregas previas
1. Un empleado solicita un uniforme nuevo
2. RH revisa el historial en `/rh/uniformes/[id]`
3. Verifica cuándo fue la última entrega y qué artículos se entregaron

---

## 7. Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| No aparecen tallas | Empleado sin tallas registradas | Registrar tallas desde el perfil |
| No se ve el historial | Empleado sin entregas previas | Es normal si es primera vez |
| Error al cargar empleados | Problema de conexión | Recargar la página |

---

## 8. Buenas Prácticas

1. **Mantener tallas actualizadas**: Registrar las tallas de cada empleado al momento de su alta
2. **Documentar entregas**: Cada entrega de uniforme debe quedar registrada en el sistema
3. **Revisar periodicamente**: Verificar que todos los empleados tengan tallas registradas

---

## 9. Preguntas Frecuentes

**P: ¿Puedo registrar una entrega de uniforme desde aquí?**
R: No, las entregas las registra el departamento de Compras desde su panel de uniformes.

**P: ¿Qué hago si un empleado no tiene tallas registradas?**
R: Debes registrar las tallas desde el perfil del empleado (sección Uniformes).

**P: ¿Puedo ver el historial de todos los empleados?**
R: Sí, desde la lista principal puedes acceder al historial de cada empleado.

---

## 10. Limitaciones Actuales

| Limitación | Descripción |
|------------|-------------|
| Solo consulta | RH no puede registrar entregas directamente |
| Sin exportación | No hay botón para exportar el listado de tallas |
| Sin alertas | No notifica cuando un empleado no tiene tallas registradas |

---

## 11. Referencias

- **Historial de Uniformes**: `/rh/uniformes`
- **Historial por empleado**: `/rh/uniformes/[id]`
- **Perfil de empleado**: `/rh/empleados/[id]`
- **Módulo documentado**: `docs/modules/EMPLEADOS.md`

---

*Documento generado el 24/06/2026 — ERP KRAM*
