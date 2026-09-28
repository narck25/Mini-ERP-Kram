/**
 * normalizeForMatch — usado por prepareForPrisma() al resolver departamento/
 * puesto durante la importación de empleados, para que "ADMINISTRACION" (CSV,
 * sin acento) reutilice el catálogo existente "Administración" en vez de
 * crear un departamento nuevo y fragmentar el catálogo. Ver PROJECT_CONTEXT.md.
 */
const { normalizeForMatch } = require('../../../src/utils/csvMapper');

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
