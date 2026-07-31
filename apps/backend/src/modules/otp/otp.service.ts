import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_COOLDOWN_SEC = 60;
  private readonly OTP_EXPIRY_MINS = 10;

  constructor(private readonly prisma: PrismaService) {}

  async sendOtp(phone: string): Promise<{ message: string; cooldownSec: number }> {
    // Check cooldown
    const existingOtp = await this.prisma.otp.findFirst({
      where: { phone, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (existingOtp) {
      const timeDiffSec = (Date.now() - existingOtp.createdAt.getTime()) / 1000;
      if (timeDiffSec < this.OTP_COOLDOWN_SEC) {
        const remainingCooldown = Math.ceil(this.OTP_COOLDOWN_SEC - timeDiffSec);
        throw new BadRequestException(`Please wait ${remainingCooldown} seconds before requesting another OTP`);
      }
    }

    // Generate 4-digit OTP
    const rawOtp = process.env.NODE_ENV === 'development' ? '4819' : Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINS * 60 * 1000);

    // Save hashed OTP
    await this.prisma.otp.create({
      data: {
        phone,
        otpHash,
        expiresAt,
      },
    });

    // Dispatch SMS via MSG91 Gateway (Mocked output in dev logs)
    this.logger.log(`[MSG91 Gateway] Sent SMS OTP to ${phone}: ${rawOtp}`);

    return {
  message: `OTP sent successfully to ${phone}`,
  cooldownSec: this.OTP_COOLDOWN_SEC,
  otp: rawOtp, // Development only
};

  async verifyOtp(phone: string, rawOtp: string): Promise<boolean> {
    const otpRecord = await this.prisma.otp.findFirst({
      where: { phone, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No active OTP request found for this phone number');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('OTP has expired. Please request a new one');
    }

    const isValid = await bcrypt.compare(rawOtp, otpRecord.otpHash);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP code entered');
    }

    // Mark as used
    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    return true;
  }
}
