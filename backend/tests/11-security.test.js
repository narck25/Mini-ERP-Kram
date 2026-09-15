/**
 * Security Tests - Modelo de 3 Niveles
 */
const { request, getToken } = require('./helpers/setup');

describe('🔒 Seguridad - Modelo de 3 Niveles', () => {
  let adminToken = null;
  let basicToken = null;

  beforeAll(async () => {
    adminToken = await getToken();
    // Intentar obtener token de EMPLEADO_BASICO
    const basicRes = await request('POST', '/api/auth/login', {
      email: 'nayely.mendez@kram.mx',
      password: '123456'
    });
    if (basicRes.status === 200) {
      basicToken = basicRes.body.token;
    }
  });

  // Nivel A: Control de Acceso a Módulos
  describe('Nivel A - Acceso a Módulos', () => {
    test('Endpoint protegido sin token (401)', async () => {
      const res = await request('GET', '/api/employees');
      expect(res.status).toBe(401);
    });

    test('Endpoint protegido con token ADMIN (200)', async () => {
      const res = await request('GET', '/api/employees', null, adminToken);
      expect(res.status).toBe(200);
    });
  });

  // Nivel C: Operaciones Críticas
  describe('Nivel C - Operaciones Críticas', () => {
    test('GET /api/permissions/users sin token (401)', async () => {
      const res = await request('GET', '/api/permissions/users');
      expect(res.status).toBe(401);
    });

    test('GET /api/users/stats sin token (401)', async () => {
      const res = await request('GET', '/api/users/stats');
      expect(res.status).toBe(401);
    });
  });

  // Rutas inexistentes
  describe('404 Handling', () => {
    test('Ruta inexistente (404)', async () => {
      const res = await request('GET', '/api/nonexistent', null, adminToken);
      expect(res.status).toBe(404);
    });

    test('Recurso inexistente (404)', async () => {
      const res = await request('GET', '/api/employees/id-inexistente', null, adminToken);
      expect(res.status).toBe(404);
    });
  });

  // Hallazgo #2 (docs/PROJECT_CONTEXT.md §13): el registro público se
  // eliminó — las cuentas las crean RH/TI vía importación CSV. La ruta
  // ya no existe en absoluto (no hay handler que devuelva 400/401/403).
  describe('Hallazgo #2 - registro público eliminado', () => {
    test('POST /api/auth/register ya no existe (404)', async () => {
      const res = await request('POST', '/api/auth/register', {
        email: 'nadie@kram.mx',
        password: 'cualquiera123',
        name: 'Nadie'
      });
      expect(res.status).toBe(404);
    });
  });

  // Hallazgo #4 (docs/PROJECT_CONTEXT.md §13): el fallback ?token= de
  // verifyToken se eliminó — ahora solo se acepta Authorization: Bearer.
  // Las rutas SSE (verifyTokenFromQuery) no se tocaron y siguen aceptando
  // ?token= por separado.
  describe('Hallazgo #4 - fallback ?token= eliminado de verifyToken', () => {
    test('Endpoint protegido con ?token= válido pero SIN header Authorization (401)', async () => {
      const res = await request('GET', `/api/employees?token=${adminToken}`);
      expect(res.status).toBe(401);
    });
  });

  // Hallazgo #6 (docs/PROJECT_CONTEXT.md §13): GET /purchases/public/:id
  // ahora exige ser aprobador asignado (PurchaseApprover) o ADMIN, igual
  // que el POST .../authorize.
  //
  // El aprobador asignado (rh@kram.com) es una persona DISTINTA de quien
  // solicita la compra (compras@kram.mx): la regla de negocio actual SÍ
  // permite que alguien se autoasigne como aprobador de su propia
  // solicitud (ver hallazgo #11, pendiente de decisión de negocio), así
  // que usar aquí dos identidades separadas prueba específicamente la
  // pertenencia a PurchaseApprover y no ese caso distinto.
  describe('Hallazgo #6 - IDOR en GET /purchases/public/:id', () => {
    let comprasToken = null;
    let rhToken = null;
    let rhEmployeeId = null;
    let requestId = null;

    beforeAll(async () => {
      comprasToken = await getToken('compras@kram.mx', 'Kram2026!');
      if (!comprasToken) {
        throw new Error('No se pudo autenticar compras@kram.mx (fixture de prueba). Verifica prisma/seed.js.');
      }
      if (!basicToken) {
        throw new Error('No se pudo autenticar nayely.mendez@kram.mx (fixture de prueba). Verifica prisma/seed.js.');
      }
      rhToken = await getToken('rh@kram.com', 'password123');
      if (!rhToken) {
        throw new Error('No se pudo autenticar rh@kram.com (fixture de prueba). Verifica prisma/seed.js.');
      }

      const meRes = await request('GET', '/api/employees/me', null, rhToken);
      rhEmployeeId = meRes.body?.employee?.id;
      if (!rhEmployeeId) {
        throw new Error('rh@kram.com no tiene un Employee asociado (fixture de prueba incompleta).');
      }

      const created = await request('POST', '/api/purchases', {
        justificacion: '[TEST-AUTO] Autorización pública (hallazgo #6)',
        items: [{ productoServicio: 'Producto de prueba', cantidad: 1 }]
      }, comprasToken);
      requestId = created.body.data.request.id;

      // Asignar a RH (no al solicitante) como aprobador -> EN_AUTORIZACION.
      const assigned = await request('POST', `/api/purchases/${requestId}/assign-approvers`, {
        approverIds: [rhEmployeeId]
      }, comprasToken);
      if (assigned.status !== 200 && assigned.status !== 201) {
        throw new Error(`No se pudo asignar aprobador de prueba (status ${assigned.status})`);
      }
    });

    afterAll(async () => {
      if (requestId) {
        await request('DELETE', `/api/purchases/${requestId}`, null, comprasToken);
      }
    });

    test('Usuario autenticado que NO es aprobador ni ADMIN recibe 403', async () => {
      const res = await request('GET', `/api/purchases/public/${requestId}`, null, basicToken);
      expect(res.status).toBe(403);
    });

    test('El solicitante (que no es el aprobador asignado) también recibe 403', async () => {
      const res = await request('GET', `/api/purchases/public/${requestId}`, null, comprasToken);
      expect(res.status).toBe(403);
    });

    test('El aprobador asignado, distinto del solicitante, recibe 200', async () => {
      const res = await request('GET', `/api/purchases/public/${requestId}`, null, rhToken);
      expect(res.status).toBe(200);
      expect(res.body.request.id).toBe(requestId);
    });
  });
});
