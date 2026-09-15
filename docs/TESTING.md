# Pruebas (Testing)

## Cómo ejecutar

```bash
cd backend
npm test             # suite completa (integración + unitarias)
npm run test:unit    # solo pruebas unitarias
npm run test:coverage # con reporte de cobertura
npm run test:ci      # modo CI
```

## Estructura de la suite

### Pruebas de integración (Supertest contra el servidor Express)

| Archivo | Cobertura |
|---------|-----------|
| `01-health.test.js` | Health check (`GET /api/health`) |
| `02-auth.test.js` | Login, credenciales inválidas, usuario inactivo, estructura del JWT |
| `03-modules-roles.test.js` | Módulos, roles y presets |
| `04-employees.test.js` | Listado de empleados, departamentos, puestos, jefes, empleado por ID |
| `05-recruitment.test.js` | Vacantes y candidatos |
| `06-purchases.test.js` | Solicitudes de compra, cotizaciones, autorización |
| `07-config.test.js` | Configuración |
| `08-incidencias.test.js` | Incidencias / asistencia |
| `09-stats.test.js` | Estadísticas |
| `10-other-modules.test.js` | Otros módulos |
| `11-security.test.js` | Seguridad |

### Pruebas unitarias

| Archivo | Cobertura |
|---------|-----------|
| `unit/middlewares/auth.middleware.test.js` | `verifyToken`, `requireRole`, `requireModule`, `requireAdmin`, `requireRHOrAdmin` |
| `unit/services/auth.service.test.js` | Servicio de autenticación |
| `unit/services/purchase-order.service.test.js` | Generación de número de orden de compra |

## Estado actual

- **14 suites / 99 tests**, todos pasando.
- Los tests de integración corren contra el servidor en ejecución (requieren la BD y el backend levantados).

## Entorno de integración local aislado (`test:integration:local`)

Por defecto, `npm test` corre los tests de integración vía HTTP contra el
servidor que ya esté levantado (`TEST_BASE_URL`, default
`http://localhost:3001`), y ese servidor carga `backend/.env` al arrancar
— es decir, **contra la base de desarrollo (`kram_erp`)**. Para no tocar
esa base al probar, existe un entorno separado que replica los pasos de
`.github/workflows/backend-ci.yml` pero en tu máquina, con Postgres y
puerto propios.

### 1. Levantar el Postgres de pruebas

```bash
docker compose -f docker-compose.test.yml up -d
```

Esto crea un contenedor `kram-postgres-test` con la base `kram_test` en
el puerto **5433** (no 5432, para no chocar con el Postgres de
desarrollo) y **sin volumen persistente** — cada `down` lo deja vacío.

### 2. Configurar `backend/.env.test`

```bash
cd backend
cp .env.test.example .env.test
```

`.env.test.example` ya apunta a `kram_test`/puerto 5433, define el
backend de pruebas en el **puerto 3002** (distinto del 3001 de
desarrollo, para poder tener ambos corriendo a la vez) y fija
`RATE_LIMIT_DISABLED=true`. `.env.test` está en `backend/.gitignore`
(no se sube al repo); `.env.test.example` sí.

### 3. Correr la suite

```bash
npm run test:integration:local
```

El script `backend/scripts/test-integration-local.js`:

1. Carga `backend/.env.test`.
2. **Salvaguarda**: si `DATABASE_URL` no contiene `kram_test`, aborta sin
   ejecutar nada (protege contra correrlo por error contra `kram_erp`).
3. Aplica `prisma migrate deploy` sobre `kram_test`.
4. Corre el seed (`node prisma/seed.js`) sobre `kram_test`.
5. Arranca el backend (`node src/index.js`) en el puerto de `.env.test`
   (3002 por defecto) y espera a que `GET /api/health` responda.
6. Corre Jest (la suite de integración) con
   `TEST_BASE_URL=http://localhost:3002`.
7. Apaga el servidor al terminar, incluso si algún test falla.

### 4. Tirar el entorno

```bash
docker compose -f docker-compose.test.yml down
```

> Los tests **unitarios** (`npm run test:unit`) no necesitan nada de esto:
> mockean `@prisma/client` por completo y nunca tocan una base real.

## Cómo agregar una prueba

1. Crea `tests/NN-nombre.test.js` (integración) o `tests/unit/...` (unitaria).
2. Para integración, usa `supertest` apuntando a la app Express.
3. Reutiliza el helper de login de `tests/helpers/setup.js`.
4. Sigue el patrón de los archivos existentes (describe/test con nombres descriptivos en español).
