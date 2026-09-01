import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OtpService } from './otp.service';

@ApiTags('OTP')
@ApiBearerAuth()
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}
}
