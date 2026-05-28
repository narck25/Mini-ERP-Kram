# Auditoría ERP KRAM - Checklist

## Fase 1: Auditoría de Seguridad y Roles (RBAC) ✅
- [x] Buscar validaciones de roles hardcodeadas en frontend
- [x] Verificar protecciones de ruta con ProtectedRoute/requireModule
- [x] Revisar middleware de backend para rutas sensibles

## Fase 2: Auditoría de Frontend y Enlaces Rotos
- [ ] Revisar Sidebar/Navbar - verificar hrefs existentes
- [ ] Revisar peticiones API vs rutas backend
- [ ] Verificar try/catch en formularios principales

## Fase 3: Auditoría de Backend y Estandarización
- [ ] Revisar controladores para búsquedas con mayúsculas/minúsculas
- [ ] Verificar middleware de autenticación en rutas sensibles

## Fase 4: Limpieza Pre-Commit
- [ ] Buscar console.log excesivos
- [ ] Verificar variables de entorno hardcodeadas
