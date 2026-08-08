import { Body, Controller, Post, Req } from '@nestjs/common';
import { OtpService } from './otp.service';
import { Request } from 'express';

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
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.otpService.verifyAccessToken(
      dto.accessToken,
      ip,
      ua,
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