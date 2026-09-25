/**
 * Security Tests - Modelo de 3 Niveles
 */
const { PrismaClient } = require('@prisma/client');
const { request, getToken } = require('./helpers/setup');

const prisma = new PrismaClient();

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
  // eliminó — las cuentas las crean RH/TI vía importación CSV. La ruta ya
  // no existe (no hay handler en auth.routes.js). El backend responde 401
  // y no 404: `employee.routes.js` es el primer router montado en /api
  // después de /api/auth, y aplica `router.use(verifyToken)` sin path — eso
  // intercepta cualquier /api/* sin token antes de que Express llegue al
  // 404 handler global. No reabre nada (sigue bloqueado sin autenticarse),
  // pero el código de estado real es 401, no 404.
  describe('Hallazgo #2 - registro público eliminado', () => {
    test('POST /api/auth/register ya no existe (401, no llega a autenticarse)', async () => {
      const res = await request('POST', '/api/auth/register', {
        email: 'nadie@kram.mx',
        password: 'cualquiera123',
        name: 'Nadie'
      });
      expect(res.status).toBe(401);
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

  // Hallazgo #7 (docs/PROJECT_CONTEXT.md §13): GET /api/incidencias solo
  // exigía el módulo INCIDENCIAS (Nivel A), sin acotar por empleado — un
  // usuario no privilegiado con ese módulo veía la asistencia de TODA la
  // empresa. Ahora ADMIN/RH conservan la vista completa; cualquier otro rol
  // queda acotado a su propia clave de checador (mismo criterio que
  // /attendance/my).
  describe('Hallazgo #7 - GET /api/incidencias sin filtrar por empleado', () => {
    let nayelyUserId = null;
    let originalModules = null;
    const dateRange = 'startDate=2020-01-01&endDate=2030-01-01';

    beforeAll(async () => {
      const usersRes = await request('GET', '/api/users', null, adminToken);
      const nayelyUser = (usersRes.body?.data || []).find(
        (u) => u.email === 'nayely.mendez@kram.mx'
      );
      if (!nayelyUser) {
        throw new Error('No se encontró nayely.mendez@kram.mx en /api/users (fixture de prueba). Verifica prisma/seed.js.');
      }
      nayelyUserId = nayelyUser.id;
      originalModules = nayelyUser.accessibleModules || [];

      // EMPLEADO_BASICO no trae INCIDENCIAS por preset; se otorga solo para
      // esta prueba (y se revierte en afterAll) para poder probar el scoping
      // sin depender de qué módulos traiga el seed hoy.
      const grant = await request(
        'PUT',
        `/api/users/${nayelyUserId}`,
        { accessibleModules: [...new Set([...originalModules, 'INCIDENCIAS'])] },
        adminToken
      );
      if (grant.status !== 200) {
        throw new Error(`No se pudo otorgar el módulo INCIDENCIAS de prueba (status ${grant.status})`);
      }
    });

    afterAll(async () => {
      if (nayelyUserId && originalModules) {
        await request('PUT', `/api/users/${nayelyUserId}`, { accessibleModules: originalModules }, adminToken);
      }
    });

    test('RH/ADMIN sigue viendo el listado completo (regresión)', async () => {
      const res = await request('GET', `/api/incidencias?${dateRange}`, null, adminToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('Un usuario no privilegiado con el módulo solo ve su propia asistencia', async () => {
      const res = await request('GET', `/api/incidencias?${dateRange}`, null, basicToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const meRes = await request('GET', '/api/employees/me', null, basicToken);
      const myClave = meRes.body?.employee?.clave;
      if (myClave) {
        res.body.data.forEach((record) => expect(record.numeroEmpleado).toBe(myClave));
      } else {
        expect(res.body.data.length).toBe(0);
      }
    });
  });

  // Hallazgo #1 (docs/PROJECT_CONTEXT.md §13): /uploads se servía con
  // express.static, sin autenticación ni control de propiedad — cualquiera
  // con la URL exacta descargaba cualquier archivo. Ahora exige token
  // (verifyToken) y, por carpeta, la misma regla de autorización que ya
  // protege ese recurso en el resto de la API (ver uploadsAccess.service.js).
  describe('Hallazgo #1 - /uploads servía archivos sin autenticación', () => {
    let incidentId = null;
    let documentId = null;
    const incidentPath = '/uploads/disciplinary-incidents/test-fixture-hallazgo1.pdf';
    const documentPath = '/uploads/employee-documents/test-fixture-hallazgo1.pdf';

    beforeAll(async () => {
      // El archivo NO necesita existir en disco: la autorización corre
      // antes que fs.existsSync, así que basta con el registro en BD.
      const adminEmployee = await prisma.employee.findFirst({
        where: { user: { email: 'admin@kram.com' } }
      });
      const adminUser = await prisma.user.findFirst({ where: { email: 'admin@kram.com' } });
      if (!adminEmployee || !adminUser) {
        throw new Error('No se encontró el expediente/usuario de admin@kram.com (fixture de prueba). Verifica prisma/seed.js.');
      }

      const incident = await prisma.disciplinaryIncident.create({
        data: {
          empleadoId: adminEmployee.id,
          tipo: 'RETARDO_FALTA_INJUSTIFICADA',
          fecha: new Date(),
          motivo: '[TEST-AUTO] hallazgo #1',
          registradoPorId: adminUser.id,
          archivoUrl: incidentPath
        }
      });
      incidentId = incident.id;

      const document = await prisma.employeeDocument.create({
        data: {
          tipo_documento: 'Otro',
          nombre_archivo: 'test-fixture-hallazgo1.pdf',
          url_archivo: documentPath,
          employee_id: adminEmployee.id,
          uploaded_by: adminUser.id
        }
      });
      documentId = document.id;
    });

    afterAll(async () => {
      if (incidentId) await prisma.disciplinaryIncident.delete({ where: { id: incidentId } }).catch(() => {});
      if (documentId) await prisma.employeeDocument.delete({ where: { id: documentId } }).catch(() => {});
      await prisma.$disconnect();
    });

    test('GET a un archivo sin token (401, no llega a comprobar si existe)', async () => {
      const res = await request('GET', '/uploads/photos/no-existe-test.jpg');
      expect(res.status).toBe(401);
    });

    test('Carpeta desconocida se niega siempre, fail-closed (403)', async () => {
      const res = await request('GET', '/uploads/no-existe-esta-carpeta/x.jpg', null, adminToken);
      expect(res.status).toBe(403);
    });

    test('Usuario sin relación con el empleado recibe 403 en disciplinary-incidents', async () => {
      const res = await request('GET', incidentPath, null, basicToken);
      expect(res.status).toBe(403);
    });

    test('ADMIN autorizado en disciplinary-incidents (no 401/403)', async () => {
      const res = await request('GET', incidentPath, null, adminToken);
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });

    test('Usuario sin relación con el empleado recibe 403 en employee-documents', async () => {
      const res = await request('GET', documentPath, null, basicToken);
      expect(res.status).toBe(403);
    });

    test('ADMIN autorizado en employee-documents (no 401/403)', async () => {
      const res = await request('GET', documentPath, null, adminToken);
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });
  });
});
