/**
 * Configuración del sistema (modo estricto de inventario) — sin cobertura
 * automatizada previa (ver PROJECT_CONTEXT.md §12.4). GET: cualquiera con
 * módulo COMPRAS. PUT: solo ADMIN.
 *
 * El valor es un ajuste GLOBAL, no por usuario — se restaura al valor
 * original en afterAll para no afectar otras pruebas ni dejar el ambiente
 * de prueba en un estado distinto al que tenía antes de correr.
 */
const { request, getToken } = require('./helpers/setup');

describe('🧪 Configuración del sistema — modo estricto de inventario', () => {
  let comprasToken = null;
  let noComprasToken = null;
  let adminToken = null;
  let originalEnabled = null;

  beforeAll(async () => {
    comprasToken = await getToken('nayely.mendez@kram.mx', '123456');
    noComprasToken = await getToken('jefe.vacaciones@kram.mx', 'Kram2026!');
    adminToken = await getToken();
    if (!comprasToken || !noComprasToken || !adminToken) {
      throw new Error('No se pudo autenticar alguno de los fixtures. Verifica prisma/seed.js.');
    }

    const current = await request('GET', '/api/settings/inventory-strict-mode', null, adminToken);
    originalEnabled = current.body?.data?.enabled ?? false;
  });

  afterAll(async () => {
    if (originalEnabled !== null) {
      await request('PUT', '/api/settings/inventory-strict-mode', { enabled: originalEnabled }, adminToken);
    }
  });

  test('Sin el módulo COMPRAS no puede consultar (403)', async () => {
    const res = await request('GET', '/api/settings/inventory-strict-mode', null, noComprasToken);
    expect(res.status).toBe(403);
  });

  test('Con módulo COMPRAS (sin ser ADMIN) sí puede consultar (200)', async () => {
    const res = await request('GET', '/api/settings/inventory-strict-mode', null, comprasToken);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.enabled).toBe('boolean');
  });

  test('Un usuario que no es ADMIN no puede cambiar la configuración (403)', async () => {
    const res = await request('PUT', '/api/settings/inventory-strict-mode', { enabled: true }, comprasToken);
    expect(res.status).toBe(403);
  });

  test('ADMIN activa el modo estricto y la lectura lo refleja (200)', async () => {
    const put = await request('PUT', '/api/settings/inventory-strict-mode', { enabled: true }, adminToken);
    expect(put.status).toBe(200);
    expect(put.body.data.enabled).toBe(true);

    const get = await request('GET', '/api/settings/inventory-strict-mode', null, adminToken);
    expect(get.status).toBe(200);
    expect(get.body.data.enabled).toBe(true);
  });

  test('ADMIN desactiva el modo estricto y la lectura lo refleja (200)', async () => {
    const put = await request('PUT', '/api/settings/inventory-strict-mode', { enabled: false }, adminToken);
    expect(put.status).toBe(200);
    expect(put.body.data.enabled).toBe(false);

    const get = await request('GET', '/api/settings/inventory-strict-mode', null, adminToken);
    expect(get.status).toBe(200);
    expect(get.body.data.enabled).toBe(false);
  });
});

/**
 * Interruptores de Periodo de Prueba y Evaluación Operativa — pausan el cron
 * diario sin necesitar un deploy. GET/PUT: solo RH/ADMIN (mismo nivel que el
 * resto de esos módulos). Default: activado (comportamiento previo al switch).
 */
describe('🧪 Configuración del sistema — interruptores de Periodo de Prueba y Evaluación Operativa', () => {
  let rhToken = null;
  let noRhToken = null;
  let adminToken = null;
  let originalProbation = null;
  let originalOperational = null;

  const KEYS = [
    { path: 'probation-evaluations-enabled', label: 'Periodo de Prueba' },
    { path: 'operational-evaluations-enabled', label: 'Evaluación Operativa' },
  ];

  beforeAll(async () => {
    rhToken = await getToken('rh@kram.com', 'password123');
    noRhToken = await getToken('jefe.vacaciones@kram.mx', 'Kram2026!');
    adminToken = await getToken();
    if (!rhToken || !noRhToken || !adminToken) {
      throw new Error('No se pudo autenticar alguno de los fixtures. Verifica prisma/seed.js.');
    }

    const probation = await request('GET', '/api/settings/probation-evaluations-enabled', null, adminToken);
    originalProbation = probation.body?.data?.enabled ?? true;
    const operational = await request('GET', '/api/settings/operational-evaluations-enabled', null, adminToken);
    originalOperational = operational.body?.data?.enabled ?? true;
  });

  afterAll(async () => {
    if (originalProbation !== null) {
      await request('PUT', '/api/settings/probation-evaluations-enabled', { enabled: originalProbation }, adminToken);
    }
    if (originalOperational !== null) {
      await request('PUT', '/api/settings/operational-evaluations-enabled', { enabled: originalOperational }, adminToken);
    }
  });

  test.each(KEYS)('Por defecto vienen activados ($label)', async ({ path }) => {
    // Se restablece a "true" antes de leer, ya que otra prueba pudo haberlo apagado.
    await request('PUT', `/api/settings/${path}`, { enabled: true }, adminToken);
    const res = await request('GET', `/api/settings/${path}`, null, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.enabled).toBe(true);
  });

  test.each(KEYS)('Sin RH ni ADMIN no puede consultar ni cambiar ($label)', async ({ path }) => {
    const get = await request('GET', `/api/settings/${path}`, null, noRhToken);
    expect(get.status).toBe(403);
    const put = await request('PUT', `/api/settings/${path}`, { enabled: false }, noRhToken);
    expect(put.status).toBe(403);
  });

  test.each(KEYS)('RH puede apagarlo y volver a prenderlo ($label)', async ({ path }) => {
    const off = await request('PUT', `/api/settings/${path}`, { enabled: false }, rhToken);
    expect(off.status).toBe(200);
    expect(off.body.data.enabled).toBe(false);

    const get = await request('GET', `/api/settings/${path}`, null, rhToken);
    expect(get.body.data.enabled).toBe(false);

    const on = await request('PUT', `/api/settings/${path}`, { enabled: true }, rhToken);
    expect(on.body.data.enabled).toBe(true);
  });
});
