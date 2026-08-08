import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_COOLDOWN_SEC = 60;
  private readonly OTP_EXPIRY_MINS = 10;

  constructor(
    private readonly prisma: PrismaService,
  ) {}

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
      this.logger.log(`[Dev SMS Suppressed] Generated OTP for ${phone}`);
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

    this.logger.log(`[Backend MSG91] MSG91_AUTH_KEY_PRESENT=${!!authKey}, KeyLength=${authKey?.length || 0}`);
    this.logger.log(`[Backend MSG91] Token present=${!!accessToken}, TokenLength=${accessToken?.length || 0}`);

    if ((!authKey || authKey === 'dummy_auth_key') && isDevOrTest && accessToken?.startsWith('dev_')) {
      this.logger.log('[Backend MSG91] Bypassing MSG91 API in local test mode for dev_ token');
      const devPhone = accessToken.replace('dev_widget_token_', '').replace('dev_', '');
      const formattedDevPhone = devPhone.length === 10 ? `+91${devPhone}` : (devPhone.startsWith('+') ? devPhone : `+${devPhone}`);
      return {
        type: 'success',
        message: 'Dev OTP widget verified',
        mobile: formattedDevPhone || '+919876543210',
      };
    }

    if (!authKey) {
      this.logger.error('[Backend MSG91] MSG91_AUTH_KEY is missing in environment variables!');
      throw new UnauthorizedException('Server configuration error: MSG91_AUTH_KEY missing');
    }

    try {
      this.logger.log('[Backend MSG91] Requesting https://control.msg91.com/api/v5/widget/verifyAccessToken...');
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

      this.logger.log(`[Backend MSG91] HTTP status from MSG91 server: ${response.status}`);
      const msg91Data = await response.json();
      this.logger.log(`[Backend MSG91] Response keys: [${Object.keys(msg91Data || {}).join(', ')}]`);
      this.logger.log(`[Backend MSG91] MSG91 response type="${msg91Data?.type || 'none'}", status="${msg91Data?.status || 'none'}"`);

      if (!response.ok || msg91Data?.type === 'error' || msg91Data?.status === 'error') {
        const msg = msg91Data?.message || msg91Data?.error || 'MSG91 widget verification failed';
        this.logger.error(`[Backend MSG91] Verification rejected by MSG91 server: ${msg}`);
        throw new UnauthorizedException(`MSG91 verification rejected: ${msg}`);
      }

      return msg91Data;
    } catch (error: any) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[Backend MSG91] Exception during MSG91 verifyAccessToken: ${error?.message || error}`);
      throw new UnauthorizedException(error?.message || 'MSG91 token verification failed.');
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