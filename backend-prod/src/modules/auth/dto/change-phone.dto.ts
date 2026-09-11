import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestPhoneChangeOtpDto {
  @ApiProperty({ example: 'Pass@12345', description: 'Current password for identity confirmation' })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: '+919876543210', description: 'New 10-digit mobile number' })
  @IsNotEmpty()
  @IsString()
  newPhone: string;
}

export class VerifyPhoneChangeOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'New 10-digit mobile number' })
  @IsNotEmpty()
  @IsString()
  newPhone: string;

  @ApiPropertyOptional({ example: '4819', description: '4-digit OTP code sent to new phone' })
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional({ example: 'msg91_token_string', description: 'MSG91 widget access token' })
  @IsOptional()
  @IsString()
  accessToken?: string;
}
