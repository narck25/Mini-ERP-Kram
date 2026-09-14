/**
 * Unit Tests: PurchaseService
 * Cubre lo agregado esta sesión: tipo PRODUCTO/SERVICIO al crear una
 * solicitud, y la generación de PurchaseResponsiva al entregar (solo
 * cuando hay ítems PRODUCTO).
 */
const mockPrisma = {
  employee: { findUnique: jest.fn() },
  purchaseRequest: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
  purchaseItem: { create: jest.fn(), update: jest.fn() },
  purchaseResponsiva: { create: jest.fn() },
  $transaction: jest.fn((fn) => fn(mockPrisma))
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

jest.mock('../../../src/services/audit.service', () => ({
  ACCIONES: {},
  log: jest.fn(),
  logWithReq: jest.fn()
}));

const PurchaseService = require('../../../src/services/purchases/purchase.service');

describe('🛒 PurchaseService.createRequest', () => {
  beforeEach(() => jest.clearAllMocks());

  test('lanza error si el usuario no tiene empleado asociado', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue(null);
    await expect(
      PurchaseService.createRequest('user-1', 'justif', [{ productoServicio: 'Laptop', cantidad: 1 }])
    ).rejects.toMatchObject({ status: 404 });
  });

  test('crea items con tipo PRODUCTO por default y SERVICIO cuando se especifica', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1', departamento_id: 'dep-1' });
    mockPrisma.purchaseRequest.create.mockResolvedValue({ id: 'req-1' });
    mockPrisma.purchaseItem.create.mockImplementation(({ data }) => Promise.resolve({ id: `item-${data.productoServicio}`, ...data }));

    await PurchaseService.createRequest('user-1', 'justif', [
      { productoServicio: 'Laptop', cantidad: 1 },
      { productoServicio: 'Mantenimiento AC', cantidad: 1, tipo: 'SERVICIO' }
    ]);

    const calls = mockPrisma.purchaseItem.create.mock.calls.map(c => c[0].data);
    expect(calls[0]).toMatchObject({ productoServicio: 'Laptop', tipo: 'PRODUCTO' });
    expect(calls[1]).toMatchObject({ productoServicio: 'Mantenimiento AC', tipo: 'SERVICIO' });
  });

  test('borrador: sanea items permisivamente sin tronar aunque falten datos', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1', departamento_id: 'dep-1' });
    mockPrisma.purchaseRequest.create.mockResolvedValue({ id: 'req-1' });
    mockPrisma.purchaseItem.create.mockResolvedValue({ id: 'item-1' });

    await PurchaseService.createRequest('user-1', null, [{ productoServicio: '', cantidad: '' }], true);

    expect(mockPrisma.purchaseRequest.create.mock.calls[0][0].data.estatus).toBe('BORRADOR');
    expect(mockPrisma.purchaseItem.create.mock.calls[0][0].data).toMatchObject({
      productoServicio: '',
      tipo: 'PRODUCTO',
      cantidad: 0
    });
  });

  test('no borrador: rechaza items sin productoServicio o cantidad', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1', departamento_id: 'dep-1' });
    await expect(
      PurchaseService.createRequest('user-1', null, [{ productoServicio: '', cantidad: 1 }], false)
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('🛒 PurchaseService.markAsDelivered', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza si la solicitud no está APROBADO', async () => {
    mockPrisma.purchaseRequest.findUnique.mockResolvedValue({ id: 'req-1', estatus: 'NUEVO', items: [] });
    await expect(PurchaseService.markAsDelivered('user-1', 'req-1'))
      .rejects.toMatchObject({ status: 400 });
  });

  test('rechaza si el usuario que entrega no tiene empleado asociado', async () => {
    mockPrisma.purchaseRequest.findUnique.mockResolvedValue({ id: 'req-1', estatus: 'APROBADO', items: [] });
    mockPrisma.employee.findUnique.mockResolvedValue(null);
    await expect(PurchaseService.markAsDelivered('user-1', 'req-1'))
      .rejects.toMatchObject({ status: 404 });
  });

  test('solicitud solo de SERVICIO: no genera responsiva ni toca cantidadEntregada', async () => {
    mockPrisma.purchaseRequest.findUnique.mockResolvedValue({
      id: 'req-1', estatus: 'APROBADO', solicitanteId: 'sol-1', departamentoId: 'dep-1',
      items: [{ id: 'item-1', tipo: 'SERVICIO', productoServicio: 'Mantenimiento', cantidad: 1 }]
    });
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'entregador-1' });
    mockPrisma.purchaseRequest.update.mockResolvedValue({ id: 'req-1', estatus: 'ENTREGADO' });

    await PurchaseService.markAsDelivered('user-1', 'req-1');

    expect(mockPrisma.purchaseResponsiva.create).not.toHaveBeenCalled();
    expect(mockPrisma.purchaseItem.update).not.toHaveBeenCalled();
    expect(mockPrisma.purchaseRequest.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'req-1' },
      data: { estatus: 'ENTREGADO' }
    }));
  });

  test('solicitud con PRODUCTO: genera responsiva con default (solicitante/departamento propios) y marca cantidadEntregada', async () => {
    mockPrisma.purchaseRequest.findUnique.mockResolvedValue({
      id: 'req-1', estatus: 'APROBADO', solicitanteId: 'sol-1', departamentoId: 'dep-1',
      items: [{ id: 'item-1', tipo: 'PRODUCTO', productoServicio: 'Laptop', cantidad: 2 }]
    });
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'entregador-1' });
    mockPrisma.purchaseRequest.update.mockResolvedValue({ id: 'req-1', estatus: 'ENTREGADO' });

    await PurchaseService.markAsDelivered('user-1', 'req-1');

    expect(mockPrisma.purchaseResponsiva.create).toHaveBeenCalledWith({
      data: {
        requestId: 'req-1',
        entregadoAId: 'sol-1',
        entregadoPorId: 'entregador-1',
        departamentoId: 'dep-1',
        observaciones: null,
        items: [{ producto: 'Laptop', cantidad: 2 }]
      }
    });
    expect(mockPrisma.purchaseItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { cantidadEntregada: 2 }
    });
  });

  test('respeta entregadoAId/departamentoId/observaciones explicitos en vez de los default', async () => {
    mockPrisma.purchaseRequest.findUnique.mockResolvedValue({
      id: 'req-1', estatus: 'APROBADO', solicitanteId: 'sol-1', departamentoId: 'dep-1',
      items: [{ id: 'item-1', tipo: 'PRODUCTO', productoServicio: 'Laptop', cantidad: 1 }]
    });
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'entregador-1' });
    mockPrisma.purchaseRequest.update.mockResolvedValue({ id: 'req-1', estatus: 'ENTREGADO' });

    await PurchaseService.markAsDelivered('user-1', 'req-1', {
      entregadoAId: 'otro-empleado',
      departamentoId: 'otro-depto',
      observaciones: 'Entregado en recepción'
    });

    expect(mockPrisma.purchaseResponsiva.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entregadoAId: 'otro-empleado',
        departamentoId: 'otro-depto',
        observaciones: 'Entregado en recepción'
      })
    });
  });
});
