/**
 * Unit Tests: VacationService
 * Pruebas del cálculo de saldo y del flujo de autorización del jefe.
 */
const VacationService = require('../../../src/services/vacaciones/vacation.service');

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    employee: { findUnique: jest.fn(), findMany: jest.fn() },
    vacationRequest: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() }
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('🏖️ VacationService.getBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-17'));
  });
  afterEach(() => jest.useRealTimers());

  test('días disponibles = corresponden - usados', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 'e1', fechaAlta: new Date('2020-01-15') });
    prisma.vacationRequest.findMany.mockResolvedValue([
      { fechaInicio: new Date('2026-01-10'), fechaFin: new Date('2026-01-14') } // 5 días
    ]);

    const b = await VacationService.getBalance('e1');

    expect(b.antiguedad).toBe(6);
    expect(b.diasCorresponden).toBe(22);
    expect(b.diasUsados).toBe(5);
    expect(b.diasDisponibles).toBe(17);
  });

  test('lanza error si el empleado no existe', async () => {
    prisma.employee.findUnique.mockResolvedValue(null);
    await expect(VacationService.getBalance('nope')).rejects.toThrow('Empleado no encontrado');
  });

  test('disponibles = corresponden si no hay solicitudes aprobadas', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 'e1', fechaAlta: new Date('2020-01-15') });
    prisma.vacationRequest.findMany.mockResolvedValue([]);

    const b = await VacationService.getBalance('e1');
    expect(b.diasUsados).toBe(0);
    expect(b.diasDisponibles).toBe(22);
  });

  test('menos de 6 meses de antigüedad → 0 días disponibles', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 'e1', fechaAlta: new Date('2026-06-01') });

    const b = await VacationService.getBalance('e1');

    expect(b.antiguedad).toBe(0);
    expect(b.diasCorresponden).toBe(0);
    expect(b.diasUsados).toBe(0);
    expect(b.diasDisponibles).toBe(0);
    expect(b.reglaAplicada).toBe('MENOR_6_MESES');
  });

  test('6 meses o más (primer año) → días según tabla (12)', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 'e1', fechaAlta: new Date('2026-02-01') });
    prisma.vacationRequest.findMany.mockResolvedValue([]);

    const b = await VacationService.getBalance('e1');

    expect(b.diasCorresponden).toBe(12);
    expect(b.diasDisponibles).toBe(12);
    expect(b.reglaAplicada).toBeUndefined();
  });
});

describe('🏖️ VacationService.listEmployeeBalances', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-17'));
  });
  afterEach(() => jest.useRealTimers());

  test('devuelve lista con saldo por empleado activo', async () => {
    prisma.employee.findMany.mockResolvedValue([
      {
        id: 'e1',
        clave: '1001',
        nombres: 'Juan',
        apellidoPaterno: 'Perez',
        apellidoMaterno: 'Lopez',
        fechaAlta: new Date('2020-01-15'),
        departamento: { nombre: 'Sistemas' },
        puesto: { nombre: 'Analista' }
      }
    ]);
    prisma.employee.findUnique.mockResolvedValue({ id: 'e1', fechaAlta: new Date('2020-01-15') });
    prisma.vacationRequest.findMany.mockResolvedValue([]);

    const list = await VacationService.listEmployeeBalances();

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: 'e1',
      clave: '1001',
      nombreCompleto: 'Juan Perez Lopez',
      departamento: 'Sistemas',
      puesto: 'Analista',
      diasCorresponden: 22,
      diasUsados: 0,
      diasDisponibles: 22
    });
  });
});

describe('🏖️ VacationService.authorizeByJefe', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza si el usuario no es el jefe directo', async () => {
    prisma.vacationRequest.findUnique.mockResolvedValue({
      id: 'v1',
      estatus: 'PENDIENTE',
      empleado: { reportaAId: 'jefe1', nombres: 'X', apellidoPaterno: 'Y' }
    });
    prisma.employee.findUnique.mockResolvedValue({ id: 'otro', userId: 'u2' });

    await expect(VacationService.authorizeByJefe('v1', { id: 'u2' })).rejects.toThrow('No eres el jefe directo');
  });

  test('rechaza si la solicitud no está pendiente', async () => {
    prisma.vacationRequest.findUnique.mockResolvedValue({
      id: 'v1',
      estatus: 'APROBADA',
      empleado: { reportaAId: 'jefe1', nombres: 'X', apellidoPaterno: 'Y' }
    });

    await expect(VacationService.authorizeByJefe('v1', { id: 'u2' })).rejects.toThrow('Solo se pueden autorizar solicitudes pendientes');
  });
});
