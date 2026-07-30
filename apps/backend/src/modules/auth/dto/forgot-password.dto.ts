import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: '+919876543210', description: 'Phone number to receive reset OTP' })
  @IsNotEmpty()
  @IsString()
  phone: string;
}
