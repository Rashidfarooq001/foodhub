import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

  async credit(userId: string, amount: number, description: string, referenceId?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Credit amount must be positive');
    }

    const wallet = await this.getOrCreateWallet(userId);

    const [updatedWallet, tx] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.CREDIT,
          amount,
          description,
          referenceId,
        },
      }),
    ]);

    return {
      newBalance: Number(updatedWallet.balance),
      transactionId: tx.id,
    };
  }

  async debit(userId: string, amount: number, description: string, referenceId?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Debit amount must be positive');
    }

    const wallet = await this.getOrCreateWallet(userId);

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException(`Insufficient wallet balance. Available: ₹${wallet.balance}`);
    }

    const [updatedWallet, tx] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.DEBIT,
          amount,
          description,
          referenceId,
        },
      }),
    ]);

    return {
      newBalance: Number(updatedWallet.balance),
      transactionId: tx.id,
    };
  }

  async getTransactionHistory(userId: string, page = 1, limit = 20) {
    const wallet = await this.getOrCreateWallet(userId);

    const skip = (page - 1) * limit;
    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return {
      balance: Number(wallet.balance),
      transactions,
      total,
      page,
      limit,
    };
  }

  async getPlatformWalletsOverview() {
    const customerWallets = await this.prisma.wallet.findMany({
      include: {
        user: {
          include: { profile: true },
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    const drivers = await this.prisma.driver.findMany({
      include: {
        user: {
          include: { profile: true },
        },
        vehicles: true,
        deliveryJobs: {
          where: { status: 'DELIVERED' },
          select: { riderPayout: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formattedCustomers = customerWallets.map((w) => {
      const name = w.user?.profile?.firstName
        ? `${w.user.profile.firstName} ${w.user.profile.lastName || ''}`.trim()
        : 'Customer';
      return {
        id: w.id,
        userId: w.userId,
        name,
        phone: w.user?.phone || 'N/A',
        balance: Number(w.balance),
        txCount: w._count.transactions,
      };
    });

    const formattedDrivers = drivers.map((d) => {
      const name = d.user?.profile?.firstName
        ? `${d.user.profile.firstName} ${d.user.profile.lastName || ''}`.trim()
        : 'Delivery Partner';
      const vehicle = d.vehicles?.[0]?.vehicleNumber || d.licenseNumber || 'Courier';
      const totalEarned = d.deliveryJobs.reduce((acc, j) => acc + Number(j.riderPayout || 0), 0);
      return {
        id: d.id,
        driverId: d.id,
        userId: d.userId,
        name,
        phone: d.user?.phone || 'N/A',
        vehicle,
        balance: totalEarned,
        txCount: d.deliveryJobs.length,
      };
    });

    return {
      customerWallets: formattedCustomers,
      driverWallets: formattedDrivers,
    };
  }
}
