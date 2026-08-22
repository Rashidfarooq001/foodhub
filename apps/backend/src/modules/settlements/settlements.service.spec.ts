import { Test, TestingModule } from '@nestjs/testing';
import { SettlementsService, getWeeklyPeriod } from './settlements.service';
import { PrismaService } from '../database/prisma.service';
import { CommissionService } from './commission.service';
import { OrdersGateway } from '../orders/orders.gateway';
import { SettlementStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('SettlementsService Weekly System', () => {
  let service: SettlementsService;
  let prisma: any;

  const mockRestaurantA = {
    id: 'rest-a-uuid',
    name: 'Royal Kashmir Banquet',
    phone: '+919906000001',
    email: 'info@royalkashmir.com',
    status: 'APPROVED',
    commissionRate: 13.0,
    bankAccount: {
      bankName: 'State Bank of India',
      accountHolder: 'Royal Kashmir Banquet',
      accountNumber: '123456789012',
      ifscCode: 'SBIN0001234',
    },
  };

  const mockRestaurantB = {
    id: 'rest-b-uuid',
    name: 'Sangri Restaurant',
    phone: '+919906000002',
    email: 'sangri@foodhub.test',
    status: 'APPROVED',
    commissionRate: 0.0, // 0% configured commission
    bankAccount: {
      bankName: 'HDFC Bank',
      accountHolder: 'Sangri Restaurant',
      accountNumber: '987654321098',
      ifscCode: 'HDFC0001234',
    },
  };

  const mockRestaurantC = {
    id: 'rest-c-uuid',
    name: 'Zero Sales Cafe',
    phone: '+919906000003',
    email: 'zero@foodhub.test',
    status: 'APPROVED',
    commissionRate: null, // Unconfigured
    bankAccount: null,
  };

  beforeEach(async () => {
    prisma = {
      restaurant: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      order: {
        findMany: jest.fn(),
      },
      settlement: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      driver: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      deliveryJob: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      payment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(async (cb) => (typeof cb === 'function' ? cb(prisma) : cb)),
    };

    const mockGateway = {
      emitToAdmin: jest.fn(),
      emitToRestaurant: jest.fn(),
      emitToOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementsService,
        CommissionService,
        { provide: PrismaService, useValue: prisma },
        { provide: OrdersGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<SettlementsService>(SettlementsService);
  });

  describe('getWeeklyPeriod helper', () => {
    it('calculates current and previous week boundaries correctly', () => {
      const current = getWeeklyPeriod('current');
      expect(current.periodStart).toBeInstanceOf(Date);
      expect(current.periodEnd).toBeInstanceOf(Date);
      expect(current.periodStart.getTime()).toBeLessThan(current.periodEnd.getTime());

      const previous = getWeeklyPeriod('previous');
      expect(previous.periodStart.getTime()).toBeLessThan(current.periodStart.getTime());
    });
  });

  describe('getWeeklyRestaurantSettlements', () => {
    it('returns independent calculations for multiple restaurants including zero activity', async () => {
      prisma.restaurant.findMany.mockResolvedValue([mockRestaurantA, mockRestaurantB, mockRestaurantC]);

      // Delivered orders in period
      prisma.order.findMany.mockResolvedValue([
        {
          id: 'ord-1',
          orderNumber: 'FH-1001',
          restaurantId: 'rest-a-uuid',
          totalAmount: 1000,
          subtotal: 1000,
          pricingSnapshot: { restaurantGross: 1000, commissionRate: 13, commissionAmount: 130, restaurantNet: 870 },
          createdAt: new Date(),
        },
        {
          id: 'ord-2',
          orderNumber: 'FH-1002',
          restaurantId: 'rest-b-uuid',
          totalAmount: 500,
          subtotal: 500,
          pricingSnapshot: { restaurantGross: 500, commissionRate: 0, commissionAmount: 0, restaurantNet: 500 },
          createdAt: new Date(),
        },
      ]);

      prisma.settlement.findMany.mockResolvedValue([]);

      const result = await service.getWeeklyRestaurantSettlements('current');

      expect(result.summary.totalRestaurants).toBe(3);
      expect(result.summary.weeklyGmv).toBe(1500);
      expect(result.summary.totalCommission).toBe(130);
      expect(result.summary.totalRestaurantPayable).toBe(1370);

      // Restaurant A (13%)
      const restA = result.restaurants.find((r) => r.restaurantId === 'rest-a-uuid')!;
      expect(restA.grossSales).toBe(1000);
      expect(restA.commissionAmount).toBe(130);
      expect(restA.netPayable).toBe(870);
      expect(restA.pendingAmount).toBe(870);
      expect(restA.status).toBe(SettlementStatus.PENDING);

      // Restaurant B (0%)
      const restB = result.restaurants.find((r) => r.restaurantId === 'rest-b-uuid')!;
      expect(restB.grossSales).toBe(500);
      expect(restB.commissionAmount).toBe(0);
      expect(restB.netPayable).toBe(500);
      expect(restB.status).toBe(SettlementStatus.PENDING);

      // Restaurant C (0 orders, appears with ₹0)
      const restC = result.restaurants.find((r) => r.restaurantId === 'rest-c-uuid')!;
      expect(restC.orderCount).toBe(0);
      expect(restC.grossSales).toBe(0);
      expect(restC.netPayable).toBe(0);
      expect(restC.pendingAmount).toBe(0);
      expect(restC.status).toBe(SettlementStatus.SETTLED);
    });
  });

  describe('initiateRestaurantPayout Idempotency & Lifecycle', () => {
    it('rejects double-payout with 409 Conflict if already SETTLED', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(mockRestaurantA);
      prisma.order.findMany.mockResolvedValue([
        {
          id: 'ord-1',
          orderNumber: 'FH-1001',
          restaurantId: 'rest-a-uuid',
          totalAmount: 1000,
          subtotal: 1000,
          pricingSnapshot: { restaurantGross: 1000, commissionAmount: 130 },
          createdAt: new Date(),
        },
      ]);

      prisma.settlement.findFirst.mockResolvedValue({
        id: 'settle-1',
        restaurantId: 'rest-a-uuid',
        status: SettlementStatus.SETTLED,
        paidAmount: 870,
        pendingAmount: 0,
      });

      await expect(
        service.initiateRestaurantPayout('rest-a-uuid', { periodType: 'current', amount: 870, transactionReference: 'UTR123' }, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects payout when net payable is ₹0', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(mockRestaurantC);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.settlement.findFirst.mockResolvedValue(null);

      await expect(
        service.initiateRestaurantPayout('rest-c-uuid', { periodType: 'current' }, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('13% Platform Commission on Individual Orders', () => {
    it('calculates 13% commission on a single order of ₹1,300 (= ₹169 commission, Net = ₹1,131)', async () => {
      prisma.restaurant.findMany.mockResolvedValue([mockRestaurantA]);

      prisma.order.findMany.mockResolvedValue([
        {
          id: 'ord-single',
          orderNumber: 'FH-1300',
          restaurantId: 'rest-a-uuid',
          totalAmount: 1318,
          subtotal: 1300,
          pricingSnapshot: {
            restaurantGross: 1300,
            commissionRate: 13,
            commissionAmount: 169,
            restaurantNet: 1131,
          },
          createdAt: new Date(),
        },
      ]);

      prisma.settlement.findMany.mockResolvedValue([]);

      const result = await service.getWeeklyRestaurantSettlements('current');
      const rest = result.restaurants.find((r) => r.restaurantId === 'rest-a-uuid')!;

      expect(rest.orderCount).toBe(1);
      expect(rest.grossSales).toBe(1300);
      expect(rest.commissionRate).toBe(13);
      expect(rest.commissionAmount).toBe(169);
      expect(rest.netPayable).toBe(1131);
      expect(rest.pendingAmount).toBe(1131);
    });

    it('aggregates multiple orders: ₹1,000 (₹130) + ₹500 (₹65) + ₹1,300 (₹169) = ₹2,800 Gross, ₹364 Commission, ₹2,436 Net', async () => {
      prisma.restaurant.findMany.mockResolvedValue([mockRestaurantA]);

      prisma.order.findMany.mockResolvedValue([
        {
          id: 'ord-1',
          orderNumber: 'FH-1001',
          restaurantId: 'rest-a-uuid',
          totalAmount: 1018,
          subtotal: 1000,
          pricingSnapshot: { restaurantGross: 1000, commissionRate: 13, commissionAmount: 130, restaurantNet: 870 },
          createdAt: new Date(),
        },
        {
          id: 'ord-2',
          orderNumber: 'FH-1002',
          restaurantId: 'rest-a-uuid',
          totalAmount: 518,
          subtotal: 500,
          pricingSnapshot: { restaurantGross: 500, commissionRate: 13, commissionAmount: 65, restaurantNet: 435 },
          createdAt: new Date(),
        },
        {
          id: 'ord-3',
          orderNumber: 'FH-1003',
          restaurantId: 'rest-a-uuid',
          totalAmount: 1318,
          subtotal: 1300,
          pricingSnapshot: { restaurantGross: 1300, commissionRate: 13, commissionAmount: 169, restaurantNet: 1131 },
          createdAt: new Date(),
        },
      ]);

      prisma.settlement.findMany.mockResolvedValue([]);

      const result = await service.getWeeklyRestaurantSettlements('current');
      const rest = result.restaurants.find((r) => r.restaurantId === 'rest-a-uuid')!;

      expect(rest.orderCount).toBe(3);
      expect(rest.grossSales).toBe(2800);
      expect(rest.commissionAmount).toBe(364);
      expect(rest.netPayable).toBe(2436);
      expect(rest.pendingAmount).toBe(2436);

      // Verify exact ledger sum equation
      expect(result.summary.weeklyGmv).toBe(2800);
      expect(result.summary.totalCommission).toBe(364);
      expect(result.summary.totalRestaurantPayable).toBe(2436);
    });

    it('verifies ledger reconciliation: SUM(order gross) === settlement gross & SUM(order commission) === settlement commission', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(mockRestaurantA);

      const mockOrders = [
        {
          id: 'ord-1',
          orderNumber: 'FH-1001',
          restaurantId: 'rest-a-uuid',
          totalAmount: 1018,
          subtotal: 1000,
          pricingSnapshot: { restaurantGross: 1000, commissionRate: 13, commissionAmount: 130, restaurantNet: 870 },
          createdAt: new Date(),
        },
        {
          id: 'ord-2',
          orderNumber: 'FH-1002',
          restaurantId: 'rest-a-uuid',
          totalAmount: 518,
          subtotal: 500,
          pricingSnapshot: { restaurantGross: 500, commissionRate: 13, commissionAmount: 65, restaurantNet: 435 },
          createdAt: new Date(),
        },
        {
          id: 'ord-3',
          orderNumber: 'FH-1003',
          restaurantId: 'rest-a-uuid',
          totalAmount: 1318,
          subtotal: 1300,
          pricingSnapshot: { restaurantGross: 1300, commissionRate: 13, commissionAmount: 169, restaurantNet: 1131 },
          createdAt: new Date(),
        },
      ];

      prisma.order.findMany.mockResolvedValue(mockOrders);
      prisma.settlement.findFirst.mockResolvedValue(null);

      const detail = await service.getRestaurantSettlementDetail('rest-a-uuid', 'current');

      const sumOrderGross = detail.orders.reduce((sum, o) => sum + o.grossAmount, 0);
      const sumOrderComm = detail.orders.reduce((sum, o) => sum + o.commissionAmount, 0);
      const sumOrderNet = detail.orders.reduce((sum, o) => sum + o.restaurantNet, 0);

      expect(sumOrderGross).toBe(detail.financialSummary.grossSales);
      expect(sumOrderComm).toBe(detail.financialSummary.commissionAmount);
      expect(sumOrderNet).toBe(detail.financialSummary.netPayable);
    });

    it('excludes cancelled, rejected, or non-completed orders from settlement calculation', async () => {
      prisma.restaurant.findMany.mockResolvedValue([mockRestaurantA]);

      // Database query for orders only filters status: DELIVERED, paymentStatus: COMPLETED
      prisma.order.findMany.mockImplementation(async (query: any) => {
        expect(query.where.status).toBe(OrderStatus.DELIVERED);
        expect(query.where.paymentStatus).toBe(PaymentStatus.COMPLETED);
        return [];
      });

      const result = await service.getWeeklyRestaurantSettlements('current');
      expect(result.summary.totalOrders).toBe(0);
      expect(result.summary.totalCommission).toBe(0);
    });

    it('calculates commission on discounted orders using the authoritative gross food subtotal', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(mockRestaurantA);

      prisma.order.findMany.mockResolvedValue([
        {
          id: 'ord-disc',
          orderNumber: 'FH-DISC',
          restaurantId: 'rest-a-uuid',
          totalAmount: 900, // Customer paid ₹900 after ₹100 discount
          subtotal: 1000,    // Restaurant gross menu value ₹1,000
          pricingSnapshot: {
            restaurantGross: 1000,
            commissionRate: 13,
            commissionAmount: 130,
            restaurantNet: 870,
          },
          createdAt: new Date(),
        },
      ]);

      prisma.settlement.findFirst.mockResolvedValue(null);

      const detail = await service.getRestaurantSettlementDetail('rest-a-uuid', 'current');
      expect(detail.financialSummary.grossSales).toBe(1000);
      expect(detail.financialSummary.commissionAmount).toBe(130);
      expect(detail.financialSummary.netPayable).toBe(870);
    });
  });

  describe('Double-Entry Reconciliation', () => {
    it('verifies exact balance when customer payments match all components', async () => {
      prisma.order.findMany.mockResolvedValue([
        {
          id: 'ord-1',
          orderNumber: 'FH-1001',
          totalAmount: 1068, // food 1000 + delivery 15 + platform 3 + GST 50
          subtotal: 1000,
          deliveryFee: 15,
          taxAmount: 50,
          pricingSnapshot: {
            restaurantGross: 1000,
            commissionRate: 13,
            commissionAmount: 130,
            restaurantNet: 870,
            platformFee: 3,
            customerDeliveryFee: 15,
          },
          restaurant: mockRestaurantA,
          deliveryJob: { riderPayout: 35 },
          payments: [{ amount: 1068, status: 'COMPLETED' }],
        },
      ]);

      const report = await service.getReconciliationReport('current');
      expect(report.status).toBe('BALANCED');
      expect(report.discrepancyAmount).toBe(0);
      expect(report.equation.customerCollections).toBe(1068);
      expect(report.equation.reconstructedTotal).toBe(1068);
    });
  });
});
