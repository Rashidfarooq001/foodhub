import { Test, TestingModule } from '@nestjs/testing';
import { ReferralsService } from './referrals.service';
import { PrismaService } from '../database/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('ReferralsService', () => {
  let service: ReferralsService;

  const mockUser = { id: 'user-1', referralCode: 'FH-A3BK9Z' };
  const mockReferrer = { id: 'user-2', referralCode: 'FH-FRIEND' };
  const mockCustomer = { id: 'cust-1', userId: 'user-1' };

  const mockPrisma = {
    user: {
      findUniqueOrThrow: jest.fn().mockResolvedValue(mockUser),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    customer: {
      findFirst: jest.fn().mockResolvedValue(mockCustomer),
      findFirstOrThrow: jest.fn().mockResolvedValue(mockCustomer),
    },
    referral: {
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockWallet = {
    credit: jest.fn().mockResolvedValue({ newBalance: 100, transactionId: 'tx-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        { provide: PrismaService,  useValue: mockPrisma },
        { provide: WalletService,  useValue: mockWallet  },
      ],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return existing referral code without generating a new one', async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValueOnce(mockUser);
    const code = await service.getMyReferralCode('user-1');
    expect(code).toBe('FH-A3BK9Z');
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('should reject self-referral', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ ...mockReferrer, id: 'user-1' });

    await expect(
      service.applyReferralCode('user-1', 'FH-FRIEND'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject code not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.applyReferralCode('user-2', 'FH-NOTEX'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject already-used referral code', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(mockReferrer);
    mockPrisma.referral.findUnique.mockResolvedValueOnce({ id: 'ref-1' }); // already exists

    await expect(
      service.applyReferralCode('user-1', 'FH-FRIEND'),
    ).rejects.toThrow(ConflictException);
  });

  it('should return stats with totalReferrals 0 when no referrals', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
    mockPrisma.referral.findMany.mockResolvedValueOnce([]);

    const stats = await service.getReferralStats('user-1');
    expect(stats.totalReferrals).toBe(0);
    expect(stats.totalEarned).toBe(0);
  });
});
