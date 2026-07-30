import { Test, TestingModule } from '@nestjs/testing';
import { CouponsService } from './coupons.service';
import { PrismaService } from '../database/prisma.service';

const mockActiveCoupon = {
  id:          'coupon-1',
  code:        'SAVE50',
  couponType:  'FLAT' as const,
  discountVal: 50,
  minOrderVal: 200,
  maxDiscount: null,
  validFrom:   new Date('2026-01-01'),
  validTill:   new Date('2026-12-31'),
  usageLimit:  500,
  status:      'ACTIVE',
};

describe('CouponsService', () => {
  let service: CouponsService;

  const mockPrisma = {
    coupon: {
      findUnique: jest.fn().mockResolvedValue(mockActiveCoupon),
      findMany:   jest.fn().mockResolvedValue([mockActiveCoupon]),
      create:     jest.fn().mockResolvedValue(mockActiveCoupon),
      update:     jest.fn().mockResolvedValue({ ...mockActiveCoupon, status: 'INACTIVE' }),
    },
    couponUsage: {
      count: jest.fn().mockResolvedValue(0),
    },
    customer: {
      findFirst: jest.fn().mockResolvedValue({ id: 'cust-1', userId: 'user-1' }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCoupon', () => {
    it('should return valid=true with correct discount for flat coupon', async () => {
      const result = await service.validateCoupon('SAVE50', 'user-1', 350);
      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(50);
    });

    it('should reject when subtotal < minOrderVal', async () => {
      const result = await service.validateCoupon('SAVE50', 'user-1', 150);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Minimum order');
    });

    it('should reject expired coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValueOnce({
        ...mockActiveCoupon,
        validTill: new Date('2020-01-01'),
      });
      const result = await service.validateCoupon('OLD50', 'user-1', 350);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('expired');
    });

    it('should reject already-used coupon for this user', async () => {
      mockPrisma.couponUsage.count.mockResolvedValueOnce(1);
      const result = await service.validateCoupon('SAVE50', 'user-1', 350);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('already used');
    });

    it('should reject when global usage limit reached', async () => {
      mockPrisma.couponUsage.count
        .mockResolvedValueOnce(0)  // per-user check
        .mockResolvedValueOnce(500); // global check
      const result = await service.validateCoupon('SAVE50', 'user-1', 350);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('limit reached');
    });

    it('should cap percentage discount at maxDiscount', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValueOnce({
        ...mockActiveCoupon,
        couponType:  'PERCENTAGE',
        discountVal: 50,  // 50%
        maxDiscount: 100, // capped at ₹100
        minOrderVal: 0,
      });
      const result = await service.validateCoupon('PCT50', 'user-1', 500);
      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(100); // 50% of 500 = 250, capped at 100
    });

    it('should return invalid for non-existent coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValueOnce(null);
      const result = await service.validateCoupon('GHOST', 'user-1', 350);
      expect(result.valid).toBe(false);
    });
  });
});
