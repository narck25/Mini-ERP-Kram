/**
 * Employees Module Tests
 */
const { PrismaClient } = require('@prisma/client');
const { request, getToken } = require('./helpers/setup');

const prisma = new PrismaClient();

describe('👥 Módulo Empleados', () => {
  let token = null;
  let employeeId = null;

  beforeAll(async () => {
    token = await getToken();
  });

  describe('Listado', () => {
    test('GET /api/employees - lista todos los empleados', async () => {
      const res = await request('GET', '/api/employees', null, token);
      expect(res.status).toBe(200);
      const data = res.body.data || res.body.employees || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(1);
      if (data.length > 0) employeeId = data[0].id;
    });

    test('GET /api/employees - cada empleado tiene campos requeridos', async () => {
      const res = await request('GET', '/api/employees', null, token);
      const data = res.body.data || res.body.employees || res.body;
      if (data.length > 0) {
        const emp = data[0];
        expect(emp).toHaveProperty('id');
        expect(emp).toHaveProperty('nombres') || expect(emp).toHaveProperty('nombre');
        expect(emp).toHaveProperty('estatus');
      }
    });

    test('GET /api/employees sin token (401)', async () => {
      const res = await request('GET', '/api/employees');
      expect(res.status).toBe(401);
    });
  });

  describe('Departamentos', () => {
    test('GET /api/departments - lista departamentos', async () => {
      const res = await request('GET', '/api/departments', null, token);
      expect(res.status).toBe(200);
      const data = res.body.data || res.body.departments || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Puestos', () => {
    test('GET /api/job-positions - lista puestos', async () => {
      const res = await request('GET', '/api/job-positions', null, token);
      expect(res.status).toBe(200);
      const data = res.body.data || res.body.positions || res.body;
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Jefes Directos', () => {
    test('GET /api/managers - lista jefes', async () => {
      const res = await request('GET', '/api/managers', null, token);
      expect(res.status).toBe(200);
    });
  });

  describe('Empleado por ID', () => {
    test('GET /api/employees/:id - empleado específico', async () => {
      if (!employeeId) return;
      const res = await request(`GET`, `/api/employees/${employeeId}`, null, token);
      expect(res.status).toBe(200);
    });

    test('GET /api/employees/:id - ID inexistente (404)', async () => {
      const res = await request('GET', '/api/employees/id-inexistente-99999', null, token);
      expect(res.status).toBe(404);
    });
  });

  describe('Visibilidad por jerarquía (subárbol de reporte, no departamento)', () => {
    // jefe.vacaciones@kram.mx y empleado.vacaciones@kram.mx comparten departamento
    // COMPRAS con nayely.mendez@kram.mx y compras@kram.mx (fixtures de
    // tests/15-disciplinary-incident.test.js / seed.js), pero solo
    // empleado.vacaciones reporta a jefe.vacaciones (reportaAId). Si el scoping
    // fuera por departamento, jefe.vacaciones vería a los 4; por subárbol de
    // reporte, solo debe verse a sí mismo y a su subordinado directo.
    let jefeToken = null;
    let adminToken = null;
    let jefeUserId = null;
    let originalModules = null;

    beforeAll(async () => {
      adminToken = await getToken();
      jefeToken = await getToken('jefe.vacaciones@kram.mx', 'Kram2026!');
      if (!adminToken || !jefeToken) {
        throw new Error('No se pudo autenticar admin / jefe.vacaciones. Verifica prisma/seed.js.');
      }

      const usersRes = await request('GET', '/api/users', null, adminToken);
      const jefeUser = (usersRes.body?.data || []).find((u) => u.email === 'jefe.vacaciones@kram.mx');
      if (!jefeUser) throw new Error('No se encontró jefe.vacaciones@kram.mx en /api/users.');
      jefeUserId = jefeUser.id;
      originalModules = jefeUser.accessibleModules || [];

      const grant = await request(
        'PUT', `/api/users/${jefeUserId}`,
        { accessibleModules: [...new Set([...originalModules, 'EMPLEADOS'])] },
        adminToken
      );
      if (grant.status !== 200) throw new Error(`No se pudo otorgar el módulo EMPLEADOS de prueba (status ${grant.status})`);
    });

    afterAll(async () => {
      if (jefeUserId && originalModules) {
        await request('PUT', `/api/users/${jefeUserId}`, { accessibleModules: originalModules }, adminToken);
      }
      await prisma.$disconnect();
    });

    test('Buscar por un término que matchea a todo el departamento solo devuelve el subárbol propio', async () => {
      const res = await request('GET', '/api/employees?search=Fixture', null, jefeToken);
      expect(res.status).toBe(200);
      const nombres = (res.body.employees || []).map((e) => e.nombre);
      expect(nombres).toContain('Jefe Vacaciones Fixture (Test)');
      expect(nombres).toContain('Empleado Vacaciones Fixture (Test)');
      expect(nombres).not.toContain('Nayely Mendez Fixture (Test)');
      expect(nombres).not.toContain('Compras Fixture (Test)');
    });

    test('Sin búsqueda, el listado también queda limitado al subárbol propio', async () => {
      const res = await request('GET', '/api/employees', null, jefeToken);
      expect(res.status).toBe(200);
      const nombres = (res.body.employees || []).map((e) => e.nombre);
      expect(nombres).toContain('Jefe Vacaciones Fixture (Test)');
      expect(nombres).toContain('Empleado Vacaciones Fixture (Test)');
      expect(nombres).not.toContain('Nayely Mendez Fixture (Test)');
      expect(nombres).not.toContain('Compras Fixture (Test)');
    });
  });
});
