import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({ example: '+919876543210', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'owner@foodhub.com', description: 'Email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'Pass@12345', description: 'Account password' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '4819', description: 'Optional 2FA OTP code for Admin roles' })
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional({
    example: 'CUSTOMER',
    description:
      'Expected account role. When set, login is rejected if the account role does not match.',
  })
  @IsOptional()
  @IsString()
  targetRole?: string;
}
