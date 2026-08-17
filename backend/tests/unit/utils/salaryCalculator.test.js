/**
 * Unit Tests: salaryCalculator
 * Pruebas para el cálculo de antigüedad, días de vacaciones y factores LFT.
 */
const {
  calcularAntiguedad,
  obtenerFactorPorAntiguedad,
  calcularSD,
  calcularSDI,
  calcularTodo
} = require('../../../src/utils/salaryCalculator');

describe('🧮 salaryCalculator', () => {
  describe('obtenerFactorPorAntiguedad', () => {
    test('año 1 → 12 días', () => {
      expect(obtenerFactorPorAntiguedad(1).diasVacaciones).toBe(12);
    });
    test('año 3 → 16 días', () => {
      expect(obtenerFactorPorAntiguedad(3).diasVacaciones).toBe(16);
    });
    test('año 5 → 20 días', () => {
      expect(obtenerFactorPorAntiguedad(5).diasVacaciones).toBe(20);
    });
    test('año 6 → 22 días', () => {
      expect(obtenerFactorPorAntiguedad(6).diasVacaciones).toBe(22);
    });
    test('año 15 → 24 días', () => {
      expect(obtenerFactorPorAntiguedad(15).diasVacaciones).toBe(24);
    });
    test('año 26 → 30 días', () => {
      expect(obtenerFactorPorAntiguedad(26).diasVacaciones).toBe(30);
    });
    test('clamp mínimo: 0 → año 1 (12 días)', () => {
      expect(obtenerFactorPorAntiguedad(0).diasVacaciones).toBe(12);
    });
    test('clamp máximo: 100 → año 30 (30 días)', () => {
      expect(obtenerFactorPorAntiguedad(100).diasVacaciones).toBe(30);
    });
  });

  describe('calcularAntiguedad', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-08-17'));
    });
    afterAll(() => jest.useRealTimers());

    test('6 años completos desde 2020-01-15', () => {
      expect(calcularAntiguedad(new Date('2020-01-15'))).toBe(6);
    });
    test('sin fecha → 1 (mínimo)', () => {
      expect(calcularAntiguedad(null)).toBe(1);
    });
    test('menos de 1 año → 1 (mínimo)', () => {
      expect(calcularAntiguedad(new Date('2026-01-01'))).toBe(1);
    });
  });

  describe('calcularSD / calcularSDI / calcularTodo', () => {
    test('calcularSD divide entre 30', () => {
      expect(calcularSD(15000)).toBe(500);
    });
    test('calcularSD null si no hay salario', () => {
      expect(calcularSD(0)).toBe(null);
    });
    test('calcularSDI multiplica por factor', () => {
      expect(calcularSDI(500, 2)).toBe(1000);
    });
    test('calcularTodo devuelve antigüedad y días de vacaciones', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-08-17'));
      const r = calcularTodo(15000, new Date('2020-01-15'));
      expect(r.antiguedad).toBe(6);
      expect(r.diasVacaciones).toBe(22);
      jest.useRealTimers();
    });
    test('calcularTodo con salario nulo devuelve nulls', () => {
      const r = calcularTodo(0, new Date('2020-01-15'));
      expect(r.sd).toBeNull();
      expect(r.sdi).toBeNull();
    });
  });
});
