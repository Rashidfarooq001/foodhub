import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiPropertyOptional({ example: 'reset_token_uuid', description: 'Single-use short-lived reset authorization token' })
  @IsOptional()
  @IsString()
  resetToken?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Registered phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'user@foodhub.com', description: 'Registered email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '4819', description: 'SMS OTP code if legacy flow used' })
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional({ description: 'MSG91 Widget access token' })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiProperty({ example: 'NewPass123!', description: 'New password (min 6 characters)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword!: string;

  @ApiPropertyOptional({ example: 'NewPass123!', description: 'Confirm new password' })
  @IsOptional()
  @IsString()
  confirmPassword?: string;
}
