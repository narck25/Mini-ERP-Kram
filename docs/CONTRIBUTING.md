# Guía para Desarrolladores — ERP KRAM

> Cómo configurar el entorno, seguir las convenciones y agregar funcionalidad sin romper el sistema.

## 1. Requisitos

- Node.js 20+ y npm 11+
- PostgreSQL 15 (local o vía Docker)
- Git

## 2. Setup local

### Backend

```bash
cd backend
npm install                # ejecuta `postinstall` → prisma generate
cp .env.example .env       # ajustar DATABASE_URL y JWT_SECRET
npx prisma migrate dev     # aplica migraciones
npm run prisma:seed        # seed de desarrollo
npm run dev                # nodemon en http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev                # Next.js en http://localhost:3000
```

> El frontend usa `rewrites` en `next.config.js` para apuntar al backend. Verificar `NEXT_PUBLIC_API_URL` si se usa un host distinto.

### Base de datos con Docker (alternativa)

```bash
docker-compose up -d postgres   # PostgreSQL 15 + pgAdmin (puerto 5050)
```

## 3. Scripts útiles (backend)

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor con nodemon |
| `npm start` | Servidor de producción |
| `npm run prisma:migrate` | `prisma migrate dev` (crea migración) |
| `npm run prisma:deploy` | `prisma migrate deploy` (aplica en producción) |
| `npm run prisma:seed` | Seed de desarrollo |
| `npm run prisma:seed-prod` | Seed de producción (idempotente) |
| `npm run prisma:seed-reset` | Seed de producción con `--reset` |
| `npm run prisma:studio` | Prisma Studio |
| `npm test` / `npm run test:unit` | Tests de integración / unitarios |
| `npm run test:all` | Todos los tests |
| `npm run test:ci` | Tests con coverage (CI) |

## 4. Convenciones de código

Ver `.clinerules` (documento maestro de principios). Resumen:

- **Backend**: controladores con métodos estáticos (`exports.methodName`), capas `routes → controllers → services`.
- **Frontend**: `'use client'` para componentes con hooks; imports absolutos `@/`.
- **Fechas**: backend ISO/UTC; frontend formatea a `DD/MM/YYYY` usando `.substring(0,10)`.
- **API**: respuestas `{ data, message }` o `{ error }`; errores en español.
- **Sin código muerto**: si reemplazas una función/endpoint, elimina el viejo.
- **Anti-duplicidad**: buscar componente/servicio/endpoint existente antes de crear uno nuevo.

## 5. Modelo de seguridad — reglas de oro

1. **NUNCA** validar acceso con `user.role === 'X'` (excepto ADMIN/RH). Usar `user.accessibleModules?.includes('MODULO')`.
2. Backend: `requireModule('MODULO')` para endpoints; `requireRole(['ADMIN'])` solo para operaciones críticas (Nivel C).
3. Frontend: `<ProtectedRoute requiredModule="...">` y `user.accessibleModules`.
4. ADMIN y RH tienen bypass global (Niveles A y B); solo ADMIN accede a Nivel C.

## 6. Cómo agregar un módulo (resumen)

1. Agregar valor al enum `ModuleType` en `backend/prisma/schema.prisma`.
2. `npx prisma migrate dev` (genera migración).
3. Registrar módulo en `backend/src/config/modules.config.js`.
4. Actualizar presets en `backend/src/config/roles.config.js`.
5. Crear servicios en `backend/src/services/<modulo>/`.
6. Crear controlador en `backend/src/controllers/`.
7. Crear rutas protegidas con `requireModule('NUEVO_MODULO')` en `backend/src/routes/`.
8. Montar rutas en `backend/src/index.js`.
9. Registrar métodos API en `frontend/lib/api/`.
10. Crear páginas en `frontend/app/<modulo>/`.
11. Agregar entradas al sidebar en `frontend/components/DashboardLayout.js`.
12. Proteger rutas con `ProtectedRoute`.
13. Actualizar documentación (`.clinerules` y `docs/`).

> Guía completa: ver `docs/` y el historial de `.clinerules`.

## 7. Flujo de trabajo

1. Analizar el requerimiento.
2. Buscar componentes/servicios/endpoints existentes (evitar duplicar).
3. Detectar duplicidades y decidir: extender vs. crear.
4. Para cambios grandes: proponer plan y esperar aprobación. Para cambios pequeños: implementar directo.
5. Implementar el cambio mínimo necesario.
6. Validar (tests, build, lint).

## 8. Testing

- Tests de integración con Jest + Supertest; unitarios con configuración separada (`jest.unit.config.js`).
- Ejecutar `npm run test:ci` antes de un PR para validar ambos conjuntos con coverage.
- Documentación de pruebas: `docs/TESTING.md`.

## 9. Git

- **NUNCA** ejecutar `git add/commit/push` automáticamente.
- Mostrar archivos modificados, resumen y riesgos; esperar confirmación explícita.
- CI en `.github/workflows/` (`backend-ci.yml`, `frontend-ci.yml`).

## 10. Restricciones (no cambiar sin autorización)

- Modelos Prisma (`schema.prisma`) — cambios estructurales.
- Rutas y contratos de API.
- Nombres de archivos (rompe imports).
- No agregar dependencias sin justificar (ver `.clinerules` → Regla de Dependencias).
- No ejecutar migraciones destructivas (`prisma migrate reset`) automáticamente.
