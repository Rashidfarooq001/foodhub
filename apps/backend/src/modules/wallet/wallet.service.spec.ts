import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '../database/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('WalletService', () => {
  let service: WalletService;

  const mockWallet = {
    id: 'wallet-1',
    userId: 'user-1',
    balance: 500,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    wallet: {
      findUnique: jest.fn().mockResolvedValue(mockWallet),
      create: jest.fn().mockResolvedValue(mockWallet),
      update: jest.fn().mockResolvedValue({ ...mockWallet, balance: 600 }),
    },
    walletTransaction: {
      create: jest.fn().mockResolvedValue({ id: 'tx-1' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn().mockImplementation(async (ops: unknown[]) => {
      return [{ ...mockWallet, balance: 600 }, { id: 'tx-1' }];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return wallet balance', async () => {
    const result = await service.getBalance('user-1');
    expect(result.balance).toBe(500);
  });

  it('should throw BadRequestException when debiting more than balance', async () => {
    mockPrisma.wallet.findUnique.mockResolvedValueOnce({
      ...mockWallet,
      balance: 100,
    });

    await expect(service.debit('user-1', 500, 'Test debit')).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException for zero credit amount', async () => {
    await expect(service.credit('user-1', 0, 'Test')).rejects.toThrow(BadRequestException);
  });
});
