/**
 * Periodo de Prueba (30/60/90) — flujo de dos pasos.
 * Autoevaluación del colaborador (paso 1) -> captura del evaluador (paso 2),
 * integrando el formato de RH "Evaluación Desempeño 30/60/90 Kram".
 *
 * Usa los fixtures ya existentes jefe.vacaciones@kram.mx / empleado.vacaciones@kram.mx
 * (relación real de reportaA, ver tests/12-vacaciones.test.js) para probar el
 * control de acceso jefe-directo sin depender de RH/ADMIN.
 */
const { PrismaClient } = require('@prisma/client');
const { request, getToken } = require('./helpers/setup');

const prisma = new PrismaClient();

describe('🧪 Periodo de Prueba — autoevaluación y captura', () => {
  let jefeToken = null;
  let empleadoToken = null;
  let basicToken = null;
  let evaluationId = null;
  let empleadoId = null;

  beforeAll(async () => {
    jefeToken = await getToken('jefe.vacaciones@kram.mx', 'Kram2026!');
    empleadoToken = await getToken('empleado.vacaciones@kram.mx', 'Kram2026!');
    basicToken = await getToken('nayely.mendez@kram.mx', '123456');

    if (!jefeToken || !empleadoToken || !basicToken) {
      throw new Error('No se pudo autenticar alguno de los fixtures (jefe.vacaciones / empleado.vacaciones / nayely.mendez). Verifica prisma/seed.js.');
    }

    const empleado = await prisma.employee.findFirst({ where: { user: { email: 'empleado.vacaciones@kram.mx' } } });
    if (!empleado) throw new Error('Fixture empleado.vacaciones@kram.mx sin Employee asociado.');
    empleadoId = empleado.id;

    const evaluation = await prisma.probationEvaluation.create({
      data: { empleadoId, tipo: 'DIA_30', fechaProgramada: new Date(), resultado: 'PENDIENTE' }
    });
    evaluationId = evaluation.id;
  });

  afterAll(async () => {
    if (evaluationId) await prisma.probationEvaluation.delete({ where: { id: evaluationId } }).catch(() => {});
    await prisma.$disconnect();
  });

  test('Un colaborador ajeno no puede enviar la autoevaluación de otro (403)', async () => {
    const res = await request('POST', `/api/probation-evaluations/${evaluationId}/self-evaluation`, {
      logros: 'x', retos: 'x', apoyo: 'x', integracion: 4, claridadFunciones: 4, climaLaboral: 4
    }, basicToken);
    expect(res.status).toBe(403);
  });

  test('El evaluador no puede capturar sin autoevaluación previa (400)', async () => {
    const res = await request('POST', `/api/probation-evaluations/${evaluationId}/capture`, {
      resultado: 'APROBADO'
    }, jefeToken);
    expect(res.status).toBe(400);
  });

  test('Un usuario ajeno (ni RH/ADMIN ni jefe directo) no puede capturar (403)', async () => {
    const res = await request('POST', `/api/probation-evaluations/${evaluationId}/capture`, {
      resultado: 'APROBADO'
    }, basicToken);
    expect(res.status).toBe(403);
  });

  test('La evaluación aparece en /my-pending para el propio colaborador', async () => {
    const res = await request('GET', '/api/probation-evaluations/my-pending', null, empleadoToken);
    expect(res.status).toBe(200);
    expect(res.body.data.some((ev) => ev.id === evaluationId)).toBe(true);
  });

  test('El propio colaborador envía su autoevaluación (200)', async () => {
    const res = await request('POST', `/api/probation-evaluations/${evaluationId}/self-evaluation`, {
      logros: 'Aprendí el sistema rápido', retos: 'El proceso de compras', apoyo: 'Más capacitación',
      integracion: 4, claridadFunciones: 5, climaLaboral: 4
    }, empleadoToken);
    expect(res.status).toBe(200);
    expect(res.body.data.autoevaluacionCompletadaAt).not.toBeNull();
    expect(res.body.data.autoevaluacion.logros).toBe('Aprendí el sistema rápido');
  });

  test('Ya no aparece en /my-pending una vez enviada', async () => {
    const res = await request('GET', '/api/probation-evaluations/my-pending', null, empleadoToken);
    expect(res.status).toBe(200);
    expect(res.body.data.some((ev) => ev.id === evaluationId)).toBe(false);
  });

  test('El colaborador no puede reenviar su autoevaluación (400)', async () => {
    const res = await request('POST', `/api/probation-evaluations/${evaluationId}/self-evaluation`, {
      logros: 'x', retos: 'x', apoyo: 'x', integracion: 3, claridadFunciones: 3, climaLaboral: 3
    }, empleadoToken);
    expect(res.status).toBe(400);
  });

  test('El jefe directo captura la evaluación completa tras la autoevaluación (200)', async () => {
    const res = await request('POST', `/api/probation-evaluations/${evaluationId}/capture`, {
      resultado: 'APROBADO',
      comentarios: 'Buen desempeño en el primer mes',
      objetivos: [{ descripcion: 'Dominio del ERP', hito: '30 días', ponderacion: 100, logro: '95%', calificacion: 4, observaciones: '' }],
      competencias: { aptitudTecnica: 4, trabajoEquipo: 5, comunicacion: 4, liderazgo: 4, resolucionConflictos: 4, apegoCultura: 5 },
      habitos: { asistencia: { calificacion: 5, comentarios: '' }, ordenLimpieza: { calificacion: 4, comentarios: '' }, cumplimientoNormas: { calificacion: 5, comentarios: '' } },
      fortalezas: ['Aprende rápido'],
      areasMejora: ['Mejorar tiempos de respuesta'],
      planAccion: [{ accion: 'Curso de Excel avanzado', objetivo: 'Reportes más rápidos', fechaCompromiso: '2026-11-01', indicador: 'Certificado del curso' }],
      minutaRetroalimentacion: 'Buena reunión, colaborador motivado.'
    }, jefeToken);
    expect(res.status).toBe(200);
    expect(res.body.data.resultado).toBe('APROBADO');
  });

  test('GET del detalle refleja lo capturado', async () => {
    const res = await request('GET', `/api/probation-evaluations/${evaluationId}`, null, jefeToken);
    expect(res.status).toBe(200);
    expect(res.body.data.resultado).toBe('APROBADO');
    expect(res.body.data.objetivos.length).toBe(1);
    expect(res.body.data.competencias.aptitudTecnica).toBe(4);
  });
});
