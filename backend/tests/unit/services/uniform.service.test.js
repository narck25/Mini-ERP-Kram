/**
 * Unit Tests: UniformService
 * Cubre lo agregado esta sesión: validación de inventario antes de
 * entregar (que antes se saltaba en silencio) y el modo estricto/
 * permisivo controlado por el interruptor de Admin.
 */
const mockPrisma = {
  employee: { findUnique: jest.fn(), findMany: jest.fn() },
  uniformInventory: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  uniformDelivery: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  $transaction: jest.fn((fn) => fn(mockPrisma))
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

jest.mock('../../../src/services/purchases/inventory-movement.service', () => ({
  recordMovement: jest.fn()
}));

jest.mock('../../../src/services/system-setting.service', () => ({
  isInventoryStrictMode: jest.fn()
}));

const UniformService = require('../../../src/services/purchases/uniform.service');
const { recordMovement } = require('../../../src/services/purchases/inventory-movement.service');
const { isInventoryStrictMode } = require('../../../src/services/system-setting.service');

describe('👕 UniformService.createDelivery', () => {
  beforeEach(() => jest.clearAllMocks());

  const item = { tipo: 'CAMISA', talla: 'M', genero: 'HOMBRE', cantidad: 2 };

  test('lanza error si el empleado no existe', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue(null);
    await expect(UniformService.createDelivery({ empleadoId: 'emp-1', items: [item] }, 'entregador-1', 'user-1'))
      .rejects.toThrow('Empleado no encontrado');
  });

  test('modo estricto: bloquea si el articulo no existe en inventario', async () => {
    isInventoryStrictMode.mockResolvedValue(true);
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
    mockPrisma.uniformInventory.findFirst.mockResolvedValue(null);

    await expect(UniformService.createDelivery({ empleadoId: 'emp-1', items: [item] }, 'entregador-1', 'user-1'))
      .rejects.toThrow('No existe en inventario: CAMISA talla M (HOMBRE)');

    // No debe haber intentado registrar nada si la validacion fallo
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  test('modo estricto: bloquea si no alcanza el stock', async () => {
    isInventoryStrictMode.mockResolvedValue(true);
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
    mockPrisma.uniformInventory.findFirst.mockResolvedValue({ id: 'inv-1', tipo: 'CAMISA', talla: 'M', cantidadActual: 1 });

    await expect(UniformService.createDelivery({ empleadoId: 'emp-1', items: [item] }, 'entregador-1', 'user-1'))
      .rejects.toThrow('Stock insuficiente de CAMISA talla M: hay 1, se requieren 2');
  });

  test('modo estricto: con stock suficiente, descuenta y no queda en negativo', async () => {
    isInventoryStrictMode.mockResolvedValue(true);
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
    mockPrisma.uniformInventory.findFirst.mockResolvedValue({ id: 'inv-1', tipo: 'CAMISA', talla: 'M', genero: 'HOMBRE', cantidadActual: 10 });
    mockPrisma.uniformDelivery.create.mockResolvedValue({ id: 'del-1' });

    await UniformService.createDelivery({ empleadoId: 'emp-1', items: [item] }, 'entregador-1', 'user-1');

    expect(mockPrisma.uniformInventory.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { cantidadActual: 8 }
    });
    expect(recordMovement).toHaveBeenCalled();
  });

  test('modo permisivo (default): sin inventario previo, lo crea en negativo y entrega igual', async () => {
    isInventoryStrictMode.mockResolvedValue(false);
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
    mockPrisma.uniformInventory.findFirst.mockResolvedValue(null);
    mockPrisma.uniformInventory.create.mockResolvedValue({ id: 'inv-new', tipo: 'CAMISA', talla: 'M', genero: 'HOMBRE', cantidadActual: -2 });
    mockPrisma.uniformDelivery.create.mockResolvedValue({ id: 'del-1' });

    const result = await UniformService.createDelivery({ empleadoId: 'emp-1', items: [item] }, 'entregador-1', 'user-1');

    expect(mockPrisma.uniformInventory.create).toHaveBeenCalledWith({
      data: { tipo: 'CAMISA', talla: 'M', genero: 'HOMBRE', cantidadActual: -2 }
    });
    expect(recordMovement).toHaveBeenCalled();
    expect(result).toEqual({ id: 'del-1' });
  });

  test('modo permisivo: con inventario insuficiente, descuenta igual y queda en negativo', async () => {
    isInventoryStrictMode.mockResolvedValue(false);
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
    mockPrisma.uniformInventory.findFirst.mockResolvedValue({ id: 'inv-1', tipo: 'CAMISA', talla: 'M', genero: 'HOMBRE', cantidadActual: 1 });
    mockPrisma.uniformDelivery.create.mockResolvedValue({ id: 'del-1' });

    await UniformService.createDelivery({ empleadoId: 'emp-1', items: [item] }, 'entregador-1', 'user-1');

    expect(mockPrisma.uniformInventory.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { cantidadActual: -1 }
    });
  });

  test('lanza error si no hay items', async () => {
    await expect(UniformService.createDelivery({ empleadoId: 'emp-1', items: [] }, 'entregador-1', 'user-1'))
      .rejects.toThrow('Debe agregar al menos un artículo');
  });
});
