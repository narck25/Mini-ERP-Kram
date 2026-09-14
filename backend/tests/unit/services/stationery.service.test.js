/**
 * Unit Tests: StationeryService
 * Cubre lo agregado esta sesión: creación con departamento por default,
 * entrega parcial (con y sin modo estricto de inventario), y cierre por
 * el solicitante.
 */
const mockPrisma = {
  stationeryRequest: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  stationeryItem: { update: jest.fn(), findMany: jest.fn() },
  stationeryInventory: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), findMany: jest.fn(), delete: jest.fn() },
  employee: { findUnique: jest.fn() }
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

const StationeryService = require('../../../src/services/purchases/stationery.service');
const { recordMovement } = require('../../../src/services/purchases/inventory-movement.service');
const { isInventoryStrictMode } = require('../../../src/services/system-setting.service');

describe('📎 StationeryService.createRequest', () => {
  beforeEach(() => jest.clearAllMocks());

  test('mapea nombre→producto, aplica defaults, y usa el departamento del propio empleado si no se manda', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue({ departamento_id: 'dep-1' });
    mockPrisma.stationeryRequest.create.mockResolvedValue({ id: 'req-1' });

    await StationeryService.createRequest(
      { items: [{ nombre: 'Plumas', cantidad: '3', categoria: 'PAPELERIA' }] },
      'emp-1'
    );

    expect(mockPrisma.employee.findUnique).toHaveBeenCalledWith({
      where: { id: 'emp-1' },
      select: { departamento_id: true }
    });
    const callArg = mockPrisma.stationeryRequest.create.mock.calls[0][0];
    expect(callArg.data.departamentoId).toBe('dep-1');
    expect(callArg.data.items.create[0]).toMatchObject({
      producto: 'Plumas',
      categoria: 'PAPELERIA',
      cantidad: 3
    });
  });

  test('lanza error si no hay items', async () => {
    await expect(StationeryService.createRequest({ items: [] }, 'emp-1'))
      .rejects.toThrow('Debe agregar al menos un artículo');
  });

  test('lanza error si no se puede determinar el departamento', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue(null);
    await expect(StationeryService.createRequest({ items: [{ nombre: 'X', cantidad: 1 }] }, 'emp-1'))
      .rejects.toThrow('No se pudo determinar el departamento');
  });
});

describe('📎 StationeryService.deliverRequest', () => {
  beforeEach(() => jest.clearAllMocks());

  const baseRequest = {
    id: 'req-1',
    estatus: 'PENDIENTE',
    items: [
      { id: 'item-1', producto: 'Plumas', categoria: 'PAPELERIA', cantidad: 10, cantidadEntregada: 0 }
    ]
  };

  test('rechaza entregar más de lo que queda pendiente del ítem', async () => {
    mockPrisma.stationeryRequest.findUnique.mockResolvedValue(baseRequest);

    await expect(
      StationeryService.deliverRequest('req-1', 'entregador-1', 'user-1', [{ itemId: 'item-1', cantidad: 15 }])
    ).rejects.toThrow('solo quedan 10 pendientes');
  });

  test('modo estricto: bloquea si el producto no existe en inventario', async () => {
    isInventoryStrictMode.mockResolvedValue(true);
    mockPrisma.stationeryRequest.findUnique.mockResolvedValue(baseRequest);
    mockPrisma.stationeryInventory.findUnique.mockResolvedValue(null);

    await expect(
      StationeryService.deliverRequest('req-1', 'entregador-1', 'user-1', [{ itemId: 'item-1', cantidad: 5 }])
    ).rejects.toThrow('No existe en inventario: Plumas');
  });

  test('modo estricto: bloquea si no alcanza el stock', async () => {
    isInventoryStrictMode.mockResolvedValue(true);
    mockPrisma.stationeryRequest.findUnique.mockResolvedValue(baseRequest);
    mockPrisma.stationeryInventory.findUnique.mockResolvedValue({ id: 'inv-1', producto: 'Plumas', cantidadActual: 2 });

    await expect(
      StationeryService.deliverRequest('req-1', 'entregador-1', 'user-1', [{ itemId: 'item-1', cantidad: 5 }])
    ).rejects.toThrow('Stock insuficiente de Plumas: hay 2, se requieren 5');
  });

  test('modo permisivo (default): sin inventario previo, lo crea en negativo y entrega igual', async () => {
    isInventoryStrictMode.mockResolvedValue(false);
    mockPrisma.stationeryRequest.findUnique.mockResolvedValue(baseRequest);
    mockPrisma.stationeryInventory.findUnique.mockResolvedValue(null);
    mockPrisma.stationeryInventory.create.mockResolvedValue({ id: 'inv-new', producto: 'Plumas', cantidadActual: -5 });
    mockPrisma.stationeryItem.findMany.mockResolvedValue([{ id: 'item-1', cantidad: 10, cantidadEntregada: 5 }]);
    mockPrisma.stationeryRequest.update.mockResolvedValue({ id: 'req-1', estatus: 'ENTREGADO_PARCIAL' });

    const result = await StationeryService.deliverRequest('req-1', 'entregador-1', 'user-1', [{ itemId: 'item-1', cantidad: 5 }]);

    expect(mockPrisma.stationeryInventory.create).toHaveBeenCalledWith({
      data: { producto: 'Plumas', categoria: 'PAPELERIA', cantidadActual: -5 }
    });
    expect(recordMovement).toHaveBeenCalled();
    expect(result.estatus).toBe('ENTREGADO_PARCIAL');
  });

  test('entrega completa todos los ítems → estatus ENTREGADO', async () => {
    isInventoryStrictMode.mockResolvedValue(false);
    mockPrisma.stationeryRequest.findUnique.mockResolvedValue(baseRequest);
    mockPrisma.stationeryInventory.findUnique.mockResolvedValue({ id: 'inv-1', producto: 'Plumas', cantidadActual: 50 });
    mockPrisma.stationeryItem.findMany.mockResolvedValue([{ id: 'item-1', cantidad: 10, cantidadEntregada: 10 }]);
    mockPrisma.stationeryRequest.update.mockResolvedValue({ id: 'req-1', estatus: 'ENTREGADO' });

    const result = await StationeryService.deliverRequest('req-1', 'entregador-1', 'user-1', [{ itemId: 'item-1', cantidad: 10 }]);

    expect(mockPrisma.stationeryRequest.update.mock.calls[0][0].data.estatus).toBe('ENTREGADO');
    expect(result.estatus).toBe('ENTREGADO');
  });

  test('rechaza si la solicitud ya está ENTREGADO o CANCELADO', async () => {
    mockPrisma.stationeryRequest.findUnique.mockResolvedValue({ ...baseRequest, estatus: 'CANCELADO' });

    await expect(
      StationeryService.deliverRequest('req-1', 'entregador-1', 'user-1', [{ itemId: 'item-1', cantidad: 1 }])
    ).rejects.toThrow('Solo puedes entregar solicitudes pendientes o parcialmente entregadas');
  });
});

describe('📎 StationeryService.closeRequest', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza si no es el dueño', async () => {
    mockPrisma.stationeryRequest.findUnique.mockResolvedValue({ id: 'req-1', solicitanteId: 'otro', estatus: 'ENTREGADO_PARCIAL' });

    await expect(StationeryService.closeRequest('req-1', 'emp-1'))
      .rejects.toThrow('No puedes cerrar una solicitud que no te pertenece');
  });

  test('rechaza si no está en ENTREGADO_PARCIAL', async () => {
    mockPrisma.stationeryRequest.findUnique.mockResolvedValue({ id: 'req-1', solicitanteId: 'emp-1', estatus: 'PENDIENTE' });

    await expect(StationeryService.closeRequest('req-1', 'emp-1'))
      .rejects.toThrow('Solo puedes cerrar solicitudes con entrega parcial');
  });

  test('el dueño puede cerrar una solicitud parcial → ENTREGADO', async () => {
    mockPrisma.stationeryRequest.findUnique.mockResolvedValue({ id: 'req-1', solicitanteId: 'emp-1', estatus: 'ENTREGADO_PARCIAL' });
    mockPrisma.stationeryRequest.update.mockResolvedValue({ id: 'req-1', estatus: 'ENTREGADO' });

    const result = await StationeryService.closeRequest('req-1', 'emp-1');

    expect(mockPrisma.stationeryRequest.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'req-1' },
      data: { estatus: 'ENTREGADO' }
    }));
    expect(result.estatus).toBe('ENTREGADO');
  });
});
