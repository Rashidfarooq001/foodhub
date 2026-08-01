import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OtpService } from './otp.service';

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('verify-widget')
  @ApiOperation({ summary: 'Verify MSG91 Widget Access Token' })
  async verifyWidget(
    @Body('accessToken') accessToken: string,
  ) {
    return this.otpService.verifyMsg91WidgetToken(accessToken);
  }
}