import { Test, TestingModule } from '@nestjs/testing';
import { OrderStateMachineService } from './order-state-machine.service';
import { PrismaService } from '../database/prisma.service';
import { OrdersGateway } from './orders.gateway';
import { OrderStatus, DeliveryJobStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('OrderStateMachineService', () => {
  let service: OrderStateMachineService;
  let prisma: any;
  let gateway: any;

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      orderTimeline: {
        create: jest.fn(),
      },
      deliveryJob: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    gateway = {
      server: {
        to: jest.fn().mockReturnValue({ emit: jest.fn() }),
      },
      emitToOrder: jest.fn(),
      emitToRestaurant: jest.fn(),
      emitToDriver: jest.fn(),
      emitToAdmin: jest.fn(),
      emitToUser: jest.fn(),
      emitToAvailableDrivers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderStateMachineService,
        { provide: PrismaService, useValue: prisma },
        { provide: OrdersGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<OrderStateMachineService>(OrderStateMachineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should allow RESTAURANT_OWNER to accept PENDING order', async () => {
    const mockOrder = {
      id: 'ord_1',
      orderNumber: 'FH-1001',
      restaurantId: 'rest_1',
      status: OrderStatus.PENDING,
      restaurant: { id: 'rest_1', name: 'Spice Garden', ownerId: 'user_owner' },
    };
    prisma.order.findUnique.mockResolvedValue(mockOrder);
    prisma.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.ACCEPTED });

    const result = await service.transition('ord_1', OrderStatus.ACCEPTED, {
      userId: 'user_owner',
      role: 'RESTAURANT_OWNER',
      restaurantId: 'rest_1',
    });

    expect(result.status).toBe(OrderStatus.ACCEPTED);
    expect(gateway.emitToOrder).toHaveBeenCalled();
  });

  it('should reject unauthorized role attempting restaurant transition', async () => {
    const mockOrder = {
      id: 'ord_1',
      orderNumber: 'FH-1001',
      restaurantId: 'rest_1',
      status: OrderStatus.PENDING,
      restaurant: { id: 'rest_1', name: 'Spice Garden', ownerId: 'user_owner' },
    };
    prisma.order.findUnique.mockResolvedValue(mockOrder);

    await expect(
      service.transition('ord_1', OrderStatus.ACCEPTED, {
        userId: 'rider_1',
        role: 'DELIVERY_PARTNER',
      }),
    ).rejects.toThrow();
  });

  it('should reject invalid state transition (PENDING -> DELIVERED) for non-admin', async () => {
    const mockOrder = {
      id: 'ord_1',
      orderNumber: 'FH-1001',
      restaurantId: 'rest_1',
      status: OrderStatus.PENDING,
      restaurant: { id: 'rest_1', name: 'Spice Garden', ownerId: 'user_owner' },
    };
    prisma.order.findUnique.mockResolvedValue(mockOrder);

    await expect(
      service.transition('ord_1', OrderStatus.DELIVERED, {
        userId: 'user_owner',
        role: 'RESTAURANT_OWNER',
        restaurantId: 'rest_1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should automatically create DeliveryJob when order reaches READY_FOR_PICKUP', async () => {
    const mockOrder = {
      id: 'ord_1',
      orderNumber: 'FH-1001',
      restaurantId: 'rest_1',
      status: OrderStatus.PREPARING,
      subtotal: 500,
      deliveryFee: 40,
      deliveryAddress: { street: '123 Main St', city: 'Srinagar' },
      restaurant: { id: 'rest_1', name: 'Spice Garden', ownerId: 'user_owner', latitude: 34.1, longitude: 74.8 },
    };
    prisma.order.findUnique.mockResolvedValue(mockOrder);
    prisma.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.READY_FOR_PICKUP });
    prisma.deliveryJob.upsert.mockResolvedValue({ id: 'job_1', status: DeliveryJobStatus.AVAILABLE });

    const result = await service.transition('ord_1', OrderStatus.READY_FOR_PICKUP, {
      userId: 'user_owner',
      role: 'RESTAURANT_OWNER',
      restaurantId: 'rest_1',
    });

    expect(result.status).toBe(OrderStatus.READY_FOR_PICKUP);
    expect(prisma.deliveryJob.upsert).toHaveBeenCalled();
  });
});
