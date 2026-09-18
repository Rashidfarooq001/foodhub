import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyResetTokenDto {
  @ApiPropertyOptional({ description: 'MSG91 Widget access token' })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiProperty({ example: '+919876543210', description: 'Registered mobile number' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiPropertyOptional({
    example: '481937',
    description: '6-digit SMS OTP code if manual verification used',
  })
  @IsOptional()
  @IsString()
  otp?: string;
}
