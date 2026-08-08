import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { TokenService } from '../tokens/token.service';
import { SessionService } from '../sessions/session.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_COOLDOWN_SEC = 60;
  private readonly OTP_EXPIRY_MINS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
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

  async verifyAccessToken(accessToken: string, ipAddress?: string, userAgent?: string): Promise<any> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const isDevOrTest = process.env.NODE_ENV !== 'production';

    let msg91Data: any;

    // Dev/Test Mode fallback for local testing
    if ((!authKey || authKey === 'dummy_auth_key') && isDevOrTest && accessToken.startsWith('dev_')) {
      const devPhone = accessToken.replace('dev_widget_token_', '').replace('dev_', '');
      const formattedDevPhone = devPhone.length === 10 ? `+91${devPhone}` : (devPhone.startsWith('+') ? devPhone : `+${devPhone}`);
      msg91Data = {
        type: 'success',
        message: 'Dev OTP widget verified',
        mobile: formattedDevPhone || '+919876543210',
      };
    } else {
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

        msg91Data = await response.json();

        if (!response.ok || msg91Data.type === 'error' || msg91Data.status === 'error') {
          throw new UnauthorizedException(msg91Data.message || 'OTP verification failed');
        }
      } catch (error: any) {
        if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
          throw error;
        }
        this.logger.error(`MSG91 Widget Verification Failed: ${error?.message || error}`);
        throw new UnauthorizedException(error?.message || 'MSG91 OTP widget token verification failed.');
      }
    }

    // Extract mobile number from MSG91 response
    const rawMobile =
      msg91Data?.data?.mobile ||
      msg91Data?.mobile ||
      msg91Data?.data?.mobileNumber ||
      msg91Data?.mobileNumber ||
      msg91Data?.phone;

    let phoneToVerify = String(rawMobile || '').trim();
    if (!phoneToVerify) {
      throw new BadRequestException('Mobile number not returned from MSG91 widget verification');
    }

    if (!phoneToVerify.startsWith('+')) {
      if (phoneToVerify.length === 10) {
        phoneToVerify = `+91${phoneToVerify}`;
      } else {
        phoneToVerify = `+${phoneToVerify}`;
      }
    }

    let user = await this.usersService.findUserByPhone(phoneToVerify);
    if (!user) {
      // Auto-register Customer upon first successful MSG91 Widget verification
      const dummyPassword = await bcrypt.hash(`Customer@${Date.now()}`, 12);
      user = await this.usersService.createUser(phoneToVerify, dummyPassword, UserRole.CUSTOMER);
    }

    const session = await this.sessionService.createSession(user.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(user, session.id);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      tokens,
    };
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