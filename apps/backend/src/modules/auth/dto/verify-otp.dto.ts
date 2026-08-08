import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class VerifyOtpDto {
  @ApiPropertyOptional({ example: '+919876543210', description: 'User mobile number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '4819', description: '4-digit SMS OTP code' })
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional({ description: 'MSG91 Widget access token' })
  @IsOptional()
  @IsString()
  accessToken?: string;
}
