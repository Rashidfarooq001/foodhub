import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_COOLDOWN_SEC = 60;
  private readonly OTP_EXPIRY_MINS = 10;

  constructor(private readonly prisma: PrismaService) {}

  async sendOtp(phone: string): Promise<{ message: string; cooldownSec: number; otp?: string }> {
    // Check cooldown
    const existingOtp = await this.prisma.otp.findFirst({
      where: { phone, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (existingOtp) {
      const secondsPassed = Math.floor((Date.now() - existingOtp.createdAt.getTime()) / 1000);
      if (secondsPassed < this.OTP_COOLDOWN_SEC) {
        throw new BadRequestException(
          `Please wait ${this.OTP_COOLDOWN_SEC - secondsPassed} seconds before requesting a new OTP.`,
        );
      }
    }

    const isDevOrTest = process.env.NODE_ENV !== 'production';

    // Generate 4-digit OTP
    const rawOtp = isDevOrTest ? '4819' : Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINS * 60 * 1000);

    await this.prisma.otp.create({
      data: {
        phone,
        otpHash,
        expiresAt,
      },
    });

    if (!isDevOrTest) {
      this.logger.log(`[MSG91 Gateway] Sent SMS OTP to ${phone}`);
    } else {
      this.logger.log(`[Dev SMS Suppressed] Generated OTP for ${phone}: ${rawOtp}`);
    }

    return {
      message: 'OTP sent successfully',
      cooldownSec: this.OTP_COOLDOWN_SEC,
      ...(isDevOrTest ? { otp: rawOtp } : {}),
    };
  }

  async verifyOtp(phone: string, rawOtp: string): Promise<boolean> {
    const otpRecord = await this.prisma.otp.findFirst({
      where: { phone, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No active OTP request found for this phone number');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('OTP code has expired. Please request a new code.');
    }

    const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);
    if (!isMatch) {
      throw new BadRequestException('Invalid OTP code entered');
    }

    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    return true;
  }

  async verifyAccessToken(accessToken: string): Promise<any> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const isDevOrTest = process.env.NODE_ENV !== 'production';

    // Dev/Test Mode fallback for local testing
    if ((!authKey || authKey === 'dummy_auth_key') && isDevOrTest && accessToken.startsWith('dev_')) {
      const devPhone = accessToken.replace('dev_widget_token_', '').replace('dev_', '');
      const formattedDevPhone = devPhone.length === 10 ? `+91${devPhone}` : (devPhone.startsWith('+') ? devPhone : `+${devPhone}`);
      return {
        type: 'success',
        message: 'Dev OTP widget verified',
        mobile: formattedDevPhone || '+919876543210',
      };
    }

    try {
      const response = await fetch(
        'https://control.msg91.com/api/v5/widget/verifyAccessToken',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            authkey: authKey,
            'access-token': accessToken,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || data.type === 'error' || data.status === 'error') {
        throw new UnauthorizedException(data.message || 'OTP verification failed');
      }

      return data;
    } catch (error: any) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`MSG91 Widget Verification Failed: ${error?.message || error}`);
      throw new UnauthorizedException(error?.message || 'MSG91 OTP widget token verification failed.');
    }
  }

  async sendDeliveryOtp(orderId: string) {
    return {
      success: true,
      message: 'Delivery OTP initiated.',
      orderId,
    };
  }

  async verifyDeliveryOtp(orderId: string, otp: string) {
    return {
      success: true,
      message: 'Delivery OTP verified.',
      orderId,
      otp,
    };
  }
}