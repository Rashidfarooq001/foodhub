import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'User mobile number in E.164 or 10-digit format' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Matches(/^(\+91|91)?[6-9]\d{9}$/, { message: 'Invalid phone number format' })
  phone!: string;

  @ApiProperty({ example: '4819', description: '4-digit SMS OTP code' })
  @IsNotEmpty({ message: 'OTP is required' })
  @IsString()
  @Length(4, 4, { message: 'OTP must be exactly 4 digits' })
  otp!: string;
}
