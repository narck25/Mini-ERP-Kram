/**
 * API Client — Módulo de Acceso a Backend
 * ─────────────────────────────────────────────
 * REFACTORIZADO (P2-005): Modularizado en lib/api/
 *
 *   lib/api/
 *     ├── client.js          ← Axios instance + interceptors
 *     ├── index.js           ← Barrel export
 *     ├── auth.js            ← authApi
 *     ├── employees.js       ← employeeApi
 *     ├── vacancies.js       ← vacancyApi
 *     ├── recruitment.js     ← recruitmentApi
 *     ├── documents.js       ← employeeDocumentApi
 *     ├── stats.js           ← statsApi
 *     ├── permissions.js     ← permissionApi
 *     ├── system.js          ← systemApi
 *     ├── stationery.js      ← stationeryApi
 *     └── uniforms.js        ← uniformApi
 *
 * Este archivo mantiene compatibilidad hacia atrás.
 * Todos los imports existentes `from '@/lib/api'` siguen funcionando.
 */

export { default, authApi, employeeApi, vacancyApi, recruitmentApi, employeeDocumentApi, statsApi, permissionApi, systemApi, stationeryApi, uniformApi, healthApi } from './api/index'