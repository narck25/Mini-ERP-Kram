# Manual de Uniformes — Compras

> **Versión**: 1.0  
> **Fecha**: 24/06/2026  
> **Rol**: COMPRAS — Departamento de Compras  
> **Módulo**: COMPRAS

---

## 1. Objetivo

Administrar las entregas de uniformes a los empleados. El departamento de Compras puede registrar nuevas entregas, consultar el historial por empleado y gestionar el inventario de uniformes.

---

## 2. Alcance

| Funcionalidad | Descripción |
|---------------|-------------|
| Registro de entregas | Crear nuevas entregas de uniformes para empleados |
| Listado de entregas | Tabla con todas las entregas registradas |
| Historial por empleado | Consulta de entregas previas |
| Gestión de inventario | Visualización del inventario disponible (ruta separada) |

---

## 3. Flujo Funcional

```
Seleccionar empleado
    ↓
Registrar entrega de uniformes
    ├── Tipo de prenda (CAMISA, PLAYERA, PANTALON, ZAPATOS, CHALECO, etc.)
    ├── Talla
    ├── Género
    └── Cantidad
    ↓
Confirmar entrega
    ↓
Historial actualizado
```

---

## 4. Procedimientos Paso a Paso

### 4.1 Acceder a la Gestión de Uniformes

1. Inicia sesión en el sistema
2. En el menú lateral, ve a **Compras → Uniformes** o directamente a la ruta `/dashboard/compras/uniformes`
3. Se mostrará el panel de gestión de uniformes

> **Captura pendiente**: Panel de gestión de uniformes

### 4.2 Registrar una Nueva Entrega de Uniforme

1. Haz clic en **+ Nueva Entrega**
2. Se abrirá un modal con el formulario de registro
3. Completa los campos:

**Datos del empleado**:
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| Empleado | Select | Sí | Selecciona el empleado de la lista |

**Artículos a entregar** (puedes agregar múltiples):
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| Tipo de prenda | Select | Sí | CAMISA, PLAYERA, PANTALON, ZAPATOS, CHALECO, SUETER, GORRA, MANDIL, OVEROL, OTRO |
| Talla | Texto | Sí | Talla de la prenda |
| Género | Select | Sí | HOMBRE, MUJER, UNISEX |
| Cantidad | Número | Sí | Número de piezas (mínimo 1) |

**Observaciones**:
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| Observaciones | Texto | No | Notas adicionales sobre la entrega |

4. Para agregar más artículos, haz clic en **+ Agregar artículo**
5. Para eliminar un artículo, haz clic en **Eliminar** (debe haber al menos 1 artículo)
6. Haz clic en **Registrar Entrega**
7. La entrega quedará registrada y aparecerá en el listado

**Validaciones**:
- Debes seleccionar un empleado
- Cada artículo debe tener tipo, talla, género y cantidad
- La cantidad debe ser ≥ 1

> **Captura pendiente**: Modal de registro de entrega

### 4.3 Consultar el Listado de Entregas

La tabla principal muestra todas las entregas registradas con:

| Columna | Descripción |
|---------|-------------|
| **Empleado** | Nombre del empleado que recibió |
| **Artículos** | Lista de prendas entregadas |
| **Fecha** | Fecha de la entrega |
| **Observaciones** | Notas adicionales |

### 4.4 Ver Detalle de una Entrega

1. En la tabla, haz clic en el registro de entrega deseado
2. Se mostrará el detalle completo con todos los artículos entregados

### 4.5 Acceder al Inventario

1. Haz clic en **Inventario**
2. Se abrirá la página de inventario de uniformes
3. **Ruta directa**: `/dashboard/compras/uniformes/inventario`

> **Captura pendiente**: Pantalla de inventario de uniformes

---

## 5. Validaciones del Sistema

| Validación | Regla |
|------------|-------|
| Selección de empleado | Obligatorio |
| Artículos por entrega | Al menos 1 |
| Tipo de prenda | Debe ser uno de los tipos definidos |
| Cantidad | Debe ser ≥ 1 |
| Talla | Texto obligatorio |
| Género | HOMBRE, MUJER o UNISEX |

---

## 6. Casos de Uso

### Caso 1: Entrega de uniforme a nuevo empleado
1. Se contrata un nuevo empleado
2. RH registra las tallas en el perfil del empleado
3. Compras accede a `/dashboard/compras/uniformes`
4. Selecciona al empleado y registra la entrega:
   - 2 CAMISA talla M (HOMBRE)
   - 2 PANTALON talla 32 (HOMBRE)
   - 1 PAR ZAPATOS talla 26 (HOMBRE)
5. Confirma la entrega

### Caso 2: Reposición de uniformes
1. Un empleado solicita reposición de playeras
2. Compras verifica el historial de entregas previas
3. Registra nueva entrega: 3 PLAYERA talla L (HOMBRE)

---

## 7. Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| No encuentro al empleado | Empleado no registrado o inactivo | Verificar en RH que el empleado exista |
| Error al registrar entrega | Campos incompletos | Revisar que todos los campos requeridos estén llenos |
| No puedo eliminar un artículo | Solo hay 1 artículo | Debe haber al menos 1 artículo por entrega |

---

## 8. Buenas Prácticas

1. **Verificar tallas**: Consulta las tallas registradas del empleado antes de hacer la entrega
2. **Documentar observaciones**: Agrega notas relevantes (ej: "Entrega completa", "Pendiente chamarra")
3. **Registrar inmediatamente**: Registrar la entrega en el sistema tan pronto como se realice
4. **Revisar inventario**: Antes de registrar, verifica que haya existencias en inventario

---

## 9. Preguntas Frecuentes

**P: ¿Puedo editar una entrega después de registrarla?**
R: Actualmente no hay opción de edición. Si hay un error, contacta al administrador.

**P: ¿Puedo eliminar una entrega?**
R: No hay eliminación física. Los registros son permanentes.

**P: ¿Qué tipos de prenda están disponibles?**
R: CAMISA, PLAYERA, PANTALON, ZAPATOS, CHALECO, SUETER, GORRA, MANDIL, OVEROL, OTRO.

**P: ¿Puedo registrar una entrega para varios empleados a la vez?**
R: No, cada entrega es para un solo empleado. Debes registrar una por una.

---

## 10. Limitaciones Actuales

| Limitación | Descripción |
|------------|-------------|
| Sin edición de entregas | No se pueden modificar entregas registradas |
| Sin eliminación | Los registros de entrega son permanentes |
| Sin control de tallas | No valida que la talla exista en inventario |
| Sin notificaciones | No se notifica a RH cuando se registra una entrega |

---

## 11. Referencias

- **Gestión de Uniformes**: `/dashboard/compras/uniformes`
- **Inventario**: `/dashboard/compras/uniformes/inventario`
- **Historial RH**: `/rh/uniformes`
- **Módulo documentado**: `docs/modules/COMPRAS.md`

---

*Documento generado el 24/06/2026 — ERP KRAM*
