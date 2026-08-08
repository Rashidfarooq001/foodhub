import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';

import { VerifyWidgetDto } from './dto/verify-widget.dto';
import { SendDeliveryOtpDto } from './dto/send-delivery-otp.dto';
import { VerifyDeliveryOtpDto } from './dto/verify-delivery-otp.dto';

@Controller('otp')
export class OtpController {
  constructor(
    private readonly otpService: OtpService,
  ) {}

  @Post('widget/verify')
  verifyWidget(
    @Body() dto: VerifyWidgetDto,
  ) {
    return this.otpService.verifyAccessToken(
      dto.accessToken,
    );
  }

  @Post('delivery/send')
  sendDeliveryOtp(
    @Body() dto: SendDeliveryOtpDto,
  ) {
    return this.otpService.sendDeliveryOtp(
      dto.orderId,
    );
  }

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