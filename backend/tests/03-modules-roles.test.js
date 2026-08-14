/**
 * Modules & Roles Tests
 */
const { request, getToken } = require('./helpers/setup');

describe('📦 Módulos y Roles', () => {
  let token = null;

  beforeAll(async () => {
    token = await getToken();
  });

  // ========== MÓDULOS ==========
  describe('Módulos del Sistema', () => {
    test('GET /api/modules - lista de módulos', async () => {
      const res = await request('GET', '/api/modules', null, token);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('modules');
      expect(Array.isArray(res.body.modules)).toBe(true);
      expect(res.body.modules.length).toBeGreaterThanOrEqual(5);
    });

    test('GET /api/modules - cada módulo tiene id, name, description', async () => {
      const res = await request('GET', '/api/modules', null, token);
      res.body.modules.forEach(mod => {
        expect(mod).toHaveProperty('id');
        expect(mod).toHaveProperty('name');
        expect(mod).toHaveProperty('description');
      });
    });

    test('Módulos críticos deben existir', async () => {
      const res = await request('GET', '/api/modules', null, token);
      const ids = res.body.modules.map(m => m.id);
      expect(ids).toContain('EMPLEADOS');
      expect(ids).toContain('RECLUTAMIENTO');
      expect(ids).toContain('COMPRAS');
      expect(ids).toContain('CONFIGURACION');
    });
  });

  // ========== ROLES ==========
  describe('Roles del Sistema', () => {
    test('GET /api/roles - lista de roles', async () => {
      const res = await request('GET', '/api/roles', null, token);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('roles');
      expect(Array.isArray(res.body.roles)).toBe(true);
      expect(res.body.roles.length).toBeGreaterThanOrEqual(6);
    });

    test('GET /api/roles - cada rol tiene id, name, description', async () => {
      const res = await request('GET', '/api/roles', null, token);
      res.body.roles.forEach(role => {
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('name');
        expect(role).toHaveProperty('description');
      });
    });

    test('Roles estratégicos ADMIN y RH deben existir', async () => {
      const res = await request('GET', '/api/roles', null, token);
      const roleIds = res.body.roles.map(r => r.id);
      expect(roleIds).toContain('ADMIN');
      expect(roleIds).toContain('RH');
    });
  });

  // ========== PRESETS ==========
  describe('Presets de Módulos por Rol', () => {
    test('GET /api/roles/presets - lista de presets', async () => {
      const res = await request('GET', '/api/roles/presets', null, token);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('presets');
    });

    test('ADMIN debe tener todos los módulos', async () => {
      const res = await request('GET', '/api/roles/presets', null, token);
      const presets = res.body.presets;
      // presets es un objeto { ADMIN: [...], RH: [...], ... }
      expect(presets).toHaveProperty('ADMIN');
      expect(Array.isArray(presets.ADMIN)).toBe(true);
      expect(presets.ADMIN.length).toBeGreaterThanOrEqual(6);
    });
  });

  // ========== SEGURIDAD ==========
  describe('Seguridad en módulos/roles', () => {
    test('GET /api/modules sin token (401)', async () => {
      const res = await request('GET', '/api/modules');
      expect(res.status).toBe(401);
    });

    test('GET /api/roles sin token (401)', async () => {
      const res = await request('GET', '/api/roles');
      expect(res.status).toBe(401);
    });
  });
});
