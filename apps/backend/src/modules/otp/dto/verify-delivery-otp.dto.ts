import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyDeliveryOtpDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({ description: 'Delivery OTP' })
  @IsString()
  @IsNotEmpty()
  otp!: string;
}
