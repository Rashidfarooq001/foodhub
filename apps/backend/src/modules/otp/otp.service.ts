import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
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
    const formattedPhone = phone.startsWith('+') ? phone : (phone.length === 10 ? `+91${phone}` : `+${phone}`);
    const cleanMobile = formattedPhone.replace(/\D/g, '');

    // Check cooldown
    const existingOtp = await this.prisma.otp.findFirst({
      where: { phone: formattedPhone, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (existingOtp) {
      const timeDiffSec = (Date.now() - existingOtp.createdAt.getTime()) / 1000;
      if (timeDiffSec < this.OTP_COOLDOWN_SEC) {
        const remainingCooldown = Math.ceil(this.OTP_COOLDOWN_SEC - timeDiffSec);
        throw new BadRequestException(`Please wait ${remainingCooldown} seconds before requesting another OTP`);
      }
    }

    const authKey = this.config.get<string>('MSG91_AUTH_KEY') || process.env.MSG91_AUTH_KEY;
    const templateId = this.config.get<string>('MSG91_TEMPLATE_ID') || process.env.MSG91_TEMPLATE_ID || '669145dcd640490b4d4cf5f2';
    const isDevOrTest = process.env.NODE_ENV !== 'production';

    // Generate local 4-digit OTP for DB record & dev fallback
    const rawOtp = isDevOrTest ? '4819' : Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINS * 60 * 1000);

    await this.prisma.otp.create({
      data: {
        phone: formattedPhone,
        otpHash,
        expiresAt,
      },
    });

    // Call official MSG91 Send OTP REST API if authKey is present
    if (authKey && authKey !== 'dummy_auth_key') {
      try {
        const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${cleanMobile}&authkey=${authKey}`;
        const response = await firstValueFrom(
          this.http.post(
            url,
            { template_id: templateId, mobile: cleanMobile },
            {
              headers: {
                'Content-Type': 'application/json',
                authkey: authKey,
              },
            },
          ),
        );
        this.logger.log(`[MSG91 REST API] Send OTP response: ${JSON.stringify(response.data)}`);
      } catch (err: any) {
        this.logger.error(`[MSG91 REST API Error] ${err?.response?.data?.message || err.message}`);
        if (!isDevOrTest) {
          throw new BadRequestException(err?.response?.data?.message || 'Failed to send OTP via MSG91 SMS gateway');
        }
      }
    } else {
      this.logger.log(`[Dev SMS Suppressed] Generated OTP for ${formattedPhone}: ${rawOtp}`);
    }

    return {
      message: 'OTP sent successfully',
      cooldownSec: this.OTP_COOLDOWN_SEC,
      ...(isDevOrTest ? { otp: rawOtp } : {}),
    };
  }

  async verifyOtp(phone: string, rawOtp: string): Promise<boolean> {
    const formattedPhone = phone.startsWith('+') ? phone : (phone.length === 10 ? `+91${phone}` : `+${phone}`);
    const cleanMobile = formattedPhone.replace(/\D/g, '');

    const authKey = this.config.get<string>('MSG91_AUTH_KEY') || process.env.MSG91_AUTH_KEY;
    const isDevOrTest = process.env.NODE_ENV !== 'production';

    // 1. Attempt MSG91 REST API verification if live authKey exists
    if (authKey && authKey !== 'dummy_auth_key') {
      try {
        const url = `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(rawOtp)}&mobile=${encodeURIComponent(cleanMobile)}`;
        const response = await firstValueFrom(
          this.http.get(url, {
            headers: {
              authkey: authKey,
            },
          }),
        );

        const resData = response.data;
        this.logger.log(`[MSG91 REST API Verify] Response: ${JSON.stringify(resData)}`);

        if (resData.type === 'success' || resData.message?.toLowerCase().includes('success')) {
          return true;
        } else if (resData.type === 'error') {
          throw new BadRequestException(resData.message || 'Invalid or expired OTP code');
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        this.logger.error(`[MSG91 REST API Verify Error] ${err?.response?.data?.message || err.message}`);
        if (!isDevOrTest) {
          throw new BadRequestException(err?.response?.data?.message || 'Invalid or expired OTP code');
        }
      }
    }

    // 2. Local DB verification fallback (for dev/tests or local OTPs)
    const otpRecord = await this.prisma.otp.findFirst({
      where: { phone: formattedPhone, isUsed: false },
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

    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    return true;
  }
}