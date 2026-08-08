import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OtpService } from './otp.service';

import { SendDeliveryOtpDto } from './dto/send-delivery-otp.dto';
import { VerifyDeliveryOtpDto } from './dto/verify-delivery-otp.dto';

@ApiTags('OTP')
@ApiBearerAuth()
@Controller('otp')
export class OtpController {
  constructor(
    private readonly otpService: OtpService,
  ) {}

  @ApiOperation({ summary: 'Generate and send delivery OTP code for active order handoff' })
  @Post('delivery/send')
  sendDeliveryOtp(
    @Body() dto: SendDeliveryOtpDto,
  ) {
    return this.otpService.sendDeliveryOtp(
      dto.orderId,
    );
  }

  @ApiOperation({ summary: 'Verify delivery OTP code and mark order as DELIVERED' })
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