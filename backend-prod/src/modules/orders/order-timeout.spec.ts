import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { OrderLifecycleService } from './order-lifecycle.service';
import { OrdersGateway } from './orders.gateway';
import { OrderStatus, DeliveryJobStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { WebPushService } from '../notifications/web-push.service';

describe('5-Hour Order Lifecycle Timeout', () => {
  let lifecycleService: OrderLifecycleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderLifecycleService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(cb => cb({ 
              order: { 
                findUnique: jest.fn().mockResolvedValue({ status: OrderStatus.OUT_FOR_DELIVERY }), 
                update: jest.fn().mockResolvedValue({ id: 'ord-123', deliveryJob: { driverId: 'drv-1' }, pricingSnapshot: {} }) 
              }, 
              orderTimeline: { create: jest.fn() }, 
              orderStatusHistory: { create: jest.fn() }, 
              deliveryJob: { update: jest.fn() },
              restaurantSettlement: { create: jest.fn() },
              driverSettlement: { create: jest.fn() },
              platformRevenue: { create: jest.fn() }
            })),
            order: { findUnique: jest.fn(), findFirst: jest.fn() },
          },
        },
        { provide: OrdersGateway, useValue: { emitToOrder: jest.fn(), emitToRestaurant: jest.fn(), emitToDeliveryPartner: jest.fn(), emitToAdmin: jest.fn() } },
        { provide: WebPushService, useValue: { sendNotification: jest.fn() } },
      ],
    }).compile();

    lifecycleService = module.get<OrderLifecycleService>(OrderLifecycleService);
  });

  it('1. Order exactly 4h 59m old should allow delivery completion', async () => {
    const createdAt = new Date(Date.now() - (4 * 60 * 60 * 1000 + 59 * 60 * 1000));
    jest.spyOn(lifecycleService['prisma'].order, 'findFirst').mockResolvedValue({
      id: 'ord-123',
      createdAt,
      status: OrderStatus.OUT_FOR_DELIVERY,
      deliveryJob: { driverId: 'drv-1' }
    } as any);

    await expect(lifecycleService.completeDelivery('ord-123', { userId: 'drv-1', driverId: 'drv-1' })).resolves.toBeDefined();
  });

  it('2. Order 5h 01m old should REJECT delivery completion and throw BadRequest', async () => {
    const createdAt = new Date(Date.now() - (5 * 60 * 60 * 1000 + 1 * 60 * 1000));
    jest.spyOn(lifecycleService['prisma'].order, 'findFirst').mockResolvedValue({
      id: 'ord-123',
      createdAt,
      status: OrderStatus.OUT_FOR_DELIVERY,
      deliveryJob: { driverId: 'drv-1' }
    } as any);

    await expect(lifecycleService.completeDelivery('ord-123', { userId: 'drv-1', driverId: 'drv-1' }))
      .rejects.toThrow(BadRequestException);
  });

  it('3. Order 5h 01m old should allow CANCELLED transition (e.g. by worker)', async () => {
    const createdAt = new Date(Date.now() - (5 * 60 * 60 * 1000 + 1 * 60 * 1000));
    jest.spyOn(lifecycleService['prisma'].order, 'findUnique').mockResolvedValue({
      id: 'ord-123',
      createdAt,
      status: OrderStatus.OUT_FOR_DELIVERY,
      deliveryJob: { driverId: 'drv-1' }
    } as any);

    await expect(lifecycleService.transition('ord-123', OrderStatus.CANCELLED, { userId: 'SYSTEM', role: 'SUPER_ADMIN' }))
      .resolves.toBeDefined();
  });
});
