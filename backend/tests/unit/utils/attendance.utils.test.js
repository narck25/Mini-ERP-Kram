const { parseZKTecoDate, buildDateFilter } = require('../../../src/utils/attendance.utils');

describe('parseZKTecoDate', () => {
  test('hora estándar de la mañana', () => {
    const result = parseZKTecoDate('25/02/2026 08:26:17 a. m.');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1); // febrero (0-indexed)
    expect(result.getDate()).toBe(25);
    expect(result.getHours()).toBe(8);
    expect(result.getMinutes()).toBe(26);
    expect(result.getSeconds()).toBe(17);
  });

  test('medianoche (12 a. m. -> hora 0)', () => {
    const result = parseZKTecoDate('01/01/2026 12:15:00 a. m.');
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(15);
  });

  test('mediodía (12 p. m. -> hora 12, sin cambio)', () => {
    const result = parseZKTecoDate('01/01/2026 12:15:00 p. m.');
    expect(result.getHours()).toBe(12);
  });

  test('conversión p. m. (11:59 p. m. -> hora 23)', () => {
    const result = parseZKTecoDate('01/01/2026 11:59:00 p. m.');
    expect(result.getHours()).toBe(23);
  });

  test('entrada malformada: regresa la fecha/hora actual (comportamiento existente)', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-01T10:00:00'));
    const result = parseZKTecoDate('esto no es una fecha');
    expect(result.getTime()).toBe(new Date('2026-05-01T10:00:00').getTime());
    jest.useRealTimers();
  });

  test('día de un solo dígito: no coincide con el regex, regresa la fecha/hora actual', () => {
    // Caracteriza el comportamiento actual (el regex exige \d{2}) — no es una corrección aquí.
    jest.useFakeTimers().setSystemTime(new Date('2026-05-01T10:00:00'));
    const result = parseZKTecoDate('5/02/2026 08:26:17 a. m.');
    expect(result.getTime()).toBe(new Date('2026-05-01T10:00:00').getTime());
    jest.useRealTimers();
  });
});

describe('buildDateFilter', () => {
  test('rango válido produce gte/lte correctos', () => {
    // Se comparan componentes de fecha LOCALES (no toISOString) porque buildDateFilter
    // construye las fechas en la zona horaria local del servidor, y toISOString() las
    // convierte a UTC — comparar el string UTC sería frágil según el huso horario de CI.
    const { valid, filter } = buildDateFilter('2026-01-01', '2026-01-31');
    expect(valid).toBe(true);
    expect(filter.fechaHora.gte.getFullYear()).toBe(2026);
    expect(filter.fechaHora.gte.getMonth()).toBe(0);
    expect(filter.fechaHora.gte.getDate()).toBe(1);
    expect(filter.fechaHora.gte.getHours()).toBe(0);
    expect(filter.fechaHora.lte.getFullYear()).toBe(2026);
    expect(filter.fechaHora.lte.getMonth()).toBe(0);
    expect(filter.fechaHora.lte.getDate()).toBe(31);
    expect(filter.fechaHora.lte.getHours()).toBe(23);
  });

  test('fecha de inicio inválida -> valid:false', () => {
    const { valid } = buildDateFilter('fecha-invalida', '2026-01-31');
    expect(valid).toBe(false);
  });

  test('fecha de fin inválida -> valid:false', () => {
    const { valid } = buildDateFilter('2026-01-01', 'fecha-invalida');
    expect(valid).toBe(false);
  });

  test('end antes que start: no se valida (comportamiento existente, no se agrega validación nueva)', () => {
    const { valid, filter } = buildDateFilter('2026-01-31', '2026-01-01');
    expect(valid).toBe(true);
    expect(filter.fechaHora.gte.getTime()).toBeGreaterThan(filter.fechaHora.lte.getTime());
  });
});
