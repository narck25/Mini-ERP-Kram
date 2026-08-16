# Manual de Organización — RH

> **Versión**: 1.0  
> **Fecha**: 24/06/2026  
> **Rol**: RH — Recursos Humanos  
> **Módulo**: EMPLEADOS

---

## 1. Objetivo

Gestionar la estructura organizacional de la empresa: departamentos, puestos de trabajo y jerarquías. RH puede crear, editar y eliminar departamentos y puestos, así como visualizar la jerarquía completa.

---

## 2. Alcance

| Funcionalidad | Descripción |
|---------------|-------------|
| Gestión de Departamentos | CRUD completo de departamentos |
| Gestión de Puestos | CRUD completo de puestos de trabajo |
| Jerarquía organizacional | Visualización de niveles jerárquicos |
| Asignación de puestos por departamento | Relación entre departamentos y puestos |

---

## 3. Flujo Funcional

```
Estructura Organizacional
    ├── Departamentos
    │   ├── Crear departamento
    │   ├── Editar departamento
    │   └── Eliminar departamento
    └── Puestos de Trabajo
        ├── Crear puesto
        ├── Editar puesto
        └── Eliminar puesto
```

---

## 4. Procedimientos Paso a Paso

### 4.1 Acceder a la Estructura Organizacional

1. Inicia sesión en el sistema
2. En el menú lateral, ve a **Mi Portal → Mi Equipo** o directamente a la ruta `/dashboard/organizacion`
3. Se mostrará la página con dos pestañas: **Departamentos** y **Puestos**

> **Captura pendiente**: Pantalla de estructura organizacional

### 4.2 Gestionar Departamentos

#### 4.2.1 Ver Departamentos

La pestaña **Departamentos** muestra una tabla con:
- Nombre del departamento
- Descripción
- Estado (Activo/Inactivo)
- Número de puestos asociados
- Acciones (Editar, Eliminar, Ver Puestos)

**Búsqueda**: Usa el campo de búsqueda para filtrar por nombre o descripción.

**Paginación**: 12 departamentos por página.

#### 4.2.2 Crear un Departamento

1. Haz clic en **+ Nuevo Departamento**
2. Completa el formulario:
   | Campo | Tipo | Requerido | Descripción |
   |-------|------|-----------|-------------|
   | Nombre | Texto | Sí | Nombre del departamento |
   | Descripción | Texto | No | Descripción del departamento |
   | Estado | Select | Sí | Activo o Inactivo |
3. Haz clic en **Guardar**
4. El departamento aparecerá en la lista

**Validaciones**:
- El nombre es obligatorio
- El nombre debe ser único en el sistema

> **Captura pendiente**: Formulario de nuevo departamento

#### 4.2.3 Editar un Departamento

1. En la tabla, haz clic en **Editar** del departamento deseado
2. Modifica los campos necesarios
3. Haz clic en **Guardar Cambios**

#### 4.2.4 Eliminar un Departamento

1. En la tabla, haz clic en **Eliminar** del departamento
2. Confirma la acción
3. **Importante**: No se puede eliminar un departamento que tenga empleados o puestos asociados

### 4.3 Gestionar Puestos de Trabajo

#### 4.3.1 Ver Puestos

La pestaña **Puestos** muestra una tabla con:
- Nombre del puesto
- Descripción
- Nivel jerárquico
- Departamento asociado
- Estado (Activo/Inactivo)
- Acciones (Editar, Eliminar)

**Búsqueda**: Filtra por nombre, descripción, departamento o nivel jerárquico.

**Niveles Jerárquicos disponibles**:
| Nivel | Descripción |
|-------|-------------|
| PRESIDENTE | Máximo nivel |
| DIRECTOR | Dirección |
| GERENTE | Gerencia |
| JEFE | Jefatura |
| COORDINADOR | Coordinación |
| ANALISTA | Análisis |
| SUPERVISOR | Supervisión |
| AUX_ADMINISTRATIVO | Auxiliar administrativo |
| OPERATIVO | Nivel operativo |

#### 4.3.2 Crear un Puesto

1. Haz clic en **+ Nuevo Puesto**
2. Completa el formulario:
   | Campo | Tipo | Requerido | Descripción |
   |-------|------|-----------|-------------|
   | Nombre | Texto | Sí | Nombre del puesto |
   | Descripción | Texto | No | Descripción del puesto |
   | Nivel Jerárquico | Select | Sí | Nivel en la jerarquía |
   | Departamento | Select | Sí | Departamento al que pertenece |
   | Estado | Select | Sí | Activo o Inactivo |
3. Haz clic en **Guardar**

**Validaciones**:
- Nombre: Obligatorio
- Nivel Jerárquico: Obligatorio
- Departamento: Obligatorio

> **Captura pendiente**: Formulario de nuevo puesto

#### 4.3.3 Editar un Puesto

1. En la tabla, haz clic en **Editar** del puesto deseado
2. Modifica los campos necesarios
3. Haz clic en **Guardar Cambios**

#### 4.3.4 Eliminar un Puesto

1. En la tabla, haz clic en **Eliminar** del puesto
2. Confirma la acción
3. **Importante**: No se puede eliminar un puesto que tenga empleados asignados

### 4.4 Ver Puestos por Departamento

1. En la pestaña de Departamentos, haz clic en **Ver Puestos** de un departamento
2. Se abrirá un modal con la lista de puestos de ese departamento
3. Desde el modal también puedes:
   - **Agregar nuevo puesto** al departamento
   - **Editar** puestos existentes
   - **Eliminar** puestos

---

## 5. Validaciones del Sistema

| Validación | Regla |
|------------|-------|
| Nombre de departamento único | No pueden existir dos departamentos con el mismo nombre |
| Eliminación de departamento | No permitida si tiene empleados o puestos asociados |
| Eliminación de puesto | No permitida si tiene empleados asignados |
| Nivel jerárquico | Debe ser uno de los 9 niveles definidos |
| Estado | Solo Activo o Inactivo |

---

## 6. Casos de Uso

### Caso 1: Reestructura organizacional
1. RH crea un nuevo departamento: "Innovación"
2. RH crea puestos para el departamento: "Analista de Innovación", "Coordinador de Innovación"
3. RH asigna niveles jerárquicos a cada puesto
4. Los empleados pueden ser reasignados al nuevo departamento

### Caso 2: Desactivar un departamento
1. El departamento "Legacy" ya no existe
2. RH cambia su estado a **Inactivo**
3. Los puestos y empleados asociados deben reasignarse primero

---

## 7. Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "El nombre ya existe" | Departamento duplicado | Usar un nombre diferente |
| "No se puede eliminar" | Tiene empleados o puestos asociados | Reasignar antes de eliminar |
| "Error al cargar datos" | Problema de conexión | Recargar la página |
| No aparece el departamento en el select | Departamento inactivo | Verificar estado del departamento |

---

## 8. Buenas Prácticas

1. **Mantener departamentos activos**: Solo desactivar departamentos que ya no operan
2. **Documentar descripciones**: Agregar descripciones claras a departamentos y puestos
3. **Jerarquía consistente**: Asignar niveles jerárquicos coherentes con la estructura real
4. **Revisar dependencias**: Antes de eliminar, verificar que no haya empleados o procesos asociados
5. **Actualizar periódicamente**: Mantener la estructura organizacional al día

---

## 9. Preguntas Frecuentes

**P: ¿Puedo cambiar el nivel jerárquico de un puesto existente?**
R: Sí, desde la edición del puesto puedes modificar el nivel jerárquico.

**P: ¿Qué pasa si elimino un departamento con empleados?**
R: El sistema no lo permitirá. Debes reasignar los empleados a otro departamento primero.

**P: ¿Los puestos inactivos se ven en los formularios?**
R: Depende del formulario. Generalmente solo se muestran puestos activos.

**P: ¿Puedo tener un puesto sin departamento?**
R: No, el departamento es obligatorio para crear un puesto.

---

## 10. Limitaciones Actuales

| Limitación | Descripción |
|------------|-------------|
| Sin organigrama visual | No hay representación gráfica de la jerarquía |
| Sin historial de cambios | No se registra quién modificó departamentos/puestos |
| Sin importación masiva | No se pueden cargar departamentos/puestos desde CSV |
| Sin permisos granulares | Cualquier usuario con EMPLEADOS puede gestionar la estructura |

---

## 11. Referencias

- **Estructura Organizacional**: `/dashboard/organizacion`
- **API Departamentos**: `GET /api/departments`, `POST /api/departments`, `PUT /api/departments/:id`, `DELETE /api/departments/:id`
- **API Puestos**: `GET /api/job-positions`, `POST /api/job-positions`, `PUT /api/job-positions/:id`, `DELETE /api/job-positions/:id`
- **Módulo documentado**: `docs/modules/EMPLEADOS.md`

---

*Documento generado el 24/06/2026 — ERP KRAM*
