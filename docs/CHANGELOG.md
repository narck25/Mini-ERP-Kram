# Changelog — ERP KRAM

> Generado a partir del historial real de Git (144 commits · autor `narck25`). Organizado cronológicamente por mes. La tabla "Historial de arquitectura" al final documenta la evolución de `.clinerules`.

## Febrero 2026 — Inicio del proyecto

- **feat**: setup inicial del ERP KRAM con autenticación (`97f25f3`).
- **feat**: módulo de Reclutamiento completo con autenticación corregida (`f1af04d`).
- **feat**: módulo RH — Gestión de Talento / Expediente Digital (`0738e12`).
- **feat**: implementación completa del módulo de Reclutamiento Colaborativo (`2976a7a`).

## Marzo 2026 — Empleados y Reclutamiento operativos

- ✅ Módulos Empleados y Reclutamiento funcionando (`29fbdae`).
- **feat**: creación de usuarios Gerente de RH y PRUEBAS HUB (`6affe64`).
- **fix**: simplificar botones en mis-solicitudes y ajustar permisos en empleados (`9e50e08`).
- **feat**: corrección de URLs de PDF y creación de usuarios (`30add93`).

## Abril 2026 — Preparación para producción

- **chore**: preparación completa para deploy en Coolify (`2025651`).
- **fix**: configuración de CORS con dominios kramhub.site (`1e4a211`).
- **chore**: limpieza de archivos de prueba y scripts innecesarios (`39bd5de`).

## Mayo 2026 — Deploy en Coolify / producción

- **fix**: correcciones en Dockerfiles (HEALTHCHECK con curl, `npm install`, ARG de Coolify, single-stage).
- **feat**: seed automático al iniciar el backend (`37847e8`).
- **fix**: importación/exportación CSV y `getJobPositionsByDepartment` (`93aa4b1`).
- **feat**: perfil de empleado con Hero, cards, subida manual de foto y descarga (`d27a17b`).
- **refactor**: unificar controladores de vacantes (`vacancy.controller.js` → `recruitment.controller.js`) (`c4922da`).
- **fix**: múltiples correcciones de producción (uploads, EACCES, HTTPS, Mixed Content, memoria) (`ca2e225`…`9999d99`).

## Junio 2026 — Notificaciones, Organización, Usuarios y Compras

- **feat**: notificaciones de cumpleaños y aniversarios con Resend (`04977d6`, `15a07f9`).
- **feat**: seed de producción y reseteo de BD vía `POST /api/seed/reset` (`ec5100f`, `d75ede6`, `4d8f007`).
- **feat**: CRUD completo de organización + puestos inline (`33b30c7`).
- **feat**: mejoras en gestión de usuarios — búsqueda, paginación, filtros, roles/módulos dinámicos (`77ea13b`).
- **feat**: importación CSV con 3 modos de manejo de duplicados (`bad8d3c`).
- **feat**: módulo de Compras completo — comentarios, aprobadores, tabla comparativa, órdenes de compra con PDF, autorización pública y reportes (`b64f220`, `f03b6cd`, `8647d87`).
- **feat**: servicio de auditoría y SSE manager para notificaciones en tiempo real (`b14557c`).
- **feat**: edición completa de cotizaciones y de items en estado NUEVO (`b771349`, `3281241`).
- **fix**: resolver violaciones de orden en hooks de React y errores de build (`540010b`, `d13fa66`).
- **refactor**: renombrar `ROLES_CONFIG` → `ROLE_FALLBACK_CONFIG` y eliminar duplicidad de módulos (`219a7e2`).
- **docs**: documentación completa, deuda técnica, ADRs y manuales (`b8d0f99`, `015db08`, `a3a963d`).

## Julio 2026 — Remediación de deuda técnica

- **refactor**: unificar modelo de autorización de Compras/Papelería/Uniformes con `requireModule('COMPRAS')` — Fase 0 (`4b17bba`).
- **refactor**: remediación de deuda técnica Fases 1-5 (14 ítems resueltos) (`a7900c7`).
- **refactor**: extraer `order-pdf.service.js` y `status-templates.service.js` — Fase 7 (`d8da3e7`).
- **refactor**: dividir `organization.controller` + `csv-template.service` — Fase 7 (`b297bf9`).
- **feat**: completar plan de remediación de deuda técnica al 100% (`a5b6d48`).

## Agosto 2026 — Scoping, pruebas, docs e inventario

- **feat**: scoping Nivel B en "Mi Espacio" y redirección post-login (`c974773`).
- **test**: infraestructura de pruebas (Jest + Supertest + Playwright) y CI (`a5337b5`).
- **docs**: documentación técnica — ADRs, manuales, módulos, testing (`0f03594`).
- **feat**: deshabilitar módulos fantasma VACACIONES y REPORTES (`ed6ee32`).
- **feat**: solicitud de ajuste de inventario (aprobación RH/Admin) + kardex + restock (`69a0200`).
- **feat**: acta imprimible de entrega de uniformes con firmas (`53a6e5a`).
- **feat**: seed de datos de ejemplo para demo (`9f66cdc`).
- **fix**: correcciones de compras y empleados (cancelar, auditoría, filtros, stats, autorizar) (`f60a21e`).
- **feat**: baja de empleado con motivo, fecha automática y liberación de correo institucional (`bae3fa3`, `e20f22f`).
- **fix**: reforzar gestión de accesos y usuarios (rol solo ADMIN, roles dinámicos, auto-bloqueo) (`fad95a7`).
- **docs**: archivar documentación vieja, manuales por módulo, flujos con Mermaid, README, estado del proyecto, testing y deuda técnica (`e32fcb5`…`30e3bb8`).

## Historial de arquitectura (`.clinerules`)

| Versión | Cambios |
|---|---|
| v1.0 | Versión inicial |
| v2.0 | Sistema de permisos ACL + estrategia de 3 niveles |
| v3.0 | Sistema de roles escalable (rolesConfig, endpoints dinámicos) |
| v4.0 | Centralización de módulos en `modules.config.js`; incorporación de Compras; documentación técnica |
| v4.1 | Roles Estratégicos ADMIN/RH con bypass global |
| v5.0 | Refactorización integral (separación de capas, límites de tamaño) |
| v5.1 | Refinamiento pragmático (límites flexibles, CRUD simple en controllers) |
| v5.2 | Constitución técnica (Arquitectura Evolutiva, Cambio Mínimo, Regla de Dependencias) |
