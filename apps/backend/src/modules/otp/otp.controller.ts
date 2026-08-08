import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';
import { Public } from '../auth/decorators/public.decorator';

import { SendDeliveryOtpDto } from './dto/send-delivery-otp.dto';
import { VerifyDeliveryOtpDto } from './dto/verify-delivery-otp.dto';

@Controller('otp')
export class OtpController {
  constructor(
    private readonly otpService: OtpService,
  ) {}

  @Public()
  @Post('delivery/send')
  sendDeliveryOtp(
    @Body() dto: SendDeliveryOtpDto,
  ) {
    return this.otpService.sendDeliveryOtp(
      dto.orderId,
    );
  }

  @Public()
  @Post('delivery/verify')
  verifyDeliveryOtp(
    @Body() dto: VerifyDeliveryOtpDto,
  ) {
    return this.otpService.verifyDeliveryOtp(
      dto.orderId,
      dto.otp,
    );
  }
}