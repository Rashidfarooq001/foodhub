import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../database/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockOrders = [
    { totalAmount: 350, restaurantId: 'rest-1', orderNumber: 'ORD-001', createdAt: new Date(), status: 'DELIVERED', paymentMethod: 'ONLINE', restaurant: { name: 'Spice Garden' } },
    { totalAmount: 200, restaurantId: 'rest-1', orderNumber: 'ORD-002', createdAt: new Date(), status: 'DELIVERED', paymentMethod: 'WALLET', restaurant: { name: 'Spice Garden' } },
    { totalAmount: 150, restaurantId: 'rest-2', orderNumber: 'ORD-003', createdAt: new Date(), status: 'DELIVERED', paymentMethod: 'COD',    restaurant: { name: 'Pizza Paradise' } },
  ];

  const makeAggregate = (sum: number, count: number) => ({
    _sum:   { totalAmount: sum },
    _count: { id: count },
    _avg:   { totalAmount: sum / (count || 1) },
  });

  const mockPrisma = {
    order: {
      count:     jest.fn().mockResolvedValue(5),
      aggregate: jest.fn().mockResolvedValue(makeAggregate(700, 3)),
      findMany:  jest.fn().mockResolvedValue(mockOrders),
    },
    customer:           { count: jest.fn().mockResolvedValue(120), findFirst: jest.fn() },
    restaurant:         { count: jest.fn().mockResolvedValue(18), findUnique: jest.fn() },
    driver:             { count: jest.fn().mockResolvedValue(35), findUnique: jest.fn().mockResolvedValue({ avgRating: 4.5, driverWallet: { balance: 1200 } }) },
    settlement:         { count: jest.fn().mockResolvedValue(3) },
    paymentRefund:      { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 200 } }) },
    restaurantReview:   { aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 4.2 }, _count: { id: 12 } }) },
    orderItem:          { groupBy: jest.fn().mockResolvedValue([]) },
    deliveryAssignment: { count: jest.fn().mockResolvedValue(10) },
    wallet:             { findFirst: jest.fn().mockResolvedValue({ balance: 500 }), findUnique: jest.fn().mockResolvedValue({ balance: 200 }) },
    couponUsage:        { count: jest.fn().mockResolvedValue(2) },
    referral:           { count: jest.fn().mockResolvedValue(1) },
    $queryRaw:          jest.fn().mockResolvedValue([{ hour: 19, cnt: 45n }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdminDashboard', () => {
    it('should return dashboard with today/week/month structure', async () => {
      const result = await service.getAdminDashboard();
      expect(result).toHaveProperty('today');
      expect(result).toHaveProperty('week');
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('users');
      expect(result.today).toHaveProperty('orders');
      expect(result.today).toHaveProperty('revenue');
    });

    it('should include peakHour as a number', async () => {
      const result = await service.getAdminDashboard();
      expect(typeof result.peakHour).toBe('number');
      expect(result.peakHour).toBe(19);
    });

    it('should calculate platform commission as 20% of month revenue', async () => {
      const result = await service.getAdminDashboard();
      const expectedComm = Math.round(result.month.revenue * 0.2 * 100) / 100;
      expect(result.month.platformComm).toBe(expectedComm);
    });
  });

  describe('getSalesReport', () => {
    it('should return total revenue summed from orders', async () => {
      const from = new Date('2026-07-01');
      const to   = new Date('2026-07-31');
      const report = await service.getSalesReport(from, to);
      expect(report.totalRevenue).toBe(700); // 350 + 200 + 150
      expect(report.rows).toHaveLength(3);
    });

    it('should include restaurant name in each row', async () => {
      const report = await service.getSalesReport(new Date(), new Date());
      expect(report.rows[0]).toHaveProperty('restaurant');
      expect(report.rows[0].restaurant).toBe('Spice Garden');
    });
  });

  describe('exportCsv', () => {
    it('should return a CSV string with headers for orders type', async () => {
      const csv = await service.exportCsv('orders', new Date(), new Date());
      expect(csv).toContain('orderNumber');
      expect(csv).toContain('restaurant');
    });

    it('should return empty string for unknown report type', async () => {
      const csv = await service.exportCsv('unknown', new Date(), new Date());
      expect(csv).toBe('');
    });
  });

  describe('getRevenueBreakdown', () => {
    it('should return an array with length equal to requested days', async () => {
      const result = await service.getRevenueBreakdown(7);
      expect(result).toHaveLength(7);
    });

    it('each entry should have date, revenue and orders', async () => {
      const result = await service.getRevenueBreakdown(3);
      result.forEach((entry) => {
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('revenue');
        expect(entry).toHaveProperty('orders');
      });
    });
  });
});
