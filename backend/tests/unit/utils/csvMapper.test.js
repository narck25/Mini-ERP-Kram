/**
 * normalizeForMatch — usado por prepareForPrisma() al resolver departamento/
 * puesto durante la importación de empleados, para que "ADMINISTRACION" (CSV,
 * sin acento) reutilice el catálogo existente "Administración" en vez de
 * crear un departamento nuevo y fragmentar el catálogo. Ver PROJECT_CONTEXT.md.
 */
const { normalizeForMatch, mapEmployeeFromCsv } = require('../../../src/utils/csvMapper');

describe('🧪 csvMapper — normalizeForMatch', () => {
  test('ignora mayúsculas', () => {
    expect(normalizeForMatch('ADMINISTRACION')).toBe(normalizeForMatch('administracion'));
  });

  test('ignora acentos', () => {
    expect(normalizeForMatch('ADMINISTRACION')).toBe(normalizeForMatch('Administración'));
    expect(normalizeForMatch('JEFE DE ALMACEN')).toBe(normalizeForMatch('JEFE DE ALMACÉN'));
  });

  test('ignora espacios al inicio/final', () => {
    expect(normalizeForMatch('  CONTABILIDAD  ')).toBe(normalizeForMatch('Contabilidad'));
  });

  test('nombres genuinamente distintos no colapsan al mismo valor', () => {
    expect(normalizeForMatch('ALMACEN')).not.toBe(normalizeForMatch('ALMACENISTA'));
    expect(normalizeForMatch('CHOFER')).not.toBe(normalizeForMatch('CHOFER REPARTO'));
  });

  test('nulo/vacío no rompe', () => {
    expect(normalizeForMatch(null)).toBe('');
    expect(normalizeForMatch(undefined)).toBe('');
    expect(normalizeForMatch('')).toBe('');
  });
});

/**
 * parseDate (dentro de mapEmployeeFromCsv) — caso real detectado en producción:
 * el CSV traía "01/11/1993" y quedó guardado como 1993-10-31 en BD. Causa:
 * `new Date(year, month, day)` construye la fecha en la zona horaria LOCAL
 * del proceso; en el contenedor de producción (con una zona adelantada a
 * UTC) la medianoche local cae en el día UTC anterior. El fix usa
 * `Date.UTC(...)` para que el resultado sea siempre el mismo sin importar
 * en qué zona horaria corra el proceso.
 */
describe('🧪 csvMapper — parseDate no depende de la zona horaria del proceso', () => {
  const TZ_ORIGINAL = process.env.TZ;
  afterEach(() => { process.env.TZ = TZ_ORIGINAL; });

  test.each([
    'America/Mexico_City', // UTC-6 (dev/local) — no reproducía el bug
    'UTC',
    'Europe/Madrid',       // UTC+1/+2 — la zona que reprodujo el bug real
    'Asia/Tokyo',          // UTC+9
  ])('formato DD/MM/YYYY da la misma fecha UTC sin importar TZ=%s', (tz) => {
    process.env.TZ = tz;
    const mapped = mapEmployeeFromCsv({ 'FECHA NACIMIENTO': '01/11/1993' }, null);
    expect(mapped.fechaNacimiento.toISOString()).toBe('1993-11-01T00:00:00.000Z');
  });

  test.each([
    'America/Mexico_City',
    'UTC',
    'Europe/Madrid',
    'Asia/Tokyo',
  ])('formato YYYY-MM-DD da la misma fecha UTC sin importar TZ=%s', (tz) => {
    process.env.TZ = tz;
    const mapped = mapEmployeeFromCsv({ 'FECHA ALTA': '2025-12-22' }, null);
    expect(mapped.fechaAlta.toISOString()).toBe('2025-12-22T00:00:00.000Z');
  });

  test('fecha invalida (31/02) sigue rechazandose en cualquier TZ', () => {
    process.env.TZ = 'Europe/Madrid';
    const mapped = mapEmployeeFromCsv({ 'FECHA NACIMIENTO': '31/02/2024' }, null);
    expect(mapped.fechaNacimiento).toBeNull();
  });
});
