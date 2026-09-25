/**
 * Reportes (/api/reports/*) — sin cobertura automatizada previa (ver
 * PROJECT_CONTEXT.md §12.4). Todos los endpoints comparten el mismo gate:
 * requireModule('REPORTES'). No hay control fino adicional (Nivel B/C).
 *
 * jefe.vacaciones@kram.mx no tiene el módulo REPORTES por preset — sirve
 * para los 403. ADMIN tiene bypass automático de módulo.
 */
const { request, getToken } = require('./helpers/setup');

describe('🧪 Reportes — permisos y forma de la respuesta', () => {
  let adminToken = null;
  let noReportesToken = null;

  beforeAll(async () => {
    adminToken = await getToken();
    noReportesToken = await getToken('jefe.vacaciones@kram.mx', 'Kram2026!');
    if (!adminToken || !noReportesToken) {
      throw new Error('No se pudo autenticar admin/jefe.vacaciones. Verifica prisma/seed.js.');
    }
  });

  describe('Endpoints JSON', () => {
    const endpoints = ['empleados', 'compras', 'inventario', 'asistencia', 'vacaciones'];

    test.each(endpoints)('GET /api/reports/%s sin el módulo REPORTES (403)', async (endpoint) => {
      const res = await request('GET', `/api/reports/${endpoint}`, null, noReportesToken);
      expect(res.status).toBe(403);
    });

    test.each(endpoints)('GET /api/reports/%s con REPORTES devuelve datos (200)', async (endpoint) => {
      const res = await request('GET', `/api/reports/${endpoint}`, null, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      if (endpoint === 'inventario') {
        // Forma distinta a los demás: separa papelería/uniformes, no trae `list`.
        expect(Array.isArray(res.body.data.papeleria.items)).toBe(true);
        expect(Array.isArray(res.body.data.uniformes.items)).toBe(true);
      } else {
        expect(Array.isArray(res.body.data.list)).toBe(true);
      }
    });
  });

  describe('Endpoints de exportación a Excel', () => {
    test('GET /api/reports/empleados/export sin el módulo (403)', async () => {
      const res = await request('GET', '/api/reports/empleados/export', null, noReportesToken);
      expect(res.status).toBe(403);
    });

    test('GET /api/reports/empleados/export devuelve un archivo (200, no vacío)', async () => {
      const res = await request('GET', '/api/reports/empleados/export', null, adminToken);
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('GET /api/reports/vacaciones/export devuelve un archivo (200, no vacío)', async () => {
      const res = await request('GET', '/api/reports/vacaciones/export', null, adminToken);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  test('El reporte de empleados incluye el total y el desglose por departamento', async () => {
    const res = await request('GET', '/api/reports/empleados', null, adminToken);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.total).toBe('number');
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    expect(typeof res.body.data.porDepartamento).toBe('object');
  });

  test('El filtro ?estatus= se respeta en el reporte de empleados', async () => {
    const res = await request('GET', '/api/reports/empleados?estatus=Activo', null, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.list.every((e) => e.estatus === 'Activo')).toBe(true);
  });
});
