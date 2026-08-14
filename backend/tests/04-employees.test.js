/**
 * Employees Module Tests
 */
const { request, getToken } = require('./helpers/setup');

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
});
