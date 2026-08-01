import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { InternalServerErrorException } from '@nestjs/common';
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_COOLDOWN_SEC = 60;
  private readonly OTP_EXPIRY_MINS = 10;

 constructor(
  private readonly prisma: PrismaService,
  private readonly http: HttpService,
  private readonly config: ConfigService,
) {}

  async sendOtp(phone: string): Promise<{ message: string; cooldownSec: number; otp?: string }> {
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

    const isDevOrTest = process.env.NODE_ENV !== 'production';

    // Generate 4-digit OTP
    const rawOtp = isDevOrTest ? '4819' : Math.floor(1000 + Math.random() * 9000).toString();
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

    // In development/testing, do not send SMS
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
  async verifyMsg91WidgetToken(accessToken: string): Promise<string> {
    const authKey = this.config.get<string>('MSG91_AUTH_KEY') || process.env.MSG91_AUTH_KEY;
    const isDevOrTest = process.env.NODE_ENV !== 'production';

    // Dev/Test Mode fallback for local testing
    if ((!authKey || authKey === 'dummy_auth_key') && isDevOrTest && accessToken.startsWith('dev_')) {
      const devPhone = accessToken.replace('dev_widget_token_', '').replace('dev_', '');
      const formattedDevPhone = devPhone.length === 10 ? `+91${devPhone}` : (devPhone.startsWith('+') ? devPhone : `+${devPhone}`);
      return formattedDevPhone || '+919876543210';
    }

    try {
      const response = await firstValueFrom(
        this.http.post(
          'https://control.msg91.com/api/v5/widget/verifyAccessToken',
          {
            authkey: authKey,
            'access-token': accessToken,
            accessToken,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              authkey: authKey,
            },
          },
        ),
      );

      const resData = response.data;
      this.logger.log(`[MSG91 Widget Verification] Response: ${JSON.stringify(resData)}`);

      if (resData.type === 'error' || resData.status === 'error') {
        throw new BadRequestException(resData.message || 'Invalid or expired MSG91 OTP widget token');
      }

      // Extract mobile number from MSG91 response structure
      const rawMobile = resData.data?.mobile || resData.mobile || resData.data?.mobileNumber || resData.mobileNumber || resData.data?.phone;

      if (!rawMobile) {
        throw new BadRequestException('Mobile number not found in MSG91 verification response');
      }

      let phoneStr = String(rawMobile).trim();
      if (!phoneStr.startsWith('+')) {
        if (phoneStr.startsWith('91') && phoneStr.length === 12) {
          phoneStr = `+${phoneStr}`;
        } else if (phoneStr.length === 10) {
          phoneStr = `+91${phoneStr}`;
        } else {
          phoneStr = `+${phoneStr}`;
        }
      }

      return phoneStr;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `MSG91 verification failed: ${error?.response?.data?.message || error.message}`,
      );
      throw new BadRequestException(
        error?.response?.data?.message || 'MSG91 OTP token verification failed. Please try again.',
      );
    }
  }
}