import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'Phone number' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(\+91|91)?[6-9]\d{9}$/, { message: 'Invalid phone number format' })
  phone: string;

  @ApiProperty({ example: '4819', description: '4-digit SMS OTP' })
  @IsNotEmpty()
  @IsString()
  @Length(4, 4, { message: 'OTP must be exactly 4 digits' })
  otp: string;
}
