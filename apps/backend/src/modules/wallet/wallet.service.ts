import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WalletTransactionType } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, balance: 0 },
      });
    }
    return wallet;
  }

  async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return { balance: Number(wallet.balance), userId };
  }

  async credit(
    userId:      string,
    amount:      number,
    description: string,
    referenceId?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Credit amount must be positive');
    }

    const wallet = await this.getOrCreateWallet(userId);

    const [updatedWallet, tx] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { userId },
        data:  { balance: { increment: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId:    wallet.id,
          type:        WalletTransactionType.CREDIT,
          amount,
          description,
          referenceId,
        },
      }),
    ]);

    return {
      newBalance:    Number(updatedWallet.balance),
      transactionId: tx.id,
    };
  }

  async debit(
    userId:      string,
    amount:      number,
    description: string,
    referenceId?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Debit amount must be positive');
    }

    const wallet = await this.getOrCreateWallet(userId);

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException(
        `Insufficient wallet balance. Available: ₹${wallet.balance}`,
      );
    }

    const [updatedWallet, tx] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { userId },
        data:  { balance: { decrement: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId:    wallet.id,
          type:        WalletTransactionType.DEBIT,
          amount,
          description,
          referenceId,
        },
      }),
    ]);

    return {
      newBalance:    Number(updatedWallet.balance),
      transactionId: tx.id,
    };
  }

  async getTransactionHistory(userId: string, page = 1, limit = 20) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const skip = (page - 1) * limit;
    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where:   { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take:    limit,
      }),
      this.prisma.walletTransaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return {
      balance:      Number(wallet.balance),
      transactions,
      total,
      page,
      limit,
    };
  }
}
