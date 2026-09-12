import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WalletService } from '../wallet/wallet.service';

const REFERRER_REWARD = 50; // ₹50 for the person who referred
const REFEREE_REWARD = 30; // ₹30 for the new user

/** Generate a unique 8-char referral code like FH-A3BK9Z */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `FH-${suffix}`;
}

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  /** Get or generate a referral code for a user */
  async getMyReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.referralCode) return user.referralCode;

    // Generate unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await this.prisma.user.findUnique({ where: { referralCode: code } });
      if (!exists) break;
      code = generateCode();
      attempts++;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });

    return code;
  }

  /** Apply a referral code — must be a new user, cannot self-refer, one use only */
  async applyReferralCode(refereeUserId: string, code: string) {
    // Find referrer by code
    const referrer = await this.prisma.user.findUnique({ where: { referralCode: code } });
    if (!referrer) throw new NotFoundException('Referral code not found');

    // Anti-fraud: cannot self-refer
    if (referrer.id === refereeUserId) {
      throw new BadRequestException('You cannot use your own referral code');
    }

    // Anti-fraud: get Customer records for both
    const referee = await this.prisma.customer.findFirst({
      where: { userId: refereeUserId },
    });
    if (!referee) throw new NotFoundException('User is not a customer');

    const referrerId = referrer.id;
    const referrerCustomer = await this.prisma.customer.findFirst({
      where: { userId: referrerId },
    });

    // Check already used referral
    const existing = await this.prisma.referral.findUnique({
      where: { refereeId: referee.id },
    });
    if (existing) {
      throw new ConflictException('You have already used a referral code');
    }

    // Create referral record
    await this.prisma.referral.create({
      data: {
        referrerId: referrerCustomer?.id ?? referrerId,
        refereeId: referee.id,
        rewardAmount: REFERRER_REWARD,
      },
    });

    // Credit wallets
    await Promise.all([
      this.wallet.credit(
        referrerId,
        REFERRER_REWARD,
        `Referral reward for inviting ${code}`,
        referee.id,
      ),
      this.wallet.credit(
        refereeUserId,
        REFEREE_REWARD,
        `Welcome bonus from referral code ${code}`,
        referrer.id,
      ),
    ]);

    return {
      message: 'Referral code applied successfully',
      referrerReward: REFERRER_REWARD,
      refereeReward: REFEREE_REWARD,
    };
  }

  /** Get referral stats for a user */
  async getReferralStats(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.referralCode) {
      return { referralCode: null, totalReferrals: 0, totalEarned: 0 };
    }

    const customer = await this.prisma.customer.findFirst({ where: { userId } });

    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: customer?.id ?? userId },
    });

    const totalEarned = referrals.reduce((s, r) => s + Number(r.rewardAmount), 0);

    return {
      referralCode: user.referralCode,
      totalReferrals: referrals.length,
      totalEarned,
      shareLink: `https://foodhub.app/join?ref=${user.referralCode}`,
    };
  }
}
