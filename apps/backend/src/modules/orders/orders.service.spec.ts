import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrdersValidationService } from './orders.validation.service';
import { OrdersGateway } from './orders.gateway';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockRepo = {
    findById: jest.fn(),
    appendTimeline: jest.fn(),
    appendStatusHistory: jest.fn(),
  };

  const mockValidation = {
    validateRestaurantOpen: jest.fn(),
    validateItemsAvailable: jest.fn(),
    validateMinimumOrder: jest.fn(),
    validateAndApplyCoupon: jest.fn().mockResolvedValue(0),
    validateWalletBalance: jest.fn(),
    validateStatusTransition: jest.fn(),
  };

  const mockGateway = {
    emitToOrder: jest.fn(),
    emitToRestaurant: jest.fn(),
    emitToDriver: jest.fn(),
  };

  const mockPrisma = {
    foodItem: { findUniqueOrThrow: jest.fn(), findUnique: jest.fn() },
    restaurant: { findUnique: jest.fn() },
    restaurantSetting: { findUnique: jest.fn().mockResolvedValue(null) },
    order: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    orderTimeline: { create: jest.fn() },
    orderCancellation: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrdersRepository, useValue: mockRepo },
        { provide: OrdersValidationService, useValue: mockValidation },
        { provide: OrdersGateway, useValue: mockGateway },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateStatus', () => {
    it('should update order status and emit Socket event', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.PENDING,
        orderItems: [],
        orderTimelines: [],
        payments: [],
        cancellation: null,
        refund: null,
      };
      mockRepo.findById.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.ACCEPTED });
      mockRepo.appendTimeline.mockResolvedValue({});
      mockRepo.appendStatusHistory.mockResolvedValue({});

      const result = await service.updateStatus(
        'order-1',
        { status: OrderStatus.ACCEPTED },
        'user-1',
      );

      expect(result.status).toBe(OrderStatus.ACCEPTED);
      expect(mockGateway.emitToOrder).toHaveBeenCalledWith(
        'order-1',
        'order.accepted',
        expect.objectContaining({ status: OrderStatus.ACCEPTED }),
      );
    });
  });

  describe('generateInvoice', () => {
    it('should return invoice with correct structure', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'FH-123456',
        createdAt: new Date(),
        orderItems: [],
        subtotal: 300,
        discountAmount: 0,
        packagingFee: 15,
        deliveryFee: 30,
        taxAmount: 15,
        totalAmount: 360,
        paymentStatus: 'COMPLETED',
        paymentMethod: 'UPI',
        deliveryAddress: {},
        orderTimelines: [],
        payments: [],
        cancellation: null,
        refund: null,
      };
      mockRepo.findById.mockResolvedValue(mockOrder);

      const invoice = await service.generateInvoice('order-1');

      expect(invoice.invoiceNumber).toBe('INV-FH-123456');
      expect(invoice.grandTotal).toBe(360);
    });
  });
});
