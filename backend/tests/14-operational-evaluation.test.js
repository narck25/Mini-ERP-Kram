/**
 * Evaluación Operativa Trimestral — formato de RH "Evaluación de Desempeño
 * Operativo KRAM" (6 puestos operativos, evaluador único: jefe directo, sin
 * autoevaluación previa a diferencia del 30/60/90).
 *
 * Usa los fixtures ya existentes jefe.vacaciones@kram.mx / empleado.vacaciones@kram.mx
 * (relación real de reportaA, ver tests/12-vacaciones.test.js) para probar el
 * control de acceso jefe-directo sin depender de RH/ADMIN. El puesto real del
 * fixture no importa: `puesto` se guarda como snapshot en la propia evaluación.
 */
const { PrismaClient } = require('@prisma/client');
const { request, getToken } = require('./helpers/setup');

const prisma = new PrismaClient();

// Chofer — pesos tomados de operationalEvaluationCriteria.config.js.
// Con todas las calificaciones en 5 (máximo), cada criterio aporta su peso
// completo: subtotal rh=30, actitud=20, desempeno=50 → final=100.
const CRITERIOS_CHOFER_PERFECTOS = {
  rh: { puntualidad: 5, incidenciasViales: 5, bitacoraUnidad: 5 },
  actitud: { atencionClientes: 5, responsabilidad: 5, comunicacionOficina: 5 },
  desempeno: { entregasCompletas: 5, firmasRecibido: 5, reporteIncidenciasDia: 5, exactitudConteo: 5, planificacionRuta: 5 },
};

describe('🧪 Evaluación Operativa Trimestral — captura por el jefe directo', () => {
  let jefeToken = null;
  let adminToken = null;
  let basicToken = null;
  let evaluationId = null;
  let evaluationBadPuestoId = null;
  let empleadoId = null;

  beforeAll(async () => {
    jefeToken = await getToken('jefe.vacaciones@kram.mx', 'Kram2026!');
    adminToken = await getToken();
    basicToken = await getToken('nayely.mendez@kram.mx', '123456');

    if (!jefeToken || !adminToken || !basicToken) {
      throw new Error('No se pudo autenticar alguno de los fixtures (jefe.vacaciones / admin / nayely.mendez). Verifica prisma/seed.js.');
    }

    const empleado = await prisma.employee.findFirst({ where: { user: { email: 'empleado.vacaciones@kram.mx' } } });
    if (!empleado) throw new Error('Fixture empleado.vacaciones@kram.mx sin Employee asociado.');
    empleadoId = empleado.id;

    const evaluation = await prisma.operationalEvaluation.create({
      data: { empleadoId, puesto: 'Chofer', periodo: 1, fechaProgramada: new Date(), resultado: 'PENDIENTE' }
    });
    evaluationId = evaluation.id;

    const evaluationBadPuesto = await prisma.operationalEvaluation.create({
      data: { empleadoId, puesto: 'Puesto Que No Existe', periodo: 2, fechaProgramada: new Date(), resultado: 'PENDIENTE' }
    });
    evaluationBadPuestoId = evaluationBadPuesto.id;
  });

  afterAll(async () => {
    if (evaluationId) await prisma.operationalEvaluation.delete({ where: { id: evaluationId } }).catch(() => {});
    if (evaluationBadPuestoId) await prisma.operationalEvaluation.delete({ where: { id: evaluationBadPuestoId } }).catch(() => {});
    await prisma.$disconnect();
  });

  test('Un usuario ajeno (ni RH/ADMIN ni jefe directo) no puede capturar (403)', async () => {
    const res = await request('POST', `/api/operational-evaluations/${evaluationId}/capture`, {
      criterios: CRITERIOS_CHOFER_PERFECTOS
    }, basicToken);
    expect(res.status).toBe(403);
  });

  test('Falta un criterio por calificar (400)', async () => {
    const incompleto = JSON.parse(JSON.stringify(CRITERIOS_CHOFER_PERFECTOS));
    delete incompleto.rh.puntualidad;
    const res = await request('POST', `/api/operational-evaluations/${evaluationId}/capture`, {
      criterios: incompleto
    }, jefeToken);
    expect(res.status).toBe(400);
  });

  test('No hay plantilla de criterios para un puesto desconocido (400)', async () => {
    const res = await request('POST', `/api/operational-evaluations/${evaluationBadPuestoId}/capture`, {
      criterios: CRITERIOS_CHOFER_PERFECTOS
    }, jefeToken);
    expect(res.status).toBe(400);
  });

  test('La evaluación aparece en pending-for-jefe antes de capturarse', async () => {
    const res = await request('GET', '/api/operational-evaluations/pending-for-jefe', null, jefeToken);
    expect(res.status).toBe(200);
    expect(res.body.data.some((ev) => ev.id === evaluationId)).toBe(true);
  });

  test('El endpoint de plantillas expone los 6 puestos con sus criterios', async () => {
    const res = await request('GET', '/api/operational-evaluations/criteria-templates', null, jefeToken);
    expect(res.status).toBe(200);
    expect(res.body.data.puestos).toEqual(
      expect.arrayContaining(['Ayudante General', 'Chofer', 'Almacenista', 'Preventista', 'Promotor', 'Degustador'])
    );
    expect(res.body.data.templates.Chofer.rh.length).toBeGreaterThan(0);
  });

  test('El jefe directo captura la evaluación completa (200) y calcula el puntaje correctamente', async () => {
    const res = await request('POST', `/api/operational-evaluations/${evaluationId}/capture`, {
      criterios: CRITERIOS_CHOFER_PERFECTOS,
      fortalezas: 'Muy responsable con la unidad',
      areasMejora: 'Ninguna por ahora',
      compromisos: 'Mantener el nivel',
      observaciones: 'Evaluación de prueba automatizada'
    }, jefeToken);
    expect(res.status).toBe(200);
    expect(res.body.data.subtotalRH).toBe(30);
    expect(res.body.data.subtotalActitud).toBe(20);
    expect(res.body.data.subtotalDesempeno).toBe(50);
    expect(res.body.data.calificacionFinal).toBe(100);
    expect(res.body.data.resultado).toBe('APROBADO_DISTINCION');
  });

  test('Ya no aparece en pending-for-jefe una vez capturada', async () => {
    const res = await request('GET', '/api/operational-evaluations/pending-for-jefe', null, jefeToken);
    expect(res.status).toBe(200);
    expect(res.body.data.some((ev) => ev.id === evaluationId)).toBe(false);
  });

  test('GET del detalle refleja lo capturado, incluso para RH/ADMIN', async () => {
    const res = await request('GET', `/api/operational-evaluations/${evaluationId}`, null, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.resultado).toBe('APROBADO_DISTINCION');
    expect(res.body.data.criterios.rh.puntualidad).toBe(5);
    expect(res.body.data.evaluador).not.toBeNull();
  });

  test('Un ajeno no puede ver el detalle (403)', async () => {
    const res = await request('GET', `/api/operational-evaluations/${evaluationId}`, null, basicToken);
    expect(res.status).toBe(403);
  });

  test('La lista completa solo es accesible para RH/ADMIN (403 para otros roles)', async () => {
    const res = await request('GET', '/api/operational-evaluations', null, jefeToken);
    expect(res.status).toBe(403);
  });

  test('RH/ADMIN sí puede ver la lista completa (200)', async () => {
    const res = await request('GET', '/api/operational-evaluations', null, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.some((ev) => ev.id === evaluationId)).toBe(true);
  });
});
