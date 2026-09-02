/**
 * Vacaciones Module Tests
 * Rutas reales: /api/vacations
 * Cubre el flujo HTTP completo (autenticación, gating por módulo/rol) que hoy
 * solo estaba probado a nivel de servicio (tests/unit/services/vacation.service.test.js).
 */
const { PrismaClient } = require('@prisma/client');
const { request, getToken } = require('./helpers/setup');

const prisma = new PrismaClient();

// Fechas dentro de un rango de 1 día, holgadas respecto a hoy para no chocar con feriados/fines de semana.
function fechaEnDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

describe('🏖️ Módulo Vacaciones', () => {
  let jefeToken = null;
  let empleadoToken = null;
  let rhToken = null;
  let sistemasToken = null;
  let produccionToken = null;
  const createdVacationIds = [];

  beforeAll(async () => {
    jefeToken = await getToken('jefe.vacaciones@kram.mx', 'Kram2026!');
    empleadoToken = await getToken('empleado.vacaciones@kram.mx', 'Kram2026!');
    rhToken = await getToken('rh@kram.com', 'password123');
    sistemasToken = await getToken('sistemas@kram.com', 'password123');
    produccionToken = await getToken('produccion@kram.com', 'password123');

    if (!jefeToken || !empleadoToken) {
      throw new Error('No se pudo autenticar los fixtures jefe.vacaciones@kram.mx / empleado.vacaciones@kram.mx. Verifica prisma/seed.js.');
    }
  });

  afterAll(async () => {
    for (const id of createdVacationIds) {
      await prisma.vacationRequest.delete({ where: { id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('Seguridad', () => {
    test('POST /api/vacations sin token (401)', async () => {
      const res = await request('POST', '/api/vacations', { fechaInicio: fechaEnDias(5), fechaFin: fechaEnDias(5) });
      expect(res.status).toBe(401);
    });

    test('POST /api/vacations sin módulo VACACIONES (403)', async () => {
      // produccion@kram.com no tiene VACACIONES en su preset de módulos.
      const res = await request('POST', '/api/vacations', { fechaInicio: fechaEnDias(5), fechaFin: fechaEnDias(5) }, produccionToken);
      expect(res.status).toBe(403);
    });

    test('GET /api/vacations/my sin módulo VACACIONES (403)', async () => {
      const res = await request('GET', '/api/vacations/my', null, produccionToken);
      expect(res.status).toBe(403);
    });

    test('GET /api/vacations/balances sin rol ADMIN/RH (403)', async () => {
      const res = await request('GET', '/api/vacations/balances', null, sistemasToken);
      expect(res.status).toBe(403);
    });

    test('GET /api/vacations/balances con RH (200)', async () => {
      const res = await request('GET', '/api/vacations/balances', null, rhToken);
      expect(res.status).toBe(200);
    });

    test('POST /api/vacations/:id/approve sin rol ADMIN/RH (403)', async () => {
      const res = await request('POST', '/api/vacations/no-existe/approve', null, sistemasToken);
      expect(res.status).toBe(403);
    });
  });

  describe('Flujo completo: solicitud → autorización del jefe → aprobación de RH', () => {
    test('GET /api/vacations/balance del empleado tiene saldo disponible', async () => {
      const res = await request('GET', '/api/vacations/balance', null, empleadoToken);
      expect(res.status).toBe(200);
      expect(res.body.data.diasDisponibles).toBeGreaterThan(0);
    });

    let vacationId;

    test('POST /api/vacations crea la solicitud en PENDIENTE (201)', async () => {
      const res = await request('POST', '/api/vacations', {
        fechaInicio: fechaEnDias(10),
        fechaFin: fechaEnDias(10),
        motivo: '[TEST-AUTO] solicitud de prueba'
      }, empleadoToken);
      expect(res.status).toBe(201);
      expect(res.body.data.estatus).toBe('PENDIENTE');
      vacationId = res.body.data.id;
      createdVacationIds.push(vacationId);
    });

    test('GET /api/vacations/pending-for-jefe incluye la solicitud creada', async () => {
      const res = await request('GET', '/api/vacations/pending-for-jefe', null, jefeToken);
      expect(res.status).toBe(200);
      expect(res.body.data.map((v) => v.id)).toContain(vacationId);
    });

    test('POST /api/vacations/:id/authorize-jefe autoriza la solicitud (200)', async () => {
      const res = await request('POST', `/api/vacations/${vacationId}/authorize-jefe`, null, jefeToken);
      expect(res.status).toBe(200);
      expect(res.body.data.estatus).toBe('AUTORIZADA');
    });

    test('POST /api/vacations/:id/approve aprueba la solicitud (200)', async () => {
      const res = await request('POST', `/api/vacations/${vacationId}/approve`, null, rhToken);
      expect(res.status).toBe(200);
      expect(res.body.data.estatus).toBe('APROBADA');
    });

    test('GET /api/vacations/:id refleja el estatus final APROBADA', async () => {
      const res = await request('GET', `/api/vacations/${vacationId}`, null, empleadoToken);
      expect(res.status).toBe(200);
      expect(res.body.data.estatus).toBe('APROBADA');
      expect(res.body.data.balance).toBeDefined();
    });
  });

  describe('Autorización cruzada: un jefe no puede autorizar solicitudes ajenas', () => {
    test('POST /api/vacations/:id/authorize-jefe de otro empleado (400)', async () => {
      // rh@kram.com tiene un empleado asociado (María Rodríguez) que no reporta a jefe.vacaciones.
      const res = await request('POST', '/api/vacations', {
        fechaInicio: fechaEnDias(15),
        fechaFin: fechaEnDias(15)
      }, empleadoToken);
      const idAjeno = res.body?.data?.id;
      if (idAjeno) createdVacationIds.push(idAjeno);

      // rh@kram.com no es el jefe directo de empleado.vacaciones -> debe rechazarse con 400,
      // no con 403 (el módulo/rol sí se lo permiten, la validación de negocio es la que falla).
      const intento = await request('POST', `/api/vacations/${idAjeno}/authorize-jefe`, null, rhToken);
      expect(intento.status).toBe(400);
      expect(intento.body.error).toMatch(/no eres el jefe directo/i);
    });
  });
});
