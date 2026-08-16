# Estrategia de Pruebas — ERP KRAM

> **Documento de Testing**
> *Generado: 24/06/2026*
> *Última actualización: 24/06/2026*
> *Versión: 1.0*

---

## 1. FILOSOFÍA DE TESTING

### Principios Rectores

| Principio | Descripción |
|-----------|-------------|
| **Calidad sobre velocidad** | La calidad del software tiene prioridad sobre la velocidad de entrega. Un bug en producción cuesta más que una prueba exhaustiva en desarrollo. |
| **Probar antes de commit** | Todo cambio debe ser probado antes de integrarse al repositorio. No hacer commit de código sin verificar. |
| **Evitar regresiones** | Cada cambio debe validar que no rompe funcionalidades existentes. Las regresiones son inaceptables. |
| **Documentar lo crítico** | Los flujos de negocio críticos deben tener casos de prueba documentados y repetibles. |
| **Automatizar lo repetitivo** | Las pruebas manuales repetitivas deben priorizarse para automatización futura. |

### Reglas de Oro

1. **No confiar en que "funciona"** — Probar explícitamente cada cambio.
2. **Probar en el entorno correcto** — No asumir que el entorno de desarrollo es idéntico a producción.
3. **Documentar bugs encontrados** — Si encuentras un bug, documéntalo antes de corregirlo.
4. **Probar permisos** — Cada nuevo endpoint debe probarse con y sin permisos adecuados.
5. **Probar errores** — Los mensajes de error deben ser claros y localizados (español).

---

## 2. TIPOS DE PRUEBAS

### 2.1 Pruebas Unitarias

**Alcance:** Servicios y utilidades del backend.

| Elemento | Qué probar | Herramienta sugerida |
|----------|------------|---------------------|
| Servicios | Lógica de negocio, validaciones, cálculos | Jest |
| Utilidades | Funciones helper, formateo de fechas, DTOs | Jest |
| Middlewares | Validación de tokens, permisos, módulos | Jest + Supertest |

**Ejemplo de prueba unitaria (servicio):**

```js
// tests/unit/stationery.service.test.js
const StationeryService = require('../../src/services/purchases/stationery.service');

describe('StationeryService.calculateTotal', () => {
  it('debe calcular el total correctamente con items', () => {
    const items = [
      { quantity: 2, unitPrice: 50 },
      { quantity: 3, unitPrice: 30 }
    ];
    const total = StationeryService.calculateTotal(items);
    expect(total).toBe(190); // (2*50) + (3*30)
  });

  it('debe retornar 0 si no hay items', () => {
    const total = StationeryService.calculateTotal([]);
    expect(total).toBe(0);
  });
});
```

### 2.2 Pruebas de Integración

**Alcance:** Endpoints y flujos completos del backend.

| Elemento | Qué probar | Herramienta sugerida |
|----------|------------|---------------------|
| Endpoints REST | Respuestas HTTP, códigos de estado, estructura JSON | Supertest + Jest |
| Flujos completos | Creación → Lectura → Actualización → Eliminación | Supertest + Jest |
| Autenticación | Login, token válido, token expirado, sin token | Supertest + Jest |
| Permisos | Acceso con y sin módulos, roles ADMIN/RH vs otros | Supertest + Jest |

**Ejemplo de prueba de integración (endpoint):**

```js
// tests/integration/stationery.routes.test.js
const request = require('supertest');
const app = require('../../src/index');

describe('POST /api/stationery/requests', () => {
  let token;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@kram.com', password: 'admin123' });
    token = login.body.token;
  });

  it('debe crear una solicitud de papelería', async () => {
    const res = await request(app)
      .post('/api/stationery/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ product: 'Hojas carta', quantity: 10 }],
        departmentId: 'dept-1'
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
  });

  it('debe rechazar solicitud sin token', async () => {
    const res = await request(app)
      .post('/api/stationery/requests')
      .send({ items: [] });
    expect(res.status).toBe(401);
  });

  it('debe rechazar solicitud sin permisos', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'basico@kram.com', password: 'basico123' });
    const basicToken = login.body.token;

    const res = await request(app)
      .post('/api/stationery/requests')
      .set('Authorization', `Bearer ${basicToken}`)
      .send({ items: [{ product: 'Hojas carta', quantity: 10 }] });
    expect(res.status).toBe(403);
  });
});
```

### 2.3 Pruebas de Frontend

**Alcance:** Componentes, hooks y páginas de React.

| Elemento | Qué probar | Herramienta sugerida |
|----------|------------|---------------------|
| Componentes | Renderizado, estados (loading, error, vacío, datos) | Jest + React Testing Library |
| Hooks | Lógica de estado, llamadas API, manejo de errores | Jest + React Hooks Testing Library |
| Páginas | Integración de componentes, navegación, permisos | Jest + React Testing Library |
| Formularios | Validación de campos, envío, errores de servidor | Jest + React Testing Library |

**Ejemplo de prueba de componente:**

```jsx
// tests/frontend/EntityTable.test.jsx
import { render, screen } from '@testing-library/react';
import EntityTable from '@/components/EntityTable';

describe('EntityTable', () => {
  it('debe mostrar "Cargando..." mientras carga', () => {
    render(<EntityTable entities={[]} loading={true} error={null} />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('debe mostrar mensaje de error', () => {
    render(<EntityTable entities={[]} loading={false} error='Error de red' />);
    expect(screen.getByText(/Error/)).toBeInTheDocument();
  });

  it('debe mostrar tabla con datos', () => {
    const entities = [
      { id: '1', name: 'Entity 1', status: 'active' },
      { id: '2', name: 'Entity 2', status: 'inactive' }
    ];
    render(<EntityTable entities={entities} loading={false} error={null} />);
    expect(screen.getByText('Entity 1')).toBeInTheDocument();
    expect(screen.getByText('Entity 2')).toBeInTheDocument();
  });

  it('debe mostrar "Sin datos" cuando no hay entidades', () => {
    render(<EntityTable entities={[]} loading={false} error={null} />);
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
  });
});
```

### 2.4 Pruebas Manuales

**Alcance:** Flujos críticos del negocio que requieren validación visual o contextual.

| Flujo | Qué validar | Frecuencia |
|-------|-------------|------------|
| Login | Redirección, persistencia de sesión, cierre de sesión | Cada cambio en auth |
| Creación de empleados | Formulario completo, validaciones, guardado | Cada cambio en empleados |
| Solicitud de compras | Flujo completo: crear → autorizar → recibir | Cada cambio en compras |
| Asignación de permisos | UI de accesos, persistencia, reflejo inmediato | Cada cambio en accesos |
| Reportes | Generación, filtros, exportación | Cada cambio en reportes |

---

## 3. FLUJOS CRÍTICOS OBLIGATORIOS

Los siguientes flujos **DEBEN** probarse manualmente antes de cada commit que los afecte:

### 3.1 Empleados

```
[ ] Crear empleado con todos los campos
[ ] Editar empleado
[ ] Desactivar empleado (borrado lógico)
[ ] Buscar empleados por nombre/departamento
[ ] Ver expediente completo
[ ] Validar que campos calculados (edad, antigüedad) se muestren correctamente
```

### 3.2 Reclutamiento

```
[ ] Crear vacante
[ ] Publicar/cerrar vacante
[ ] Registrar candidato
[ ] Avanzar candidato en proceso (etapas)
[ ] Asignar entrevista técnica
[ ] Contratar candidato (conversión a empleado)
[ ] Validar scoping: un jefe solo ve sus vacantes
```

### 3.3 Compras

```
[ ] Crear solicitud de compra
[ ] Agregar/quitar items
[ ] Enviar a autorización
[ ] Autorizar/rechazar solicitud (como autorizador)
[ ] Ver historial de autorizaciones
[ ] Recibir orden de compra
[ ] Validar notificaciones por email
```

### 3.4 Accesos y Permisos

```
[ ] Asignar módulos a un usuario
[ ] Quitar módulos a un usuario
[ ] Verificar que los cambios se reflejan inmediatamente
[ ] Verificar que ADMIN/RH tienen bypass
[ ] Verificar que solo ADMIN puede modificar roles (Nivel C)
[ ] Validar que un usuario sin módulo no ve la opción en el menú
```

### 3.5 Autenticación

```
[ ] Login con credenciales válidas
[ ] Login con credenciales inválidas (mensaje de error)
[ ] Redirección a login si no hay token
[ ] Cierre de sesión
[ ] Persistencia de sesión al recargar página
[ ] Token expirado redirige a login
```

### 3.6 Papelería

```
[ ] Crear solicitud de papelería
[ ] Ver solicitudes pendientes
[ ] Aprobar/rechazar solicitud de papelería
[ ] Ver inventario de papelería
[ ] Registrar salida de inventario
```

### 3.7 Uniformes

```
[ ] Crear solicitud de uniforme
[ ] Registrar entrega de uniforme
[ ] Ver historial de entregas por empleado
[ ] Ver inventario de uniformes
[ ] Registrar entrada/salida de inventario
```

---

## 4. CHECKLIST ANTES DE COMMIT

Antes de hacer commit de cualquier cambio, verificar:

| # | Verificación | Comando/Acción |
|---|-------------|----------------|
| ✓ | **Build frontend** | `npm run build` en `frontend/` — Sin errores |
| ✓ | **Build backend** | `npm run build` en `backend/` — Sin errores |
| ✓ | **Consola del navegador** | Revisar que no haya errores en la consola (F12) |
| ✓ | **Permisos** | Verificar que los cambios no rompan el modelo de permisos |
| ✓ | **Flujo afectado** | Probar manualmente el flujo que se modificó |
| ✓ | **Errores de Prisma** | Revisar que no haya errores de schema o consultas Prisma |
| ✓ | **Migraciones** | Si hay cambios en `schema.prisma`, verificar que las migraciones se generaron correctamente |
| ✓ | **Regresiones** | Probar que funcionalidades relacionadas no se rompieron |
| ✓ | **Código huérfano** | No dejar console.log, comentarios grandes o código sin usar |
| ✓ | **Documentación** | Actualizar `.clinerules` o `docs/` si el cambio lo requiere |

### Comandos de verificación rápida

```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && npm run build

# Prisma (si hay cambios en schema)
cd backend && npx prisma generate
```

---

## 5. ESTRATEGIA DE REGRESIÓN

### 5.1 Definición

Una **regresión** ocurre cuando un cambio en el código rompe una funcionalidad que antes funcionaba correctamente.

### 5.2 Estrategia

| Nivel | Estrategia | Responsable |
|-------|------------|-------------|
| **Inmediata** | Probar el flujo afectado + flujos relacionados antes del commit | Desarrollador |
| **Local** | Probar flujos críticos (sección 3) después de cambios mayores | Desarrollador |
| **Pre-merge** | Ejecutar suite de pruebas automatizadas (cuando existan) | CI/CD |
| **Post-deploy** | Validación en producción de flujos críticos | QA / RH |

### 5.3 Matriz de Impacto

| Cambio realizado | Flujos a probar |
|-----------------|-----------------|
| Cambio en `auth.middleware.js` | Login, permisos, rutas protegidas |
| Cambio en `schema.prisma` | Todos los flujos que usen el modelo modificado |
| Cambio en `api.js` (frontend) | Todas las páginas que consuman los endpoints modificados |
| Cambio en `DashboardLayout.js` | Todas las páginas del dashboard |
| Nuevo módulo | Flujo completo del nuevo módulo + verificar que no rompe menús |
| Cambio en permisos | Accesos, login, visibilidad de menús |

### 5.4 Procedimiento ante Regresión

```
1. Detectar la regresión
2. Identificar el commit que la introdujo (git bisect)
3. Corregir el problema
4. Agregar prueba que prevenga la regresión
5. Verificar que la corrección no introduce nuevas regresiones
```

---

## 6. BUENAS PRÁCTICAS

### 6.1 Generales

- **Probar en el entorno más parecido a producción** posible.
- **No asumir datos existentes** — Las pruebas deben crear sus propios datos.
- **Limpiar datos de prueba** después de cada ejecución.
- **Una prueba debe probar una sola cosa** — Si una prueba falla, debe ser claro qué falló.
- **Nombres descriptivos** — `it('debe rechazar solicitud sin token')` en lugar de `it('test 1')`.

### 6.2 Backend

- Probar **códigos de estado HTTP** correctos (200, 201, 400, 401, 403, 404, 500).
- Probar **estructura de respuesta** (`{ data: ..., message: ... }`).
- Probar **casos borde**: arrays vacíos, IDs inexistentes, datos malformados.
- Probar **permisos**: sin token, token inválido, sin módulo, rol incorrecto.
- Probar **validaciones**: campos requeridos, tipos incorrectos, valores fuera de rango.

### 6.3 Frontend

- Probar **estados del componente**: loading, error, vacío, con datos.
- Probar **formularios**: validación en cliente, envío, respuesta del servidor.
- Probar **navegación**: redirecciones, rutas protegidas, enlaces.
- Probar **permisos en UI**: elementos ocultos/mostrados según módulos.
- Probar **formateo de fechas**: que se muestren en DD/MM/YYYY.

### 6.4 Pruebas Manuales

- Documentar el **paso a paso** para que cualquier desarrollador pueda reproducir.
- Incluir **datos de prueba** específicos (ej. "usuario: admin@kram.com / pass: admin123").
- Indicar el **resultado esperado** para cada paso.
- Marcar la **fecha y responsable** de la última prueba manual.

---

## 7. CASOS DE PRUEBA RECOMENDADOS

### 7.1 Autenticación

| ID | Caso | Entrada | Resultado esperado |
|----|------|---------|-------------------|
| AUTH-01 | Login exitoso | Email + contraseña válidos | Token JWT + datos de usuario |
| AUTH-02 | Login fallido | Email válido + contraseña incorrecta | 401 + mensaje de error |
| AUTH-03 | Login fallido | Email inexistente | 401 + mensaje de error |
| AUTH-04 | Acceso sin token | GET /api/entities | 401 |
| AUTH-05 | Acceso con token expirado | Token expirado | 401 + redirección a login |
| AUTH-06 | Cierre de sesión | Click en "Cerrar sesión" | Token eliminado + redirección |

### 7.2 Empleados

| ID | Caso | Entrada | Resultado esperado |
|----|------|---------|-------------------|
| EMP-01 | Crear empleado | Todos los campos obligatorios | 201 + empleado creado |
| EMP-02 | Crear empleado sin nombre | Campos incompletos | 400 + error de validación |
| EMP-03 | Listar empleados (ADMIN) | Sin filtros | Todos los empleados |
| EMP-04 | Listar empleados (GERENTE) | Sin filtros | Solo empleados de su depto |
| EMP-05 | Desactivar empleado | ID de empleado activo | Empleado desactivado (active: false) |
| EMP-06 | Buscar empleado por nombre | "Juan" | Empleados que contengan "Juan" |

### 7.3 Reclutamiento

| ID | Caso | Entrada | Resultado esperado |
|----|------|---------|-------------------|
| REC-01 | Crear vacante | Datos completos | 201 + vacante creada |
| REC-02 | Cerrar vacante | ID de vacante activa | Vacante cerrada (status: CLOSED) |
| REC-03 | Registrar candidato | Datos + vacante activa | 201 + candidato registrado |
| REC-04 | Avanzar candidato a entrevista | ID de candidato + etapa | Candidato en etapa "ENTREVISTA" |
| REC-05 | Contratar candidato | ID de candidato aprobado | Candidato contratado + empleado creado |
| REC-06 | Jefe ve solo sus vacantes | Login como GERENTE | Solo vacantes de su departamento |

### 7.4 Compras

| ID | Caso | Entrada | Resultado esperado |
|----|------|---------|-------------------|
| COM-01 | Crear solicitud de compra | Items + datos | 201 + solicitud creada |
| COM-02 | Enviar a autorización | ID de solicitud | Solicitud en estado "PENDING_AUTHORIZATION" |
| COM-03 | Autorizar solicitud | ID + comentario | Solicitud autorizada + notificación |
| COM-04 | Rechazar solicitud | ID + motivo | Solicitud rechazada |
| COM-05 | Ver solicitudes (solicitante) | Sin filtros | Solo sus solicitudes |
| COM-06 | Ver solicitudes (autorizador) | Sin filtros | Solicitudes pendientes de su área |

### 7.5 Accesos y Permisos

| ID | Caso | Entrada | Resultado esperado |
|----|------|---------|-------------------|
| ACC-01 | Asignar módulo a usuario | Usuario + módulo | Módulo visible inmediatamente |
| ACC-02 | Quitar módulo a usuario | Usuario + módulo | Módulo oculto inmediatamente |
| ACC-03 | ADMIN modifica permisos | Cualquier cambio | Cambio permitido |
| ACC-04 | RH modifica permisos | Cualquier cambio | Cambio permitido |
| ACC-05 | COMPRAS modifica permisos | Intento de cambio | 403 (Solo ADMIN) |
| ACC-06 | Usuario sin módulo accede a ruta | URL directa | Redirección a dashboard |

### 7.6 Papelería

| ID | Caso | Entrada | Resultado esperado |
|----|------|---------|-------------------|
| PAP-01 | Crear solicitud de papelería | Items + departamento | 201 + solicitud creada |
| PAP-02 | Aprobar solicitud | ID de solicitud | Solicitud aprobada |
| PAP-03 | Rechazar solicitud | ID + motivo | Solicitud rechazada |
| PAP-04 | Ver inventario | Sin filtros | Listado de productos con stock |
| PAP-05 | Registrar salida | Producto + cantidad | Stock actualizado |

### 7.7 Uniformes

| ID | Caso | Entrada | Resultado esperado |
|----|------|---------|-------------------|
| UNI-01 | Crear solicitud de uniforme | Empleado + tipo + talla | 201 + solicitud creada |
| UNI-02 | Registrar entrega | Solicitud + fecha | Entrega registrada |
| UNI-03 | Ver historial por empleado | ID de empleado | Listado de entregas |
| UNI-04 | Ver inventario | Sin filtros | Listado de uniformes con stock |
| UNI-05 | Registrar entrada de inventario | Producto + cantidad | Stock actualizado |

---

## 8. PLANTILLA PARA REPORTE DE BUGS

Cuando se encuentre un bug, documentar con la siguiente plantilla:

```markdown
### Bug Report

**ID**: BUG-XXX
**Fecha**: DD/MM/2026
**Reportado por**: [Nombre]

**Módulo**: [Ej: Compras / Empleados / Reclutamiento]
**Severidad**: [Crítico / Alto / Medio / Bajo]

**Descripción**:
[Descripción clara del problema]

**Pasos para reproducir**:
1. Ir a [página]
2. Hacer click en [botón]
3. Ingresar [datos]
4. Observar [resultado incorrecto]

**Resultado esperado**:
[Qué debería ocurrir]

**Resultado actual**:
[Qué ocurre realmente]

**Entorno**:
- Navegador: [Chrome / Firefox / Edge]
- Sistema: [Windows / Mac]
- Rol de usuario: [ADMIN / RH / COMPRAS / etc.]

**Captura de pantalla / Log**:
[Si aplica]

**Notas adicionales**:
[Contexto adicional si es necesario]
```

---

## 9. REFERENCIAS

| Documento | Propósito |
|-----------|-----------|
| `.clinerules` | Reglas maestras del sistema, filosofía, seguridad |
| `docs/ARQUITECTURA_KRAM.md` | Arquitectura general, módulos, roles, base de datos |
| `docs/FLUJOS_DE_NEGOCIO.md` | Flujos funcionales detallados |
| `docs/MATRIZ_DE_PERMISOS.md` | Matriz de permisos por módulo y rol |
| `docs/STANDARDS.md` | Estándares de código, ejemplos y patrones |

---

*Fin del documento — Estrategia de Pruebas ERP KRAM*
