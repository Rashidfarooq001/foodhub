import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiPropertyOptional({ example: '+919876543210', description: 'Phone number (for local/dev OTP flow)' })
  @IsOptional()
  @IsString()
  @Matches(/^(\+91|91)?[6-9]\d{9}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional({ example: '4819', description: '4-digit SMS OTP (for local/dev OTP flow)' })
  @IsOptional()
  @IsString()
  @Length(4, 4, { message: 'OTP must be exactly 4 digits' })
  otp?: string;

  @ApiPropertyOptional({ example: 'msg91_widget_access_token_xyz', description: 'MSG91 Widget Access Token (for widget flow)' })
  @IsOptional()
  @IsString()
  accessToken?: string;
}
