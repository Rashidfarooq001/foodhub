import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

@Module({
  imports: [
    HttpModule,
  ],
  controllers: [
    OtpController,
  ],
  providers: [
    OtpService,
  ],
  exports: [
    OtpService,
  ],
})
export class OtpModule {}