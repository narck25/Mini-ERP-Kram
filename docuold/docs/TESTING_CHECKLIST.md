# Checklist de Verificación de Calidad — ERP KRAM

**Versión**: 1.0  
**Propósito**: Checklist para validar la calidad del sistema antes de releases

---

## 🔴 Bloqueantes (Deben pasar sí o sí)

| # | Verificación | Método | ✅ |
|---|-------------|--------|----|
| 1 | Health Check responde 200 | `npm test -- --testPathPattern=01-health` | ⬜ |
| 2 | Login ADMIN funciona | `npm test -- --testPathPattern=02-auth` | ⬜ |
| 3 | Login con credenciales inválidas da 401 | `npm test -- --testPathPattern=02-auth` | ⬜ |
| 4 | Módulos del sistema se listan correctamente | `npm test -- --testPathPattern=03-modules` | ⬜ |
| 5 | Roles del sistema se listan correctamente | `npm test -- --testPathPattern=03-modules` | ⬜ |
| 6 | Presets de módulos por rol funcionan | `npm test -- --testPathPattern=03-modules` | ⬜ |
| 7 | Empleados se listan (ADMIN) | `npm test -- --testPathPattern=04-employees` | ⬜ |
| 8 | Vacantes se listan | `npm test -- --testPathPattern=05-recruitment` | ⬜ |
| 9 | Compras funcionan | `npm test -- --testPathPattern=06-purchases` | ⬜ |
| 10 | Configuración funciona | `npm test -- --testPathPattern=07-config` | ⬜ |
| 11 | Incidencias funcionan | `npm test -- --testPathPattern=08-incidencias` | ⬜ |
| 12 | Estadísticas funcionan | `npm test -- --testPathPattern=09-stats` | ⬜ |
| 13 | Seguridad Nivel A funciona (módulos) | `npm test -- --testPathPattern=11-security` | ⬜ |
| 14 | Seguridad Nivel C funciona (operaciones críticas) | `npm test -- --testPathPattern=11-security` | ⬜ |
| 15 | Rutas inexistentes dan 404 | `npm test -- --testPathPattern=11-security` | ⬜ |

## 🟡 Importantes (Deberían pasar)

| # | Verificación | Método | ✅ |
|---|-------------|--------|----|
| 16 | AuthUtils - hashPassword funciona | `npm run test:unit` | ⬜ |
| 17 | AuthUtils - comparePassword funciona | `npm run test:unit` | ⬜ |
| 18 | AuthUtils - generateToken funciona | `npm run test:unit` | ⬜ |
| 19 | AuthUtils - verifyToken funciona | `npm run test:unit` | ⬜ |
| 20 | AuthUtils - extractToken funciona | `npm run test:unit` | ⬜ |
| 21 | AuthUtils - hasRole funciona | `npm run test:unit` | ⬜ |
| 22 | AuthMiddleware - verifyToken (6 escenarios) | `npm run test:unit` | ⬜ |
| 23 | AuthMiddleware - requireRole (3 escenarios) | `npm run test:unit` | ⬜ |
| 24 | AuthMiddleware - requireModule (5 escenarios) | `npm run test:unit` | ⬜ |
| 25 | AuthMiddleware - requireAdmin | `npm run test:unit` | ⬜ |
| 26 | AuthMiddleware - requireRHOrAdmin | `npm run test:unit` | ⬜ |

## 🟢 Recomendados (Calidad adicional)

| # | Verificación | Método | ✅ |
|---|-------------|--------|----|
| 27 | Login E2E - formulario visible | Playwright | ⬜ |
| 28 | Login E2E - credenciales inválidas | Playwright | ⬜ |
| 29 | Login E2E - credenciales válidas redirigen | Playwright | ⬜ |
| 30 | Dashboard E2E - carga correcta | Playwright | ⬜ |
| 31 | Dashboard E2E - navegación funciona | Playwright | ⬜ |
| 32 | Dashboard E2E - sin errores de consola | Playwright | ⬜ |
| 33 | Cobertura de AuthUtils ≥ 90% | `npm run test:unit:coverage` | ⬜ |
| 34 | Cobertura de AuthMiddleware ≥ 80% | `npm run test:unit:coverage` | ⬜ |
| 35 | Build de frontend sin errores | `cd frontend && npm run build` | ⬜ |
| 36 | Linter sin errores críticos | `cd frontend && npm run lint` | ⬜ |

---

## Resumen de Verificación

| Nivel | Total | Pasaron | Faltan |
|-------|-------|---------|--------|
| 🔴 Bloqueantes | 15 | 0 | 15 |
| 🟡 Importantes | 11 | 0 | 11 |
| 🟢 Recomendados | 10 | 0 | 10 |
| **Total** | **36** | **0** | **36** |

---

## Cómo Usar Este Checklist

```bash
# 1. Ejecutar todas las pruebas
cd backend && npm run test:all

# 2. Verificar cobertura
cd backend && npm run test:unit:coverage

# 3. Verificar build frontend
cd frontend && npm run build

# 4. Marcar casillas en este archivo
# 5. Si algún 🔴 falla, NO hacer release
```

---

*Checklist generado el 24/06/2026*
