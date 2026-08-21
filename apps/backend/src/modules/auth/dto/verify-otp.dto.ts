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

  @ApiPropertyOptional({ example: 'CUSTOMER', description: 'Target application/role requirement: CUSTOMER | HOTEL | DELIVERY | ADMIN' })
  @IsOptional()
  @IsString()
  targetRole?: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma', description: 'Signup full name if registering via verified OTP' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '123 MG Road, Indiranagar, Bengaluru', description: 'Signup delivery address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'CustomerPass123!', description: 'Signup password (hashed upon verification)' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: true, description: 'Explicit acceptance of Terms & Conditions and Privacy Policy' })
  @IsOptional()
  termsAccepted?: boolean;
}
